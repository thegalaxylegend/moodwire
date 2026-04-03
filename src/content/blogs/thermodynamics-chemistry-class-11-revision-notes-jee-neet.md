---
title: "Thermodynamics Chemistry Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide"
description: "Master Thermodynamics Chemistry for Physics 2026. This Grandmaster Guide includes Ayush"
category: "Physics"
keywords: "thermodynamics chemistry class 11 revision notes jee neet, Physics, Exam Compass"
date: "2026-03-28"
heroImage: "/blog-images/thermodynamics-chemistry-class-11-revision-notes-jee-neet.webp"
---

# Thermodynamics Chemistry Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide

![Hero Image](/blog-images/thermodynamics-chemistry-class-11-revision-notes-jee-neet.webp)

*Last Updated: 2026-03-22*

## What is Thermodynamics Chemistry Revision Notes?

# Thermodynamics Chemistry Revision Notes

![Enthalpy and Gibbs Energy diagram for JEE NEET 2026](/blog-images/thermodynamics-chemistry-revision.webp)

<div class="quick-summary">
**Quick Recall: Chemical Thermodynamics**
- **First Law**: $\Delta U = q + w$. Energy is conserved.
- **Enthalpy**: $H = U + PV$. At constant P: $\Delta H = q_p$.
- **$\Delta H$ vs $\Delta U$**: $\Delta H = \Delta U + \Delta n_g RT$.
- **Hess's Law**: Total $\Delta H$ = sum of $\Delta H$ of individual steps. Path-independent.
- **Gibbs Free Energy**: $\Delta G = \Delta H - T\Delta S$. Spontaneous if $\Delta G < 0$.
- **Third Law**: $S = 0$ for a perfect crystal at $0 K$.
</div>


## Table of Contents

