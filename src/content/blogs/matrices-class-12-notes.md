---
heroImage: "/blog-images/matrices-class-12-notes.webp"
title: "Matrices Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide"
description: "Learn Matrices like a pro. Detailed revision notes, solved examples, and "Trap Questions" that most students miss. Updated for the 2026 syllabus."
category: "Mathematics"
keywords: "Matrices class 12 notes, Matrices quick revision, Matrices 2026, Matrices JEE 2026, Matrices notes for JEE, class 12 Mathematics revision, Matrices formula sheet, Matrices MCQs"
date: "2026-03-30"
practice_link: "/class-11/mathematics/matrices-class-12-notes"
---

![Matrices revision guide](/blog-images/matrices-class-12-notes.webp)

*Last Updated: 2026-03-30*

## 🎯 What WILL Come in Your Exam
* 1-2 matrix multiplication problems involving 2\\times2 matrices — always, with a focus on verifying the given result or finding the product of two matrices.
* Determinant of a 2\\times2 or 3\\times3 matrix — guaranteed, with questions often asking to find the value of x or a constant that makes the determinant equal to a certain value.
* Inverse of a 2\\times2 matrix — high-yield topic, frequently tested in the form of "find the inverse of matrix A" or "if A^{-1} = ..., find A".
* System of linear equations using matrices and determinants — always comes, often in the form of 2 or 3 equations with 2 or 3 variables, and students are required to solve for the unknowns using Cramer's rule or matrix inversion.
* Consistency and inconsistency of systems of linear equations — frequently tested, with questions asking to determine whether a given system has a unique solution, infinite solutions, or no solution.
* Rank of a matrix — important topic, often tested in conjunction with the system of linear equations, and students need to find the rank of a given matrix to determine the nature of the solution.
* Linear dependence and independence of vectors — always comes, with questions asking to determine whether a set of vectors is linearly independent or dependent, often using the concept of rank and determinant.
* $$(A^T)^{-1} = (A^{-1})^T$$ and $$(AB)^{-1} = B^{-1}A^{-1}$$ — key formulas that are frequently used in matrix problems.
* Finding the adjoint of a matrix — high-yield topic, often required to find the inverse of a matrix using the formula $$A^{-1} = \\frac{1}{|A|} \times adj(A)$$.
* Solving systems of linear equations using the matrix method, including finding the solution using the normal form $$AX = B$$, where A, X, and B are matrices — always comes, with a focus on applying the concepts of matrix multiplication, inverse, and determinant to solve the system.


## ⚡ Formula Bank

$A = \begin{bmatrix} a_{11} & a_{12} & \cdots & a_{1n} \ a_{21} & a_{22} & \cdots & a_{2n} \ \vdots & \vdots & \ddots & \vdots \ a_{m1} & a_{m2} & \cdots & a_{mn} \end{bmatrix}$: Matrix A of order $m \times n$. 
 $A = [a_{ij}]_{m \times n}$: Matrix A with $m$ rows and $n$ columns. 
 $A^T = [a_{ji}]_{n \times m}$: Transpose of matrix A. 
 $A = I_n$ : Identity matrix of order $n$. 
 $O = [0]_{m \times n}$: Null matrix of order $m \times n$. 
 $A + B = [a_{ij} + b_{ij}]_{m \times n}$: Sum of matrices A and B. 
 $kA = [ka_{ij}]_{m \times n}$: Scalar multiplication of matrix A. 
 $AB = [c_{ij}]_{m \times p}$ where $c_{ij} = \sum_{k=1}^{n} a_{ik}b_{kj}$: Product of matrices A and B. 
 $|A| = \begin{vmatrix} a_{11} & a_{12} & \cdots & a_{1n} \ a_{21} & a_{22} & \cdots & a_{2n} \ \vdots & \vdots & \ddots & \vdots \ a_{n1} & a_{n2} & \cdots & a_{nn} \end{vmatrix}$: Determinant of matrix A. 
 $|A| = a_{11}C_{11} + a_{12}C_{12} + \cdots + a_{1n}C_{1n}$: Expansion of determinant by first row. 
 $C_{ij} = (-1)^{i+j}M_{ij}$: Cofactor of $a_{ij}$. 
 $M_{ij} = \begin{vmatrix} a_{11} & \cdots & a_{1j-1} & a_{1j+1} & \cdots & a_{1n} \ a_{21} & \cdots & a_{2j-1} & a_{2j+1} & \cdots & a_{2n} \ \vdots & \ddots & \vdots & \vdots & \ddots & \vdots \ a_{i-1,1} & \cdots & a_{i-1,j-1} & a_{i-1,j+1} & \cdots & a_{i-1,n} \ a_{i+1,1} & \cdots & a_{i+1,j-1} & a_{i+1,j+1} & \cdots & a_{i+1,n} \ \vdots & \ddots & \vdots & \vdots & \ddots & \vdots \ a_{n1} & \cdots & a_{nj-1} & a_{nj+1} & \cdots & a_{nn} \end{vmatrix}$: Minor of $a_{ij}$. 
 $A^{-1} = \frac{adj(A)}{|A|}$: Inverse of matrix A. 
 $A^{m} = AA\cdots A$: $m^{th}$ power of matrix A. 
 $f(A) = \alpha_0I + \alpha_1A + \cdots + \alpha_nA^n$: Polynomial function of matrix A. 
 $e^{At} = I + At + \frac{(At)^2}{2!} + \cdots + \frac{(At)^n}{n!} + \cdots$: Matrix exponential. 
 $A^{1/n} = \begin{bmatrix} a & b \ c & d \end{bmatrix}$: $n^{th}$ root of $2 \times 2$ matrix. 
 $|AB| = |A||B|$: Property of determinant for matrix multiplication. 
 $|kA| = k^n|A|$: Property of determinant for scalar multiplication. 
 $|A^m| = |A|^m$: Property of determinant for power of matrix. 
 $|I_n| = 1$: Determinant of identity matrix. 
 $|O| = 0$: Determinant of null matrix.


