import type { Document, KnowledgePoint, StudyTask } from "./types";

export const documentStatus: Record<Document["status"], string> = {
  queued: "等待处理",
  parsing: "解析中",
  indexing: "建立索引",
  ready: "已就绪",
  failed: "处理失败",
};
export const taskKind: Record<StudyTask["kind"], string> = {
  learn: "初次学习",
  review: "间隔复习",
  focus: "重点回顾",
  sprint: "综合回顾",
};
export const importanceLabel: Record<KnowledgePoint["importance"], string> = {
  high: "核心重点",
  medium: "重要知识",
  low: "拓展了解",
};
export const difficultyLabel: Record<KnowledgePoint["difficulty"], string> = {
  high: "进阶",
  medium: "适中",
  low: "基础",
};
export const reviewGrade = {
  again: "没记住",
  hard: "有点难",
  good: "记住了",
  easy: "很轻松",
};

// Stable API codes also localize feedback from an older English-speaking server.
export const errorMessages: Record<string, string> = {
  provider_required:
    "PDF 可以继续阅读和搜索。问答等 AI 功能需要先在“模型设置”中配置可用的模型服务，再重新处理文档。",
  provider_auth:
    "模型服务未通过身份验证，请检查服务端配置的 API 密钥及使用权限。",
  provider_error:
    "模型服务拒绝了请求，请检查模型名称、接口地址、兼容性和可用额度。",
  provider_timeout:
    "模型响应超时，请稍后重试，或选择较小的文档与响应更快的模型。",
  provider_unavailable: "暂时无法连接模型服务，请检查服务端的接口地址和网络。",
  provider_busy: "模型服务繁忙，请稍后重试。",
  embedding_invalid:
    "嵌入模型返回的数据无效，请使用兼容且不超过 4096 维的嵌入模型。",
  invalid_ai_output:
    "模型返回的数据格式不正确，请选择支持 JSON 输出的模型后重试。",
  invalid_knowledge:
    "知识点生成结果格式不正确，请检查模型是否支持 JSON 输出后重试。",
  invalid_quiz: "测验生成结果不完整或格式不正确，请重试或减少题目数量。",
  invalid_citations: "回答没有提供可核对的有效引用，请重新提问。",
  reindex_required: "嵌入模型已更换，请重新处理这份文档，更新知识索引。",
  session_required:
    "当前学习空间的会话已失效，请刷新页面。匿名空间不支持账号找回。",
  not_found: "当前学习空间中找不到这项内容，可能已被删除，或不属于此浏览器。",
  not_ready: "文档仍在处理，请完成后再使用这项功能。",
  processing: "文档正在处理中，请完成后再进行此操作。",
  knowledge_required: "请先生成知识点，再创建复习计划、闪卡或测验。",
  already_reviewed: "这张卡片本轮已复习，请在下次计划日期继续。",
  already_submitted: "这份测验已经提交。想再练一次，可以创建新的测验。",
  document_limit: "学习空间的文档数量已达上限，请先删除不再需要的资料。",
  invalid_file_type: "仅支持 PDF 文件，请检查文件类型和扩展名。",
  file_too_large: "文件超过上传大小限制，请压缩或拆分后再上传。",
  invalid_pdf: "PDF 无法解析，请重新导出一份完整、未加密的 PDF 后重试。",
  encrypted_pdf: "这份 PDF 需要密码，请先解除密码保护再上传。",
  page_limit: "PDF 页数超出允许范围，请拆分为较小的文档。",
  text_limit: "PDF 文本量过大，请拆分后再上传。",
  ocr_required:
    "没有提取到可读文字。扫描版 PDF 需要先进行文字识别（OCR），当前版本尚未提供该功能。",
  file_missing: "存储中缺少原始 PDF，请重新上传文档。",
  sample_missing: "当前部署缺少样例 PDF，请联系部署者补齐样例文件。",
  invalid_exam_date: "请选择从明天起、一年以内的目标日期。",
  insufficient_capacity:
    "现有时间不足以完成学习和间隔复习，请增加学习时长、每周天数，或推迟目标日期。",
  validation_error:
    "填写内容不符合要求，请检查日期、时长、题目数量及其他必填项。",
  csrf: "请求校验未通过，请刷新页面后重试。",
  origin_denied: "当前网站地址未被后端允许，请检查部署的访问域名配置。",
  rate_limited: "操作有些频繁，请等待一分钟后再试。",
  database_unavailable: "暂时无法连接数据库，请稍后重试或检查后端服务。",
  api_unavailable: "暂时无法连接后端，请确认 API 和 PDF 后台处理服务已经启动。",
  internal_error: "服务暂时无法完成操作，请稍后重试或检查服务运行状态。",
  network: "网络请求未能完成，请检查连接后重试。",
};

export function chineseErrorMessage(
  message: string | undefined,
  code?: string,
): string {
  if (code && Object.hasOwn(errorMessages, code)) return errorMessages[code];
  if (message && /[\u3400-\u9fff]/.test(message)) return message;
  if (message && /password/i.test(message)) return errorMessages.encrypted_pdf;
  if (message && /invalid pdf|pdf could not be parsed/i.test(message))
    return errorMessages.invalid_pdf;
  if (message && /no readable text|scanned pdf|ocr before/i.test(message))
    return errorMessages.ocr_required;
  if (message && /fetch|network|connection/i.test(message))
    return errorMessages.network;
  return "操作暂时未完成，请稍后重试。";
}
