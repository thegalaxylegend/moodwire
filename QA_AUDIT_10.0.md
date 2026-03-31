# QA AUDIT 10.0 — Question Engine v3.0

**Generated on**: 31/3/2026, 9:58:49 am

**Engine Version**: v3.0 (Formula injection + Anti-anchored verifier + 5-layer validation)

---


## Executive Summary

| Metric | Value |
|---|---|
| **Total Questions** | 25 |
| **Approved** | 16 (64.0%) |
| **Rejected** | 9 |
| **Errors** | 0 |
| **High Confidence (≥0.85)** | 16 |
| **Avg Confidence** | 0.95 |
| **Avg Generation Time** | 7.6s |

### Per-Subject Breakdown

| Subject | Total | Approved | Rate |
|---|---|---|---|
| Physics | 10 | 8 | 80.0% |
| Chemistry | 7 | 4 | 57.1% |
| Mathematics | 6 | 3 | 50.0% |
| Biology | 2 | 1 | 50.0% |

### Per-Difficulty Breakdown

| Difficulty | Total | Approved | Rate |
|---|---|---|---|
| Easy | 3 | 2 | 66.7% |
| Medium | 17 | 11 | 64.7% |
| Hard | 5 | 3 | 60.0% |

### ❌ VERDICT: BELOW TARGET (64.0%). Review failing topics and add targeted fixes.

### 1. ✅ Wave Optics (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 10115ms |
| **Expected Trap** | Single slit vs circular aperture formula confusion |

> **Question**: In a double slit experiment, the distance between the slits is 0.02 m and the distance between the slits and the screen is 1.2 m. If the wavelength of the light used is 600 nm, what is the fringe width?

> **Answer**: The fringe width is 36 mm

> **Formula**: `Double slit fringe width: β = λD/d`