| Matrix Operation | Formula | Description |
| --- | --- | --- |
| Addition | $A + B = [a_{ij} + b_{ij}]_{m \times n}$ | Sum of matrices A and B |
| Multiplication | $AB = [c_{ij}]_{m \times p}$ where $c_{ij} = \sum_{k=1}^{n} a_{ik}b_{kj}$ | Product of matrices A and B |
| Determinant | $|A| = \begin{vmatrix} a_{11} & a_{12} & \cdots & a_{1n} \ a_{21} & a_{22} & \cdots & a_{2n} \ \vdots & \vdots & \ddots & \vdots \ a_{n1} & a_{n2} & \cdots & a_{nn} \end{vmatrix}$ | Determinant of matrix A |
| Inverse | $A^{-1} = \frac{adj(A)}{|A|}$ | Inverse of matrix A |
| Power | $A^{m} = AA\cdots A$ | $m^{th}$ power of matrix A |
| Polynomial Function | $f(A) = \alpha_0I + \alpha_1A + \cdots + \alpha_nA^n$ | Polynomial function of matrix A |
| Matrix Exponential | $e^{At} = I + At + \frac{(At)^2}{2!} + \cdots + \frac{(At)^n}{n!} + \cdots$ | Matrix exponential |
| $n^{th}$ Root | $A^{1/n} = \begin{bmatrix} a & b \ c & d \end{bmatrix}$ | $n^{th}$ root of $2 \times 2$ matrix |


## 🪤 The 5 Mistakes That Cost Marks

Mistake: Incorrectly applying the formula for the inverse of a $2 \times 2$ matrix, i.e., $\begin{pmatrix} a & b \ c & d \end{pmatrix}^{-1} = \frac{1}{ad - bc} \begin{pmatrix} d & -b \ -c & a \end{pmatrix}$ without checking if $ad - bc = 0$. 
Costs: Full 4 marks for a single matrix inversion question.
Fix: Always check the determinant $ad - bc$ before applying the inverse formula. If $ad - bc = 0$, then the matrix is singular and does not have an inverse.

Mistake: Using $A^{-1}$ without verifying that $AA^{-1} = I$ where $I$ is the identity matrix, especially in $3 \times 3$ matrix operations.
Costs: Up to 6 marks for every incorrect inverse matrix calculation.
Fix: After finding the inverse, always multiply it by the original matrix to verify that the result is the identity matrix $I$. For a $2 \times 2$ matrix, this step can be skipped if the determinant is correctly checked.

Mistake: Incorrectly calculating the determinant of a $3 \times 3$ matrix using the formula $\begin{vmatrix} a & b & c \ d & e & f \ g & h & i \end{vmatrix} = a(ei - fh) - b(di - fg) + c(dh - eg)$ without expanding it correctly.
Costs: Full 4 marks for determinant calculation questions.
Fix: Ensure that the expansion is done correctly by following the formula step by step. Double-check the signs of each term in the expansion to avoid errors.

