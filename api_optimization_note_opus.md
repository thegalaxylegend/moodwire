# Note for Opus 4.6: API Token Optimization & Error Handling

Hey Opus, here is an analysis of the API token usage and pipeline errors observed during the recent Question Engine generation logs. Please prioritize these optimizations:

## 1. Dead Key Culling (Latency & Logic Fix)
During generation, we are seeing many logs like this:
```
[Groq] Key 6 (6 total) failed: 401 {"error":{"message":"Invalid API Key","type":"invalid_request_error","code":"invalid_api_key"}} 401
[Groq] Key 6 is INVALID (401). Please check VITE_GROQ_API_KEY_6
All AI providers failed: Error: OpenAI API Key not found. Please set VITE_OPENAI_API_KEY.
```
- **Token Impact:** 401 or Missing Key errors **do not waste tokens** since the provider immediately rejects the request before LLM processing.
- **Problem:** They do, however, cause massive latency and log spam. By repeatedly rotating into a known invalid key or a missing key, the generation thread blocks needlessly.
- **Action Item:** Keep a registry of invalid/dead keys in `gemini.ts` / `groq.ts` / `openai.ts`. If an API call fails with `401 Unauthorized` or `invalid_api_key`, permanently remove that index array from the rotation pool for the lifetime of the server process so it is never tried again. Also gracefully skip providers if their keys are completely unconfigured rather than throwing repeated tracebacks.

## 2. Token Waste on LLM JSON Parse Failures
There is clear token waste occurring here:
```
[Groq] Key 2 (6 total) failed: 400 {"error":{"message":"Failed to generate JSON. Please adjust your prompt. See 'failed_generation' for more details.","type":"invalid_request_error","code":"json_validate_failed"...
```
- **Token Impact:** The LLM generates the entire output, consuming *generation* tokens, but the resulting syntax is rejected by Groq's strict JSON mode enforcing constraints. The engine then has to retry. Over 4 retries, this leads to a massive waste of API tokens on discarded generations.
- **Action Item:** The overarching prompt strategy or system instructions need further tuning. We must ensure the LLM strictly understands it must generate a clean JSON schema and escape any problematic quotes, especially inside formula fields or when using the `<br>` tag.

## 3. Token Waste on Heuristic Rejections
We repeatedly see:
```
[QuestionEngine] Heuristic rejection: Options too short (avg 3 chars).
[QuestionEngine] Heuristic rejection: Quality too low.
```
- **Token Impact:** Again, the system spends a full generation request to generate the question, but the initial validation layer immediately rejects it. Each failure burns hundreds of output tokens. 
- **Action Item:** Inject strict constraints into the prompt specifically discouraging these heuristic failures (e.g. "Options MUST be descriptive and have an average length of at least 15 characters", "You must generate a completely unique, highly complex question"). Catching it via prompt engineering is much cheaper and faster than catching it via code-level heuristics.

## Summary
The pipeline’s *accuracy* is phenomenal (>93%), but the *efficiency* needs work. Token waste is almost exclusively caused by JSON formatting failures and heuristic rule violations burning tokens before discarding. The 401 key errors don't waste tokens, but they make the logs extremely noisy and slow the pipeline to a crawl.
