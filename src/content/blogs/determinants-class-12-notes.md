---
heroImage: "/blog-images/determinants-class-12-notes.webp"
title: "Determinants Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide"
description: "The ultimate Determinants revision resource for Mathematics students. Focused on 2026 exam patterns with pyq analysis and quick recall tables."
category: "Mathematics"
keywords: "Determinants class 12 notes, Determinants quick revision, Determinants 2026, Determinants JEE 2026, Determinants notes for JEE, class 12 Mathematics revision, Determinants formula sheet, Determinants MCQs"
date: "2026-04-01"
practice_link: "/class-11/mathematics/determinants-class-12-notes"
---

![Determinants Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog-images/determinants-class-12-notes.webp)

*Last Updated: 2026-04-01*


## 📋 Table of Contents

- [⚡ Formula Bank](#-formula-bank)
- [🪤 The 5 Mistakes That Cost Marks](#-the-5-mistakes-that-cost-marks)
- [✏️ 3 Solved PYQs](#-3-solved-pyqs)
- [🧠 The One Thing Most Students Get Wrong](#-the-one-thing-most-students-get-wrong)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
- [📝 Practice MCQs](#-practice-mcqs)


## <a id="-formula-bank"></a>⚡ Formula Bank

- **Determinant of a 2x2 Matrix:** $$\begin{vmatrix} a & b \ c & d \end{vmatrix} = ad - bc$$ — $a, b, c, d$ are elements of the matrix.

 - **Determinant of a 3x3 Matrix:** $$\begin{vmatrix} a & b & c \ d & e & f \ g & h & i \end{vmatrix} = a(ei - fh) - b(di - fg) + c(dh - eg)$$ — $a, b, c, d, e, f, g, h, i$ are elements of the matrix.

 - **Expansion by Minors:** $$\begin{vmatrix} a_{11} & a_{12} & a_{13} \ a_{21} & a_{22} & a_{23} \ a_{31} & a_{32} & a_{33} \end{vmatrix} = a_{11} \begin{vmatrix} a_{22} & a_{23} \ a_{32} & a_{33} \end{vmatrix} - a_{12} \begin{vmatrix} a_{21} & a_{23} \ a_{31} & a_{33} \end{vmatrix} + a_{13} \begin{vmatrix} a_{21} & a_{22} \ a_{31} & a_{32} \end{vmatrix}$$ — $a_{ij}$ are elements of the matrix.

 - **Cofactor Expansion:** $$\begin{vmatrix} a & b \ c & d \end{vmatrix} = a \cdot \begin{vmatrix} d \end{vmatrix} - b \cdot \begin{vmatrix} c \end{vmatrix}$$ — Cofactor of $a$ is $+\begin{vmatrix} d \end{vmatrix}$ and cofactor of $b$ is $-\begin{vmatrix} c \end{vmatrix}$.

 - **Determinant Property 1:** $$\det(AB) = \det(A) \cdot \det(B)$$ — $A$ and $B$ are square matrices of the same size.

 - **Determinant Property 2:** $$\det(A^{-1}) = \frac{1}{\det(A)}$$ — $A$ is an invertible square matrix.

 - **Determinant Property 3:** $$\det(A^T) = \det(A)$$ — $A^T$ is the transpose of matrix $A$.

 - **Area of a Triangle:** $$\text{Area} = \frac{1}{2} \cdot |x_1(y_2 - y_3) + x_2(y_3 - y_1) + x_3(y_1 - y_2)|$$ — $(x_1, y_1), (x_2, y_2), (x_3, y_3)$ are vertices of the triangle.

 - **Volume of a Parallelepiped:** $$V = |\begin{vmatrix} a & b & c \ d & e & f \ g & h & i \end{vmatrix}|$$ — $a, b, c, d, e, f, g, h, i$ are components of the edges of the parallelepiped.



## <a id="-the-5-mistakes-that-cost-marks"></a>🪤 The 5 Mistakes That Cost Marks

Determinants are a crucial part of linear algebra, and mistakes in this area can be costly. Here are the top 5 mistakes students make:

 - **Mistake 1:** Expanding a $3 \times 3$ determinant using the wrong row or column, which leads to incorrect calculation of the determinant's value.

 - *Costs:* 4-6 marks

 - *Fix:* Always expand along the row or column with the most zeros to simplify calculations, and double-check the formula: $$\det A = a(ei - fh) - b(di - fg) + c(dh - eg)$$ where $a, b, c, d, e, f, g, h, i$ are elements in the matrix.

 - **Mistake 2:** Forgetting to apply the properties of determinants when dealing with row operations, resulting in an incorrect determinant value after row reduction.

 - *Costs:* 5-8 marks

 - *Fix:* Remember that if a row is multiplied by a constant, the determinant is multiplied by that constant; if two rows are swapped, the determinant changes sign. The formula to keep in mind is $\det(kA) = k^n \det(A)$ for an $n \times n$ matrix.

 - **Mistake 3:** Incorrectly applying the formula for the determinant of a $2 \times 2$ matrix.

 - *Costs:* 2-4 marks

 - *Fix:* The determinant of a $2 \times 2$ matrix $\begin{pmatrix} a & b \ c & d \end{pmatrix}$ is given by $ad - bc$. Make sure to apply this formula correctly.

 - **Mistake 4:** Not recognizing when a determinant is zero, which implies singularity of the matrix.

 - *Costs:* 3-5 marks

 - *Fix:* A matrix $A$ is singular if and only if $\det(A) = 0$. Check for linear dependency between rows or columns to determine singularity without extensive calculation.

 - **Mistake 5:** Incorrectly calculating the determinant of a matrix product, which is essential for solving systems of equations and finding inverses.

 - *Costs:* 6-10 marks

 - *Fix:* Recall that $\det(AB) = \det(A)\det(B)$. This property simplifies the calculation of determinants for matrix products significantly.



## <a id="-3-solved-pyqs"></a>✏️ 3 Solved PYQs

- **Q1:** If $A = \begin{bmatrix} 1 & 1 \\ 2 & 1 \end{bmatrix}$ and $B = \begin{bmatrix} 2 & 0 \\ 1 & 1 \end{bmatrix}$, then find $|A| + |B|$.

 - **Trap:** Forgetting to calculate determinants of 2x2 matrices using the formula $|A| = ad - bc$.

 - **Solution:** 

 To find $|A|$, we use the formula for the determinant of a 2x2 matrix: 

 $$

 |A| = \begin{vmatrix} 1 & 1 \\ 2 & 1 \end{vmatrix} = (1)(1) - (1)(2) = 1 - 2 = -1

 $$

 Similarly, to find $|B|$, we apply the same formula:

 $$

 |B| = \begin{vmatrix} 2 & 0 \\ 1 & 1 \end{vmatrix} = (2)(1) - (0)(1) = 2

 $$

 Thus, $|A| + |B| = -1 + 2 = 1$.

 - **Answer:** $1$

 - **Q2:** The value of $\Delta = \begin{vmatrix} 1 & 2 & 3 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{vmatrix}$ is

 - **Trap:** Not recognizing that the given matrix is upper triangular.

 - **Solution:** 

 Since the matrix is upper triangular, its determinant is the product of its diagonal entries:

 $$

 \Delta = (1)(1)(1) = 1

 $$

 - **Answer:** $1$

 - **Q3:** If $A = \begin{bmatrix} 2 & -1 \\ 3 & 2 \end{bmatrix}$ and $B = \begin{bmatrix} 1 & 2 \\ -1 & 1 \end{bmatrix}$, then find the value of $|AB|$.

 - **Trap:** Forgetting that $|AB| = |A||B|$.

 - **Solution:** 

 First, find $|A|$ and $|B|$:

 $$

 |A| = \begin{vmatrix} 2 & -1 \\ 3 & 2 \end{vmatrix} = (2)(2) - (-1)(3) = 4 + 3 = 7

 $$

 $$

 |B| = \begin{vmatrix} 1 & 2 \\ -1 & 1 \end{vmatrix} = (1)(1) - (2)(-1) = 1 + 2 = 3

 $$

 Then, use the property $|AB| = |A||B|$:

 $$

 |AB| = |A||B| = (7)(3) = 21

 $$

 - **Answer:** $21$



## <a id="-the-one-thing-most-students-get-wrong"></a>🧠 The One Thing Most Students Get Wrong

- **The Core Concept:** Determinants of matrices, specifically the expansion by minors method. This involves calculating the determinant using the formula $\det(A) = a_{11}C_{11} + a_{12}C_{12} + ... + a_{1n}C_{1n}$, where $C_{ij}$ is the cofactor of the element $a_{ij}$ in the matrix $A$. 

 - **What 85% scorers do:** Most students memorize the formula for $2 \times 2$ and $3 \times 3$ matrices and apply it directly without understanding its derivation or the pattern for larger matrices. They often struggle with:

 * Expansion by minors for larger matrices

 * Calculating cofactors and applying them correctly

 * Simplifying expressions involving determinants

 - **What 95% scorers do:** Top scorers understand that the key to mastering determinants lies in recognizing patterns and applying properties of determinants to simplify calculations. They:

 * Use properties like $\det(AB) = \det(A)\det(B)$ and $\det(A^{-1}) = \frac{1}{\det(A)}$ to simplify problems

 * Apply row or column operations to transform matrices into upper triangular form, where the determinant is the product of the diagonal elements

 * Recognize that expansion by minors can be done from any row or column, choosing the one with the most zeros to simplify calculations

 * Utilize the fact that if a matrix has a zero row or column, its determinant is zero

 * Are adept at using the Laplace expansion formula: $$\det(A) = \sum_{j=1}^{n} (-1)^{i+j} a_{ij}M_{ij}$$ where $M_{ij}$ is the minor obtained by removing the $i^{th}$ row and $j^{th}$ column from $A$

 * Practice problems involving the determinant of block matrices and matrices with specific structures to deepen their understanding

| Property | Formula | Description |
| --- | --- | --- |
| Multiplication | $\det(AB) = \det(A)\det(B)$ | Determinant of a product is the product of determinants |
| Inverse | $\det(A^{-1}) = \frac{1}{\det(A)}$ | Determinant of the inverse is the reciprocal of the determinant |
| Row/Column Operations | $\det(A) = \det(U)$, where $U$ is upper triangular | Determinant of a matrix equals the determinant of its upper triangular form |



## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box

- $\Delta = \begin{vmatrix} a & b & c \ d & e & f \ g & h & i \end{vmatrix}$ is the determinant of a 3x3 matrix.

 - $\begin{vmatrix} a & b \ c & d \end{vmatrix} = ad - bc$ is the determinant of a 2x2 matrix.

 - $\Delta = a(ei - fh) - b(di - fg) + c(dh - eg)$ is the expansion of a 3x3 determinant.

 - $\begin{vmatrix} a & b & c \ d & e & f \ g & h & i \end{vmatrix} = a \begin{vmatrix} e & f \ h & i \end{vmatrix} - b \begin{vmatrix} d & f \ g & i \end{vmatrix} + c \begin{vmatrix} d & e \ g & h \end{vmatrix}$ is the expansion by minors.

 - $\begin{vmatrix} a & b \ c & d \end{vmatrix} = \begin{vmatrix} d & c \ b & a \end{vmatrix}$, the determinant of a 2x2 matrix is equal to the determinant of its transpose.

 - Key facts:

 - Determinants can be used to find the area of a triangle or parallelogram.

 - A determinant can be used to determine the solvability of a system of linear equations.

 - The determinant of the product of two matrices is the product of their determinants.

 - Common mistakes:

 - Forgetting that the determinant of a matrix is only defined for square matrices.

 - Not checking if a matrix is singular (non-invertible) before trying to find its inverse.



## <a id="-practice-mcqs"></a>📝 Practice MCQs


**1. If A is a square matrix of order 3, and |A| = 5, then |3A| is equal to**

- A) 15
- B) 45
- C) 135
- D) 405

**Answer:** C) Since |3A| = 3^3 * |A|, we have |3A| = 27 * 5 = 135

---

**2. If A = [[1, 2], [3, 4]], then the value of |A| is**

- A) -2
- B) -5
- C) -10
- D) -1

**Answer:** A) Using the formula for 2x2 determinant, |A| = (1*4) - (2*3) = 4 - 6 = -2

---

**3. The determinant of the matrix [[1, 0, 0], [0, 1, 0], [0, 0, 1]] is**

- A) 0
- B) 1
- C) -1
- D) None of these

**Answer:** B) Since it's an identity matrix, its determinant is 1

---

**4. If A and B are two square matrices of the same order, then |AB| is equal to**

- A) |A| + |B|
- B) |A| - |B|
- C) |A| * |B|
- D) None of these

**Answer:** C) Using the property of determinants, |AB| = |A| * |B|

---

**5. If |A| = 0, then the matrix A is**

- A) Singular
- B) Non-singular
- C) Symmetric
- D) Skew-symmetric

**Answer:** A) Since |A| = 0, the matrix A is singular



---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Determinants Full Mock Test**](/class-11/mathematics/determinants-class-12-notes) now and track your progress against thousands of students.


---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/determinants-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
