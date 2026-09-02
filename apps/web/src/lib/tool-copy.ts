// Interface text only. User documents, terminology preferences and translations are not localized here.
export const toolCopy: Record<string, string> = {
  "原文已解析，但知识索引未完成。仍可阅读与翻译；其他学习功能需修复模型配置后重新处理。":
    "Source text is ready, but knowledge indexing failed. Reading and translation remain available; fix the model configuration and reprocess for other study tools.",
  翻译与转换的数据去向: "Translation and conversion data",
  "对照翻译会在你确认后，将选中页原文和术语偏好发送给已配置的聊天模型。译文只保留在当前阅读会话，刷新或离开文档前请导出；已发出的请求无法撤回，可能产生模型费用。学习工具箱中的格式转换在浏览器本地进行，不上传转换文件，也不调用 AI。":
    "After your confirmation, translation sends selected source pages and terminology to your configured chat model. Translations last only for the current reading session: export before refreshing or leaving the document. Requests already sent cannot be recalled and may incur usage charges. File conversions run locally in the browser, without uploading conversion files or calling AI.",
  学习工具箱: "Study toolkit",
  对照翻译: "Translation",
  论文对照翻译: "Read with translation",
  "原文不改写，译文逐段对照。":
    "Keep the original. Compare the translation, passage by passage.",
  "AI 译文可能有误。公式、表格和双栏阅读顺序请对照原 PDF 核实；这不是原版排版翻译。":
    "AI translations may be wrong. Check formulas, tables and column order against the PDF. Original page layout is not reproduced.",
  "翻译需要真实聊天模型，演示模式不会生成假译文。无需嵌入模型或重新建立索引。":
    "Connect a real chat model to translate. Demo mode never simulates translations. No embedding model or re-indexing is needed.",
  "正在读取模型配置…": "Loading model configuration…",
  翻译选项: "Translation options",
  目标语言: "Translate into",
  简体中文译文: "Simplified Chinese",
  英文译文: "English",
  译文风格: "Translation style",
  学术严谨: "Academic precision",
  自然易读: "Clear and natural",
  "术语偏好（可选）": "Terminology preferences (optional)",
  "每行一组，例如：backpropagation = 反向传播":
    "One pair per line, e.g. BP = backpropagation",
  翻译范围: "Pages to translate",
  "当前阅读页（第 {0} 页）": "Current page ({0})",
  "指定页码，每批最多 10 页": "Page range, up to 10 per batch",
  起始页: "First page",
  结束页: "Last page",
  "我确认将选中页原文和术语发送到已配置的模型；远程服务可能计费。":
    "Send selected source pages and terminology to my configured model. Remote services may charge for usage.",
  翻译选中页: "Translate selected pages",
  停止后续页: "Stop after this page",
  导出对照文本: "Export bilingual text",
  "相同选项下跳过已完成页。译文仅保留在本次阅读中，刷新前请导出；停止不会撤回已发送的模型请求。":
    "Completed pages are reused with the same options. Export before refreshing: translations last for this reading session only. Stopping does not recall a request already sent.",
  "已完成 {0} / {1} 页": "Completed {0} / {1} pages",
  当前页完成后停止: "Stopping after the current page",
  已翻译页码: "Translated pages",
  查看这一段原文: "Show original passage",
  "选择语言和页码，开始读懂这一页。已完成的页面会显示在这里。":
    "Choose a language and pages to begin. Completed translations will appear here.",
  "请选择文档范围内的有效页码。":
    "Choose a valid page range within this document.",
  "每批最多翻译 10 页，请分批处理长论文。":
    "Translate up to 10 pages per batch. Split longer papers into batches.",
  "翻译需要真实聊天模型。请在模型设置中完成配置并重启服务；无需重新建立索引。":
    "Translation needs a real chat model. Configure it in Settings and restart the services; no re-indexing is required.",
  "这一页没有可提取的文字。扫描页需要先进行 OCR，当前版本不提供文字识别。":
    "This page has no extractable text. Scanned pages need OCR, which is not included.",
  "这一页超过 18000 字符的翻译上限，请选择文字较少的页面。":
    "This page exceeds the 18,000-character translation limit. Choose a shorter page.",
  "模型返回了不完整或错位的译文，未接受这一页结果。已完成的其他页面仍可导出，请稍后重试。":
    "The model returned missing or mismatched passages. This page was not accepted. Other completed pages can still be exported; retry later.",
  "图片转 PDF": "Images to PDF",
  "将 PNG、JPG、WebP 按顺序合成一份 PDF。":
    "Combine PNG, JPG and WebP images into one PDF, in your chosen order.",
  "PDF 转图片": "PDF to images",
  "将选中页导出为图片，多页自动打包 ZIP。":
    "Export selected pages as images. Multiple pages are bundled into a ZIP.",
  图片格式互转: "Convert images",
  "PNG、JPG、WebP 互转；保留尺寸，JPG 透明处填白。":
    "Convert between PNG, JPG and WebP. Keep dimensions; transparent areas become white in JPG.",
  "PDF 提取文字": "PDF to text",
  "提取可复制文字并下载 TXT，不改变原始 PDF。":
    "Extract selectable text into a TXT file without changing the PDF.",
  "资料处理，不必来回切换。": "Your files. Fewer tools to juggle.",
  "转换文件留在浏览器中，不需要 AI 密钥。":
    "Conversions stay in your browser. No AI key required.",
  选择转换工具: "Choose a conversion tool",
  论文中英翻译: "Chinese / English translation",
  "打开资料，选择“对照翻译”": "Open a document and select Translation",
  "选择文件，或拖到这里": "Choose files or drop them here",
  "PNG / JPG / WebP，每批最多 20 张":
    "PNG / JPG / WebP, up to 20 images per batch",
  "选择一份 PDF，最多 300 页": "Choose one PDF, up to 300 pages",
  "单个文件 20 MB 以内，每批总计 50 MB 以内":
    "Up to 20 MB per file, 50 MB total per batch",
  选择待转换文件: "Choose files to convert",
  "上移文件 {0}": "Move {0} up",
  "下移文件 {0}": "Move {0} down",
  "移除文件 {0}": "Remove {0}",
  输出选项: "Output options",
  纸张尺寸: "Page size",
  "A4 自适应横竖版，保留留白": "A4, automatic orientation with margins",
  "跟随图片比例，不裁切": "Match image aspect ratio, no cropping",
  输出格式: "Output format",
  输出清晰度: "Output resolution",
  页码范围: "Page range",
  "例如 1-3,5；留空表示全部页": "For example 1-3,5; leave blank for all pages",
  "转图片每批最多 20 页，单页最多 2400 万像素；输出总计不超过 100 MB。":
    "Up to 20 pages per image export and 24 megapixels per page; 100 MB total output limit.",
  "仅提取已有文本，不提供 OCR；双栏、公式和表格顺序可能需要人工整理。":
    "Extracts existing text, without OCR. Columns, formulas and tables may need manual cleanup.",
  "保持图片比例。动画图片仅取首帧，格式互转会重新编码；不保证保留元数据或色彩配置。":
    "Aspect ratios are preserved. Animated images use the first frame. Conversion re-encodes images; metadata and color profiles may not be preserved.",
  开始转换: "Convert files",
  取消转换: "Cancel conversion",
  "已处理 {0} / {1}": "Processed {0} / {1}",
  "正在准备转换…": "Preparing conversion…",
  "转换已取消，原文件没有改变。":
    "Conversion cancelled. Original files are unchanged.",
  "转换完成，可以下载了。": "Converted and ready to download.",
  "共 {0} 项": "{0} items",
  下载文件: "Download file",
  "文件转换在本机进行，刷新页面后需重新选择文件。图片转 PDF 不会自动让扫描文字变成可搜索文本；暂不支持 Word、PPT 与 PDF 的版式互转。":
    "Conversion runs locally. Select files again after refreshing. Images to PDF does not make scanned text searchable. Layout-preserving Word/PPT conversions are not supported.",
  "请先选择文件。": "Choose files first.",
  "图片每批最多 20 张；PDF 每次选择一份。":
    "Choose up to 20 images, or one PDF at a time.",
  "文件格式不符合当前工具要求。":
    "This file format does not match the selected tool.",
  "单个文件不能超过 20 MB，每批总大小不能超过 50 MB。":
    "Files must be nonempty, up to 20 MB each and 50 MB per batch.",
  "转换工具最多处理 300 页 PDF。":
    "The converter supports PDFs with up to 300 pages.",
  "页码格式应为 1-3,5，且不能超出 PDF 范围。":
    "Use page ranges such as 1-3,5, within the PDF's page count.",
  "PDF 转图片每批最多 20 页，请缩小页码范围。":
    "Export up to 20 image pages per batch. Choose a smaller range.",
  "图片分辨率过大，请先缩小图片或降低输出清晰度。":
    "Image resolution is too large. Resize the image or lower the output resolution.",
  "图片内容损坏或不受支持，请重新导出 PNG、JPG 或 WebP。":
    "The image is damaged or unsupported. Export a fresh PNG, JPG or WebP.",
  "输出超过 100 MB，请减少文件或页数。":
    "Output exceeds 100 MB. Reduce the number of files or pages.",
  "浏览器不支持这个输出格式，请改选 PNG 或 JPG。":
    "Your browser does not support this output format. Try PNG or JPG.",
  "无法创建绘图画布，请换用支持 Canvas 的浏览器。":
    "Canvas could not be created. Use a browser with Canvas support.",
  "文件内容不是有效的 PDF。": "This file does not contain a valid PDF.",
  "请选择有效的输出清晰度。": "Choose a valid output resolution.",
  "没有提取到文字，扫描件需要 OCR；本工具不包含文字识别。":
    "No text was extracted. Scanned pages need OCR, which is not included.",
  "PDF 有密码保护，请先解锁后再转换。":
    "This PDF is password-protected. Unlock it before converting.",
};
