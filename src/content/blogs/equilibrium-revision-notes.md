---
title: "Equilibrium Revision Notes"
description: "Boost JEE/NEET prep with concise equilibrium revision notes, covering Le Chatelier"
category: "Physics"
keywords: "equilibrium revision notes, Physics, Exam Compass"
---

# Equilibrium Revision Notes

![Chemical Equilibrium and Le Chatelier's Principle diagram for JEE NEET 2026](/blog-images/equilibrium-revision.webp)

<div class="quick-summary">
**Quick Recall: Chemical Equilibrium**
- **$K_c$** = $\frac{[C]^c[D]^d}{[A]^a[B]^b}$. Only depends on **Temperature**.
- **$K_p$ vs $K_c$**: $K_p = K_c(RT)^{\Delta n_g}$.
- **Le Chatelier**: Add reactant → shift forward. Increase T → shift endothermic.
- **Catalyst**: No effect on K or equilibrium position. Only speeds up approach.
- **pH** = $-\log[H^+]$. For dilute acids ($< 10^{-6}$ M), consider $H^+$ from water.
- **$K_{sp}$**: $Q > K_{sp}$ → Precipitation. $Q < K_{sp}$ → Dissolution.
</div>

## Table of Contents
1. [Why Equilibrium is the "Balancing Act" of Chemistry](#intro)
2. [Physical vs Chemical Equilibrium: The Dynamic State](#types)
3. [The Equilibrium Constant ($K_c$ and $K_p$): The Math of Balance](#kc-kp)
4. [Reaction Quotient ($Q$) vs $K$: Predicting the Shift](#reaction-quotient)
5. [Le Chatelier's Principle: The Stress Response](#le-chatelier)
6. [Acids, Bases, and Their Definitions: Arrhenius vs Bronsted vs Lewis](#acids-bases)
7. [pH, pOH, and the Ionic Product of Water ($K_w$)](#ph)
8. [Ostwald's Dilution Law and Degree of Dissociation ($\alpha$)](#ostwald)
9. [Buffer Solutions and Henderson-Hasselbalch Equation](#buffers)
10. [Solubility Product ($K_{sp}$) and Common Ion Effect](#ksp)
11. [The "Trap" Section: Equilibrium Pitfalls That Cost Marks](#traps)
12. [Practice MCQs (JEE/NEET Level)](#mcqs)
13. [Ayush's Equilibrium Strategy](#ayush-strategy)

<a id="intro"></a>
## 1. Why Equilibrium is the "Balancing Act" of Chemistry

**Chemical Equilibrium is the state in a reversible reaction where the rate of the forward reaction equals the rate of the backward reaction, and the concentrations of reactants and products remain constant over time.**

This chapter is massive — it combines Chemical Equilibrium (Kc, Kp, Le Chatelier) with Ionic Equilibrium (pH, Buffers, Ksp). In JEE, you'll see 2-3 questions from this chapter alone. The trick is to separate the two halves in your head and treat them as distinct sub-chapters.

### Why This Chapter Matters (Exam Data)
- **JEE Mains 2024**: 2 questions — one on Le Chatelier with inert gas addition, one on pH of a buffer.
- **NEET 2024**: 1 question directly on $K_{sp}$ and precipitation.
- **CBSE Boards**: This chapter carries 7 marks (combined with Thermodynamics unit in some schemes).

---

<a id="types"></a>
## 2. Physical vs Chemical Equilibrium: The Dynamic State

**Equilibrium is dynamic — reactions don't stop; rather, forward and backward reactions occur at equal rates, creating the illusion of a static system.**

- **Physical Equilibrium**: Evaporation-condensation in a closed container. $P_{vapor}$ becomes constant.
- **Chemical Equilibrium**: $N_2O_4(g) \rightleftharpoons 2NO_2(g)$. The brown color intensity stabilizes.

### Characteristics of Equilibrium
1. Can only be reached in a **closed system**.
2. Observable properties (color, pressure, concentration) become **constant**.
3. $K$ is independent of initial concentrations. Only temperature changes $K$.

---

<a id="kc-kp"></a>
## 3. The Equilibrium Constant ($K_c$ and $K_p$): The Math of Balance

**The Equilibrium Constant ($K$) is a dimensionless quantity that expresses the ratio of product concentrations to reactant concentrations, each raised to the power of their stoichiometric coefficients, at equilibrium.**

For $aA + bB \rightleftharpoons cC + dD$:
$$K_c = \frac{[C]^c [D]^d}{[A]^a [B]^b}$$

### $K_p$ vs $K_c$ Relationship
$$K_p = K_c (RT)^{\Delta n_g}$$
where $\Delta n_g$ = (moles of gaseous products) - (moles of gaseous reactants).

### Rules for Manipulating K
| Operation | Effect on K |
|:---|:---|
| Reverse the reaction | $K' = 1/K$ |
| Multiply coefficients by $n$ | $K' = K^n$ |
| Add two reactions | $K' = K_1 \times K_2$ |

> ### Board Exam Tip
> When writing the expression for $K_c$, never include pure solids or pure liquids. For example, for $CaCO_3(s) \rightleftharpoons CaO(s) + CO_2(g)$, $K_c = [CO_2]$. Forgetting this rule is an instant 1-mark deduction. **This question carries 2-3 marks.**

---

<a id="reaction-quotient"></a>
## 4. Reaction Quotient ($Q$) vs $K$: Predicting the Shift

**The Reaction Quotient ($Q$) has the same mathematical form as $K$ but is calculated using the current (non-equilibrium) concentrations of reactants and products.**

| Comparison | Direction | Meaning |
|:---:|:---|:---|
| $Q < K$ | Forward | Too many reactants; system makes more products |
| $Q > K$ | Backward | Too many products; system makes more reactants |
| $Q = K$ | No shift | System is at equilibrium |

---

<a id="le-chatelier"></a>
## 5. Le Chatelier's Principle: The Stress Response

**Le Chatelier's Principle states that if a system at equilibrium is subjected to a disturbance (change in concentration, pressure, or temperature), the equilibrium shifts in a direction that tends to counteract the disturbance.**

| Stress | Le Chatelier Response |
|:---|:---|
| Add reactant | Shift **forward** (makes more product) |
| Remove product | Shift **forward** |
| Increase Pressure | Shift to the side with **fewer gas moles** |
| Increase Temperature | Shift in the **endothermic** direction |
| Add Catalyst | **No shift**. Reaches equilibrium faster. $K$ unchanged. |
| Add Inert Gas (Const. V) | **No shift**. Partial pressures unchanged. |
| Add Inert Gas (Const. P) | Shift to side with **more gas moles** (volume increases). |

> ### Ayush's Note — The Inert Gas Blunder
> **The Mistake**: I answered "Adding $He$ at constant volume shifts the equilibrium forward for $N_2 + 3H_2 \rightleftharpoons 2NH_3$." I thought more total pressure = shift to fewer moles.
> **The Fix**: At constant **volume**, adding inert gas increases total pressure but does NOT change the **partial pressures** of any reactant or product. So no shift. At constant **pressure**, adding inert gas increases volume, which dilutes all species. This favors the side with more moles.

---

<a id="acids-bases"></a>
## 6. Acids, Bases, and Their Definitions: Arrhenius vs Bronsted vs Lewis

**Acids are substances that can donate protons ($H^+$) or accept electron pairs, while Bases are substances that can accept protons or donate electron pairs, depending on the theory applied.**

| Theory | Acid | Base | Limitation |
|:---|:---|:---|:---|
| **Arrhenius** | Gives $H^+$ in water | Gives $OH^-$ in water | Only for aqueous solutions |
| **Bronsted-Lowry** | Proton ($H^+$) Donor | Proton ($H^+$) Acceptor | More general, works in non-aqueous |
| **Lewis** | Electron pair Acceptor | Electron pair Donor | Most general. $BF_3$ is Lewis acid. |

---

<a id="ph"></a>
## 7. pH, pOH, and the Ionic Product of Water ($K_w$)

**pH is the negative logarithm (base 10) of the hydrogen ion concentration ($[H^+]$) in a solution, providing a convenient scale to express acidity.**

$$pH = -\log[H^+]$$
$$pOH = -\log[OH^-]$$
$$pH + pOH = pK_w = 14 \text{ (at 298 K)}$$

### The Autoprotolysis of Water
$K_w = [H^+][OH^-] = 10^{-14} \text{ at 298 K}$.
At neutral pH: $[H^+] = [OH^-] = 10^{-7} M$, so $pH = 7$.

### Very Dilute Acid: The $10^{-8}$ M HCl Trap (See Traps Section)

---

<a id="ostwald"></a>
## 8. Ostwald's Dilution Law and Degree of Dissociation ($\alpha$)

**Ostwald's Dilution Law relates the degree of dissociation ($\alpha$) of a weak electrolyte to its dissociation constant ($K_a$ or $K_b$) and concentration ($c$).**

For a weak acid $HA$: $\alpha = \sqrt{K_a / c}$ (when $\alpha << 1$).

This means: **Lower concentration → Higher dissociation**. This is counterintuitive but critical — diluting a weak acid increases its % ionization.

---

<a id="buffers"></a>
## 9. Buffer Solutions and Henderson-Hasselbalch Equation

**A Buffer Solution is a solution that resists changes in pH upon the addition of small amounts of acid or base.**

### Types of Buffers
- **Acidic Buffer**: Weak Acid + Conjugate Base Salt ($CH_3COOH + CH_3COONa$).
- **Basic Buffer**: Weak Base + Conjugate Acid Salt ($NH_4OH + NH_4Cl$).

### Henderson-Hasselbalch Equation
$$pH = pK_a + \log \frac{[\text{Salt}]}{[\text{Acid}]}$$ (Acidic Buffer)
$$pOH = pK_b + \log \frac{[\text{Salt}]}{[\text{Base}]}$$ (Basic Buffer)

**JEE Trick**: Buffer capacity is maximum when $[\text{Salt}] = [\text{Acid}]$, i.e., when $pH = pK_a$.

---

<a id="ksp"></a>
## 10. Solubility Product ($K_{sp}$) and Common Ion Effect

**The Solubility Product ($K_{sp}$) is the equilibrium constant for the dissolution of a sparingly soluble ionic compound, expressed as the product of ion concentrations raised to their stoichiometric powers.**

For $AgCl(s) \rightleftharpoons Ag^+(aq) + Cl^-(aq)$: $K_{sp} = [Ag^+][Cl^-]$.

| Condition | Result |
|:---|:---|
| $Q < K_{sp}$ | Unsaturated. More salt dissolves. |
| $Q = K_{sp}$ | Saturated. Equilibrium. |
| $Q > K_{sp}$ | **Precipitation occurs.** |

### Common Ion Effect
Adding a common ion (e.g., $NaCl$ to a saturated $AgCl$ solution) suppresses the solubility of $AgCl$ because $[Cl^-]$ increases, pushing the equilibrium backward.

---

<a id="traps"></a>
## 11. The "Trap" Section: Equilibrium Pitfalls That Cost Marks

**Traps are common conceptual pitfalls that lead students to select the wrong option in competitive exams.**

### Trap 1: pH of $10^{-8}$ M HCl
- **Wrong Answer**: "pH = 8."
- **Right Answer**: pH ≈ **6.98**.
- **Why**: At very low HCl concentrations, $[H^+]$ from water ($10^{-7}$) becomes significant. Total $[H^+] = 10^{-8} + 10^{-7} = 1.1 \times 10^{-7}$. $pH = -\log(1.1 \times 10^{-7}) \approx 6.96$. An acid CANNOT have pH > 7.

### Trap 2: Catalyst and K
- **Wrong Answer**: "A catalyst increases K."
- **Right Answer**: Catalyst has **no effect** on K.
- **Why**: A catalyst lowers both forward and backward activation energies equally. It speeds up the approach to equilibrium but doesn't change where equilibrium lies.

### Trap 3: Inert Gas at Constant Volume
- **Wrong Answer**: "Adding $Ar$ at constant volume shifts the equilibrium."
- **Right Answer**: **No shift** occurs.
- **Why**: Partial pressures and concentrations remain unchanged. Only total pressure increase has no thermodynamic effect.

---

<a id="mcqs"></a>
## 12. Practice MCQs (JEE/NEET Level)

**MCQs (Multiple Choice Questions) are a testing format where you must identify the single correct option from a provided list.**

**Q1. For $N_2 + 3H_2 \rightleftharpoons 2NH_3$, $K_c = 0.5$. What is the $K_c$ for $NH_3 \rightleftharpoons \frac{1}{2}N_2 + \frac{3}{2}H_2$?** [JEE Medium]  
A) 2  
B) $\sqrt{2}$  
C) $1/\sqrt{0.5}$  
D) $\sqrt{1/0.5}$  
*Answer: B ($K_{reverse} = 1/0.5 = 2$. Halving coefficients: $K' = \sqrt{2}$).*

**Q2. The pH of a $10^{-3}$ M NaOH solution is:** [NEET Easy]  
A) 3  
B) 11  
C) 7  
D) 14  
*Answer: B ($pOH = -\log(10^{-3}) = 3$. $pH = 14 - 3 = 11$).*

**Q3. Adding $NaCl$ to a saturated $AgCl$ solution will:** [JEE Easy]  
A) Increase solubility  
B) Decrease solubility  
C) No effect  
D) Double solubility  
*Answer: B (Common Ion Effect. $[Cl^-]$ increases, pushing equilibrium towards $AgCl(s)$).*

**Q4. For an endothermic reaction at equilibrium, increasing temperature will:** [NEET Medium]  
A) Shift forward, increase K  
B) Shift backward, decrease K  
C) Shift forward, no change in K  
D) No shift, increase K  
*Answer: A (Le Chatelier: Increase T → shift endothermic → forward. $K$ increases for endothermic reactions with T).*

