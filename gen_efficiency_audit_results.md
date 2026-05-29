# Phase 5: Generator Efficiency Audit Results

**Goal**: Maximize correct questions on the first pass (70B Gen + 70B Auditor).

### Topic: Current Electricity (Induced EMF (B-field check))
**Status**: ✅ APPROVED (First Pass SUCCESS)

> **Question**: A cell of emf 15 V has an internal resistance of 3 Ω. It is connected to an external resistor of 5 Ω. What is the terminal voltage across the external resistor?

> **Ans**: Terminal voltage = 9.375 V

> **Hidden Derivation**: Given: EMF E = 15 V, internal resistance r = 3 Ω, external resistance R = 5 Ω. Total resistance in the circuit = R + r = 5 Ω + 3 Ω = 8 Ω. Current flowing in the circuit I = E / (R + r) = 15 V / 8 Ω = 1.875 A. Terminal voltage across the external resistor V = I × R = 1.875 A × 5 Ω = 9.375 V. Distractor 1 (wrong substitution): used V = E - I·R → V = 15 - (1.875 × 5) = 5.625 V. Distractor 2 (ignored internal resistance): assumed V = E → V = 15 V. Distractor 3 (wrong current): computed I' = E / R = 15 / 5 = 3 A, then took V' = I' × r = 3 × 3 = 9 V.

--- 

### Topic: Hydrogen (Stoichiometry (H2+O2))
**Status**: ✅ APPROVED (First Pass SUCCESS)

> **Question**: A sample of 5.0 g of sodium metal is placed in excess water at 25°C and 1 atm pressure. Assuming the reaction goes to completion, what volume of hydrogen gas (H₂) will be collected at standard temperature and pressure (STP, 0°C and 1 atm)?

> **Ans**: 2.43 L of hydrogen gas

> **Hidden Derivation**: Given mass of Na = 5.0 g and molar mass M(Na) = 23.0 g·mol⁻¹. Moles of Na = 5.0 ÷ 23.0 = 0.2174 mol. Reaction: 2 Na → 1 H₂, so moles of H₂ = 0.2174 ÷ 2 = 0.1087 mol. At STP, V = n × 22.4 L = 0.1087 × 22.4 = 2.43 L. Distractor 1 (ratio error): assumed 1:1, moles H₂ = 0.2174 → V = 0.2174 × 22.4 = 4.87 L. Distractor 2 (wrong molar mass): used M(Na)=22.0 g·mol⁻¹, moles Na = 5.0 ÷ 22.0 = 0.2273 mol, H₂ moles = 0.2273 ÷ 2 = 0.1136 mol, V = 0.1136 × 22.4 = 2.55 L. Distractor 3 (wrong gas volume): used 24 L·mol⁻¹, V = 0.1087 × 24 = 2.61 L.

--- 

### Topic: Statistics (Expectation Sum Check)
**Status**: ✅ APPROVED (First Pass SUCCESS)

> **Question**: A manufacturing unit classifies its daily output based on the number of defects per item. The probability that an item has 0 defects is 0.5, the probability of exactly 1 defect is 0.3, and the probability of exactly 2 defects is 0.2. Assuming these are the only possibilities, what is the expected (average) number of defects per item?

> **Ans**: 0.7 defects per item

> **Hidden Derivation**: Given probabilities: P(0 defects)=0.5, P(1 defect)=0.3, P(2 defects)=0.2. Step 1: Compute each product x\u0305P(x): 0\u00d70.5=0, 1\u00d70.3=0.3, 2\u00d70.2=0.4. Step 2: Sum the products: 0+0.3+0.4=0.7. Hence the expected number of defects per item is 0.7.

--- 

### Topic: Biomolecules
**Status**: ❌ REJECTED (Waste Created)

--- 

### Topic: Chemical Kinetics (Reaction Order requirement)
**Status**: ✅ APPROVED (First Pass SUCCESS)

> **Question**: A certain reaction is studied at two different initial concentrations of the reactant A. In experiment 1, [A]₀ = 0.10 M and the measured half‑life is 40 s. In experiment 2, [A]₀ = 0.20 M and the measured half‑life is also 40 s. Assuming the reaction follows a simple rate law, determine the rate constant k of the reaction.

> **Ans**: 1.73 × 10⁻² s⁻¹

> **Hidden Derivation**: The half‑life is reported as 40 s for two experiments with different initial concentrations: [A]₀₁ = 0.10 M and [A]₀₂ = 0.20 M. Because t½ does not change with [A]₀, the reaction follows first‑order kinetics (first‑order half‑life is independent of concentration). For a first‑order reaction the relation is t½ = 0.693/k. Rearranging gives k = 0.693 / t½. Substituting t½ = 40 s: k = 0.693 ÷ 40 = 0.017325 s⁻¹. Rounding to three significant figures yields k = 1.73 × 10⁻² s⁻¹.

--- 

### Topic: Bohr Model
**Status**: ❌ REJECTED (Waste Created)

--- 

### Topic: 3D Geometry
**Status**: ❌ REJECTED (Waste Created)

--- 

### Topic: Wave Optics (Diffraction/Interference)
**Status**: ✅ APPROVED (First Pass SUCCESS)

> **Question**: A monochromatic light of wavelength 600 nm falls on a double‑slit apparatus. The separation between the slits is 0.30 mm and the screen is placed 2.0 m behind the slits. What is the distance between two consecutive bright fringes on the screen?

> **Ans**: Fringe spacing = 4.0 mm

