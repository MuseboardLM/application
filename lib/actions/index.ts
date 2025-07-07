// lib/actions/index.ts

// Export all server actions from a central location
export * from './museboard';
export * from './auth';
export * from './mission';

// Re-export types for easy importing
export type { ActionResult, MuseItemInput } from './museboard';
export type { AuthResult } from './auth';
export type { MissionResult } from './mission';