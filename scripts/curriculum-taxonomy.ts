// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS CURRICULUM TAXONOMY v1.0
// Master topic map: Classes 8-12 × JEE Mains + Advanced + NEET + Board
// Total target: 100,000 questions
// Priority: Class 12 → 11 → 10 → 9 → 8
// ═══════════════════════════════════════════════════════════════════

export interface TopicNode {
  id: string;
  class: '8' | '9' | '10' | '11' | '12';
  exam: 'JEEMains' | 'JEEAdvanced' | 'NEET' | 'Board';
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'Science' | 'Social';
  chapter: string;
  topic: string;
  subtopics: string[];
  weightage: number;  // 0-1 relative to subject total
  priority: number;   // 1=highest (Class 12 JEE), 5=lowest (Class 8 Board)
  target_questions: number;
}

export const TAXONOMY: TopicNode[] = [

  // ════════════════════════════════════════════════════════════════
  // CLASS 12 — PHYSICS — JEE MAINS (priority 1)
  // ════════════════════════════════════════════════════════════════
  { id:'phy_12_jm_electrostatics', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Electric Charges and Fields', topic:'Electrostatics', subtopics:["Coulomb's law and superposition", "Electric field due to point charges and dipoles", "Gauss law — sphere cylinder infinite plane", "Electric potential and potential energy", "Equipotential surfaces E=-dV/dr", "Capacitance parallel plate cylindrical spherical", "Energy in capacitor dielectric effect", "Electric flux and field lines"], weightage:0.08, priority:1, target_questions:200 },
  { id:'phy_12_jm_current_elec', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Current Electricity', topic:'Current Electricity', subtopics:["Ohm's law and resistivity", "Kirchhoff's laws KVL KCL", "Wheatstone bridge meter bridge potentiometer", "Cell EMF internal resistance", "Series parallel combinations", "Power in resistive circuits", "RC circuits charging discharging", "Temperature dependence of resistance"], weightage:0.08, priority:1, target_questions:200 },
  { id:'phy_12_jm_magnetism', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Moving Charges and Magnetism', topic:'Magnetic Force and Fields', subtopics:["Lorentz force on moving charge", "Biot-Savart law — wire loop solenoid", "Ampere's law applications", "Force between parallel currents", "Torque on current loop in B field", "Cyclotron motion radius period", "Galvanometer to ammeter voltmeter", "Magnetic field due to toroid"], weightage:0.07, priority:1, target_questions:180 },
  { id:'phy_12_jm_emi', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Electromagnetic Induction', topic:'EMI and Faraday Laws', subtopics:["Faraday's law and Lenz's law", "Motional EMF in moving rod", "Self inductance and mutual inductance", "Energy stored in inductor", "LR circuit growth decay of current", "Eddy currents and transformer losses", "AC generator principle", "Flux linkage and flux change rate"], weightage:0.07, priority:1, target_questions:180 },
  { id:'phy_12_jm_ac', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Alternating Current', topic:'AC Circuits', subtopics:["Peak RMS values of V and I", "Phasor diagrams for R L C", "Impedance of LCR series circuit", "Resonance condition and bandwidth", "Power factor and wattless current", "Transformer turns ratio efficiency", "LC oscillations frequency", "Q-factor of resonant circuit"], weightage:0.06, priority:1, target_questions:160 },
  { id:'phy_12_jm_optics_ray', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Ray Optics', topic:'Ray Optics and Optical Instruments', subtopics:["Mirror formula and magnification", "Refraction at curved surface lens formula", "Lens maker equation and power", "Combination of lenses and mirrors", "Prism — deviation and dispersion", "Total internal reflection critical angle", "Microscope and telescope magnification", "Human eye defects correction"], weightage:0.07, priority:1, target_questions:180 },
  { id:'phy_12_jm_optics_wave', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Wave Optics', topic:'Wave Optics', subtopics:["Huygens principle wavefront", "Interference — Young double slit fringe width", "Conditions for maxima and minima", "Single slit diffraction pattern", "Polarization Brewster angle", "Malus law intensity", "Resolving power of instruments", "Coherent sources and path difference"], weightage:0.06, priority:1, target_questions:150 },
  { id:'phy_12_jm_modern', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Dual Nature of Radiation and Matter', topic:'Modern Physics', subtopics:["Photoelectric effect Einstein equation", "Work function threshold frequency stopping potential", "de Broglie wavelength of particles", "Bohr model energy levels hydrogen", "Atomic spectra emission absorption", "X-rays characteristic and continuous", "Nuclear binding energy mass defect", "Radioactive decay alpha beta gamma"], weightage:0.08, priority:1, target_questions:200 },
  { id:'phy_12_jm_semiconductor', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Semiconductor Electronics', topic:'Semiconductors and Devices', subtopics:["Intrinsic extrinsic semiconductors", "p-n junction diode forward reverse bias", "Zener diode as voltage regulator", "Transistor configurations CE CB CC", "Logic gates AND OR NOT NAND NOR", "Boolean algebra De Morgan theorem", "Rectifier half wave full wave", "Transistor as switch and amplifier"], weightage:0.06, priority:1, target_questions:150 },
  { id:'phy_12_jm_emwave', class:'12', exam:'JEEMains', subject:'Physics', chapter:'Electromagnetic Waves', topic:'EM Waves and Communication', subtopics:["Maxwell equations displacement current", "EM spectrum frequency wavelength", "Properties of EM waves in vacuum", "Amplitude frequency phase modulation", "Bandwidth and information capacity", "Propagation — sky wave space wave ground wave", "Antenna length wavelength", "Noise and signal-to-noise ratio"], weightage:0.04, priority:1, target_questions:100 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 12 — CHEMISTRY — JEE MAINS (priority 1)
  // ════════════════════════════════════════════════════════════════
  { id:'che_12_jm_solutions', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Solutions', topic:'Solutions and Colligative Properties', subtopics:["Henry law Raoult law vapour pressure", "Ideal and non-ideal solutions", "Elevation of boiling point Kb", "Depression of freezing point Kf", "Osmotic pressure van't Hoff equation", "Abnormal molar masses — dissociation association", "Molarity molality mole fraction normality", "Solubility and temperature dependence"], weightage:0.07, priority:1, target_questions:180 },
  { id:'che_12_jm_electrochemistry', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Electrochemistry', topic:'Electrochemistry', subtopics:["Electrochemical cell notation EMF", "Standard electrode potential SHE", "Nernst equation cell potential", "Conductance specific molar equivalent", "Kohlrausch law limiting molar conductance", "Electrolysis Faraday laws", "Corrosion electrochemical explanation", "Batteries fuel cells"], weightage:0.07, priority:1, target_questions:180 },
  { id:'che_12_jm_kinetics', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Chemical Kinetics', topic:'Chemical Kinetics', subtopics:["Rate of reaction and rate law", "Zero first second order integrated rate laws", "Half life calculations", "Arrhenius equation activation energy", "Effect of temperature on rate", "Molecularity vs order of reaction", "Pseudo-first order reactions", "Collision theory and transition state theory"], weightage:0.07, priority:1, target_questions:180 },
  { id:'che_12_jm_surface', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Surface Chemistry', topic:'Surface Chemistry', subtopics:["Adsorption physisorption chemisorption", "Freundlich and Langmuir isotherms", "Catalysis homogeneous heterogeneous", "Colloids — preparation properties", "Tyndall effect Brownian motion", "Coagulation and peptization", "Emulsion types preparation", "Micelles and critical micelle concentration"], weightage:0.04, priority:1, target_questions:100 },
  { id:'che_12_jm_pblock', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'p-Block Elements', topic:'p-Block Elements (Group 15-18)', subtopics:["Group 15 — N P As Sb Bi properties allotropes", "Oxoacids of nitrogen and phosphorus", "Group 16 — O S allotropes SO2 SO3 H2SO4", "Group 17 halogens — HF HCl HBr HI strength", "Interhalogen compounds and uses", "Group 18 noble gases properties uses", "Comparison of oxidation states across groups", "Industrial preparation of HNO3 H2SO4"], weightage:0.09, priority:1, target_questions:220 },
  { id:'che_12_jm_dblock', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'d and f Block Elements', topic:'d and f Block Elements', subtopics:["General properties of transition elements", "Variable oxidation states magnetic properties colour", "Lanthanides actinides — properties and uses", "Catalytic properties of transition metals", "Interstitial compounds and alloys", "Important compounds KMnO4 K2Cr2O7", "Potassium permanganate preparation reactions", "Potassium dichromate oxidation reactions"], weightage:0.06, priority:1, target_questions:150 },
  { id:'che_12_jm_coordination', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Coordination Compounds', topic:'Coordination Compounds', subtopics:["Werner theory coordination number", "IUPAC nomenclature of complexes", "Isomerism — ionisation linkage geometric optical", "Crystal field theory splitting d orbitals", "Spectrochemical series strong weak field", "Magnetic moment calculation", "EAN rule 18 electron rule", "Stability constants and chelate effect"], weightage:0.08, priority:1, target_questions:200 },
  { id:'che_12_jm_haloalkanes', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Haloalkanes and Haloarenes', topic:'Haloalkanes and Haloarenes', subtopics:["SN1 SN2 mechanism carbocation stability", "Walden inversion configuration", "E1 E2 elimination Saytzev Hofmann", "Grignard reagent preparation reactions", "Nucleophilicity and leaving group ability", "Aryl halides — low reactivity reasons", "Freons CFCs and ozone depletion", "Reactions of haloarenes electrophilic substitution"], weightage:0.07, priority:1, target_questions:180 },
  { id:'che_12_jm_alcohol', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Alcohols Phenols and Ethers', topic:'Alcohols Phenols and Ethers', subtopics:["Preparation of alcohols — hydration reduction", "Lucas test primary secondary tertiary", "Oxidation of alcohols PCC CrO3", "Acidity order of alcohols phenols", "Phenol reactions — kolbe schmidt mechanism", "Ether preparation Williamson synthesis", "Cleavage of ethers with HI HBr", "Reactions of diols glycols"], weightage:0.06, priority:1, target_questions:150 },
  { id:'che_12_jm_carbonyl', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Aldehydes Ketones and Carboxylic Acids', topic:'Carbonyl Compounds', subtopics:["Nucleophilic addition to carbonyl", "Aldol condensation and aldol products", "Cannizzaro reaction non-enolizable aldehydes", "Tollens Fehling Benedict tests", "Oxidation — with KMnO4 Cr2O3", "Baeyer Villiger oxidation of ketones", "Carboxylic acid preparation and reactions", "Fischer esterification mechanism"], weightage:0.08, priority:1, target_questions:200 },
  { id:'che_12_jm_amines', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Amines', topic:'Amines and Diazonium Salts', subtopics:["Basicity order amines aniline comparison", "Gabriel phthalimide synthesis", "Hofmann bromamide reaction", "Diazotization reaction conditions", "Sandmeyer reaction Gattermann reaction", "Coupling reaction azo dyes", "Electrophilic substitution of aniline", "N-methylation and acylation of amines"], weightage:0.06, priority:1, target_questions:150 },
  { id:'che_12_jm_biomolecules', class:'12', exam:'JEEMains', subject:'Chemistry', chapter:'Biomolecules', topic:'Biomolecules', subtopics:["Monosaccharides disaccharides polysaccharides", "Glucose structure open chain ring form", "Mutarotation and anomers alpha beta", "Amino acids essential non-essential", "Peptide bond primary secondary structure protein", "Enzymes — mechanism specificity", "Nucleic acids DNA RNA structure", "Vitamins coenzymes fat water soluble"], weightage:0.05, priority:1, target_questions:120 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 12 — MATHEMATICS — JEE MAINS (priority 1)
  // ════════════════════════════════════════════════════════════════
  { id:'mat_12_jm_relations', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Relations and Functions', topic:'Relations and Functions', subtopics:["Types of relations — reflexive symmetric transitive", "Types of functions — injective surjective bijective", "Composition of functions f∘g", "Invertible functions and inverse", "Binary operations properties", "Greatest integer function fractional part", "Domain and range of composite functions", "Odd and even functions symmetry"], weightage:0.05, priority:1, target_questions:130 },
  { id:'mat_12_jm_itf', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Inverse Trigonometric Functions', topic:'Inverse Trig Functions', subtopics:["Domain range of sin⁻¹ cos⁻¹ tan⁻¹", "Principal value branch selection", "sin⁻¹(sin x) cos⁻¹(cos x) simplification", "Identities sin⁻¹x + cos⁻¹x = π/2", "tan⁻¹x + tan⁻¹y formulas", "Inverse trig equations solutions", "Graphs of inverse trig functions", "Conversion between inverse trig forms"], weightage:0.05, priority:1, target_questions:130 },
  { id:'mat_12_jm_matrices', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Matrices', topic:'Matrices', subtopics:["Types of matrices — symmetric skew diagonal", "Matrix addition multiplication properties", "Transpose and its properties", "Symmetric skew-symmetric decomposition", "Elementary row column operations", "Inverse using row reduction", "Cayley-Hamilton theorem application", "Trace of matrix eigenvalues basics"], weightage:0.06, priority:1, target_questions:160 },
  { id:'mat_12_jm_determinants', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Determinants', topic:'Determinants', subtopics:["Expansion of 3×3 determinant cofactors", "Properties — row operations effect", "Area of triangle using determinants", "Adjoint and inverse of matrix det formula", "Cramer's rule for linear equations", "Consistency of linear system", "Characteristic polynomial det(A-λI)=0", "Product of determinants"], weightage:0.06, priority:1, target_questions:160 },
  { id:'mat_12_jm_calculus_diff', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Continuity and Differentiability', topic:'Continuity and Differentiability', subtopics:["Continuity at a point and on interval", "Differentiability and non-differentiability", "Chain rule product rule quotient rule", "Derivatives of implicit functions", "Parametric differentiation d²y/dx²", "Derivatives of log exp sin cos tan", "Higher order derivatives", "Rolle theorem and Lagrange MVT"], weightage:0.08, priority:1, target_questions:200 },
  { id:'mat_12_jm_aod', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Application of Derivatives', topic:'Application of Derivatives', subtopics:["Increasing decreasing functions first derivative test", "Maxima minima — local global", "Second derivative test concavity", "Tangent and normal to curve", "Rate of change related rates", "Approximation using differentials", "Optimization problems — geometry", "L'Hopital rule 0/0 ∞/∞ forms"], weightage:0.08, priority:1, target_questions:200 },
  { id:'mat_12_jm_integrals', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Integrals', topic:'Indefinite and Definite Integrals', subtopics:["Standard integrals and formulae", "Integration by substitution", "Integration by parts ILATE rule", "Partial fractions rational functions", "Definite integral properties symmetry", "King property f(a+b-x)", "Definite integral as limit of sum", "Reduction formulae sin^n cos^n"], weightage:0.10, priority:1, target_questions:250 },
  { id:'mat_12_jm_aoi', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Application of Integrals', topic:'Area Under Curves', subtopics:["Area between curve and x-axis", "Area between two curves", "Area using horizontal strips", "Area of ellipse circle parabola", "Area bounded by parametric curves", "Volume of revolution disk method", "Volume of revolution shell method", "Area of region with absolute value functions"], weightage:0.06, priority:1, target_questions:160 },
  { id:'mat_12_jm_diffeq', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Differential Equations', topic:'Differential Equations', subtopics:["Order degree of ODE", "Variable separable method", "Homogeneous equations substitution y=vx", "Linear ODE integrating factor method", "Exact differential equations", "Bernoulli equation", "Orthogonal trajectories", "Applications — population growth cooling"], weightage:0.07, priority:1, target_questions:180 },
  { id:'mat_12_jm_vectors', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Vector Algebra', topic:'Vectors', subtopics:["Addition subtraction magnitude direction", "Dot product — angle projection work", "Cross product — area perpendicular vector", "Scalar triple product volume of parallelepiped", "Coplanar vectors condition", "Vector equations of line and plane", "Distance between skew lines formula", "Section formula position vectors"], weightage:0.07, priority:1, target_questions:180 },
  { id:'mat_12_jm_3d', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Three Dimensional Geometry', topic:'3D Geometry', subtopics:["Direction cosines and direction ratios", "Equation of line in 3D — symmetric form", "Angle between two lines in 3D", "Equation of plane — normal form intercept form", "Angle between planes and dihedral angle", "Distance of point from plane", "Intersection of line and plane", "Coplanar lines condition"], weightage:0.07, priority:1, target_questions:180 },
  { id:'mat_12_jm_probability', class:'12', exam:'JEEMains', subject:'Mathematics', chapter:'Probability', topic:'Probability', subtopics:["Conditional probability P(A|B)", "Multiplication theorem", "Bayes theorem and total probability", "Independent events", "Bernoulli trials binomial distribution", "Mean variance of binomial distribution", "Poisson distribution basics", "Random variables and their distributions"], weightage:0.08, priority:1, target_questions:200 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 12 — JEE ADVANCED (priority 1 — harder versions)
  // ════════════════════════════════════════════════════════════════
  { id:'phy_12_ja_electrostatics', class:'12', exam:'JEEAdvanced', subject:'Physics', chapter:'Electric Charges and Fields', topic:'Electrostatics Advanced', subtopics:["Electrostatics of conductors induced charges", "Energy of system of charges", "Capacitor with conducting slab dielectric slab", "Variable capacitor charge redistribution", "Electric field inside conductor cavity", "Force on conductor in electric field surface charge"], weightage:0.12, priority:1, target_questions:200 },
  { id:'phy_12_ja_magnetic', class:'12', exam:'JEEAdvanced', subject:'Physics', chapter:'Magnetism', topic:'Magnetic Force Advanced', subtopics:["Charged particle in combined E and B fields", "Hall effect and Hall coefficient", "Magnetic force on arbitrary shaped wire", "Magnetic field inside toroid — non-uniform", "Mutual inductance between coaxial coils", "AC circuits with multiple elements and sources"], weightage:0.10, priority:1, target_questions:180 },
  { id:'phy_12_ja_optics', class:'12', exam:'JEEAdvanced', subject:'Physics', chapter:'Optics', topic:'Optics Advanced', subtopics:["Interference in thin films air wedge", "Newton rings radius derivation", "Diffraction grating and resolving power", "Polarization by scattering and reflection", "Aberrations in lenses and mirrors", "Optical path and optical path difference"], weightage:0.10, priority:1, target_questions:180 },
  { id:'phy_12_ja_modern', class:'12', exam:'JEEAdvanced', subject:'Physics', chapter:'Modern Physics', topic:'Modern Physics Advanced', subtopics:["Photoelectric effect stopping potential accuracy", "Compton scattering wavelength shift", "Nuclear reactions Q value", "Radioactive decay series and branching", "Nuclear fission and fusion energetics", "De Broglie wavelength of macroscopic objects"], weightage:0.10, priority:1, target_questions:180 },
  { id:'che_12_ja_organic', class:'12', exam:'JEEAdvanced', subject:'Chemistry', chapter:'Organic Chemistry', topic:'Organic Mechanisms Advanced', subtopics:["Multi-step synthesis planning retrosynthesis", "Named reactions mechanism Beckmann Baeyer-Villiger", "Stereochemistry R S E Z in multi-step", "Aromaticity Huckel rule heterocycles", "Rearrangements in carbocations and radicals", "Pericyclic reactions Diels-Alder basics"], weightage:0.15, priority:1, target_questions:250 },
  { id:'che_12_ja_inorganic', class:'12', exam:'JEEAdvanced', subject:'Chemistry', chapter:'Inorganic Chemistry', topic:'Inorganic Reactions Advanced', subtopics:["Qualitative analysis cation anion identification", "Transition metal complex reactions ligand exchange", "Oxidation state in complex mixed-valence", "Thermite reaction and metallurgy advanced", "HSAB theory hard soft acids bases"], weightage:0.10, priority:1, target_questions:150 },
  { id:'mat_12_ja_calculus', class:'12', exam:'JEEAdvanced', subject:'Mathematics', chapter:'Calculus', topic:'Calculus Advanced', subtopics:["Continuity differentiability corner cusp", "Leibniz rule for differentiation under integral", "Newton-Leibniz formula", "Improper integrals convergence", "Functions defined by integrals", "Integration by partial fractions with irreducible quadratic"], weightage:0.15, priority:1, target_questions:250 },
  { id:'mat_12_ja_algebra', class:'12', exam:'JEEAdvanced', subject:'Mathematics', chapter:'Algebra', topic:'Algebra Advanced', subtopics:["Complex numbers — nth roots of unity geometry", "Inequalities AM-GM Cauchy-Schwarz", "Matrices — eigenvalues invariant subspace", "Permutations derangements inclusion-exclusion", "Number theory — modular arithmetic", "Functional equations f(x+y)=f(x)+f(y)"], weightage:0.12, priority:1, target_questions:200 },
  { id:'mat_12_ja_coordinate', class:'12', exam:'JEEAdvanced', subject:'Mathematics', chapter:'Coordinate Geometry', topic:'Coordinate Geometry Advanced', subtopics:["Chord of contact pair of tangents from external point", "Locus problems parametric approach", "Ellipse focal chords director circle", "Hyperbola asymptotes rectangular hyperbola", "Family of circles radical axis", "Conics — reflection property optical focus"], weightage:0.12, priority:1, target_questions:200 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 12 — NEET Biology (priority 1)
  // ════════════════════════════════════════════════════════════════
  { id:'bio_12_neet_reproduction', class:'12', exam:'NEET', subject:'Biology', chapter:'Reproduction in Organisms', topic:'Reproduction in Organisms', subtopics:["Asexual reproduction modes binary fission budding", "Sexual reproduction events phases", "Pre-fertilisation structures events gametes", "Fertilisation external internal", "Post-fertilisation zygote development", "Significance of sexual reproduction variation"], weightage:0.05, priority:1, target_questions:120 },
  { id:'bio_12_neet_flower_repro', class:'12', exam:'NEET', subject:'Biology', chapter:'Sexual Reproduction in Flowering Plants', topic:'Flowering Plant Reproduction', subtopics:["Structure of flower stamen pistil", "Microsporogenesis and male gametophyte", "Megasporogenesis and female gametophyte embryo sac", "Pollination types vectors adaptations", "Double fertilisation triple fusion", "Endosperm development types", "Embryo development dicot monocot", "Seed and fruit development apomixis polyembryony"], weightage:0.08, priority:1, target_questions:200 },
  { id:'bio_12_neet_human_repro', class:'12', exam:'NEET', subject:'Biology', chapter:'Human Reproduction', topic:'Human Reproduction', subtopics:["Male reproductive system anatomy spermatogenesis", "Female reproductive system anatomy oogenesis", "Menstrual cycle phases LH FSH", "Fertilisation implantation", "Pregnancy development and parturition", "Hormonal regulation gonadotropins", "Gametogenesis comparison male female", "Placenta functions foetal membranes"], weightage:0.07, priority:1, target_questions:180 },
  { id:'bio_12_neet_genetics', class:'12', exam:'NEET', subject:'Biology', chapter:'Principles of Inheritance and Variation', topic:'Genetics Mendelian', subtopics:["Mendel laws monohybrid dihybrid crosses", "Dominance codominance incomplete dominance", "Multiple alleles ABO blood groups", "Linkage and crossing over chi-square test", "Sex determination XX XY ZW mechanisms", "Mutation chromosomal numerical structural", "Pedigree analysis autosomal X-linked", "Polygenic inheritance continuous variation"], weightage:0.09, priority:1, target_questions:220 },
  { id:'bio_12_neet_molecular', class:'12', exam:'NEET', subject:'Biology', chapter:'Molecular Basis of Inheritance', topic:'Molecular Biology', subtopics:["DNA structure Chargaff rules Watson Crick", "DNA replication semi-conservative Meselson Stahl", "Transcription template strand coding strand", "RNA types mRNA tRNA rRNA functions", "Translation ribosomes codons anticodons", "Genetic code properties — degeneracy non-overlapping", "Regulation of gene expression lac operon", "Human genome project applications"], weightage:0.10, priority:1, target_questions:250 },
  { id:'bio_12_neet_evolution', class:'12', exam:'NEET', subject:'Biology', chapter:'Evolution', topic:'Evolution', subtopics:["Origin of life — Miller Urey experiment", "Darwin's theory natural selection evidence", "Lamarckism vs Darwinism", "Hardy-Weinberg principle allele frequencies", "Types of natural selection directional disruptive", "Speciation allopatric sympatric", "Human evolution Homo sapiens fossils", "Adaptive radiation convergent divergent evolution"], weightage:0.07, priority:1, target_questions:180 },
  { id:'bio_12_neet_health', class:'12', exam:'NEET', subject:'Biology', chapter:'Human Health and Disease', topic:'Human Health and Disease', subtopics:["Innate and adaptive immunity", "B-cells T-cells antibodies", "Active passive immunity vaccination", "AIDS HIV life cycle treatment", "Cancer types oncogenes carcinogens", "Malaria Plasmodium life cycle", "Ascariasis Ringworm Amoebiasis symptoms", "Drug alcohol abuse effects adolescence"], weightage:0.07, priority:1, target_questions:180 },
  { id:'bio_12_neet_biotech', class:'12', exam:'NEET', subject:'Biology', chapter:'Biotechnology', topic:'Biotechnology Principles and Applications', subtopics:["Recombinant DNA technology restriction enzymes", "Gel electrophoresis Southern blotting", "PCR steps Taq polymerase applications", "Plasmids as vectors Ti plasmid", "Transgenic organisms Bt crops", "Gene therapy somatic germline", "ELISA immunoassays diagnostic", "Bioreactors types upstream downstream processing"], weightage:0.08, priority:1, target_questions:200 },
  { id:'bio_12_neet_ecology', class:'12', exam:'NEET', subject:'Biology', chapter:'Ecosystem', topic:'Ecosystem and Environment', subtopics:["Energy flow food chain web trophic levels", "GPP NPP biomass productivity", "Ecological pyramids — number biomass energy", "Biogeochemical cycles carbon nitrogen phosphorus", "Ecosystem services sustainability", "Population growth logistic exponential r K selection", "Community interactions mutualism predation parasitism", "Biodiversity hotspots threats conservation ex-situ in-situ"], weightage:0.08, priority:1, target_questions:200 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 11 — PHYSICS — JEE MAINS (priority 2)
  // ════════════════════════════════════════════════════════════════
  { id:'phy_11_jm_kinematics', class:'11', exam:'JEEMains', subject:'Physics', chapter:'Motion in a Straight Line', topic:'Kinematics 1D', subtopics:["Displacement velocity acceleration definitions", "Equations of motion uniformly accelerated", "Velocity-time graphs area displacement", "Relative velocity 1D", "Reaction time stopping distance", "Free fall and vertical motion", "Non-uniform acceleration integration", "Motion with air resistance basics"], weightage:0.07, priority:2, target_questions:175 },
  { id:'phy_11_jm_kinematics_2d', class:'11', exam:'JEEMains', subject:'Physics', chapter:'Motion in a Plane', topic:'Kinematics 2D and Projectile', subtopics:["Vectors — addition subtraction components", "Projectile motion range time max height", "Oblique projectile on inclined plane", "Uniform circular motion centripetal acceleration", "Angular velocity and angular acceleration", "Relative velocity 2D river-boat problems", "Projectile from moving platform", "Circular motion tangential and normal acceleration"], weightage:0.08, priority:2, target_questions:175 },
  { id:'phy_11_jm_newtons_laws', class:'11', exam:'JEEMains', subject:'Physics', chapter:'Laws of Motion', topic:"Newton's Laws", subtopics:["Newton's first second third law applications", "Free body diagram tension normal force", "Friction static kinetic rolling coefficients", "Inclined plane with and without friction", "Pulley systems multiple blocks Atwood machine", "Pseudo force non-inertial reference frames", "Banking of roads angle of banking", "Constraint motion string inextensible"], weightage:0.09, priority:2, target_questions:200 },
  { id:'phy_11_jm_work_energy', class:'11', exam:'JEEMains', subject:'Physics', chapter:'Work Energy and Power', topic:'Work Energy Theorem', subtopics:["Work done by variable force integration", "Work-energy theorem kinetic energy", "Conservative non-conservative forces", "Potential energy elastic gravitational", "Conservation of mechanical energy", "Power average and instantaneous", "Collision elastic inelastic coefficient of restitution", "Centre of mass velocity after collision"], weightage:0.08, priority:2, target_questions:180 },
  { id:'phy_11_jm_rotation', class:'11', exam:'JEEMains', subject:'Physics', chapter:'Rotational Motion', topic:'Rotational Dynamics', subtopics:["Moment of inertia of standard bodies", "Parallel axis and perpendicular axis theorems", "Torque and angular acceleration τ=Iα", "Angular momentum conservation", "Rolling without slipping conditions", "Rotational kinetic energy", "Gyroscopic effect basics", "Combined rotation and translation"], weightage:0.08, priority:2, target_questions:180 },
  { id:'phy_11_jm_gravitation', class:'11', exam:'JEEMains', subject:'Physics', chapter:'Gravitation', topic:'Gravitation', subtopics:["Newton's law of gravitation G", "Gravitational field and potential", "Escape velocity derivation", "Orbital velocity satellite period", "Kepler's three laws proof derivation", "Gravitational potential energy binding energy", "Variation of g with altitude depth rotation", "Geostationary satellite parking orbit"], weightage:0.07, priority:2, target_questions:160 },
  { id:'phy_11_jm_thermodynamics', class:'11', exam:'JEEMains', subject:'Physics', chapter:'Thermodynamics', topic:'Thermodynamics', subtopics:["First law of thermodynamics ΔU=Q-W", "Isothermal adiabatic isobaric isochoric processes", "PV diagrams work calculation area", "Carnot engine efficiency and theorem", "Second law entropy statements", "Refrigerator COP heat pump", "Specific heat Cp Cv ratio γ for ideal gas", "Mayer's relation Cp-Cv=R"], weightage:0.07, priority:2, target_questions:160 },
  { id:'phy_11_jm_shm', class:'11', exam:'JEEMains', subject:'Physics', chapter:'Oscillations', topic:'Simple Harmonic Motion', subtopics:["Equation of SHM x=A sin(ωt+φ)", "Velocity and acceleration in SHM", "Energy in SHM — KE PE total", "Spring mass system time period", "Simple pendulum period conditions", "Damped and forced oscillations resonance", "Superposition of SHMs same direction", "LC oscillations analogy with SHM"], weightage:0.06, priority:2, target_questions:150 },
  { id:'phy_11_jm_waves', class:'11', exam:'JEEMains', subject:'Physics', chapter:'Waves', topic:'Waves and Sound', subtopics:["Transverse and longitudinal wave properties", "Wave equation y=A sin(kx-ωt)", "Superposition — constructive destructive", "Standing waves on string and in pipe", "Normal modes and harmonics", "Doppler effect source and observer", "Beats — frequency difference", "Speed of sound in medium dependence"], weightage:0.07, priority:2, target_questions:160 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 11 — CHEMISTRY (priority 2)
  // ════════════════════════════════════════════════════════════════
  { id:'che_11_jm_atomic', class:'11', exam:'JEEMains', subject:'Chemistry', chapter:'Structure of Atom', topic:'Atomic Structure', subtopics:["Bohr model postulates energy levels H-atom", "Quantum numbers n l m s definitions", "Aufbau principle Hund rule Pauli exclusion", "Electronic configuration of elements and ions", "Shape of s p d orbitals", "Photoelectric effect and atomic spectra", "de Broglie wavelength of electron", "Heisenberg uncertainty principle"], weightage:0.08, priority:2, target_questions:180 },
  { id:'che_11_jm_bonding', class:'11', exam:'JEEMains', subject:'Chemistry', chapter:'Chemical Bonding', topic:'Chemical Bonding and Molecular Structure', subtopics:["Ionic bond — lattice energy Born-Haber cycle", "Covalent bond — Lewis structure formal charge", "VSEPR theory — molecular geometry", "Hybridisation sp sp2 sp3 sp3d sp3d2", "Molecular orbital theory — bonding antibonding", "Bond order magnetic properties of O2 N2", "Dipole moment polar covalent bonds", "Hydrogen bond effects on properties"], weightage:0.09, priority:2, target_questions:200 },
  { id:'che_11_jm_thermodynamics', class:'11', exam:'JEEMains', subject:'Chemistry', chapter:'Thermodynamics', topic:'Chemical Thermodynamics', subtopics:["System surroundings state functions", "Enthalpy ΔH Hess law application", "Bond enthalpy and bond dissociation energy", "Entropy and spontaneity ΔG=ΔH-TΔS", "Gibbs free energy standard conditions", "Kirchhoff equation Cp vs temperature", "Heat capacity Cv Cp relation", "Spontaneity and thermodynamic equilibrium"], weightage:0.08, priority:2, target_questions:180 },
  { id:'che_11_jm_equilibrium', class:'11', exam:'JEEMains', subject:'Chemistry', chapter:'Equilibrium', topic:'Chemical and Ionic Equilibrium', subtopics:["Law of mass action Kc Kp expressions", "Relation Kp=Kc(RT)^Δn", "Le Chatelier principle applications", "Degree of dissociation and α", "Acids bases — Arrhenius Bronsted Lowry Lewis", "pH calculation strong weak acids bases", "Buffer solutions Henderson-Hasselbalch", "Solubility product Ksp common ion effect"], weightage:0.09, priority:2, target_questions:200 },
  { id:'che_11_jm_organic_basic', class:'11', exam:'JEEMains', subject:'Chemistry', chapter:'Basic Organic Chemistry', topic:'Basic Organic Chemistry', subtopics:["Homologous series functional groups", "IUPAC nomenclature substituted compounds", "Inductive mesomeric hyperconjugation effects", "Carbocations carbanions free radicals stability", "Electrophiles and nucleophiles types", "Reaction mechanisms arrow pushing", "Isomerism structural stereo optical", "Conformations Newman projection cyclohexane"], weightage:0.09, priority:2, target_questions:200 },
  { id:'che_11_jm_hydrocarbons', class:'11', exam:'JEEMains', subject:'Chemistry', chapter:'Hydrocarbons', topic:'Hydrocarbons', subtopics:["Alkanes nomenclature conformations reactions", "Alkenes addition reactions Markovnikov anti-Mark", "Alkynes acidic character reactions", "Benzene aromaticity Huckel 4n+2", "Electrophilic aromatic substitution mechanism", "Friedel-Crafts alkylation acylation", "Petroleum fractions and uses cracking", "Environmental effects of hydrocarbons"], weightage:0.08, priority:2, target_questions:180 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 11 — MATHEMATICS (priority 2)
  // ════════════════════════════════════════════════════════════════
  { id:'mat_11_jm_sets', class:'11', exam:'JEEMains', subject:'Mathematics', chapter:'Sets', topic:'Sets and Venn Diagrams', subtopics:["Set notation roster builder form", "Subset power set universal set", "Union intersection complement", "De Morgan laws verification", "Venn diagrams two three sets", "Cartesian product ordered pairs", "Number of elements in union n(A∪B)", "Applications in probability counting"], weightage:0.04, priority:2, target_questions:100 },
  { id:'mat_11_jm_complex', class:'11', exam:'JEEMains', subject:'Mathematics', chapter:'Complex Numbers', topic:'Complex Numbers', subtopics:["Algebraic operations on complex numbers", "Modulus argument polar form", "de Moivre theorem nth powers roots", "Cube roots of unity ω properties", "Complex conjugate and division", "Geometry on argand plane circle locus", "Triangle inequality complex numbers", "Roots of quadratic with complex coefficients"], weightage:0.07, priority:2, target_questions:160 },
  { id:'mat_11_jm_sequences', class:'11', exam:'JEEMains', subject:'Mathematics', chapter:'Sequences and Series', topic:'AP GP HP and AGP', subtopics:["AP — nth term sum of n terms", "GP — nth term sum finite infinite", "Arithmetic mean geometric mean insertion", "AM-GM inequality applications", "Harmonic progression nth term", "Arithmetic-Geometric Progression sum", "Telescoping series method of differences", "Sum of squares cubes natural numbers"], weightage:0.07, priority:2, target_questions:160 },
  { id:'mat_11_jm_trigonometry', class:'11', exam:'JEEMains', subject:'Mathematics', chapter:'Trigonometric Functions', topic:'Trigonometry', subtopics:["Unit circle definitions of trig functions", "Allied angles complementary supplementary", "Addition formulas sin(A±B) cos(A±B) tan(A±B)", "Double angle triple angle formulas", "Product-to-sum and sum-to-product", "Trigonometric equations general solutions", "Properties of triangles sine cosine rule", "Heights and distances problems"], weightage:0.08, priority:2, target_questions:180 },
  { id:'mat_11_jm_permcomb', class:'11', exam:'JEEMains', subject:'Mathematics', chapter:'Permutations and Combinations', topic:'P and C', subtopics:["Fundamental principle multiplication addition", "Factorial notation permutation nPr", "Combination nCr Pascal triangle", "Circular permutation with restriction", "Selection with repetition", "Distribution of identical distinct objects", "Rank of word in dictionary", "Multinomial coefficient applications"], weightage:0.07, priority:2, target_questions:160 },
  { id:'mat_11_jm_binomial', class:'11', exam:'JEEMains', subject:'Mathematics', chapter:'Binomial Theorem', topic:'Binomial Theorem', subtopics:["Binomial expansion (x+y)^n general term", "Middle term(s) of expansion", "Term independent of x", "Binomial coefficients properties", "Coefficient of x^r in expansion", "Multinomial theorem extension", "Greatest term in binomial expansion", "Approximation using binomial for small x"], weightage:0.06, priority:2, target_questions:140 },
  { id:'mat_11_jm_conics', class:'11', exam:'JEEMains', subject:'Mathematics', chapter:'Conic Sections', topic:'Conic Sections', subtopics:["Circle equation standard general form", "Parabola focus directrix vertex latus rectum", "Ellipse major minor axis eccentricity foci", "Hyperbola transverse conjugate asymptotes", "Tangent normal to conics conditions", "Chord of contact equation external point", "Focal distances and focal chord", "Intersection of line and conic"], weightage:0.09, priority:2, target_questions:200 },
  { id:'mat_11_jm_limits', class:'11', exam:'JEEMains', subject:'Mathematics', chapter:'Limits and Derivatives', topic:'Limits and Derivatives', subtopics:["Definition of limit ε-δ informally", "Standard limits sin(x)/x as x→0", "Limits at infinity polynomial rational", "Indeterminate forms L'Hopital basics", "Continuity at a point left right limits", "First principle derivative definition", "Differentiation rules basic functions", "Applications — slope of tangent"], weightage:0.07, priority:2, target_questions:160 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 11 — BIOLOGY — NEET (priority 2)
  // ════════════════════════════════════════════════════════════════
  { id:'bio_11_neet_cell', class:'11', exam:'NEET', subject:'Biology', chapter:'Cell: The Unit of Life', topic:'Cell Biology', subtopics:["Prokaryotic vs eukaryotic cell structure", "Cell organelles functions — mitochondria chloroplast", "Nucleus structure chromatin chromosomes", "ER Golgi apparatus vesicle transport", "Ribosome types 70S 80S subunits", "Cell membrane fluid mosaic model", "Cell wall composition primary secondary", "Cytoskeleton microfilaments microtubules"], weightage:0.08, priority:2, target_questions:180 },
  { id:'bio_11_neet_biomolecules', class:'11', exam:'NEET', subject:'Biology', chapter:'Biomolecules', topic:'Biomolecules', subtopics:["Carbohydrates mono di polysaccharides", "Proteins amino acid peptide bond levels structure", "Lipids types fatty acids phospholipids sterols", "Nucleic acids structure nucleotides bonds", "Enzymes — active site cofactors inhibition", "Michaelis-Menten kinetics Km Vmax", "Vitamins coenzymes and deficiency diseases", "Metabolic pathways overview"], weightage:0.07, priority:2, target_questions:160 },
  { id:'bio_11_neet_photosynthesis', class:'11', exam:'NEET', subject:'Biology', chapter:'Photosynthesis in Higher Plants', topic:'Photosynthesis', subtopics:["Light reactions Z-scheme cyclic non-cyclic", "Photosystems I and II pigments", "Calvin cycle C3 fixation 3PGA", "C4 pathway Hatch-Slack Kranz anatomy", "CAM plants and their adaptation", "Photorespiration and its significance", "Factors affecting photosynthesis light CO2 temp", "Chemiosmosis and ATP synthesis chloroplast"], weightage:0.08, priority:2, target_questions:180 },
  { id:'bio_11_neet_respiration', class:'11', exam:'NEET', subject:'Biology', chapter:'Respiration in Plants', topic:'Cellular Respiration', subtopics:["Glycolysis steps ATP yield net", "Krebs cycle intermediates NADH FADH2", "Electron transport chain and oxidative phosphorylation", "ATP yield aerobic vs anaerobic", "Fermentation lactic acid alcoholic", "Respiratory quotient RQ calculation", "Amphibolic nature of respiratory intermediates", "P/O ratio and chemiosmosis"], weightage:0.08, priority:2, target_questions:180 },
  { id:'bio_11_neet_digestion', class:'11', exam:'NEET', subject:'Biology', chapter:'Digestion and Absorption', topic:'Digestion and Absorption', subtopics:["Alimentary canal parts and functions", "Enzymes salivary pancreatic intestinal", "Absorption mechanisms in small intestine", "Large intestine colon water absorption", "Liver functions bile salts emulsification", "Peristalsis and segmentation movements", "Nutritional disorders malnutrition obesity", "Digestive hormones gastrin CCK secretin"], weightage:0.07, priority:2, target_questions:160 },
  { id:'bio_11_neet_neural', class:'11', exam:'NEET', subject:'Biology', chapter:'Neural Control and Coordination', topic:'Nervous System', subtopics:["Neuron structure and types", "Resting membrane potential and action potential", "Synapse types and neurotransmitters", "CNS brain parts and functions", "PNS sympathetic parasympathetic", "Reflex arc and reflex action", "Sensory receptors eye ear nose", "Disorders Alzheimer's Parkinson's basics"], weightage:0.07, priority:2, target_questions:160 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 10 — BOARD (priority 3)
  // ════════════════════════════════════════════════════════════════
  { id:'sci_10_board_electricity', class:'10', exam:'Board', subject:'Science', chapter:'Electricity', topic:'Electricity Class 10', subtopics:["Electric charge current potential difference", "Ohm's law V=IR resistance calculation", "Series parallel circuits equivalent resistance", "Joule's heating effect applications", "Power dissipation P=V²/R=I²R", "Electric energy units kWh calculation", "Fuse earthing safety", "Fleming left hand rule motor effect"], weightage:0.12, priority:3, target_questions:200 },
  { id:'sci_10_board_magnetism', class:'10', exam:'Board', subject:'Science', chapter:'Magnetic Effects', topic:'Magnetic Effects of Current', subtopics:["Magnetic field due to straight wire", "Right hand thumb rule direction", "Solenoid as bar magnet", "Force on current carrying conductor", "Electric motor working principle", "Electromagnetic induction Faraday basics", "Electric generator AC DC", "Domestic electric circuits wiring"], weightage:0.10, priority:3, target_questions:180 },
  { id:'sci_10_board_light', class:'10', exam:'Board', subject:'Science', chapter:'Light', topic:'Light Reflection and Refraction', subtopics:["Laws of reflection spherical mirrors", "Mirror formula and magnification m=v/u", "Refraction — laws Snell's law", "Lens formula and magnification lenses", "Power of lens dioptre combination", "Total internal reflection applications", "Dispersion of white light spectrum", "Human eye vision defects correction"], weightage:0.12, priority:3, target_questions:200 },
  { id:'sci_10_board_life_proc', class:'10', exam:'Board', subject:'Science', chapter:'Life Processes', topic:'Life Processes', subtopics:["Nutrition autotrophic heterotrophic", "Photosynthesis chlorophyll light dark reaction simple", "Respiration aerobic anaerobic ATP", "Transportation in plants xylem phloem", "Transportation in humans circulatory system", "Excretion nephron kidney urine", "Gaseous exchange alveoli gills", "Osmoregulation basics"], weightage:0.10, priority:3, target_questions:180 },
  { id:'sci_10_board_control', class:'10', exam:'Board', subject:'Science', chapter:'Control and Coordination', topic:'Control and Coordination', subtopics:["Nervous system brain spinal cord reflexes", "Endocrine glands hormones functions", "Tropisms phototropism geotropism", "Feedback mechanisms hormonal", "Adrenaline and emergency response", "Insulin glucagon diabetes", "Thyroid PTH calcitonin", "Reproductive hormones puberty"], weightage:0.09, priority:3, target_questions:160 },
  { id:'sci_10_board_heredity', class:'10', exam:'Board', subject:'Science', chapter:'Heredity and Evolution', topic:'Heredity and Evolution', subtopics:["Mendel pea plant experiments results", "Dominant recessive traits monohybrid cross", "Sex determination chromosomes", "Evolution Darwin natural selection", "Speciation and isolation mechanisms", "Fossils as evidence of evolution", "Homologous analogous structures", "Human evolution Homo sapiens stages"], weightage:0.09, priority:3, target_questions:160 },
  { id:'mat_10_board_poly', class:'10', exam:'Board', subject:'Mathematics', chapter:'Polynomials', topic:'Polynomials Class 10', subtopics:["Zeros of polynomial graphical meaning", "Relationship between zeros coefficients", "Division algorithm for polynomials", "Quadratic polynomial factorization", "Cubic polynomial zeros sum product", "Factor theorem remainder theorem", "Graph of polynomial functions degree", "Applications of polynomials in problems"], weightage:0.08, priority:3, target_questions:150 },
  { id:'mat_10_board_quadratic', class:'10', exam:'Board', subject:'Mathematics', chapter:'Quadratic Equations', topic:'Quadratic Equations', subtopics:["Standard form ax²+bx+c=0", "Factorisation method for quadratics", "Completing the square method", "Quadratic formula derivation application", "Discriminant D=b²-4ac nature of roots", "Sum and product of roots relations", "Word problems quadratic modeling", "Quadratic inequalities solution"], weightage:0.09, priority:3, target_questions:160 },
  { id:'mat_10_board_triangles', class:'10', exam:'Board', subject:'Mathematics', chapter:'Triangles', topic:'Triangles Class 10', subtopics:["Similar triangles criteria AA SAS SSS", "Basic proportionality theorem and converse", "Areas ratio of similar triangles", "Pythagoras theorem proof and converse", "Trigonometric ratios definitions", "Trigonometric identities sin²+cos²=1", "Heights and distances tan θ applications", "Angle of elevation depression problems"], weightage:0.10, priority:3, target_questions:180 },
  { id:'mat_10_board_probability', class:'10', exam:'Board', subject:'Mathematics', chapter:'Probability', topic:'Probability Class 10', subtopics:["Classical probability P=m/n", "Sample space events complementary", "Coin dice card experiments", "Probability of compound events", "Mutually exclusive events", "Equally likely outcomes", "Theoretical vs experimental probability", "Word problems using probability"], weightage:0.07, priority:3, target_questions:130 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 9 — BOARD (priority 4)
  // ════════════════════════════════════════════════════════════════
  { id:'sci_9_board_motion', class:'9', exam:'Board', subject:'Science', chapter:'Motion', topic:'Motion Class 9', subtopics:["Distance displacement scalars vectors", "Speed velocity average instantaneous", "Uniform non-uniform motion", "Equations of motion derivation v=u+at s=ut+½at²", "Velocity-time graphs slope area", "Circular motion uniform centripetal", "Free fall acceleration g=9.8 m/s²", "Relative motion basics"], weightage:0.12, priority:4, target_questions:180 },
  { id:'sci_9_board_force', class:'9', exam:'Board', subject:'Science', chapter:'Force and Laws of Motion', topic:'Force and Newton Laws Class 9', subtopics:["Balanced unbalanced forces", "Newton's first law inertia mass", "Newton's second law F=ma calculation", "Newton's third law action-reaction pairs", "Conservation of momentum derivation", "Friction — types factors affecting", "Weight mass gravity g on different planets", "Applications of laws vehicles sports"], weightage:0.11, priority:4, target_questions:160 },
  { id:'sci_9_board_atoms', class:'9', exam:'Board', subject:'Science', chapter:'Atoms and Molecules', topic:'Atoms and Molecules Class 9', subtopics:["Dalton's atomic theory postulates", "Atomic mass relative scale", "Molecules and formulae writing", "Mole concept Avogadro number", "Molar mass calculation", "Percentage composition empirical formula", "Chemical reactions balancing equations", "Laws of conservation of mass"], weightage:0.10, priority:4, target_questions:150 },
  { id:'mat_9_board_algebra', class:'9', exam:'Board', subject:'Mathematics', chapter:'Algebraic Expressions', topic:'Algebra Class 9', subtopics:["Algebraic expressions terms degree", "Polynomials addition subtraction", "Multiplication of polynomials FOIL", "Factorisation identities (a+b)² a²-b²", "Remainder factor theorem basic", "Linear equations in two variables", "Graphing lines on Cartesian plane", "Word problems linear equations"], weightage:0.10, priority:4, target_questions:150 },
  { id:'mat_9_board_geometry', class:'9', exam:'Board', subject:'Mathematics', chapter:'Geometry', topic:'Geometry Class 9', subtopics:["Lines and angles vertically opposite alternate", "Transversal parallel lines properties", "Triangles congruence criteria SSS SAS AAS", "Isosceles triangle properties theorem", "Quadrilaterals parallelogram properties", "Midpoint theorem and converse", "Area of triangles parallelograms", "Circles chord diameter arc properties"], weightage:0.10, priority:4, target_questions:150 },
  { id:'mat_9_board_statistics', class:'9', exam:'Board', subject:'Mathematics', chapter:'Statistics', topic:'Statistics Class 9', subtopics:["Collection organisation of data", "Bar graphs histograms frequency polygons", "Mean of grouped ungrouped data", "Median mode calculation", "Mean deviation basics", "Probability introduction classical", "Graphical representation pie chart", "Interpretation of data graphs"], weightage:0.08, priority:4, target_questions:120 },

  // ════════════════════════════════════════════════════════════════
  // CLASS 8 — BOARD (priority 5)
  // ════════════════════════════════════════════════════════════════
  { id:'sci_8_board_force', class:'8', exam:'Board', subject:'Science', chapter:'Force and Pressure', topic:'Force and Pressure Class 8', subtopics:["Types of forces contact non-contact", "Pressure definition P=F/A applications", "Atmospheric pressure barometer", "Liquid pressure Pascal law basics", "Buoyancy Archimedes principle", "Friction types advantages disadvantages", "Magnetic force attraction repulsion", "Gravitational force weight basics"], weightage:0.15, priority:5, target_questions:200 },
  { id:'sci_8_board_light', class:'8', exam:'Board', subject:'Science', chapter:'Light', topic:'Light Class 8', subtopics:["Rectilinear propagation shadows", "Laws of reflection regular diffuse", "Plane mirror image characteristics", "Kaleidoscope periscope applications", "Dispersion of light rainbow colours", "Human eye parts functions", "Braille system and visually impaired", "Luminous non-luminous objects"], weightage:0.12, priority:5, target_questions:160 },
  { id:'mat_8_board_rational', class:'8', exam:'Board', subject:'Mathematics', chapter:'Rational Numbers', topic:'Rational Numbers Class 8', subtopics:["Rational number p/q definition", "Properties closure associativity commutativity", "Additive multiplicative identity inverse", "Representation on number line", "Comparison ordering rational numbers", "Operations addition subtraction multiplication", "Division of rational numbers", "Standard form of rational numbers"], weightage:0.12, priority:5, target_questions:160 },
  { id:'mat_8_board_algebra', class:'8', exam:'Board', subject:'Mathematics', chapter:'Algebraic Expressions and Identities', topic:'Algebra Class 8', subtopics:["Algebraic expressions monomials binomials", "Addition subtraction of polynomials", "Multiplication of polynomials", "Standard identities (a+b)² (a-b)² (a+b)(a-b)", "Applying identities to calculations", "Factorisation using identities", "HCF of algebraic expressions", "Simple linear equations solution"], weightage:0.12, priority:5, target_questions:160 },
  { id:'mat_8_board_mensuration', class:'8', exam:'Board', subject:'Mathematics', chapter:'Mensuration', topic:'Mensuration Class 8', subtopics:["Area of trapezium general quadrilateral", "Area of polygon by triangulation", "Surface area of cuboid cube cylinder", "Volume of cuboid cube cylinder", "Surface area and volume of cone sphere", "Converting units of area volume", "Real world applications packaging", "Composite 3D shapes problems"], weightage:0.12, priority:5, target_questions:160 },

  // ════════════════════════════════════════════════════════════════════
  // JEE ADVANCED EXTRA TOPICS — Beyond NCERT scope (priority 1)
  // Confirmed present in JEE Advanced but NOT in standard NCERT textbooks
  // ════════════════════════════════════════════════════════════════════

  // ── Mathematics Extras ───────────────────────────────────────────────
  { id:'mat_adv_number_theory', class:'12', exam:'JEEAdvanced', subject:'Mathematics',
    chapter:'Number Theory', topic:'Number Theory and Modular Arithmetic',
    subtopics:[
      'Divisibility rules and Euclid GCD algorithm',
      'Prime factorization and number of divisors formula',
      'Modular arithmetic congruences a≡b(mod n)',
      'Fermats little theorem and applications',
      'Chinese remainder theorem',
      'Last digit and last two digits of large powers',
      'Largest power of prime p in n! — Legendres formula',
      'Sum of digits and digital root properties',
    ], weightage:0.04, priority:1, target_questions:80 },

  { id:'mat_adv_functional_eq', class:'12', exam:'JEEAdvanced', subject:'Mathematics',
    chapter:'Functional Equations', topic:'Functional Equations',
    subtopics:[
      'Cauchy functional equation f(x+y)=f(x)+f(y) solutions',
      'Jensen inequality and convex functions',
      'Multiplicative functional equations f(xy)=f(x)f(y)',
      'Symmetric equations f(x)+f(1-x)=k',
      'Recursive function definitions and closed form',
      'Determining period and symmetry from functional equations',
      'Functions on rationals vs reals — regularity conditions',
    ], weightage:0.03, priority:1, target_questions:60 },

  { id:'mat_adv_inequalities', class:'12', exam:'JEEAdvanced', subject:'Mathematics',
    chapter:'Inequalities', topic:'Classical Inequalities',
    subtopics:[
      'AM-GM inequality proof and equality condition',
      'Cauchy-Schwarz inequality (Σai²)(Σbi²)≥(Σaibi)²',
      'Power mean inequality chain HM≤GM≤AM≤QM',
      'Chebyshev sum inequality for monotone sequences',
      'Rearrangement inequality and applications',
      'Jensen inequality for convex functions — applications',
      'Geometric inequalities — triangle sides and altitudes',
      'Optimization without calculus using inequalities',
    ], weightage:0.04, priority:1, target_questions:80 },

  { id:'mat_adv_combinatorics', class:'12', exam:'JEEAdvanced', subject:'Mathematics',
    chapter:'Advanced Combinatorics', topic:'Advanced Combinatorics',
    subtopics:[
      'Derangements Dn formula and recurrence Dn=(n-1)(Dn-1+Dn-2)',
      'Inclusion-exclusion principle — multi-set applications',
      'Catalan numbers and ballot problem',
      'Integer partition into distinct/equal parts',
      'Pigeonhole principle — advanced coloring/geometry applications',
      'Burnside lemma and counting under symmetry',
      'Generating functions — ordinary and exponential',
      'Stars and bars with forbidden value restrictions',
    ], weightage:0.04, priority:1, target_questions:80 },

  { id:'mat_adv_complex_geom', class:'12', exam:'JEEAdvanced', subject:'Mathematics',
    chapter:'Complex Number Geometry', topic:'Complex Numbers as Geometry',
    subtopics:[
      'Complex numbers as 2D vectors rotation by eiθ multiplication',
      'Rotation formula z2=z1·e^(iθ) — triangle problems',
      'Equilateral triangle condition on complex plane',
      'Ptolemys theorem via complex number cross-ratio',
      'Finding centroid circumcenter using complex coordinates',
      'Locus problems on Argand plane — circle and line forms',
      'Möbius (bilinear) transformation w=(az+b)/(cz+d) basics',
    ], weightage:0.03, priority:1, target_questions:60 },

  // ── Physics Extras ────────────────────────────────────────────────────
  { id:'phy_adv_advanced_mech', class:'12', exam:'JEEAdvanced', subject:'Physics',
    chapter:'Advanced Mechanics', topic:'Advanced Classical Mechanics',
    subtopics:[
      'Center of mass frame — velocities and collision in CM frame',
      'Reduced mass for two-body problem μ=m1m2/(m1+m2)',
      'Rocket propulsion variable mass thrust equation',
      'Non-uniform rotation — angular acceleration torque problems',
      'Compound physical pendulum — period I/Mgl',
      'Coupled oscillators and normal modes',
      'Damped oscillation energy decay Q-factor',
      'Pseudo force problems — rotating reference frames',
    ], weightage:0.05, priority:1, target_questions:100 },

  { id:'phy_adv_advanced_electro', class:'12', exam:'JEEAdvanced', subject:'Physics',
    chapter:'Advanced Electrostatics and Circuits', topic:'Advanced Electrostatics and Circuits',
    subtopics:[
      'Method of images — charge near grounded plane/sphere',
      'Potential energy of continuous charge distributions',
      'Capacitor with multiple dielectrics and conducting slabs',
      'Star-delta network transformation Kirchhoff complex',
      'Wheatstone bridge unbalanced — galvanometer current by Kirchhoff',
      'RC circuit with multiple capacitors — energy dissipated',
      'Transient analysis LC and LCR circuit differential equations',
      'Resonance in LCR — half-power frequencies and Q-factor',
    ], weightage:0.05, priority:1, target_questions:100 },

  { id:'phy_adv_waves_advanced', class:'12', exam:'JEEAdvanced', subject:'Physics',
    chapter:'Advanced Waves', topic:'Advanced Wave Physics',
    subtopics:[
      'Doppler effect for accelerating source — instantaneous frequency',
      'Shock waves — Mach number and Mach cone geometry',
      'Interference in thin films — multiple reflections and phase shifts',
      'Wave packets — phase velocity vs group velocity vg=dω/dk',
      'Beats in 2D — Lissajous figures conditions',
      'Resonance in 3D cavities and organ pipes with end correction',
      'Non-sinusoidal waves and Fourier components (qualitative)',
      'Diffraction limit of resolution — Rayleigh criterion',
    ], weightage:0.04, priority:1, target_questions:80 },

  // ── Chemistry Extras ──────────────────────────────────────────────────
  { id:'che_adv_advanced_organic', class:'12', exam:'JEEAdvanced', subject:'Chemistry',
    chapter:'Advanced Organic Mechanisms', topic:'Advanced Organic Chemistry',
    subtopics:[
      'Pinacol-pinacolone and Wagner-Meerwein rearrangements',
      'Diels-Alder [4+2] cycloaddition — endo/exo stereo',
      'Electrocyclic reactions — Woodward-Hoffmann thermal/photochemical',
      'Sigmatropic rearrangements — [1,3] [1,5] Cope Claisen',
      'Neighbouring group participation and anchimeric assistance',
      'Norrish Type I and Type II photochemical reactions',
      'Asymmetric synthesis — enantioselective and chiral catalysis',
      'Multi-step retrosynthesis — 4 to 5 step disconnection problems',
    ], weightage:0.06, priority:1, target_questions:120 },

  { id:'che_adv_advanced_physical', class:'12', exam:'JEEAdvanced', subject:'Chemistry',
    chapter:'Advanced Physical Chemistry', topic:'Advanced Physical Chemistry',
    subtopics:[
      'Phase diagrams one-component — triple point supercritical',
      'Two-component phase diagrams eutectic lever rule',
      'Gibbs phase rule F=C-P+2 — applications',
      'Colligative properties with activity coefficients non-ideal',
      'Concentration cells and transference numbers',
      'Decomposition potential and electrode overvoltage',
      'Complex kinetic mechanisms — steady state approximation SSA',
      'Quantum yield and Stark-Einstein law of photochemistry',
    ], weightage:0.05, priority:1, target_questions:100 },

  // ════════════════════════════════════════════════════════════════════
  // NEET EXTRA TOPICS — deeper concepts tested in recent NEET papers
  // ════════════════════════════════════════════════════════════════════

  { id:'bio_neet_extra_plantphys', class:'11', exam:'NEET', subject:'Biology',
    chapter:'Plant Physiology Advanced', topic:'Plant Physiology Advanced NEET',
    subtopics:[
      'Water potential Ψ=Ψs+Ψp — osmosis quantitative',
      'Ascent of sap — cohesion-tension transpiration pull theory',
      'Mineral deficiency symptoms — specific element identification',
      'Biological nitrogen fixation — nif genes symbiosis details',
      'Phytohormones — site of synthesis targets detailed comparison',
      'Seed dormancy types and germination triggers light/temperature',
      'Vernalisation — mechanism and crop applications',
      'Stomatal opening — guard cell K+ ion pump mechanism',
    ], weightage:0.04, priority:2, target_questions:80 },

  { id:'bio_neet_extra_genetics', class:'12', exam:'NEET', subject:'Biology',
    chapter:'Advanced Genetics NEET', topic:'Advanced Genetics for NEET',
    subtopics:[
      'Gene mapping — recombination frequency Morgan units centiMorgan',
      'Epistasis types — dominant recessive hypostatic hypostasis',
      'Pleiotropy — single gene multiple phenotype effects',
      'Genomic imprinting — Prader-Willi Angelman syndromes',
      'Transposons and mobile genetic elements Barbara McClintock',
      'Chromosomal disorders — trisomy monosomy non-disjunction types',
      'DNA repair mechanisms — mismatch repair nucleotide excision repair',
      'RNA interference — siRNA miRNA mechanism and gene silencing',
    ], weightage:0.04, priority:1, target_questions:80 },

  { id:'bio_neet_extra_biotech2', class:'12', exam:'NEET', subject:'Biology',
    chapter:'Biotechnology Applications Advanced', topic:'Biotechnology Advanced NEET',
    subtopics:[
      'CRISPR-Cas9 — mechanism guide RNA PAM sequence',
      'DNA fingerprinting — VNTR RFLP STR applications',
      'Transgenic animals — Rosie cow pharming applications',
      'Golden rice — lycopene pathway β-carotene engineering',
      'Bioreactor design — fed-batch stirred tank aeration',
      'Downstream processing — clarification purification formulation',
      'Biosafety — GMO regulation biosafety guidelines India',
      'Ethical issues in biotechnology — cloning GM crops debate',
    ], weightage:0.03, priority:1, target_questions:60 },

];

// ─── Distribution Targets (auto-aggregated from TAXONOMY) ──────────────────
export interface DistributionTarget {
  class: string;
  exam: string;
  subject: string;
  total_target: number;
  topics_count: number;
}

export function getDistributionTargets(): DistributionTarget[] {
  const map = new Map<string, DistributionTarget>();
  for (const t of TAXONOMY) {
    const key = `${t.class}|${t.exam}|${t.subject}`;
    if (!map.has(key)) map.set(key, { class: t.class, exam: t.exam, subject: t.subject, total_target: 0, topics_count: 0 });
    const d = map.get(key)!;
    d.total_target += t.target_questions;
    d.topics_count += 1;
  }
  return [...map.values()].sort((a,b) => Number(b.class) - Number(a.class) || a.exam.localeCompare(b.exam));
}

export function getDeficitTopics(completedCounts: Record<string, number>): { topic: TopicNode; deficit: number }[] {
  return TAXONOMY
    .map(t => ({ topic: t, deficit: t.target_questions - (completedCounts[t.id] || 0) }))
    .filter(x => x.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit);
}



export function getTotalTarget(): number {
  return TAXONOMY.reduce((s, t) => s + t.target_questions, 0);
}

export function getTopicsForClass(cls: string, exam?: string): TopicNode[] {
  return TAXONOMY.filter(t => t.class === cls && (!exam || t.exam === exam));
}

export function getPriorityOrder(): TopicNode[] {
  return [...TAXONOMY].sort((a, b) => a.priority - b.priority || b.target_questions - a.target_questions);
}

export function getTopicById(id: string): TopicNode | undefined {
  return TAXONOMY.find(t => t.id === id);
}

// Print summary
if (import.meta.url === `file://${process.argv[1]}`) {
  const total = getTotalTarget();
  console.log(`\n📚 CURRICULUM TAXONOMY SUMMARY`);
  console.log(`   Total topics: ${TAXONOMY.length}`);
  console.log(`   Total question target: ${total.toLocaleString()}`);
  console.log(`\nDistribution by class:`);
  const byClass = new Map<string, number>();
  for (const t of TAXONOMY) {
    byClass.set(t.class, (byClass.get(t.class) || 0) + t.target_questions);
  }
  for (const [cls, target] of [...byClass.entries()].sort((a,b) => Number(b[0]) - Number(a[0]))) {
    const pct = (target / total * 100).toFixed(1);
    console.log(`   Class ${cls}: ${target.toLocaleString()} questions (${pct}%)`);
  }
}
