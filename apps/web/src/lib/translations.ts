import { toolCopy } from "./tool-copy";
// Chinese source copy is the stable lookup key. Only interface copy belongs here.
export const english: Record<string, string> = {
  ...toolCopy,
  收起导航: "Collapse navigation",
  展开导航: "Expand navigation",
  全屏阅读: "Fullscreen reader",
  退出全屏: "Exit fullscreen",
  资料阅读工作区: "Document reading workspace",
  隐藏助手: "Hide assistant",
  打开学习助手: "Open study assistant",
  隐藏学习助手: "Hide study assistant",
  拖动分隔线调整阅读宽度: "Drag the divider to resize the reading area",
  移动助手窗口: "Move assistant window",
  "拖动标题栏移动，方向键微调":
    "Drag the title bar to move; use arrow keys for precise adjustments",
  重置窗口位置: "Reset window position",
  停靠右侧: "Dock on the right",
  设为悬浮窗: "Float assistant",
  "拖动标题栏移动 · 右下角调整大小":
    "Drag the title bar · Resize from the corner",
  调整助手窗口大小: "Resize assistant window",
  "拖动调整大小，方向键微调":
    "Drag to resize; use arrow keys for precise adjustments",
  适应宽度: "Fit to width",
  "PDF 阅读区域": "PDF reading area",
  "PDF 第 {0} 页，共 {1} 页；点击全屏阅读":
    "PDF page {0} of {1}; click to read fullscreen",
  点击页面可全屏阅读: "Click the page to read fullscreen",
  回答附原文依据: "Answers with sources",
  "100% 表示适应阅读区宽度": "100% fits the reading area width",
  等待处理: "Queued",
  解析中: "Parsing",
  重点回顾: "Focused review",
  核心重点: "Core concept",
  重要知识: "Important",
  拓展了解: "Further reading",
  进阶: "Advanced",
  适中: "Intermediate",
  基础: "Foundational",
  没记住: "Again",
  有点难: "Hard",
  记住了: "Good",
  很轻松: "Easy",
  "第 {0} 页": "Page {0}",
  "第 {0} 页 · 提取的原文": "Page {0} · Extracted text",
  "查看原文 · 第 {0} 页": "View source · Page {0}",
  "阅读原文 · 第 {0} 页": "Read source · Page {0}",
  "核对原文 · 第 {0} 页": "Check source · Page {0}",
  "第 {0} 题 ·": "Question {0} ·",
  "{0} 页": "{0} pages",
  "{0} 个知识点": "{0} knowledge points",
  "{0} 张今日待复习": "{0} due today",
  "{0} 张闪卡": "{0} cards",
  "{0} 道题": "{0} questions",
  "{0} 个知识点，每一个都能回到原文。":
    "{0} knowledge points, each connected to the source.",
  "{0} 张闪卡待复习": "{0} cards ready to review",
  "{0} 页原文": "{0} source pages",
  "{0} 分钟 / 天": "{0} min / day",
  "{0} 天 / 周": "{0} days / week",
  "{0} 天": "{0} days",
  设置: "Settings",
  "StudyPilot AI｜把资料读懂，把知识留下":
    "StudyPilot AI — Turn PDFs into structured knowledge",
  "开源 AI 学习助手：阅读 PDF、梳理知识点、制定复习计划，用带原文引用的问答帮助你真正理解资料。":
    "An open-source AI study workspace. Extract knowledge from PDFs, build a review plan, and ask questions grounded in the original pages.",
  "读懂资料，梳理知识，循序复习。": "Upload. Understand. Review. Ask.",
  跳到主要内容: "Skip to content",
  "404 / 页面未找到": "404 / A SMALL DETOUR",
  "这一页，暂时找不到了。": "This page isn’t in your notes.",
  "链接可能已失效。回到学习空间，继续刚才的思路吧。":
    "The link may have changed. Your next chapter is still waiting.",
  返回学习空间: "Back to learning",
  网站导航: "Website",
  功能介绍: "The workspace",
  如何使用: "How it works",
  开源说明: "Open source",
  开始学习: "Ready to learn",
  "开源，让知识更自由。": "OPEN SOURCE. OPEN POSSIBILITIES.",
  "把资料读懂，": "Turn PDFs into",
  "把知识留下。": "structured knowledge.",
  "阅读，不止于翻过最后一页。": "Your reading has a next chapter.",
  "从梳理知识到循序复习，在一个安静的空间里，把重要的内容真正学会。":
    "A thoughtful workspace to understand, remember, and connect the ideas that matter.",
  "查看 GitHub 源码": "View on GitHub",
  "阅读。": "Upload.",
  "理解。复习。提问。": "Understand. Review. Ask.",
  "体验内置样例，无需 AI 密钥。": "No AI key needed to explore.",
  少一点来回翻找: "LESS SCROLLING",
  "多一点真正理解。": "More understanding.",
  "让每一次好奇，都有迹可循。": "Built for the way curious minds work.",
  原文可查: "Your sources",
  知识成体系: "Your structure",
  数据由你掌握: "Your control",
  "01 / 更从容地学习": "01 / A CALMER WAY TO LEARN",
  "不只是一个聊天窗口。": "Not another chat window.",
  "而是一套学习路径。": "Your entire learning loop.",
  "阅读只是开始。让知识有条理，也让每一次复习都有方向。":
    "Reading is only the beginning. Give every idea a place to go—and a reason to come back.",
  "把零散内容，连成知识地图。": "See the bigger picture.",
  "按章节梳理概念，标记重点与难度。每个知识点，都能回到原文核对。":
    "Turn dense pages into a navigable knowledge tree. Chapters, concepts, importance, and difficulty—connected to the source.",
  神经网络: "Neural Networks",
  训练神经网络: "Training the network",
  损失函数与梯度下降: "Loss & gradient descent",
  反向传播: "Backpropagation",
  "第 3 页": "p. 3",
  "↗ 第 4 页": "↗ p. 4",
  "01 / 梳理知识点": "01 / KNOWLEDGE EXTRACTION",
  "回答有出处，理解有依据。": "Answers with receipts.",
  "带着问题阅读，沿着引用找到对应页。资料里没有依据时，助手会明确告诉你。":
    "Ask a question. Follow the citation back to the exact PDF page. No evidence? The assistant says so.",
  "“权重共享让同一组特征检测器在不同位置发挥作用。”（样例原文译意）":
    "“Weight sharing lets the same feature detector operate at different positions.”",
  神经网络入门: "NEURAL NETWORKS",
  "02 / 带原文引用的问答": "02 / SOURCE-GROUNDED Q&A",
  "不只学过，更能记住。": "Remember for longer.",
  "用可执行的计划、知识闪卡和间隔复习，把学习拆成每天能完成的一小步。":
    "A realistic study plan, focused flashcards, and spaced reviews. Small sessions. Lasting understanding.",
  "03 / 规划与复习": "03 / YOUR REVIEW DASHBOARD",
  "02 / 从资料到理解": "02 / FROM FILE TO FLUENCY",
  "从一份资料，": "One document.",
  "走向清晰的学习路径。": "A clearer path forward.",
  上传: "Upload",
  "上传 PDF，保留原始页面，让后续理解始终有据可查。":
    "Bring your PDF. We keep its pages, structure, and sources intact.",
  理解: "Understand",
  "顺着知识地图梳理章节、概念和它们之间的联系。":
    "Explore a knowledge map distilled from your material.",
  复习: "Review",
  "按自己的节奏安排练习，在合适的时候再回顾一次。":
    "Make space for a little practice, at the right time.",
  提问: "Ask",
  "提出疑问，从原文中寻找答案和支持它的依据。":
    "Follow your curiosity. Find answers grounded in the original.",
  "你的知识。": "YOUR KNOWLEDGE.",
  "你的数据边界。": "Your boundaries.",
  支持自行部署: "Self-hosted",
  可连接本地模型: "Local AI compatible",
  "03 / 清楚知道数据去向": "03 / PRIVATE BY DESIGN",
  "自己的学习资料，": "Your notes shouldn’t",
  "数据去向也该清清楚楚。": "come with fine print.",
  "你可以自行部署，连接 OpenAI 兼容服务，或通过 Ollama 使用本地模型。密钥只保存在服务端；删除文档时，相关学习记录也会一并删除。":
    "Self-host your workspace. Choose an OpenAI-compatible provider or keep model inference local with Ollama. API keys stay on the server. Deleting a document removes its learning data, too.",
  了解数据如何处理: "Understand your data",
  "开源，也属于你": "MADE TO BE YOURS",
  "打开源码，": "Open the source.",
  "搭建自己的学习空间。": "Build your own next chapter.",
  "采用 MIT 许可证，不绑定模型，不虚构使用数据。":
    "MIT licensed. No locked-in model. No invented metrics.",
  查看项目源码: "Explore the source",
  体验内置样例: "Try the original sample",
  "让读过的内容，真正成为你的知识。": "Make something of what you read.",
  "少一点收藏，多一点理解。": "Less collecting. More connecting.",
  隐私与数据: "Privacy & data",
  使用文档: "Documentation",
  学习概览: "Overview",
  我的资料: "My library",
  复习计划: "Study plan",
  关闭导航: "Close navigation",
  关闭菜单: "Close menu",
  个人学习空间: "Personal workspace",
  让知识慢慢变清晰: "Your space to understand",
  学习空间: "Workspace",
  主要导航: "Main navigation",
  "每天一点进步，": "A little progress,",
  "知识逐渐成形。": "every day.",
  "把知识变成自己的。": "Make knowledge yours.",
  "从一个好问题开始。": "One good question at a time.",
  打开我的资料: "Open your library",
  模型设置: "Settings",
  尊重你的数据边界: "Local-first mindset",
  "开源，自由搭建。": "Open source. Yours to build.",
  打开菜单: "Open menu",
  文档学习空间: "Document workspace",
  学得更清楚一点: "A clearer way to learn",
  "已连接 AI": "AI connected",
  演示模式: "Demo",
  "带着问题，一起理解": "YOUR THOUGHT PARTNER",
  "从你的疑问开始。": "Follow your curiosity.",
  "每个好问题，都值得一个有依据的回答。":
    "Good questions deserve grounded answers.",
  "这份资料里，你想弄懂什么？": "What would you like to understand?",
  "我会从这份文档中查找依据，并附上对应的原文。":
    "I’ll look in this document and bring the sources with me.",
  "卷积为什么有用？": "Why is convolution useful?",
  "反向传播是怎样工作的？": "How does backpropagation work?",
  "验证集和测试集有什么区别？":
    "What is the difference between validation and test data?",
  你: "YOU",
  "演示 · 原文摘录": "DEMO · SOURCE EXCERPTS",
  查看回答依据: "FOLLOW THE SOURCE",
  第: "Question",
  "正在查找相关原文…": "Finding the right pages…",
  输入关于这份文档的问题: "Ask about this document",
  "关于这份资料，你想问什么？": "Ask about this document…",
  发送问题: "Send question",
  "回车发送 · Shift + 回车换行": "↵ to ask · Shift + ↵ for a new line",
  "演示模式仅展示固定原文摘录，不调用真实 AI。":
    "Demo uses deterministic source excerpts, not a live model.",
  "AI 也可能出错，重要结论请核对原文。":
    "AI can be wrong. Check important claims against the source.",
  "体验样例 PDF": "Explore sample PDF",
  "已将原创样例添加到你的学习空间。":
    "Original sample added to your workspace.",
  正在打开样例: "Opening sample",
  文档问答: "Ask AI",
  知识地图: "Knowledge",
  知识闪卡: "Flashcards",
  理解测验: "Quiz",
  "已加入队列，将重新处理这份文档。": "Document queued for reprocessing.",
  页: "pages",
  个知识点: "knowledge points",
  演示样例: "Demo sample",
  "搜索 PDF 原文": "Search original PDF",
  重新处理文档: "Reprocess document",
  制定复习计划: "Plan your study",
  我们换个方式再试试: "LET’S TRY A DIFFERENT APPROACH",
  正在整理你的资料: "MAKING SENSE OF YOUR MATERIAL",
  "这份 PDF 暂时未能处理完成。": "This PDF needs a little attention.",
  "文档已加入处理队列。": "Your document is in the queue.",
  "正在逐页解析文档。": "Reading, one page at a time.",
  "正在建立知识索引。": "Connecting the ideas.",
  "你可以留在这里，也可以稍后回来。文档会继续在后台处理。":
    "Keep this page open or come back later. Processing continues in the background.",
  解析: "Parse",
  建立索引: "Index",
  已就绪: "Ready",
  重新尝试: "Retry document",
  "PDF 已解析，可以阅读和搜索。": "Your PDF is parsed and searchable.",
  "配置 AI 模型": "Configure an AI Provider",
  "后，重新处理这份文档，即可生成知识点并进行问答。":
    "to generate knowledge and answers, then reprocess this document.",
  学习助手: "Learning assistant",
  阅读区域宽度: "Reader width",
  文档工具: "Document tools",
  "在原文里找一找。": "Find it in the original.",
  "搜索 PDF 内容": "Search PDF text",
  "输入关键词或一句话…": "A word, phrase, or idea…",
  搜索: "Find",
  "这份文档中没有找到匹配内容。": "No matches found in this document.",
  "重新整理这份文档？": "Rebuild this workspace?",
  "将使用当前配置的 AI 模型重新处理。此文档已有的知识点、问答记录、计划、闪卡和测验将被替换，原始 PDF 会保留。":
    "Reprocessing uses the current AI provider. Existing knowledge, chat history, plans, cards, and quizzes for this document will be replaced. The original PDF is kept.",
  取消: "Cancel",
  "知识闪卡已生成，每张卡片都附有原文出处。":
    "Source-linked flashcards created.",
  "少量练习，经常回顾": "A LITTLE PRACTICE, OFTEN",
  "让知识留得更久。": "Make the ideas stick.",
  "先试着回忆，再翻开卡片核对答案。":
    "Try recalling the answer before turning the card.",
  "一个知识点，一个好问题。": "One idea. One good question.",
  "从这份文档的知识点生成闪卡，随时回到原文核对。":
    "Create source-linked cards from this document’s knowledge points.",
  生成知识闪卡: "Create flashcards",
  "今天的练习，先到这里。": "You’ve made room for tomorrow.",
  同步新增知识点: "Sync new knowledge",
  张今日待复习: "due today",
  张闪卡: "total cards",
  查看问题: "Show question",
  翻开卡片查看答案: "Flip card to reveal answer",
  参考答案: "THE IDEA",
  先试着回忆: "RECALL FIRST",
  点击返回问题: "Tap to see question",
  点击查看答案: "Tap to reveal answer",
  "查看原文 · 第": "Original source · Page",
  明天再复习: "Revisit soon",
  还需要巩固: "A little longer",
  基本记住了: "I remembered",
  掌握得很清楚: "Very clear",
  "先用自己的话回忆，再查看答案，选择掌握程度。":
    "Recall it in your own words. Then reveal and rate.",
  "选择“没记住”，明天会再次复习；回忆越熟练，下次复习间隔越长。":
    "An explainable spaced-review schedule. “Again” means tomorrow; successful recall increases the interval.",
  让知识逐渐成体系: "THE BIGGER PICTURE",
  "重点，慢慢清晰起来。": "A map of what matters.",
  "个知识点，每一个都能回到原文。": "ideas, connected to the original pages.",
  "查找一个概念…": "Find a concept…",
  搜索知识点: "Search knowledge points",
  "再进一步，生成知识地图。": "Knowledge is one step away.",
  "先配置 AI 模型，再重新处理这份 PDF，即可提取知识点。现在已经可以阅读和搜索原文。":
    "Configure an AI provider and reprocess this PDF to extract its knowledge. The original text is already searchable.",
  "没有找到匹配的概念，换个关键词试试。":
    "No matching concepts. Try another keyword.",
  "阅读原文 · 第": "Read source · Page",
  "原始 PDF": "ORIGINAL PDF",
  上一页: "Previous page",
  "PDF 页码": "PDF page",
  下一页: "Next page",
  缩小: "Zoom out",
  放大: "Zoom in",
  切换文字阅读视图: "Toggle accessible text view",
  "下载原始 PDF": "Download original PDF",
  "页 · 提取的原文": "· extracted text",
  "正在加载原文…": "Loading text…",
  "正在打开原始 PDF": "Opening original PDF",
  正在渲染: "Rendering",
  "你正在阅读原始资料。": "You’re reading the original source.",
  使用原创神经网络样例绘制的界面示意图:
    "Illustrative preview using our original neural networks sample",
  "studypilot / 学习空间": "studypilot / workspace",
  "原创样例 · 界面示意": "ORIGINAL SAMPLE",
  "每天，都有一点进步。": "A little progress, every day.",
  走近: "Introduction to",
  "8 页原文": "8 pages",
  "16 个知识点": "16 knowledge points",
  第四章: "CHAPTER FOUR",
  用卷积理解图像: "Seeing with convolution",
  卷积为什么有用: "Why convolution is useful",
  "局部连接，权重共享。": "Local connectivity. Shared weights.",
  "一个卷积核，识别不同位置的特征。": "One filter, many possibilities.",
  "↗ 原文 · 第 4 页": "↗ Source · Page 4",
  "步幅、填充与池化": "Stride, padding, and pooling",
  你的学习伙伴: "YOUR STUDY COMPANION",
  卷积为什么能: "Why does convolution",
  "减少参数数量？": "use fewer parameters?",
  回答依据来自原文: "SOURCE-GROUNDED ANSWER",
  "同一个小型卷积核会在图像各处重复使用。这种":
    "The same small filter is reused across the image. This",
  权重共享: "weight sharing",
  "减少了网络所需的参数数量。（原文译意）":
    "reduces the number of parameters a network needs.",
  "第 4 页 · 原文出处": "Page 4 · Original source",
  "从一个问题，理解得更多。": "Ask a better question.",
  看看自己理解了多少: "CHECK YOUR UNDERSTANDING",
  "哪些知识，你真正记住了？": "What stayed with you?",
  "根据读过的资料出题，让练习有据可依。":
    "Practice questions, rooted in what you’ve read.",
  题目数量: "Questions",
  道题: "questions",
  正在准备: "Preparing",
  再练一次: "Practice again",
  生成测验: "Create quiz",
  "用一个问题，看看理解到了哪里。": "A question is a mirror.",
  "通过选择题、判断题和简答题，了解已经掌握的内容，以及还值得回顾的地方。":
    "Multiple choice, true / false, and short answers help reveal what you understand—and what to revisit.",
  "试着用自己的话解释…": "Explain it in your own words…",
  正在核对答案: "Checking answers",
  提交并查看反馈: "Check my understanding",
  本次练习得分: "PRACTICE SCORE",
  "知识正在慢慢连起来。": "The ideas are connecting.",
  "知道哪里还不熟悉，也是一种进步。": "Now you know what to revisit.",
  已掌握: "Got it",
  建议回顾: "Revisit this",
  "你的答案：": "Your answer:",
  "参考答案：": "Reference answer:",
  "核对原文 · 第": "Check source · Page",
  "StudyPilot 首页": "StudyPilot home",
  切换明暗主题: "Toggle color theme",
  加载中: "Loading",
  "暂时未能完成操作。": "We couldn’t complete that.",
  重试: "Try again",
  正在加载内容: "Loading content",
  关闭对话框: "Close dialog",
  "请选择 PDF 格式的文档。": "Please choose a PDF document.",
  "请选择小于 20 MB 的 PDF。": "Choose a PDF smaller than 20 MB.",
  "PDF 已上传，正在准备你的学习空间。":
    "PDF uploaded. Your knowledge workspace is being prepared.",
  "从一份资料开始。": "Start with a document.",
  "带上你的资料，一起把知识梳理清楚。":
    "Bring the material. We’ll help you find the meaning.",
  "选择 PDF 文件": "Choose PDF file",
  "更换 PDF 文件": "Choose a different PDF",
  "将 PDF 拖到这里": "Drop your PDF here",
  或点击选择本地文件: "or click to browse your files",
  "仅支持 PDF · 不超过 20 MB · 建议使用文字版文档":
    "PDF only · up to 20 MB · text-based documents",
  "PDF 归属于当前浏览器的学习空间。启用真实 AI 后，相关文本会发送到你配置的模型服务。":
    "Your PDF is private to this browser workspace. In live AI mode, text is sent to your configured provider.",
  正在加入处理队列: "Queuing document",
  "正在上传 PDF": "Uploading PDF",
  上传并开始整理: "Upload & prepare",
  "请求未能完成，请稍后重试。": "The request could not be completed.",
  "上传中断，请检查网络后重试。":
    "Upload interrupted. Check your connection and try again.",
  "上传超时，请稍后重试，或选择较小的 PDF。":
    "Upload timed out. Try a smaller PDF.",
  "上传失败，请稍后重试。": "Upload failed.",
  "服务返回的数据异常，请稍后重试。":
    "The server returned an invalid response.",
  "请稍后重试。": "Please try again.",
  "学习空间暂时无法加载，请确认后端服务已启动后重试。":
    "The workspace could not load. Check the API connection and retry.",
  "已记录这次进步。": "A little progress, saved.",
  专注于你的学习: "YOUR LEARNING, IN FOCUS",
  "今天，再多理解一点。": "A good day to understand more.",
  "接着上次的思路，完成今天的一小步。":
    "Pick up a thought. Make a little progress. Keep going.",
  "上传 PDF": "Upload PDF",
  学习资料: "Document",
  "收集，也记得理解": "A growing collection",
  知识点: "Knowledge points",
  值得留下的知识: "Ideas worth keeping",
  今日待复习: "Reviews today",
  "每天一点，慢慢巩固": "Small steps, real progress",
  已完成学习时长: "Study time",
  根据已完成任务统计: "From completed tasks",
  继续学习: "Continue learning",
  查看全部资料: "View library",
  "下一段学习，从这里开始。": "Your next chapter starts here.",
  "上传 PDF 开始阅读，或先通过原创样例体验知识地图与复习工具。":
    "Upload a PDF to build your first knowledge map, or explore our original sample.",
  学习: "Learn",
  笔记: "NOTES",
  原创英文样例: "Original English sample",
  进入学习空间: "Explore the workspace",
  让理解真正留下来: "MAKE IT STICK",
  "阅读带来信息，": "Reading gives you information.",
  "回忆让它变成你的知识。": "Retrieval makes it yours.",
  "翻开笔记前，先试着解释一个刚学过的概念。":
    "Try explaining one concept before looking at your notes.",
  最近的问题: "Recent questions",
  记下每一次好奇: "Your curiosity, collected",
  "还没有提问记录。打开一份资料，从好奇的地方开始吧。":
    "No questions yet. Open a document and follow an idea.",
  今天的学习安排: "On your desk today",
  项待学习或复习: "things to revisit",
  "一次，做好一点。": "A little at a time.",
  分钟: "min",
  张闪卡待复习: "flashcards ready",
  "今天暂无安排。创建复习计划或知识闪卡，为下一次学习留一点时间。":
    "A clear desk. Create a study plan or flashcards to schedule your next session.",
  查看复习计划: "View study plan",
  "每一次学习，都算数。": "Every session counts.",
  "/": "of",
  项任务已完成: "tasks complete",
  "这是属于当前浏览器的个人学习空间。":
    "This is your personal browser workspace.",
  "了解数据如何保存 ↗": "How your data is stored ↗",
  首页: "Home",
  "开源项目 / MIT 许可证": "OPEN SOURCE / MIT LICENSE",
  "源码清晰，": "Made to be understood.",
  "也留有继续创造的空间。": "Built to be extended.",
  "StudyPilot AI 是一个开源全栈学习助手，采用 Next.js、FastAPI、PostgreSQL 和 pgvector，可接入你选择的兼容模型服务。":
    "StudyPilot AI is a full-stack learning workspace: Next.js, FastAPI, PostgreSQL, pgvector, and a provider adapter you can make your own.",
  查看代码仓库: "View repository",
  "当前部署尚未配置公开仓库链接。源码已包含在项目中；发布仓库后，可设置 NEXT_PUBLIC_GITHUB_URL。":
    "This deployment has not configured a public repository link yet. The source is included in the project checkout. Set NEXT_PUBLIC_GITHUB_URL after publishing your repository.",
  在自己的电脑上运行: "Run it locally",
  "快速启动使用仅供开发的 PGlite 和 pgvector。原生 PostgreSQL 部署与 Docker 打包尚待验证。演示模式不会伪装成真实模型。":
    "The quick-start uses development-only PGlite with pgvector. Native PostgreSQL deployment and Docker packaging are still on the roadmap. Demo mode never pretends to be a live model.",
  连接你选择的模型服务: "Bring your own provider",
  "在服务端设置 AI_PROVIDER、AI_BASE_URL、CHAT_MODEL、EMBEDDING_MODEL，以及保密的 AI_API_KEY。使用本地模型时，设置 AI_PROVIDER=ollama 和 OLLAMA_BASE_URL。修改后重启 API 与后台任务进程；更换嵌入模型后，还需重新处理已有 PDF。":
    "Set AI_PROVIDER, AI_BASE_URL, CHAT_MODEL, EMBEDDING_MODEL, and the private AI_API_KEY on the API server. For local inference, use AI_PROVIDER=ollama and OLLAMA_BASE_URL. Restart the API and worker, then reprocess existing PDFs when changing embeddings.",
  了解项目结构: "Explore the code",
  "apps/web：支持电脑与手机布局的学习界面":
    "apps/web — the responsive learning interface",
  "apps/api：PDF 处理、文档权限、检索问答与复习安排":
    "apps/api — PDF processing, ownership checks, RAG, and study scheduling",
  "docs：架构说明、验证记录与原创样例":
    "docs — architecture, verification notes, and original sample material",
  "scripts：本地启动、样例生成与检查脚本":
    "scripts — local startup, sample generation, and quality checks",
  "当前版本能做什么，还缺什么": "Honest first-release boundaries",
  "这是 Alpha 开发预览版，尚未经过完整生产验收。真实模型联调和浏览器回归仍待完成。v0.1 不包含扫描件 OCR、可找回账号、跨文档问答或学习小组。引用便于核对原文，但不保证模型解释一定正确；简答题采用可解释的关键词匹配评分。":
    "This is an alpha development preview, not a production-audited service. Real-provider integration and complete browser regression testing remain outstanding. Scanned-PDF OCR, recoverable account login, multi-document conversations, and study groups are not included in v0.1. Source citations are navigable evidence, not a factuality guarantee. Short-answer quiz scoring uses transparent keyword matching.",
  "隐私说明 / 把规则说清楚": "PRIVACY / PLAIN LANGUAGE",
  "你的知识，": "Your knowledge.",
  "StudyPilot 支持自行部署。部署者决定文件存放在哪里，以及由哪个模型服务接收相关文本。":
    "StudyPilot is self-hostable software. The deployment operator chooses where your files are stored and which AI provider receives text.",
  "不接入广告追踪和统计 SDK，不把 API 密钥发送到浏览器。":
    "No advertising trackers. No analytics SDK. No API keys in the browser.",
  "会保存哪些数据？": "What is stored?",
  "PDF 以自动生成的编号保存到服务端 DATA_DIR/uploads 目录。数据库保存提取的页面、文本片段、向量、知识点、问答、引用、计划、闪卡和练习记录。正式部署时，数据库与上传目录都需要持久化保存。":
    "PDF files are saved under the server’s DATA_DIR/uploads directory using generated IDs. PostgreSQL stores extracted pages, chunks, embeddings, knowledge points, chat messages, citations, plans, cards, review records, and quiz attempts. The database and upload directory both require persistent storage in production.",
  "谁可以访问这些数据？": "Who can see it?",
  "系统通过签名的 HttpOnly Cookie 识别个人学习空间，并检查文档归属。部署管理员可以访问底层数据库与文件。当前版本不是加密保险箱，也不支持账号找回和跨设备登录；清除 Cookie 后，将无法再访问原学习空间。":
    "A signed, HttpOnly cookie identifies your personal workspace. API requests check document ownership. The deployment administrator can access the underlying database and files. This release is not an encrypted vault, and it does not include an account recovery or cross-device sign-in system. Clearing the cookie loses access to that workspace.",
  "什么时候会把文本发送给模型服务？": "When does text leave the server?",
  "演示模式不调用外部 AI。启用真实模型后，文本片段会发送给嵌入服务，问题与检索到的片段会发送给对话模型；提取知识点时，会分批处理全文片段。Ollama 可以在本地运行，让模型输入留在自己的设备或服务器内。使用第三方服务时，还应了解其数据政策。":
    "Demo mode makes no external AI calls. Live OpenAI-compatible mode sends text chunks to the embedding service; selected chunks and questions are sent to the chat model. Knowledge extraction processes all chunks in bounded batches. Ollama can run locally so model inputs remain inside your own infrastructure. Your chosen provider’s policies also apply.",
  "删除 PDF 后，相关记录会怎样？": "What happens when I delete a PDF?",
  "删除操作会移除原始 PDF，以及关联的页面、片段、向量、知识点、问答、引用、计划、闪卡和测验记录。部署者的备份可能保留旧副本，直到备份保留期结束。此操作无法撤销。":
    "Deletion removes the original file and cascades through its pages, chunks, vectors, knowledge points, chats, citations, plans, cards, reviews, and quizzes. Operator backups may retain older copies until their retention period expires. There is no undo button.",
  "部署者需要配置什么？": "What should deployment operators configure?",
  "请配置 HTTPS、足够强的 SESSION_SECRET、安全 Cookie、明确的 ALLOWED_ORIGINS、私有数据库访问、入口权限控制、加密存储、使用额度和备份策略。PDF 解析虽有大小与页数限制，但不是经过加固的恶意文件沙箱。当前版本不适合直接作为无限制公开的多租户服务。":
    "Use HTTPS, a strong SESSION_SECRET, secure cookies, an explicit ALLOWED_ORIGINS list, private database access, access controls at your hosting edge, encrypted storage, quotas, and backup retention. PDF parsing has size and page limits but is not a hardened malware sandbox. Do not treat this first release as a public, abuse-resistant multi-tenant SaaS.",
  "AI 的回答可靠吗？": "What about the AI’s answers?",
  "PDF 内容仅作为参考资料，不作为指令执行。检索限定在当前文档内，引用来源也会经过校验。这些措施能够降低风险，但不能保证模型理解正确。重要结论仍需对照原文核实。":
    "PDF content is treated as untrusted reference data, not instructions. Retrieval is scoped to one document, and cited source IDs are validated. These controls reduce risk; they cannot guarantee that a model’s interpretation is correct. Verify important claims against the original pages.",
  "文档名称已更新。": "Document renamed.",
  "文档及相关学习记录已删除。": "Document and related learning data deleted.",
  "文档已重新加入处理队列。": "Document queued again.",
  "少一点收藏，多一点理解": "COLLECT LESS. CONNECT MORE.",
  "我的学习资料。": "Your library.",
  "把值得理解的内容，放在触手可及的地方。":
    "A home for the ideas you’re making your own.",
  搜索资料: "Search documents",
  "搜索资料名称…": "Find something in your library…",
  筛选文档状态: "Filter document status",
  全部资料: "All documents",
  处理中: "Indexing",
  处理失败: "Failed",
  搜索结果: "Search results",
  最近添加的优先显示: "Most recent first",
  "STUDYPILOT / 阅读笔记": "STUDYPILOT / READING NOTES",
  页原文: "PAGES",
  需要处理: "Needs attention",
  打开文档: "Open document",
  "为新知识，留一点空间。": "Make room for a new idea.",
  "添加一份新的 PDF 资料": "Add another PDF to your library",
  "没有找到相关资料。": "No documents found.",
  "从空白开始，也很好。": "A blank page. A good beginning.",
  "换个名称或状态条件再试试。": "Try a different title or status filter.",
  "添加课程笔记、论文，或先体验我们原创的 8 页样例。":
    "Add course notes, a research paper, or our original eight-page sample.",
  "建议使用文字版 PDF。扫描件请先完成文字识别，再上传。":
    "Text-based PDFs work best. Scanned documents need OCR before uploading.",
  "每份文档不超过 20 MB、300 页。": "Maximum 20 MB and 300 pages per document.",
  添加样例: "Add sample",
  重命名文档: "Rename document",
  文档名称: "Document title",
  保存名称: "Save title",
  "确定删除这份文档？": "Let this document go?",
  删除: "Deleting",
  "也会永久删除原始 PDF、提取的文本、向量、知识点、问答、计划、闪卡和测验记录。此操作无法撤销。":
    "also permanently removes its PDF, extracted text, embeddings, knowledge points, conversations, study plan, cards, and quiz records.",
  保留文档: "Keep document",
  永久删除: "Delete permanently",
  当前模型连接: "Your current connection",
  "演示模式 · 不调用外部 AI": "Demo adapter · no external AI requests",
  真实模型配置: "Live configuration",
  测试当前连接: "Test current connection",
  模型服务配置: "PROVIDER CONFIGURATION",
  "选择适合自己的模型。": "Your model. Your choice.",
  "在这里生成服务端配置。页面上的选择不会直接切换正在使用的模型，需将配置应用到服务端并重启。":
    "Build a configuration snippet for your server. Nothing on this page silently changes the active provider.",
  "OpenAI 兼容服务": "OpenAI compatible",
  "Ollama · 本地模型": "Ollama · local",
  "服务接口地址（Base URL）": "Base URL",
  对话模型名称: "Chat model",
  嵌入模型名称: "Embedding model",
  "密钥，只保存在服务端。": "Keys belong on the server.",
  "当前由部署者管理密钥。请在服务端环境中设置 AI_API_KEY，不要写入 NEXT_PUBLIC 变量，也不要提交到 Git 仓库。":
    "This deployment uses administrator-managed credentials. Set AI_API_KEY in your server environment, never in NEXT_PUBLIC variables or Git.",
  ".env 配置片段": ".env configuration",
  复制服务端配置: "Copy server configuration",
  "配置已复制。请应用到服务端，并重启 API 和后台任务进程。":
    "Configuration copied. Apply it to the API server, then restart.",
  "暂时无法访问剪贴板，请选中配置内容后手动复制。":
    "Clipboard unavailable. Select and copy the snippet manually.",
  "让数据边界更清楚。": "A useful boundary.",
  "只有服务端可以调用模型。浏览器使用者无法直接修改服务地址、查看密钥，或把文档重定向到其他服务。":
    "Only the server can contact the model. Browser users cannot change provider endpoints, view API keys, or redirect your documents to another service.",
  "兼容 OpenAI 的对话与嵌入接口":
    "OpenAI-compatible Chat Completions + embeddings",
  "对话模型需要支持 JSON 输出": "JSON-capable chat models required",
  "Ollama 可在本地运行模型": "Ollama can keep inference local",
  更换嵌入模型后需重新处理文档: "Changing embeddings requires reprocessing",
  "查看数据处理说明 ↗": "Read the data policy ↗",
  "学习空间绑定当前浏览器的 HttpOnly Cookie，并非可找回的账号。账号登录与跨设备同步尚未提供。":
    "Workspaces are tied to an HttpOnly browser cookie, not a recoverable account. Account login and cross-device sync are on the roadmap.",
  "配置清楚，使用安心": "BUILT AROUND YOUR BOUNDARIES",
  "设置你的学习空间。": "Make this workspace yours.",
  "自由选择模型服务，让密钥留在服务端。":
    "A portable AI setup, with credentials kept where they belong.",
  "复习计划已生成，按自己的节奏开始吧。":
    "A realistic learning plan, ready for you.",
  "稳稳地学，慢慢地进步": "STEADY IS A SUPERPOWER",
  "每天，学得更扎实一点。": "A little better, every day.",
  "让计划适合你的时间，而不是让生活追着计划走。":
    "Make a plan that fits your life—not the other way around.",
  创建复习计划: "Create study plan",
  "让学习，有自己的节奏。": "Give your learning a rhythm.",
  "选择资料和目标日期，留出每天可用的时间。系统会安排初次学习、间隔复习和最后的知识回顾。":
    "Choose a document, a target date, and a little time each day. We’ll schedule learning, spaced review, and a final recall session.",
  创建第一个计划: "Build my first plan",
  当前学习计划: "YOUR ACTIVE PLAN",
  "目标日期：": "Target:",
  "分钟 / 天": "min / day",
  "天 / 周": "days / week",
  已完成任务: "TASKS COMPLETE",
  你的学习路径: "Your learning path",
  选择复习计划: "Choose study plan",
  重点复习: "Focus",
  今天: "Today",
  标记为未完成: "Mark incomplete",
  完成: "Complete",
  初次学习: "FIRST LEARNING",
  重点知识回顾: "KEY CONCEPT REVIEW",
  综合回顾: "FINAL RECALL",
  间隔复习: "SPACED REVIEW",
  "为每天的进步，留一点时间。": "Make a little time for progress.",
  "先准备一份知识地图。": "Start with a knowledge map.",
  "先添加原创样例，或连接 AI 模型处理自己的 PDF，再创建复习计划。":
    "Add the original sample or process a PDF with an AI provider before creating a plan.",
  前往我的资料: "Go to library",
  "目标 / 考试日期": "Target / exam date",
  "每天学习时长（分钟）": "Minutes per day",
  每周学习天数: "Days per week",
  天: "days",
  学习顺序: "Priority",
  按文档顺序: "Follow the document",
  优先学习重点: "Important concepts first",
  "学习时长会根据难度调整，复习至少间隔一天。创建后会替换这份文档已有的计划；如果时间不足，系统会提示调整，不会强行塞入超出容量的任务。":
    "Learning time adapts to difficulty; review is spaced by at least one day. An existing plan for this document will be replaced. Schedules that exceed your capacity are rejected, not silently overbooked.",
  正在制定计划: "Building your plan",
  生成我的复习计划: "Create my study plan",
  "暂时无法连接后端。请启动 API 和 PDF 后台处理服务，再重试。":
    "The API is unavailable. Start the backend and PDF worker, then retry.",
  "文档处理未完成。": "Document processing did not finish.",
  "重试：{0}": "Retry: {0}",
  "重命名：{0}": "Rename: {0}",
  "删除：{0}": "Delete: {0}",
  "{0} 分钟": "{0} min",
  "完成：{0}": "Complete: {0}",
  "Ollama 本地模型": "Ollama local model",
  "“嵌入模型”负责查找相关原文，“对话模型”负责生成回答，两者都需要正确配置。这里只生成配置片段，不会保存密钥或直接切换服务。":
    "The embedding model finds relevant passages; the chat model writes answers. Both need a working configuration. This page creates a configuration snippet; it does not save credentials or switch services.",
  界面语言: "Interface language",
  简体中文: "Simplified Chinese",
  月: "month",
  "查看原文：{0}": "View source: {0}",
  一: "M",
  二: "T",
  三: "W",
  四: "T",
  五: "F",
  六: "S",
  日: "S",
  "这份资料的核心观点是什么？": "What are the main ideas in this document?",
  "有哪些概念需要重点理解？": "Which concepts deserve particular attention?",
  "作者给出了哪些依据或限制？":
    "What evidence or limitations does the author describe?",
  "原文出处 · 第 {0} 页": "Source · Page {0}",
  "原文已就绪，AI 功能还差一步。":
    "Your PDF is ready. Connect AI when you're ready.",
  "现在可以阅读、翻页和搜索 PDF。生成知识点、文档问答、闪卡与测验，需要先配置模型服务。":
    "You can already read, browse and search your PDF. Connect a model service to create knowledge points, ask questions, and generate flashcards and quizzes.",
  "进入“模型设置”，生成服务端配置。":
    "Open Settings to create a server configuration.",
  "将配置应用到服务端，重启 API 与后台任务进程。":
    "Apply it on the server, then restart the API and background worker.",
  "回到这里，点击“重新处理文档”。":
    "Return here and select Reprocess document.",
  前往模型设置: "Open model settings",
  "先阅读 PDF": "Read the PDF",
  "复习已记录 · 下次安排在 {0}": "Review saved · Next review {0}",
  "全部 {0} 张卡片均已安排复习。下次复习：{1}。":
    "All {0} cards are scheduled. Your next review is {1}.",
  "难度：": "Difficulty: ",
  "PDF 第 {0} 页，共 {1} 页": "PDF page {0} of {1}",
  "/ 神经网络": "/ NEURAL NETWORKS",
  "回答第 {0} 题": "Answer question {0}",
  "题 ·": "questions ·",
  按你的习惯使用: "MAKE IT YOURS",
  选择界面语言: "Choose interface language",
  "默认使用简体中文。选择会自动保存在当前浏览器，不会更改文档原文或已有学习记录。":
    "Simplified Chinese is the default. Your choice is saved in this browser without changing source documents or existing study records.",
  "在服务端私密设置 AI_API_KEY，不要提交到 Git。":
    "Set AI_API_KEY privately on the server. Never commit it to Git.",
  "重启 API 和后台任务进程，然后重新处理已有文档。":
    "Restart the API and background worker, then reprocess existing documents.",
  "演示模式运行正常，本次检查没有调用外部模型。":
    "Demo mode is working. No external model was called.",
  "已验证嵌入服务连接。对话模型尚未测试，请通过文档问答进一步验证。":
    "Embedding service connection verified. The chat model has not been tested; use document Q&A to check it.",
  "简答题采用关键词匹配，仅供练习参考，并非专家评分。请结合原文核对自己的理解；英文样例的评分关键词也来自英文原文。":
    "Short answers use keyword matching for practice, not expert grading. Check your understanding against the source; the English sample uses English scoring keywords.",
  "PDF 可以继续阅读和搜索。问答等 AI 功能需要先在“模型设置”中配置可用的模型服务，再重新处理文档。":
    "You can still read and search this PDF. Configure a working model service in Settings, then reprocess the document to use AI features.",
  "模型服务未通过身份验证，请检查服务端配置的 API 密钥及使用权限。":
    "The model service could not authenticate. Check the server's API key and permissions.",
  "模型服务拒绝了请求，请检查模型名称、接口地址、兼容性和可用额度。":
    "The model service rejected this request. Check model names, endpoint compatibility and available quota.",
  "模型响应超时，请稍后重试，或选择较小的文档与响应更快的模型。":
    "The model timed out. Try again, use a smaller document or choose a faster model.",
  "暂时无法连接模型服务，请检查服务端的接口地址和网络。":
    "Could not connect to the model service. Check the server endpoint and network.",
  "模型服务繁忙，请稍后重试。":
    "The model service is busy. Please try again shortly.",
  "嵌入模型返回的数据无效，请使用兼容且不超过 4096 维的嵌入模型。":
    "Invalid embedding data. Use a compatible embedding model with up to 4096 dimensions.",
  "模型返回的数据格式不正确，请选择支持 JSON 输出的模型后重试。":
    "The model returned an invalid format. Use a JSON-capable model and retry.",
  "知识点生成结果格式不正确，请检查模型是否支持 JSON 输出后重试。":
    "The knowledge map has an invalid format. Check JSON support and retry.",
  "测验生成结果不完整或格式不正确，请重试或减少题目数量。":
    "The quiz is incomplete or invalid. Try again or request fewer questions.",
  "回答没有提供可核对的有效引用，请重新提问。":
    "The answer did not include valid, verifiable citations. Please try again.",
  "嵌入模型已更换，请重新处理这份文档，更新知识索引。":
    "The embedding model has changed. Reprocess this document to rebuild its index.",
  "当前学习空间的会话已失效，请刷新页面。匿名空间不支持账号找回。":
    "This workspace session has expired. Refresh the page. Anonymous workspaces do not support account recovery.",
  "当前学习空间中找不到这项内容，可能已被删除，或不属于此浏览器。":
    "This item is not available in this workspace. It may have been deleted or belong to another browser.",
  "文档仍在处理，请完成后再使用这项功能。":
    "The document is still processing. Try this feature when it is ready.",
  "文档正在处理中，请完成后再进行此操作。":
    "The document is processing. Wait for it to finish before continuing.",
  "请先生成知识点，再创建复习计划、闪卡或测验。":
    "Generate knowledge points before creating a study plan, flashcards or a quiz.",
  "这张卡片本轮已复习，请在下次计划日期继续。":
    "This card has already been reviewed. Come back on its next scheduled date.",
  "这份测验已经提交。想再练一次，可以创建新的测验。":
    "This quiz has already been submitted. Create a new one to practise again.",
  "学习空间的文档数量已达上限，请先删除不再需要的资料。":
    "This workspace has reached its document limit. Remove documents you no longer need.",
  "仅支持 PDF 文件，请检查文件类型和扩展名。":
    "Only PDF files are supported. Check the file type and extension.",
  "文件超过上传大小限制，请压缩或拆分后再上传。":
    "This file exceeds the upload limit. Compress or split it before uploading.",
  "PDF 无法解析，请重新导出一份完整、未加密的 PDF 后重试。":
    "This PDF could not be parsed. Export a complete, unencrypted copy and retry.",
  "这份 PDF 需要密码，请先解除密码保护再上传。":
    "This PDF requires a password. Remove its password protection before uploading.",
  "PDF 页数超出允许范围，请拆分为较小的文档。":
    "This PDF has too many pages. Split it into smaller documents.",
  "PDF 文本量过大，请拆分后再上传。":
    "This PDF contains too much text. Split it before uploading.",
  "没有提取到可读文字。扫描版 PDF 需要先进行文字识别（OCR），当前版本尚未提供该功能。":
    "No readable text was found. Scanned PDFs need OCR, which this version does not provide.",
  "存储中缺少原始 PDF，请重新上传文档。":
    "The original PDF is missing from storage. Upload it again.",
  "当前部署缺少样例 PDF，请联系部署者补齐样例文件。":
    "The sample PDF is missing. Ask the deployment owner to restore it.",
  "请选择从明天起、一年以内的目标日期。":
    "Choose a target date between tomorrow and one year from today.",
  "现有时间不足以完成学习和间隔复习，请增加学习时长、每周天数，或推迟目标日期。":
    "There is not enough time for learning and spaced review. Add daily time or study days, or move the target date.",
  "填写内容不符合要求，请检查日期、时长、题目数量及其他必填项。":
    "Check the date, duration, question count and other required fields.",
  "请求校验未通过，请刷新页面后重试。":
    "Request verification failed. Refresh the page and try again.",
  "当前网站地址未被后端允许，请检查部署的访问域名配置。":
    "The backend does not allow this website address. Check the deployment's allowed origins.",
  "操作有些频繁，请等待一分钟后再试。":
    "Too many requests. Please wait a minute and try again.",
  "暂时无法连接数据库，请稍后重试或检查后端服务。":
    "Could not connect to the database. Try later or check the backend.",
  "暂时无法连接后端，请确认 API 和 PDF 后台处理服务已经启动。":
    "Could not connect to the backend. Make sure the API and PDF worker are running.",
  "服务暂时无法完成操作，请稍后重试或检查服务运行状态。":
    "The service could not complete this action. Try later or check its status.",
  "网络请求未能完成，请检查连接后重试。":
    "The network request did not complete. Check your connection and retry.",
  "操作暂时未完成，请稍后重试。":
    "This action could not be completed. Please try again.",
  "嵌入模型接口连接正常。对话模型尚未在本次检查中验证，请通过处理文档进一步测试。":
    "The embedding endpoint is working. This check did not test the chat model; process a document to verify it.",
};
