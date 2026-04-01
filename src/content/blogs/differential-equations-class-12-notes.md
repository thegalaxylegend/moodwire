---
heroImage: "/blog-images/differential-equations-class-12-notes.webp"
title: "Differential Equations Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide"
description: "Learn Differential Equations like a pro. Detailed revision notes, solved examples, and "Trap Questions" that most students miss. Updated for the 2026 syllabus."
category: "Mathematics"
keywords: "Differential Equations class 12 notes, Differential Equations quick revision, Differential Equations 2026, Differential Equations JEE 2026, Differential Equations notes for JEE, class 12 Mathematics revision, Differential Equations formula sheet, Differential Equations MCQs"
date: "2026-04-01"
practice_link: "/class-11/mathematics/differential-equations-class-12-notes"
---

![Differential Equations revision guide](/blog-images/differential-equations-class-12-notes.webp)

*Last Updated: 2026-04-01*

## 🎯 What WILL Come in Your Exam

* 1 numerical on **Separable Differential Equations** — always, involving $\\frac{dy}{dx} = \\frac{f(x)}{g(y)}$.
* **Linear Differential Equations** of the form $\\frac{dy}{dx} + Py = Q$, where P and Q are functions of x — 1-2 questions.
* **Homogeneous Differential Equations** of the form $\\frac{dy}{dx} = \\frac{f(y)}{g(x)}$ or $\\frac{dy}{dx} = f(\\frac{y}{x})$ — always, with 1 numerical.
* **Differential Equations of the form $y = vx$** — 1 question, where $v = \\frac{dy}{dx}$.
* **Formation of Differential Equations** — 1 question, where a differential equation is to be formed from a given equation involving $x$ and $y$.
* **Solution of Differential Equations using**:
 - **Separation of Variables** — always, with 1-2 questions.
 - **Integrating Factor** — always, with 1 question.
* **Graphical Representation** of a differential equation's solution — 1 question.
* **First Order Linear Differential Equations** with applications — 1 question, involving $\\frac{dy}{dx} + Py = Q$.
* **Numerical on Newton's Law of Cooling** or similar application — 1 question, involving a differential equation.
* **First Order Differential Equations** in the form $\\frac{dx}{dy} = f(x,y)$ or $\\frac{dy}{dx} = f(x,y)$ — 1 question.
* **Short answer question on order and degree** of a differential equation — always.
* **Modelling of real-life problems** using differential equations — 1 question.


## ⚡ Formula Bank

- **Separable Differential Equations:** $$\frac{dy}{dx} = \frac{f(x)}{g(y)}$$ — $f(x)$ and $g(y)$ are functions of $x$ and $y$ respectively.

 - **First-Order Linear Differential Equations:** $$\frac{dy}{dx} + P(x)y = Q(x)$$ — $P(x)$ and $Q(x)$ are functions of $x$.

 - **Integrating Factor:** $$I.F. = e^{\int P(x) dx}$$ — used to solve first-order linear differential equations.

 - **Bernoulli's Equation:** $$\frac{dy}{dx} + P(x)y = Q(x)y^n$$ — $n$ is a constant, $P(x)$ and $Q(x)$ are functions of $x$.

 - **Homogeneous Differential Equations:** $$\frac{dy}{dx} = \frac{f(x, y)}{g(x, y)}$$ — $f(x, y)$ and $g(x, y)$ are homogeneous functions of degree $n$.

 - **Euler's Method:** $$y_{n+1} = y_n + hf(x_n, y_n)$$ — $h$ is the step size, $x_n$ and $y_n$ are the current values.

 - **Runge-Kutta Method (2nd Order):** $$y_{n+1} = y_n + \frac{h}{2}(k_1 + k_2)$$ — $k_1 = f(x_n, y_n)$, $k_2 = f(x_n + h, y_n + hk_1)$.

 - **Runge-Kutta Method (4th Order):** $$y_{n+1} = y_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$ — $k_1 = f(x_n, y_n)$, $k_2 = f(x_n + \frac{h}{2}, y_n + \frac{hk_1}{2})$, $k_3 = f(x_n + \frac{h}{2}, y_n + \frac{hk_2}{2})$, $k_4 = f(x_n + h, y_n + hk_3)$.

 - **Laplace Transform:** $$F(s) = \int_{0}^{\infty} e^{-st}f(t)dt$$ — $F(s)$ is the Laplace transform of $f(t)$.

 - **Inverse Laplace Transform:** $$f(t) = \frac{1}{2\pi i} \int_{c-i\infty}^{c+i\infty} e^{st}F(s)ds$$ — $f(t)$ is the inverse Laplace transform of $F(s)$.