> **Hidden Derivation**: Given wavelength λ = 600 nm = 600 × 10^{-9} m = 6.0 × 10^{-7} m. Slit separation d = 0.30 mm = 0.30 × 10^{-3} m = 3.0 × 10^{-4} m. Screen distance D = 2.0 m. Formula for fringe spacing: β = λ D / d. Substituting: β = (6.0 × 10^{-7} × 2.0) / (3.0 × 10^{-4}) = (1.2 × 10^{-6}) / (3.0 × 10^{-4}) = (1.2 / 3.0) × 10^{-6+4} = 0.4 × 10^{-2} m = 4.0 × 10^{-3} m = 4.0 mm. Distractor 1 (forgot D): β₁ = λ / d = (6.0 × 10^{-7}) / (3.0 × 10^{-4}) = 2.0 × 10^{-3} m = 2.0 mm. Distractor 2 (used 2λ): β₂ = 2λ D / d = 2 × (6.0 × 10^{-7} × 2.0) / (3.0 × 10^{-4}) = 8.0 mm. Distractor 3 (wrong unit for d): β₃ = λ D / 0.30 = (6.0 × 10^{-7} × 2.0) / 0.30 = 4.0 × 10^{-6} m = 4.0 µm.

--- 

## Final Stats
- **Approved**: 9
- **Rejected**: 1
- **First-Pass Efficiency**: 90%
### Topic: Thermodynamics
**Status**: ❌ REJECTED (Waste Created)

--- 

### Topic: Electrostatics
**Status**: ❌ REJECTED (Waste Created)

--- 

### Topic: Current Electricity (Induced EMF (B-field check))
**Status**: ✅ APPROVED (First Pass SUCCESS)

> **Question**: An I‑V graph for an unknown resistor shows two data points: at a potential difference of 2 V the current reading is 400 mA, and at 5 V the current is 1000 mA. Assuming the resistor obeys Ohm’s law (i.e., the graph is a straight line through the origin), calculate the resistance of the resistor.

> **Ans**: The resistance of the resistor is 5 Ω.

> **Hidden Derivation**: Given data points from the I‑V graph: V1 = 2 V, I1 = 400 mA; V2 = 5 V, I2 = 1000 mA. Step 1: Convert currents from milliamperes to amperes. I1 = 400 mA = 400 × 10^{-3} A = 0.4 A. I2 = 1000 mA = 1000 × 10^{-3} A = 1.0 A. Step 2: Since the resistor is ohmic, resistance R is constant and can be found from any point: R = V2 / I2 = 5 V / 1.0 A = 5 Ω. (Alternatively, using the slope ΔV/ΔI = (5−2) V / (1.0−0.4) A = 3 V / 0.6 A = 5 Ω.) The correct resistance is 5 Ω. A common trap is to use the current in mA directly, giving R = 5 V / 1000 mA = 0.005 Ω, which is incorrect because the units are mismatched.

--- 

### Topic: Biomolecules (DNA Base Pairing facts)
**Status**: ✅ APPROVED (First Pass SUCCESS)

> **Question**: A 2.0 g sample of a carbohydrate with molecular formula C6H12O6 is only 75% pure, the rest being inert material. Calculate the number of moles of carbon atoms present in the pure carbohydrate portion.

> **Ans**: 0.050 mol

> **Hidden Derivation**: Given total sample mass = 2.0 g and purity = 75% → mass of pure carbohydrate = 2.0 × 0.75 = 1.5 g. Molar mass of C6H12O6 = 180 g·mol⁻¹ → moles of glucose = 1.5 / 180 = 0.00833 mol. Each mole of glucose contains 6 mol of carbon atoms → moles of C atoms = 0.00833 × 6 = 0.0500 mol. Distractor 1 (forgot purity): moles of glucose = 2.0 / 180 = 0.01111 mol → C moles = 0.01111 × 6 = 0.0667 mol. Distractor 2 (forgot factor 6): moles of C atoms = moles of glucose = 0.00833 mol. Distractor 3 (treated 75% as 75): pure mass = 2.0 × 75 = 150 g → moles glucose = 150 / 180 = 0.8333 mol → C moles = 0.8333 × 6 = 5.00 mol.

--- 

### Topic: Wave Optics (Diffraction/Interference)
**Status**: ✅ APPROVED (First Pass SUCCESS)

> **Question**: A double‑slit experiment uses monochromatic light of wavelength 600 nm. The slit separation is 0.30 mm and the screen is placed 2.0 m from the slits. What is the linear distance on the screen between the 3rd and 5th bright interference fringes?

> **Ans**: The separation equals 8.0 mm

> **Hidden Derivation**: Given λ = 600 nm = 6.0×10^{-7} m, d = 0.30 mm = 3.0×10^{-4} m, D = 2.0 m. Fringe width β = λD/d = (6.0×10^{-7} × 2.0) / (3.0×10^{-4}) = 1.2×10^{-6} / 3.0×10^{-4} = 4.0×10^{-3} m = 4.0 mm. Required separation between 3rd (n=3) and 5th (n=5) bright fringes: Δn = 5−3 = 2, so distance = Δn × β = 2 × 4.0 mm = 8.0 mm. Distractor 1 (option 2) omitted Δn factor → 4.0 mm. Distractor 2 (option 3) used D = 2.0 cm = 0.02 m → β = (6.0×10^{-7} × 0.02) / 3.0×10^{-4} = 4.0×10^{-5} m = 0.04 mm, distance = 2 × 0.04 mm = 0.08 mm. Distractor 3 (option 4) mis‑converted λ to micrometres (λ = 6.0×10^{-4} m) → β = (6.0×10^{-4} × 2.0) / 3.0×10^{-4} = 4.0 m, distance = 2 × 4.0 m = 8.0 m.

--- 

## Final Stats
- **Approved**: 6
- **Rejected**: 4
- **First-Pass Efficiency**: 60%
