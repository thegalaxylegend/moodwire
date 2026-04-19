---
heroImage: "/blog-images/theory-of-computation-class-12-notes.webp"
title: "Theory Of Computation Class 12 Exam Prep Revision — CBSE 2026 Grandmaster Guide"
description: "Theory Of Computation Class 12 Exam Prep Revision — CBSE 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-04-18."
category: "Revision"
date: "2026-04-12"
practice_link: "/class-12/computer-science/theory-of-computation"
---

*Last Updated: 2026-04-12*

<div [class](/blog/haloalkanes-and-haloarenes-class-12-notes)="quick-summary">

### 🚀 Quick Recall — Last Night Summary

- Turing Machine: A mathematical model that can read and write symbols on an infinite tape.
- Chomsky Hierarchy: A classification of languages based on their generative power, with regular, context-free, context-sensitive, and recursively enumerable languages.
- Decidability: A problem is decidable if there exists an algorithm that can solve it in finite time.
- Computational Complexity: A measure of the amount of resources (time and space) required to solve a problem.
- Lambda Calculus: A formal system that uses lambda functions to represent computations.
- Recursively Enumerable Languages: A language is recursively enumerable if there exists a Turing machine that can recognize it, but may not halt for all inputs.
- Universal Turing Machine: A Turing machine that can simulate any other Turing machine.
- Turing Machines: Can perform any computation that can be performed by any algorithm.

</div>

## 📋 Table of Contents

- [⚡ Formula Bank](#-formula-bank)
- [🪤 The 5 Mistakes That Cost Marks](#-the-5-mistakes-that-cost-marks)
- [✏️ 3 Solved PYQs](#-3-solved-pyqs)
- [🧠 The One Thing Most Students Get Wrong](#-the-one-thing-most-students-get-wrong)
- [👁️ Ayush's Note](#-ayushs-note)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
- [📝 Practice MCQs](#-practice-mcqs)

## <a id="-formula-bank"></a>⚡ Formula Bank

- **Kleene Closure:** \{a\}^* = \{ \epsilon, a, aa, aaa, ... \} — where $a$ is a string and $\epsilon$ is the empty string.
 - **Regular Expression Union:** A \cup B = \{ x \mid x \in A \; or \; x \in B \} — where $A$ and $B$ are languages.
 - **Regular Expression Concatenation:** A \cdot B = \{ xy \mid x \in A \; and \; y \in B \} — where $A$ and $B$ are languages.
 - **Regular Expression Kleene Star:** A^* = \{ \epsilon \} \cup A \cup A^2 \cup A^3 \cup ... — where $A$ is a language.
 - **Context-Free Grammar Production Rule:** A \rightarrow \alpha — where $A$ is a non-terminal, $\alpha$ is a string of terminals and non-terminals.
 - **Pushdown Automaton Transition Function:** \delta(q, a, b) = (q', b') — where $q$ is the current state, $a$ is the input symbol, $b$ is the top stack symbol, $q'$ is the next state, $b'$ is the new top stack symbol.
 - **Turing Machine Transition Function:** \delta(q, a) = (q', a', D) — where $q$ is the current state, $a$ is the tape symbol, $q'$ is the next state, $a'$ is the symbol written to the tape, $D$ is the direction of the head.
 - **Chomsky Normal Form Production Rule:** A \rightarrow BC — where $A$ is a non-terminal, $B$ and $C$ are non-terminals.
 - **Greibach Normal Form Production Rule:** A \rightarrow aB_1B_2...B_k — where $A$ is a non-terminal, $a$ is a terminal, $B_i$ are non-terminals.
 - **Pumping Lemma for Regular Languages:** w = xyz — where $w$ is a string, $x$, $y$, $z$ are substrings, $|y| > 0$, $|xy| \leq p$, $w' = xy^iz$ is in the language for all $i \geq 0$.
 - **Pumping Lemma for Context-Free Languages:** w = uvxyz — where $w$ is a string, $u$, $v$, $x$, $y$, $z$ are substrings, $|vy| > 0$, $|vx| \leq p$, $w' = uv^iyx^iz$ is in the language for all $i \geq 0$.

## <a id="-the-5-mistakes-that-cost-marks"></a>🪤 The 5 Mistakes That Cost Marks

- **Mistake 1: Misapplying the Pumping Lemma for Regular Languages**
 

- *Error:* Many students incorrectly use the Pumping Lemma to *prove* a language is regular. Remember, the Pumping Lemma is primarily a tool for *disproving* regularity. Another common error is failing to choose an appropriate string 's' that is long enough (i.e.

- $|s| \geq p$, where $p$ is the pumping length) or misinterpreting the partition $s = xyz$ such that $|xy| \leq p$ and $|y| > 0$. Often, the mistake is in not considering all possible ways to partition $y$ when showing that $xy^iz 
otin L$ for some $i 
eq 1$.
 

- *Costs:* This can cost you a full 5-8 marks in a proof-based question, as it demonstrates a fundamental misunderstanding of formal language theory.
 

- *Fix:*
 

- Always start by assuming the language $L$ is regular (proof by contradiction). This implies a pumping length $p$ exists.
 

- Carefully select a string $s \in L$ such that $|s| \geq p$ and its structure clearly exposes the non-regular property when pumped. For example, if the language requires counting, choose $s$ to be $a^p b^p$.
 

- Show that for *any* partition $s = xyz$ where $|xy| \leq p$ and $|y| > 0$, pumping $y$ (i.e.

- forming $xy^iz$) for some $i 
eq 1$ results in a string that is *not* in $L$. This means $L$ cannot be regular. Pay close attention to the constraint $|xy| \leq p$; this often means $y$ must be entirely within the initial segment of $s$. For $a^p b^p$, $y$ would be entirely 'a's, leading to an unequal count of 'a's and 'b's after pumping.

- **Mistake 2: Confusing the Power and Closure Properties of Automata/Languages**
 

- *Error:* Students often mix up which [class](/blog/application-of-derivatives-class-12-notes) of language (Regular, Context-Free, Context-Sensitive, Recursively Enumerable) corresponds to which automaton (DFA/NFA, PDA,

## <a id="-3-solved-pyqs"></a>✏️ 3 Solved PYQs

- **Q1: (JEE Main 2018)** The output of the combination of the gates shown in the figure is:
 
 $\text{A} \longrightarrow \text{[NOT]}$ \longrightarrow $\text{X}_1 \longrightarrow \text{[AND]}$ \longrightarrow $\text{Y}$\ }

## <a id="-the-one-thing-most-students-get-wrong"></a>🧠 The One Thing Most Students Get Wrong

- **The Core Concept:** Crushing Boolean expression minimization using Karnaugh Maps (K-Maps) and understanding the nuances of prime implicants (PIs) and essential prime implicants (EPIs), especially when \"don't care\" conditions are in play. This isn't just about simplification; it's about designing

## <a id="-ayushs-note"></a>👁️ Ayush's Note

- **The Hidden Pattern: The \"State Machine\" Analogy in Advanced Problems**
 * Forget the textbooks that teach pure combinatorics or probability formulas.

- **After grinding through years of JEE Advanced PYQs, a subtle pattern emerges:** many seemingly complex problems, especially in **P&C, Probability, and Sequences**, aren't

## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box

- **Chomsky Hierarchy:** Remember the strict subset relations: REG \subset CFL \subset CSL \subset REL (Regular Languages $\subset$ Context-Free Languages $\subset$ Context-Sensitive Languages $\subset$ Recursively-Enumerable Languages). This hierarchy defines the power of different computational models.

- **P

## <a id="-practice-mcqs"></a>📝 Practice MCQs

**1. Which Turing machine model is universal?**
**A)**        Turing Machine
**B)**        Pushdown Automaton
**C)**        Finite State Machine
**D)**        Linear Bounded Automaton

**Answer:** D) A Linear Bounded Automaton is a universal Turing machine model.

---

**2. What is the concept of decidability in computability theory?**
**A)**        A problem has a

