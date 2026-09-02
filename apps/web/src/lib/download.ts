export function safeDownloadName(name: string, maxLength = 100) {
  const base = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, maxLength);
  return base.trim() || "studypilot";
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Leave time for the browser to begin its download before releasing the buffer.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
