var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/ai.ts
var MODELS = {
  // GROQ — 8 keys (6 full + Bkc 70b-only + MoodWire 8b-only)
  "qwen/qwen3-32b": { provider: "groq", rpm: 30, rpd: 1e3, tier: "T1" },
  "llama-3.3-70b-versatile": { provider: "groq", rpm: 30, rpd: 1e3, tier: "T2" },
  "meta-llama/llama-4-scout-17b-16e-instruct": { provider: "groq", rpm: 30, rpd: 5e3, tier: "T4" },
  "llama-3.1-8b-instant": { provider: "groq", rpm: 30, rpd: 14400, tier: "T5" },
  // GEMINI — 6 independent accounts × 15 RPM per model = 90 RPM each
  "gemma-4-31b-it": { provider: "gemini", rpm: 15, rpd: 1500, tier: "T1" },
  "gemini-2.5-pro": { provider: "gemini", rpm: 2, rpd: 50, tier: "T1" },
  "gemma-4-26b-a4b-it": { provider: "gemini", rpm: 15, rpd: 1500, tier: "T2" },
  "gemini-2.5-flash": { provider: "gemini", rpm: 15, rpd: 1500, tier: "T3" },
  "gemini-2.5-flash-lite": { provider: "gemini", rpm: 30, rpd: 1500, tier: "T4" },
  // CEREBRAS — 8 keys × 60/120 RPM = 480/960 RPM fleet
  "gpt-oss-120b": { provider: "cerebras", rpm: 60, rpd: 28800, tier: "T1" },
  "llama3.1-8b": { provider: "cerebras", rpm: 120, rpd: 57600, tier: "T4" }
};
var WATERFALL = {
  T1: [
    "gemma-4-31b-it",
    "gemini-2.5-pro",
    "qwen/qwen3-32b",
    "gpt-oss-120b"
  ],
  T2: [
    "gemma-4-26b-a4b-it",
    "llama-3.3-70b-versatile",
    "gpt-oss-120b"
  ],
  T3: [
    "gemini-2.5-flash",
    "llama-3.3-70b-versatile"
  ],
  T4: [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "gemini-2.5-flash-lite",
    "llama3.1-8b"
  ],
  T5: [
    "llama-3.1-8b-instant",
    "llama3.1-8b"
  ]
};
function getKeys(provider, env) {
  switch (provider) {
    case "groq":
      return [env.GROQ_API_KEY, env.GROQ_API_KEY_2, env.GROQ_API_KEY_3, env.GROQ_API_KEY_4, env.GROQ_API_KEY_5, env.GROQ_API_KEY_6, env.GROQ_API_KEY_7, env.GROQ_API_KEY_8].filter(Boolean);
    case "gemini":
      return [env.GEMINI_API_KEY, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3, env.GEMINI_API_KEY_4, env.GEMINI_API_KEY_5, env.GEMINI_API_KEY_6, env.GEMINI_API_KEY_7].filter(Boolean);
    case "cerebras":
      return [env.CEREBRAS_API_KEY, env.CEREBRAS_API_KEY_2, env.CEREBRAS_API_KEY_3, env.CEREBRAS_API_KEY_4, env.CEREBRAS_API_KEY_5, env.CEREBRAS_API_KEY_6, env.CEREBRAS_API_KEY_7, env.CEREBRAS_API_KEY_8].filter(Boolean);
    case "huggingface":
      return [env.HF_API_TOKEN, env.HF_API_TOKEN_2, env.HF_API_TOKEN_3].filter(Boolean);
    case "together":
      return [env.TOGETHER_API_KEY].filter(Boolean);
    default:
      return [];
  }
}
__name(getKeys, "getKeys");
async function isOnCooldown(kv, modelId, keyIdx) {
  if (!kv) return false;
  const val = await kv.get(`cd::${modelId}::${keyIdx}`);
  if (!val) return false;
  return Date.now() < parseInt(val);
}
__name(isOnCooldown, "isOnCooldown");
async function setCooldown(kv, modelId, keyIdx, ms = 65e3) {
  if (!kv) return;
  await kv.put(`cd::${modelId}::${keyIdx}`, String(Date.now() + ms), { expirationTtl: Math.ceil(ms / 1e3) + 10 });
}
__name(setCooldown, "setCooldown");
async function markDead(kv, modelId, keyIdx) {
  if (!kv) return;
  await kv.put(`dead::${modelId}::${keyIdx}`, "1", { expirationTtl: 86400 });
}
__name(markDead, "markDead");
async function isDead(kv, modelId, keyIdx) {
  if (!kv) return false;
  return !!await kv.get(`dead::${modelId}::${keyIdx}`);
}
__name(isDead, "isDead");
async function getSystemPressure(kv) {
  if (!kv) return 0;
  const total = Object.keys(MODELS).length;
  let onCooldown = 0;
  const checks = Object.keys(MODELS).map(async (m) => {
    const spec = MODELS[m];
    let keyCount = 1;
    if (spec.provider === "groq") keyCount = 8;
    else if (spec.provider === "gemini") keyCount = 7;
    else if (spec.provider === "cerebras") keyCount = 8;
    else if (spec.provider === "huggingface") keyCount = 3;
    for (let i = 0; i < keyCount; i++) {
      if (await isOnCooldown(kv, m, i)) {
        onCooldown++;
        break;
      }
    }
  });
  await Promise.all(checks);
  return onCooldown / total;
}
__name(getSystemPressure, "getSystemPressure");
async function callProvider(modelId, provider, apiKey, messages, options) {
  const stream = options?.stream ?? true;
  const temp = options?.temperature ?? 0.7;
  const maxTok = options?.max_tokens ?? 2048;
  const jsonMode = options?.jsonMode ?? false;
  if (provider === "groq") {
    const body = { model: modelId, messages, temperature: temp, max_tokens: maxTok, stream };
    if (jsonMode && !stream) body.response_format = { type: "json_object" };
    return fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }
  if (provider === "gemini") {
    const sysMsg = messages.find((m) => m.role === "system")?.content || "";
    const userMsg = messages.find((m) => m.role === "user")?.content || messages[messages.length - 1]?.content || "";
    const prompt = sysMsg ? `${sysMsg}

${userMsg}` : userMsg;
    const endpoint = stream ? `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}` : `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const gemBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: temp, maxOutputTokens: options?.maxOutputTokens ?? maxTok }
    };
    if (jsonMode && !stream) gemBody.generationConfig.responseMimeType = "application/json";
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gemBody)
    });
  }
  if (provider === "cerebras") {
    const body = { model: modelId, messages, temperature: temp, max_tokens: maxTok, stream };
    if (jsonMode && !stream) body.response_format = { type: "json_object" };
    return fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }
  if (provider === "huggingface") {
    const userMsg = messages.find((m) => m.role === "user")?.content || "";
    return fetch(`https://api-inference.huggingface.co/v1/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelId, messages, temperature: temp, max_tokens: maxTok, stream: false })
    });
  }
  if (provider === "together") {
    const body = { model: modelId, messages, temperature: temp, max_tokens: maxTok, stream };
    if (jsonMode && !stream) body.response_format = { type: "json_object" };
    return fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }
  throw new Error(`Unknown provider: ${provider}`);
}
__name(callProvider, "callProvider");
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function err(msg, status = 500) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
__name(err, "err");
async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { messages, tier = "T3", options = {} } = body;
    if (!messages || !Array.isArray(messages)) return err("messages array required", 400);
    const kv = env.LB_STATE;
    const chain = WATERFALL[tier] || WATERFALL["T3"];
    const pressure = await getSystemPressure(kv);
    if (pressure > 0.6 && (tier === "T3" || tier === "T4" || tier === "T5")) {
      return err("CIRCUIT_BREAKER_STRESSED: system under load, use cached content", 503);
    }
    if (pressure > 0.8 && tier !== "T1") {
      return err("CIRCUIT_BREAKER_CRITICAL: only T1 served live", 503);
    }
    let lastErr = "All models exhausted";
    for (const modelId of chain) {
      const spec = MODELS[modelId];
      if (!spec) continue;
      const keys = getKeys(spec.provider, env);
      if (!keys.length) continue;
      for (let ki = 0; ki < keys.length; ki++) {
        if (await isDead(kv, modelId, ki)) continue;
        if (await isOnCooldown(kv, modelId, ki)) continue;
        try {
          const res = await callProvider(modelId, spec.provider, keys[ki], messages, options);
          if (res.status === 429) {
            await setCooldown(kv, modelId, ki, 65e3);
            lastErr = `${modelId}[key${ki}] 429`;
            continue;
          }
          if (res.status === 401 || res.status === 403) {
            await markDead(kv, modelId, ki);
            lastErr = `${modelId}[key${ki}] ${res.status} dead`;
            continue;
          }
          if (res.status === 404) {
            lastErr = `${modelId} 404`;
            break;
          }
          if (!res.ok) {
            lastErr = `${modelId}[key${ki}] HTTP ${res.status}`;
            continue;
          }
          return new Response(res.body, {
            status: res.status,
            headers: {
              ...CORS,
              "Content-Type": res.headers.get("Content-Type") || "application/json",
              "X-Model-Used": modelId,
              "X-Provider": spec.provider,
              "X-Key-Index": String(ki)
            }
          });
        } catch (callErr) {
          lastErr = callErr.message;
          continue;
        }
      }
    }
    return err(`BLACKOUT:${lastErr}`, 429);
  } catch (e) {
    return err(e.message || "Internal error", 500);
  }
}
__name(onRequestPost, "onRequestPost");
async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
__name(onRequestOptions, "onRequestOptions");

