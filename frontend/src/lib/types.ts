export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { files: number; reviews: number };
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content?: string;
  size: number;
  mimeType?: string;
  createdAt: string;
}

export type TreeNode =
  | { type: "file"; id: string; name: string; path: string; size: number; mimeType?: string | null; createdAt: string }
  | { type: "directory"; name: string; children: TreeNode[] };

export type ReviewTemplate = "SECURITY" | "PERFORMANCE" | "CODE_QUALITY";
export type ReviewStatus   = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type Severity       = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ReviewIssue {
  severity: Severity;
  category: string;
  title: string;
  description: string;
  suggestion?: string;
  file?: string;
  line?: number;
}

export interface Review {
  id: string;
  title: string;
  templateType: ReviewTemplate;
  status: ReviewStatus;
  summary?: string;
  issues?: ReviewIssue[];
  recommendations?: string[];
  severity?: Severity;
  projectId: string;
  fileIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProviderType = "OPENAI" | "LM_STUDIO" | "OLLAMA" | "OPENROUTER" | "CUSTOM";

export interface AIProvider {
  id: string;
  name: string;
  providerType: ProviderType;
  baseUrl: string;
  apiKey?: string;
  modelName: string;
  isDefault: boolean;
  createdAt: string;
}

export type MessageRole = "USER" | "ASSISTANT";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}
