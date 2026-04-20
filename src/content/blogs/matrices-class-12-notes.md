---
heroImage: "/blog-images/matrices-class-12-notes.webp"
title: "Matrices Class 12 Exam Prep Revision — Grandmaster Guide"
description: "Matrices Class 12 Exam Prep Revision — Grandmaster Guide Revision Notes. Last Updated: 2026-04-20."
category: "Exam Notes"
date: "2026-04-20"
practice_link: "/practice/matrices-class-12-notes"
manualReview: false
---

## ⚡ Formula Bank
- The determinant of a 2x2 matrix $\begin{bmatrix} a & b \\ c & d \end{bmatrix}$ is given by $\frac{ad}{1} - \frac{bc}{1} = ad - bc$
- The determinant of a 3x3 matrix $\begin{bmatrix} a & b & c \\ d & e & f \\ g & h & i \end{bmatrix}$ is given by $\frac{a(ei-fh)}{1} - \frac{b(di-fg)}{1} + \frac{c(dh-eg)}{1} = a(ei-fh) - b(di-fg) + c(dh-eg)$
- The inverse of a 2x2 matrix $\begin{bmatrix} a & b \\ c & d \end{bmatrix}$ is given by $\frac{1}{\frac{ad}{1} - \frac{bc}{1}} \begin{bmatrix} \frac{d}{1} & \frac{-b}{1} \\ \frac{-c}{1} & \frac{a}{1} \end{bmatrix} = \frac{1}{ad-bc} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}$
- The inverse of a 3x3 matrix $\begin{bmatrix} a & b & c \\ d & e & f \\ g & h & i \end{bmatrix}$ is given by the adjoint matrix divided by the determinant
- The adjoint of a 3x3 matrix $\begin{bmatrix} a & b & c \\ d & e & f \\ g & h & i \end{bmatrix}$ is given by $\begin{bmatrix} \frac{ei-fh}{1} & \frac{-di+fg}{1} & \frac{dh-eg}{1} \\ \frac{-bi+ch}{1} & \frac{ai-cg}{1} & \frac{-ah+bg}{1} \\ \frac{bf-ce}{1} & \frac{-af+cd}{1} & \frac{ae-bd}{1} \end{bmatrix} = \begin{bmatrix} ei-fh & -di+fg & dh-eg \\ -bi+ch & ai-cg & -ah+bg \\ bf-ce & -af+cd & ae-bd \end{bmatrix}$
- The transpose of a matrix is obtained by interchanging its rows into columns
- The rank of a matrix is the maximum number of linearly independent rows or columns
- The eigenvalues of a matrix are the values of $\lambda$ that satisfy the equation $\left| \begin{bmatrix} a & b \\ c & d \end{bmatrix} - \lambda \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix} \right| = 0$
- The eigenvectors of a matrix are the non-zero vectors that satisfy the equation $(A - \lambda I)v = 0$, where $A$ is the matrix, $\lambda$ is the eigenvalue, $I$ is the identity matrix, and $v$ is the eigenvector

 

## 🪤 The 5 Mistakes That Cost Marks
- Not checking the order of the matrices before performing operations
- Forgetting to take the determinant of the matrix before finding its inverse
- Not using the correct formula for finding the inverse of a 3x3 matrix
- Confusing the adjoint and inverse of a matrix
- Not using the properties of matrices, such as the distributive property and the associative property, to simplify calculations

 

## ✏️ 3 Solved PYQs
- **PYQ 1:** If $A = \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}$ and $B = \begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix}$, find the value of $AB$
- Solution: $AB = \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} \begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix} = \begin{bmatrix} 1 \times 5 + 2 \times 7 & 1 \times 6 + 2 \times 8 \\ 3 \times 5 + 4 \times 7 & 3 \times 6 + 4 \times 8 \end{bmatrix} = \begin{bmatrix} 19 & 22 \\ 43 & 50 \end{bmatrix}$
- **PYQ 2:** If $A = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$, find the value of $A^{-1}$
- Solution: Since $A$ is the identity matrix, $A^{-1} = A = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$
- **PYQ 3:** If $A = \begin{bmatrix} 2 & 1 \\ 4 & 2 \end{bmatrix}$, find the value of $|A|$
- Solution: $|A| = \frac{2 \times 2}{1} - \frac{1 \times 4}{1} = 4 - 4 = 0$

 

