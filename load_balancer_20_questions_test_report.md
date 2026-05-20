# ExamCompass Load Balancer & JEE Advanced Question Generation Test Report

**Date**: 19/5/2026, 4:33:34 pm
**Target Level**: JEE Advanced (Class 12)
**Ability Score Target**: 2700 / 3000 (Band 12 — Expert Synthesis)

## Executive Summary

| Metric | Value |
| :--- | :--- |
| Total Questions Attempted | 20 |
| Status: ✅ APPROVED | {{APPROVED}} |
| Status: 🛠️ REFIXED | {{REFIXED}} |
| Status: ❌ REJECTED | {{REJECTED}} |
| Average Generation Latency | {{AVG_TIME}}s |

--- 

## Detailed Question Audit & Load Balancer Logs

### 1. Rotational Dynamics: Rolling Motion (Physics)

**Status**: ❌ REJECTED
**Generation Latency**: 142.32s

#### Load Balancer & Verification Logs
```text
[LOG] [AI Orchestrator] Routing task to T1 Waterfall...
[LOG] [AI Orchestrator] Routing task to T1 Waterfall...
[LOG] [AI Orchestrator] Routing task to T1 Waterfall...
[LOG] [QuestionEngine] Retrying parallel generation in 2000ms (Attempt 2/3)...
[LOG] [AI Orchestrator] Routing task to T1 Waterfall...
[LOG] [AI Orchestrator] Routing task to T1 Waterfall...
[LOG] [AI Orchestrator] Routing task to T1 Waterfall...
[LOG] [QuestionEngine] Retrying parallel generation in 4000ms (Attempt 3/3)...
[LOG] [AI Orchestrator] Routing task to T1 Waterfall...
[LOG] [AI Orchestrator] Routing task to T1 Waterfall...
[LOG] [AI Orchestrator] Routing task to T1 Waterfall...
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:0 failed (TRANSIENT): [LoadBalancer] API call to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:1 failed (TRANSIENT): [LoadBalancer] API call to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:2 failed (TRANSIENT): [LoadBalancer] API call to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [QuestionEngine] All parallel candidates failed deterministic checks. Retrying batch...
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:1 retry failed (TRANSIENT): [LoadBalancer] API call retry to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:0 retry failed (TRANSIENT): [LoadBalancer] API call retry to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:0 retry failed (TRANSIENT): [LoadBalancer] API call retry to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [QuestionEngine] All parallel candidates failed deterministic checks. Retrying batch...
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:2 retry failed (TRANSIENT): [LoadBalancer] API call retry to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:2 retry failed (TRANSIENT): [LoadBalancer] API call retry to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:1 retry failed (TRANSIENT): [LoadBalancer] API call retry to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:3 retry failed (PROVIDER_OVERLOAD): [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googl
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:3 retry failed (PROVIDER_OVERLOAD): [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googl
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:4 retry failed (PROVIDER_OVERLOAD): [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googl
[WARN/REJECT] [LoadBalancer] gemma-4-31b-it key:3 retry failed (TRANSIENT): [LoadBalancer] API call retry to gemma-4-31b-it timed out after 35s
[WARN/REJECT] [QuestionEngine] All parallel candidates failed deterministic checks. Retrying batch...
```

---