Mistake: Failing to reduce a matrix to its echelon form or reduced row echelon form correctly, leading to incorrect solutions for systems of linear equations.
Costs: Up to 8 marks for every incorrect solution of a system of linear equations.
Fix: Always follow the systematic procedure for row reduction: start with the leftmost nonzero column, create a leading 1, and eliminate all other entries in that column. Move to the next column to the right and repeat the process until the matrix is in the desired form.

Mistake: Incorrectly applying the formula for the multiplication of two matrices, i.e., $(AB)_{ij} = \sum_{k=1}^{n} A_{ik}B_{kj}$, especially when dealing with matrices of different sizes.
Costs: Full 4 marks for every incorrect matrix multiplication.
Fix: Always check the dimensions of the matrices before multiplying them. The number of columns in the first matrix must equal the number of rows in the second matrix. Perform the multiplication step by step, calculating each element of the resulting matrix according to the formula.


| Mistake | Costs | Fix |
| --- | --- | --- |
| Incorrect matrix inversion without checking determinant | Full 4 marks | Check determinant before inverting |
| Using $A^{-1}$ without verification | Up to 6 marks | Verify $AA^{-1} = I$ |
| Incorrect $3 \times 3$ determinant calculation | Full 4 marks | Correctly expand determinant |
| Incorrect matrix reduction to echelon form | Up to 8 marks | Follow systematic row reduction |
| Incorrect matrix multiplication | Full 4 marks | Check dimensions and calculate step by step |


## ✏️ 3 Solved PYQs

Q: If $A = \begin{bmatrix} 1 & 2 \ -2 & 1 \end{bmatrix}$ and $B = \begin{bmatrix} 2 & 0 \ 1 & 1 \end{bmatrix}$, then find the matrix $C$ such that $A + B + C = 0$. <br>
 Trap in this question: Students often get confused with matrix addition and subtraction, and they might forget that matrix $C$ should be of the same order as $A$ and $B$. <br>
 Solution: We have, $A + B + C = 0 implies C = - (A + B)$. First, we find $A + B$ as follows: $A + B = \begin{bmatrix} 1 & 2 \ -2 & 1 \end{bmatrix} + \begin{bmatrix} 2 & 0 \ 1 & 1 \end{bmatrix} = \begin{bmatrix} 1 + 2 & 2 + 0 \ -2 + 1 & 1 + 1 \end{bmatrix} = \begin{bmatrix} 3 & 2 \ -1 & 2 \end{bmatrix}$. Therefore, $C = - (A + B) = - \begin{bmatrix} 3 & 2 \ -1 & 2 \end{bmatrix} = \begin{bmatrix} -3 & -2 \ 1 & -2 \end{bmatrix}$. <br>
 Answer: $C = \begin{bmatrix} -3 & -2 \ 1 & -2 \end{bmatrix}$. <br><br>
 
 Q: If the matrix $A$ is given by $A = \begin{bmatrix} 2 & 1 \ 0 & -2 \end{bmatrix}$, then find $A^{10}$. <br>
 Trap in this question: Students might think that they need to multiply the matrix $A$ by itself 10 times. However, there's a more efficient way to solve this problem by using the property of powers of upper triangular matrices. <br>
 Solution: Since $A$ is an upper triangular matrix, the powers of $A$ will also be upper triangular matrices, with the diagonal elements being the powers of the diagonal elements of $A$. Therefore, the diagonal elements of $A^{10}$ will be $2^{10}$ and $(-2)^{10}$. The upper triangular part will remain the same as $A$, i.e., the $(1, 2)$th element will be $1 \times (2^{9} + 2^{8} + \cdots + 1)$, because for each power of $A$, the $(1, 2)$th element gets multiplied by the $(1, 1)$th element of $A$ (which is 2) and added to the $(1, 2)$th element of $A$. Thus, $A^{10} = \begin{bmatrix} 2^{10} & 1 \times (2^{9} + 2^{8} + \cdots + 1) \ 0 & (-2)^{10} \end{bmatrix}$. <br>
 Answer: $A^{10} = \begin{bmatrix} 1024 & 1 \times (2^{9} + 2^{8} + \cdots + 1) \ 0 & 1024 \end{bmatrix} = \begin{bmatrix} 1024 & 2045 \ 0 & 1024 \end{bmatrix}$. <br><br>
 
 Q: Let $A = \begin{bmatrix} 1 & 1 \ -1 & 1 \end{bmatrix}$ and $B = \begin{bmatrix} 1 & -1 \ 1 & 1 \end{bmatrix}$. Then, find $(A + B)^2$. <br>
 Trap in this question: Students might try to find the square of the sum of matrices $A$ and $B$ by first finding the sum $A + B$ and then squaring it. However, they should use the formula $(A + B)^2 = A^2 + AB + BA + B^2$. <br>
 Solution: We first find $A^2$, $B^2$, $AB$, and $BA$. $A^2 = \begin{bmatrix} 1 & 1 \ -1 & 1 \end{bmatrix} \begin{bmatrix} 1 & 1 \ -1 & 1 \end{bmatrix} = \begin{bmatrix} 0 & 2 \ -2 & 0 \end{bmatrix}$, $B^2 = \begin{bmatrix} 1 & -1 \ 1 & 1 \end{bmatrix} \begin{bmatrix} 1 & -1 \ 1 & 1 \end{bmatrix} = \begin{bmatrix} 0 & -2 \ 2 & 0 \end{bmatrix}$, $AB = \begin{bmatrix} 1 & 1 \ -1 & 1 \end{bmatrix} \begin{bmatrix} 1 & -1 \ 1 & 1 \end{bmatrix} = \begin{bmatrix} 2 & 0 \ 0 & 2 \end{bmatrix}$, $BA = \begin{bmatrix} 1 & -1 \ 1 & 1 \end{bmatrix} \begin{bmatrix} 1 & 1 \ -1 & 1 \end{bmatrix} = \begin{bmatrix} 2 & 0 \ 0 & 2 \end{bmatrix}$. Thus, $(A + B)^2 = \begin{bmatrix} 0 & 2 \ -2 & 0 \end{bmatrix} + \begin{bmatrix} 2 & 0 \ 0 & 2 \end{bmatrix} + \begin{bmatrix} 2 & 0 \ 0 & 2 \end{bmatrix} + \begin{bmatrix} 0 & -2 \ 2 & 0 \end{bmatrix} = \begin{bmatrix} 4 & 0 \ 0 & 4 \end{bmatrix}$. <br>
 Answer: $(A + B)^2 = \begin{bmatrix} 4 & 0 \ 0 & 4 \end{bmatrix}$.


