import type { SupportedLanguage } from './preferences.interfaces.js'

export interface PlanStep {
  title: string
  minutes: number
}

/** Groq's JSON-mode response, parsed and validated — see
 * chat-plan.utils.ts's parsePlanResponse. */
export interface PlanResponse {
  steps: PlanStep[]
}

export interface ChatPlanRequestBody {
  conversationId: number
  language: SupportedLanguage
}
