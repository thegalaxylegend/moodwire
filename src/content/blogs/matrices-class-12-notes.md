---
heroImage: "/blog-images/matrices-class-12-notes.webp"
title: "Matrices Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide"
description: "Matrices Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-03-30."
category: "Revision"
date: "2026-03-30"
practice_link: "/class-11/mathematics/matrices-class-12-notes"
---


![Matrices Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog-images/matrices-class-12-notes.webp)

*Last Updated: 2026-03-30*




## 📋 Table of Contents

- [🎯 What WILL Come in Your Exam](#-what-will-come-in-your-exam)
- [⚡ Formula Bank](#-formula-bank)
  - [🚀 Ready to Ace Your Exam?](#-ready-to-ace-your-exam)
- [📚 Related Topics](#-related-topics)


</div>




<div [class](/blog/application-of-derivatives-class-12-notes)="quick-summary">

#- [📋 Table of Contents](#-table-of-contents)












## <a id="-what-will-come-in-your-exam"></a>🎯 What WILL Come in Your Exam
* 1-2 matrix multiplication problems involving 2\times2 matrices — always, with a focus on verifying the given result or finding the product of two matrices.
* Determinant of a 2\times2 or 3\times3 matrix — guaranteed, with questions often asking to find the value of x or a constant that makes the determinant equal to a certain value.
* Inverse of a 2\times2 matrix — high-yield topic, frequently tested in the form of "find the [inverse](/blog/inverse-trigonometric-functions-class-12-notes) of matrix A" or "if A^{-1} = ..., find A".
* System of linear equations using matrices and determinants — always comes, often in the form of 2 or 3 equations with 2 or 3 variables, and students are required to solve for the unknowns using Cramer's rule or matrix inversion.
* Consistency and inconsistency of systems of linear equations — frequently tested, with questions asking to determine whether a given system has a unique solution, infinite solutions, or no solution.
* Rank of a matrix — important topic, often tested in conjunction with the system of linear equations, and students need to find the rank of a given matrix to determine the nature of the solution.
* Linear dependence and independence of vectors — always comes, with questions asking to determine whether a set of vectors is linearly independent or dependent, often using the concept of rank and determinant.
* (A^T)^{-1} = (A^{-1})^T and (AB)^{-1} = B^{-1}A^{-1} — key formulas that are frequently used in matrix problems.
* Finding the adjoint of a matrix — high-yield topic, often required to find the inverse of a matrix using the formula A^{-1} = \frac{1}{|A|} \times adj(A).
* Solving systems of linear equations using the matrix method, including finding the solution using the normal form $AX = B$, where A, X, and B are matrices — always comes, with a focus on applying the concepts of matrix multiplication, [inverse](/blog/inverse-trigonometric-functions-class-12-notes), and determinant to solve the system.


## <a id="-formula-bank"></a>⚡ Formula Bank

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
|


---

### <a id="-ready-to-ace-your-exam"></a>🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/matrices-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*


---

## <a id="-related-topics"></a>📚 Related Topics

Continue your revision with these related guides:

- 📖 [Inverse Trigonometric Functions Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/inverse-trigonometric-functions-class-12-notes)
- 📖 [Alcohols, Phenols and Ethers Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/alcohols-phenols-and-ethers-class-12-notes)
- 📖 [Chemistry in Everyday Life Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/chemistry-in-everyday-life-class-12-notes)
- 📖 [Polymers Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/polymers-class-12-notes)


---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/matrices-class-12-notes) now and track your progress against thousands of students.


---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Inverse Trigonometric Functions Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/inverse-trigonometric-functions-class-12-notes)
- 📖 [Alcohols, Phenols and Ethers Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/alcohols-phenols-and-ethers-class-12-notes)
- 📖 [Application of Derivatives Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-derivatives-class-12-notes)
- 📖 [Atoms Class 12 Mathematics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/atoms-class-12-notes)
