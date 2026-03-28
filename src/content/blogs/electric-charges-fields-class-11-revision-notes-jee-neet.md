---
title: "Electric Charges Fields Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide"
description: "The ultimate Electric Charges Fields revision resource for Physics students. Focused on 2026 exam patterns with pyq analysis and quick recall tables."
category: "Physics"
keywords: "electric charges fields class 11 revision notes jee neet, Physics, Exam Compass"
date: "2026-03-28"
heroImage: "/blog-images/electric-charges-fields-class-11-revision-notes-jee-neet.webp"
---

# Electric Charges Fields Class 11 Physics Revision — JEE & NEET 2026 Grandmaster Guide

![Hero Image](/blog-images/electric-charges-fields-class-11-revision-notes-jee-neet.webp)

*Last Updated: 2026-03-22*

## What is Electric Charges Fields Revision Notes?

# Electric Charges Fields Revision Notes

![Electrostatic Visual: Field Lines, Charges, and the Power of Gauss's Law](/blog-images/electric-charges-fields-revision.webp)

> [!TIP]
> **🚀 2-Minute Quick Recall Summary (Save for Exam Day)**
> - **Coulomb's Law:** F = k q1 q2 / r². k = 9 × 10⁹ N m²/C².
> - **Electric Field (E):** E = F/q. For point charge, E = kq/r².
> - **Electric Dipole (p):** p = q × 2a. Torque τ = p × E.
> - **Gauss's Law:** Total flux Φ = ∮ E · dA = Q_en/ε₀.
> - **Applications:** 
>   - Wire: E = λ / (2πε₀r)
>   - Sheet: E = σ / 2ε₀
>   - Shell: E_in = 0; E_out = kq/r².
> [**📥 Download 1-Page Short Notes PDF (Zero-Friction)**](#)

---


## Introduction

The universe is fundamentally electric. From the bonds that hold DNA together to the lightning that tears through the sky, the interaction of electric charges is the primary driver of the physical world. Class 12 Physics begins with **Electrostatics**—the study of charges at rest. This first chapter, "Electric Charges and Fields," serves as the cornerstone for the entire field of Electromagnetism. In this "Comprehensive" guide, we transcend simple summaries to provide rigorous proofs for every major theorem, including the field of a dipole and the exhaustive applications of Gauss's Law. Whether you are aiming for a perfect score in Board exams or a top rank in JEE/NEET, these notes provide the technical precision and conceptual clarity required for academic mastery.

---




## 1. Electric Charge: The Fundamental Property

**Electric Charge** is an intrinsic property of elementary particles that gives rise to electric forces.

### I. Key Properties of Charge
1.  **Quantization of Charge:** Charge exists only in integral multiples of the elementary charge **e** (1.602 × 10⁻¹⁹ C). **Q = ±ne**.
2.  **Additivity of Charges:** The total charge of a system is the algebraic sum of individual charges.
3.  **Conservation of Charge:** The total charge of an isolated system remains constant.

### II. Conductors vs. Insulators
- **Conductors:** Allow easy flow of electricity due to free electrons (e.g., Metals, Earth, Human body).
- **Insulators:** High resistance to charge flow (e.g., Glass, Plastic, Dry wood).

---




## 2. Coulomb’s Law: The Force of Interaction

**Statement:** The magnitude of the electrostatic force between two point charges is directly proportional to the product of the charges and inversely proportional to the square of the distance between them.

### I. Scalar Form
**F = k |q1 q2| / r²**
Where **k = 1 / (4πε₀)** ≈ 9 × 10⁹ N m²/C².
**ε₀ (Permittivity of Free Space)** = 8.854 × 10⁻¹² C² N⁻¹ m⁻².

### II. Vector Form Derivation (The Absolute Proof)
Let **r1** and **r2** be the position vectors of charges **q1** and **q2**.
1.  Relative vector **r_21 = r2 - r1**.
2.  Distance **r = |r_21|**.
3.  Unit vector **r̂_21 = r_21 / r**.
4.  Force on **q2** due to **q1**:
    - **F_21 = [1 / (4πε₀)] [q1 q2 / r²] r̂_21**.
**Conclusion:** Since **r̂_12 = -r̂_21**, it follows that **F_12 = -F_21**, proving that electrostatic forces obey Newton's Third Law.

---




## 3. Electric Field: The Sphere of Influence

An **Electric Field (E)** is the region around a charged particle where another charge experiences a force.
**E = F / q₀ = [1 / (4πε₀)] [q / r²] r̂**.

### I. Electric Field Lines
- Path along which a positive test charge would move.
- Directed away from positive charges and toward negative charges.
- The density of lines indicates field strength.
- **Two field lines never intersect** (otherwise, there would be two directions of force at one point).

---




## 4. The Electric Dipole: A System of Two Charges

An **Electric Dipole** consists of two equal and opposite charges (**+q, -q**) separated by a small distance (**2a**).
**Dipole Moment (p): p = q × (2a)**. (Directed from -q to +q).

### I. Derivation: Field on the Axial Line
1.  Let point P be at distance **r** from the center of the dipole on its axis.
2.  **E_axial = E_positive - E_negative**
3.  **E_axial = [q / (4πε₀)] [ 1/(r-a)² - 1/(r+a)² ]**
4.  Simplifying the bracket: **[ (r+a)² - (r-a)² ] / (r² - a²)² = [ 4ra ] / (r² - a²)²**.
5.  **E_axial = [ 1 / (4πε₀) ] [ 2pr / (r² - a²)² ]**.
6.  For a short dipole (**r ≫ a**):
    - **E_axial = [ 1 / (4πε₀) ] [ 2p / r³ ]**. (Proven)

### II. Derivation: Field on the Equatorial Line
1.  Let point P be at distance **r** on the perpendicular bisector.
2.  The vertical components of fields from +q and -q cancel out.
3.  The horizontal components add up: **E_equatorial = 2 E cosθ**.
4.  **E_equatorial = 2 [ q / 4πε₀ (r²+a²) ] [ a / √(r²+a²) ]**.
5.  **E_equatorial = [ 1 / (4πε₀) ] [ p / (r² + a²)³/² ]**.
6.  For a short dipole (**r ≫ a**):
    - **E_equatorial = [ 1 / (4πε₀) ] [ p / r³ ]**. (Proven)
**Comparison:** E_axial = 2 × E_equatorial for the same distance r.

---




## 5. Torque on a Dipole in a Uniform Electric Field

1.  Force on +q: **qE** (in direction of E).
2.  Force on -q: **-qE** (opposite to E).
3.  Net force = 0 (Total translational equilibrium).
4.  **Torque (τ) = Force × Perpendicular Distance**
5.  **τ = (qE) × (2a sinθ)**.
6.  **τ = pE sinθ = p × E**. (Proven)

---




## 6. Gauss’s Law: The Revolutionary Tool

**Statement:** The total electric flux through any closed surface is equal to **1/ε₀** times the net charge enclosed by the surface.
**∮ E · dA = Q_enclosed / ε₀**.

### I. Derivation (Proof using Coulomb’s Law)
1.  Consider a point charge **q** at the center of a sphere of radius **r**.
2.  **E = [1 / 4πε₀] [q / r²]**.
3.  Flux **Φ = ∮ E dA cos 0° = E ∮ dA**.
4.  Since ∮ dA = 4πr²:
    - **Φ = [1 / 4πε₀] [q / r²] [4πr²] = q / ε₀**. (Proven)

---




## 7. Applications of Gauss’s Law (Technical Mastery)

### I. Field due to an Infinitely Long Straight Wire
1.  Assume a Gaussian cylinder of radius **r** and length **L**.
2.  Flux is only through the curved surface: **Φ = E (2πrL)**.
3.  Charge enclosed **Q = λ L** (where λ is linear charge density).
4.  By Gauss's Law: **E (2πrL) = λL / ε₀**.
5.  **E = λ / (2πε₀r)**. (Proven)

### II. Field due to an Infinite Uniformly Charged Plane Sheet
1.  Assume a Gaussian pillbox passing through the sheet.
2.  Flux through two ends: **Φ = 2EA**.
3.  Charge enclosed **Q = σ A** (where σ is surface charge density).
4.  By Gauss's Law: **2EA = σA / ε₀**.
5.  **E = σ / 2ε₀**. (Proven)
> [!NOTE]
> **Key Insight:** The electric field of an infinite sheet is independent of the distance **r**.

### III. Field due to a Uniformly Charged Thin Spherical Shell
1.  **Outside (r > R):** **E = [1 / 4πε₀] [q / r²]**. (Behaves like a point charge at center).
2.  **At the surface (r = R):** **E = σ / ε₀**.
3.  **Inside (r < R):** Since enclosed charge is zero, **E = 0**. (Proven)

---




## Comprehensive Exam Strategy (Q&A)

**Q1: Why is Gauss's Law valid only for closed surfaces?**
**Answer:** The concept of "enclosing" a charge requires a surface that divides space into an "inside" and an "outside." Flux through an open surface depends on the specific geometry and position of the charge, whereas for a closed surface, the reciprocal relationship between E and Area (r² vs 1/r²) ensures the total flux is invariant to the surface's size.

**Q2: A dipole is placed in a non-uniform electric field. What happens?**
**Answer:** In a **non-uniform** field, the forces on +q and -q are not equal in magnitude (**F_pos ≠ F_neg**). Therefore, the dipole experiences **both** a net torque and a net translational force.

**Q3: Can we use Gauss's Law to find the field of a finite line of charge?**
**Answer:** While Gauss's Law is always *true*, it is only *useful* for finding fields in cases of high symmetry (spherical, cylindrical, planar). For a finite line, the electric field is not constant over any simple Gaussian surface, making the integral ∮ E · dA impossible to solve easily.

---




## Related Revision Notes

- [**Chapter 2: Electrostatic Potential and Capacitance**](/blog/electrostatic-potential-capacitance-revision-notes)
- [**Chapter 3: Current Electricity**](/blog/current-electricity-revision-notes)
- [**Class 12 Physics: JEE/NEET High-Weightage Chapter List**](/blog/jee-mains-high-weightage-chapters)




## Conclusion

The field of Electrostatics is the foundation upon which all modern technology—from smartphones to medical imaging—is built. By mastering the mathematical derivations of Gauss's Law and the intricate geometry of dipoles, you move from being a student of physics to a practitioner of electrical science. Master these proofs, understand the symmetry of fields, and you will find that the rest of Class 12 Physics flows with logical elegance. Keep your potential high, your flux constant, and always stay grounded in the truth!

---
**Reference:** [MIT OpenCourseWare: Electromagnetism](https://ocw.mit.edu)

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
