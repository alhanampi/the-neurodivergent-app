import type { SupportedLanguage } from './preferences.interfaces.js'

export interface PlanStep {
  title: string
  minutes: number
}

/** Groq's JSON-mode response, parsed and validated — see
 * chat-plan.utils.ts's parsePlanResponse. `taskTitle`/`taskDescription`
 * summarize what the conversation was about and what the steps are for —
 * they become the parent Task's title/description once the user confirms
 * the plan (see PlanPreviewCard, POST /api/tasks). Priority/due date are
 * deliberately not requested from the model here — it has no real basis
 * for either; those stay user-set after creation. */
export interface PlanResponse {
  taskTitle: string
  taskDescription: string
  steps: PlanStep[]
}

export interface ChatPlanRequestBody {
  conversationId: number
  language: SupportedLanguage
}