**Q5. The Henderson-Hasselbalch equation for an acidic buffer gives pH =** [JEE Medium]  
A) $pK_a + \log[\text{Acid}]/[\text{Salt}]$  
B) $pK_a + \log[\text{Salt}]/[\text{Acid}]$  
C) $pK_b + \log[\text{Salt}]/[\text{Base}]$  
D) $pK_a - \log[\text{Salt}]/[\text{Acid}]$  
*Answer: B ($pH = pK_a + \log \frac{[\text{Salt}]}{[\text{Acid}]}$).*

---

<a id="ayush-strategy"></a>
## 13. Ayush's Equilibrium Strategy

Equilibrium is a 2-headed beast: Chemical Equilibrium and Ionic Equilibrium. I treated them as completely separate sub-chapters.

1. **Le Chatelier Flash Cards**: I made 10 flash cards, each with a different "stress" scenario. I shuffled and tested myself daily. After 5 days, my responses became instant.
2. **The pH Ladder**: I drew a vertical pH scale from 0 to 14 on my wall. I plotted common solutions (HCl 1M → pH 0, Lemon juice → pH 2, Water → pH 7, Bleach → pH 12, NaOH 1M → pH 14). This ladder made pH intuitive.
3. **The $10^{-8}$ Drill**: I solved the "pH of $10^{-8}$ M HCl" problem 3 times from scratch until the reasoning was automatic. This exact question appears in nearly every mock test.

### Board Exam Tip:
For CBSE, always state Le Chatelier's Principle in full before applying it. Then show the shift with an arrow. For example: "According to Le Chatelier's Principle, increasing temperature shifts the equilibrium in the endothermic direction → Forward → $K$ increases." This structured approach guarantees full marks. **This long-answer question carries 5 marks.**

---

**Related Revision Notes:**
- [**Chemical Thermodynamics — Enthalpy & Gibbs Energy Tricks**](/blog/thermodynamics-chemistry-revision-notes)
- [**Some Basic Concepts of Chemistry — Mole Concept & Stoichiometry**](/blog/some-basic-concepts-chemistry-revision-notes)
- [**Chemical Bonding VSEPR Theory JEE 2026 Tricks**](/blog/chemical-bonding-class-11-notes)

---
*Last Updated: March 14, 2026*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