## 🪤 The 5 Mistakes That Cost Marks

When solving Differential Equations, students often lose marks due to the following common mistakes:

 - **Mistake 1:** Incorrectly applying the separation of variables method, resulting in failure to integrate both sides of the equation separately.

 - *Costs:* 4-6 marks

 - *Fix:* Ensure to separate the variables correctly, then integrate both sides. For example, given the equation $\frac{dy}{dx} = \frac{y}{x}$, separate the variables to get $\frac{dy}{y} = \frac{dx}{x}$, then integrate to obtain $\ln|y| = \ln|x| + C$.

 - **Mistake 2:** Forgetting to include the constant of integration when solving a differential equation.

 - *Costs:* 2-4 marks

 - *Fix:* Always remember to add the constant of integration. For instance, when solving $\frac{dy}{dx} = 2x$, the solution is $y = x^2 + C$, where $C$ is the constant of integration.

 - **Mistake 3:** Incorrectly identifying the type of differential equation (e.g., first-order linear, separable, homogeneous).

 - *Costs:* 5-8 marks

 - *Fix:* Carefully examine the equation to determine its type. For example, $\frac{dy}{dx} + Py = Q$ is a first-order linear differential equation, which can be solved using an integrating factor $e^{\int P dx}$.

 - **Mistake 4:** Failing to check the solution by substituting it back into the original differential equation.

 - *Costs:* 3-5 marks

 - *Fix:* Always verify the solution by plugging it back into the original equation. For instance, given the equation $y' = 2x$, the solution $y = x^2$ can be verified by differentiating to get $y' = 2x$, which satisfies the original equation.

 - **Mistake 5:** Not using the initial conditions to find the specific solution to a differential equation.

 - *Costs:* 4-6 marks

 - *Fix:* Apply the initial conditions to determine the value of the constant of integration. For example, given the equation $y' = 2x$ with the initial condition $y(0) = 1$, the general solution $y = x^2 + C$ can be used to find $C = 1$, resulting in the specific solution $y = x^2 + 1$.



## ✏️ 3 Solved PYQs

- **Q1:** The differential equation of the family of curves $y = ae^{x/a}$ is

 - **Trap:** Students often get confused between the given family of curves and the standard form of the differential equation.

 - **Solution:** We have $y = ae^{x/a}$. Differentiating both sides with respect to $x$, we get:

 $$\frac{dy}{dx} = ae^{x/a} \cdot \frac{d}{dx} \left(\frac{x}{a}\right)$$

 $$\frac{dy}{dx} = ae^{x/a} \cdot \frac{1}{a}$$

 $$\frac{dy}{dx} = e^{x/a}$$

 Now, substitute $y = ae^{x/a}$ into the equation:

 $$\frac{dy}{dx} = \frac{y}{x}$$

 Substitute $a = \frac{x}{\ln(y/a)}$ into the equation $y = ae^{x/a}$:

 $$y = \frac{x}{\ln(y/a)}e^{x/\frac{x}{\ln(y/a)}}$$

 $$y = \frac{x}{\ln(y/a)}e^{\ln(y/a)}$$

 $$y = \frac{x}{\ln(y/a)} \cdot \frac{y}{a}$$

 $$y = \frac{xy}{a\ln(y/a)}$$

 $$a = \frac{xy}{y\ln(y/a)}$$

 $$a = \frac{x}{\ln(y/a)}$$

 Substitute $a = \frac{x}{\ln(y/a)}$ into the equation $\frac{dy}{dx} = \frac{y}{x}$:

 $$\frac{dy}{dx} = \frac{y}{x}$$

 $$x\frac{dy}{dx} = y$$

 $$x\frac{dy}{dx} - y = 0$$

 - **Answer:** $x\frac{dy}{dx} - y = 0$

 - **Q2:** The differential equation representing the curve $y = x^2 + 2x + c$ where $c$ is an arbitrary constant is given by

 - **Trap:** Students often forget to differentiate the given equation twice.

 - **Solution:** Differentiating $y = x^2 + 2x + c$ with respect to $x$, we get:

 $$\frac{dy}{dx} = 2x + 2$$

 Differentiating again with respect to $x$:

 $$\frac{d^2y}{dx^2} = 2$$

 Hence, the required differential equation is:

 $$\frac{d^2y}{dx^2} = 2$$

 - **Answer:** $\frac{d^2y}{dx^2} = 2$

 - **Q3:** The differential equation of the curve $y = e^{2x}$ is given by

 - **Trap:** Students often make errors while differentiating the given equation.

 - **Solution:** Differentiating $y = e^{2x}$ with respect to $x$, we get:

 $$\frac{dy}{dx} = 2e^{2x}$$

 $$\frac{dy}{dx} = 2y$$

 $$\frac{dy}{dx} - 2y = 0$$

 - **Answer:** $\frac{dy}{dx} - 2y = 0$



