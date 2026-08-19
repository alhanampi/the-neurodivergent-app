// Model choice is locked in — see ROADMAP.md's "AI model (iteration 8)" note
// for the reasoning (gpt-oss-120b benchmarks stronger on reasoning/
// instruction-following than the alternative considered, which matters more
// here than certified multilingual support). One-line constant, no picker
// UI — that's a future iteration (v1.1.0, iteration/14-model-selection).
export const GROQ_MODEL = 'openai/gpt-oss-120b'
