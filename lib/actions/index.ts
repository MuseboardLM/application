// lib/actions/index.ts

// Export all server actions from a central location
export * from './museboard';
export * from './auth';

// Re-export types for easy importing
export type { ActionResult, MuseItemInput } from './museboard';