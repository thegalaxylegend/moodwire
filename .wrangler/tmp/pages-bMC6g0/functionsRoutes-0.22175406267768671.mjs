import { onRequestOptions as __api_ai_ts_onRequestOptions } from "C:\\Users\\Admin\\Downloads\\Desktop\\functions\\api\\ai.ts"
import { onRequestPost as __api_ai_ts_onRequestPost } from "C:\\Users\\Admin\\Downloads\\Desktop\\functions\\api\\ai.ts"
import { onRequestOptions as __api_questions_ts_onRequestOptions } from "C:\\Users\\Admin\\Downloads\\Desktop\\functions\\api\\questions.ts"
import { onRequestPost as __api_questions_ts_onRequestPost } from "C:\\Users\\Admin\\Downloads\\Desktop\\functions\\api\\questions.ts"

export const routes = [
    {
      routePath: "/api/ai",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_ai_ts_onRequestOptions],
    },
  {
      routePath: "/api/ai",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ai_ts_onRequestPost],
    },
  {
      routePath: "/api/questions",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_questions_ts_onRequestOptions],
    },
  {
      routePath: "/api/questions",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_questions_ts_onRequestPost],
    },
  ]