---
heroImage: "/blog-images/linear-programming-class-12-notes.webp"
title: "Linear Programming Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide"
description: "Linear Programming Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-04-03."
category: "Revision"
date: "2026-04-03"
practice_link: "/class-11/mathematics/linear-programming-class-12-notes"
---


![Linear Programming Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog-images/linear-programming-class-12-notes.webp)

*Last Updated: 2026-04-03*




## 📋 Table of Contents

- [⚡ Formula Bank](#-formula-bank)
- [🪤 The 5 Mistakes That Cost Marks](#-the-5-mistakes-that-cost-marks)
- [✏️ 3 Solved PYQs](#-3-solved-pyqs)
- [🧠 The One Thing Most Students Get Wrong](#-the-one-thing-most-students-get-wrong)
- [👁️ Ayush's Note](#-ayushs-note)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
- [📝 Practice MCQs](#-practice-mcqs)
- [📚 Related Topics](#-related-topics)


- **Graphical Method**: 1 question on plotting the feasible region using [linear](/blog/pair-of-linear-equations-class-10-notes) inequalities — always
- **Corner Point Method**: 1 numerical on finding the optimal solution using corner points of the feasible region — always
- **[linear](/blog/pair-of-linear-equations-class-10-notes) Programming Problems**: 1-2 problems on formulating and solving [linear](/blog/pair-of-linear-equations-class-10-notes) programming problems using graphical or corner point method — always
- **Objective Function**: 1 numerical on finding the maximum or minimum value of the objective function — always
- **Constraints**: 1 question on plotting the constraints and finding the feasible region — always
- **Feasible Region**: 1 numerical on identifying the feasible region and finding the optimal solution — always
- **Optimal Solution**: 1 question on verifying the optimal solution using the corner point method — always
- **Unbounded and Infeasible Solutions**: 1 numerical on identifying whether a linear programming problem has an unbounded or infeasible solution — always
- **$\\Delta$x and $\\Delta$y**: 1 numerical on finding the change in the objective function using $\\Delta$x and $\\Delta$y — always
- **Shadow Price**: 1 question on finding the shadow price of a resource — always
- **Sensitivity Analysis**: 1 numerical on performing sensitivity analysis using the graphical method — always
- **Transportation Problems**: 1 problem on formulating and solving a transportation problem using linear programming — always
- **Formulation of Linear Programming Problems**: 1-2 questions on formulating real-life problems as linear programming problems — always
- **Non-Negativity Constraints**: 1 numerical on handling non-negativity constraints in linear programming problems — always
- **$x \\geq 0$ and $y \\geq 0$**: 1 question on plotting the non-negativity constraints and finding the feasible region — always
- **Linear Programming [applications](/blog/biotechnology-and-its-applications-class-12-notes)**: 1 question on [applications](/blog/biotechnology-and-its-applications-class-12-notes) of linear programming in real-life scenarios — always
- **Maximization and Minimization**: 1 numerical on formulating and solving maximization and minimization problems using linear programming — always
- **Multiple Optimal Solutions**: 1 question on identifying and handling multiple optimal solutions in linear programming problems — always
- **Redundant Constraints**: 1 numerical on identifying and handling redundant constraints in linear programming problems — always 
- **Binding Constraints**: 1 question on identifying and handling binding constraints in linear programming problems — always


## <a id="-formula-bank"></a>⚡ Formula Bank

- **Objective Function:** $$\min \\text{ or } \max\ Z = \sum_{j=1}^{n} c_jx_j$$ — where $Z$ is the objective function value, $c_j$ is the coefficient of variable $x_j$, and $x_j$ is the $j^{th}$ decision variable.

 - **Constraint Equation:** $$\sum_{j=1}^{n} a_{ij}x_j \leq \text{ or } = \text{ or } \geq b_i$$ — where $a_{ij}$ is the coefficient of $x_j$ in the $i^{th}$ constraint, $b_i$ is the right-hand side value of the $i^{th}$ constraint.

 - **Non-Negativity Constraint:** $$x_j \geq 0$$ — where $x_j$ is the $j^{th}$ decision variable.

 - **Slack Variable:** $$s_i = b_i - \sum_{j=1}^{n} a_{ij}x_j$$ — where $s_i$ is the slack variable for the $i^{th}$ constraint.

 - **Surplus Variable:** $$s_i = \sum_{j=1}^{n} a_{ij}x_j - b_i$$ — where $s_i$ is the surplus variable for the $i^{th}$ constraint.

 - **Artificial Variable:** $$A_i = \sum_{j=1}^{n} a_{ij}x_j + s_i - b_i$$ — where $A_i$ is the artificial variable for the $i^{th}$ constraint.

 - **Big M Method:** $$Z = \min \\text{ or } \max\ \left( \sum_{j=1}^{n} c_jx_j + M \sum_{i=1}^{m} A_i \right)$$ — where $M$ is a large positive number, $A_i$ is the artificial variable for the $i^{th}$ constraint.

 - **Two-Phase Method:** 

 - **Phase I:** $$Z = \min \sum_{i=1}^{m} A_i$$

 - **Phase II:** $$Z = \min \\text{ or } \max\ \sum_{j=1}^{n} c_jx_j$$

 - **Dual Simplex Method:** 

 - **Primal:** $$\max\ Z = \sum_{j=1}^{n} c_jx_j$$

 - **Dual:** $$\min\ W = \sum_{i=1}^{m} b_iy_i$$

 - **Shadow Price:** $$\Delta Z = \sum_{i=1}^{m} y_i \Delta b_i$$ — where $\Delta Z$ is the change in the objective function value, $y_i$ is the dual variable for the $i^{th}$ constraint, $\Delta b_i$ is the change in the right-hand side value of the $i^{th}$ constraint.

 - **Reduced Cost:** $$\bar{c}_j = c_j - \sum_{i=1}^{m} y_i a_{ij}$$ — where $\bar{c}_j$ is the reduced cost of $x_j$, $c_j$ is the coefficient of $x_j$, $y_i$ is the dual variable for the $i^{th}$ constraint, $a_{ij}$ is the coefficient of $x_j$ in the $i^{th}$ constraint.



## <a id="-the-5-mistakes-that-cost-marks"></a>🪤 The 5 Mistakes That Cost Marks

- **Mistake 1:** Incorrectly identifying the feasible region in a linear programming problem.

 - *Costs:* 4-6 marks

 - *Fix:* To avoid this, ensure you correctly graph all constraints and identify the area where all constraints are satisfied. Remember, the feasible region is a $\{ (x, y) \}$ set that satisfies all given constraints.

 - **Mistake 2:** Failing to check the corner points of the feasible region for optimality.

 - *Costs:* 5-8 marks

 - *Fix:* Evaluate the objective function at each corner point of the feasible region. The optimal solution will be at one of these points. Use the formula $z = \alpha x + \beta y$ to calculate the value of the objective function at each corner point.

 - **Mistake 3:** Incorrectly applying the graphical method to find the optimal solution.

 - *Costs:* 6-8 marks

 - *Fix:* Ensure you correctly apply the graphical method by first plotting all constraints, then identifying the feasible region. Move the objective function line to the extreme points of the feasible region to find the optimal solution.

 - **Mistake 4:** Not considering the possibility of multiple optimal solutions or degenerate solutions.

 - *Costs:* 4-6 marks

 - *Fix:* Always check if there are multiple lines (or edges) of the feasible region that give the same optimal value for the objective function. If so, the solution is said to be degenerate.

 - **Mistake 5:** Incorrectly solving for the optimal values of decision variables using the simplex method.

 - *Costs:* 8-10 marks

 - *Fix:* Double-check the calculations when using the simplex method, ensuring that each iteration correctly applies the formula $x_{j} = \frac{b_{i} - \sum_{j=1}^{n} a_{ij}x_{j}}{a_{ij}}$. Also, verify that the solution obtained satisfies all the constraints of the problem.



## <a id="-3-solved-pyqs"></a>✏️ 3 Solved PYQs

- **Q1:** A factory produces two types of products, A and B. Each product of type A requires 2 units of raw material and 3 units of labor, while each product of type B requires 3 units of raw material and 2 units of labor. The factory has 1200 units of raw material and 900 units of labor available. Formulate the problem as a linear programming problem to maximize the profit if each product of type A gives a profit of $10 and each product of type B gives a profit of $12.

 - **Trap:** Students often confuse the objective function with the constraints or misinterpret the resource limitations.

 - **Solution:** 

 Let $x$ be the number of products of type A and $y$ be the number of products of type B.

 The objective function to maximize profit is: $P = 10x + 12y$.

 The constraints based on the given resources are:

 $2x + 3y \leq 1200$ (raw material constraint),

 $3x + 2y \leq 900$ (labor constraint),

 $x \geq 0, y \geq 0$ (non-negativity constraint).

 To solve this, we graph the constraints on a coordinate plane and find the feasible region.

 The vertices of the feasible region are found at the intersections of the lines $2x + 3y = 1200$ and $3x + 2y = 900$.

 Solving these equations simultaneously:

 $$\begin{align*}

 2x + 3y &= 1200 \\ 

 3x + 2y &= 900

 \end{align*}$$

 Multiplying the first equation by 2 and the second equation by 3 gives:

 $$\begin{align*}

 4x + 6y &= 2400 \\ 

 9x + 6y &= 2700

 \end{align*}$$

 Subtracting the first equation from the second gives:

 $$5x = 300x = 60$$

 Substituting $x = 60$ into one of the original equations to find $y$:

 $$2(60) + 3y = 1200120 + 3y = 12003y = 1080y = 360$$

 Thus, the maximum profit occurs at $x = 60$ and $y = 360$.

 Substituting these values into the objective function:

 $$P = 10(60) + 12(360)P = 600 + 4320P = 4920$$

 - **Answer:** $4920

 - **Q2:** A diet is to contain at least 60 units of protein and 50 units of calcium. Two foods, Food A and Food B, are to be purchased. Each unit of Food A provides 2 units of protein and 3 units of calcium, while each unit of Food B provides 3 units of protein and 2 units of calcium. If Food A costs $4 per unit and Food B costs $5 per unit, how many units of each food should be purchased to achieve the diet requirements at the least cost?

 - **Trap:** Misinterpreting the requirements for protein and calcium or not setting up the inequalities correctly.

 - **Solution:** 

 Let $x$ be the number of units of Food A and $y$ be the number of units of Food B.

 The constraints based on the diet requirements are:

 $2x + 3y \geq 60$ (protein requirement),

 $3x + 2y \geq 50$ (calcium requirement),

 $x \geq 0, y \geq 0$ (non-negativity constraint).

 The objective function to minimize the cost is: $C = 4x + 5y$.

 To find the minimum cost, we need to graph the constraints and find the feasible region.

 The vertices of the feasible region are found at the intersections of the lines $2x + 3y = 60$ and $3x + 2y = 50$.

 Solving these equations simultaneously:

 $$\begin{align*}

 2x + 3y &= 60 \\ 

 3x + 2y &= 50

 \end{align*}$$

 Multiplying the first equation by 2 and the second equation by 3 gives:

 $$\begin{align*}

 4x + 6y &= 120 \\ 

 9x + 6y &= 150

 \end{align*}$$

 Subtracting the first equation from the second gives:

 $$5x = 30x = 6$$

 Substituting $x = 6$ into one of the original equations to find $y$:

 $$2(6) + 3y = 6012 + 3y = 603y = 48y = 16$$

 Thus, the minimum cost occurs at $x = 6$ and $y = 16$.

 Substituting these values into the objective function:

 $$C = 4(6) + 5(16)C = 24 + 80C = 104$$

 - **Answer:** 104

 - **Q3:** A company produces two products, X and Y, using two machines, A and B. Each unit of product X requires 2 hours on machine A and 1 hour on machine B, and each unit of product Y requires 1 hour on machine A and 2 hours on machine B. The company has 120 hours of machine A time and 100 hours of machine B time available per week. If each unit of product X gives a profit of $20 and each unit of product Y gives a profit of $30, how many units of each product should the company produce to maximize profit?

 - **Trap:** Incorrectly setting up the constraints based on the machine time available.

 - **Solution:** 

 Let $x$ be the number of units of product X and $y$ be the number of units of product Y.

 The constraints based on the machine time available are:

 $2x + y \leq 120$ (machine A constraint),

 $x + 2y \leq 100$ (machine B constraint),

 $x \geq 0, y \geq 0$ (non-negativity constraint).

 The objective function to maximize profit is: $P = 20x + 30y$.

 To find the maximum profit, we need to graph the constraints and find the feasible region.

 The vertices of the feasible region are found at the intersections of the lines $2x + y = 120$ and $x + 2y = 100$.

 Solving these equations simultaneously:

 $$\begin{align*}

 2x + y &= 120 \\ 

 x + 2y &= 100

 \end{align*}$$

 Multiplying the second equation by 2 gives:

 $$2x + 4y = 200$$

 Subtracting the first equation from this gives:

 $$3y = 80y = \frac{80}{3}$$

 Substituting $y = \frac{80}{3}$ into one of the original equations to find $x$:

 $$2x + \frac{80}{3} = 1206x + 80 = 3606x = 280x = \frac{280}{6}x = \frac{140}{3}$$

 Thus, the maximum profit occurs at $x = \frac{140}{3}$ and $y = \frac{80}{3}$.

 Substituting these values into the objective function:

 $$P = 20(\frac{140}{3}) + 30(\frac{80}{3})P = \frac{2800}{3} + \frac{2400}{3}P = \frac{5200}{3}$$

 - **Answer:** $\frac{5200}{3}$



## <a id="-the-one-thing-most-students-get-wrong"></a>🧠 The One Thing Most Students Get Wrong

- **The Core Concept:** The core concept that separates 85% scorers from 95% scorers in Linear Programming is the ability to efficiently solve problems using the $\Delta$-method for sensitivity analysis, specifically understanding how to calculate the range of values for which the solution remains optimal. This involves understanding how changes in the objective function coefficients ($c_j$) or the right-hand side values ($b_i$) affect the feasibility and optimality of the solution.

 - **What 85% scorers do:** Most students focus on solving the linear programming problem using the simplex method or graphical method and then stop, without considering the sensitivity of the solution to changes in the input parameters. They typically:

 * Solve for the optimal solution using the given coefficients and constraints.

 * Fail to analyze how changes in these parameters might affect the solution's feasibility and optimality.

 * Do not calculate the range of values for which the solution remains optimal.

 - **What 95% scorers do:** Top scorers, however, understand the importance of sensitivity analysis and take it a step further by:

 * Using the $\Delta$-method to calculate the range of values for the objective function coefficients ($c_j$) and the right-hand side values ($b_i$) for which the solution remains optimal.

 * Applying the formula for the range of optimality: $$\Delta c_j = \frac{z_j - c_j}{\bar{a}_{j \cdot}}$$ where $z_j$ is the value of the $j^{th}$ variable in the optimal solution, $c_j$ is the coefficient of the $j^{th}$ variable in the objective function, and $\bar{a}_{j \cdot}$ is the $j^{th}$ column of the optimal tableau.

 * Calculating the range of values for the right-hand side parameters ($b_i$) using the formula: $$\Delta b_i = \frac{\bar{x}_i}{\bar{a}_{i \cdot}}$$ where $\bar{x}_i$ is the $i^{th}$ slack/surplus variable in the optimal solution, and $\bar{a}_{i \cdot}$ is the $i^{th}$ row of the optimal tableau.

 * Interpreting the results to understand the sensitivity of the solution to changes in the input parameters.

| Parameter | Formula | Description |
| --- | --- | --- |
| $\Delta c_j$ | $$\frac{z_j - c_j}{\bar{a}_{j \cdot}}$$ | Range of optimality for objective function coefficient $c_j$ |
| $\Delta b_i$ | $$\frac{\bar{x}_i}{\bar{a}_{i \cdot}}$$ | Range of values for right-hand side parameter $b_i$ |



## <a id="-ayushs-note"></a>👁️ Ayush's Note

👁️ Ayush's Note, - **The Hidden Pattern:** In Linear Programming, after analyzing 5+ years of PYQs, it's observed that problems often involve finding the maximum or minimum of a linear function $f(x, y) = ax + by$ subject to constraints of the form $x \\geq 0$, $y \\geq 0$, and $ax + by \\leq c$. A common pattern is the use of corner point theorem, which states that the optimal solution occurs at one of the corner points of the feasible region., - **How to Apply It:** To apply this pattern, first identify all corner points by finding the intersection of the constraint lines. Then, evaluate the objective function at each corner point. The point that gives the maximum or minimum value of the objective function is the optimal solution. For example, given the constraints $x + y \\leq 4$, $2x + y \\leq 5$, $x \\geq 0$, and $y \\geq 0$, and the objective function $f(x, y) = 3x + 2y$, calculate the corner points by solving the equations formed by the constraints, and then evaluate $f(x, y)$ at each point to find the maximum value., - **Graphical Representation:** The feasible region can be graphically represented on a coordinate plane, with the constraint lines dividing the plane into different regions. The corner points of the feasible region are the points where the constraint lines intersect. The objective function can be represented by a family of parallel lines, and the optimal solution is the line that is farthest from the origin in the direction of the objective function., - **Using $$\\Delta$$ Notation:** When dealing with changes in the values of the variables, use the $$\\Delta$$ notation to represent the change. For example, if $x$ changes by $$\\Delta x$$ and $y$ changes by $$\\Delta y$$, the change in the objective function can be represented as $$\\Delta f = \\frac\\partial f\\partial x \\Delta x + \\frac\\partial f\\partial y \\Delta y$$., - **Common PYQs Patterns:** Some common patterns observed in PYQs include: finding the maximum or minimum of a linear function subject to linear constraints, determining the feasibility of a linear programming problem, and finding the range of values of a parameter for which a linear programming problem has a unique solution., - **Formulas to Remember:** The following formulas are crucial in Linear Programming: $f(x, y) = ax + by$, $g(x, y) = cx + dy$, and the corner point theorem. Also, remember that the optimal solution occurs at one of the corner points of the feasible region, which can be found by solving the system of equations formed by the constraints., - **Key Takeaways:** The key takeaways from this section are: identify the corner points of the feasible region, evaluate the objective function at each corner point, and determine the optimal solution. Additionally, be familiar with the graphical representation of the feasible region and the use of $$\\Delta$$ notation to represent changes in the values of the variables. , Constraint, Corner Point, Objective Function Value , $x + y \\leq 4$, (0, 0), 0, $2x + y \\leq 5$, (0, 0), 0, $x \\geq 0$, (4, 0), 12, $y \\geq 0$, (0, 4), 8, Intersection of $x + y \\leq 4$ and $2x + y \\leq 5$, (2, 2), 10

| Constraint | Corner Point | Objective Function Value |
| --- | --- | --- |
| $x + y \leq 4$ | (0, 0) | 0 |
| $2x + y \leq 5$ | (0, 0) | 0 |
| $x \geq 0$ | (4, 0) | 12 |
| $y \geq 0$ | (0, 4) | 8 |
| Intersection of $x + y \leq 4$ and $2x + y \leq 5$ | (2, 2) | 10 |



## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box

- $\Delta x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ is not directly used, but $x = \frac{-b}{2a}$ is crucial for vertex form in Linear Programming.

 - The feasible region is a $convex$ $set$, meaning it contains all line segments connecting any two points in the region.

 - The optimal solution lies at a $vertex$ of the feasible region.

 - For a linear objective function $f(x) = cx$, the optimal value occurs at a vertex of the feasible region.

 - $\

abla f(x) = c$ is used to determine the direction of the objective function.

 - Key facts:

 - The feasible region must satisfy all given constraints.

 - The optimal solution must occur at a vertex of the feasible region.

 - Unbounded feasible regions can have unbounded optimal solutions.

 - Common mistakes:

 - Forgetting to check if the feasible region is empty.

 - Failing to identify all vertices of the feasible region.



## <a id="-practice-mcqs"></a>📝 Practice MCQs


**1. What is the main goal of linear programming?**

- A) To minimize cost
- B) To maximize profit
- C) To minimize resources
- D) To maximize time

**Answer:** B) The main goal of linear programming is to maximize or minimize a linear objective function, often representing profit or cost.

---

**2. Which of the following is a characteristic of a linear programming problem?**

- A) Non-linear objective function
- B) Single constraint
- C) Multiple decision variables
- D) All of the above