// api/questions.ts
var CORS2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function err2(msg, status = 500) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...CORS2, "Content-Type": "application/json" } });
}
__name(err2, "err");
function safeParse(str, fallback = []) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}
__name(safeParse, "safeParse");
function mapRowToQuestion(row) {
  return {
    id: row.id,
    exam: row.exam,
    class: row.class,
    subject: row.subject,
    topic: row.topic,
    topic_id: row.topic_id,
    subtopic: row.subtopic,
    type: row.type,
    difficulty_score: row.difficulty_score,
    difficulty_band: row.difficulty_band,
    question: row.question_text,
    // Map to frontend's question field
    options: safeParse(row.options, []),
    correct_answer: row.correct_answer,
    explanation: row.explanation,
    rich_explanation: safeParse(row.rich_explanation, null),
    concept_tags: safeParse(row.concept_tags, []),
    error_trap_type: row.error_trap_type,
    numerical_formula: row.numerical_formula,
    given_values: safeParse(row.given_values, {}),
    final_numerical_value: row.final_numerical_value,
    final_unit: row.final_unit,
    source_exam: row.source_exam,
    confidence: row.confidence ?? 0.8,
    created_at: row.created_at,
    usage_count: 0
  };
}
__name(mapRowToQuestion, "mapRowToQuestion");
async function onRequestPost2({ request, env }) {
  try {
    if (!env.DB) {
      return err2("Cloudflare D1 DB binding is missing or not configured.", 500);
    }
    const body = await request.json();
    const { needs, exam, abilityScore = 1e3 } = body;
    if (!needs || !Array.isArray(needs)) {
      return err2("needs array required", 400);
    }
    if (!exam) {
      return err2("exam string required", 400);
    }
    let normalizedExam = "JEE";
    const eLower = String(exam).toLowerCase();
    if (eLower.includes("neet")) {
      normalizedExam = "NEET";
    } else if (eLower.includes("foundation") || eLower.includes("school") || eLower.includes("class") || eLower.includes("board")) {
      normalizedExam = "Foundation";
    } else {
      normalizedExam = "JEE";
    }
    const allQuestions = [];
    const selectedIds = /* @__PURE__ */ new Set();
    for (const group of needs) {
      const { topic, count, topic_id } = group;
      if (!topic || !count) continue;
      const targetTopicId = topic_id || topic.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const comfortCount = Math.max(0, Math.floor(count * 0.7));
      const challengeCount = Math.max(0, Math.floor(count * 0.2));
      const stretchCount = Math.max(0, count - comfortCount - challengeCount);
      const targets = [
        { rating: abilityScore - 150, count: comfortCount, label: "Comfort" },
        { rating: abilityScore, count: challengeCount, label: "Challenge" },
        { rating: abilityScore + 250, count: stretchCount, label: "Stretch" }
      ];
      const groupQuestions = [];
      for (const target of targets) {
        if (target.count <= 0) continue;
        let needed = target.count;
        let windowSize = 150;
        const maxWindow = 1200;
        while (needed > 0 && windowSize <= maxWindow) {
          const minScore = target.rating - windowSize;
          const maxScore = target.rating + windowSize;
          let queryStr = `
            SELECT * FROM questions 
            WHERE exam = ? 
              AND (topic_id = ? OR topic = ?) 
              AND difficulty_score BETWEEN ? AND ?
          `;
          const params = [normalizedExam, targetTopicId, topic, minScore, maxScore];
          if (selectedIds.size > 0) {
            const placeholders = Array.from({ length: selectedIds.size }).map(() => "?").join(",");
            queryStr += ` AND id NOT IN (${placeholders})`;
            params.push(...Array.from(selectedIds));
          }
          queryStr += ` ORDER BY RANDOM() LIMIT ?`;
          params.push(needed);
          const dbRes = await env.DB.prepare(queryStr).bind(...params).all();
          if (dbRes.success && dbRes.results && dbRes.results.length > 0) {
            for (const row of dbRes.results) {
              groupQuestions.push(mapRowToQuestion(row));
              selectedIds.add(row.id);
              needed--;
            }
          }
          windowSize += 150;
        }
        if (needed > 0) {
          let fallbackQuery = `
            SELECT * FROM questions 
            WHERE exam = ? 
              AND (topic_id = ? OR topic = ?)
          `;
          const params = [normalizedExam, targetTopicId, topic];
          if (selectedIds.size > 0) {
            const placeholders = Array.from({ length: selectedIds.size }).map(() => "?").join(",");
            fallbackQuery += ` AND id NOT IN (${placeholders})`;
            params.push(...Array.from(selectedIds));
          }
          fallbackQuery += ` ORDER BY RANDOM() LIMIT ?`;
          params.push(needed);
          const dbRes = await env.DB.prepare(fallbackQuery).bind(...params).all();
          if (dbRes.success && dbRes.results && dbRes.results.length > 0) {
            for (const row of dbRes.results) {
              groupQuestions.push(mapRowToQuestion(row));
              selectedIds.add(row.id);
              needed--;
            }
          }
        }
      }
      allQuestions.push(...groupQuestions);
    }
    return new Response(JSON.stringify(allQuestions), {
      status: 200,
      headers: {
        ...CORS2,
        "Content-Type": "application/json"
      }
    });
  } catch (e) {
    return err2(e.message || "Internal error", 500);
  }
}
__name(onRequestPost2, "onRequestPost");
async function onRequestOptions2() {
  return new Response(null, { status: 204, headers: CORS2 });
}
__name(onRequestOptions2, "onRequestOptions");

// ../.wrangler/tmp/pages-bMC6g0/functionsRoutes-0.22175406267768671.mjs
var routes = [
  {
    routePath: "/api/ai",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/ai",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/questions",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/questions",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  }
];

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-EscK3A/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-EscK3A/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.37710790093780744.mjs.map
