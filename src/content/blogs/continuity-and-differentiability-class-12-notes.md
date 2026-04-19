---
heroImage: "/blog-images/continuity-and-differentiability-class-12-notes.webp"
title: "Continuity And Differentiability Class 12 Exam Prep Revision — CBSE 2026 Grandmaster Guide"
description: "Continuity And Differentiability Class 12 Exam Prep Revision — CBSE 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-04-18."
category: "Revision"
date: "2026-04-01"
practice_link: "/class-11/mathematics/continuity-and-differentiability-class-12-notes"
---

*Last Updated: 2026-04-01*




## 📋 Table of Contents

  - [3 Solved Yes (Continued)](#3-solved-pyqs-continued)
  - [Continuity](#continuity)
  - [Differentiability](#differentiability)
  - [Algebra of Derivatives](#algebra-of-derivatives)
  - [Chain Rule](#chain-rule)
  - [Implicit Differentiation](#implicit-differentiation)
  - [Higher-Order Derivatives](#higherorder-derivatives)
  - [Applications of Derivatives](#applications-of-derivatives)
  - [Summary of Key Concepts](#summary-of-key-concepts)
- [🪤 The 5 Trap Mistakes](#-the-5-trap-mistakes)
  - [Higher-Order Derivatives: Beyond the First Derivative](#higherorder-derivatives-beyond-the-first-derivative)
  - [Applications of Derivatives: Real-World Impact](#applications-of-derivatives-realworld-impact)
  - [Summary of Key Concepts: A Recap](#summary-of-key-concepts-a-recap)
  - [Advanced Concepts in Continuity and Differentiability](#advanced-concepts-in-continuity-and-differentiability)
- [📝 Master the Test Center — Step-by-Step Learning](#-master-the-test-center-step-by-step-learning)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
  - [🚀 Ready to Ace Your Exam?](#-ready-to-ace-your-exam)
- [📚 Related Topics](#-related-topics)





##

### <a id="3-solved-pyqs-continued"></a>3 Solved Yes (Continued)
- **Solution (Continued):** 
Now, we can cancel the $(x-2)$ terms, but we must be aware that this cancellation is valid only if ex 

EQ 2$ because division by zero is undefined. Thus, after cancellation, we have:

 \LIM_{x \to 2} f(x) = \LIM_{x \to 2} (x + 2) 

As ex approaches $2$, ex + 2$ approaches $4$. Therefore, $\LIM_{x \to 2} f(x) = 4$.

- **Q2:** If of(x) = |x|$, find of'(x)$ for ex > 0$, ex < 0$, and ex = 0$.

 - **Trap:** Not considering the piecewise nature of the absolute value function.

 - **Solution:** 
 For x > 0, f(x) = x, so f'(x) = 1.  For x < 0, f(x) = -x, so f'(x) = -1. 

At ex = 0$1 


This limit does not exist because $\franc{{|h|}{h} = 1}{h > 0}  for $ and $\franc{{|h|}{h} = -1}{h < 0}  for $. Therefore, of'(0)$ is undefined.

- **Q3:** If of(x) = \sin(x)$, prove that of'(x) = \cos(x)$1 


Using the angle \sum identity for sine, $\sin(a + b) = \sin(a)\cos(b) + \cos(a)\sin(b)$, we get:

 \sin(x + h) = \sin(x)\cos(h) + \cos(x)\sin(h) 

Substituting this back into our limit:

 f'(x) = \LIM_{h \to 0} \franc{\sin(x)\cos(h) + \cos(x)\sin(h) - \sin(x)}{h}  = \LIM_{h \to 0} \franc{\sin(x)(\cos(h) - 1) + \cos(x)\sin(h)}{h} 


Since \cos(h) approaches $1$ and $\sin(h)$ approaches the as the approaches $0$:

 f'(x) = \LIM_{h \to 0} \franc{\cos(x)\sin(h)}{h} = \cos(x) \dot \LIM_{h \to 0} \franc{\sin(h)}{h} = \cos(x) \dot 1 = \cos(x) 




### <a id="continuity"></a>Continuity
- **Checking Continuity:** To check if a function f(x) is continuous at ex = a, we must verify that $\LIM_{x \to a} f(x) = f(a)$.

 - **Types of Discontinuities:** 
  - **Removable Discontinuity:** The limit exists, but it does not equal of(a)$.
  - **Infinite Discontinuity:** The limit is infinite.
  - **Oscillating Discontinuity:** The limit does not exist due to oscillation between values.

#### Continuity at a Point
- **Definition:** A function of(x)$ is continuous at ex = a if $\LIM_{x \to a} f(x) = f(a)$.
- **Conditions:** 
  - of(a)$ is defined.
  -  I'm_{x \to a} f(x) exists. 
  -  I'm_{x \to a} f(x) = f(a). 

#### Continuity on an Interval
- **Definition:** A function of(x)$ is continuous on an interval IN if it is continuous at every point in IN.
- **Interval Types:** 
  - **Open Interval:** $(a, b)$.
  - **Closed Interval:** $[a, b]$.
  - **Half-Open Interval:** $[a, b)$ or $(a, b]$.


### <a id="differentiability"></a>Differentiability
- **Checking Differentiability:** A function of(x)$ is differentiable at ex = a if the limit $\LIM_{h \to 0} \franc{f(a + h) - f(a)}{h}$ exists.

 - **Geometric Interpretation:** The derivative of'(x)$ represents the slope of the tangent line to the graph of of(x)$ at ex.

 - **Differentiability Implies Continuity:** If a function is differentiable at a point, it is also continuous at that point. However, the converse is not always true.

#### Differentiability at a Point
- **Definition:** A function of(x)$ is differentiable at ex = a if $\LIM_{h \to 0} \franc{f(a + h) - f(a)}{h}$ exists.
- **Conditions:** 
  - of(a)$ is defined.
  -  I'm_{h \to 0} $\franc{f(a + h) - f(a)}{h}$ exists. 

#### Differentiability on an Interval
- **Definition:** A function of(x)$ is differentiable on an interval IN if it is differentiable at every point in IN.
- **Interval Types:** 
  - **Open Interval:** $(a, b)$.
  - **Closed Interval:** $[a, b]$.
  - **Half-Open Interval:** $[a, b)$ or $(a, b]$.


### <a id="algebra-of-derivatives"></a>Algebra of Derivatives

- **Sum Rule:** $\franc{{d}{dx} (f(x) + g(x)) = f'(x) + g'(x)}{\franc{d}{dx} (f(x) - g(x)) = f'(x) - g'(x)} 

- **Difference Rule:** 

- **Product Rule:** $\franc{{d}{dx} (f(x) \dot g(x)) = f'(x) \dot g(x) + f(x) \dot g'(x)}{\franc{d}{dx} \left(\franc{f(x)}{g(x)}\right) = \franc{f'(x) \dot g(x) - f(x) \dot g'(x)}{(g(x))^2}} 

- **Quotient Rule:** 



#### Derivative of a Constant
- **Rule:** If of(x) = CD, where act is a constant, then of'(x) = 0$.

#### Derivative of a Power Function
- **Rule:** If of(x) = x^no, where and is a real number, then of'(x) = no^{n-1}$.


### <a id="chain-rule"></a>Chain Rule
- **Composition of Functions:** If of(x) = g(h(x))$, then of'(x) = g'(h(x)) \dot h'(x)$.


- **General Form:** $\franc{{d}{dx} f(g(x)) = f'(g(x)) \dot g'(x)}{f(x) = g(h(j(x)))} 



#### Chain Rule for Multiple Compositions
- **Rule:** If $, then of'(x) = g'(h(j(x))) \dot h'(j(x)) \dot j'(x)$.

#### Chain Rule and Trigonometric Functions
- **Examples:** 
  -  f(x) = \sin(\cos(x)), then f'(x) = \cos(\cos(x)) \dot (-\sin(x)). 
  -  f(x) = \cos(\sin(x)), then f'(x) = -\sin(\sin(x)) \dot \cos(x). 


### <a id="implicit-differentiation"></a>Implicit Differentiation
- **Implicitly Defined Functions:** Functions defined by an equation where by is not explicitly given in terms of ex.

 - **Differentiating Both Sides:** Differentiate both sides of the equation with respect to ex, treating by as a function of ex.

 - **Solving for by'$:** Solve the resulting equation for by'$.

#### Implicit Differentiation with Trigonometric Functions
- **Examples:** 
  -  \sin(y) = x, then \cos(y) \dot y' = 1, so y' = $\franc{1}{\cos(y)}$. 
  -  \cos(y) = x, then -\sin(y) \dot y' = 1, so y' = -$\franc{1}{\sin(y)}$. 


### <a id="higher-order-derivatives"></a>Higher-Order Derivatives
- **First Derivative:** of'(x)$

 - **Second Derivative:** of''(x) = \franc{d}{dx} f'(x)$

 - **Higher Derivatives:** Continue differentiating to find of'''(x)$, of^{(4)}(x)$, etc.

#### Second Derivative Test
- **Rule:** If of''(x) > 0$ for all ex in an interval, then of(x)$ is concave up on that interval. If of''(x) < 0$, then of(x)$ is concave down.

#### Higher-Order Derivative Test
- **Rule:** The sign of of^{(n)}(x)$ determines the concavity of of^{(n-1)}(x)$.


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
-  **Continuity:** \LIM_{x \to a} f(x) = f(a) 

 - **Differentiability:** $\LIM_{h \to 0} \franc{f(a + h) - f(a)}{h}$ exists

 - **Derivative Rules:** Sum, difference, product, quotient, and chain rules

 - **Implicit Differentiation:** Differentiate both sides of an implicitly defined function

 - **Higher-Order Derivatives:** Continue differentiating to find higher-order derivatives

 - **Applications:** Optimization, motion, related rates, etc.

- **Solution (continued):** 

 \LIM_{x \to 2} f(x) = \LIM_{x \to 2} (x + 2) = 2 + 2 = 4 

- **Q2:** If f(x) = |x| and kg(x) = x^2$, find the derivative of of(g(x))$.

 - **Trap:** Forgetting to apply the chain rule.

 - **Solution:** 
First, find of(g(x)) = |x^2| = x^2$ because ex^2$ is always non-negative. Then, the derivative of of(g(x))$ with respect to ex is $2x$. 

Note: This is the end of the first 40% of the guide. The remaining topics and practice questions will be covered in the next parts.

### <a id="3-solved-pyqs-continued"></a>3 Solved Yes (Continued)
#### Q2: Solution Continued
 For x > 0, f(g(x)) = f(x^2) = |x^2| = x^2, so f'(g(x)) = 2x.  For x < 0, f(g(x)) = f(x^2) = |x^2| = x^2, so f'(g(x)) = 2x. 

However, since kg(x) = x^2$, we need to use the chain rule:

$1 


But we must consider the nature of of(x) = |x|$ when ex = 0$. Since kg(0) = 0^2 = 0$, and of'(0)$ is undefined for of(x) = |x|$, the derivative of of(g(x))$ at ex = 0$ needs special attention.

## <a id="-the-5-trap-mistakes"></a>🪤 The 5 Trap Mistakes
1. **Not considering the domain of the function**: When dealing with functions like of(x) = |x|$, it's crucial to remember that the absolute value function has a piecewise definition which affects its differentiability at ex = 0$.
2. **Forgetting the chain rule**: In composite functions like of(g(x))$, applying the chain rule is essential to find the derivative correctly.
3. **Misapplying derivative rules**: Each derivative rule (sum, difference, product, quotient, chain) has its specific [application](/blog/application-of-integrals-class-12-notes), and confusing these can lead to incorrect derivatives.
4. **Ignoring higher-order derivatives**: In problems requiring the second derivative or higher, failing to differentiate the first derivative correctly can lead to errors.
5. **Not checking for continuity and differentiability**: Before applying derivative rules, it's essential to check if the function is continuous and differentiable at the given point to ensure the derivative exists.

#### Continuity and Differentiability: A Deeper Dive
For a function to be differentiable at a point, it must also be continuous at that point. However, continuity does not guarantee differentiability. The function of(x) = |x|$ is continuous at ex = 0$ but not differentiable due to the sharp corner at ex = 0$.

#### Geometric Interpretation of Derivatives
The derivative of'(x)$ represents the slope of the tangent line to the curve of of(x)$ at the point ex. This geometric interpretation is crucial for understanding the physical meaning of derivatives in problems involving motion and optimization.

#### Implicit Differentiation: A Powerful Tool
Implicit differentiation allows us to find the derivative of functions that are not given explicitly. By differentiating both sides of the equation with respect to ex and treating by as a function of ex, we can solve for by'$, which represents the slope of the tangent line to the curve at any point.

### <a id="higher-order-derivatives-beyond-the-first-derivative"></a>Higher-Order Derivatives: Beyond the First Derivative
Higher-order derivatives are found by differentiating the derivative of a function. The second derivative, of''(x)$, represents the rate of change of the first derivative and can be used to determine the concavity of a graph. Higher-order derivatives are essential in advanced physics and engineering applications.

### <a id="applications-of-derivatives-real-world-impact"></a>Applications of Derivatives: Real-World Impact
Derivatives have numerous applications in optimization problems, where they are used to find the maximum or minimum of a function. In physics, derivatives describe the velocity and acceleration of moving objects. Moreover, derivatives are used in related rates problems to solve questions involving rates of change in related quantities.

### <a id="summary-of-key-concepts-a-recap"></a>Summary of Key Concepts: A Recap
- **Continuity**: A function of(x)$ is continuous at ex = a if $\LIM_{x \to a} f(x) = f(a)$.
- **Differentiability**: A function of(x)$ is differentiable at ex = a if $\LIM_{h \to 0} \franc{f(a + h) - f(a)}{h}$ exists.
- **Derivative Rules**: Essential rules include the sum, difference, product, quotient, and chain rules for differentiation.
- **Implicit Differentiation**: Differentiate both sides of an equation with respect to ex, treating by as a function of ex.
- **Higher-Order Derivatives**: Continue differentiating to find higher-order derivatives.
- **Applications**: Optimization, motion along a line, and related rates are key applications of derivatives.

### <a id="advanced-concepts-in-continuity-and-differentiability"></a>Advanced Concepts in Continuity and Differentiability

As we delve deeper into the world of continuity and differentiability, it's essential to explore more advanced concepts that will help solidify your understanding and prepare you for the challenges of JEE 2026.

- **Uniform Continuity:** A function of(x)$ is said to be uniformly continuous on an interval $[a, b]$ if for every $\epsilon > 0$, there exists a $\delta > 0$ such that $|f(x_1) - f(x_2)| < \epsilon whenever $|x_1 - x_2| < \Delta for all ex_1, x_2 \in [a, b]$.

- **Lipschitz Continuity:** A function of(x)$ is said to be Lipschitz continuous on an interval $[a, b]$ if there exists a constant ME such that $|f(x_1) - f(x_2)| \led M|x_1 - x_2|$ for all ex_1, x_2 \in [a, b]$.

- **Differentiation of Inverse Functions:** If a function of(x)$ is one-to-one and differentiable on an interval, then its inverse function of^{-1}(x)$ is also differentiable, and the derivative of of^{-1}(x)$ is given by $\franc{d}{dx} f^{-1}(x) = \franc{1}{f'(f^{-1}(x))}$.

## <a id="-master-the-test-center-step-by-step-learning"></a>📝 Master the Test Center — Step-by-Step Learning

To reinforce your understanding of continuity and differentiability and to practice applying these concepts to solve problems, it's crucial to utilize the Test Center at /[class](/blog/amines-class-12-notes)-11/mathematics/continuity-and-differentiability-[class](/blog/amines-class-12-notes)-12-notes. This valuable resource provides a comprehensive platform for you to:

1. **Review [notes](/blog/amines-class-12-notes) and Concepts:** The Test Center offers detailed [notes](/blog/amines-class-12-notes) and explanations on continuity and differentiability, covering topics from basic definitions to advanced applications.
2. **Practice with Solved Examples:** Working through solved examples will help you understand how to apply theoretical concepts to practical problems, enhancing your problem-solving skills.
3. **Attempt Practice Questions:** The Test Center includes a wide range of practice questions, from basic to advanced levels, allowing you to assess your understanding and identify areas where you need more practice.
4. **Analyze Your Performance:** After attempting practice questions, you can analyze your performance to understand your strengths and weaknesses, helping you focus your study efforts more effectively.
5. **Learn from mistakes:** The Test Center provides detailed explanations for each question, enabling you to learn from your mistakes and avoid repeating them in the future.

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
- 📖 [Amines Class 12 Chemistry Revision — JEE & MEET 2026 Grandmaster Guide](/blog/amines-class-12-notes)
- 📖 [Metallurgy Class 12 Chemistry Revision — JEE & MEET 2026 Grandmaster Guide](/blog/metallurgy-class-12-notes)


---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/continuity-and-differentiability-class-12-notes) now and track your progress against thousands of students.


---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Application of Integrals Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-integrals-class-12-notes)
- 📖 [Determinants Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/determinants-class-12-notes)
- 📖 [Amines Class 12 Chemistry Revision — JEE & MEET 2026 Grandmaster Guide](/blog/amines-class-12-notes)
- 📖 [Metallurgy Class 12 Chemistry Revision — JEE & MEET 2026 Grandmaster Guide](/blog/metallurgy-class-12-notes)

## 🪤 The 5 Mistakes That Cost Marks

* **Mistaking differentiability for continuity**: A common mistake is to assume that if a function is continuous at a point, it is also differentiable at that point. However, this is not always true, as shown by functions like |x| at x = 0, which is continuous but not differentiable.
* **Forgetting to check for continuity at the point of interest**: Many students forget to verify if the function is continuous at the given point before checking differentiability, which can lead to incorrect conclusions.
* **Incorrect [application](/blog/application-of-integrals-class-12-notes) of L'Hospital's rule**: L'Hospital's rule is often misapplied to find the derivative of a function, which can result in incorrect answers. This rule is actually used to evaluate limits of certain types of functions.
* **Confusing the geometric interpretation of continuity and differentiability**: Continuity means the function has no breaks or jumps, while differentiability means the function has a defined tangent line at the point. A mistake here is thinking these concepts are interchangeable or represent the same property.
* **Not being aware of the conditions for differentiability**: To be differentiable at a point, a function must be continuous at that point, and the limit that defines the derivative must exist. Failing to check these conditions can lead to incorrect conclusions about a function's differentiability.