## 🧠 The One Thing Most Students Get Wrong

- **The Core Concept:** The core concept that differentiates 85% scorers from 95% scorers in Differential Equations is the **application of the Laplace Transform to solve higher-order differential equations**. This involves understanding how to apply the Laplace Transform to simplify complex differential equations into algebraic equations that can be solved more easily.

 - **What 85% scorers do:** Most students who score around 85% tend to focus solely on the basic application of the Laplace Transform. They can:

 * Apply the Laplace Transform to simple first-order and second-order differential equations.

 * Use the Laplace Transform to find the solution of differential equations with constant coefficients.

 * Solve initial value problems using the Laplace Transform.

 However, they often struggle with applying the Laplace Transform to more complex scenarios, such as differential equations with variable coefficients or those that involve Dirac delta functions.

 - **What 95% scorers do:** Students who aim to score 95% or higher, on the other hand, have a deeper understanding of the Laplace Transform and its applications. They:

 * Master the application of the Laplace Transform to solve higher-order differential equations with both constant and variable coefficients.

 * Understand how to use the Laplace Transform in conjunction with other techniques, such as convolution, to solve complex differential equations.

 * Are proficient in using the Laplace Transform to solve differential equations involving the Dirac delta function and the Heaviside step function.

 * Can derive and apply the Laplace Transform of various functions, including $t^n$, $\sin(at)$, $\cos(at)$, and $e^{at}$, to solve differential equations.

 * Are skilled in using the formula for the Laplace Transform of a derivative: $$\mathcal{L}\{f^{(n)}(t)\} = s^n\mathcal{L}\{f(t)\} - s^{n-1}f(0) - s^{n-2}f'(0) - \cdots - f^{(n-1)}(0)$$

 and can apply it to solve initial value problems.

| Differential Equation | Laplace Transform | Solution |
| --- | --- | --- |
| $y'' + 4y' + 4y = 0$ | $$s^2Y(s) - sy(0) - y'(0) + 4(sY(s) - y(0)) + 4Y(s) = 0$$ | $$Y(s) = \frac{s+4}{(s+2)^2}$$ |
| $y'' + 9y = \sin(2t)$ | $$s^2Y(s) - sy(0) - y'(0) + 9Y(s) = \frac{2}{s^2+4}$$ | $$Y(s) = \frac{2}{(s^2+4)(s^2+9)}$$ |



## 👁️ Ayush's Note

