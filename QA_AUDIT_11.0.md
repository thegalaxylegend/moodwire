# QA AUDIT 11.0 — Question Engine v3.1

**Generated on**: 31/3/2026, 10:50:33 am

**Engine Version**: v3.1 (Dead-key culling + Mantissa consistency + Cache validation + Prompt quality rules)

---


## Executive Summary

| Metric | Value |
|---|---|
| **Total Questions** | 25 |
| **Approved** | 19 (76.0%) |
| **Rejected** | 6 |
| **Errors** | 0 |
| **High Confidence (≥0.85)** | 19 |
| **Avg Confidence** | 0.95 |
| **Avg Generation Time** | 9.0s |

### Per-Subject Breakdown

| Subject | Total | Approved | Rate |
|---|---|---|---|
| Physics | 10 | 7 | 70.0% |
| Chemistry | 7 | 7 | 100.0% |
| Mathematics | 6 | 3 | 50.0% |
| Biology | 2 | 2 | 100.0% |

### Per-Difficulty Breakdown

| Difficulty | Total | Approved | Rate |
|---|---|---|---|
| Easy | 3 | 2 | 66.7% |
| Medium | 17 | 14 | 82.4% |
| Hard | 5 | 3 | 60.0% |

### ❌ VERDICT: BELOW TARGET (76.0%). Review failing topics and add targeted fixes.

### 1. ✅ Wave Optics (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 4076ms |
| **Expected Trap** | Single slit vs circular aperture formula confusion |

> **Question**: In a double slit experiment, the wavelength of light used is 500 nm, the distance between the slits is 0.1 mm, and the screen is placed at a distance of 1 m from the slits. What is the width of the central fringe?

> **Answer**: The fringe width is 5 mm

> **Formula**: `Double slit fringe width: β = λD/d`

