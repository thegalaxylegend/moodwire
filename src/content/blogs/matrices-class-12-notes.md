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
- A = [a₁₁, a₁₂, ..., a₁ₙ; a₂₁, a₂₂, ..., a₂ₙ; ...; aₙ₁, aₙ₂, ..., aₙₙ] is a matrix of order m × n
- A = [aᵢⱼ]ₘₓₙ is a matrix of order m × n
- A⁺ = (AᵀA)⁻¹Aᵀ is the Moore-Penrose inverse of A
- |A| = a₁₁C₁ + a₁₂C₂ + ... + a₁ₙCₙ is the determinant of A
- adj(A) = [Cᵢⱼ]ᵀ is the adjugate matrix of A
- A⁻¹ = (1/|A|)adj(A) is the inverse of A
- Aᵀ = [aⱼᵢ] is the transpose of A
- AᵀA = I is the condition for orthogonal matrix A
- AA⁻¹ = I is the condition for invertible matrix A
- |AB| = |A||B| is the property of determinants for matrix multiplication
- (AB)⁻¹ = B⁻¹A⁻¹ is the property of inverses for matrix multiplication
- (Aᵀ)⁻¹ = (A⁻¹)ᵀ is the property of inverses for transpose

## 🪤 The 5 Mistakes That Cost Marks
- Not checking the order of matrices before performing operations
- Not calculating the determinant before finding the inverse
- Not using the properties of determinants and inverses for matrix multiplication
- Not applying the Moore-Penrose inverse for non-invertible matrices
- Not using the adjugate matrix to find the inverse of a matrix

## ✏️ 3 Solved PYQs
- **Question 1:** If A = [1, 2; 3, 4] and B = [5, 6; 7, 8], find |AB| and |A||B|
- |AB| = | [1*5 + 2*7, 1*6 + 2*8; 3*5 + 4*7, 3*6 + 4*8] | = | [19, 22; 43, 50] | = 19*50 - 22*43 = 950 - 946 = 4
- |A||B| = | [1, 2; 3, 4] | * | [5, 6; 7, 8] | = (1*4 - 2*3) * (5*8 - 6*7) = (-2) * (-7) = 14
- **Question 2:** If A = [2, 1; 4, 3], find A⁻¹
- |A| = 2*3 - 1*4 = 2
- adj(
A) = [3, -1; -4, 2]
- A⁻¹ = (1/2) * [3, -1; -4, 2] = [3/2, -1/2; -2, 1]
- **Question 3:** If A = [1, 2; 3, 4] and x = [x₁; x₂], find x if Ax = [9; 12]
- [1, 2; 3, 4] * [x₁; x₂] = [9; 12]
- x₁ + 2x₂ = 9
- 3x₁ + 4x₂ = 12
- Solve the system of equations to find x₁ and x₂
## 🧠 The One Thing Most Students Get Wrong
- Most students get the concept of matrix multiplication wrong, they think it is similar to the multiplication of numbers, but it is not, the number of columns ∈ the first matrix should be equal to the number of rows ∈ the second matrix
## 👁️ Ayush's Note
- To find the inverse of a matrix, first check if the determinant is non-zero, if it is zero, then the matrix is not invertible
- To find the determinant of a 3x3 matrix, use the formula |A| = a(ei - fh) - b(di - fg) + c(dh - eg)
- To find the adjugate matrix, find the cofactor matrix and transpose it
- To find the Moore-Penrose inverse, use the formula A⁺ = (Aᵀ
A) ⁻¹Aᵀ
## 🔁 Last 5 Minutes Box
- Check the order of matrices before performing operations
- Check the determinant before finding the inverse
- Use the properties of determinants and inverses for matrix multiplication
- Apply the Moore-Penrose inverse for non-invertible matrices
- Use the adjugate matrix to find the inverse of a matrix
## 📝 Practice MCQs
**1. Question:** If A = [1, 2; 3, 4] and B = [5, 6; 7, 8], what is |AB|?
-
A) 2
-
B) 4
-
C) 14
-
D) 20

**Answer:** B) 4. |AB| = | [1*5 + 2*7, 1*6 + 2*8; 3*5 + 4*7, 3*6 + 4*8] | = | [19, 22; 43, 50] | = 19*50 - 22*43 = 950 - 946 = 4

**2. Question:** If A = [2, 1; 4, 3], what is A⁻¹?
-
A) [3/2, -1/2; -2, 1]
-
B) [1/2, -1/2; -2, 1]
-
C) [3/2, 1/2; 2, 1]
-
D) [1/2, 1/2; -2, 1]

**Answer:** A) [3/2, -1/2; -2, 1]. |A| = 2*3 - 1*4 = 2, adj(A) = [3, -1; -4, 2], A⁻¹ = (1/2) * [3, -1; -4, 2] = [3/2, -1/2; -2, 1]

**3. Question:** If A = [1, 2; 3, 4] and x = [x₁; x₂], what is x if Ax = [9; 12]?
-
A) [1; 2]
-
B) [2; 3]
-
C) [3; 4]
-
D) [1; 1]

**Answer:** B) [2; 3]. [1, 2; 3, 4] * [x₁; x₂] = [9; 12], x₁ + 2x₂ = 9, 3x₁ + 4x₂ = 12, Solve the system of equations to find x₁ and x₂

**4. Question:** What is the condition for a matrix to be orthogonal?
-
A) AᵀA = I
-
B) AAᵀ = I
-
C) AᵀA = 0
-
D) AAᵀ = 0

**Answer:** A) AᵀA = I. A matrix is orthogonal if AᵀA = I

**5. Question:** What is the property of inverses for matrix multiplication?
-
A) (A
B) ⁻¹ = A⁻¹B⁻¹
-
B) (A
B) ⁻¹ = B⁻¹A⁻¹
-
C) (A
B) ⁻¹ = A⁻¹ + B⁻¹
-
D) (A
B) ⁻¹ = A⁻¹ - B⁻¹

**Answer:** B) (AB)⁻¹ = B⁻¹A⁻¹. (AB)⁻¹ = B⁻¹A⁻¹ is the property of inverses for matrix multiplication

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/practice/matrices-class-12-notes) now and track your progress against thousands of students.

> 🎬 **[Watch video explanations on YouTube →](https://www.youtube.com/results?search_query=Matrices%20Class%2012%20Exam%20Prep%20Revision%20%E2%80%94%20Grandmaster%20Guide%20JEE%20NEET%20revision)**

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*


---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Aldehydes Ketones And Carboxylic Acids Class 12 Exam Prep Revision — Grandmaster Guide](/blog/aldehydes-ketones-and-carboxylic-acids-class-12-notes)
- 📖 [Amines Class 12 Exam Prep Revision — Grandmaster Guide](/blog/amines-class-12-notes)
- 📖 [Application Of Derivatives Class 12 Exam Prep Revision — Grandmaster Guide](/blog/application-of-derivatives-class-12-notes)
- 📖 [Application Of Integrals Class 12 Exam Prep Revision — Grandmaster Guide](/blog/application-of-integrals-class-12-notes)
