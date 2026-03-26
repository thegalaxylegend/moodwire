---
heroImage: "/blog-images/motion-in-a-plane-class-11-revision-notes-jee-neet.webp"
title: "Motion In A Plane Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide"
description: "The ultimate Motion In A Plane revision resource for Physics students. Focused on 2026 exam patterns with pyq analysis and quick recall tables."
category: "Physics"
keywords: "motion in a plane class 11 revision notes jee neet, Physics, Exam Compass"
---

# Motion In A Plane Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide

![Hero Image](/blog-images/motion-in-a-plane-class-11-revision-notes-jee-neet.webp)

*Last Updated: 2026-03-22*

## What is Motion In A Plane Revision Notes?

# Motion In A Plane Revision Notes

![Aerospace Visual: 2D Trajectories and Circular Motion](/blog-images/motion-in-a-plane-revision.webp)

> [!TIP]
> **🚀 2-Minute Quick Recall Summary (Save for Exam Day)**
> - **Projectile Motion:** Max Height H = (u² sin²θ)/2g; Range R = (u² sin2θ)/g; Time of Flight T = (2u sinθ)/g.
> - **Max Range:** Occurs at θ = 45°.
> - **Equation of Trajectory:** y = x tanθ - [gx² / (2u² cos²θ)].
> - **Uniform Circular Motion:** Centripetal Acceleration a_c = v²/r = ω²r.
> - **Vectors:** Resolution R = √(A² + B² + 2AB cosθ).
> [**📥 Download 1-Page Short Notes PDF (Zero-Friction)**](#)

---


## Introduction

While 1D motion is the "alphabet" of physics, 2D motion—**Motion in a Plane**—is where reality truly unfolds. From the curved path of a football kicked into the air to the constant orbiting of a satellite, the laws of 2D kinematics govern how objects navigate our three-dimensional world. This chapter introduces the power of **Vectors** to split complex motion into independent horizontal and vertical components. In this "Comprehensive" guide, we provide exhaustive derivations for Projectile Motion, proving why every trajectory is a parabola, and deriving the fundamental laws of Circular Motion—all essential for top-tier performance in JEE, NEET, and Board exams.

---




## 1. The Power of Vectors

In 2D motion, we deal with quantities that have both magnitude and direction.
- **Position Vector (r):** **r = x î + y ĵ**.
- **Velocity Vector (v):** **v = vx î + vy ĵ**.

### Vector Multiplication:
1.  **Dot Product (A · B):** AB cosθ. (Result is a scalar, e.g., Work).
2.  **Cross Product (A × B):** AB sinθ n̂. (Result is a vector, e.g., Torque).

---




## 2. Projectile Motion: The Master Derivations

A projectile is an object thrown with an initial velocity **u** at an angle **θ** with the horizontal. We assume gravity is the only force acting on it (**a_x = 0, a_y = -g**).

### I. Equation of Trajectory (The Parabola Proof)
1.  **Horizontal Position:** x = (u cosθ) t  => **t = x / (u cosθ)**.
2.  **Vertical Position:** y = (u sinθ) t - 1/2 gt².
3.  Substituting **t**:
    - **y = (u sinθ) [x / (u cosθ)] - 1/2 g [x / (u cosθ)]²**
    - **y = x tanθ - [g / (2u² cos²θ)] x²**.
**Theorem:** This is in the form of **y = ax + bx²**, which is the equation of a **Parabola**.

### II. Time of Flight (T)
At t = T, the vertical displacement is zero (y = 0).
- 0 = (u sinθ) T - 1/2 gT²
- 1/2 gT² = (u sinθ) T
- **T = (2u sinθ) / g**.

### III. Maximum Height (H)
At the peak, vertical velocity is zero (**v_y = 0**).
- 0 = (u sinθ)² - 2gH
- **H = (u² sin²θ) / 2g**.

### IV. Horizontal Range (R)
Distance covered horizontally in time T.
- R = (u cosθ) × T = (u cosθ) × (2u sinθ / g)
- R = (u² / g) (2 sinθ cosθ)
- **R = (u² sin2θ) / g**.

> [!IMPORTANT]
> **Maximum Range:** The range is maximum when **sin2θ = 1**, which occurs at **θ = 45°**.

---




## 3. Uniform Circular Motion (UCM)

When an object moves in a circle at a constant speed, its direction changes continuously, meaning it is **accelerating**.

### I. Relation between v and ω
- **v** (Linear Velocity) = ds/dt.
- **ω** (Angular Velocity) = dθ/dt.
- Since s = r θ, then ds/dt = r (dθ/dt) => **v = r ω**.

### II. Derivation of Centripetal Acceleration (a_c)
Consider a particle moving from P to Q in time Δt.
1.  **Change in velocity (Δv):** geometrically, for small Δθ, Δv ≈ v Δθ.
2.  **Acceleration (a):** a = Δv / Δt = v (Δθ / Δt).
3.  Since Δθ / Δt = ω and ω = v/r:
    - **a_c = v (v/r) = v² / r**.
**Result:** **a_c = v² / r = ω² r**. This acceleration always points toward the center.

---




## 4. Relative Velocity in Two Dimensions

When two objects A and B move in a plane:
**V_AB = V_A - V_B**

### I. Rain-Man Problems
If rain falls vertically (**v_r**) and a man moves horizontally (**v_m**):
- **Relative velocity of rain wrt man:** **v_rm = v_r - v_m**.
- The man should hold his umbrella at an angle **tanθ = v_m / v_r** with the vertical.

### II. River-Boat Problems
- **Crossing in Shortest Time:** Boat must head directly across the river (**θ = 0°**). **t = d / v_b**.
- **Crossing in Shortest Path (Zero Drift):** Boat must head at an upstream angle θ such that **v_b sinθ = v_river**.

---




## Comprehensive Exam Strategy (Q&A)

**Q1: Two projectiles are thrown at angles θ and (90-θ). Compare their ranges.**
**Answer:**
- R1 = (u² sin2θ) / g.
- R2 = (u² sin[2(90-θ)]) / g = (u² sin[180-2θ]) / g = (u² sin2θ) / g.
- **Conclusion:** The Horizontal Range is identical for complementary angles.

**Q2: Why is centripetal acceleration called 'center-seeking'?**
**Answer:** In Uniform Circular Motion, while the speed is constant, the velocity vector is always changing its direction to turn the object. This change (Δv) always points toward the center of the circle, as derived using vector subtraction.

**Q3: A ball is dropped from a moving train. What is its trajectory as seen from (a) ground, (b) inside train?**
**Answer:**
- (a) **Ground:** A parabola, because it has horizontal velocity (inherited from the train) and vertical acceleration (gravity).
- (b) **Inside Train:** A vertical straight line, because the horizontal velocities of the ball and the train are the same.

---




## Related Revision Notes

- [**Chapter 4: Laws of Motion (Forces & FBD)**](/blog/laws-of-motion-revision-notes)
- [**Chapter 6: Rotational Motion (Centripetal vs Centrifugal)**](/blog/rotational-motion-revision-notes)
- [**Interactive Projectile Motion Simulator**](/blog/jee-mains-high-weightage-chapters)




## Conclusion

Motion in a Plane is the first time we truly see the vector nature of the universe. By splitting a single motion into two independent axes, we can predict exactly where a projectile will land or how to steer a boat across a racing current. Master the derivations of T, H, and R, and understand the geometric beauty of centripetal acceleration—these are the tools of the modern engineer and physicist.

---
**Reference:** [HyperPhysics: 2D Kinematics and Vectors](http://hyperphysics.phy-astr.gsu.edu/hbase/vect.html)

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