> **Steps**:
> 1. Step 1: Convert given values to the same unit, λ = 500 nm = 500 × 10^-9 m, D = 1 m, d = 0.1 mm = 0.1 × 10^-3 m
> 2. Step 2: Substitute the given values into the formula β = λD/d
> 3. Step 3: Calculate β = (500 × 10^-9 m) × 1 m / (0.1 × 10^-3 m) = 500 × 10^-6 m / 0.1 × 10^-3 = 5000 × 10^-6 m = 5 × 10^-3 m

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 2. ❌ Atoms (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Bohr model E = -13.6/n² (NOT /n)

---

### 3. ✅ Kinetic Theory (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 3155ms |
| **Expected Trap** | KE proportional to T (NOT T²) |

> **Question**: What is the kinetic energy of a molecule at a temperature of 300 K, given the Boltzmann constant is 1.38 × 10⁻²³ J/K?

> **Answer**: The kinetic energy is 6.21 × 10⁻²¹ J

> **Formula**: `KE per molecule = (3/2)kT`

> **Steps**:
> 1. Step 1: Identify the formula for kinetic energy per molecule: KE = (3/2)kT
> 2. Step 2: Plug in the given values: KE = (3/2) × 1.38 × 10⁻²³ J/K × 300 K
> 3. Step 3: Perform the calculation: KE = (3/2) × 1.38 × 10⁻²³ × 300 = 6.21 × 10⁻²¹ J

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 4. ✅ Nuclei (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 8549ms |
| **Expected Trap** | β decay mass number unchanged |

> **Question**: The binding energy of a nucleus with 20 protons and 20 neutrons, given the mass of a proton as 1.007276 amu, the mass of a neutron as 1.008665 amu, and the mass of the nucleus as 39.962591 amu, can be calculated using the binding energy formula. What is the binding energy of this nucleus in MeV?

> **Answer**: The binding energy of the nucleus is approximately 65.32 MeV

> **Formula**: `Binding energy: B = [Z×m_p + N×m_n - M_nucleus] × 931.5 MeV`

> **Steps**:
> 1. Step 1: Calculate the total mass of the protons and neutrons in the nucleus using the given values.
> 2. Step 2: Substitute the given values into the formula: B = [(20 × 1.007276) + (20 × 1.008665) - 39.962591] × 931.5 MeV
> 3. Step 3: Perform the calculation: B = [(20.01552) + (20.0173) - 39.962591] × 931.5 MeV
> 4. Step 4: Simplify the calculation: B = [40.03282 - 39.962591] × 931.5 MeV
> 5. Step 5: Further simplify the calculation: B = 0.070229 × 931.5 MeV
> 6. Step 6: Calculate the binding energy: B = 65.3215355 MeV

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 5. ✅ Electrostatics (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Hard |
| **Time** | 3867ms |
| **Expected Trap** | E between plates = σ/ε₀ not σ/2ε₀ |

> **Question**: A parallel plate capacitor has plates of area 0.05 m² separated by a distance of 0.01 m. What is the capacitance of this capacitor?

> **Answer**: The capacitance is approximately 44.25 pF

> **Formula**: `Capacitance (parallel plate): C = ε₀A/d`

> **Steps**:
> 1. Step 1: Identify the formula for capacitance of a parallel plate capacitor, which is C = ε₀A/d.
> 2. Step 2: Plug in the given values into the formula: C = (8.85 × 10⁻¹² F/m) * (0.05 m²) / (0.01 m).
> 3. Step 3: Perform the calculation: C = (8.85 × 10⁻¹²) * (0.05) / (0.01) = 4.425 × 10⁻¹¹ F.
> 4. Step 4: Convert the result to a more common unit for capacitance, such as picofarads (pF), where 1 pF = 10⁻¹² F. Thus, C ≈ 4.425 × 10⁻¹¹ / (10⁻¹²) = 44.25 pF.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 6. ❌ Thermodynamics (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: Carnot temp in Kelvin not Celsius

---

### 7. ✅ Current Electricity (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Hard |
| **Time** | 2561ms |
| **Expected Trap** | V = E - Ir sign convention |

> **Question**: A resistor of 5 Ω is connected to a 10 V battery. What is the power dissipated by the resistor?

> **Answer**: The power dissipated is 20 W

> **Formula**: `Power: P = VI = I²R = V²/R`

> **Steps**:
> 1. Step 1: Using formula P = V²/R
> 2. Step 2: Substituting values: P = (10 V)² / (5 Ω) = 100 / 5 = 20 W
> 3. Step 3: Therefore P = 20 W

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 8. ✅ Circular Motion (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 2951ms |
| **Expected Trap** | Centripetal force is not a separate force |

> **Question**: A 2 kg object is moving in a circular path of radius 4 m with an angular velocity of 1.5 rad/s. What is the centripetal force acting on the object?

> **Answer**: The centripetal force is 18 N

> **Formula**: `Centripetal force: F_c = mv²/r = mω²r and v = rω`

> **Steps**:
> 1. Step 1: Calculate velocity using v = rω
> 2. Step 2: Substitute given values into v = rω: v = 4 m * 1.5 rad/s = 6 m/s
> 3. Step 3: Now calculate centripetal force using F_c = mv²/r
> 4. Step 4: Substitute given values into F_c = mv²/r: F_c = 2 kg * (6 m/s)² / 4 m = 2 * 36 / 4 = 18 N

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 9. ❌ Gravitation (Physics)

**Status**: REJECTED (all validation layers failed after max retries)

**Expected Trap**: GPE is negative

---

### 10. ✅ Oscillations (Physics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 20161ms |
| **Expected Trap** | Period independent of mass for pendulum |

> **Question**: A simple pendulum has a length of 1.0 meter. What is the time period of the pendulum, given that the acceleration due to gravity is 9.8 m/s²?

> **Answer**: The time period of the pendulum is 2.0 s

> **Formula**: `T = 2π√(L/g)`

> **Steps**:
> 1. Step 1: Identify the given values and the formula for the time period of a simple pendulum.
> 2. Step 2: Plug in the given values into the formula: T = 2π√(1.0/9.8) = 2π√0.102.
> 3. Step 3: Calculate the square root: √0.102 ≈ 0.319.
> 4. Step 4: Multiply by 2π: T ≈ 2 * 3.14159 * 0.319.
> 5. Step 5: Calculate the final value: T ≈ 2.0 s

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 11. ✅ Redox Reactions (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 10058ms |
| **Expected Trap** | Cr₂O₇²⁻ has TWO Cr atoms = 6e⁻ total |

> **Question**: What is the n-factor for the reduction of Cr₂O₇²⁻ to Cr³⁺ in the reaction Cr₂O₇²⁻ → Cr³⁺, given that each Cr atom changes its oxidation state from +6 to +3?

> **Answer**: The n-factor for the reduction of Cr₂O₇²⁻ to Cr³⁺ is 6

> **Formula**: `n-factor (redox) = |change in oxidation state per atom| × number of atoms`

> **Steps**:
> 1. Step 1: Determine the change in oxidation state per atom for Cr₂O₇²⁻ → Cr³⁺, which is 6 to 3 = 3 electrons per Cr atom.
> 2. Step 2: Calculate the total electrons transferred per formula unit by multiplying the change in oxidation state per atom by the number of atoms: 3 electrons/Cr × 2 Cr = 6 electrons.
> 3. Step 3: Apply the formula for n-factor of Cr₂O₇²⁻: n-factor = |change in oxidation state per atom| × number of atoms = 3 × 2 = 6.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 12. ✅ Chemical Kinetics (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 2953ms |
| **Expected Trap** | First order t½ independent of concentration |

> **Question**: The rate constant for a first-order reaction is 0.02 min^-1. What is the half-life of this reaction?

> **Answer**: The half-life of the reaction is 35 minutes

> **Formula**: `For first order decay: t½ = 0.693/k`

> **Steps**:
> 1. Step 1: Identify the given values and the formula for the half-life of a first-order reaction.
> 2. Step 2: Plug in the given rate constant (k = 0.02 min^-1) into the formula t½ = 0.693/k.
> 3. Step 3: Calculate the half-life using the given rate constant: t½ = 0.693 / 0.02 = 34.65 min.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 13. ✅ Equilibrium (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 3398ms |
| **Expected Trap** | pH is dimensionless |

> **Question**: For the reaction A + B ⇌ C + D, the equilibrium constant Kc is given as 4. If the concentrations of C and D are 2 each, and the concentrations of A and B are 1 each, what can be said about the equilibrium constant expression for this reaction?

> **Answer**: The equilibrium constant expression is valid and correctly represents the reaction

> **Formula**: `Kc = [C]^c[D]^d / ([A]^a[B]^b) at equilibrium`

> **Steps**:
> 1. Step 1: Write down the given values: Kc = 4, [C] = 2, [D] = 2, [A] = 1, [B] = 1
> 2. Step 2: Plug the values into the Kc formula: Kc = (2)^1(2)^1 / (1)^1(1)^1
> 3. Step 3: Simplify the equation: Kc = (2*2) / (1*1) = 4
> 4. Step 4: Since the calculated Kc value matches the given Kc value, the equilibrium constant expression is correct

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 14. ✅ Electrochemistry (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Hard |
| **Time** | 6412ms |
| **Expected Trap** | E°_cell = E°_cathode - E°_anode |

> **Question**: For the cell reaction with E°_cell = 1.1 V, n = 2, and Q = 0.01 at 25°C, what is the cell potential?

> **Answer**: The cell potential is 1.1592 V

> **Formula**: `E = E° - (0.0592/n)log(Q) at 25°C`

> **Steps**:
> 1. Step 1: Identify the given values: E°_cell = 1.1 V, n = 2, Q = 0.01
> 2. Step 2: Plug the given values into the Nernst equation: E = 1.1 - (0.0592/2)log(0.01)
> 3. Step 3: Calculate log(0.01) = -2
> 4. Step 4: Substitute log(0.01) into the equation: E = 1.1 - (0.0592/2)(-2)
> 5. Step 5: Simplify the equation: E = 1.1 + (0.0592)(1) = 1.1 + 0.0592
> 6. Step 6: Calculate the value of E: E = 1.1592 V

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 15. ✅ Hydrogen (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Easy |
| **Time** | 2978ms |
| **Expected Trap** | 2Na → 1H₂ stoichiometry |

> **Question**: When 4 moles of sodium react with water, what is the volume of hydrogen gas produced at standard temperature and pressure?

> **Answer**: The volume of hydrogen gas is 44.8 L

> **Formula**: `Moles of H₂ = moles of Na / 2 and Volume at STP: V = n × 22.4 L`

> **Steps**:
> 1. Step 1: Calculate the moles of H₂ produced using the formula: Moles of H₂ = moles of Na / 2
> 2. Step 2: Substituting the given value: Moles of H₂ = 4 mol / 2 = 2 mol
> 3. Step 3: Calculate the volume of H₂ at STP using the formula: V = n × 22.4 L
> 4. Step 4: Substituting the value of n: V = 2 mol × 22.4 L/mol = 44.8 L

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 16. ✅ Solid State (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 7515ms |
| **Expected Trap** | FCC has 4 atoms per unit cell |

> **Question**: The edge length of the unit cell of NaCl is 5.63 × 10^-8 cm. If the molar mass of NaCl is 58.44 g/mol, what is the density of NaCl in g/cm³?

> **Answer**: The density of NaCl is 2.17 g/cm³

> **Formula**: `Density: ρ = (Z × M)/(a³ × Nₐ) where Z = atoms/unit cell, a = edge length`

> **Steps**:
> 1. Step 1: Using the formula ρ = (Z × M)/(a³ × Nₐ), we can calculate the density of the given solid.
> 2. Step 2: Substituting the given values into the formula: ρ = (4 × 58.44)/( (5.63 × 10^-8)³ × 6.022 × 10^23 ).
> 3. Step 3: Calculating the numerator: 4 × 58.44 = 233.76.
> 4. Step 4: Calculating the denominator: (5.63 × 10^-8)³ = 1.788 × 10^-22, then multiplying by Avogadro's number: 1.788 × 10^-22 × 6.022 × 10^23 = 10.77.
> 5. Step 5: Therefore, ρ = 233.76 / 10.77 = 21.7 g/cm³.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 17. ✅ Solutions (Chemistry)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 2881ms |
| **Expected Trap** | Van't Hoff factor for electrolytes |

> **Question**: A solution of a non-volatile solute in water has a boiling point elevation of ΔT_b. If the molality of the solution is 1 mol/kg and the boiling point elevation constant for water is 0.52 K·kg/mol, what is the elevation in boiling point of the solution?

> **Answer**: The elevation in boiling point is 0.52 K

> **Formula**: `Elevation in boiling point: ΔT_b = Kb × m (molality)`

> **Steps**:
> 1. Step 1: Identify the given values and the formula for elevation in boiling point.
> 2. Step 2: Substitute the given values into the formula: ΔT_b = 0.52 K·kg/mol × 1 mol/kg
> 3. Step 3: Calculate the elevation in boiling point: ΔT_b = 0.52 K

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 18. ✅ Probability (Mathematics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 3709ms |
| **Expected Trap** | Geometric: P(X>k) = (1-p)^k |

> **Question**: A coin with a probability of heads p = 0.4 is tossed 5 times. What is the probability of getting exactly 2 heads in these 5 tosses?

> **Answer**: The probability of getting exactly 2 heads is 0.3456

> **Formula**: `P(X = k) = C(n,k) × p^k × (1-p)^(n-k)`

> **Steps**:
> 1. Step 1: Identify the formula for binomial probability, which is P(X = k) = C(n,k) × p^k × (1-p)^(n-k).
> 2. Step 2: Calculate C(n,k) using the combination formula C(n,k) = n! / [k!(n-k)!], where n = 5 and k = 2.
> 3. Step 3: Calculate C(5,2) = 5! / [2!(5-2)!] = 5! / (2! * 3!) = (5*4) / (2*1) = 10.
> 4. Step 4: Substitute the values into the binomial probability formula: P(X = 2) = C(5,2) × (0.4)^2 × (1-0.4)^(5-2).
> 5. Step 5: Perform the calculations: P(X = 2) = 10 × (0.4)^2 × (0.6)^3.
> 6. Step 6: Calculate (0.4)^2 = 0.16 and (0.6)^3 = 0.216.
> 7. Step 7: Substitute these values into the equation: P(X = 2) = 10 × 0.16 × 0.216.
> 8. Step 8: Calculate the final probability: P(X = 2) = 10 × 0.16 × 0.216 = 0.3456.

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 19. ✅ Statistics (Mathematics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 16812ms |
| **Expected Trap** | E(X) = Σ xᵢP(xᵢ) step by step |

> **Question**: A set of exam scores has the following distribution: 10 marks with a frequency of 2, 20 marks with a frequency of 3, and 30 marks with a frequency of 5. What is the mean of these exam scores?

> **Answer**: The mean score is 23 marks

> **Formula**: `Mean (discrete): x̄ = Σxᵢfᵢ / Σfᵢ`

> **Steps**:
> 1. Step 1: Identify the given data and their frequencies
> 2. Step 2: Calculate the sum of products of each data point and its frequency: (10*2) + (20*3) + (30*5) = 20 + 60 + 150 = 230
> 3. Step 3: Calculate the sum of all frequencies: 2 + 3 + 5 = 10
> 4. Step 4: Apply the mean formula: x̄ = Σxᵢfᵢ / Σfᵢ = 230 / 10 = 23

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 20. ✅ Conic Sections (Mathematics)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 5879ms |
| **Expected Trap** | Eccentricity is DIMENSIONLESS |

> **Question**: For an ellipse with semi-major axis length of 5 units and semi-minor axis length of 4 units, what is the eccentricity of the ellipse?

> **Answer**: The eccentricity of the ellipse is approximately 0.6

> **Formula**: `e = √(1 - b²/a²) for ellipse`

> **Steps**:
> 1. Step 1: Identify the formula for eccentricity of an ellipse, which is e = √(1 - b²/a²)
> 2. Step 2: Substitute the given values into the formula: e = √(1 - 4²/5²) = √(1 - 16/25) = √(1 - 0.64) = √0.36
> 3. Step 3: Calculate the square root of 0.36, which equals approximately 0.6

> **Verification**: Verifier matches: true, Consistency: true, Units: true

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

### 24. ✅ Evolution (Biology)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Medium |
| **Time** | 3222ms |
| **Expected Trap** | Must contain specific biology terms |

> **Question**: In a population of rabbits, the frequency of the dominant allele for black fur color is 0.4 and the frequency of the recessive allele for white fur color is 0.6. Is the population in Hardy-Weinberg equilibrium?

> **Answer**: The population is in Hardy-Weinberg equilibrium because p² + 2pq + q² equals 1

> **Formula**: `p² + 2pq + q² = 1, p + q = 1`

> **Steps**:
> 1. Step 1: Using the Hardy-Weinberg equilibrium formula p² + 2pq + q² = 1
> 2. Step 2: Given p = 0.4 and q = 0.6, we substitute these values into the formula
> 3. Step 3: Calculate p²: (0.4)² = 0.16
> 4. Step 4: Calculate 2pq: 2 × 0.4 × 0.6 = 0.48
> 5. Step 5: Calculate q²: (0.6)² = 0.36
> 6. Step 6: Add the results of steps 3, 4, and 5: 0.16 + 0.48 + 0.36 = 1
> 7. Step 7: Verify that p + q = 1: 0.4 + 0.6 = 1
> 8. Step 8: Conclusion: The population is in Hardy-Weinberg equilibrium since p² + 2pq + q² = 1

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

### 25. ✅ Human Health (Biology)

| Field | Value |
|---|---|
| **Status** | APPROVED |
| **Confidence** | 0.95 |
| **Difficulty** | Easy |
| **Time** | 3456ms |
| **Expected Trap** | Must reference specific diseases/pathogens |

> **Question**: A person who has recovered from Tuberculosis, caused by Mycobacterium tuberculosis, will likely have which type of immunity against the disease, considering the pathogen and the nature of the immune response?

> **Answer**: The person will have active immunity against Tuberculosis

> **Formula**: `Active immunity is long-lasting`

> **Steps**:
> 1. Step 1: Understanding the concept of active immunity
> 2. Step 2: Recognizing that active immunity is acquired through infection or vaccination
> 3. Step 3: Applying this understanding to the question context, where the correct statement about immunity should reflect its long-lasting nature

> **Verification**: Verifier matches: true, Consistency: true, Units: true

---

