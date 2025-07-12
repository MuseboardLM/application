// lib/actions/index.ts

// Export all server actions from a central location
export * from './museboard';
export * from './auth';
export * from './mission';

// Re-export types for easy importing - updated with new types
export type { ActionResult, MuseItemInput } from './museboard';
export type { AuthResult } from './auth';
export type { MissionResult } from './mission';

// Export new AI-related types
export type { 
  MuseItem, 
  UserMission, 
  ShadowContext, 
  ShadowResponse,
  AIConversation,
  AIMessage,
  ContentAnalysis,
  MagicBarAction,
  MagicBarResult 
} from '@/lib/types';