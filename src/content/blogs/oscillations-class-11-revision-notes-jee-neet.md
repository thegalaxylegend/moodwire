---
title: "Oscillations Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide"
description: "Master Oscillations for Physics 2026. This Grandmaster Guide includes Ayush's personal revision notes, formula sheets, and top-tier MCQs for final prep."
category: "Physics"
keywords: "Oscillations class 11 notes, Oscillations quick revision, Oscillations 2026, Oscillations JEE 2026, Oscillations notes for JEE, Oscillations NEET 2026, Oscillations notes for NEET, class 11 Physics revision, Oscillations formula sheet, Oscillations MCQs"
date: "2026-03-22"
practice_link: "/class-11/physics/oscillations-revision-notes"
hero_image: "/blog-images/oscillations-class-11-revision-notes-jee-neet.png"
---

![Oscillations Revision Notes recap](/blog-images/oscillations-revision-notes.webp)

*Last Updated: 2026-03-22*

## What is Oscillations Revision Notes?

# Oscillations Revision Notes

![Vibrational Visual: Oscillations, Simple Harmonic Motion, and Resonance](/blog-images/oscillations-revision.webp)

> [!TIP]
> **🚀 2-Minute Quick Recall Summary (Save for Exam Day)**
> - **SHM Condition:** F = -kx; a = -ω²x.
> - **Time Period:** T = 2π/ω. Simple Pendulum T = 2π√(L/g); Spring T = 2π√(m/k).
> - **Displacement:** x = A sin(ωt + φ).
> - **Velocity:** v = ω√(A² - x²). Max v = Aω (at mean).
> - **Energy:** Total E = ½ kA² = ½ mω²A². (Constant in SHM).
> [**📥 Download 1-Page Short Notes PDF (Zero-Friction)**](#)

---


## Introduction

Nature is rhythmic. From the beating of a heart and the vibration of a guitar string to the atomic oscillations in a crystal lattice, the study of "Oscillations" is the study of repetitive motion. At the heart of this chapter is **Simple Harmonic Motion (SHM)**—a special type of periodic motion where the restoring force is directly proportional to the displacement. Understanding SHM is critical for mastering Waves, Optics, and Alternating Current in Class 12. In this "Comprehensive" guide, we provide exhaustive derivations for SHM equations, energy profiles, and the physics of pendulums and springs—providing the ultimate preparation for JEE, NEET, and Board exams.

---




## 1. Periodic and Oscillatory Motion

- **Periodic Motion:** Motion that repeats itself at regular intervals of time (e.g., Earth's orbit).
- **Oscillatory Motion:** To-and-fro motion about a fixed mean position (e.g., Pendulum).
- **Note:** Every oscillatory motion is periodic, but not every periodic motion is oscillatory.

---




## 2. Simple Harmonic Motion (SHM)

**Statement:** A type of motion where the restoring force **F** acting on the particle is proportional to displacement **x** from the mean position and points toward it.
**Formula: F = -kx** (where k is the force constant).

### Derivation: Projection of Uniform Circular Motion (UCM)
**Theorem:** SHM can be defined as the projection of Uniform Circular Motion on any diameter of the reference circle.
1.  Consider a particle moving in a circle of radius **A** with angular velocity **ω**.
2.  At any time **t**, its angular position is **θ = ωt + φ**.
3.  The projection of its position on the Y-axis is **y = A sinθ**.
4.  **Result: y = A sin(ωt + φ)**.
This is the **General Equation of SHM**.

---




## 3. Derivations Master-Sheet: Kinematics of SHM

Starting from **x = A sin(ωt + φ)**:

### I. Velocity (v)
1.  **v = dx/dt = d[A sin(ωt + φ)]/dt**.
2.  **v = Aω cos(ωt + φ)**.
3.  Using **cosθ = √(1 - sin²θ)**:
    - **v = ω √(A² - x²)**. (Proven)
**Result:** Velocity is maximum at the mean position (**x = 0**) and zero at extremes (**x = A**).

### II. Acceleration (a)
1.  **a = dv/dt = d[Aω cos(ωt + φ)]/dt**.
2.  **a = -Aω² sin(ωt + φ)**.
3.  Since **x = A sin(ωt + φ)**:
    - **a = -ω² x**. (Proven)
**Conclusion:** Acceleration is always directed opposite to displacement and is proportional to it.

---




## 4. Derivation: Energy in SHM

### I. Potential Energy (U)
1.  Work done against restoring force **F = kx**.
2.  **dW = kx dx**.
3.  **U = ∫ [0 to x] kx dx = 1/2 kx²**.
4.  Since **k = mω²**:
    - **U = 1/2 mω² x²**.

### II. Kinetic Energy (K)
1.  **K = 1/2 m v² = 1/2 m [ω √(A² - x²)]²**
2.  **K = 1/2 mω² (A² - x²)**.

### III. Total Energy (E)
1.  **E = K + U = 1/2 mω² (A² - x²) + 1/2 mω² x²**
2.  **E = 1/2 mω² A²**. (Proven)
**Result:** The total energy of a particle in SHM is constant and proportional to the square of the amplitude.

---




## 5. Time Period Derivations

### I. Simple Pendulum
1.  Restoring force **F = -mg sinθ**.
2.  For small angles (**sinθ ≈ θ**): **F = -mg (x/L)** (where L is length).
3.  Comparing with **F = -kx**: **k = mg / L**.
4.  **ω = √(k/m) = √(g/L)**.
5.  **T = 2π / ω = 2π √(L/g)**. (Proven)

### II. Spring-Mass System
1.  **F = -kx**.
2.  **ω = √(k/m)**.
3.  **T = 2π √(m/k)**. (Proven)

---




## 6. Free, Damped, and Forced Oscillations

- **Free:** Occur with the system's natural frequency under no external force.
- **Damped:** Amplitude decreases over time due to friction/drag forces (**F_drag = -bv**).
- **Forced:** Driven by an external periodic force.
- **Resonance:** When the external driving frequency matches the natural frequency, the amplitude reaches its maximum.

---




## Comprehensive Exam Strategy (Q&A)

**Q1: What is the phase difference between velocity and acceleration in SHM?**
**Answer:**
- Velocity **v** contains **cos(ωt)**.
- Acceleration **a** contains **-sin(ωt) = cos(ωt + π/2)**.
- **Phase Difference = π/2 (or 90°)**. Acceleration leads velocity by 90°.

**Q2: Does the total energy of an oscillator depend on its position 'x'?**
**Answer:** **No.** While Kinetic and Potential Energy individually change with **x**, their sum **E = 1/2 mω² A²** only depends on the mass, frequency, and amplitude of the oscillation.

**Q3: A clock based on a spring-mass system is taken to the Moon. Does it run slow?**
**Answer:** **No.** The time period of a spring-mass system **T = 2π√(m/k)** is independent of gravity. However, a pendulum clock **T = 2π√(L/g)** would run slower because **g** is smaller on the Moon.

---




## Related Revision Notes

- [**Chapter 2: Motion in a Straight Line (Kinematic Kin)**](/blog/motion-in-a-straight-line-revision-notes)
- [**Chapter 14: Waves (The Next Step)**](/blog/waves-revision-notes)
- [**SHM Phase and Phasor Diagram Masterclass**](/blog/jee-mains-high-weightage-chapters)




## Conclusion

Oscillations are the universal language of physical vibration. By mastering the derivations of the SHM equations and the energy profile of an oscillator, you unlock the key to understanding all of wave physics. Master the simple pendulum proof and the concept of resonance—these are the principles that safeguard bridges, fine-tune musical instruments, and explain the behavior of light itself. Stay rhythmic, keep your amplitude constant, and always stay in phase with the universe!

---
**Reference:** [Journal of Sound and Vibration](https://www.journals.elsevier.com/journal-of-sound-and-vibration)

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


