/**
 * formulaSheets.ts
 * Ground-truth formula database for JEE/NEET topics.
 * Injected into generator prompts to eliminate formula recall errors.
 * 
 * RULES FOR EACH ENTRY:
 * - Use plain text notation (not LaTeX) for LLM consumption
 * - Include common pitfalls / LLM error traps as warnings
 * - List units of the result
 * - Keep formulas NCERT/standard-textbook aligned
 */

const FORMULA_SHEETS: Record<string, string> = {

    // ═══════════════════════════════════════════
    // PHYSICS — CLASS 11
    // ═══════════════════════════════════════════

    'Units and Measurements': `
KEY FORMULAS:
- Dimensional formula: [M^a L^b T^c]
- Percentage error: (Δx/x) × 100
- Absolute error: |measured - true value|
- Relative error: Δx / x
- If Z = A^a × B^b / C^c, then ΔZ/Z = a(ΔA/A) + b(ΔB/B) + c(ΔC/C)

DIMENSIONLESS QUANTITIES (NO UNITS): strain, refractive index, relative density, mole fraction, dielectric constant, relative permittivity, emissivity, poisson's ratio
⚠️ WARNING: Eccentricity, strain, refractive index have NO units. Never assign units like "meter" to these.
RESULT UNITS: Depends on quantity being measured`,

    'Motion in a Straight Line': `
KEY FORMULAS:
- v = u + at
- s = ut + (1/2)at²
- v² = u² + 2as
- s_nth = u + a(2n - 1)/2 (displacement in nth second)
- Average velocity = total displacement / total time
- Average speed = total distance / total time

⚠️ WARNING: Displacement can be negative; distance is always positive.
⚠️ WARNING: For free fall, a = g = 9.8 m/s² (or 10 m/s² for JEE approx). Direction matters: take downward as positive or negative consistently.
RESULT UNITS: m/s (velocity), m/s² (acceleration), m (displacement)`,

    'Motion in a Plane': `
KEY FORMULAS:
- Projectile: Range R = u²sin(2θ)/g
- Max height H = u²sin²(θ)/(2g)
- Time of flight T = 2u sin(θ)/g
- Uniform circular motion: a = v²/r = ω²r (centripetal acceleration)
- v = rω
- Time period T = 2πr/v = 2π/ω

⚠️ WARNING: For max range, θ = 45°. For same range, two angles: θ and (90° - θ).
⚠️ WARNING: Centripetal acceleration direction is toward center, NOT along velocity.
RESULT UNITS: m (range, height), s (time), m/s² (acceleration)`,

    'Laws of Motion': `
KEY FORMULAS:
- F = ma (Newton's second law)
- Friction: f = μN (kinetic), f_max = μ_s × N (static)
- Tension in string connecting masses m1, m2 on table: T = m1 × m2 × g / (m1 + m2)
- Acceleration of Atwood machine: a = (m1 - m2)g / (m1 + m2)
- Banking angle: tan(θ) = v²/(rg) (without friction)
- Pseudo force: F = -ma (in non-inertial frame)

⚠️ WARNING: Static friction ≤ μ_s × N (inequality, not equality, until maximum).
⚠️ WARNING: For connected body problems, always draw free body diagrams.
RESULT UNITS: N (force), m/s² (acceleration), dimensionless (coefficient of friction)`,

    'Work, Energy and Power': `
KEY FORMULAS:
- Work: W = F·d·cos(θ)
- Kinetic Energy: KE = (1/2)mv²
- Potential Energy (gravity): PE = mgh
- Work-Energy theorem: W_net = ΔKE = (1/2)mv² - (1/2)mu²
- Power: P = W/t = F·v
- Spring PE: U = (1/2)kx²
- Elastic collision (1D): v1 = ((m1-m2)/(m1+m2))u1 + (2m2/(m1+m2))u2

⚠️ WARNING: Work can be negative (when force opposes displacement).
⚠️ WARNING: In perfectly inelastic collision, KE is NOT conserved (only momentum is).
RESULT UNITS: J (energy/work), W (power)`,

    'Rotational Motion': `
KEY FORMULAS:
- Torque: τ = r × F = rF sin(θ) = Iα
- Moment of inertia: I = Σmr² (discrete), I = ∫r²dm (continuous)
- KE_rot = (1/2)Iω²
- Angular momentum: L = Iω
- Parallel axis theorem: I = I_cm + Md²
- Rolling without slipping: v = Rω, a = Rα
- KE_rolling = (1/2)mv² + (1/2)Iω² = (1/2)mv²(1 + k²/R²)

Common MOI: Disc = (1/2)MR², Ring = MR², Solid sphere = (2/5)MR², Hollow sphere = (2/3)MR², Rod (center) = (1/12)ML²

⚠️ WARNING: For rolling on incline, acceleration = g sin(θ) / (1 + k²/R²). Solid sphere rolls fastest.
RESULT UNITS: kg·m² (MOI), N·m (torque), rad/s (angular velocity)`,

    'Gravitation': `
KEY FORMULAS:
- F = GMm/r² (universal gravitation)
- g = GM/R² (surface gravity)
- g at height h: g' = g(1 - 2h/R) for h << R, or g' = gR²/(R+h)²
- g at depth d: g' = g(1 - d/R)
- Orbital velocity: v_o = √(GM/r) = √(gR) for surface orbit
- Escape velocity: v_e = √(2GM/R) = √(2gR)
- Kepler's 3rd law: T² ∝ r³, T² = (4π²/GM)r³
- Gravitational PE: U = -GMm/r

⚠️ WARNING: GPE is NEGATIVE (bound state). At infinity, U = 0.
⚠️ WARNING: v_escape = √2 × v_orbital.
RESULT UNITS: m/s (velocity), m/s² (acceleration), J (energy), N (force)`,

    'Mechanical Properties of Solids': `
KEY FORMULAS:
- Stress = F/A (Pa)
- Strain = ΔL/L (dimensionless)
- Young's modulus: Y = Stress/Strain = (F/A)/(ΔL/L) = FL/(AΔL)
- Shear modulus: G = Shear stress / Shear strain
- Bulk modulus: B = -V(ΔP/ΔV)
- Elastic PE per unit volume: u = (1/2) × stress × strain

⚠️ WARNING: Strain is DIMENSIONLESS (ratio). Never assign units to strain.
⚠️ WARNING: Poisson's ratio = lateral strain / longitudinal strain — also dimensionless.
RESULT UNITS: Pa or N/m² (stress, modulus), dimensionless (strain, Poisson's ratio)`,

    'Mechanical Properties of Fluids': `
KEY FORMULAS:
- Pressure at depth: P = P₀ + ρgh
- Pascal's law: pressure transmitted equally in all directions
- Bernoulli's equation: P + (1/2)ρv² + ρgh = constant
- Continuity: A₁v₁ = A₂v₂
- Viscous force (Stokes): F = 6πηrv
- Terminal velocity: v_t = (2r²(ρ_s - ρ_l)g)/(9η)
- Surface tension: T = F/L
- Capillary rise: h = (2T cos θ)/(ρgr)

⚠️ WARNING: Bernoulli's applies to ideal (non-viscous, incompressible) fluids only.
RESULT UNITS: Pa (pressure), m/s (velocity), N/m (surface tension), m (height)`,

    'Thermal Properties of Matter': `
KEY FORMULAS:
- Linear expansion: ΔL = αLΔT, L' = L(1 + αΔT)
- Area expansion: ΔA = 2αAΔT (β = 2α)
- Volume expansion: ΔV = 3αVΔT (γ = 3α)
- Heat: Q = mcΔT (specific heat)
- Heat: Q = mL (latent heat, phase change)
- Newton's law of cooling: dT/dt = -k(T - T_env)
- Thermal conductivity: Q/t = kA(T₁ - T₂)/L
- Stefan-Boltzmann: P = σAT⁴ (radiation)

⚠️ WARNING: During phase change, temperature remains CONSTANT. Q = mL, not mcΔT.
⚠️ WARNING: Q = mcΔT — ensure ΔT is the CHANGE in temperature, not absolute T.
RESULT UNITS: J or kJ (heat), °C or K (temperature), W (power)`,

    'Thermodynamics': `
KEY FORMULAS:
- First Law: ΔU = Q - W (or Q = ΔU + W)
- Work by gas: W = ∫PdV, for isobaric: W = PΔV = nRΔT
- Isothermal: W = nRT ln(V₂/V₁), ΔU = 0
- Adiabatic: Q = 0, PV^γ = const, TV^(γ-1) = const
- Adiabatic work: W = (P₁V₁ - P₂V₂)/(γ - 1) = nCᵥΔT
- Carnot efficiency: η = 1 - T_cold/T_hot (temperatures in Kelvin)
- Cᵥ = f/2 × R, Cₚ = Cᵥ + R, γ = Cₚ/Cᵥ
  (f = degrees of freedom: monoatomic=3, diatomic=5, polyatomic=6)

⚠️ WARNING: For Carnot, temperatures MUST be in Kelvin, not Celsius.
⚠️ WARNING: W is positive when gas EXPANDS. Sign convention must be consistent.
RESULT UNITS: J (work, heat, internal energy), K (temperature), dimensionless (efficiency)`,

    'Kinetic Theory': `
KEY FORMULAS:
- Ideal gas: PV = nRT = NkT (k = R/Nₐ = 1.38 × 10⁻²³ J/K)
- KE per molecule = (3/2)kT
- KE per mole = (3/2)RT
- v_rms = √(3RT/M) = √(3kT/m) where M = molar mass, m = molecular mass
- v_avg = √(8RT/(πM))
- v_mp = √(2RT/M)
- Mean free path: λ = 1/(√2 × π × d² × n)

⚠️ CRITICAL WARNING: KE is proportional to T (first power), NOT T². If T doubles, KE doubles (factor of 2), NOT factor of 4.
⚠️ WARNING: v_rms > v_avg > v_mp always.
RESULT UNITS: J (energy), m/s (velocity), K (temperature)`,

    'Oscillations': `
KEY FORMULAS:
- SHM: x = A sin(ωt + φ), v = Aω cos(ωt + φ), a = -ω²x
- Time period: T = 2π/ω = 2π√(m/k) (spring-mass)
- Simple pendulum: T = 2π√(L/g)
- KE = (1/2)mω²(A² - x²), PE = (1/2)mω²x²
- Total energy: E = (1/2)mω²A² = (1/2)kA²
- Resonance frequency: ω = ω₀ = √(k/m)

⚠️ WARNING: In SHM, max velocity = Aω (at mean position), max acceleration = Aω² (at extreme).
⚠️ WARNING: Period of simple pendulum does NOT depend on mass or amplitude (for small angles).
RESULT UNITS: s (period), Hz (frequency), rad/s (angular frequency), m (displacement)`,

    'Waves': `
KEY FORMULAS:
- v = fλ = ω/k
- Speed of sound in air: v = √(γRT/M) ≈ 330 m/s at 0°C
- String: v = √(T/μ) where μ = mass per unit length
- Doppler effect: f' = f × (v ± v_observer)/(v ∓ v_source)
  (+ when approaching, - when receding, for observer in numerator, source in denominator)
- Beats: f_beat = |f₁ - f₂|
- Standing wave: nodes at x = nλ/2, antinodes at x = (2n+1)λ/4

⚠️ WARNING: Doppler sign convention: approaching = higher frequency, receding = lower.
RESULT UNITS: m/s (speed), Hz (frequency), m (wavelength)`,

    // ═══════════════════════════════════════════
    // PHYSICS — CLASS 12
    // ═══════════════════════════════════════════

    'Electrostatics': `
KEY FORMULAS:
- Coulomb's law: F = kq₁q₂/r² (k = 9 × 10⁹ Nm²/C²)
- Electric field: E = kQ/r² (point charge)
- Electric potential: V = kQ/r
- PE of two charges: U = kq₁q₂/r
- Gauss's law: ∮E·dA = Q_enclosed/ε₀
- Capacitance (parallel plate): C = ε₀A/d
- With dielectric: C = Kε₀A/d (K = dielectric constant)
- Energy stored: U = (1/2)CV² = Q²/(2C) = (1/2)QV
- Capacitors in series: 1/C = 1/C₁ + 1/C₂
- Capacitors in parallel: C = C₁ + C₂

⚠️ WARNING: Dielectric constant (K) is DIMENSIONLESS.
⚠️ WARNING: E between plates = σ/ε₀ = V/d, NOT σ/(2ε₀) which is for single infinite sheet.
RESULT UNITS: N (force), N/C or V/m (electric field), V (potential), F (capacitance), J (energy)`,

    'Current Electricity': `
KEY FORMULAS:
- Ohm's law: V = IR
- Resistivity: R = ρL/A
- Power: P = VI = I²R = V²/R
- Resistors in series: R = R₁ + R₂ + ...
- Resistors in parallel: 1/R = 1/R₁ + 1/R₂ + ...
- Kirchhoff's junction rule: ΣI_in = ΣI_out
- Kirchhoff's loop rule: ΣV = 0 around any loop
- Wheatstone bridge: P/Q = R/S (balanced, no current through galvanometer)
- Potentiometer: E₁/E₂ = L₁/L₂
- Internal resistance: V = E - Ir, I = E/(R + r)

⚠️ WARNING: EMF ≠ terminal voltage when current flows. V = E - Ir.
⚠️ WARNING: For maximum power transfer: R_external = r (internal resistance).
RESULT UNITS: V (voltage), A (current), Ω (resistance), W (power)`,

    'Magnetic Effects of Current': `
KEY FORMULAS:
- Biot-Savart: dB = (μ₀/4π)(Idl × r̂)/r²
- B at center of circular loop: B = μ₀I/(2R)
- B inside solenoid: B = μ₀nI (n = turns per unit length)
- Ampere's law: ∮B·dl = μ₀I_enclosed
- Force on current-carrying wire: F = BIL sin(θ)
- Force between parallel wires: F/L = μ₀I₁I₂/(2πd) (attractive if same direction)
- Lorentz force: F = qv × B = qvB sin(θ)
- Radius of circular motion in B: r = mv/(qB)

⚠️ WARNING: Use right-hand rule for direction of B and force.
⚠️ WARNING: μ₀ = 4π × 10⁻⁷ T·m/A.
RESULT UNITS: T (magnetic field), N (force), m (radius)`,

    'Electromagnetic Induction': `
KEY FORMULAS:
- Faraday's law: EMF = -dΦ/dt = -N(dΦ/dt)
- Magnetic flux: Φ = B·A·cos(θ)
- Motional EMF: ε = BLv (rod moving in magnetic field)
- Self-inductance: L = NΦ/I, EMF = -L(dI/dt)
- Solenoid inductance: L = μ₀n²Al = μ₀N²A/l
- Energy in inductor: U = (1/2)LI²
- Mutual inductance: M = μ₀N₁N₂A/l

⚠️ WARNING: Lenz's law — induced current OPPOSES the change causing it.
RESULT UNITS: V (EMF), Wb (flux), H (inductance), J (energy)`,

    'Alternating Current': `
KEY FORMULAS:
- v = V₀ sin(ωt), i = I₀ sin(ωt ± φ)
- RMS values: V_rms = V₀/√2, I_rms = I₀/√2
- Impedance: Z = √(R² + (X_L - X_C)²)
- X_L = ωL = 2πfL, X_C = 1/(ωC) = 1/(2πfC)
- Resonance: ω₀ = 1/√(LC), f₀ = 1/(2π√(LC))
- Power: P = V_rms × I_rms × cos(φ) (power factor = cos φ)
- At resonance: Z = R (minimum), current is maximum
- Transformer: V_s/V_p = N_s/N_p = I_p/I_s

⚠️ WARNING: At resonance, X_L = X_C, impedance Z = R (purely resistive).
RESULT UNITS: V (voltage), A (current), Ω (impedance), W (power), Hz (frequency)`,

    'Ray Optics': `
KEY FORMULAS:
- Mirror formula: 1/v + 1/u = 1/f
- Lens formula: 1/v - 1/u = 1/f
- Magnification (mirror): m = -v/u
- Magnification (lens): m = v/u
- Power of lens: P = 1/f (in meters), unit: dioptre (D)
- Snell's law: n₁ sin(θ₁) = n₂ sin(θ₂)
- Critical angle: sin(θ_c) = n₂/n₁ (for n₁ > n₂)
- Lens maker: 1/f = (n-1)(1/R₁ - 1/R₂)
- Prism: δ = (n-1)A (thin prism), n = sin((A+δ_m)/2) / sin(A/2)

⚠️ WARNING: Sign convention matters! Real images have v > 0 for lens, v < 0 for mirror.
⚠️ WARNING: Refractive index is DIMENSIONLESS.
RESULT UNITS: m or cm (focal length, image distance), D (power), dimensionless (magnification, refractive index)`,

    'Wave Optics': `
KEY FORMULAS:
- Single slit first minimum: a sin(θ) = λ (a = slit width)
- Single slit central maximum width: W = 2λD/a
- Double slit fringe width: β = λD/d (d = slit separation, D = screen distance)
- Constructive: d sin(θ) = nλ
- Destructive: d sin(θ) = (n + 1/2)λ
- Resolving power (circular aperture): θ = 1.22λ/a (Rayleigh criterion)

⚠️ CRITICAL WARNING: For SINGLE SLIT first minimum: a sin(θ) = λ (NOT 1.22λ).
   1.22λ/a is ONLY for circular aperture (Rayleigh criterion for resolving power).
   These are DIFFERENT formulas. Do NOT confuse them.
⚠️ WARNING: Central maximum of single slit is TWICE as wide as other maxima.
RESULT UNITS: m (fringe width), rad (angle), dimensionless (order n)`,

    'Dual Nature of Radiation': `
KEY FORMULAS:
- Photoelectric: KE_max = hν - φ = h(ν - ν₀)
- Work function: φ = hν₀ (threshold frequency)
- Stopping potential: eV₀ = KE_max = hν - φ
- De Broglie wavelength: λ = h/p = h/(mv) = h/√(2mKE)
- For electron accelerated through V volts: λ = 1.227/√V nm

⚠️ WARNING: If ν < ν₀ (frequency below threshold), NO photoelectrons emitted regardless of intensity.
RESULT UNITS: J or eV (energy), m or nm (wavelength), Hz (frequency)`,

    'Atoms': `
KEY FORMULAS:
- Bohr model energy: E_n = -13.6 Z²/n² eV
- Bohr radius: r_n = 0.529 n²/Z Å (angstroms)
- Velocity: v_n = 2.18 × 10⁶ Z/n m/s
- Wavelength (Rydberg): 1/λ = RZ²(1/n₁² - 1/n₂²), R = 1.097 × 10⁷ m⁻¹
- Time period: T_n ∝ n³/Z²
- Angular momentum: L = nh/(2π) = nℏ

⚠️ CRITICAL WARNING: E_n = -13.6/n² eV (NOT -13.6/n). The n is SQUARED.
   For n=1: E₁ = -13.6 eV
   For n=2: E₂ = -13.6/4 = -3.4 eV (NOT -13.6/2 = -6.8)
⚠️ WARNING: Energy is NEGATIVE for bound states. |E_n| decreases as n increases.
⚠️ WARNING: For transition n₂→n₁: ΔE = 13.6Z²(1/n₁² - 1/n₂²) eV (positive for emission).
RESULT UNITS: eV (energy), Å (radius), m/s (velocity), m or nm (wavelength)`,

    'Nuclei': `
KEY FORMULAS:
- Mass-energy: E = mc² (1 amu = 931.5 MeV)
- Binding energy: B = [Z×m_p + N×m_n - M_nucleus] × 931.5 MeV
- Binding energy per nucleon: B/A
- Radioactive decay: N = N₀ e^(-λt), A = A₀ e^(-λt)
- Half-life: t½ = 0.693/λ = ln(2)/λ
- Mean life: τ = 1/λ = t½/0.693
- After n half-lives: N = N₀/2ⁿ, remaining fraction = (1/2)ⁿ

DECAY RULES:
- α decay: Z → Z-2, A → A-4 (loses ⁴₂He)
- β⁻ decay: Z → Z+1, A → A (mass number UNCHANGED, neutron→proton)
- β⁺ decay: Z → Z-1, A → A (mass number UNCHANGED, proton→neutron)
- γ decay: Z → Z, A → A (no change in Z or A)

⚠️ CRITICAL WARNING: In β decay (both β⁻ and β⁺), the MASS NUMBER DOES NOT CHANGE. Only the atomic number changes.
⚠️ WARNING: Always verify: total Z and total A must be conserved on both sides of a nuclear equation.
RESULT UNITS: MeV (energy), s or years (half-life), dimensionless (mass number, atomic number)`,

    'Semiconductor Electronics': `
KEY FORMULAS:
- Diode forward: I = I₀(e^(V/(nkT)) - 1)
- Zener regulation: V_out = V_z (constant in breakdown)
- Transistor: I_E = I_B + I_C
- Current gain (CE): β = I_C/I_B
- Current gain (CB): α = I_C/I_E
- Relation: β = α/(1-α)
- Logic gates: AND, OR, NOT, NAND, NOR, XOR truth tables

⚠️ WARNING: α is always < 1, β is always > 1.
RESULT UNITS: A or mA (current), V (voltage), dimensionless (α, β)`,

    // ═══════════════════════════════════════════
    // CHEMISTRY — NUMERICAL TOPICS
    // ═══════════════════════════════════════════

    'Some Basic Concepts of Chemistry': `
KEY FORMULAS:
- Moles: n = mass/molar_mass = N/Nₐ = V(L)/22.4 (at STP)
- Molarity: M = moles of solute / volume of solution (in L)
- Molality: m = moles of solute / mass of solvent (in kg)
- Mass percentage: (mass of solute / mass of solution) × 100
- Mole fraction: χ_A = n_A/(n_A + n_B)
- Limiting reagent: the reactant that gives FEWER moles of product

⚠️ WARNING: STP is 0°C and 1 atm, molar volume = 22.4 L/mol. At 25°C, it's ~24.5 L/mol.
⚠️ WARNING: Mole fraction is DIMENSIONLESS (no units).
RESULT UNITS: mol, g/mol, M (mol/L), dimensionless (mole fraction, mass fraction)`,

    'Structure of The Atom': `
KEY FORMULAS:
- Bohr model: E_n = -13.6 Z²/n² eV (same as Physics)
- r_n = 0.529 × n²/Z Å
- De Broglie: λ = h/(mv)
- Heisenberg: Δx × Δp ≥ h/(4π)
- Quantum numbers: n (1,2,3...), l (0 to n-1), m_l (-l to +l), m_s (±1/2)
- Max electrons in shell: 2n²
- Max electrons in subshell: 2(2l+1)

⚠️ WARNING: All quantum numbers are DIMENSIONLESS.
RESULT UNITS: eV (energy), Å (radius), dimensionless (quantum numbers)`,

    'States of Matter': `
KEY FORMULAS:
- Ideal gas: PV = nRT (R = 0.0821 L·atm/(mol·K) = 8.314 J/(mol·K))
- Dalton's law: P_total = P₁ + P₂ + ... (partial pressures)
- Graham's law: r₁/r₂ = √(M₂/M₁) (rate of diffusion)
- Van der Waals: (P + an²/V²)(V - nb) = nRT
- Boyle's law: P₁V₁ = P₂V₂ (constant T)
- Charles's law: V₁/T₁ = V₂/T₂ (constant P)
- Compressibility factor: Z = PV/(nRT) (Z=1 for ideal gas)

⚠️ WARNING: T MUST be in Kelvin for gas laws, not Celsius.
⚠️ WARNING: Compressibility factor Z is DIMENSIONLESS.
RESULT UNITS: atm or Pa (pressure), L (volume), K (temperature), mol (moles)`,

    'Equilibrium': `
KEY FORMULAS:
- Kc = [C]^c[D]^d / ([A]^a[B]^b) at equilibrium
- Kp = Kc(RT)^Δn where Δn = (c+d) - (a+b) (moles of gas)
- pH = -log[H⁺], pOH = -log[OH⁻], pH + pOH = 14 (at 25°C)
- Ka = [H⁺][A⁻]/[HA], Kb = [OH⁻][BH⁺]/[B]
- Ka × Kb = Kw = 10⁻¹⁴ (at 25°C)
- Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA])
- Ksp = [cation]^m × [anion]^n (solubility product)
- Degree of dissociation: α = √(Ka/C) for weak acids (C >> Ka)

⚠️ WARNING: pH is DIMENSIONLESS (it's a logarithm).
⚠️ WARNING: Kc and Kp have units that depend on Δn. If Δn = 0, Kp = Kc.
⚠️ WARNING: Le Chatelier's principle — adding reactant shifts equilibrium toward products.
RESULT UNITS: dimensionless (pH, pOH, degree of dissociation), varies (Kc, Kp)`,

    'Redox Reactions': `
KEY FORMULAS:
- Oxidation number rules: element=0, monoatomic ion=charge, O=-2 (usually), H=+1 (usually)
- n-factor (acids) = basicity (number of H⁺ donatable)
- n-factor (bases) = acidity (number of OH⁻)
- n-factor (redox) = |change in oxidation state per atom| × number of atoms
- Equivalent weight = Molar mass / n-factor
- Equivalents = mass / equivalent weight = n-factor × moles
- At equivalence point: equivalents of oxidant = equivalents of reductant

MOLECULAR COUNTING RULES:
⚠️ CRITICAL WARNING: For Cr₂O₇²⁻ → Cr³⁺:
   Each Cr goes from +6 to +3 = 3 electrons per Cr atom
   BUT Cr₂O₇²⁻ has TWO Cr atoms
   Total electrons transferred per formula unit = 2 × 3 = 6 electrons
   n-factor of Cr₂O₇²⁻ = 6

⚠️ CRITICAL WARNING: For MnO₄⁻ → Mn²⁺:
   Mn goes from +7 to +2 = 5 electrons per Mn
   MnO₄⁻ has ONE Mn atom
   Total electrons = 1 × 5 = 5 electrons
   n-factor of MnO₄⁻ = 5

⚠️ WARNING: Always count the NUMBER OF ATOMS of the element changing oxidation state in the formula unit.
RESULT UNITS: dimensionless (oxidation number), g/eq (equivalent weight)`,

    'Electrochemistry': `
KEY FORMULAS:
- Nernst equation: E = E° - (RT/(nF))ln(Q) = E° - (0.0592/n)log(Q) at 25°C
- E°_cell = E°_cathode - E°_anode (using reduction potentials)
- ΔG° = -nFE° (F = 96485 C/mol)
- Faraday's laws: m = (MIt)/(nF) where M = molar mass, n = electrons transferred
- Λ_m = κ/c (molar conductivity)
- Kohlrausch: Λ°_m = ν₊λ°₊ + ν₋λ°₋

⚠️ WARNING: Standard electrode potentials are for REDUCTION half-reactions.
⚠️ WARNING: For the cell to be spontaneous, E°_cell must be POSITIVE (ΔG° < 0).
RESULT UNITS: V (potential), S·cm²/mol (molar conductivity), g (mass deposited)`,

    'Chemical Kinetics': `
KEY FORMULAS:
- Rate = k[A]^m[B]^n (rate law)
- Zero order: [A] = [A]₀ - kt, t½ = [A]₀/(2k)
- First order: ln[A] = ln[A]₀ - kt, or [A] = [A]₀e^(-kt), t½ = 0.693/k
- Second order: 1/[A] = 1/[A]₀ + kt, t½ = 1/(k[A]₀)
- Arrhenius: k = Ae^(-Ea/(RT)), ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)
- For first order decay: N = N₀(1/2)^(t/t½)

⚠️ WARNING: First order t½ is INDEPENDENT of initial concentration.
⚠️ WARNING: For radioactive decay, always use first-order kinetics.
RESULT UNITS: varies (rate constant units depend on order), s or min (time), kJ/mol (activation energy)`,

    'Solid State': `
KEY FORMULAS:
- Simple cubic: atoms/unit cell = 1, packing = 52.4%, r = a/2
- BCC: atoms/unit cell = 2, packing = 68%, r = √3a/4
- FCC: atoms/unit cell = 4, packing = 74%, r = a/(2√2)
- HCP: atoms/unit cell = 6, packing = 74%
- Density: ρ = (Z × M)/(a³ × Nₐ) where Z = atoms/unit cell, a = edge length
- Coordination number: SC=6, BCC=8, FCC=12

⚠️ WARNING: Edge length 'a' must be in cm for density in g/cm³.
⚠️ WARNING: In NaCl structure, Z = 4 formula units per unit cell.
RESULT UNITS: g/cm³ (density), cm or pm (edge length), dimensionless (coordination number)`,

    'Solutions': `
KEY FORMULAS:
- Raoult's law: P = P°χ_solvent = P°(1 - χ_solute)
- Relative lowering: ΔP/P° = χ_solute = n₂/(n₁ + n₂)
- Elevation in boiling point: ΔT_b = Kb × m (molality)
- Depression in freezing point: ΔT_f = Kf × m
- Osmotic pressure: π = CRT = (n/V)RT (C in mol/L)
- Van't Hoff factor: i = (observed colligative property)/(calculated)
- For electrolytes: i = 1 + (n-1)α where n = ions per formula, α = degree of dissociation

⚠️ WARNING: Colligative properties depend on NUMBER of particles, not their nature.
⚠️ WARNING: Van't Hoff factor i > 1 for electrolytes (dissociation), i < 1 for association.
RESULT UNITS: K (temperature change), atm (osmotic pressure), K·kg/mol (Kb, Kf)`,

    'Hydrogen': `
KEY FORMULAS:
- Reaction with water: 2Na + 2H₂O → 2NaOH + H₂ (1 mol Na produces 0.5 mol H₂)
- Moles of H₂ = moles of Na / 2
- Volume at STP: V = n × 22.4 L
- Hardness: temporary (Ca(HCO₃)₂) removed by boiling, permanent (CaSO₄) removed by Na₂CO₃

⚠️ WARNING: Stoichiometry — 2 moles Na produce 1 mole H₂ (NOT 1:1 ratio).
RESULT UNITS: L (volume), mol (moles), g (mass)`,

    // ═══════════════════════════════════════════
    // MATHEMATICS — NUMERICAL TOPICS
    // ═══════════════════════════════════════════

    'Statistics': `
KEY FORMULAS:
- Mean (discrete): x̄ = Σxᵢfᵢ / Σfᵢ
- Mean (continuous): x̄ = Σxᵢfᵢ / N where xᵢ = class mark
- Variance: σ² = (Σfᵢ(xᵢ - x̄)²) / N = (Σfᵢxᵢ²/N) - x̄²
- Standard deviation: σ = √(variance)
- Expected value: E(X) = Σ xᵢ × P(xᵢ) — multiply EACH value by its probability, then SUM
- Var(X) = E(X²) - [E(X)]²

⚠️ CRITICAL WARNING: E(X) = Σ xᵢ × P(xᵢ). Compute it step by step:
   Step 1: List each value xᵢ and its probability P(xᵢ)
   Step 2: Compute each product xᵢ × P(xᵢ)
   Step 3: Sum all products
   DO NOT approximate. Calculate exactly.

⚠️ WARNING: 68-95-99.7 rule:
   68.27% of data falls within 1σ of mean
   95.45% within 2σ
   99.73% within 3σ
RESULT UNITS: Same unit as data (mean, SD), squared unit (variance)`,

    'Probability': `
KEY FORMULAS:
- P(A ∪ B) = P(A) + P(B) - P(A ∩ B)
- P(A|B) = P(A ∩ B) / P(B) (conditional probability)
- Bayes' theorem: P(A|B) = P(B|A)P(A) / P(B)
- Binomial: P(X = k) = C(n,k) × p^k × (1-p)^(n-k)
- Binomial mean: E(X) = np, Var(X) = np(1-p)
- Geometric: P(X = k) = (1-p)^(k-1) × p (first success on kth trial)
- Geometric: P(X > k) = (1-p)^k (NO success in first k trials)

⚠️ CRITICAL WARNING for Geometric distribution:
   P(X > k) = (1-p)^k — this is (1-p) raised to POWER k
   NOT 1 - p^k
   Example: P(X > 3) with p = 0.5 → (1-0.5)³ = (0.5)³ = 0.125

⚠️ WARNING: Probability is ALWAYS between 0 and 1. If you get P > 1 or P < 0, you made an error.
RESULT UNITS: dimensionless (probability is a ratio, no units)`,

    'Complex Numbers': `
KEY FORMULAS:
- z = a + bi, |z| = √(a² + b²), arg(z) = tan⁻¹(b/a)
- Conjugate: z̄ = a - bi
- z × z̄ = |z|²
- De Moivre: (cos θ + i sin θ)^n = cos(nθ) + i sin(nθ)
- Euler: e^(iθ) = cos θ + i sin θ
- Roots of unity: z_k = e^(2πik/n) for k = 0, 1, ..., n-1

⚠️ WARNING: i² = -1, i³ = -i, i⁴ = 1, i⁵ = i (cycle of 4).
RESULT UNITS: dimensionless (complex numbers have no units in pure math)`,

    'Permutations and Combinations': `
KEY FORMULAS:
- n! = n × (n-1) × ... × 1, 0! = 1
- Permutations: P(n,r) = n!/(n-r)!
- Combinations: C(n,r) = n!/(r!(n-r)!)
- Circular permutations: (n-1)!
- With repetition: n^r (r selections from n items)
- Derangements: D_n = n! × Σ(-1)^k/k! for k=0 to n

⚠️ WARNING: C(n,r) = C(n, n-r). Choosing r items = choosing (n-r) to exclude.
RESULT UNITS: dimensionless (counts are numbers)`,

    'Sequences and Series': `
KEY FORMULAS:
- AP: a_n = a + (n-1)d, S_n = n/2 × [2a + (n-1)d] = n/2 × (a + l)
- GP: a_n = ar^(n-1), S_n = a(r^n - 1)/(r - 1) for r ≠ 1
- Infinite GP (|r| < 1): S = a/(1 - r)
- AM = (a+b)/2, GM = √(ab), HM = 2ab/(a+b)
- AM ≥ GM ≥ HM (for positive numbers)

⚠️ WARNING: For infinite GP sum, |r| must be < 1. If |r| ≥ 1, sum diverges.
RESULT UNITS: Same as the terms of the sequence`,

    'Conic Sections': `
KEY FORMULAS:
- Circle: (x-h)² + (y-k)² = r²
- Parabola: y² = 4ax (focus at (a,0), directrix x = -a)
- Ellipse: x²/a² + y²/b² = 1 (a > b), e = √(1 - b²/a²)
- Hyperbola: x²/a² - y²/b² = 1, e = √(1 + b²/a²)
- Eccentricity: circle (e=0), ellipse (0<e<1), parabola (e=1), hyperbola (e>1)

⚠️ CRITICAL WARNING: Eccentricity (e) is DIMENSIONLESS. It has NO units.
   e = 0 → circle
   0 < e < 1 → ellipse
   e = 1 → parabola
   e > 1 → hyperbola
RESULT UNITS: dimensionless (eccentricity), m or units of coordinates (distances)`,

    'Limits and Derivatives': `
KEY FORMULAS:
- lim(x→0) sin(x)/x = 1
- lim(x→0) (e^x - 1)/x = 1
- lim(x→0) ln(1+x)/x = 1
- lim(x→0) (1 + 1/x)^x = e
- d/dx(x^n) = nx^(n-1)
- d/dx(sin x) = cos x, d/dx(cos x) = -sin x
- d/dx(e^x) = e^x, d/dx(ln x) = 1/x
- Product: d/dx(uv) = u'v + uv'
- Chain: d/dx(f(g(x))) = f'(g(x)) × g'(x)

RESULT UNITS: Depends on the function`,

    'Integrals': `
KEY FORMULAS:
- ∫x^n dx = x^(n+1)/(n+1) + C (n ≠ -1)
- ∫1/x dx = ln|x| + C
- ∫e^x dx = e^x + C
- ∫sin x dx = -cos x + C
- ∫cos x dx = sin x + C
- By parts: ∫u dv = uv - ∫v du (ILATE rule for choosing u)
- Definite: ∫[a,b] f(x) dx = F(b) - F(a)

ILATE priority: Inverse trig > Logarithmic > Algebraic > Trig > Exponential

⚠️ WARNING: Don't forget the constant of integration C for indefinite integrals.
RESULT UNITS: Depends on the function`,

    'Differential Equations': `
KEY FORMULAS:
- Order = highest derivative, Degree = power of highest derivative
- Separable: dy/dx = f(x)g(y) → ∫dy/g(y) = ∫f(x)dx
- Linear: dy/dx + P(x)y = Q(x) → IF = e^(∫P dx), solution: y × IF = ∫Q × IF dx
- Homogeneous: put y = vx, dy/dx = v + x(dv/dx)

⚠️ WARNING: Degree is defined only when the DE is polynomial in derivatives.
RESULT UNITS: Depends on the context`,

    'Vector Algebra': `
KEY FORMULAS:
- |a| = √(a₁² + a₂² + a₃²)
- Dot product: a·b = |a||b|cos θ = a₁b₁ + a₂b₂ + a₃b₃
- Cross product: |a×b| = |a||b|sin θ
- a×b = |i  j  k; a₁ a₂ a₃; b₁ b₂ b₃|
- Projection of a on b = (a·b)/|b|
- Area of parallelogram = |a×b|
- Area of triangle = (1/2)|a×b|
- Scalar triple product: [a b c] = a·(b×c) = Volume of parallelepiped

⚠️ WARNING: a×b = -(b×a) (cross product is anti-commutative).
⚠️ WARNING: If a·b = 0, vectors are perpendicular. If a×b = 0, vectors are parallel.
RESULT UNITS: Same as vector components (for dot product: units squared, e.g. m²)`,

    'Three Dimensional Geometry': `
KEY FORMULAS:
- Distance: d = √((x₂-x₁)² + (y₂-y₁)² + (z₂-z₁)²)
- Direction cosines: l = a/|r|, m = b/|r|, n = c/|r|; l² + m² + n² = 1
- Line: (x-x₁)/a = (y-y₁)/b = (z-z₁)/c (symmetric form)
- Plane: ax + by + cz = d
- Distance from point to plane: d = |ax₁ + by₁ + cz₁ - d| / √(a² + b² + c²)
- Angle between lines: cos θ = |l₁l₂ + m₁m₂ + n₁n₂|
- Shortest distance between skew lines: d = |[b₁-b₂, a₁, a₂]| / |a₁×a₂|

⚠️ WARNING: Direction cosines satisfy l² + m² + n² = 1. Direction ratios don't have this constraint.
RESULT UNITS: Same as coordinate units`,

    'Matrices': `
KEY FORMULAS:
- (AB)' = B'A' (transpose of product)
- (AB)⁻¹ = B⁻¹A⁻¹ (inverse of product)
- det(AB) = det(A) × det(B)
- det(A⁻¹) = 1/det(A)
- det(kA) = k^n × det(A) for n×n matrix
- A⁻¹ = adj(A)/det(A)
- Cramer's rule: x = Dx/D, y = Dy/D, z = Dz/D

⚠️ WARNING: Matrix multiplication is NOT commutative: AB ≠ BA in general.
RESULT UNITS: dimensionless (matrix elements depend on context)`,

    'Determinants': `
KEY FORMULAS:
- 2×2: |a b; c d| = ad - bc
- 3×3: Expand along any row/column using cofactors
- Properties: |A'| = |A|, |kA| = k^n|A|, |AB| = |A||B|
- Area of triangle with vertices (x₁,y₁), (x₂,y₂), (x₃,y₃):
  Area = (1/2)|x₁(y₂-y₃) + x₂(y₃-y₁) + x₃(y₁-y₂)|

RESULT UNITS: dimensionless (or area units for triangle)`,

    // ═══════════════════════════════════════════
    // BIOLOGY — Conceptual Reference Points
    // ═══════════════════════════════════════════

    'Genetics': `
KEY CONCEPTS (not formulas):
- Mendel's laws: Dominance, Segregation, Independent Assortment
- Monohybrid cross: 3:1 phenotypic ratio, 1:2:1 genotypic ratio
- Dihybrid cross: 9:3:3:1 phenotypic ratio
- Incomplete dominance: 1:2:1 phenotypic ratio
- Codominance: both alleles expressed (e.g., AB blood group)
- Sex-linked inheritance: X-linked recessive (color blindness, hemophilia)

⚠️ WARNING: Hardy-Weinberg: p² + 2pq + q² = 1, p + q = 1 (ONLY in ideal population).`,

    'Cell Division': `
KEY CONCEPTS:
- Mitosis: 2n → 2n (same ploidy), produces 2 identical cells
- Meiosis: 2n → n (ploidy halved), produces 4 genetically different cells
- DNA replication: Semi-conservative (Meselson-Stahl experiment)
- Cell cycle: G1 → S (DNA synthesis) → G2 → M (mitosis)
- Crossing over occurs in Pachytene (Prophase I of Meiosis)

⚠️ WARNING: Meiosis produces 4 cells, Mitosis produces 2 cells.`,

    'Circular Motion': `
KEY FORMULAS:
- Centripetal acceleration: a_c = v²/r = ω²r
- Centripetal force: F_c = mv²/r = mω²r
- v = rω, ω = 2πf = 2π/T
- Banking: tan(θ) = v²/(rg) (no friction)
- With friction on banked road: v_max = √(rg(μ + tan θ)/(1 - μ tan θ))
- Conical pendulum: T = 2π√(L cos θ/g)
- Min speed at top of vertical circle: v_min = √(gr) (for string), v_min = √(5gr) for complete loop at bottom

⚠️ WARNING: For vertical circular motion, minimum speed at the TOP is √(gr), and at the BOTTOM is √(5gr) for complete loop.
⚠️ WARNING: Centripetal force is NOT a separate force — it's the NET radial force (tension, gravity, normal, etc.).
RESULT UNITS: m/s (velocity), m/s² (acceleration), N (force), rad/s (angular velocity)`,

    'Alcohol and Phenols': `
KEY CONCEPTS:
- Acidity order: Water < Alcohol < Phenol < Carboxylic acid
- Lucas test: 3° gives immediate turbidity, 2° in 5 min, 1° no reaction at RT
- Phenol + Br₂ water → 2,4,6-tribromophenol (white precipitate)
- Phenol + FeCl₃ → violet/purple coloration
- Williamson synthesis: R-ONa + R'-X → R-O-R' (ether)
- Dehydration follows Zaitsev's rule (most substituted alkene)

⚠️ WARNING: Phenol is MORE acidic than alcohol due to resonance stabilization of phenoxide ion.`,

    'Evolution': `
KEY CONCEPTS:
- Darwin's theory of Natural Selection: variation, inheritance, differential reproduction, accumulation
- Lamarckism: inheritance of acquired characters (disproved for genetics, but epigenetics adds nuance)
- Hardy-Weinberg equilibrium: p² + 2pq + q² = 1, p + q = 1
  - 5 conditions: large population, random mating, no mutation, no migration, no selection
- Types of natural selection:
  - Stabilizing: favors average phenotype (e.g., human birth weight)
  - Directional: favors one extreme (e.g., antibiotic resistance)
  - Disruptive: favors both extremes (e.g., Darwin's finch beaks)
- Speciation:
  - Allopatric: geographic isolation (e.g., Darwin's finches on Galápagos)
  - Sympatric: reproductive isolation without geographic barrier (e.g., polyploidy in plants)
- Evidences of evolution: fossils, homologous organs, analogous organs, vestigial organs, embryology
- Homologous organs: same structure, different function (bat wing vs human arm = divergent evolution)
- Analogous organs: different structure, same function (bird wing vs insect wing = convergent evolution)
- Miller-Urey experiment: simulated early Earth atmosphere → amino acids
- Geological time scale: Precambrian → Paleozoic → Mesozoic → Cenozoic

⚠️ WARNING: Homologous organs indicate DIVERGENT evolution, analogous organs indicate CONVERGENT evolution. Do NOT confuse.
⚠️ WARNING: Hardy-Weinberg is a NULL model. Any deviation implies evolution is occurring.
RESULT: Biology conceptual questions must reference specific organisms, experiments, or named scientists.`,

    'Human Health': `
KEY CONCEPTS:
- Pathogens: bacteria, viruses, fungi, protozoans, helminths
- Bacterial diseases: Typhoid (Salmonella typhi), Cholera (Vibrio cholerae), TB (Mycobacterium tuberculosis), Plague (Yersinia pestis)
- Viral diseases: Common cold (Rhinovirus), AIDS (HIV — retrovirus), Dengue (Flavivirus), Chikungunya, COVID-19 (SARS-CoV-2)
- Protozoan diseases: Malaria (Plasmodium — mosquito vector), Amoebiasis (Entamoeba histolytica), Sleeping sickness (Trypanosoma)
- Helminth diseases: Ascariasis (Ascaris), Filariasis/Elephantiasis (Wuchereria bancrofti)
- Immunity types:
  - Innate: skin, mucus, phagocytes, complement, inflammation (non-specific)
  - Adaptive/Acquired: B-cells (humoral → antibodies), T-cells (cell-mediated)
  - Active: infection or vaccination (body makes own antibodies, long-lasting)
  - Passive: mother's milk (IgA), antiserum injection (short-lived)
- Vaccination: Edward Jenner (smallpox), weakened/killed pathogen → immune memory
- AIDS: HIV attacks helper T-cells (CD4+), reduces immunity, opportunistic infections
  - Diagnosis: ELISA (screening), Western Blot (confirmatory)
- Cancer: uncontrolled cell division, oncogenes, tumor suppressors (p53, Rb)
  - Types: benign (non-spreading), malignant (metastasis)
- Drugs of abuse: opioids (morphine, heroin), cannabinoids (marijuana), cocaine, tobacco (nicotine)
- Alcohol effects: liver cirrhosis, CNS depression

⚠️ WARNING: Active immunity is LONG-LASTING (memory cells formed), passive is SHORT-LIVED (no memory).
⚠️ WARNING: HIV is a RETROVIRUS (RNA → DNA via reverse transcriptase). It attacks CD4+ T-helper cells.
RESULT: Biology conceptual questions must reference specific diseases, pathogens, or immune mechanisms.`,
};

