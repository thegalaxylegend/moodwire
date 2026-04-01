---
heroImage: "/blog-images/continuity-and-differentiability-class-12-notes.webp"
title: "Continuity and Differentiability Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide"
description: "Accelerate your Mathematics revision with our Continuity and Differentiability guide. Includes my secret study hacks, conceptual maps, and high-yield MCQs for last-minute success."
category: "Mathematics"
keywords: "Continuity and Differentiability class 12 notes, Continuity and Differentiability quick revision, Continuity and Differentiability 2026, Continuity and Differentiability JEE 2026, Continuity and Differentiability notes for JEE, class 12 Mathematics revision, Continuity and Differentiability formula sheet, Continuity and Differentiability MCQs"
date: "2026-04-01"
practice_link: "/class-11/mathematics/continuity-and-differentiability-class-12-notes"
---

![Continuity and Differentiability Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog-images/continuity-and-differentiability-class-12-notes.webp)

*Last Updated: 2026-04-01*


## 📋 Table of Contents

- [⚡ Formula Bank](#-formula-bank)
- [🪤 The 5 Mistakes That Cost Marks](#-the-5-mistakes-that-cost-marks)
- [✏️ 3 Solved PYQs](#-3-solved-pyqs)
- [🧠 The One Thing Most Students Get Wrong](#-the-one-thing-most-students-get-wrong)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
- [📝 Practice MCQs](#-practice-mcqs)


## <a id="-formula-bank"></a>⚡ Formula Bank

- **Continuity at a Point:** $$\lim_{x \to a} f(x) = f(a)$$ — $f(x)$ is continuous at $x = a$ if the limit of $f(x)$ as $x$ approaches $a$ is equal to $f(a)$.

 - **Left-Hand Continuity:** $$\lim_{x \to a^-} f(x) = f(a)$$ — $f(x)$ is left-hand continuous at $x = a$ if the limit of $f(x)$ as $x$ approaches $a$ from the left is equal to $f(a)$.

 - **Right-Hand Continuity:** $$\lim_{x \to a^+} f(x) = f(a)$$ — $f(x)$ is right-hand continuous at $x = a$ if the limit of $f(x)$ as $x$ approaches $a$ from the right is equal to $f(a)$.

 - **Differentiability at a Point:** $$f'(a) = \lim_{h \to 0} \frac{f(a + h) - f(a)}{h}$$ — $f(x)$ is differentiable at $x = a$ if the limit of $\frac{f(a + h) - f(a)}{h}$ as $h$ approaches $0$ exists.

 - **Derivative of a Function:** $$f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$$ — The derivative of $f(x)$ with respect to $x$ is the limit of $\frac{f(x + h) - f(x)}{h}$ as $h$ approaches $0$.

 - **Geometric Interpretation of Derivative:** $$f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h} = \tan(\theta)$$ — The derivative of $f(x)$ at $x$ is the slope of the tangent line to the graph of $f(x)$ at $x$.

 - **Algebra of Derivatives - Sum:** $$\frac{d}{dx} (f(x) + g(x)) = f'(x) + g'(x)$$ — The derivative of the sum of two functions is the sum of their derivatives.

 - **Algebra of Derivatives - Difference:** $$\frac{d}{dx} (f(x) - g(x)) = f'(x) - g'(x)$$ — The derivative of the difference of two functions is the difference of their derivatives.

 - **Algebra of Derivatives - Product:** $$\frac{d}{dx} (f(x) \cdot g(x)) = f'(x) \cdot g(x) + f(x) \cdot g'(x)$$ — The derivative of the product of two functions is the derivative of the first function times the second function plus the first function times the derivative of the second function.

 - **Algebra of Derivatives - Quotient:** $$\frac{d}{dx} \left(\frac{f(x)}{g(x)}\right) = \frac{f'(x) \cdot g(x) - f(x) \cdot g'(x)}{(g(x))^2}$$ — The derivative of the quotient of two functions is the derivative of the numerator times the denominator minus the numerator times the derivative of the denominator, all divided by the square of the denominator.

 - **Chain Rule:** $$\frac{d}{dx} f(g(x)) = f'(g(x)) \cdot g'(x)$$ — The derivative of a composite function is the derivative of the outer function evaluated at the inner function times the derivative of the inner function.



## <a id="-the-5-mistakes-that-cost-marks"></a>🪤 The 5 Mistakes That Cost Marks

- **Mistake 1:** Forgetting to check the continuity of a function at a point before checking its differentiability.

 - *Costs:* 2-4 marks

 - *Fix:* Always check if the function is continuous at the given point by ensuring $\lim_{x \to a} f(x) = f(a)$, then proceed to check if the function is differentiable by checking if $\lim_{h \to 0} \frac{f(a + h) - f(a)}{h}$ exists.

 - **Mistake 2:** Incorrectly applying the definition of a derivative, especially when dealing with piecewise functions or absolute value functions.

 - *Costs:* 4-6 marks

 - *Fix:* Be meticulous when applying the definition of a derivative, especially for functions like $f(x) = |x|$, where $f'(x) = \frac{x}{|x|}$ for $x \

eq 0$ and is undefined at $x = 0$.

 - **Mistake 3:** Not considering the possibility of a function being continuous but not differentiable at a point, such as at $x = 0$ for $f(x) = |x|$.

 - *Costs:* 3-5 marks

 - *Fix:* Remember that continuity does not imply differentiability. A function can be continuous at a point but not differentiable, such as $f(x) = |x|$ at $x = 0$. Check for sharp turns or corners.

 - **Mistake 4:** Incorrectly determining the intervals of continuity and differentiability for functions involving trigonometric, exponential, or logarithmic functions.

 - *Costs:* 4-6 marks

 - *Fix:* Be aware of the domains of these functions. For example, $f(x) = \log(x)$ is continuous and differentiable for $x > 0$, but not at $x = 0$.

 - **Mistake 5:** Failing to apply the chain rule correctly when finding derivatives of composite functions, which can lead to incorrect calculations of derivatives and thus affect questions on continuity and differentiability.

 - *Costs:* 5-8 marks

 - *Fix:* Ensure to apply the chain rule correctly: if $f(x) = g(h(x))$, then $f'(x) = g'(h(x)) \cdot h'(x)$. Double-check the derivatives of the outer and inner functions.



## <a id="-3-solved-pyqs"></a>✏️ 3 Solved PYQs

- **Q1:** If $f(x) = \frac{x^2 - 4}{x - 2}$, then what is $\lim_{x \to 2} f(x)$?

 - **Trap:** Cancelling the terms without considering the conditions for cancellation.

 - **Solution:** 

 To find $\lim_{x \to 2} f(x)$, first we need to factorize $x^2 - 4$. 

 $x^2 - 4$ can be written as $(x+2)(x-2)$. 

 So, $f(x) = \frac{(x+2)(x-2)}{x-2}$. 

 $$\lim_{x \to 2} f(x) = \lim_{x \to 2} \frac{(x+2)(x-2)}{x-2}$$

 After cancelling $(x-2)$ from numerator and denominator, we get 

 $$\lim_{x \to 2} f(x) = \lim_{x \to 2} (x+2)$$

 Putting $x = 2$, we get 

 $$\lim_{x \to 2} f(x) = 2 + 2 = 4$$

 - **Answer:** $4$

 - **Q2:** Prove that $f(x) = |x - 1|$ is continuous but not differentiable at $x = 1$.

 - **Trap:** Not understanding the definition of continuity and differentiability.

 - **Solution:** 

 For continuity at $x = 1$, we need to check 

 $$\lim_{x \to 1^-} f(x) = \lim_{x \to 1^+} f(x) = f(1)$$

 For $x < 1$, $f(x) = -(x - 1)$ and for $x \geq 1$, $f(x) = x - 1$.

 $$\lim_{x \to 1^-} f(x) = \lim_{x \to 1^-} -(x - 1) = 0$$

 $$\lim_{x \to 1^+} f(x) = \lim_{x \to 1^+} (x - 1) = 0$$

 $$f(1) = 1 - 1 = 0$$

 So, $f(x)$ is continuous at $x = 1$.

 For differentiability at $x = 1$, we need to check 

 $$\lim_{h \to 0^-} \frac{f(1 + h) - f(1)}{h} = \lim_{h \to 0^+} \frac{f(1 + h) - f(1)}{h}$$

 $$\lim_{h \to 0^-} \frac{-(h) - 0}{h} = \lim_{h \to 0^-} \frac{-h}{h} = -1$$

 $$\lim_{h \to 0^+} \frac{h - 0}{h} = \lim_{h \to 0^+} \frac{h}{h} = 1$$

 Since the two limits are not equal, $f(x)$ is not differentiable at $x = 1$.

 - **Answer:** Proved

 - **Q3:** If $f(x) = \begin{cases} x^2 + 1, & x \leq 1 \ 2x - 1, & x > 1 \end{cases}$, then find $\lim_{x \to 1} f(x)$ and check if $f(x)$ is continuous at $x = 1$.

 - **Trap:** Not applying the correct formula for the left and right hand limits.

 - **Solution:** 

 To find $\lim_{x \to 1} f(x)$, we need to find $\lim_{x \to 1^-} f(x)$ and $\lim_{x \to 1^+} f(x)$.

 $$\lim_{x \to 1^-} f(x) = \lim_{x \to 1^-} (x^2 + 1) = 1^2 + 1 = 2$$

 $$\lim_{x \to 1^+} f(x) = \lim_{x \to 1^+} (2x - 1) = 2(1) - 1 = 1$$

 Since $\lim_{x \to 1^-} f(x) \

eq \lim_{x \to 1^+} f(x)$, $\lim_{x \to 1} f(x)$ does not exist.

 For continuity at $x = 1$, we need to check 

 $$\lim_{x \to 1^-} f(x) = \lim_{x \to 1^+} f(x) = f(1)$$

 Since $\lim_{x \to 1^-} f(x) \

eq \lim_{x \to 1^+} f(x)$, $f(x)$ is not continuous at $x = 1$.

 - **Answer:** $\lim_{x \to 1} f(x)$ does not exist and $f(x)$ is not continuous at $x = 1$



## <a id="-the-one-thing-most-students-get-wrong"></a>🧠 The One Thing Most Students Get Wrong

- **The Core Concept:** Continuity and differentiability are two fundamental concepts in calculus that are often misunderstood. A function $f(x)$ is said to be continuous at a point $x=a$ if $lim_{x \to a} f(x) = f(a)$. On the other hand, differentiability implies that the function is smooth and has a tangent line at the given point. 

 - **What 85% scorers do:** Most students check for continuity by just ensuring that the function is defined at the given point and that the left and right limits are equal, i.e., $lim_{x \to a^{-}} f(x) = lim_{x \to a^{+}} f(x) = f(a)$. However, they often neglect to check if the function is well-defined and finite at the given point, which can lead to incorrect conclusions. For example, consider the function $f(x) = \rac{1}{x}$ at $x=0$. Many students would incorrectly conclude that the function is continuous at $x=0$ because the left and right limits are equal, without realizing that the function is not defined at $x=0$. 

 - **What 95% scorers do:** Top scorers, on the other hand, understand that continuity is a necessary condition for differentiability, but not sufficient. They check for continuity by ensuring that the function satisfies the following conditions:

 * The function is defined at the given point, i.e., $f(a)$ is a finite number.

 * The limit of the function as $x$ approaches $a$ exists, i.e., $lim_{x \to a} f(x)$ is a finite number.

 * The limit of the function as $x$ approaches $a$ is equal to the value of the function at $a$, i.e., $lim_{x \to a} f(x) = f(a)$.

 They also understand that differentiability requires the existence of the derivative at the given point, which can be checked using the definition of a derivative: 

 $$f'(a) = lim_{h \to 0} \rac{f(a+h) - f(a)}{h}$$

 For instance, consider the function $f(x) = |x|$ at $x=0$. While the function is continuous at $x=0$, it is not differentiable because the limit $$lim_{h \to 0} \rac{f(0+h) - f(0)}{h} = lim_{h \to 0} \rac{|h|}{h}$$ does not exist. 

 Top scorers also recognize that the converse is not true, i.e., a function can be differentiable at a point without being continuous at that point. However, this is not possible, and if a function is differentiable at a point, it must also be continuous at that point.



## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box

- $\lim_{x\to a} f(x) = f(a)$ for continuity at $x = a$

 - $f(x)$ is continuous at $x = a$ if $\lim_{x\to a^-} f(x) = \lim_{x\to a^+} f(x) = f(a)$

 - $f'(a) = \lim_{h\to 0} \frac{f(a + h) - f(a)}{h}$ for differentiability at $x = a$

 - If $f'(a)$ exists, then $f(x)$ is continuous at $x = a$, but the converse is not always true

 - $f(x)$ is differentiable at $x = a$ if $f(x)$ is continuous at $x = a$ and $f'(a)$ exists

 - Key facts:

 - A function can be continuous at a point but not differentiable

 - Differentiability implies continuity, but continuity does not necessarily imply differentiability

 - If $f(x)$ and $g(x)$ are differentiable at $x = a$, then $f(x) + g(x)$, $f(x) - g(x)$, $f(x) \times g(x)$, and $\frac{f(x)}{g(x)}$ are also differentiable at $x = a$

 - Common mistakes:

 - Assuming that if a function is continuous, it is automatically differentiable

 - Forgetting to check the existence of the limit when checking for continuity and differentiability



## <a id="-practice-mcqs"></a>📝 Practice MCQs


**1. If f(x) = |x|, then at x = 0, the function is**

- A) Continuous and differentiable
- B) Continuous but not differentiable
- C) Differentiable but not continuous
- D) Neither continuous nor differentiable

