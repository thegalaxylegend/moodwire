---
heroImage: "/blog-images/differential-equations-class-12-notes.webp"
title: "Differential Equations Class 12 Exam Prep Revision — Grandmaster Guide"
description: "Differential Equations Class 12 Exam Prep Revision — Grandmaster Guide Revision Notes. Last Updated: 2026-04-20."
category: "Exam Notes"
date: "2026-04-20"
practice_link: "/practice/differential-equations-class-12-notes"
manualReview: false
---

## ⚡ Formula Bank
- Differential equation: dy/dx = f(x,y)
- Separable variables: dy/f(y) = dx/g(x)
- Homogeneous equation: dy/dx = f(x/y)
- Linear equation: dy/dx + Py = Q
- Bernoulli's equation: dy/dx + Py = Qyⁿ
- Exact equation: ∂M/∂y = ∂N/∂x
- Integrating factor: I.F = eⁱ∫Pdx
- Solution of linear equation: y(I.F) = ∫Q(I.F)dx + c
- Euler's method: yₙ₊₁ = yₙ + hf(xₙ,yₙ)
- Runge-Kutta method: yₙ₊₁ = yₙ + (1/6)(k₁ + 2k₂ + 2k₃ + k₄)
- Laplace transform: F(s) = ∫₀∞ e⁻sx f(x) dx
- Inverse Laplace transform: f(x) = (1/2πi) ∫γ-ie⁺sx F(s) ds

## 🪤 The 5 Mistakes That Cost Marks
- Not checking the differential equation for exactness
- Forgetting to multiply by the integrating factor
- Not using the correct method for solving the differential equation
- Not applying the boundary conditions correctly
- Not simplifying the final solution

## ✏️ 3 Solved PYQs
- Solve the differential equation: dy/dx = (x+y)/(x-y)
  Step 1: Put x+y = v, so dx/dy = dv/dy - 1
  Step 2: Substitute ∈ the differential equation: dv/dy - 1 = v/(v-2y)
  Step 3: Simplify and solve: v = 2y + ce²ᵞ
  Step 4: Substitute back x+y = v: x+y = 2y + ce²ᵞ
  Step 5: Simplify: x = y + ce²ᵞ
- Solve the differential equation: (dy/dx) = (x²-y²)/(x+y)
  Step 1: Put x²-y² = u, so 2x-2y(dy/dx) = du/dx
  Step 2: Substitute ∈ the differential equation: 2x-2y(dy/dx) = (u)/(x+y)
  Step 3: Simplify and solve: 2x-2y(dy/dx) = (x²-y²)/(x+y)
  Step 4: Substitute back u = x²-y²: 2x-2y(dy/dx) = u/(x+y)
  Step 5: Simplify: 2x-2y(dy/dx) = (x²-y²)/(x+y)
- Solve the differential equation: (dy/dx) + (y/x) = x³y
  Step 1: Put y = vx, so dy/dx = v + x(dv/dx)
  Step 2: Substitute ∈ the differential equation: v + x(dv/dx) + v = x³vx
  Step 3: Simplify and solve: x(dv/dx) = x³v - 2v
  Step 4: Separate variables: dv/v = (x³-2)dx/x
  Step 5: Integrate: ∫dv/v = ∫(x³-2)dx/x

## 🧠 The One Thing Most Students Get Wrong
- Most students get wrong the application of the integrating factor ∈ linear differential equations
- The integrating factor is eⁱ∫Pdx, where P is the coefficient of y ∈ the differential equation
- For example, ∈ the differential equation dy/dx + 2y = x, the integrating factor is eⁱ∫2dx = e²ˣ
- Multiplying the differential equation by the integrating factor, we get: e²ˣ(dy/dx) + 2e²ˣy = xe²ˣ
- This can be written as: d/dx(ye²ˣ) = xe²ˣ
- Integrating both sides, we get: ye²ˣ = ∫xe²ˣ dx + c

## 👁️ Ayush's Note
- To solve differential equations quickly, use the following shortcuts:
  - For separable variables, separate the variables and integrate
  - For homogeneous equations, put y = vx and solve
  - For linear equations, use the integrating factor
  - For exact equations, use the test for exactness and solve
- Also, use the following formulas:
  - ∫eⁱˣ dx = eⁱˣ
  - ∫e⁻ˣ dx = -e⁻ˣ
  - ∫(1/x) dx = ln|x|
- And, practice the following types of questions:
  - Solving differential equations using various methods
  - Finding the general solution and the particular solution
  - Applying boundary conditions to find the particular solution

## 🔁 Last 5 Minutes Box
- Revision of formulas: dy/dx = f(x,y), dy/f(y) = dx/g(x), etc.
- Revision of methods: separable variables, homogeneous equation, linear equation, etc.
- Revision of shortcuts: using integrating factor, using test for exactness, etc.
- Practice of solving differential equations quickly
- Practice of applying boundary conditions to find the particular solution

## 📝 Practice MCQs
**1. The differential equation dy/dx = (x+y)/(x-y) has the solution**
- A) x+y = ce²ˣ
- B) x-y = ce²ˣ
- C) x+y = 2y + ce²ᵞ
- D) x-y = 2y + ce²ᵞ
**Answer: C) x+y = 2y + ce²ᵞ**
**2. The differential equation (dy/dx) = (x²-y²)/(x+y) has the solution**
- A) x²-y² = (x+y)² + c
- B) x²-y² = (x+y)² - c
- C) x²-y² = (x+y) + c
- D) x²-y² = (x+y) - c
**Answer: A) x²-y² = (x+y)² + c**
**3. The differential equation (dy/dx) + (y/x) = x³y has the solution**
- A) y = (x⁴/4 + c)/x
- B) y = (x⁴/4 - c)/x
- C) y = (x⁴/4 + c)x
- D) y = (x⁴/4 - c)x
**Answer: A) y = (x⁴/4 + c)/x**
**4. The differential equation dy/dx = (x+y)/(x-y) is**
- A) Homogeneous
- B) Linear
- C) Exact
- D) Separable
**Answer: A) Homogeneous**
**5. The differential equation (dy/dx) + (y/x) = x³y is**
- A) Homogeneous
- B) Linear
- C) Exact
- D) Bernoulli's equation
**Answer: B) Linear**

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/practice/differential-equations-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