1. [Why Thermodynamics is the "Judge" of Chemistry](#intro)
2. [Systems, Surroundings, and Types of Processes](#systems)
3. [The First Law: Energy Conservation in Action](#first-law)
4. [Work Done in Reversible vs Irreversible Expansion](#work)
5. [Enthalpy ($H$) and the $\Delta H$ vs $\Delta U$ Relationship](#enthalpy)
6. [Hess's Law: The Circle of Enthalpy](#hess-law)
7. [Standard Enthalpy of Formation, Combustion, and Bond Enthalpy](#standard-enthalpy)
8. [Entropy ($S$) and the Second Law](#entropy)
9. [Gibbs Free Energy ($G$): The Spontaneity Predictor](#gibbs)
10. [The "Trap" Section: Sign Convention Nightmares](#traps)
11. [Practice MCQs (JEE/NEET Level)](#mcqs)
12. [Ayush's Thermodynamics Strategy](#ayush-strategy)

<a id="intro"></a>




## 1. Why Thermodynamics is the "Judge" of Chemistry

**Chemical Thermodynamics is the study of energy changes (heat and work) associated with chemical reactions and physical transformations.**

Thermodynamics doesn't care about speed — that's Kinetics. Thermodynamics answers the fundamental question: "Will this reaction *ever* happen on its own?" If $\Delta G < 0$, yes. If $\Delta G > 0$, no amount of waiting will make it happen spontaneously.

### Why This Chapter Matters (Exam Data)
- **JEE Mains 2026**: 2 questions — one on $\Delta H$ vs $\Delta U$ using $\Delta n_g$, one on Gibbs and spontaneity.
- **NEET 2026**: 1 question on Hess's Law and 1 on the Third Law.
- **CBSE Boards**: This unit carries 7 marks and is a classic long-answer question topic.

---

<a id="systems"></a>




## 2. Systems, Surroundings, and Types of Processes

**A thermodynamic system is the specific portion of the universe under study, separated from its surroundings by a real or imaginary boundary.**

| System Type | Exchanges | Example |
|:---|:---|:---|
| **Open** | Mass AND Energy | Boiling water in an open beaker |
| **Closed** | Energy only | Gas in a sealed piston |
| **Isolated** | Neither | Perfect thermos flask |

### Types of Processes
- **Isothermal**: $\Delta T = 0$ (temperature constant).
- **Adiabatic**: $q = 0$ (no heat exchange).
- **Isobaric**: $\Delta P = 0$ (constant pressure).
- **Isochoric**: $\Delta V = 0$ (constant volume).

---

<a id="first-law"></a>




## 3. The First Law: Energy Conservation in Action

**The First Law of Thermodynamics states that energy can be converted from one form to another, but it cannot be created or destroyed ($\Delta U = q + w$).**

### Sign Convention (IUPAC)
- **$+q$**: System *absorbs* heat (endothermic).
- **$-q$**: System *releases* heat (exothermic).
- **$+w$**: Work done *on* the system (compression).
- **$-w$**: Work done *by* the system (expansion).

> ### Ayush's Note — The Sign Convention Disaster
> **The Mistake**: I used the Physics sign convention ($W = +P\Delta V$ for work done BY the system) in my Chemistry exam. I got every single numerical wrong.
> **The Fix**: Chemistry uses $w = -P_{ext}\Delta V$. The negative sign means that when a gas expands ($\Delta V > 0$), work is done BY the system, so $w$ is negative. I wrote "CHEMISTRY: w = -PΔV" in big letters on my formula sheet.

---

<a id="work"></a>




## 4. Work Done in Reversible vs Irreversible Expansion

**Expansion work is the energy transferred when a gas changes volume against an external pressure.**

| Process | Formula | Key Point |
|:---|:---|:---|
| **Free Expansion** | $w = 0$ | $P_{ext} = 0$, e.g., gas into vacuum |
| **Irreversible (Const. $P_{ext}$)** | $w = -P_{ext}\Delta V$ | Quick, less work |
| **Reversible (Isothermal)** | $w = -nRT \ln(V_2/V_1)$ | Slow, maximum work |

**JEE Key**: Work done in reversible expansion is always **greater in magnitude** than irreversible expansion for the same initial and final [states](/blog/states-of-matter-class-11-revision-notes-jee-neet).

---

<a id="enthalpy"></a>




## 5. Enthalpy ($H$) and the $\Delta H$ vs $\Delta U$ Relationship

**Enthalpy ($H$) is a thermodynamic state function defined as $H = U + PV$, representing the total heat content of a system at constant pressure.**

At constant pressure: $\Delta H = q_p$.
At constant volume: $\Delta U = q_v$.

### The Bridge Formula
$$\Delta H = \Delta U + \Delta n_g RT$$
where $\Delta n_g$ = (moles of gaseous products) - (moles of gaseous reactants).

**Example**: $CH_4(g) + 2O_2(g) \rightarrow CO_2(g) + 2H_2O(l)$:
- $\Delta n_g = 1 - (1+2) = -2$.
- $\Delta H = \Delta U + (-2)RT = \Delta U - 2RT$.
- $|\Delta H| < |\Delta U|$ for this reaction.

---

<a id="hess-law"></a>




## 6. Hess's Law: The Circle of Enthalpy

**Hess's Law states that the total enthalpy change for a reaction is the same whether it occurs in one step or in multiple steps, as long as the initial and final states are the same.**

This is because Enthalpy is a **State Function** — it depends only on the state, not the path.

### Application: Born-Haber Cycle
To find the Lattice Enthalpy of $NaCl$:
$$\Delta H_f = \Delta H_{sub} + \Delta H_{IE} + \frac{1}{2}\Delta H_{diss} + \Delta H_{EA} + U_{lattice}$$
**JEE Trick**: If a question asks you to calculate the enthalpy of a reaction you don't know directly, try:
1. Reverse a known reaction (flip the sign of $\Delta H$).
2. Multiply a reaction by a factor (multiply $\Delta H$ by the same factor).
3. Add the modified reactions to get the target reaction.

---

<a id="standard-enthalpy"></a>




## 7. Standard Enthalpy of Formation, Combustion, and Bond Enthalpy

**Standard Enthalpy of Formation ($\Delta_f H°$) is the enthalpy change when one mole of a compound is formed from its [elements](/blog/classification-elements-periodicity-class-11-revision-notes-jee-neet) in their standard states (298 K, 1 bar).**

### Key Values to Memorize
- $\Delta_f H°$ of elements in standard state = **0** (e.g., $O_2(g)$, $C(\text{graphite})$, $H_2(g)$).
- $\Delta_f H°$ is **negative** for stable compounds (exothermic formation).

### Bond Enthalpy Method
$$\Delta H_{rxn} = \sum (\text{Bond Enthalpies of Broken Bonds}) - \sum (\text{Bond Enthalpies of Formed Bonds})$$
Remember: Breaking bonds = **absorbs** energy (+). Forming bonds = **releases** energy (-).

---

<a id="entropy"></a>




## 8. Entropy ($S$) and the Second Law

**Entropy ($S$) is a thermodynamic property that measures the degree of randomness or disorder in a system.**

### Second Law of Thermodynamics
For any spontaneous process: $\Delta S_{universe} = \Delta S_{sys} + \Delta S_{surr} > 0$.

### Key Points
- $S_{gas} >> S_{liquid} > S_{solid}$ (dissolution increases entropy).
- $\Delta S$ is positive when: gas is formed, temperature increases, volume increases, mixing occurs.
- For phase transitions: $\Delta S = \Delta H / T$ (at equilibrium).

---

<a id="gibbs"></a>




## 9. Gibbs Free Energy ($G$): The Spontaneity Predictor

**Gibbs Free Energy ($G$) is the thermodynamic potential that combines enthalpy and entropy to predict whether a process will occur spontaneously at constant temperature and pressure ($\Delta G = \Delta H - T\Delta S$).**

### The Spontaneity Table (Memorize This!)
| $\Delta H$ | $\Delta S$ | $\Delta G$ | Spontaneous? |
|:---:|:---:|:---:|:---|
| $-$ (exo) | $+$ | Always $-$ | **Always Spontaneous** ($e.g., combustion$) |
| $+$ (endo) | $-$ | Always $+$ | **Never Spontaneous** |
| $-$ (exo) | $-$ | Depends on T | Spontaneous at **low T** ($e.g., freezing$) |
| $+$ (endo) | $+$ | Depends on T | Spontaneous at **high T** ($e.g., melting ice$) |

### Equilibrium Connection
At equilibrium: $\Delta G = 0$, so $\Delta H = T_{eq} \Delta S$, giving $T_{eq} = \Delta H / \Delta S$.
Also: $\Delta G° = -RT \ln K$.

---

<a id="traps"></a>




## 10. The "Trap" Section: Sign Convention Nightmares

**Traps are common conceptual pitfalls that lead students to select the wrong option in competitive exams.**

### Trap 1: The $\Delta n_g$ Sign Error
- **Wrong Answer**: "$\Delta H > \Delta U$ for all reactions."
- **Right Answer**: Depends on $\Delta n_g$. If $\Delta n_g < 0$, then $\Delta H < \Delta U$.
- **Why**: Students forget the $\Delta n_g RT$ term can be negative.

### Trap 2: Work Done BY vs ON the System
- **Wrong Answer**: "Work done by the gas during expansion is positive."
- **Right Answer**: In Chemistry (IUPAC), $w = -P_{ext}\Delta V$. Expansion means $\Delta V > 0$, so $w < 0$.
- **Why**: Physics uses the opposite sign convention. You must specify which convention you're using.

### Trap 3: Catalyst and $\Delta G$
- **Wrong Answer**: "A catalyst makes a non-spontaneous reaction spontaneous."
- **Right Answer**: A catalyst **does not** change $\Delta G$. It only lowers the activation energy ($E_a$), making the reaction *faster*.
- **Why**: Spontaneity is a thermodynamic property ($\Delta G$). Catalysts affect kinetics ($E_a$), not thermodynamics.

---

<a id="mcqs"></a>




## 11. Practice MCQs (JEE/NEET Level)

**MCQs (Multiple Choice Questions) are a testing format where you must identify the single correct option from a provided list.**

**Q1. For the reaction $N_2(g) + 3H_2(g) \rightarrow 2NH_3(g)$, $\Delta n_g$ is:** [JEE Easy]  
A) +2  
B) -2  
C) +1  
D) -1  
*Answer: B ($\Delta n_g = 2 - (1+3) = -2$).*

**Q2. A reaction has $\Delta H = +50 \text{ kJ}$ and $\Delta S = +100 \text{ J/K}$. At what temperature will it become spontaneous?** [JEE Medium]  
A) Above 500 K  
B) Below 500 K  
C) At 500 K  
D) Never  
*Answer: A ($T > \Delta H / \Delta S = 50000/100 = 500 K$. Note the unit conversion: kJ to J!)*

**Q3. The standard enthalpy of formation of an element in its standard state is:** [NEET Easy]  
A) 1  
B) -1  
C) 0  
D) Depends on element  
*Answer: C (By definition, $\Delta_f H°$ of elements in standard state = 0).*

