---
title: "Permutations Combinations Revision Notes"
description: "Master Permutations and Combinations with our simplified study guide, perfect for JEE NEET prep, covering key concepts and formulas easily."
category: "Mathematics"
keywords: "permutations combinations revision notes, Mathematics, Exam Compass"
---

# Permutations Combinations Revision Notes

# Permutations and Combinations Class 11 Math Quick Recall / Short Notes (2026-27)



![The Art of Arrangement and Selection: Permutations and Combinations](/blog-images/permutations-combinations-revision.png)

> [!TIP]
> **🚀 2-Minute Quick Recall Summary (Save for Exam Day)**
> - **Fundamental Principle of Counting (FPC):** 
>   - **And (Multiplication):** If task A in m ways AND task B in n ways -> m × n ways.
>   - **Or (Addition):** If task A in m ways OR task B in n ways -> m + n ways.
> - **Factorial (n!):** n! = n × (n-1) × ... × 1. (0! = 1).
> - **Permutation (nPr):** Arrangement where order MATTERS. nPr = n! / (n - r)!.
> - **Combination (nCr):** Selection where order DOES NOT matter. nCr = n! / [r!(n - r)!].
> - **Relation:** nPr = nCr × r!.
> [**📥 Download 1-Page Short Notes PDF (Zero-Friction)**](#)

---

## Introduction
**Permutations and Combinations provide the mathematical toolkit for counting possibilities and arrangements in complex systems. Master the Fundamental Principle of Counting, nPr for ordered arrangements, and nCr for selections to excel in probability and cryptography. This Class 11 Math Chapter 7 guide covers all essential factorial logic for JEE and CBSE exams.**
Mathematics is not just about numbers; it's about possibilities.

---

## 1. Fundamental Principle of Counting (FPC)
This is the base of all counting techniques.
1.  **Multiplication Principle:** If an event occurs in **m** different ways, following which another event occurs in **n** different ways, then the total number of occurrence of the events in the given order is **m × n**.
2.  **Addition Principle:** If an event can occur in **m** ways and another independent event can occur in **n** ways, then either of the two events can occur in **m + n** ways.

---

## 2. Factorials (n!)
The product of first **n** natural numbers is called n-factorial.
*   **n! = 1 × 2 × 3 × ... × n**.
*   **0! = 1** (by definition).
*   **n! = n × (n - 1)!**.

---

## 3. Permutations (Arrangements)
A permutation is an arrangement in a definite order of a number of objects taken some or all at a time.
*   **Theorem 1:** The number of permutations of n different objects taken r at a time (0 < r ≤ n) and objects do not repeat is **nPr = n! / (n - r)!**.
*   **Theorem 2:** If repetition is allowed, the number of permutations is **nʳ**.
*   **Theorem 3:** If out of n objects, p are of one kind, q of another, and the rest are different, number of permutations = **n! / (p!q!)**.

---

## 4. Combinations (Selections)
A combination is a selection of items where the order of selection does not matter.
*   **Theorem:** The number of combinations of n different objects taken r at a time is **nCr = n! / [r!(n - r)!]**.
*   **Properties:**
    1.  nCr = nC(n-r)
    2.  nCa = nCb => either a = b or a + b = n.
    3.  nCr + nC(r-1) = (n+1)Cr (Pascal's Formula).

---

## 5. Difference: Permutation vs Combination
| Feature | Permutation | Combination |
| :--- | :--- | :--- |
| **Focus** | Arrangement / Order | Selection / Grouping |
| **Order** | Matters | Does not matter |
| **Keyword** | Arrange, List, Align | Select, Choose, Pick |
| **Formula** | nPr | nCr |

---

## Comprehensive Exam Strategy (Q&A)

**Q1: How many 3-digit numbers can be formed from the digits 1, 2, 3, 4, 5 assuming that repetition of digits is allowed?**
**Answer:**
- Total digits = 5. Places to fill = 3.
- Using FPC: 5 × 5 × 5 = **125** ways.

**Q2: Find n if n-1P3 : nP4 = 1 : 9.**
**Answer:**
- [(n-1)! / (n-1-3)!] / [n! / (n-4)!] = 1/9
- [(n-1)! / (n-4)!] × [(n-4)! / n!] = 1/9
- (n-1)! / n! = 1/9
- (n-1)! / n(n-1)! = 1/9
- **n = 9**.

**Q3: A committee of 3 persons is to be constituted from a group of 2 men and 3 women. In how many ways can this be done?**
**Answer:**
- Order doesn't matter, so use combinations.
- Total people = 2 + 3 = 5. Select 3.
- 5C3 = 5! / (3!2!) = (5 × 4) / 2 = **10 ways**.

---

## Related Revision Notes
- [**Chapter 6: Linear Inequalities**](/blog/linear-inequalities-revision-notes)
- [**Chapter 8: Binomial Theorem**](/blog/binomial-theorem-revision-notes)
- [**External Reference:** [NCERT Class 11 Math Chapter 7](https://ncert.nic.in/textbook.php?kemh1=7-16) (Authoritative Source)]

## Conclusion
Permutations and Combinations transform the way we see complexity. By mastering the core formulas of nPr and nCr, and understanding when order matters, you gain the power to calculate outcomes in everything from poker hands to the number of ways to sequence DNA. Keep your factorials small and your logic sharp!

---

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