> **Steps**:
> 1. Step 1: Convert λ from nm to m, λ = 600 nm = 600 × 10^(-9) m
> 2. Step 2: Substitute the given values into the formula β = λD/d
> 3. Step 3: Calculate β = (600 × 10^(-9) m) × (1.2 m) / (0.02 m) = 0.036 m
> 4. Step 4: Convert β to mm for better understanding, β = 0.036 m × (1000 mm/m) = 36 mm

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 2. ✅ Atoms (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 4884ms |
| **Expected Trap** | Bohr model E = -13.6/n² (NOT /n) |

> **Question**: What is the energy of an electron in the second energy level (n=2) of a hydrogen atom?

> **Answer**: The energy is -3.4 eV

> **Formula**: `E_n = -13.6 Z²/n² eV`

> **Steps**:
> 1. Step 1: Identify the given values, Z = 1 (for hydrogen atom) and n = 2 (the energy level we are calculating for).
> 2. Step 2: Substitute these values into the formula for energy E_n = -13.6 Z²/n² eV.
> 3. Step 3: Calculate E_2 = -13.6 * (1)² / (2)² = -13.6 * 1 / 4 = -3.4 eV.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 3. ✅ Kinetic Theory (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 3093ms |
| **Expected Trap** | KE proportional to T (NOT T²) |

> **Question**: What is the kinetic energy per molecule of an ideal gas at a temperature of 300 K?

> **Answer**: 6.21 × 10⁻²¹ J

> **Formula**: `KE per molecule = (3/2)kT`

> **Steps**:
> 1. Step 1: Identify the formula for kinetic energy per molecule: KE = (3/2)kT
> 2. Step 2: Plug in the given values for temperature (T) and Boltzmann constant (k): KE = (3/2) × 1.38 × 10⁻²³ J/K × 300 K
> 3. Step 3: Perform the calculation: KE = (3/2) × 1.38 × 10⁻²³ × 300 = 6.21 × 10⁻²¹ J

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 4. ✅ Nuclei (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 3775ms |
| **Expected Trap** | β decay mass number unchanged |

> **Question**: What is the binding energy of a nucleus with 20 protons and 30 neutrons, given the atomic mass of the nucleus as 49.9381 amu and the masses of a proton and a neutron as 1.007276 amu and 1.008665 amu respectively?

> **Answer**: The binding energy is 435.11 MeV

> **Formula**: `Binding energy: B = [Z×m_p + N×m_n - M_nucleus] × 931.5 MeV`

> **Steps**:
> 1. Step 1: Calculate the total mass of protons and neutrons, m_total = Z*m_p + N*m_n
> 2. Step 2: Substitute the given values into the equation, m_total = 20*1.007276 + 30*1.008665 = 20.1452 + 30.25995 = 50.40515 amu
> 3. Step 3: Calculate the binding energy using the formula, B = [Z×m_p + N×m_n - M_nucleus] × 931.5 MeV
> 4. Step 4: Substitute the values into the binding energy formula, B = [50.40515 - 49.9381] × 931.5 MeV
> 5. Step 5: Calculate the binding energy, B = 0.46705 × 931.5 = 435.11 MeV

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 5. ✅ Electrostatics (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Hard |
| **Time** | 11184ms |
| **Expected Trap** | E between plates = σ/ε₀ not σ/2ε₀ |

> **Question**: What is the capacitance of a parallel plate capacitor with a plate area of 0.05 m² and a separation of 0.1 m?

> **Answer**: 4.425 × 10⁻¹² F

> **Formula**: `C = ε₀A/d`

> **Steps**:
> 1. Step 1: Identify the formula for capacitance of a parallel plate capacitor, which is C = ε₀A/d.
> 2. Step 2: Plug in the given values into the formula: C = (8.85 × 10⁻¹² F/m) × (0.05 m²) / (0.1 m).
> 3. Step 3: Perform the calculation: C = (8.85 × 10⁻¹² F/m) × 0.5 = 4.425 × 10⁻¹² F.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 6. ✅ Thermodynamics (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Easy |
| **Time** | 3415ms |
| **Expected Trap** | Carnot temp in Kelvin not Celsius |

> **Question**: A gas expands isobarically, doing work. If 2 moles of gas expand by 20 K, how much work is done if the gas constant R is 8.314 J/mol·K?

> **Answer**: W = 2 * 8.314 * 20 = 333.04 J

> **Formula**: `W = nRΔT`

> **Steps**:
> 1. Step 1: Identify the given values: n = 2 moles, R = 8.314 J/mol·K, ΔT = 20 K
> 2. Step 2: Plug the given values into the formula W = nRΔT
> 3. Step 3: Calculate the work done: W = 2 moles * 8.314 J/mol·K * 20 K = 333.04 J

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 7. ✅ Current Electricity (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Hard |
| **Time** | 2881ms |
| **Expected Trap** | V = E - Ir sign convention |

> **Question**: A resistor of 5 Ω is connected to a battery and draws a current of 2 A. What is the power dissipated by the resistor?

> **Answer**: The power dissipated is 20 W

> **Formula**: `Power: P = I²R`

> **Steps**:
> 1. Step 1: Identify the given values and the formula to use. We have I = 2 A and R = 5 Ω, and we will use P = I²R to find the power.
> 2. Step 2: Substitute the given values into the formula. P = (2 A)² * 5 Ω
> 3. Step 3: Calculate the power. P = 4 A² * 5 Ω = 20 W

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 8. ✅ Circular Motion (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 3473ms |
| **Expected Trap** | Centripetal force is not a separate force |

> **Question**: A car of mass 2 kg is moving in a circular path of radius 2 m with a velocity of 4 m/s. What is the magnitude of the centripetal force acting on the car?

> **Answer**: The centripetal force is 16 N, directed towards the center.

> **Formula**: `Centripetal force: F_c = mv²/r`

> **Steps**:
> 1. Step 1: Identify the formula for centripetal force, which is F_c = mv²/r.
> 2. Step 2: Plug in the given values into the formula: F_c = 2 kg * (4 m/s)² / 2 m.
> 3. Step 3: Perform the calculations: F_c = 2 * 16 / 2 = 16 N.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 9. ❌ Gravitation (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: GPE is negative

---

### 10. ❌ Oscillations (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Period independent of mass for pendulum

---

### 11. ✅ Redox Reactions (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 10635ms |
| **Expected Trap** | Cr₂O₇²⁻ has TWO Cr atoms = 6e⁻ total |

> **Question**: What is the n-factor for the reduction of Cr₂O₇²⁻ to Cr³⁺ in the reaction Cr₂O₇²⁻ → Cr³⁺?

> **Answer**: The n-factor is 6 because each Cr atom changes its oxidation state by 3 and there are 2 Cr atoms

> **Formula**: `n-factor (redox) = |change in oxidation state per atom| × number of atoms`

> **Steps**:
> 1. Step 1: Identify the oxidation state change for Cr in Cr₂O₇²⁻ → Cr³⁺
> 2. Step 2: Calculate the change in oxidation state per Cr atom: +6 (in Cr₂O₇²⁻) to +3 (in Cr³⁺) = 3 electrons per Cr atom
> 3. Step 3: Determine the number of Cr atoms in the formula unit of Cr₂O₇²⁻, which is 2
> 4. Step 4: Calculate the total electrons transferred per formula unit: 2 × 3 = 6 electrons
> 5. Step 5: Use the formula n-factor (redox) = |change in oxidation state per atom| × number of atoms to find the n-factor for Cr₂O₇²⁻, which is 6

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 12. ❌ Chemical Kinetics (Chemistry)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: First order t½ independent of concentration

---

### 13. ✅ Equilibrium (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 7383ms |
| **Expected Trap** | pH is dimensionless |

> **Question**: What is the pH of a buffer solution with a pKa of 4.76, [A⁻] = 0.1 M, and [HA] = 0.01 M?

> **Answer**: pH = 4.76 + log(0.1/0.01)

> **Formula**: `Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA])`

> **Steps**:
> 1. Step 1: Identify the given values: pKa = 4.76, [A⁻] = 0.1 M, [HA] = 0.01 M
> 2. Step 2: Substitute the given values into the Henderson-Hasselbalch equation: pH = 4.76 + log(0.1/0.01)
> 3. Step 3: Calculate the logarithm: log(0.1/0.01) = log(10) = 1
> 4. Step 4: Calculate the pH: pH = 4.76 + 1 = 5.76

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 14. ❌ Electrochemistry (Chemistry)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: E°_cell = E°_cathode - E°_anode

---

### 15. ✅ Hydrogen (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Easy |
| **Time** | 7807ms |
| **Expected Trap** | 2Na → 1H₂ stoichiometry |

> **Question**: What is the volume of hydrogen gas produced at STP when 4 moles of sodium react with water?

> **Answer**: 44.8 L of hydrogen gas is produced at STP

> **Formula**: `Moles of H₂ = moles of Na / 2`

> **Steps**:
> 1. Step 1: Calculate moles of H₂ using the formula: Moles of H₂ = moles of Na / 2
> 2. Step 2: Substitute the given value: Moles of H₂ = 4 mol / 2 = 2 mol
> 3. Step 3: Calculate the volume of H₂ at STP using the formula: V = n × 22.4 L, where n is the number of moles
> 4. Step 4: Substitute the value of n: V = 2 mol × 22.4 L/mol = 44.8 L

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 16. ✅ Solid State (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 8152ms |
| **Expected Trap** | FCC has 4 atoms per unit cell |

> **Question**: The edge length of the unit cell of sodium chloride is 5.63 × 10^-8 cm. The density of sodium chloride is

> **Answer**: 2.17 g/cm³

> **Formula**: `Density: ρ = (Z × M)/(a³ × Nₐ)`

> **Steps**:
> 1. Step 1: Using the formula ρ = (Z × M)/(a³ × Nₐ), identify the given values: Z = 4, M = 58.44 g/mol, a = 5.63 × 10^-8 cm, Nₐ = 6.022 × 10^23.
> 2. Step 2: Plug in the given values into the formula: ρ = (4 × 58.44)/( (5.63 × 10^-8)^3 × 6.022 × 10^23 ).
> 3. Step 3: Calculate the value of a^3: (5.63 × 10^-8)^3 = 1.788 × 10^-22 cm³.
> 4. Step 4: Substitute a^3 back into the equation: ρ = (4 × 58.44)/(1.788 × 10^-22 × 6.022 × 10^23).
> 5. Step 5: Perform the multiplication in the denominator: 1.788 × 10^-22 × 6.022 × 10^23 = 1.077 × 10^2 cm³/mol.
> 6. Step 6: Calculate the numerator: 4 × 58.44 = 233.76 g.
> 7. Step 7: Divide to find the density: ρ = 233.76 / (1.077 × 10^2) = 2.17 g/cm³.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 17. ❌ Solutions (Chemistry)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Van't Hoff factor for electrolytes

---

### 18. ✅ Probability (Mathematics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 3310ms |
| **Expected Trap** | Geometric: P(X>k) = (1-p)^k |

> **Question**: Two events A and B have probabilities P(A) = 0.4 and P(B) = 0.3. If the probability of both events occurring is P(A ∩ B) = 0.1, what is the probability of either event A or event B occurring?

> **Answer**: 0.4 + 0.3 - 0.1 = 0.6

> **Formula**: `P(A ∪ B) = P(A) + P(B) - P(A ∩ B)`

> **Steps**:
> 1. Step 1: Identify the given probabilities P(A), P(B), and P(A ∩ B).
> 2. Step 2: Apply the formula P(A ∪ B) = P(A) + P(B) - P(A ∩ B).
> 3. Step 3: Substitute the given values into the formula: P(A ∪ B) = 0.4 + 0.3 - 0.1.
> 4. Step 4: Calculate the result: P(A ∪ B) = 0.7 - 0.1 = 0.6.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 19. ✅ Statistics (Mathematics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 10395ms |
| **Expected Trap** | E(X) = Σ xᵢP(xᵢ) step by step |

> **Question**: A random variable X has possible values 1, 2, and 3 with corresponding probabilities 0.2, 0.5, and 0.3. What is the expected value E(X)?

> **Answer**: E(X) = 1*0.2 + 2*0.5 + 3*0.3 = 2.1

> **Formula**: `Expected value: E(X) = Σ xᵢ × P(xᵢ)`

> **Steps**:
> 1. Step 1: Identify each value xᵢ and its probability P(xᵢ): (1, 0.2), (2, 0.5), (3, 0.3)
> 2. Step 2: Compute each product xᵢ × P(xᵢ): 1*0.2 = 0.2, 2*0.5 = 1, 3*0.3 = 0.9
> 3. Step 3: Sum all products to find E(X): 0.2 + 1 + 0.9 = 2.1

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 20. ❌ Conic Sections (Mathematics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Eccentricity is DIMENSIONLESS

---

### 21. ✅ Vector Algebra (Mathematics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Hard |
| **Time** | 5966ms |
| **Expected Trap** | Cross product anti-commutative |

> **Question**: If vectors a = 2i + 3j + 4k and b = i - 2j + k, then the area of the triangle formed by these vectors is

> **Answer**: √(174)/2

> **Formula**: `Area of triangle = (1/2)|a×b|`

> **Steps**:
> 1. Step 1: Find the cross product a×b using the determinant formula.
> 2. Step 2: a×b = |i  j  k; 2 3 4; 1 -2 1| = i(3 + 8) - j(2 - 4) + k(-4 - 3) = 11i + 2j - 7k
> 3. Step 3: Calculate the magnitude of the cross product |a×b| = √(11² + 2² + (-7)²) = √(121 + 4 + 49) = √174
> 4. Step 4: Apply the formula for the area of a triangle: Area = (1/2)|a×b| = (1/2)√174

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 22. ❌ Complex Numbers (Mathematics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: i² = -1 cycle

---

### 23. ❌ Integrals (Mathematics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Integration by parts ILATE rule

---

### 24. ✅ Evolution (Biology)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 1.00 |
| **Difficulty** | Medium |
| **Time** | 615ms |
| **Expected Trap** | Must contain specific biology terms |

> **Question**: Practice Question: Which of the following best describes the core concept of Evolution?

> **Answer**: A fundamental principle of Biology.

> **Formula**: `N/A`

---

### 25. ❌ Human Health (Biology)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Must reference specific diseases/pathogens

---