👁️ Ayush's Note, - **The Hidden Pattern:** In Differential Equations, particularly for JEE/NEET exams, it's observed that problems often involve a specific pattern related to the order and degree of the equation. For instance, if the equation is of the form $y'' + py' + qy = 0$, where $p$ and $q$ are functions of $x$, then the solution involves finding the integrating factor or using the method of undetermined coefficients. However, what's crucial to note is the interplay between the coefficients $p$ and $q$ and how they influence the type of solution one should expect., - **How to Apply It:** To apply this insight, start by identifying the order and degree of the given differential equation. Then, attempt to categorize it into one of the standard forms such as linear, separable, homogeneous, or exact. For equations of the form $y' + P(x)y = Q(x)$, use the integrating factor $e^\\int P(x) dx$. For higher-order linear equations, the method of undetermined coefficients or the use of $D$-operators can be pivotal. Remember, the key to solving differential equations efficiently lies in quickly identifying the type of equation and applying the appropriate method, often involving formulas like $y = \\frac1D^2 + 4 \\sin(2x) = \\frac1-4 + 4 \\sin(2x)$ which simplifies to $y = \\frac-14 \\int\\int \\sin(2x) dx^2$, highlighting the importance of $D$-operator notation and double integration., - **Crucial Formulas:** For revision, focus on formulas such as the solution to the differential equation $y'' + y = 0$, given by $y = c_1 \\cos(x) + c_2 \\sin(x)$, and for $y'' - y = 0$, given by $y = c_1 e^x + c_2 e^-x$. The general solution to $y'' + py' + qy = r(x)$ involves the complementary function and the particular integral, where the complementary function is the solution to $y'' + py' + qy = 0$ and the particular integral is a specific solution that depends on $r(x)$., - **Special Cases:** Be aware of special cases such as when the equation is of the form $y' = f(ax + by)$, which can be solved using the substitution $z = ax + by$, leading to $\\fracdzdx = a$ and thus $y' = \\fracdydz \\cdot \\fracdzdx = \\fracdydz \\cdot a$, simplifying the equation to $\\fracdydz = \\frac1a f(z)$. Another special case is when the equation is exact or can be made exact, where one can use the method of exact equations or the integrating factor to find the solution., - **Practice Strategies:** To maximize your score, practice solving a mix of differential equations types within a set time frame, focusing on accuracy and speed. Start with simpler separable and linear equations, then move on to higher-order linear and exact equations. Use the process of elimination for multiple-choice questions and always attempt to solve the equation to find the correct option. , Type of Differential Equation, Method of Solution , First-order linear, Integrating factor , First-order separable, Separation of variables , Higher-order linear homogeneous, Complementary function , Higher-order linear non-homogeneous, Complementary function + Particular integral

| Type of Differential Equation | Method of Solution |
| --- | --- |
| First-order linear | Integrating factor |
| First-order separable | Separation of variables |
| Higher-order linear homogeneous | Complementary function |
| Higher-order linear non-homogeneous | Complementary function + Particular integral |



## 🔁 Last 5 Minutes Box

- $\frac{dy}{dx}$ = slope of the tangent to the curve at a given point.

 - $y = \phi(x)$ is the general solution of a differential equation.

 - The order of a differential equation is the order of the highest derivative present.

 - $\Delta x$ and $\Delta y$ are the small changes in x and y respectively in a differential equation.

 - The degree of a differential equation is the power of the highest order derivative.

 - Key facts:

 - To solve a differential equation, we need to find the general solution and then apply boundary conditions.

 - Differential equations are used to model real-life phenomena like population growth, chemical reactions, and electrical circuits.

 - The general solution of a differential equation contains arbitrary constants.

 - Common mistakes:

 - Forgetting to apply boundary conditions to find the particular solution.

 - Not checking the units of the variables while solving a differential equation.



## 📝 Practice MCQs


**1. The order of the function y'' + 3y' + 2y = 0 is**

- A) 1st Order
- B) 2nd Order
- C) 3rd Order
- D) 4th Order

**Answer:** B) Since the highest derivative is y'', the order is 2.

---

**2. The general solution of dy/dx = 2x is**

- A) y = x^2 + c
- B) y = 2x + c
- C) y = x^2 - c
- D) y = 2x - c

**Answer:** A) Integrating both sides gives y = x^2 + c.

---

**3. The differential equation of the family of curves y = ax^2 is**

- A) y' = 2ax
- B) y' = 2xy
- C) y' = x^2/a
- D) y' = 2x

**Answer:** A) Differentiating y = ax^2 gives y' = 2ax.

---

**4. The solution of the differential equation dy/dx = y/x is**

- A) y = x + c
- B) y = x - c
- C) y = cx
- D) y = c/x

**Answer:** C) Separating variables and integrating gives ln|y| = ln|x| + c, which simplifies to y = cx.

---

**5. The differential equation representing the family of curves y = e^(ax) is**

- A) y' = ay
- B) y' = ax
- C) y' = a/y
- D) y' = x/y

**Answer:** A) Differentiating y = e^(ax) gives y' = ae^(ax) = ay.



---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Differential Equations Full Mock Test**](/class-11/mathematics/differential-equations-class-12-notes) now and track your progress against thousands of students.

