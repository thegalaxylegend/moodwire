# QA AUDIT 12.0 — Question Engine v3.2

**Generated on**: 31/3/2026, 11:20:12 am

**Engine Version**: v3.2 (Mantissa fix + Verifier math-only + JSON safety + Unit validator fix)

---


## Executive Summary

| Metric | Value |
|---|---|
| **Total Questions** | 25 |
| **Approved** | 2 (8.0%) |
| **Rejected** | 23 |
| **Errors** | 0 |
| **High Confidence (≥0.85)** | 2 |
| **Avg Confidence** | 0.95 |
| **Avg Generation Time** | 1.6s |

### Per-Subject Breakdown

| Subject | Total | Approved | Rate |
|---|---|---|---|
| Physics | 10 | 1 | 10.0% |
| Chemistry | 7 | 1 | 14.3% |
| Mathematics | 6 | 0 | 0.0% |
| Biology | 2 | 0 | 0.0% |

### Per-Difficulty Breakdown

| Difficulty | Total | Approved | Rate |
|---|---|---|---|
| Easy | 3 | 0 | 0.0% |
| Medium | 17 | 2 | 11.8% |
| Hard | 5 | 0 | 0.0% |

### ❌ VERDICT: BELOW TARGET (8.0%). Review failing topics and add targeted fixes.

### 1. ✅ Wave Optics (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 4541ms |
| **Expected Trap** | Single slit vs circular aperture formula confusion |

> **Question**: In a double slit experiment with a screen distance of 1.2 m and slit separation of 0.02 m, what is the fringe width if the wavelength of light used is 600 nm?

> **Answer**: The fringe width is 3.6 * 10^-5 m

> **Formula**: `Double slit fringe width: β = λD/d`

> **Steps**:
> 1. Step 1: Convert wavelength to meters, λ = 600 nm = 600 * 10^-9 m = 6 * 10^-7 m
> 2. Step 2: Substitute given values into the formula β = λD/d
> 3. Step 3: Calculate β = (6 * 10^-7 m) * (1.2 m) / (0.02 m) = 3.6 * 10^-5 m

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 2. ❌ Atoms (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Bohr model E = -13.6/n² (NOT /n)

---

### 3. ❌ Kinetic Theory (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: KE proportional to T (NOT T²)

---

### 4. ❌ Nuclei (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: β decay mass number unchanged

---

### 5. ❌ Electrostatics (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: E between plates = σ/ε₀ not σ/2ε₀

---

### 6. ❌ Thermodynamics (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Carnot temp in Kelvin not Celsius

---

### 7. ❌ Current Electricity (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: V = E - Ir sign convention

---

### 8. ❌ Circular Motion (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Centripetal force is not a separate force

---

### 9. ❌ Gravitation (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: GPE is negative

---

### 10. ❌ Oscillations (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Period independent of mass for pendulum

---

### 11. ❌ Redox Reactions (Chemistry)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Cr₂O₇²⁻ has TWO Cr atoms = 6e⁻ total

---

### 12. ❌ Chemical Kinetics (Chemistry)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: First order t½ independent of concentration

---

### 13. ❌ Equilibrium (Chemistry)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: pH is dimensionless

---

### 14. ❌ Electrochemistry (Chemistry)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: E°_cell = E°_cathode - E°_anode

---

### 15. ❌ Hydrogen (Chemistry)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: 2Na → 1H₂ stoichiometry

---

### 16. ✅ Solid State (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 4677ms |
| **Expected Trap** | FCC has 4 atoms per unit cell |

> **Question**: The edge length of the unit cell of NaCl is 5.63 * 10^-8 cm. If the molar mass of NaCl is 58.44 g/mol, what is the density of NaCl?

> **Answer**: The density of NaCl is 2.165 g/cm³

> **Formula**: `Density: ρ = (Z × M)/(a³ × Nₐ)`

> **Steps**:
> 1. Step 1: Using the formula ρ = (Z × M)/(a³ × Nₐ), we will substitute the given values.
> 2. Step 2: Calculate a³: (5.63 * 10^-8 cm)³ = 1.788 * 10^-22 cm³
> 3. Step 3: Substitute values into the formula: ρ = (4 * 58.44 g/mol)/((1.788 * 10^-22 cm³) * (6.022 * 10^23))
> 4. Step 4: Perform the calculation: ρ = (233.76 g/mol)/((1.788 * 10^-22 cm³) * (6.022 * 10^23))
> 5. Step 5: Simplify the expression: ρ = 233.76 / (1.788 * 10^-22 * 6.022 * 10^23) = 233.76 / 10.77 = 2.165 g/cm³

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 17. ❌ Solutions (Chemistry)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Van't Hoff factor for electrolytes

---

### 18. ❌ Probability (Mathematics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Geometric: P(X>k) = (1-p)^k

---

### 19. ❌ Statistics (Mathematics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: E(X) = Σ xᵢP(xᵢ) step by step

---

### 20. ❌ Conic Sections (Mathematics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Eccentricity is DIMENSIONLESS

---

### 21. ❌ Vector Algebra (Mathematics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Cross product anti-commutative

---

### 22. ❌ Complex Numbers (Mathematics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: i² = -1 cycle

---

### 23. ❌ Integrals (Mathematics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Integration by parts ILATE rule

---

### 24. ❌ Evolution (Biology)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Must contain specific biology terms

---

### 25. ❌ Human Health (Biology)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Must reference specific diseases/pathogens

---

