---
heroImage: "/blog-images/current-electricity-class-11-revision-notes-neet.webp"
title: "Current Electricity Class 11 Biology Revision — NEET 2026 Grandmaster Guide"
description: "Accelerate your Biology revision with our Current Electricity guide. Includes my secret study hacks, conceptual maps, and high-yield MCQs for last-minute success."
category: "Biology"
keywords: "current electricity class 11 revision notes neet, Exam Compass, Biology, Exam Compass"
---
# Current Electricity Class 11 Biology Revision — NEET 2026 Grandmaster Guide

![Hero Image](/blog-images/current-electricity-class-11-revision-notes-neet.webp)

*Last Updated: 2026-03-22*

## What is Current Electricity Revision Notes?

# Current Electricity Revision Notes

![Current Electricity Visual: Electron Drift, Circuit Boards, and Potential Gradients](/blog-images/current-electricity-revision.webp)

> [!TIP]
> **🚀 2-Minute Quick Recall Summary (Save for Exam Day)**
> - **Ohm's Law:** V = IR. R = (m/ne²τ) (L/A). ρ = m/ne²τ.
> - **Drift Velocity:** v_d = (eE/m) τ. I = nAev_d.
> - **Kirchhoff's Laws:** 
>   - KCL: Σ I = 0 (Charge conservation).
>   - KVL: Σ V = 0 (Energy conservation).
> - **Wheatstone Bridge:** P/Q = R/S (Balance condition).
> - **Potentiometer:** Measures EMF without drawing current (Ideal). ε ∝ L.
> [**📥 Download 1-Page Short Notes PDF (Zero-Friction)**](#)

---


## Introduction

While electrostatics deals with charges at rest, **Current Electricity** is the study of charges in motion. It is the lifeblood of modern civilization—the pulse of every microprocessor, the power behind every motor, and the signal in every communication line. This chapter marks the transition from static fields to dynamic energy transfer. In this "Comprehensive" guide, we provide a deep microscopic dive into the behavior of electrons in a lattice, rigorous proofs for Kirchhoff’s Laws, and a technical comparison between bridge circuits and measuring instruments. Whether you are prepping for JEE Main, NEET, or your Board exams, these notes provide the exhaustive detail and mathematical rigor necessary for absolute mastery.

---




## 1. Electric Current: The Flow of Charge

**Electric Current (I)** is defined as the rate of flow of electric charge through any cross-section of a conductor.
**I = dQ / dt**.
- **Unit:** Ampere (A).
- **Current Density (J):** Current per unit area. **J = I / A**.

---




## 2. Microscopic View of Current: Drift Velocity

In the absence of an electric field, free electrons move randomly with high thermal speeds (~10⁵ m/s). When an external field **E** is applied, they acquire a small net velocity called **Drift Velocity (v_d)**.

### I. Derivation: Expression for Drift Velocity
1.  Acceleration of an electron: **a = F / m = -eE / m**.
2.  At any time **t**, velocity **v = u + at**.
3.  Average velocity **v_d = 0 + a τ** (since initial thermal average is zero).
4.  **v_d = (eE / m) τ**. (Proven)
Where **τ** (tau) is the **Relaxation Time**—the average time between two successive collisions.

### II. Relation between Current and Drift Velocity
1.  Consider a conductor of length **L** and area **A** with **n** free electrons per unit volume.
2.  Total charge **Q = nALe**.
3.  Time for electrons to cross length **L**: **t = L / v_d**.
4.  **I = Q / t = (nALe) / (L / v_d)**.
5.  **I = nAev_d**. (Proven)

---




## 3. Ohm’s Law: The Microscopic Proof

**Theorem:** For constant physical conditions (like temperature), the current flow is directly proportional to the potential difference. **V = IR**.

### I. Derivation of Ohmic Resistance (R)
1.  We have **I = nAev_d**.
2.  Substitute **v_d = (eE / m) τ**:
    - **I = nAe [(eE / m) τ] = (nAe²τ / m) E**.
3.  Since **E = V / L**:
    - **I = (nAe²τ / m) (V / L)**.
4.  Rearranging for **V**:
    - **V = [ m L / n A e² τ ] I**.
5.  By comparison with **V = IR**, we find:
    - **R = (m / ne²τ) (L / A)**. (Proven)
**Result:** **Resistivity (ρ) = m / ne²τ**.

---




## 4. Temperature Dependence of Resistivity

- **For Metals:** As temperature increases, the lattice vibrates more, decreasing the relaxation time **τ**. Thus, resistivity **ρ** **increases**.
- **For Semiconductors:** As temperature increases, more covalent bonds break, increasing the number of free charge carriers **n**. Thus, resistivity **ρ** **decreases**.

---




## 5. Cells, EMF, and Internal Resistance

**EMF (ε):** The maximum potential difference between cell terminals when no current is drawn.
**Internal Resistance (r):** The resistance offered by the electrolyte to the flow of ions.

### I. Relation between EMF and Terminal Voltage (V)
1.  **V = ε - Ir**. (When discharging).
2.  **V = ε + Ir**. (When charging).
3.  **r = [ (ε/V) - 1 ] R**.

---




## 6. Kirchhoff’s Laws: The Circuit Rules

Used for solving complex electrical networks where Ohm’s Law alone is insufficient.

### I. Kirchhoff’s First Law (KCL - Junction Rule)
**Statement:** The algebraic sum of currents meeting at a junction is zero.
**Σ I = 0**.
- Based on the **Conservation of Charge**.

### II. Kirchhoff’s Second Law (KVL - Loop Rule)
**Statement:** In a closed loop, the algebraic sum of products of current and resistance is equal to the algebraic sum of EMFs.
**Σ IR = Σ ε**.
- Based on the **Conservation of Energy**.

---




## 7. The Wheatstone Bridge

A bridge of four resistors (**P, Q, R, S**) used to measure an unknown resistance.

### I. Condition for Balance (Derivation)
For balance, no current flows through the galvanometer (**Ig = 0**).
Using KVL:
1.  For Loop 1: **I1 P = I2 R**.
2.  For Loop 2: **I1 Q = I2 S**.
3.  Dividing: **P / Q = R / S**. (Proven)

---




## 8. The Potentiometer: The Ideal Voltmeter

A device used to measure EMF or potential difference by comparing it with a known potential gradient.

### I. Why is it better than a voltmeter?
A voltmeter draws some current from the circuit, thereby measuring a terminal voltage **V** instead of the true **EMF (ε)**. A potentiometer uses a null point method where **no current** is drawn from the unknown source at balance, thus measuring the true EMF.

### II. Applications
1.  **Comparison of EMFs:** **ε1 / ε2 = L1 / L2**.
2.  **Internal Resistance of a Cell:** **r = R [ (L1/L2) - 1 ]**.

---




## Comprehensive Exam Strategy (Q&A)

**Q1: How does the drift velocity change if the cross-sectional area of a wire is doubled for a constant current?**
**Answer:** From **I = nAev_d**, if **I** is constant, then **v_d ∝ 1/A**. If the area is doubled, the drift velocity becomes **half**.

**Q2: What is the significance of the relaxation time (τ)?**
**Answer:** Relaxation time represents the average time an electron can accelerate before being scattered by a lattice ion. It is the fundamental microscopic link between temperature and resistance. A smaller **τ** means more frequent collisions and higher resistivity.

**Q3: Can a cell have zero internal resistance?**
**Answer:** Ideally, no. Every electrolyte provides some opposition to ion movement. However, "ideal" cells in physics problems are often assumed to have **r = 0** for simplicity.

---




## Related Revision Notes

- [**Chapter 2: Electrostatical Potential & Capacitive Circuits**](/blog/electrostatic-potential-capacitance-revision-notes)
- [**Chapter 4: Moving Charges and Magnetism (The Next Milestone)**](/blog/moving-charges-magnetism-revision-notes)
- [**Mastering Kirchhoff’s Network Analysis: Rank Booster Set**](/blog/jee-mains-high-weightage-chapters)




## Conclusion

Current Electricity is the foundation of energy conversion and electronics. By mastering the microscopic derivations of Ohm’s Law and the sophisticated rules of Kirchhoff, you gain the ability to analyze and design the complex circuits that define our era. This completes the first unit of Class 12 Electromagnetism! Master the potentiometer principles and the Wheatstone bridge—these are the bridge-builders to advanced electrical engineering. Keep your current steady, your resistance managed, and your potential always at its peak!

---
**Reference:** [IEEE Spectrum: Electrotechnology News and Analysis](https://spectrum.ieee.org)

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*




## Quick Recall Box



## MCQs

---
<<<<<<< HEAD
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
=======
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
>>>>>>> bb075c4fff20c0089f5a142666d6d95845e53ada