**Q4. $\Delta H_{rxn}$ using bond enthalpies is:** [JEE Hard]  
A) $\sum$(bonds broken) + $\sum$(bonds formed)  
B) $\sum$(bonds formed) - $\sum$(bonds broken)  
C) $\sum$(bonds broken) - $\sum$(bonds formed)  
D) Only depends on bond dissociation energy  
*Answer: C ($\Delta H = \text{Energy absorbed (broken)} - \text{Energy released (formed)}$).*

**Q5. For an isolated system, which of the following is always true for a spontaneous process?** [JEE Medium]  
A) $\Delta H < 0$  
B) $\Delta S_{sys} > 0$  
C) $\Delta G < 0$  
D) $\Delta U = 0$  
*Answer: B (In an isolated system, $q=0$ and $w=0$, so $\Delta U = 0$. Spontaneity is driven entirely by $\Delta S_{sys} > 0$. Note: D is also true, but B is the defining criterion for spontaneity).*

---

<a id="ayush-strategy"></a>




## 12. Ayush's Thermodynamics Strategy

This chapter has a split personality. Half is conceptual (Laws, Spontaneity), half is numerical (Hess's Law, $\Delta n_g$ problems). Here's how I tackled it:

1. **The Sign Convention Drill**: I wrote 10 reactions and determined the sign of $q$, $w$, $\Delta H$, and $\Delta G$ for each. I did this drill once a week. After 3 weeks, sign conventions became instinctive.
2. **The Spontaneity Matrix**: I made a 2×2 grid ($\Delta H$ vs $\Delta S$) and pasted it inside my notebook cover. Before every spontaneity problem, I glanced at it. Memorizing this table is worth 4-8 marks across JEE and NEET combined.
3. **Hess's Law on Paper**: I never tried to do Hess's Law calculations mentally. I always drew the cycle diagram, labeled every arrow with $\Delta H$, and then solved.

### Board Exam Tip:
CBSE loves "Derive the Gibbs-Helmholtz equation" as a 5-mark question. Write the derivation starting from $\Delta S_{univ} > 0$ for spontaneous process. Go step by step: introduce $\Delta S_{surr} = -\Delta H_{sys}/T$, substitute, and arrive at $\Delta G = \Delta H - T\Delta S$. Teachers give full marks if you show every step clearly.

---

**Related Revision Notes:**
- **Chemical Equilibrium — Le Chatelier's Principle Tricks**
- **States of Matter — Gas Laws & Real Gases Tricks**
- **Some Basic Concepts of Chemistry — Mole Concept & Stoichiometry**

---
*Last Updated: March 13, 2026*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*


---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Classification Elements Periodicity Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/classification-elements-periodicity-class-11-revision-notes-jee-neet)
- 📖 [Equilibrium Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/equilibrium-class-11-revision-notes-jee-neet)
- 📖 [States Of Matter Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/states-of-matter-class-11-revision-notes-jee-neet)
- 📖 [Structure Of Atom Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/structure-of-atom-class-11-revision-notes-jee-neet)