/**
 * Get the formula sheet for a given topic and subject.
 * Uses exact match first, then fuzzy matching.
 */
export function getFormulaSheet(topic: string, subject: string): string {
    // 1. Exact match
    if (FORMULA_SHEETS[topic]) {
        return FORMULA_SHEETS[topic];
    }

    // 2. Case-insensitive exact match
    const topicLower = topic.toLowerCase();
    for (const [key, sheet] of Object.entries(FORMULA_SHEETS)) {
        if (key.toLowerCase() === topicLower) {
            return sheet;
        }
    }

    // 3. Fuzzy match — topic contains key or key contains topic
    for (const [key, sheet] of Object.entries(FORMULA_SHEETS)) {
        if (topicLower.includes(key.toLowerCase()) ||
            key.toLowerCase().includes(topicLower)) {
            return sheet;
        }
    }

    // 4. Word-level matching — at least 2 significant words match
    const topicWords = topicLower.split(/\s+/).filter(w => w.length > 3);
    for (const [key, sheet] of Object.entries(FORMULA_SHEETS)) {
        const keyWords = key.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const matchCount = topicWords.filter(tw => keyWords.some(kw => kw.includes(tw) || tw.includes(kw))).length;
        if (matchCount >= 2) {
            return sheet;
        }
    }

    // 5. Subject-level fallback
    const subjectDefaults: Record<string, string> = {
        'Physics': 'Use standard NCERT Physics formulas. Always verify units and dimensional consistency.',
        'Chemistry': 'Use standard NCERT Chemistry formulas. Pay attention to stoichiometry and mole ratios. Count ALL atoms in a formula unit.',
        'Mathematics': 'Use standard mathematical formulas. Show each algebraic step. Verify edge cases (division by zero, negative under sqrt).',
        'Biology': 'Use NCERT Biology facts only. For genetics, use standard Mendelian ratios. For ecology, cite specific NCERT examples.',
    };

    return subjectDefaults[subject] ||
        `No specific formula sheet available for "${topic}" in ${subject}. Use standard NCERT-aligned formulas. Solve step-by-step.`;
}

/**
 * Check if a topic has a dedicated formula sheet.
 */
export function hasFormulaSheet(topic: string): boolean {
    const topicLower = topic.toLowerCase();
    return Object.keys(FORMULA_SHEETS).some(
        key => key.toLowerCase() === topicLower ||
               topicLower.includes(key.toLowerCase()) ||
               key.toLowerCase().includes(topicLower)
    );
}
