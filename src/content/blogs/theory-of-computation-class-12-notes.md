---
heroImage: "/blog-images/theory-of-computation-class-12-notes.webp"
title: "Theory Of Computation Class 12 Exam Prep Revision — Grandmaster Guide"
description: "Theory Of Computation Class 12 Exam Prep Revision — Grandmaster Guide Revision Notes. Last Updated: 2026-04-20."
category: "Exam Notes"
date: "2026-04-20"
practice_link: "/practice/theory-of-computation-class-12-notes"
manualReview: false
---

## ⚡ Formula Bank
- Automata: $L = \{0, 1\}^*$ is the set of all binary strings
- $M = (Q, \sigma, \delta, q_0, F)$ is the 5-tuple for a finite automaton
- $\delta(q, a) = p$ means the next state is $p$ when the current state is $q$ and the input symbol is $a$
- $L(M)$ denotes the language accepted by the machine $M$
- $L = \{w \in \sigma^* | M \text{ accepts } w\}$
- Regular Languages: $\sigma^*$, $\phi$, $\{a\}$, $\{0, 1\}^*$
- Context-Free Languages: $\{a^n b^n | n \geq 0\}$, $\{a^n b^{2n} | n \geq 0\}$
- $\lambda$-transition: $\delta(q, \lambda) = p$ means the next state is $p$ when the current state is $q$ and no input symbol is read
- $NFA = (Q, \sigma, \delta, q_0, F)$ is the 5-tuple for a nondeterministic finite automaton
- $\delta(q, a) = \{p_1, p_2, \ldots, p_k\}$ means the next states are $p_1, p_2, \ldots, p_k$ when the current state is $q$ and the input symbol is $a$
- $PDA = (Q, \sigma, \gamma, \delta, q_0, F)$ is the 6-tuple for a pushdown automaton
- $\delta(q, a, b) = \{(p_1, c_1), (p_2, c_2), \ldots, (p_k, c_k)\}$ means the next states and stack symbols are $p_1, p_2, \ldots, p_k$ and $c_1, c_2, \ldots, c_k$ when the current state is $q$, the input symbol is $a$, and the top stack symbol is $b$
- Turing Machine: $TM = (Q, \sigma, \gamma, \delta, q_0, F)$ is the 6-tuple for a Turing machine
- $\delta(q, a) = (p, b, d)$ means the next state is $p$, the symbol written is $b$, and the direction of the head is $d$ when the current state is $q$ and the symbol read is $a$

## 🪤 The 5 Mistakes That Cost Marks
- Not understanding the difference between deterministic and nondeterministic finite automata
- Confusing the transition function $\delta$ with the language $L$
- Not knowing how to construct a regular expression from a finite automaton
- Forgetting to include the $\lambda$-transition in the transition function
- Not being able to prove that a language is not regular using the pumping lemma

## ✏️ 3 Solved PYQs
- **Question 1:** Construct a finite automaton that accepts the language $L = \{0, 1\}^* 1 \{0, 1\}^*$
- Step 1: Define the states $Q = \{q_0, q_1\}$
- Step 2: Define the transition function $\delta(q_0, 0) = q_0$, $\delta(q_0, 1) = q_1$, $\delta(q_1, 0) = q_1$, $\delta(q_1, 1) = q_1$
- Step 3: Define the initial state $q_0$ and the final state $F = \{q_1\}$
- **Question 2:** Prove that the language $L = \{a^n b^n | n \geq 0\}$ is not regular using the pumping lemma
- Step 1: Assume that $L$ is regular and $p$ is the pumping length
- Step 2: Choose a string $w = a^p b^p \in L$
- Step 3: Divide $w$ into $x$, $y$, and $z$ such that $|y| > 0$ and $|xy| \leq p$
- Step 4: Show that $xy^i z 
otin L$ for some $i \geq 0$
- **Question 3:** Construct a pushdown automaton that accepts the language $L = \{a^n b^{2n} | n \geq 0\}$
- Step 1: Define the states $Q = \{q_0, q_1\}$
- Step 2: Define the transition function $\delta(q_0, a, \lambda) = (q_0, a)$, $\delta(q_0, b, a) = (q_1, \lambda)$, $\delta(q_1, b, a) = (q_1, \lambda)$
- Step 3: Define the initial state $q_0$ and the final state $F = \{q_1\}$