| Matrix | Operation | Result |
| --- | --- | --- |
| $A = \begin{bmatrix} 1 & 2 \ -2 & 1 \end{bmatrix}$ | $B = \begin{bmatrix} 2 & 0 \ 1 & 1 \end{bmatrix}$ | $A + B = \begin{bmatrix} 3 & 2 \ -1 & 2 \end{bmatrix}$ |
| $A = \begin{bmatrix} 2 & 1 \ 0 & -2 \end{bmatrix}$ | $A^{10}$ | $A^{10} = \begin{bmatrix} 1024 & 2045 \ 0 & 1024 \end{bmatrix}$ |
| $A = \begin{bmatrix} 1 & 1 \ -1 & 1 \end{bmatrix}$ | $(A + B)^2$ | $(A + B)^2 = \begin{bmatrix} 4 & 0 \ 0 & 4 \end{bmatrix}$ |


## ✅ The One Thing Most Students Get Wrong

When dealing with matrices, one concept that separates 85% scorers from 95% scorers is the understanding and application of $\text{Eigenvalues}$ and $\text{Eigenvectors}$. Most students can solve basic problems related to matrices, such as addition, subtraction, and multiplication. However, when it comes to more complex concepts like $\text{Eigenvalues}$ and $\text{Eigenvectors}$, many students struggle. An $\text{Eigenvalue}$ $\lambda$ of a matrix $A$ is a scalar such that there exists a non-zero vector $v$ (the corresponding $\text{Eigenvector}$) that, when the matrix $A$ is multiplied by $v$, the result is equal to $\lambda$ times $v$. This can be expressed as $Av = \lambda v$. To find $\text{Eigenvalues}$, we solve the characteristic equation $|A - \lambda I| = 0$, where $I$ is the identity matrix. The solution to this equation gives us the $\text{Eigenvalues}$ of $A$. For example, given a matrix $A = \begin{pmatrix} 2 & 1 \ 1 & 1 \end{pmatrix}$, to find its $\text{Eigenvalues}$, we set up the characteristic equation as $\begin{vmatrix} 2-\lambda & 1 \ 1 & 1-\lambda \end{vmatrix} = 0$. Expanding this determinant gives us $(2-\lambda)(1-\lambda) - 1 = 0$, which simplifies to $\lambda^2 - 3\lambda + 1 = 0$. Solving this quadratic equation gives us the $\text{Eigenvalues}$ of $A$. Understanding how to apply these concepts to solve problems related to diagonalization, Markov chains, and system of differential equations is crucial for scoring high in matrices. Many students get this concept wrong because they either fail to understand the theoretical background or are not practiced enough in applying these concepts to a variety of problems. Therefore, ensuring a strong grasp of $\text{Eigenvalues}$ and $\text{Eigenvectors}$ is key to excelling in matrices and distinguishing oneself from the average scorer.