**Answer:** B) The function f(x) = |x| is continuous at x = 0 because the left-hand limit, right-hand limit, and function value at x = 0 are all equal to 0. However, it is not differentiable at x = 0 because the left-hand derivative and right-hand derivative are not equal.

---

**2. If f(x) = x^2 sin(1/x) for x ≠ 0 and f(0) = 0, then the function is**

- A) Continuous but not differentiable at x = 0
- B) Differentiable but not continuous at x = 0
- C) Continuous and differentiable at x = 0
- D) Neither continuous nor differentiable at x = 0

**Answer:** C) The function is continuous at x = 0 because the limit of f(x) as x approaches 0 is equal to f(0) = 0. Additionally, the function is differentiable at x = 0 because the limit of [f(x) - f(0)] / (x - 0) as x approaches 0 exists.

---

**3. Let f(x) = x^3 - 3x^2 + 2x + 1. If g(x) = f |x|, then g(x) is**

- A) Continuous and differentiable for all x
- B) Continuous for all x but differentiable only for x ≠ 0
- C) Continuous for all x but differentiable only for x > 0
- D) Differentiable for all x but continuous only for x ≠ 0

**Answer:** B) The function g(x) = f|x| is continuous for all x because the composition of continuous functions is continuous. However, g(x) is not differentiable at x = 0 because the left-hand derivative and right-hand derivative are not equal.

