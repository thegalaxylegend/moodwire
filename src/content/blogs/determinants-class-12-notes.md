---
heroImage: "/blog-images/determinants-class-12-notes.webp"
title: "Determinants Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide"
description: "Determinants Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-04-01."
category: "Revision"
date: "2026-04-01"
practice_link: "/class-11/mathematics/determinants-class-12-notes"
---


![Determinants Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog-images/determinants-class-12-notes.webp)

*Last Updated: 2026-04-01*




## 📋 Table of Contents

  - [⚡ Core Concept 1: Introduction to Determinants](#-core-concept-1-introduction-to-determinants)
  - [⚡ Core Concept 2: Determinant Properties](#-core-concept-2-determinant-properties)
  - [⚡ Core Concept 3: Expansion by Minors](#-core-concept-3-expansion-by-minors)
  - [⚡ Core Concept 4: Cofactor Expansion](#-core-concept-4-cofactor-expansion)
  - [⚡ Core Concept 5: Area of a Triangle](#-core-concept-5-area-of-a-triangle)
  - [⚡ Core Concept 6: Volume of a Parallelepiped](#-core-concept-6-volume-of-a-parallelepiped)
  - [⚡ Core Concept 7: Determinant of a 2x2 Matrix](#-core-concept-7-determinant-of-a-2x2-matrix)
  - [⚡ Core Concept 8: Determinant of a 3x3 Matrix](#-core-concept-8-determinant-of-a-3x3-matrix)
  - [⚡ Core Concept 9: Inverse of a Matrix](#-core-concept-9-inverse-of-a-matrix)
  - [⚡ Core Concept 10: Solving Systems of Equations](#-core-concept-10-solving-systems-of-equations)
  - [⚡ Core Concept 11: Linear Independence](#-core-concept-11-linear-independence)
  - [⚡ Core Concept 12: Rank of a Matrix](#-core-concept-12-rank-of-a-matrix)
  - [⚡ Core Concept 13: Advanced Properties of Determinants](#-core-concept-13-advanced-properties-of-determinants)
- [🪤 The 5 Trap Mistakes](#-the-5-trap-mistakes)
  - [⚡ Core Concept 14: Applications of Determinants](#-core-concept-14-applications-of-determinants)
  - [⚡ Core Concept 15: Review and Practice](#-core-concept-15-review-and-practice)
- [📝 Master the Test Center — Step-by-Step Learning](#-master-the-test-center-stepbystep-learning)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
  - [🚀 Ready to Ace Your Exam?](#-ready-to-ace-your-exam)
- [📚 Related Topics](#-related-topics)


- [⚡ Core Concept 1: Introduction to Determinants](#-core-concept-1-introduction-to-determinants)
  - [⚡ Core Concept 2: Determinant Properties](#-core-concept-2-determinant-properties)
  - [⚡ Core Concept 3: Expansion by Minors](#-core-concept-3-expansion-by-minors)
  - [⚡ Core Concept 4: Cofactor Expansion](#-core-concept-4-cofactor-expansion)
  - [⚡ Core Concept 5: Area of a Triangle](#-core-concept-5-area-of-a-triangle)
  - [⚡ Core Concept 6: Volume of a Parallelepiped](#-core-concept-6-volume-of-a-parallelepiped)
  - [⚡ Core Concept 7: Determinant of a 2x2 Matrix](#-core-concept-7-determinant-of-a-2x2-matrix)
  - [⚡ Core Concept 8: Determinant of a 3x3 Matrix](#-core-concept-8-determinant-of-a-3x3-matrix)
  - [⚡ Core Concept 9: Inverse of a Matrix](#-core-concept-9-inverse-of-a-matrix)
  - [⚡ Core Concept 10: Solving Systems of Equations](#-core-concept-10-solving-systems-of-equations)
  - [⚡ Core Concept 11: Linear Independence](#-core-concept-11-linear-independence)
  - [⚡ Core Concept 12: Rank of a Matrix](#-core-concept-12-rank-of-a-matrix)
  - [⚡ Core Concept 13: Advanced Properties of Determinants](#-core-concept-13-advanced-properties-of-determinants)

  - [⚡ Core Concept 14: Applications of Determinants](#-core-concept-14-applications-of-determinants)
  - [⚡ Core Concept 15: Review and Practice](#-core-concept-15-review-and-practice)


### <a id="-core-concept-1-introduction-to-determinants"></a>⚡ Core Concept 1: Introduction to Determinants

- **Definition:** The determinant of a square matrix is a scalar value that can be used to describe the scaling effect of the matrix on a region of space.
- **Importance:** Determinants are crucial in linear algebra and are used to find the inverse of a matrix, solve systems of equations, and determine the solvability of systems.

#### Determinant of a 1x1 Matrix
- **Formula:** $$\det(a) = a$$ — $a$ is the element of the 1x1 matrix.
- **Application:** Used to calculate the determinant of a 1x1 matrix.

### <a id="-core-concept-2-determinant-properties"></a>⚡ Core Concept 2: Determinant Properties

- **Property 1:** $$\det(AB) = \det(A) \cdot \det(B)$$ — $A$ and $B$ are square matrices of the same size.
- **Property 2:** $$\det(A^{-1}) = \frac{1}{\det(A)}$$ — $A$ is an invertible square matrix.
- **Property 3:** $$\det(A^T) = \det(A)$$ — $A^T$ is the transpose of matrix $A$.

#### Multiplicative Property
- **Formula:** $$\det(kA) = k^n \cdot \det(A)$$ — $k$ is a scalar, $A$ is an $n \times n$ matrix.
- **Application:** Used to calculate the determinant of a scaled matrix.

### <a id="-core-concept-3-expansion-by-minors"></a>⚡ Core Concept 3: Expansion by Minors

- **Formula:** $$\begin{vmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{vmatrix} = a_{11} \begin{vmatrix} a_{22} & a_{23} \\ a_{32} & a_{33} \end{vmatrix} - a_{12} \begin{vmatrix} a_{21} & a_{23} \\ a_{31} & a_{33} \end{vmatrix} + a_{13} \begin{vmatrix} a_{21} & a_{22} \\ a_{31} & a_{32} \end{vmatrix}$$ — $a_{ij}$ are elements of the matrix.
- **Application:** Used to calculate the determinant of a matrix by expanding along a row or column.

#### Expansion Along a Row
- **Formula:** $$\det(A) = a_{i1}C_{i1} + a_{i2}C_{i2} + \cdots + a_{in}C_{in}$$ — $a_{ij}$ are elements of the matrix, $C_{ij}$ are cofactors.
- **Application:** Used to calculate the determinant of a matrix by expanding along a row.

### <a id="-core-concept-4-cofactor-expansion"></a>⚡ Core Concept 4: Cofactor Expansion

- **Formula:** $$\begin{vmatrix} a & b \\ c & d \end{vmatrix} = a \cdot \begin{vmatrix} d \end{vmatrix} - b \cdot \begin{vmatrix} c \end{vmatrix}$$ — Cofactor of $a$ is $+\begin{vmatrix} d \end{vmatrix}$ and cofactor of $b$ is $-\begin{vmatrix} c \end{vmatrix}$.
- **Importance:** Used to calculate the determinant of a matrix by expanding along a row or column using cofactors.

#### Cofactor of an Element
- **Formula:** $$C_{ij} = (-1)^{i+j} \cdot \det(M_{ij})$$ — $M_{ij}$ is the minor of the element $a_{ij}$.
- **Application:** Used to calculate the cofactor of an element in a matrix.

### <a id="-core-concept-5-area-of-a-triangle"></a>⚡ Core Concept 5: Area of a Triangle

- **Formula:** $$\text{Area} = \frac{1}{2} \cdot |x_1(y_2 - y_3) + x_2(y_3 - y_1) + x_3(y_1 - y_2)|$$ — $(x_1, y_1), (x_2, y_2), (x_3, y_3)$ are vertices of the triangle.
- **Application:** Used to find the area of a triangle given the coordinates of its vertices.

#### Shoelace Formula
- **Formula:** $$\text{Area} = \frac{1}{2} \cdot |x_1y_2 + x_2y_3 + x_3y_1 - y_1x_2 - y_2x_3 - y_3x_1|$$ — $(x_1, y_1), (x_2, y_2), (x_3, y_3)$ are vertices of the triangle.
- **Application:** Used to find the area of a triangle given the coordinates of its vertices.

### <a id="-core-concept-6-volume-of-a-parallelepiped"></a>⚡ Core Concept 6: Volume of a Parallelepiped

- **Formula:** $$V = |\begin{vmatrix} a & b & c \\ d & e & f \\ g & h & i \end{vmatrix}|$$ — $a, b, c, d, e, f, g, h, i$ are components of the edges of the parallelepiped.
- **Importance:** Used to find the volume of a parallelepiped given the components of its edges.

#### Volume of a Parallelepiped Using Determinants
- **Formula:** $$V = |\det(A)|$$ — $A$ is the matrix whose columns are the edges of the parallelepiped.
- **Application:** Used to find the volume of a parallelepiped given the components of its edges.

### <a id="-core-concept-7-determinant-of-a-2x2-matrix"></a>⚡ Core Concept 7: Determinant of a 2x2 Matrix

- **Formula:** $$\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc$$ — $a, b, c, d$ are elements of the matrix.
- **Application:** Used to calculate the determinant of a 2x2 matrix.

#### Determinant of a 2x2 Matrix with Variables
- **Formula:** $$\begin{vmatrix} x & y \\ z & w \end{vmatrix} = xw - yz$$ — $x, y, z, w$ are variables.
- **Application:** Used to calculate the determinant of a 2x2 matrix with variables.

### <a id="-core-concept-8-determinant-of-a-3x3-matrix"></a>⚡ Core Concept 8: Determinant of a 3x3 Matrix

- **Formula:** $$\begin{vmatrix} a & b & c \\ d & e & f \\ g & h & i \end{vmatrix} = a(ei - fh) - b(di - fg) + c(dh - eg)$$ — $a, b, c, d, e, f, g, h, i$ are elements of the matrix.
- **Importance:** Used to calculate the determinant of a 3x3 matrix.

#### Determinant of a 3x3 Matrix Using Cofactor Expansion
- **Formula:** $$\det(A) = a_{11}C_{11} + a_{12}C_{12} + a_{13}C_{13}$$ — $a_{ij}$ are elements of the matrix, $C_{ij}$ are cofactors.
- **Application:** Used to calculate the determinant of a 3x3 matrix using cofactor expansion.

### <a id="-core-concept-9-inverse-of-a-matrix"></a>⚡ Core Concept 9: Inverse of a Matrix

- **Formula:** $$A^{-1} = \frac{1}{\det(A)} \cdot \text{adj}(A)$$ — $\text{adj}(A)$ is the adjugate (also known as the classical adjugate) of $A$.
- **Importance:** Used to find the inverse of a matrix, which is essential for solving systems of equations.

#### Finding the Inverse of a 2x2 Matrix
- **Formula:** $$A^{-1} = \frac{1}{\det(A)} \cdot \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}$$ — $A$ is a 2x2 matrix.
- **Application:** Used to find the inverse of a 2x2 matrix.

### <a id="-core-concept-10-solving-systems-of-equations"></a>⚡ Core Concept 10: Solving Systems of Equations

- **Method:** Use the inverse of the coefficient matrix to solve the system of equations.
- **Importance:** Determinants are used to find the inverse of the coefficient matrix, which is then used to solve the system of equations.

#### Solving a System of Linear Equations Using Cramer's Rule
- **Formula:** $$x_i = \frac{\det(A_i)}{\det(A)}$$ — $A_i$ is the matrix obtained by replacing the $i$-th column of $A$ with the constant vector.
- **Application:** Used to solve a system of linear equations using Cramer's rule.

### <a id="-core-concept-11-linear-independence"></a>⚡ Core Concept 11: Linear Independence

- **Definition:** A set of vectors is said to be linearly independent if none of the vectors can be written as a linear combination of the others.
- **Importance:** Determinants are used to determine the linear independence of a set of vectors.

#### Checking Linear Independence Using Determinants
- **Formula:** $$\det(A) \neq 0$$ — $A$ is the matrix whose columns are the vectors.
- **Application:** Used to check if a set of vectors is linearly independent.

### <a id="-core-concept-12-rank-of-a-matrix"></a>⚡ Core Concept 12: Rank of a Matrix

- **Definition:** The rank of a matrix is the maximum number of linearly independent rows or columns in the matrix.
- **Importance:** Determinants are used to find the rank of a matrix, which is essential for determining the solvability of systems of equations.

#### Finding the Rank of a Matrix Using Determinants
- **Formula:** $$\text{rank}(A) = \max \{k : \det(A_k) \neq 0\}$$ — $A_k$ is the $k \times k$ submatrix of $A$.
- **Application:** Used to find the rank of a matrix.

### <a id="-core-concept-13-advanced-properties-of-determinants"></a>⚡ Core Concept 13: Advanced Properties of Determinants

- **Property 4:** If a matrix has a zero row or column, its determinant is zero.
- **Property 5:** If a matrix has two identical rows or columns, its determinant is zero.

#### ⚡ Cofactor Expansion Along a Row or Column

- **Formula:** $$\begin{vmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{vmatrix} = a_{11}C_{11} + a_{12}C_{12} + a_{13}C_{13}$$ — $C_{ij}$ is the cofactor of $a_{ij}$.
- **Application:** Used to calculate the determinant of a matrix by expanding along a row or column using cofactors.

#### ⚡ Determinant of a Matrix with a Zero Row or Column

- **Property:** If a matrix has a zero row or column, its determinant is zero.
- **Importance:** Used to simplify the calculation of determinants by identifying zero rows or columns.

## <a id="-the-5-trap-mistakes"></a>🪤 The 5 Trap Mistakes

- **Mistake 1:** Forgetting to calculate the determinant of a matrix before applying properties.
- **Mistake 2:** Not using the correct formula for calculating the determinant of a $2 \times 2$ or $3 \times 3$ matrix.
- **Mistake 3:** Expanding along the wrong row or column when calculating the determinant.
- **Mistake 4:** Not using cofactor expansion correctly.
- **Mistake 5:** Forgetting to use the property $\det(AB) = \det(A)\det(B)$ when calculating the determinant of a product of matrices.

#### ⚡ Solving Systems of Equations Using Determinants

- **Method:** Use the inverse of the coefficient matrix to solve the system of equations.
- **Importance:** Determinants are used to find the inverse of the coefficient matrix, which is then used to solve the system of equations.

#### ⚡ Linear Independence and Rank of a Matrix

- **Definition:** A set of vectors is said to be linearly independent if none of the vectors can be written as a linear combination of the others.
- **Importance:** Determinants are used to determine the linear independence of a set of vectors and the rank of a matrix.

### <a id="-core-concept-14-applications-of-determinants"></a>⚡ Core Concept 14: Applications of Determinants

- **Application 1:** Finding the area of a triangle given the coordinates of its vertices.
- **Application 2:** Finding the volume of a parallelepiped given the components of its edges.
- **Application 3:** Solving systems of equations using the inverse of the coefficient matrix.

#### ⚡ Finding the Area of a Triangle

- **Formula:** $$\text{Area} = \frac{1}{2} \cdot |x_1(y_2 - y_3) + x_2(y_3 - y_1) + x_3(y_1 - y_2)|$$ — $(x_1, y_1), (x_2, y_2), (x_3, y_3)$ are vertices of the triangle.
- **Application:** Used to find the area of a triangle given the coordinates of its vertices.

#### ⚡ Finding the Volume of a Parallelepiped

- **Formula:** $$V = |\begin{vmatrix} a & b & c \\ d & e & f \\ g & h & i \end{vmatrix}|$$ — $a, b, c, d, e, f, g, h, i$ are components of the edges of the parallelepiped.
- **Importance:** Used to find the volume of a parallelepiped given the components of its edges.

### <a id="-core-concept-15-review-and-practice"></a>⚡ Core Concept 15: Review and Practice

- **Tip:** Practice calculating determinants of $2 \times 2$ and $3 \times 3$ matrices, as well as applying properties of determinants.
- **Importance:** Reviewing and practicing determinants is essential for mastering the concept and applying it to real-world problems.

## <a id="-master-the-test-center-stepbystep-learning"></a>📝 Master the Test Center — Step-by-Step Learning
To solidify your understanding of determinants and prepare for the JEE 2026, it's essential to practice with a variety of questions and problems. The Test Center at /class-11/mathematics/determinants-class-12-notes is an invaluable resource for this purpose. Here's why you should use it:

1. **Comprehensive Coverage**: The Test Center covers all aspects of determinants, from basic properties to advanced applications, ensuring you have a thorough grasp of the subject.
2. **Practice Questions**: With a vast collection of practice questions, you can test your knowledge, identify areas of weakness, and track your progress over time.
3. **Step-by-Step Solutions**: Detailed, step-by-step solutions to each problem help you understand the thought process and methodology required to solve determinants-related questions.
4. **Time Management**: The Test Center allows you to practice under timed conditions, simulating the actual exam experience and helping you manage your time effectively.
5. **Performance Analysis**: By analyzing your performance, you can identify patterns, strengths, and weaknesses, enabling you to focus your study efforts on areas that need improvement.

To get the most out of the Test Center:

- **Start Early**: Begin practicing with the Test Center as soon as possible to get a head start on your preparation.
- **Set Goals**: Set specific, achievable goals for each practice session to maintain motivation and direction.
- **Review Regularly**: Regular review and practice help reinforce your understanding and prevent forgetting key concepts.
- **Analyze Mistakes**: When you make a mistake, take the time to understand where you went wrong and how to correct it.

By incorporating the Test Center into your study routine, you'll be well-prepared for the determinants section of the JEE 2026 and confident in your ability to tackle even the most challenging problems.

## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box
In the last 5 minutes of your study session, quickly review the key concepts and formulas related to determinants. Focus on the most critical areas, such as:
- Properties of determinants (e.g., $\det(AB) = \det(A)\det(B)$)
- Expansion by minors and cofactor expansion
- Calculating determinants of $2 \times 2$ and $3 \times 3$ matrices
- Applications of determinants (e.g., area of a triangle, volume of a parallelepiped)

Take a few deep breaths, stay calm, and remind yourself that you've prepared well. With consistent practice and dedication, you'll master determinants and achieve success in the JEE 2026.


---

### <a id="-ready-to-ace-your-exam"></a>🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/determinants-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*


---

## <a id="-related-topics"></a>📚 Related Topics

Continue your revision with these related guides:

- 📖 [Application of Integrals Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-integrals-class-12-notes)
- 📖 [Continuity and Differentiability Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/continuity-and-differentiability-class-12-notes)
- 📖 [Amines Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/amines-class-12-notes)
- 📖 [Metallurgy Class 12 Chemistry Revision — JEE & NEET 2026 Grandmaster Guide](/blog/metallurgy-class-12-notes)


---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/mathematics/determinants-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
