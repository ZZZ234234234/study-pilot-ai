const {
  app,
  BrowserWindow,
  dialog,
  utilityProcess,
  session,
} = require("electron");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");
const fs = require("node:fs/promises");
const smokeArgument = process.argv.find((arg) =>
  arg.startsWith("--smoke-directory="),
);
const smokeDirectory = smokeArgument
  ? path.resolve(smokeArgument.slice("--smoke-directory=".length))
  : null;
if (smokeDirectory) app.setPath("userData", smokeDirectory);

let window;
let stopping = false;
let exitCode = 0;
let databaseProcess;
const children = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function monitor(child, name) {
  children.push(child);
  child.once("error", () => fail(`${name} 无法启动。`));
  child.once("exit", () => {
    if (!stopping) fail(`${name} 已意外退出。请重新打开应用。`);
  });
  return child;
}

async function shutdown() {
  if (stopping) return;
  stopping = true;
  // Worker first, then HTTP services, then database. Keep user files on disk.
  for (const child of [...children].reverse()) {
    const exited = new Promise((resolve) => child.once("exit", resolve));
    if (child === databaseProcess) child.postMessage("shutdown");
    else child.kill();
    await Promise.race([exited, sleep(5000).then(() => child.kill())]);
  }
  app.exit(exitCode);
}

function fail(message) {
  if (stopping) return;
  exitCode = 1;
  if (smokeDirectory) {
    void fs
      .writeFile(path.join(smokeDirectory, "failure.txt"), message)
      .finally(shutdown);
    return;
  }
  dialog.showErrorBox(
    "StudyPilot AI 启动失败",
    `${message}\n学习资料不会被删除。`,
  );
  void shutdown();
}

async function waitFor(check, name) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (stopping) throw new Error("启动已取消");
    try {
      if (await check()) return;
    } catch {
      /* Service still starting. */
    }
    await sleep(500);
  }
  throw new Error(`${name} 启动超时`);
}

async function start() {
  const bundle = app.isPackaged
    ? path.join(process.resourcesPath, "bundle")
    : path.join(__dirname, "bundle");
  const data = path.join(app.getPath("userData"), "data");
  await fs.mkdir(data, { recursive: true });
  const dbPort = await freePort();
  let apiPort = await freePort();
  while (apiPort === dbPort) apiPort = await freePort();
  let webPort = await freePort();
  while ([apiPort, dbPort].includes(webPort)) webPort = await freePort();
  const origin = `http://127.0.0.1:${webPort}`;
  // Explicit environment prevents accidental reuse of development API keys/configuration.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(SYSTEMROOT|WINDIR|TEMP|TMP|PATH|APPDATA|LOCALAPPDATA|USERPROFILE|COMSPEC)$/i.test(
        key,
      ),
    ),
  );
  Object.assign(env, {
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    APP_ENV: "development",
    AI_PROVIDER: "demo",
    DATA_DIR: data,
    STUDYPILOT_RESOURCE_ROOT: bundle,
    DEV_DB: "true",
    DEV_DB_PORT: String(dbPort),
    DATABASE_URL: `postgresql+psycopg://postgres@127.0.0.1:${dbPort}/postgres?sslmode=disable`,
    ALLOWED_ORIGINS: origin,
    COOKIE_SECURE: "false",
    HOSTNAME: "127.0.0.1",
    PORT: String(webPort),
    API_INTERNAL_URL: `http://127.0.0.1:${apiPort}`,
  });
  window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "StudyPilot AI",
    backgroundColor: "#f6f7f2",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== origin) event.preventDefault();
  });
  session.defaultSession.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  await window.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(
        '<html lang="zh-CN"><meta charset="utf-8"><body style="margin:0;background:#f6f7f2;color:#23372b;font:18px system-ui;display:grid;place-content:center;height:100vh"><h1>StudyPilot AI</h1><p>正在打开你的学习空间…</p><small>首次启动可能需要一点时间，请稍候。</small></body></html>',
      ),
  );
  databaseProcess = monitor(
    utilityProcess.fork(path.join(bundle, "db.mjs"), [], { env, cwd: bundle }),
    "本地数据库",
  );
  await waitFor(
    () =>
      new Promise((resolve) => {
        const socket = net.connect(dbPort, "127.0.0.1");
        socket.once("connect", () => {
          socket.destroy();
          resolve(true);
        });
        socket.once("error", () => {
          socket.destroy();
          resolve(false);
        });
        socket.setTimeout(500, () => {
          socket.destroy();
          resolve(false);
        });
      }),
    "数据库",
  );
  const backend = path.join(
    bundle,
    "backend",
    process.platform === "win32"
      ? "studypilot-backend.exe"
      : "studypilot-backend",
  );
  await new Promise((resolve, reject) => {
    const migrate = spawn(backend, ["migrate"], {
      env,
      cwd: bundle,
      windowsHide: true,
      stdio: "ignore",
    });
    children.push(migrate);
    const timer = setTimeout(() => {
      migrate.kill();
      reject(new Error("数据库升级超时"));
    }, 120000);
    migrate.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    migrate.once("exit", (code) => {
      children.splice(children.indexOf(migrate), 1);
      clearTimeout(timer);
      code === 0 ? resolve() : reject(new Error("数据库升级失败"));
    });
  });
  monitor(
    spawn(backend, ["api", "--port", String(apiPort)], {
      env,
      cwd: bundle,
      windowsHide: true,
      stdio: "ignore",
    }),
    "PDF 服务",
  );
  await waitFor(
    async () =>
      (
        await fetch(`${env.API_INTERNAL_URL}/openapi.json`, {
          signal: AbortSignal.timeout(1000),
        })
      ).ok,
    "PDF 服务",
  );
  monitor(
    utilityProcess.fork(path.join(bundle, "web/apps/web/server.js"), [], {
      env,
      cwd: bundle,
    }),
    "阅读界面",
  );
  await waitFor(
    async () => (await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok,
    "阅读界面",
  );
  monitor(
    spawn(backend, ["worker"], {
      env,
      cwd: bundle,
      windowsHide: true,
      stdio: "ignore",
    }),
    "PDF 后台处理",
  );
  await window.loadURL(`${origin}/app`);
  if (smokeDirectory) {
    await require("./smoke.cjs")(origin, smokeDirectory);
    await shutdown();
  }
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });
  app.on("before-quit", (event) => {
    if (!stopping) {
      event.preventDefault();
      void shutdown();
    }
  });
  app.on("window-all-closed", () => void shutdown());
  app
    .whenReady()
    .then(start)
    .catch((error) => fail(error.message));
}
