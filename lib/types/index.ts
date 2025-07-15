// lib/types/index.ts

import { User } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Enhanced MuseItem with AI features (extends your Supabase type)
export type MuseItem = Database["public"]["Tables"]["muse_items"]["Row"] & {
  // Runtime fields not in database
  signedUrl?: string;
  // These will be added after you regenerate types
  ai_status?: "pending" | "processing" | "completed" | "failed" | null;
  ai_summary?: string | null;
  ai_insights?: string | null;
  ai_relevance_score?: number | null;
  updated_at?: string;
};

export type MuseItemInsert = Database["public"]["Tables"]["muse_items"]["Insert"];
export type MuseItemUpdate = Database["public"]["Tables"]["muse_items"]["Update"];

// User Mission types (you already have these in Supabase)
export type UserMission = Database["public"]["Tables"]["user_missions"]["Row"];
export type UserMissionInsert = Database["public"]["Tables"]["user_missions"]["Insert"];
export type UserMissionUpdate = Database["public"]["Tables"]["user_missions"]["Update"];

// --- 👇 ADDED TYPES FOR ONBOARDING ---
export interface Hero {
  name: string;
  reason: string;
}

export interface Interest {
  category: string;
  description: string;
}
// --- END OF ADDED TYPES ---

// AI Conversation types (will be in your updated Supabase types)
export interface AIConversation {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string | null;
  is_active: boolean;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: {
    referenced_items?: string[];
    search_query?: string;
    response_type?: "search" | "insight" | "categorization" | "general" | "content_suggestion";
    processing_time?: number;
    intent?: string;
    confidence?: number;
  } | null;
  created_at: string;
}

// Shadow AI Agent types
export interface ShadowContext {
  mission: string;
  recentItems: MuseItem[];
  totalItems: number;
  topCategories: string[];
  userPreferences: {
    contentTypes: string[];
    categories: string[];
    sources: string[];
  };
  conversationHistory: AIMessage[];
}

export interface ShadowResponse {
  content: string;
  referencedItems: string[];
  suggestedActions: ShadowAction[];
  metadata: {
    responseType: "search" | "insight" | "categorization" | "general" | "content_suggestion";
    confidence: number;
    processingTime: number;
    intent: string;
  };
}

export interface ShadowAction {
  type: "add_content" | "categorize_items" | "search_external" | "analyze_pattern";
  label: string;
  description: string;
  data: any;
  priority: "low" | "medium" | "high";
}

// Magic Bar interaction types
export interface MagicBarAction {
  type: "add_content" | "search" | "chat" | "categorize";
  intent: string;
  confidence: number;
  data: {
    contentType?: MuseItem["content_type"];
    searchQuery?: string;
    chatMessage?: string;
    content?: string;
  };
}

export interface MagicBarResult {
  action: MagicBarAction;
  shouldTransformToChat: boolean;
  response?: string;
}

// Content analysis types for AI processing
export interface ContentAnalysis {
  contentType: MuseItem["content_type"];
  extractedText?: string;
  themes: string[];
  sentiment: "positive" | "neutral" | "negative";
  keywords: string[];
  suggestedCategories: string[];
  missionRelevance: number; // 0-1 score
  insights: string[];
  actionableAdvice: string[];
}

// External content suggestions
export interface ExternalContent {
  title: string;
  content: string;
  source: string;
  url: string;
  relevanceScore: number;
  suggestedReason: string;
  contentType: "article" | "video" | "tweet" | "quote" | "image";
}

export interface ContentSuggestion {
  content: ExternalContent;
  reasoning: string;
  missionAlignment: number;
  userInterestMatch: number;
  suggestedCategory: string;
  priority: "low" | "medium" | "high";
}

// Enhanced component props
export interface MuseboardProps {
  initialMuseItems: MuseItem[];
  user: User;
  userMission: UserMission | null;
}

export interface ShadowChatProps {
  isOpen: boolean;
  onClose: () => void;
  userMission: string;
  recentContext: MuseItem[];
  onAddContent?: (content: string, type: MuseItem["content_type"]) => void;
}

// API Response types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processingTime?: number;
    aiJobId?: string;
    tokensUsed?: number;
  };
}

// DSPy-specific types for AI modules
export interface DSPySignature {
  input_fields: Record<string, string>;
  output_fields: Record<string, string>;
  instructions: string;
}

export interface DSPyModule {
  name: string;
  signature: DSPySignature;
  examples?: Array<{
    inputs: Record<string, any>;
    outputs: Record<string, any>;
  }>;
}

// Search and filtering
export interface MuseItemFilters {
  categories?: string[];
  clusters?: string[];
  content_types?: MuseItem["content_type"][];
  date_range?: { start: string; end: string; };
  relevance_threshold?: number;
  search_query?: string;
  ai_status?: MuseItem["ai_status"][];
}

export interface MuseItemSort {
  field: "created_at" | "updated_at" | "ai_relevance_score" | "content_type";
  direction: "asc" | "desc";
}

// Export commonly used utility types
export type MuseItemWithSignedUrl = MuseItem & {
  signedUrl: string;
};

export type EnhancedMuseItem = MuseItem & {
  analysis?: ContentAnalysis;
  suggestions?: ContentSuggestion[];
  relatedItems?: string[];
};