## 🧠 The One Thing Most Students Get Wrong
- Most students get the concept of inverse of a matrix wrong, they think that the inverse of a matrix is obtained by just interchanging the elements of the matrix, but actually the inverse of a matrix is obtained by using the formula $A^{-1} = \frac{1}{|A|} \times \text{adj}(A)$, where $|A|$ is the determinant of the matrix and $\text{adj}(A)$ is the adjoint of the matrix

 

## 👁️ Ayush's Note
- To find the inverse of a matrix, first find the determinant of the matrix, if the determinant is zero, then the matrix is singular and does not have an inverse
- To find the determinant of a 3x3 matrix, use the formula $|A| = a(ei-fh) - b(di-fg) + c(dh-eg)$
- To find the adjoint of a 3x3 matrix, use the formula $\text{adj}(A) = \begin{bmatrix} ei-fh & -di+fg & dh-eg \\ -bi+ch & ai-cg & -ah+bg \\ bf-ce & -af+cd & ae-bd \end{bmatrix}$
- To find the inverse of a 3x3 matrix, use the formula $A^{-1} = \frac{1}{|A|} \times \text{adj}(A)$

 

## 🔁 Last 5 Minutes Box
- Check the order of the matrices before performing operations
- Check if the matrix is singular before finding its inverse
- Use the correct formula for finding the inverse of a matrix
- Use the properties of matrices to simplify calculations
- Check the calculations carefully to avoid mistakes

 

## 📝 Practice MCQs
**1. What is the value of the determinant of the matrix $\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}$?**
- A) 2
- B) -2
- C) 10
- D) -10
**Answer: B) -2. Explanation: The determinant of the matrix is given by $\frac{1 \times 4}{1} - \frac{2 \times 3}{1} = 4 - 6 = -2$**

**2. What is the value of the inverse of the matrix $\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$?**
- A) $\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$
- B) $\begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$
- C) $\begin{bmatrix} 1 & 1 \\ 1 & 1 \end{bmatrix}$
- D) $\begin{bmatrix} 0 & 0 \\ 0 & 0 \end{bmatrix}$
**Answer: A) $\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$. Explanation: The inverse of the identity matrix is the identity matrix itself**

**3. What is the value of the adjoint of the matrix $\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}$?**
- A) $\begin{bmatrix} 4 & -2 \\ -3 & 1 \end{bmatrix}$
- B) $\begin{bmatrix} 4 & 2 \\ 3 & 1 \end{bmatrix}$
- C) $\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}$
- D) $\begin{bmatrix} 0 & 0 \\ 0 & 0 \end{bmatrix}$
**Answer: A) $\begin{bmatrix} 4 & -2 \\ -3 & 1 \end{bmatrix}$. Explanation: The adjoint of the matrix is given by $\begin{bmatrix} 4 & -2 \\ -3 & 1 \end{bmatrix}$**

**4. What is the value of the inverse of the matrix $\begin{bmatrix} 2 & 1 \\ 4 & 2 \end{bmatrix}$?**
- A) $\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$
- B) $\begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$
- C) $\begin{bmatrix} 1 & 1 \\ 1 & 1 \end{bmatrix}$
- D) The matrix is singular and does not have an inverse
**Answer: D) The matrix is singular and does not have an inverse. Explanation: The determinant of the matrix is zero, so the matrix is singular and does not have an inverse**

**5. What is the value of the determinant of the matrix $\begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}$?**
- A) 0
- B) 1
- C) 2
- D) 3
**Answer: B) 1. Explanation: The determinant of the identity matrix is 1**

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/practice/matrices-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