| Concept | Formula | Application |
| --- | --- | --- |
| $\text{Eigenvalues}$ | $|A - \lambda I| = 0$ | Diagonalization, System of Differential Equations |
| $\text{Eigenvectors}$ | $Av = \lambda v$ | Markov Chains, Data Analysis |


## 👁️ Ayush's Note

After analyzing 5 years of PYQs, I noticed a pattern in the matrices section that can help you solve questions quickly. The pattern revolves around the properties of matrices, specifically the determinant and inverse of a matrix. 

For a matrix $A = \begin{bmatrix} a & b \\ c & d \end{bmatrix}$, the determinant is given by $|A| = ad - bc$. If $|A| = 0$, then the matrix is singular and does not have an inverse. 

However, if $|A| \neq 0$, then the inverse of the matrix exists and is given by $A^{-1} = \frac{1}{|A|} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}$. 

Now, here's the pattern: in most questions, you'll be given a matrix $A$ and asked to find $A^n$ or $A^{-n}$. To solve these questions, you can use the property that $A^n = \begin{bmatrix} a & b \\ c & d \end{bmatrix}^n = \begin{bmatrix} a^n & b^n \\ c^n & d^n \end{bmatrix}$ is not true in general. 

However, if you can express $A$ as $A = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix} + B$, where $B = \begin{bmatrix} a-1 & b \\ c & d-1 \end{bmatrix}$, then you can use the binomial expansion to find $A^n$. 

The binomial expansion states that $(1 + x)^n = 1 + nx + \frac{n(n-1)}{2}x^2 + ...$. Applying this to $A = I + B$, we get $A^n = (I + B)^n = I + nB + \frac{n(n-1)}{2}B^2 + ...$. 

This pattern can be used to solve questions involving $A^n$ or $A^{-n}$. 

For example, if you're given a matrix $A = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}$ and asked to find $A^3$, you can express $A$ as $A = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix} + \begin{bmatrix} 1 & 1 \\ 1 & 1 \end{bmatrix}$. 

Then, using the binomial expansion, you can find $A^3 = (I + B)^3 = I + 3B + 3B^2 + B^3$. 

By calculating the powers of $B$, you can find $A^3$. 

This pattern can be applied to any matrix $A$ and can help you solve questions involving $A^n$ or $A^{-n}$ quickly and efficiently. 

The key is to express $A$ as $A = I + B$ and then use the binomial expansion to find $A^n$.

Some other important results that can be used to solve questions involving matrices are:
- If $A$ and $B$ are square matrices of the same order, then $|AB| = |A||B|$.
- If $A$ is a square matrix, then $|A^n| = |A|^n$.
- If $A$ is a square matrix and $|A| \neq 0$, then $|A^{-1}| = \frac{1}{|A|}$.

These results can be used to solve questions involving determinants and inverses of matrices.

In the exam, make sure to read the question carefully and identify the pattern or result that can be used to solve it. 
With practice and experience, you'll be able to recognize these patterns and solve questions involving matrices quickly and efficiently.

The following table summarizes some important results and formulas involving matrices:


| Result | Formula |
| --- | --- |
| Determinant of a 2x2 matrix | $|A| = ad - bc$ |
| Inverse of a 2x2 matrix | $A^{-1} = \frac{1}{|A|} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}$ |
| Binomial expansion | $(1 + x)^n = 1 + nx + \frac{n(n-1)}{2}x^2 + ...$ |
| Determinant of a product of matrices | $|AB| = |A||B|$ |
| Determinant of a power of a matrix | $|A^n| = |A|^n$ |
| Determinant of an inverse matrix | $|A^{-1}| = \frac{1}{|A|}$ |