**Answer:** C) Linear programming problems typically involve multiple decision variables and linear constraints.

---

**3. What is the feasible region in linear programming?**

- A) The region where all constraints are violated
- B) The region where all constraints are satisfied
- C) The region where the objective function is maximized
- D) The region where the objective function is minimized

**Answer:** B) The feasible region is the set of all possible solutions that satisfy all the constraints of the linear programming problem.

---

**4. Which method is commonly used to solve linear programming problems?**

- A) Graphical method
- B) Simplex method
- C) Dual simplex method
- D) All of the above

**Answer:** D) The graphical method, simplex method, and dual simplex method are all used to solve linear programming problems, depending on the size and complexity of the problem.

---

**5. What is the purpose of the objective function in linear programming?**

- A) To define the constraints
- B) To determine the feasible region
- C) To evaluate the optimality of a solution
- D) To specify the direction of optimization

**Answer:** D) The objective function specifies the direction of optimization, whether it is to maximize or minimize a particular quantity.



---

## <a id="-related-topics"></a>📚 Related Topics

Continue your revision with these related guides:

- 📖 [Application of Derivatives Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-derivatives-class-12-notes)
- 📖 [Vector Algebra Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/vector-algebra-class-12-notes)
- 📖 [Human Reproduction Class 12 Biology Revision — NEET 2026 Grandmaster Guide](/blog/human-reproduction-class-12-notes)
- 📖 [Molecular Basis of Inheritance Class 12 Biology Revision — NEET 2026 Grandmaster Guide](/blog/molecular-basis-of-inheritance-class-12-notes)


---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/linear-programming-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*


---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Application of Derivatives Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-derivatives-class-12-notes)
- 📖 [Vector Algebra Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/vector-algebra-class-12-notes)
- 📖 [Atoms Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/atoms-class-12-notes)
- 📖 [Biodiversity and Conservation Class 12 Biology Revision — NEET 2026 Grandmaster Guide](/blog/biodiversity-and-conservation-class-12-notes)
