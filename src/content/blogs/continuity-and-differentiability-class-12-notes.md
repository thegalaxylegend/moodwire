---
heroImage: "/blog-images/continuity-and-differentiability-class-12-notes.webp"
title: "Continuity and Differentiability Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide"
description: "Continuity and Differentiability Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-04-01."
category: "Revision"
date: "2026-04-01"
practice_link: "/class-11/mathematics/continuity-and-differentiability-class-12-notes"
---


![Continuity and Differentiability Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog-images/continuity-and-differentiability-class-12-notes.webp)

*Last Updated: 2026-04-01*




## 📋 Table of Contents

  - [3 Solved PYQs (Continued)](#3-solved-pyqs-continued)
  - [Continuity](#continuity)
  - [Differentiability](#differentiability)
  - [Algebra of Derivatives](#algebra-of-derivatives)
  - [Chain Rule](#chain-rule)
  - [Implicit Differentiation](#implicit-differentiation)
  - [Higher-Order Derivatives](#higherorder-derivatives)
  - [Applications of Derivatives](#applications-of-derivatives)
  - [Summary of Key Concepts](#summary-of-key-concepts)
  - [3 Solved PYQs (Continued)](#3-solved-pyqs-continued)
- [🪤 The 5 Trap Mistakes](#-the-5-trap-mistakes)
  - [Higher-Order Derivatives: Beyond the First Derivative](#higherorder-derivatives-beyond-the-first-derivative)
  - [Applications of Derivatives: Real-World Impact](#applications-of-derivatives-realworld-impact)
  - [Summary of Key Concepts: A Recap](#summary-of-key-concepts-a-recap)
  - [Advanced Concepts in Continuity and Differentiability](#advanced-concepts-in-continuity-and-differentiability)
- [📝 Master the Test Center — Step-by-Step Learning](#-master-the-test-center-stepbystep-learning)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
  - [🚀 Ready to Ace Your Exam?](#-ready-to-ace-your-exam)
- [📚 Related Topics](#-related-topics)


- [3 Solved PYQs (Continued)](#3-solved-pyqs-continued)
  - [Continuity](#continuity)
  - [Differentiability](#differentiability)
  - [Algebra of Derivatives](#algebra-of-derivatives)
  - [Chain Rule](#chain-rule)
  - [Implicit Differentiation](#implicit-differentiation)
  - [Higher-Order Derivatives](#higherorder-derivatives)
  - [Applications of Derivatives](#applications-of-derivatives)
  - [Summary of Key Concepts](#summary-of-key-concepts)
  - [3 Solved PYQs (Continued)](#3-solved-pyqs-continued)

  - [Higher-Order Derivatives: Beyond the First Derivative](#higherorder-derivatives-beyond-the-first-derivative)
  - [Applications of Derivatives: Real-World Impact](#applications-of-derivatives-realworld-impact)
  - [Summary of Key Concepts: A Recap](#summary-of-key-concepts-a-recap)
  - [Advanced Concepts in Continuity and Differentiability](#advanced-concepts-in-continuity-and-differentiability)


### <a id="3-solved-pyqs-continued"></a>3 Solved PYQs (Continued)
- **Solution (Continued):** 
Now, we can cancel the $(x-2)$ terms, but we must be aware that this cancellation is valid only if $x \neq 2$ because division by zero is undefined. Thus, after cancellation, we have:

\lim_{x \to 2} f(x) = \lim_{x \to 2} (x + 2)

As $x$ approaches $2$, $x + 2$ approaches $4$. Therefore, $\lim_{x \to 2} f(x) = 4$.

- **Q2:** If $f(x) = |x|$, find $f'(x)$ for $x > 0$, $x < 0$, and $x = 0$.

 - **Trap:** Not considering the piecewise nature of the absolute value function.

 - **Solution:** 
For $x > 0$, $f(x) = x$, so $f'(x) = 1$. 

For $x < 0$, $f(x) = -x$, so $f'(x) = -1$. 

At $x = 0$, we check the definition of a derivative:

f'(0) = \lim_{h \to 0} \frac{f(0 + h) - f(0)}{h} = \lim_{h \to 0} \frac{|h|}{h}


This limit does not exist because $\frac{|h|}{h} = 1$ for $h > 0$ and $\frac{|h|}{h} = -1$ for $h < 0$. Therefore, $f'(0)$ is undefined.

- **Q3:** If $f(x) = \sin(x)$, prove that $f'(x) = \cos(x)$.

 - **Trap:** Not using the definition of a derivative correctly.

 - **Solution:** 
By definition, 

f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h} = \lim_{h \to 0} \frac{\sin(x + h) - \sin(x)}{h}


Using the angle sum identity for sine, $\sin(a + b) = \sin(a)\cos(b) + \cos(a)\sin(b)$, we get:

\sin(x + h) = \sin(x)\cos(h) + \cos(x)\sin(h)

Substituting this back into our limit:

f'(x) = \lim_{h \to 0} \frac{\sin(x)\cos(h) + \cos(x)\sin(h) - \sin(x)}{h}

= \lim_{h \to 0} \frac{\sin(x)(\cos(h) - 1) + \cos(x)\sin(h)}{h}


Since $\cos(h)$ approaches $1$ and $\sin(h)$ approaches $h$ as $h$ approaches $0$:

f'(x) = \lim_{h \to 0} \frac{\cos(x)\sin(h)}{h} = \cos(x) \cdot \lim_{h \to 0} \frac{\sin(h)}{h} = \cos(x) \cdot 1 = \cos(x)




### <a id="continuity"></a>Continuity
- **Checking Continuity:** To check if a function $f(x)$ is continuous at $x = a$, we must verify that $\lim_{x \to a} f(x) = f(a)$.

 - **Types of Discontinuities:** 
  - **Removable Discontinuity:** The limit exists, but it does not equal $f(a)$.
  - **Infinite Discontinuity:** The limit is infinite.
  - **Oscillating Discontinuity:** The limit does not exist due to oscillation between values.

#### Continuity at a Point
- **Definition:** A function $f(x)$ is continuous at $x = a$ if $\lim_{x \to a} f(x) = f(a)$.
- **Conditions:** 
  - $f(a)$ is defined.
  - $\lim_{x \to a} f(x)$ exists.
  - $\lim_{x \to a} f(x) = f(a)$.

#### Continuity on an Interval
- **Definition:** A function $f(x)$ is continuous on an interval $I$ if it is continuous at every point in $I$.
- **Interval Types:** 
  - **Open Interval:** $(a, b)$.
  - **Closed Interval:** $[a, b]$.
  - **Half-Open Interval:** $[a, b)$ or $(a, b]$.


### <a id="differentiability"></a>Differentiability
- **Checking Differentiability:** A function $f(x)$ is differentiable at $x = a$ if the limit $\lim_{h \to 0} \frac{f(a + h) - f(a)}{h}$ exists.

 - **Geometric Interpretation:** The derivative $f'(x)$ represents the slope of the tangent line to the graph of $f(x)$ at $x$.

 - **Differentiability Implies Continuity:** If a function is differentiable at a point, it is also continuous at that point. However, the converse is not always true.

#### Differentiability at a Point
- **Definition:** A function $f(x)$ is differentiable at $x = a$ if $\lim_{h \to 0} \frac{f(a + h) - f(a)}{h}$ exists.
- **Conditions:** 
  - $f(a)$ is defined.
  - $\lim_{h \to 0} \frac{f(a + h) - f(a)}{h}$ exists.

#### Differentiability on an Interval
- **Definition:** A function $f(x)$ is differentiable on an interval $I$ if it is differentiable at every point in $I$.
- **Interval Types:** 
  - **Open Interval:** $(a, b)$.
  - **Closed Interval:** $[a, b]$.
  - **Half-Open Interval:** $[a, b)$ or $(a, b]$.


### <a id="algebra-of-derivatives"></a>Algebra of Derivatives

- **Sum Rule:** \frac{d}{dx} (f(x) + g(x)) = f'(x) + g'(x)

- **Difference Rule:** \frac{d}{dx} (f(x) - g(x)) = f'(x) - g'(x)

- **Product Rule:** \frac{d}{dx} (f(x) \cdot g(x)) = f'(x) \cdot g(x) + f(x) \cdot g'(x)

- **Quotient Rule:** \frac{d}{dx} \left(\frac{f(x)}{g(x)}\right) = \frac{f'(x) \cdot g(x) - f(x) \cdot g'(x)}{(g(x))^2}



#### Derivative of a Constant
- **Rule:** If $f(x) = c$, where $c$ is a constant, then $f'(x) = 0$.

#### Derivative of a Power Function
- **Rule:** If $f(x) = x^n$, where $n$ is a real number, then $f'(x) = nx^{n-1}$.


### <a id="chain-rule"></a>Chain Rule
- **Composition of Functions:** If $f(x) = g(h(x))$, then $f'(x) = g'(h(x)) \cdot h'(x)$.


- **General Form:** \frac{d}{dx} f(g(x)) = f'(g(x)) \cdot g'(x)



#### Chain Rule for Multiple Compositions
- **Rule:** If $f(x) = g(h(j(x)))$, then $f'(x) = g'(h(j(x))) \cdot h'(j(x)) \cdot j'(x)$.

#### Chain Rule and Trigonometric Functions
- **Examples:** 
  - If $f(x) = \sin(\cos(x))$, then $f'(x) = \cos(\cos(x)) \cdot (-\sin(x))$.
  - If $f(x) = \cos(\sin(x))$, then $f'(x) = -\sin(\sin(x)) \cdot \cos(x)$.


### <a id="implicit-differentiation"></a>Implicit Differentiation
- **Implicitly Defined Functions:** Functions defined by an equation where $y$ is not explicitly given in terms of $x$.

 - **Differentiating Both Sides:** Differentiate both sides of the equation with respect to $x$, treating $y$ as a function of $x$.

 - **Solving for $y'$:** Solve the resulting equation for $y'$.

#### Implicit Differentiation with Trigonometric Functions
- **Examples:** 
  - If $\sin(y) = x$, then $\cos(y) \cdot y' = 1$, so $y' = \frac{1}{\cos(y)}$.
  - If $\cos(y) = x$, then $-\sin(y) \cdot y' = 1$, so $y' = -\frac{1}{\sin(y)}$.


### <a id="higherorder-derivatives"></a>Higher-Order Derivatives
- **First Derivative:** $f'(x)$

 - **Second Derivative:** $f''(x) = \frac{d}{dx} f'(x)$

 - **Higher Derivatives:** Continue differentiating to find $f'''(x)$, $f^{(4)}(x)$, etc.

#### Second Derivative Test
- **Rule:** If $f''(x) > 0$ for all $x$ in an interval, then $f(x)$ is concave up on that interval. If $f''(x) < 0$, then $f(x)$ is concave down.

#### Higher-Order Derivative Test
- **Rule:** The sign of $f^{(n)}(x)$ determines the concavity of $f^{(n-1)}(x)$.


### <a id="applications-of-derivatives"></a>Applications of Derivatives
- **Optimization:** Use derivatives to find maximum and minimum values of functions.

 - **Motion Along a Line:** Derivatives describe the velocity and acceleration of an object moving along a line.

 - **Related Rates:** Derivatives help solve problems involving rates of change in related quantities.

#### Optimization Problems
- **Types:** 
  - **Maximization:** Find the maximum value of a function.
  - **Minimization:** Find the minimum value of a function.

#### Motion Along a Line
- **Velocity:** The derivative of position with respect to time.
- **Acceleration:** The derivative of velocity with respect to time.


### <a id="summary-of-key-concepts"></a>Summary of Key Concepts
- **Continuity:** $\lim_{x \to a} f(x) = f(a)$

 - **Differentiability:** $\lim_{h \to 0} \frac{f(a + h) - f(a)}{h}$ exists

 - **Derivative Rules:** Sum, difference, product, quotient, and chain rules

 - **Implicit Differentiation:** Differentiate both sides of an implicitly defined function

 - **Higher-Order Derivatives:** Continue differentiating to find higher-order derivatives

 - **Applications:** Optimization, motion, related rates, etc.

- **Solution (continued):** 

 \lim_{x \to 2} f(x) = \lim_{x \to 2} (x + 2) = 2 + 2 = 4

- **Q2:** If $f(x) = |x|$ and $g(x) = x^2$, find the derivative of $f(g(x))$.

 - **Trap:** Forgetting to apply the chain rule.

 - **Solution:** 
First, find $f(g(x)) = |x^2| = x^2$ because $x^2$ is always non-negative. Then, the derivative of $f(g(x))$ with respect to $x$ is $2x$. 

Note: This is the end of the first 40% of the guide. The remaining topics and practice questions will be covered in the next parts.

### <a id="3-solved-pyqs-continued"></a>3 Solved PYQs (Continued)
#### Q2: Solution Continued
For $x > 0$, $f(g(x)) = f(x^2) = |x^2| = x^2$, so $f'(g(x)) = 2x$. 

For $x < 0$, $f(g(x)) = f(x^2) = |x^2| = x^2$, so $f'(g(x)) = 2x$. 

However, since $g(x) = x^2$, we need to use the chain rule:

\frac{d}{dx} f(g(x)) = f'(g(x)) \cdot g'(x) = 2x \cdot 2x = 4x^2


But we must consider the nature of $f(x) = |x|$ when $x = 0$. Since $g(0) = 0^2 = 0$, and $f'(0)$ is undefined for $f(x) = |x|$, the derivative of $f(g(x))$ at $x = 0$ needs special attention.

## <a id="-the-5-trap-mistakes"></a>🪤 The 5 Trap Mistakes
1. **Not considering the domain of the function**: When dealing with functions like $f(x) = |x|$, it's crucial to remember that the absolute value function has a piecewise definition which affects its differentiability at $x = 0$.
2. **Forgetting the chain rule**: In composite functions like $f(g(x))$, applying the chain rule is essential to find the derivative correctly.
3. **Misapplying derivative rules**: Each derivative rule (sum, difference, product, quotient, chain) has its specific [application](/blog/application-of-integrals-class-12-notes), and confusing these can lead to incorrect derivatives.
4. **Ignoring higher-order derivatives**: In problems requiring the second derivative or higher, failing to differentiate the first derivative correctly can lead to errors.
5. **Not checking for continuity and differentiability**: Before applying derivative rules, it's essential to check if the function is continuous and differentiable at the given point to ensure the derivative exists.

#### Continuity and Differentiability: A Deeper Dive
For a function to be differentiable at a point, it must also be continuous at that point. However, continuity does not guarantee differentiability. The function $f(x) = |x|$ is continuous at $x = 0$ but not differentiable due to the sharp corner at $x = 0$.

#### Geometric Interpretation of Derivatives
The derivative $f'(x)$ represents the slope of the tangent line to the curve of $f(x)$ at the point $x$. This geometric interpretation is crucial for understanding the physical meaning of derivatives in problems involving motion and optimization.

#### Implicit Differentiation: A Powerful Tool
Implicit differentiation allows us to find the derivative of functions that are not given explicitly. By differentiating both sides of the equation with respect to $x$ and treating $y$ as a function of $x$, we can solve for $y'$, which represents the slope of the tangent line to the curve at any point.

### <a id="higherorder-derivatives-beyond-the-first-derivative"></a>Higher-Order Derivatives: Beyond the First Derivative
Higher-order derivatives are found by differentiating the derivative of a function. The second derivative, $f''(x)$, represents the rate of change of the first derivative and can be used to determine the concavity of a graph. Higher-order derivatives are essential in advanced physics and engineering applications.

### <a id="applications-of-derivatives-realworld-impact"></a>Applications of Derivatives: Real-World Impact
Derivatives have numerous applications in optimization problems, where they are used to find the maximum or minimum of a function. In physics, derivatives describe the velocity and acceleration of moving objects. Moreover, derivatives are used in related rates problems to solve questions involving rates of change in related quantities.

### <a id="summary-of-key-concepts-a-recap"></a>Summary of Key Concepts: A Recap
- **Continuity**: A function $f(x)$ is continuous at $x = a$ if $\lim_{x \to a} f(x) = f(a)$.
- **Differentiability**: A function $f(x)$ is differentiable at $x = a$ if $\lim_{h \to 0} \frac{f(a + h) - f(a)}{h}$ exists.
- **Derivative Rules**: Essential rules include the sum, difference, product, quotient, and chain rules for differentiation.
- **Implicit Differentiation**: Differentiate both sides of an equation with respect to $x$, treating $y$ as a function of $x$.
- **Higher-Order Derivatives**: Continue differentiating to find higher-order derivatives.
- **Applications**: Optimization, motion along a line, and related rates are key applications of derivatives.

### <a id="advanced-concepts-in-continuity-and-differentiability"></a>Advanced Concepts in Continuity and Differentiability

As we delve deeper into the world of continuity and differentiability, it's essential to explore more advanced concepts that will help solidify your understanding and prepare you for the challenges of JEE 2026.

- **Uniform Continuity:** A function $f(x)$ is said to be uniformly continuous on an interval $[a, b]$ if for every $\epsilon > 0$, there exists a $\delta > 0$ such that $|f(x_1) - f(x_2)| < \epsilon$ whenever $|x_1 - x_2| < \delta$ for all $x_1, x_2 \in [a, b]$.

- **Lipschitz Continuity:** A function $f(x)$ is said to be Lipschitz continuous on an interval $[a, b]$ if there exists a constant $M$ such that $|f(x_1) - f(x_2)| \leq M|x_1 - x_2|$ for all $x_1, x_2 \in [a, b]$.

- **Differentiation of Inverse Functions:** If a function $f(x)$ is one-to-one and differentiable on an interval, then its inverse function $f^{-1}(x)$ is also differentiable, and the derivative of $f^{-1}(x)$ is given by $\frac{d}{dx} f^{-1}(x) = \frac{1}{f'(f^{-1}(x))}$.

## <a id="-master-the-test-center-stepbystep-learning"></a>📝 Master the Test Center — Step-by-Step Learning

To reinforce your understanding of continuity and differentiability and to practice applying these concepts to solve problems, it's crucial to utilize the Test Center at /[class](/blog/amines-class-12-notes)-11/mathematics/continuity-and-differentiability-[class](/blog/amines-class-12-notes)-12-notes. This valuable resource provides a comprehensive platform for you to:

1. **Review [notes](/blog/amines-class-12-notes) and Concepts:** The Test Center offers detailed [notes](/blog/amines-class-12-notes) and explanations on continuity and differentiability, covering topics from basic definitions to advanced applications.
2. **Practice with Solved Examples:** Working through solved examples will help you understand how to apply theoretical concepts to practical problems, enhancing your problem-solving skills.
3. **Attempt Practice Questions:** The Test Center includes a wide range of practice questions, from basic to advanced levels, allowing you to assess your understanding and identify areas where you need more practice.
4. **Analyze Your Performance:** After attempting practice questions, you can analyze your performance to understand your strengths and weaknesses, helping you focus your study efforts more effectively.
5. **Learn from Mistakes:** The Test Center provides detailed explanations for each question, enabling you to learn from your mistakes and avoid repeating them in the future.

By regularly using the Test Center, you will not only deepen your understanding of continuity and differentiability but also develop the skills and confidence needed to excel in JEE 2026. Make it a part of your daily study routine to see significant improvements in your performance over time.

## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box

In the last 5 minutes of your study session, quickly review the key concepts of continuity and differentiability, including definitions, types of discontinuities, and differentiation rules. Practice applying these concepts to simple problems to reinforce your understanding. Remember, consistent practice and review are key to mastering these topics. Bookmark this guide and return daily to continue your journey towards becoming a grandmaster in continuity and differentiability for JEE 2026.


---

### <a id="-ready-to-ace-your-exam"></a>🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/continuity-and-differentiability-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*


---

## <a id="-related-topics"></a>📚 Related Topics

Continue your revision with these related guides:

- 📖 [Application of Integrals Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-integrals-class-12-notes)
- 📖 [Determinants Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/determinants-class-12-notes)
- 📖 [Amines Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/amines-class-12-notes)
- 📖 [Metallurgy Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/metallurgy-class-12-notes)


---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/continuity-and-differentiability-class-12-notes) now and track your progress against thousands of students.


---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Application of Integrals Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-integrals-class-12-notes)
- 📖 [Determinants Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/determinants-class-12-notes)
- 📖 [Amines Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/amines-class-12-notes)
- 📖 [Metallurgy Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/metallurgy-class-12-notes)