## 🔁 Last 5 Minutes Box

Matrices are a crucial topic in Linear Algebra, frequently tested in JEE and NEET exams. 
 To quickly revise, focus on the following key points:
 
 **Formulas:**
 * $A = \begin{bmatrix} a_{11} & a_{12} \ a_{21} & a_{22} \end{bmatrix}$ represents a 2x2 matrix.
 * $A^{-1} = \frac{1}{ad - bc} \begin{bmatrix} d & -b \ -c & a \end{bmatrix}$ is the formula for the inverse of a 2x2 matrix.
 * $\det(A) = ad - bc$ gives the determinant of a 2x2 matrix $A$.
 * $(AB)^{-1} = B^{-1}A^{-1}$, which is essential for matrix multiplication and inversion.
 * $\begin{bmatrix} a & b \ c & d \end{bmatrix} \begin{bmatrix} e & f \ g & h \end{bmatrix} = \begin{bmatrix} ae+bg & af+bh \ ce+dg & cf+dh \end{bmatrix}$, representing the multiplication of two 2x2 matrices.
 
 **Facts:**
 * Matrices can be added or subtracted if they have the same dimensions.
 * Matrix multiplication is not commutative, i.e., $AB \neq BA$ in general.
 * For a square matrix to have an inverse, its determinant must be non-zero.
 
 **Common Mistakes:**
 * Assuming matrix multiplication is commutative.
 * Forgetting to check if the determinant is non-zero before finding the inverse of a matrix.
 
 **Quick Revision Tips:**
 Revise the types of matrices: diagonal, symmetric, skew-symmetric, and orthogonal.
 Note that $A^{T}A$ and $AA^{T}$ are symmetric for any matrix $A$.
 Understand that a matrix $A$ is invertible if and only if $\det(A) \neq 0$.
 Be aware of the properties of orthogonal matrices, particularly that $A^{-1} = A^{T}$ for an orthogonal matrix $A$.


| Matrix Type | Definition | Properties |
| --- | --- | --- |
| Diagonal Matrix | A matrix with non-zero elements only on the main diagonal. | Easy to compute powers and inverse. |
| Symmetric Matrix | A matrix that is equal to its transpose, $A = A^{T}$. | Has real eigenvalues and orthogonal eigenvectors. |
| Skew-Symmetric Matrix | A matrix whose transpose is its negative, $A^{T} = -A$. | Has pure imaginary eigenvalues and orthogonal eigenvectors. |
| Orthogonal Matrix | A square matrix whose columns and rows are orthonormal vectors, $AA^{T} = A^{T}A = I$. | Preserves length and angle, $A^{-1} = A^{T}$. |


## 📝 Practice MCQs


**1. If A is a square matrix of order 3, and |A| = 5, then |3A| is equal to**
15
45
135
125

**Answer:** C) Since |A| = 5, and |3A| = 3^3 * |A|, then |3A| = 27 * 5 = 135


**2. If A = [[1, 2], [3, 4]], then the determinant of A is**
-2
-5
-10
-1

**Answer:** B) The determinant of a 2x2 matrix A = [[a, b], [c, d]] is given by ad - bc, so for A = [[1, 2], [3, 4]], |A| = (1*4) - (2*3) = 4 - 6 = -2


**3. If A and B are two matrices of the same order, then (A + B)^2 is equal to**
A^2 + 2AB + B^2
A^2 + AB + B^2
A^2 + 2AB - B^2
A^2 - AB + B^2

**Answer:** A) By Binomial expansion, (A + B)^2 = A^2 + 2AB + B^2


**4. If A = [[1, 2], [3, 4]] and B = [[5, 6], [7, 8]], then the product AB is**
[[19, 22], [43, 50]]
[[15, 18], [33, 40]]
[[17, 20], [39, 46]]
[[19, 24], [45, 54]]

**Answer:** A) AB = [[1*5 + 2*7, 1*6 + 2*8], [3*5 + 4*7, 3*6 + 4*8]] = [[5 + 14, 6 + 16], [15 + 28, 18 + 32]] = [[19, 22], [43, 50]]


**5. If A is a symmetric matrix, then**
A' = -A
A' = A
A' = 2A
A' = 0

**Answer:** B) A matrix A is said to be symmetric if A' = A, where A' is the transpose of A



---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Matrices Full Mock Test**](/class-11/mathematics/matrices-class-12-notes) now and track your progress against thousands of students.

