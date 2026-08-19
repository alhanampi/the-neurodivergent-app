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
  PLAN_PRIORITIES,
} from './chat-plan.constants.js'
import type {
  ChatPlanRequestBody,
  PlanResponse,
  PlanStep,
  PlanStepPriority,
} from './chat-plan.interfaces.js'
import type { SupportedLanguage } from './preferences.interfaces.js'

function parsePlanStepPriority(value: unknown): PlanStepPriority | null {
  if (typeof value !== 'string') return null
  return (PLAN_PRIORITIES as readonly string[]).includes(value) ? (value as PlanStepPriority) : null
}

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
- "taskDescription": in ${LANGUAGE_NAMES[language]}, a real breakdown of what doing this task requires — ingredients/tools/materials needed, anything to prepare or gather beforehand, and anything worth knowing before starting. This is shown to the user above the list of steps, so write it as genuinely useful prep information, not a one-line restatement of the title. A few sentences or short lines is fine; don't pad it artificially, but don't skimp either if there's real information to include (what to buy, what to have on hand, etc).
- "steps": between 1 and 12 objects (or, if the conversation didn't fully enumerate them, the best reasonable breakdown given what was discussed), each with:
  - "title": a short (under 60 characters), concrete, actionable description in ${LANGUAGE_NAMES[language]}
  - "minutes": a REALISTIC estimated duration in whole minutes (integer, between 1 and 180) — estimate the real-world time an average person would need, including setup, cleanup, and the friction/interruptions a task like this actually has, not the theoretical fastest-case minimum. Do NOT shrink your estimates to fit any time budget the user mentioned earlier in the conversation — if the honest total exceeds what they said they have available, keep the honest numbers anyway; a realistic total that reveals a shortfall is more useful than a fake one that just fits. Do the arithmetic explicitly for anything distance/quantity-based instead of guessing a round number — e.g. walking somewhere: ~2 minutes per city block at a normal pace, and remember a round trip is there AND back (5 blocks each way is ~20 minutes total, not 10), plus time actually spent once there (shopping, waiting) and time to gather/put on anything needed before leaving (bags, shoes, list).
  - "priority": one of "low", "medium", or "high" — estimate this per step based on how time-sensitive, effortful, or consequential it actually is; don't default every step to the same value. A quick, low-stakes step (e.g. "grab a reusable bag") is "low"; a step blocking everything after it, physically demanding, or with a real deadline/consequence if skipped (e.g. "preheat the oven" before a step that needs it, or a step that has to happen before a store closes) is "high"; most ordinary steps are "medium".
Respond with ONLY the JSON object, no other text, matching this exact shape: {"taskTitle":"...","taskDescription":"...","steps":[{"title":"...","minutes":10,"priority":"medium"}]}`
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

  const priority = parsePlanStepPriority(candidate.priority)
  if (!priority) return null

  return { title, minutes, priority }
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
