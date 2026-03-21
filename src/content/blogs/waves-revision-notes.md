---
title: "Waves Revision Notes"
description: "Master wave concepts for JEE & NEET with our concise study guide, covering types, superposition, interference, and more."
category: "Biology"
keywords: "waves revision notes, Biology, Exam Compass"
---

# Waves Revision Notes

# Waves Revision Notes

# Waves Revision Notes

# Waves Revision Notes

# Waves Class 11 Physics Quick Recall Sheet (Short Notes 2026-27)



![Vibrational Visual: Waves, Beats, and the Doppler Effect](/blog-images/waves-revision.webp)

> [!TIP]
> **🚀 2-Minute Quick Recall Summary (Save for Exam Day)**
> - **Wave Speed:** v = ν λ. String v = √(T/μ). Gas v = √(γP/ρ).
> - **Progressive Wave:** y = A sin(kx - ωt).
> - **Standing Waves:** 
>   - Open Pipe: All harmonics (f_n = n v/2L).
>   - Closed Pipe: Odd harmonics (f_n = (2n-1) v/4L).
> - **Beats:** Beat frequency f = |f1 - f2|.
> - **Doppler Effect:** f' = f [ (v ± v_o) / (v ∓ v_s) ].
> [**📥 Download 1-Page Short Notes PDF (Zero-Friction)**](#)

---

## Introduction
Waves are the carriers of energy and information across the universe. From the seismic tremors that reshape continents to the electromagnetic signals that power the internet, the movement of energy through a medium (or vacuum) defines our modern reality. This final chapter of Class 11 Physics, "Waves," is the culmination of everything we have learned about mechanics and oscillations. It describes how a disturbance in one part of a medium propagates to another, without the actual transport of matter. In this "Comprehensive" guide, we provide the most exhaustive technical derivations available—from Laplace's correction for the speed of sound to the complex geometry of the Doppler Effect—ensuring you are fully equipped for JEE, NEET, and Board exams.

---

## 1. The Nature of Waves: Classifications and Definitions
A **Wave** is a disturbance that travels through a medium, transporting energy from one point to another without causing permanent displacement of the particles of the medium.

### I. Mechanical vs. Non-Mechanical Waves
- **Mechanical Waves:** Require a material medium (Elasticity and Inertia) for propagation (e.g., Sound, Water waves).
- **Non-Mechanical (Electromagnetic) Waves:** Do not require a medium; they propagate via oscillating electric and magnetic fields (e.g., Light, Radio waves).

### II. Transverse vs. Longitudinal Waves
- **Transverse Waves:** Particles of the medium vibrate perpendicular to the direction of wave propagation. They consist of **Crests** and **Troughs**. (e.g., Waves on a string).
  - *Condition:* Can only travel in solids and on the surface of liquids (requires shear strength).
- **Longitudinal Waves:** Particles vibrate parallel to the direction of wave propagation. They consist of **Compressions** and **Rarefactions**. (e.g., Sound waves).
  - *Condition:* Can travel in solids, liquids, and gases.

### III. Fundamental Wave Quantities
1.  **Amplitude (A):** The maximum displacement of a particle from its mean position.
2.  **Wavelength (λ):** Distance between two consecutive crests or compressions.
3.  **Frequency (ν):** Number of oscillations per second. **ν = 1 / T**.
4.  **Wave Velocity (v):** Distance traveled by the wave per unit time. **v = ν λ**.
5.  **Angular Wave Number (k):** **k = 2π / λ**.
6.  **Angular Frequency (ω):** **ω = 2π ν = 2π / T**.

---

## 2. Mathematical Representation of a Progressive Wave
A **Progressive Wave** is a wave that moves continuously in a specific direction.

### I. The Wave Equation
For a wave traveling in the positive X-direction:
**y(x, t) = A sin(kx - ωt + φ)**
Where:
- **y:** Displacement at position x and time t.
- **φ:** Initial phase constant.

### II. Proof: The Linear Wave Equation
Any function representing a wave must satisfy the following second-order differential equation:
**∂²y / ∂x² = (1/v²) ∂²y / ∂t²**
This equation proves that the shape of the wave remains constant as it propagates through space.

---

## 3. Speed of Waves: The Technical Derivations
The speed of a wave depends on the mechanical properties (elasticity and inertia) of the medium.

### I. Speed of Transverse Wave on a Stretched String
**Theorem:** **v = √(T / μ)**
Where **T** is Tension and **μ** is linear mass density (**mass/length**).
**Proof Logic:** By considering a small segment of the string under tension and applying Newton's Second Law for the restoring force in the vertical direction, the dependency on tension and inertia (mass) is derived.

### II. Newton’s Formula for Speed of Sound in Gases
Newton assumed that sound propagation is an **Isothermal Process** (temperature remains constant).
1.  **v = √(B_iso / ρ)**.
2.  For isothermal: **PV = Constant** => **P dV + V dP = 0** => **B_iso = -V(dP/dV) = P**.
3.  **v = √(P / ρ)**.
**Error:** For air at STP, this gives **280 m/s**, whereas the experimental value is **332 m/s**. Newton's calculation was off by ~15%.

### III. Laplace’s Correction (The Winning Proof)
Laplace argued that sound propagation is so fast that no heat exchange occurs; it is an **Adiabatic Process**.
1.  For adiabatic: **PVᵞ = Constant**.
2.  Differentiating: **P (γ Vᵞ⁻¹) dV + Vᵞ dP = 0** => **B_adia = -V(dP/dV) = γP**.
3.  **v = √(γP / ρ)**.
**Result:** For air (γ = 1.4), this gives **331.3 m/s**, matching experimental data perfectly.

---

## 4. The Principle of Superposition
**Statement:** When two or more waves overlap in a medium, the resultant displacement at any point is the vector sum of the individual displacements.
**y_net = y1 + y2 + y3 + ...**

### I. Interference
- **Constructive:** Waves meet in phase (Crest meets Crest). **A_max = A1 + A2**.
- **Destructive:** Waves meet out of phase (Crest meets Trough). **A_min = |A1 - A2|**.

---

## 5. Standing Waves (Stationary Waves)
Formed when two identical waves traveling in opposite directions superimpose. They do not transport energy.

### I. Analytical Treatment
1.  **y1 = A sin(kx - ωt)** (Incoming).
2.  **y2 = A sin(kx + ωt)** (Reflected).
3.  **y_net = (2A cos ωt) sin kx**.
**Result:** The amplitude **(2A sin kx)** depends on position **x**.
- **Nodes:** Points of zero displacement (**sin kx = 0**).
- **Antinodes:** Points of maximum displacement (**sin kx = 1**).

### II. Standing Waves in a Stretched String
Both ends are fixed, so they must be Nodes.
**Fundamental Frequency (f1) = v / 2L = (1/2L) √(T/μ)**.
**Harmonics:** f2 = 2f1, f3 = 3f1... (All harmonics are present).

### III. Organ Pipes: The Physics of Air Columns
1.  **Closed Pipe (One end closed):** Closed end is a Node, Open end is an Antinode.
    - **Fundamental:** f1 = v / 4L.
    - **Harmonics:** 1 : 3 : 5 : ... (**Only odd harmonics**).
2.  **Open Pipe (Both ends open):** Both ends are Antinodes.
    - **Fundamental:** f1 = v / 2L.
    - **Harmonics:** 1 : 2 : 3 : ... (**All harmonics present**).
> [!TIP]
> **Exam Secret:** An open pipe is musically richer than a closed pipe of the same length because it produces both even and odd harmonics.

---

## 6. Beats: Interference in Time
Formed by the superposition of two waves of slightly different frequencies (**ν1 and ν2**).
- **Beat Frequency (f_beat) = |ν1 - ν2|**.
- Used for tuning musical instruments and detecting gas leaks in mines.

---

## 7. The Doppler Effect (Master Derivation)
The apparent change in frequency of a wave due to the relative motion between the source and the observer.

### I. The General Formula
**f' = f [ (v ± v_o) / (v ∓ v_s) ]**
Where:
- **f':** Observed frequency.
- **f:** Actual frequency.
- **v:** Speed of sound.
- **v_o:** Velocity of observer.
- **v_s:** Velocity of source.

### II. Derivation Steps
1.  Let the source move toward the observer with **v_s**. The wave is "compressed" in front of the source.
2.  The effective wavelength becomes **λ' = (v - v_s) / f**.
3.  The observer (stationary) sees frequency **f' = v / λ' = f [v / (v - v_s)]**.
4.  If the observer also moves toward the source with **v_o**, the relative speed of the wave wrt observer is **(v + v_o)**.
5.  **f_final = (v + v_o) / λ' = f [ (v + v_o) / (v - v_s) ]**.

---

## Comprehensive Exam Strategy (Q&A)

**Q1: Why does sound travel faster in solids than in gases?**
**Answer:** The speed of sound is **v = √(E / ρ)**. Although solids are much denser than gases (which would decrease speed), their elasticity (E) is significantly higher. Since elasticity dominates the equation, sound travels ~15 times faster in solids than in air.

**Q2: What is Laplace's correction and why was Newton wrong?**
**Answer:** Newton assumed sound travel was isothermal, but the compressions and rarefactions of a sound wave happen so rapidly that heat does not have time to escape. This makes it an **Adiabatic** process. Laplace corrected this by multiplying pressure by **γ** (ratio of specific heats), bringing the theoretical value in line with experimental results.

**Q3: Can a sound wave travel in a vacuum?**
**Answer:** **No.** Sound is a mechanical longitudinal wave. It requires a medium with elasticity and inertia to transmit the physical disturbance. In a vacuum, there are no particles to oscillate, so sound cannot propagate.

**Q4: Compare the fundamental frequencies of an open and closed pipe of length 'L'.**
**Answer:**
- f_open = v / 2L.
- f_closed = v / 4L.
- **Result:** f_open = 2 × f_closed. An open pipe has twice the fundamental frequency of a closed pipe of the same length.

---

## Related Revision Notes
- [**Chapter 13: Oscillations (The Prelude to Waves)**](/blog/oscillations-revision-notes)
- [**Chapter 12: Kinetic Theory of Gases (Sound Speed Factors)**](/blog/kinetic-theory-revision-notes)
- [**The Ultimate Wave Mechanics Problem Set: Target JEE/NEET**](/blog/jee-mains-high-weightage-chapters)

## Conclusion
Waves are the signature of the universe's energy. By mastering the mathematical laws of wave propagation, the nuances of string dynamics, and the powerful Doppler Effect, you gain the ability to analyze everything from music to radar systems. Master the Laplace correction and the standing wave patterns—these are the principles that bridge the gap between pure physics and applied engineering. You have now completed the entire Class 11 Physics syllabus! Stay tuned as we embark on the journey of Class 12 Electromagnetism. Keep your frequency high, your phase constant, and always stay resonant with excellence!

---
**Reference:** [The Physics Classroom: Sound Waves and Music](https://www.physicsclassroom.com/class/sound)

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
