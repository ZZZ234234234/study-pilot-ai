export type Document = {
  id: string;
  title: string;
  filename: string;
  size_bytes: number;
  status: "queued" | "parsing" | "indexing" | "ready" | "failed";
  progress: number;
  page_count: number;
  chunk_count: number;
  knowledge_count: number;
  is_demo: boolean;
  ai_status: string;
  error: string | null;
  created_at: string;
  updated_at: string;
};
export type KnowledgePoint = {
  id: string;
  document_id: string;
  chapter: string;
  topic: string;
  title: string;
  explanation: string;
  source_excerpt: string;
  page_number: number;
  importance: "high" | "medium" | "low";
  difficulty: "high" | "medium" | "low";
  keywords: string[];
};
export type Citation = {
  id: string;
  page_number: number;
  quote: string;
  chunk_id: string;
};
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: string;
  model_label?: string | null;
  retrieval?: string | null;
  citations: Citation[];
  created_at: string;
};
export type StudyTask = {
  id: string;
  document_id: string;
  document_title?: string;
  title: string;
  scheduled_date: string;
  minutes: number;
  kind: "learn" | "review" | "focus" | "sprint";
  completed: boolean;
  knowledge_ids: string[];
};
export type StudyPlan = {
  id: string;
  document_id: string;
  exam_date: string;
  daily_minutes: number;
  days_per_week: number;
  tasks: StudyTask[];
};
export type Flashcard = {
  id: string;
  document_id: string;
  question: string;
  answer: string;
  page_number: number;
  next_review_date: string;
  interval: number;
  review_count: number;
};
export type Dashboard = {
  documents: Document[];
  document_count: number;
  knowledge_count: number;
  reviews_today: number;
  pages: number;
  progress: number;
  completed_tasks: number;
  total_tasks: number;
  study_minutes: number;
  tasks: StudyTask[];
  due_cards: Flashcard[];
  recent_questions: { id: string; content: string }[];
};
export type Settings = {
  provider: "demo" | "openai" | "ollama";
  base_url: string;
  chat_model: string;
  embedding_model: string;
  has_api_key: boolean;
  max_upload_mb: number;
  max_pdf_pages: number;
  mode: string;
  chat_available?: boolean;
  default_profile_id?: string | null;
  chat_connection?: string | null;
};
export type AIProfile = {
  id: string;
  name: string;
  provider: "deepseek" | "zhipu";
  base_url: string;
  model: string;
  has_api_key: boolean;
  revision: number;
};
export type AIProfiles = {
  profiles: AIProfile[];
  default_id: string | null;
  providers: {
    id: AIProfile["provider"];
    base_url: string;
    models: string[];
    checked_on: string;
  }[];
};
export type SearchResult = {
  page_number: number;
  heading: string;
  snippet: string;
};
export type QuizQuestion = {
  question: string;
  kind: "multiple_choice" | "true_false" | "short_answer";
  options: string[];
  page_number: number;
};
export type Quiz = {
  id: string;
  document_id: string;
  submitted: boolean;
  questions: QuizQuestion[];
};
export type QuizResult = {
  score: number;
  grading_note: string;
  results: (QuizQuestion & {
    correct: boolean;
    correct_answer: string;
    your_answer: string;
    explanation: string;
    source_excerpt: string;
  })[];
};
