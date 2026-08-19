import type { SupportedLanguage } from './preferences.interfaces.js'

// Deliberately duplicated from tasks.interfaces.ts's TaskPriority rather
// than imported — same "no dependency between decoupled features" reasoning
// as CreateTasksBody's own comment, just in the other direction here (a
// plan step's shape happens to match a task step's, they aren't the same
// type).
export type PlanStepPriority = 'low' | 'medium' | 'high'

export interface PlanStep {
  title: string
  minutes: number
  priority: PlanStepPriority
}

/** Groq's JSON-mode response, parsed and validated — see
 * chat-plan.utils.ts's parsePlanResponse. `taskTitle`/`taskDescription`
 * summarize what the conversation was about and what the steps are for —
 * they become the parent Task's title/description once the user confirms
 * the plan (see PlanPreviewCard, POST /api/tasks). Due date is deliberately
 * not requested from the model — it has no real basis for a specific date;
 * that stays user-set after creation. Priority IS requested per step (the
 * model has enough context — effort/urgency/disruption — to estimate it
 * more usefully than always defaulting to "medium"). */
export interface PlanResponse {
  taskTitle: string
  taskDescription: string
  steps: PlanStep[]
}

export interface ChatPlanRequestBody {
  conversationId: number
  language: SupportedLanguage
}
