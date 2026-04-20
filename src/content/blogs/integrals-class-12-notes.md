---
heroImage: "/blog-images/integrals-class-12-notes.webp"
title: "Integrals Class 12 Exam Prep Revision — Grandmaster Guide"
description: "Integrals Class 12 Exam Prep Revision — Grandmaster Guide Revision Notes. Last Updated: 2026-04-20."
category: "Exam Notes"
date: "2026-04-20"
practice_link: "/practice/integrals-class-12-notes"
manualReview: false
---

## ⚡ Formula Bank
- $\int \frac{1}{x} dx = \ln|x| + C$
- $\int e^x dx = e^x + C$
- $\int \sin x dx = -\cos x + C$
- $\int \cos x dx = \sin x + C$
- $\int \tan x dx = -\ln|\cos x| + C$
- $\int \frac{1}{\sqrt{1-x^2}} dx = \sin^{-1}x + C$
- $\int \frac{1}{1+x^2} dx = \tan^{-1}x + C$
- $\int \frac{1}{x\sqrt{x^2-1}} dx = \sec^{-1}x + C$
- $\int \frac{1}{x\sqrt{x^2-1}} dx = \cosh^{-1}x + C$
- $\int x^n dx = \frac{x^{n+1}}{n+1} + C$, $n \neq -1$
- $\int \frac{1}{x^2+a^2} dx = \frac{1}{a} \tan^{-1} \frac{x}{a} + C$
- $\int \frac{1}{x^2-a^2} dx = \frac{1}{2a} \ln \left| \frac{x-a}{x+a} \right| + C$
- $\int \sqrt{a^2-x^2} dx = \frac{x}{2} \sqrt{a^2-x^2} + \frac{a^2}{2} \sin^{-1} \frac{x}{a} + C$
- $\int \sqrt{x^2-a^2} dx = \frac{x}{2} \sqrt{x^2-a^2} - \frac{a^2}{2} \ln \left| x + \sqrt{x^2-a^2} \right| + C$
- $\int \sqrt{x^2+a^2} dx = \frac{x}{2} \sqrt{x^2+a^2} + \frac{a^2}{2} \ln \left| x + \sqrt{x^2+a^2} \right| + C$

## 🪤 The 5 Mistakes That Cost Marks
- Not checking the limits of integration
- Forgetting to add the constant of integration
- Not using the correct substitution or formula
- Not simplifying the integral before evaluating it
- Not using the properties of definite integrals to simplify the problem

## ✏️ 3 Solved PYQs
- **PYQ 1:** Evaluate $\int \frac{1}{x^2+4x+5} dx$
  - Let $x^2+4x+5 = (x+2)^2+1$
  - $\int \frac{1}{x^2+4x+5} dx = \int \frac{1}{(x+2)^2+1} dx$
  - Substitute $x+2 = t$, $dx = dt$
  - $\int \frac{1}{(x+2)^2+1} dx = \int \frac{1}{t^2+1} dt$
  - $\int \frac{1}{t^2+1} dt = \tan^{-1}t + C$
  - $\int \frac{1}{x^2+4x+5} dx = \tan^{-1}(x+2) + C$
- **PYQ 2:** Evaluate $\int \frac{x}{x^2+1} dx$
  - Let $u = x^2+1$, $du = 2x dx$
  - $\int \frac{x}{x^2+1} dx = \frac{1}{2} \int \frac{1}{u} du$
  - $\frac{1}{2} \int \frac{1}{u} du = \frac{1}{2} \ln|u| + C$
  - $\int \frac{x}{x^2+1} dx = \frac{1}{2} \ln|x^2+1| + C$
- **PYQ 3:** Evaluate $\int \frac{1}{\sqrt{4x-x^2}} dx$
  - $\int \frac{1}{\sqrt{4x-x^2}} dx = \int \frac{1}{\sqrt{-(x^2-4x)}} dx$
  - $\int \frac{1}{\sqrt{-(x^2-4x)}} dx = \int \frac{1}{\sqrt{-((x-2)^2-4)}} dx$
  - $\int \frac{1}{\sqrt{-((x-2)^2-4)}} dx = \int \frac{1}{\sqrt{4-(x-2)^2}} dx$
  - Substitute $x-2 = t$, $dx = dt$
  - $\int \frac{1}{\sqrt{4-(x-2)^2}} dx = \int \frac{1}{\sqrt{4-t^2}} dt$
  - $\int \frac{1}{\sqrt{4-t^2}} dt = \sin^{-1} \frac{t}{2} + C$
  - $\int \frac{1}{\sqrt{4x-x^2}} dx = \sin^{-1} \frac{x-2}{2} + C$

## 🧠 The One Thing Most Students Get Wrong
- Not using the correct substitution or formula for the given integral
- Many students try to force a substitution that doesn't work, or use a formula that isn't applicable
- It's essential to take a step back and analyze the integral before attempting to solve it
- Consider the properties of the integrand, such as its domain, range, and any patterns or symmetries
- Choose a substitution or formula that simplifies the integral and makes it easier to evaluate

## 👁️ Ayush's Note
- When evaluating definite integrals, make sure to check the limits of integration
- If the limits are not given, try to determine them from the context of the problem
- Use the properties of definite integrals, such as the linearity property and the substitution property, to simplify the problem
- Don't forget to add the constant of integration when evaluating indefinite integrals
- Use the correct notation and formatting when writing the final answer

## 🔁 Last 5 Minutes Box
- Check for any common mistakes, such as forgetting to add the constant of integration
- Review the properties of definite integrals and make sure to apply them correctly
- Take a deep breath and stay focused, it's the last 5 minutes of the exam
- Make sure to answer all the questions, even if you're not sure about the answer
- Use the process of elimination to narrow down the options and increase your chances of getting the correct answer

## 📝 Practice MCQs
**1. What is the value of $\int \frac{1}{x} dx$?**
- A) $\ln|x| + C$
- B) $\frac{1}{x} + C$
- C) $x + C$
- D) $x^2 + C$
**Answer: A) $\ln|x| + C$**
**2. Evaluate $\int \frac{x}{x^2+1} dx$**
- A) $\frac{1}{2} \ln|x^2+1| + C$
- B) $\frac{1}{2} \ln|x| + C$
- C) $\tan^{-1}x + C$
- D) $\sin^{-1}x + C$
**Answer: A) $\frac{1}{2} \ln|x^2+1| + C$**
**3. What is the value of $\int \frac{1}{\sqrt{4x-x^2}} dx$?**
- A) $\sin^{-1} \frac{x-2}{2} + C$
- B) $\cos^{-1} \frac{x-2}{2} + C$
- C) $\tan^{-1} \frac{x-2}{2} + C$
- D) $\sec^{-1} \frac{x-2}{2} + C$
**Answer: A) $\sin^{-1} \frac{x-2}{2} + C$**
**4. Evaluate $\int \frac{1}{x^2+4x+5} dx$**
- A) $\tan^{-1}(x+2) + C$
- B) $\tan^{-1}(x-2) + C$
- C) $\sin^{-1}(x+2) + C$
- D) $\cos^{-1}(x+2) + C$
**Answer: A) $\tan^{-1}(x+2) + C$**
**5. What is the value of $\int \frac{1}{x\sqrt{x^2-1}} dx$?**
- A) $\sec^{-1}x + C$
- B) $\cosh^{-1}x + C$
- C) $\sinh^{-1}x + C$
- D) $\tanh^{-1}x + C$
**Answer: A) $\sec^{-1}x + C$**

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/practice/integrals-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
