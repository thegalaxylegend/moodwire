---
title: "Rotational Motion Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide"
description: "The ultimate Rotational Motion revision resource for Physics students. Focused on 2026 exam patterns with pyq analysis and quick recall tables."
category: "Physics"
keywords: "rotational motion class 11 revision notes jee neet, Physics, Exam Compass"
---

# Rotational Motion Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide

![Rotational Motion Revision Notes recap](/blog-images/rotational-motion-revision-notes.webp)

*Last Updated: 2026-03-22*

## What is Rotational Motion Revision Notes?

# Rotational Motion Revision Notes

![Engineering Visual: Rotational Dynamics and Gyroscopic Motion](/blog-images/rotational-motion-revision.webp)

> [!TIP]
> **🚀 2-Minute Quick Recall Summary (Save for Exam Day)**
> - **Torque:** τ = r × F = Iα. Turning effect of force.
> - **Moment of Inertia (I):** Σ mr². Mass distribution about axis.
> - **Angular Momentum (L):** L = r × p = Iω. Conserved if net external torque is zero.
> - **Theorems:** 
>   - Parallel: I = I_cm + Md²
>   - Perpendicular: I_z = I_x + I_y
> - **Rolling Motion:** v_cm = ωR. Total K.E. = ½mv_cm² + ½Iω².
> [**📥 Download 1-Page Short Notes PDF (Zero-Friction)**](#)

---


## Introduction

While the previous chapters dealt with the motion of "point masses," reality involves systems of particles and extended "rigid bodies." In Rotational Motion, every point on a body moves in a circle around an axis, creating a symphony of motion that requires new concepts: **Centre of Mass**, **Torque**, and **Moment of Inertia**. This chapter is widely considered one of the most challenging in Class 11 Physics, but it is also the most rewarding for those aiming for top scores in JEE and NEET. In this "Comprehensive" guide, we provide exhaustive derivations for the Parallel and Perpendicular Axes Theorems, the relation between Torque and Angular Momentum, and the physics of pure rolling motion.

---




## 1. Centre of Mass (CoM)

The Centre of Mass is the unique point where the entire mass of a system may be considered to be concentrated for describing its translational motion.

### Derivation: CoM of a 2-Particle System
Consider two masses **m1** and **m2** at positions **x1** and **x2**.
The position of the CoM is defined as:
**X_com = (m1 x1 + m2 x2) / (m1 + m2)**
- For an extended body (continuous mass), use integration: **X_com = (1/M) ∫ x dm**.

---




## 2. Torque and Angular Momentum

### I. Torque (τ) - The Rotational Force
Torque is the "turning effect" of a force.
**Formula: τ = r × F = r F sinθ**.
**Derivation in Cartesian Coordinates:**
1.  Let **r = x î + y ĵ** and **F = Fx î + Fy ĵ**.
2.  **τ = r × F = (x Fy - y Fx) k̂**.

### II. Angular Momentum (L)
The rotational equivalent of linear momentum.
**Formula: L = r × p = I ω**.

### III. Proof: τ = dL/dt (Rotational Newton's 2nd Law)
1.  **L = r × p**.
2.  Differentiating wrt time: **dL/dt = d(r × p)/dt**.
3.  **dL/dt = (dr/dt × p) + (r × dp/dt)**.
4.  Since **dr/dt = v** and **p = mv**, the first term **(v × mv) = 0** (cross product of parallel vectors).
5.  Since **dp/dt = F**:
    - **dL/dt = r × F = τ**. (Proven)

---




## 3. Moment of Inertia (I): Rotational Mass

Moment of Inertia resists changes in rotational motion.
**Formula: I = Σ mi ri² = ∫ r² dm**.

### Parallel Axes Theorem (Proof)
**Theorem:** **I = I_com + Ma²**
(where **I_com** is the MoI about an axis through the CoM, and **a** is the distance between axes).
1.  **Proof Logic:** By expanding the integral **∫ (x + a)² dm** and noting that **∫ x dm = 0** for an axis passing through the CoM, we arrive at the result.

### Perpendicular Axes Theorem (Proof)
**Theorem:** **Iz = Ix + Iy** (Only for 2D laminar bodies).
1.  **Proof Logic:** Since **r² = x² + y²**, integrating both sides yields **∫ r² dm = ∫ x² dm + ∫ y² dm**, which corresponds to **Iz = Iy + Ix**.

---




## 4. Moment of Inertia Master-Sheet

| Body | Axis | MoI (I) |
| :--- | :--- | :--- |
| **Thin Rod (L)** | Centre, Perpendicular | **ML² / 12** |
| **Circular Ring (R)** | Centre, Perpendicular | **MR²** |
| **Circular Disc (R)** | Centre, Perpendicular | **MR² / 2** |
| **Solid Sphere (R)** | Diameter | **2/5 MR²** |
| **Hollow Sphere (R)** | Diameter | **2/3 MR²** |

---




## 5. Dynamics of Rolling Motion

When an object rolls, it has both translational and rotational kinetic energy.
**K_total = K_trans + K_rot = 1/2 Mv² + 1/2 Iω²**

### Condition for Pure Rolling:
For a body rolling without slipping: **v = R ω**.
If this condition is met, the point of contact is momentarily at rest.

---




## Comprehensive Exam Strategy (Q&A)

**Q1: Why are the spokes of a bicycle wheel made thin?**
**Answer:** The bulk of the mass is concentrated at the **rim** (far from the axis). According to **I = mr²**, this maximizes the Moment of Inertia for a given weight, providing the wheel with greater stability and helping it maintain motion once started.

**Q2: A ballet dancer pulls her arms in while spinning. Why does her speed increase?**
**Answer:** According to the **Law of Conservation of Angular Momentum (L = Iω = Constant)**, when she pulls her arms in, her mass moves closer to the axis, decreasing her **Moment of Inertia (I)**. To keep **L** constant, her angular velocity **(ω)** must increase.

**Q3: Which will reach the bottom of an incline first: A solid sphere or a circular ring?**
**Answer:** The **Solid Sphere**. Acceleration of a rolling body is **a = g sinθ / (1 + k²/R²)**. The solid sphere has a smaller radius of gyration (k), leading to a higher acceleration.

---




## Related Revision Notes

- [**Chapter 4: Laws of Motion (Inertia Basics)**](/blog/laws-of-motion-revision-notes)
- [**Chapter 7: Gravitation (Orbital Angular Momentum)**](/blog/gravitation-notes)
- [**Mastering Rotational Mechanics: Advanced Problem Set**](/blog/jee-mains-high-weightage-chapters)




## Conclusion

Rotational Motion is the ultimate test of a physicist's understanding of symmetry and conservation laws. By mastering the mathematical bridge between linear and angular quantities, you gain the ability to analyze everything from a spinning top to the rotation of entire galaxies. Master the parallel axes theorem and the conservation of angular momentum—these are the pillars of advanced mechanics and mechanical engineering. Stay centered, keep your torque high, and maintain your momentum!

---
**Reference:** [Physics World: The Secrets of Angular Momentum](https://physicsworld.com)

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
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
