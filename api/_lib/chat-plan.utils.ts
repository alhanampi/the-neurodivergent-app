import { isSupportedLanguage } from './preferences.utils.js'
import { LANGUAGE_NAMES } from './chat.utils.js'
import {
  MAX_PLAN_STEPS,
  MAX_STEP_TITLE_LENGTH,
  MAX_STEP_MINUTES,
  MAX_TASK_DESCRIPTION_LENGTH,
  MAX_TASK_TITLE_LENGTH,
  MIN_PLAN_STEPS,
  MIN_STEP_MINUTES,
} from './chat-plan.constants.js'
import type { ChatPlanRequestBody, PlanResponse, PlanStep } from './chat-plan.interfaces.js'
import type { SupportedLanguage } from './preferences.interfaces.js'

export function parseChatPlanRequestBody(body: unknown): ChatPlanRequestBody | null {
  if (typeof body !== 'object' || body === null) return null
  const candidate = body as Record<string, unknown>

  if (
    typeof candidate.conversationId !== 'number' ||
    !Number.isInteger(candidate.conversationId) ||
    candidate.conversationId <= 0
  ) {
    return null
  }
  if (!isSupportedLanguage(candidate.language)) return null

  return { conversationId: candidate.conversationId, language: candidate.language }
}

/** Asks Groq's JSON mode for a structured breakdown of the conversation so
 * far — a separate, non-streaming call, not appended to the conversation's
 * own message history (see api/chat-plan.ts). */
export function buildPlanSystemPrompt(language: SupportedLanguage): string {
  return `You are a task-planning assistant. Read the conversation between a user and an assistant that was helping break a task into steps. Produce a JSON object with "taskTitle", "taskDescription", and a "steps" array.
- "taskTitle": a short (under 60 characters) name for the overall task discussed, in ${LANGUAGE_NAMES[language]}
- "taskDescription": one or two sentences, in ${LANGUAGE_NAMES[language]}, explaining what the task is and what the steps below are for — this is shown to the user above the list of steps, so it should read as a plain-language summary, not a repeat of the title
- "steps": between 1 and 12 objects (or, if the conversation didn't fully enumerate them, the best reasonable breakdown given what was discussed), each with:
  - "title": a short (under 60 characters), concrete, actionable description in ${LANGUAGE_NAMES[language]}
  - "minutes": a REALISTIC estimated duration in whole minutes (integer, between 1 and 180) — estimate the real-world time an average person would need, including setup, cleanup, and the friction/interruptions a task like this actually has, not the theoretical fastest-case minimum. Do NOT shrink your estimates to fit any time budget the user mentioned earlier in the conversation — if the honest total exceeds what they said they have available, keep the honest numbers anyway; a realistic total that reveals a shortfall is more useful than a fake one that just fits.
Respond with ONLY the JSON object, no other text, matching this exact shape: {"taskTitle":"...","taskDescription":"...","steps":[{"title":"...","minutes":10}]}`
}

function normalizePlanStep(value: unknown): PlanStep | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>

  if (typeof candidate.title !== 'string') return null
  const title = candidate.title.trim()
  if (title.length === 0 || title.length > MAX_STEP_TITLE_LENGTH) return null

  if (typeof candidate.minutes !== 'number' || !Number.isFinite(candidate.minutes)) return null
  const minutes = Math.round(candidate.minutes)
  if (minutes < MIN_STEP_MINUTES || minutes > MAX_STEP_MINUTES) return null

  return { title, minutes }
}

/** Parses + validates Groq's JSON-mode output. Never trusts the model to
 * have actually respected the requested shape — same hand-guard philosophy
 * as every other untrusted-input parser in this codebase. Returns null on
 * any malformed/out-of-range piece, which api/chat-plan.ts turns into a
 * 502 rather than passing bad data through. */
export function parsePlanResponse(raw: string): PlanResponse | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const candidate = parsed as Record<string, unknown>

  if (typeof candidate.taskTitle !== 'string') return null
  const taskTitle = candidate.taskTitle.trim()
  if (taskTitle.length === 0 || taskTitle.length > MAX_TASK_TITLE_LENGTH) return null

  if (typeof candidate.taskDescription !== 'string') return null
  const taskDescription = candidate.taskDescription.trim()
  if (taskDescription.length === 0 || taskDescription.length > MAX_TASK_DESCRIPTION_LENGTH) {
    return null
  }

  if (!Array.isArray(candidate.steps)) return null
  if (candidate.steps.length < MIN_PLAN_STEPS || candidate.steps.length > MAX_PLAN_STEPS) {
    return null
  }

  const steps: PlanStep[] = []
  for (const rawStep of candidate.steps) {
    const step = normalizePlanStep(rawStep)
    if (!step) return null
    steps.push(step)
  }

  return { taskTitle, taskDescription, steps }
}