## 🧠 The One Thing Most Students Get Wrong
- Not understanding the concept of $\lambda$-transition and its importance in finite automata
- $\lambda$-transition allows the machine to move to a new state without reading any input symbol
- This is crucial in constructing finite automata for languages that have $\lambda$ as a substring
- For example, the language $L = \{0, 1\}^* \lambda \{0, 1\}^*$ requires a $\lambda$-transition to accept the $\lambda$ substring

## 👁️ Ayush's Note
- To construct a finite automaton for a given language, start by defining the states and the transition function
- Use the transition function to determine the next state based on the current state and the input symbol
- Make sure to include the $\lambda$-transition in the transition function if necessary
- Use the pumping lemma to prove that a language is not regular
- To construct a pushdown automaton, define the states, the transition function, and the stack symbols
- Use the transition function to determine the next state and the stack symbol based on the current state, the input symbol, and the top stack symbol

## 🔁 Last 5 Minutes Box
- Review the formula bank and make sure to understand each concept
- Go through the solved PYQs and make sure to understand each step
- Review the concept of $\lambda$-transition and its importance in finite automata
- Make sure to understand how to construct a finite automaton and a pushdown automaton
- Review the pumping lemma and how to use it to prove that a language is not regular

## 📝 Practice MCQs
**1. What is the language accepted by the finite automaton with the transition function $\delta(q_0, 0) = q_0$, $\delta(q_0, 1) = q_1$, $\delta(q_1, 0) = q_1$, $\delta(q_1, 1) = q_1$?**
-
A) $L = \{0, 1\}^* 0 \{0, 1\}^*$
-
B) $L = \{0, 1\}^* 1 \{0, 1\}^*$
-
C) $L = \{0, 1\}^*$
-
D) $L = \phi$

**Answer: B) $L = \{0, 1\}^* 1 \{0, 1\}^*$**

**2. Which of the following languages is not regular?**
-
A) $L = \{0, 1\}^*$
-
B) $L = \{a^n b^n | n \geq 0\}$
-
C) $L = \{a^n b^{2n} | n \geq 0\}$
-
D) $L = \phi$

**Answer: B) $L = \{a^n b^n | n \geq 0\}$**

**3. What is the purpose of the $\lambda$-transition in a finite automaton?**
-
A) To move to a new state without reading any input symbol
-
B) To move to a new state by reading an input symbol
-
C) To stay in the same state without reading any input symbol
-
D) To stay in the same state by reading an input symbol

**Answer: A) To move to a new state without reading any input symbol**

**4. Which of the following is a pushdown automaton?**
-
A) PDA = (Q, \sigma, \gamma, \delta, q_0, F)
-
B) $PDA = (Q, \sigma, \delta, q_0, F)$
-
C) PDA = (Q, \sigma, \gamma, q_0, F)
-
D) $PDA = (Q, \sigma, \delta, q_0)$

**Answer: A) $PDA = (Q, \sigma, \gamma, \delta, q_0, F)$**

**5. What is the pumping lemma used for?**
-
A) To prove that a language is regular
-
B) To prove that a language is not regular
-
C) To construct a finite automaton
-
D) To construct a pushdown automaton

**Answer: B) To prove that a language is not regular**

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/practice/theory-of-computation-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Aldehydes Ketones And Carboxylic Acids Class 12 Exam Prep Revision — Grandmaster Guide](/blog/aldehydes-ketones-and-carboxylic-acids-class-12-notes)
- 📖 [Amines Class 12 Exam Prep Revision — Grandmaster Guide](/blog/amines-class-12-notes)
- 📖 [Application Of Derivatives Class 12 Exam Prep Revision — Grandmaster Guide](/blog/application-of-derivatives-class-12-notes)
- 📖 [Biodiversity And Conservation Class 12 Exam Prep Revision — Grandmaster Guide](/blog/biodiversity-and-conservation-class-12-notes)