---

**4. If f(x) = {x^2 - 1, x < 0; x + 1, x ≥ 0}, then the function is**

- A) Continuous and differentiable at x = 0
- B) Continuous at x = 0 but not differentiable
- C) Differentiable at x = 0 but not continuous
- D) Neither continuous nor differentiable at x = 0

**Answer:** B) The function f(x) is continuous at x = 0 because the left-hand limit, right-hand limit, and function value at x = 0 are all equal to 1. However, the function is not differentiable at x = 0 because the left-hand derivative and right-hand derivative are not equal.

---

**5. If f(x) = {x sin(1/x), x ≠ 0; 0, x = 0}, then the function is**

- A) Continuous for all x but differentiable only for x ≠ 0
- B) Differentiable for all x but continuous only for x ≠ 0
- C) Continuous and differentiable for all x
- D) Neither continuous nor differentiable at x = 0

**Answer:** A) The function f(x) is continuous for all x because the limit of f(x) as x approaches 0 is equal to f(0) = 0. However, the function is not differentiable at x = 0 because the limit of [f(x) - f(0)] / (x - 0) as x approaches 0 does not exist.



---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Continuity and Differentiability Full Mock Test**](/class-11/mathematics/continuity-and-differentiability-class-12-notes) now and track your progress against thousands of students.


---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/continuity-and-differentiability-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