solution
**B)**  A problem has a finite solution
**C)**  A problem can be solved by a Turing machine in finite time
**D)**  A problem has a solution that can be found by a Turing machine in finite time

**Answer:** D) Decidability in computability theory refers to the existence of an algorithm that can solve a problem in finite time.

---

**3. Which of the following languages is not regular?**
**A)**        a^*b^*a^*
**B)**        a^nb^n
**C)**        ab^*a
**D)**        a^nb^n where n >= 0

**Answer:** B) The language a^nb^n, where n >= 0, is not regular because it requires a pushdown automaton to recognize it, not a finite state machine.

---

**4. What is the Church-Turing thesis?**
**A)**        A universal Turing machine can simulate any algorithm
**B)**        Any algorithm can be simulated by a universal Turing machine
**C)**        A finite state machine can solve any problem
**D)**        A pushdown automaton can solve any problem

**Answer:** B) The Church-Turing thesis states that any effectively calculable function can be calculated by a Turing machine.

---

**5. Which of the following problems is undecidable?**
**A)**        The halting problem
**B)**        The decision problem for regular languages
**C)**        The decision problem for context-free languages
**D)**        The decision problem for recursive languages

**Answer:** A) The halting problem is undecidable, meaning that there cannot exist an algorithm that can determine whether a given Turing machine will halt for all possible inputs.

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-12/computer-science/theory-of-computation) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Computer Networks Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog/computer-networks-class-12-notes)
- 📖 [Databases (DBMS) Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog/databases-dbms-class-12-notes)
- 📖 [Operating Systems Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog/operating-systems-class-12-notes)
- 📖 [Application of Derivatives Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-derivatives-class-12-notes)
**