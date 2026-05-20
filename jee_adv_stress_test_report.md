# High-Concurrency JEE/NEET STEM Curation Stress Test Report

Generated on: 20/5/2026, 1:22:19 pm
*   **Syllabus Target**: Class 11 and 12 STEM (JEE Main, JEE Advanced, and NEET)
*   **Parallel Pool Workers**: `5` workers
*   **Router Global Concurrency Cap**: `3` global in-flight slots
*   **Total Elapsed Time**: `145.7 seconds` (Avg: `7s` per question)

## Executive Dashboard
| Total Tested | ✅ Approved (First Pass) | 🔧 Approved (Self-Healed) | ❌ Rejected | Correctness Rate | Concurrency Stability |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 20 | 18 | 2 | 0 | 100% | 100% Stable (0 Lockups) |

## Curation Protocol & Router Verification
1. **Gemma 4** acts as Ingestion Synthesizer, translating raw markdown and messy public questions into high-fidelity rigorous LaTeX.
2. **Llama-3.3-70b** (via Wafer-Scale Cerebras Wafer Engine or Groq versatile) solves the question independently.
3. **Gemini 2.5 Flash** acts as the consensus referee, approving or rejecting the alignment of correctness and formatting.
4. **Key Rotation & Cooldowns**: Successfully handled rate limiting, rotations, and transient errors under high concurrent loads.

---

## Curated STEM Question Database

### Topic 1: Rotational Dynamics [Class 11 - Physics]
*   **Subtopic**: `Rolling with slipping on a fixed inclined plane with kinetic friction`
*   **Cognitive Difficulty**: `BAND 12 — Expert Analytical Synthesis` (ELO: 2950)
*   **Standard Error Trap**: `physics.mechanics.coupling_error`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
A solid sphere of mass M and radius R starts from rest and rolls with slipping down a fixed inclined plane of angle theta. The coefficient of kinetic friction between the sphere and plane is mu_k. Find the linear acceleration of the centre of mass.
Options: a) a = g*sin(theta) - (5/7)*mu_k*g*cos(theta), b) a = (5/7)*g*sin(theta), c) a = g*(sin(theta) - mu_k*cos(theta)), d) a = g*sin(theta) - (5/2)*mu_k*g*cos(theta)
```

#### Curated & Typeset Question (LaTeX)
> A solid sphere of mass $M$ and radius $R$ starts from rest and rolls with slipping down a fixed inclined plane that makes an angle $\theta$ with the horizontal. The coefficient of kinetic friction between the sphere and the plane is $\mu_k$. Find the linear acceleration $a$ of the centre of mass of the sphere.

#### Options List
1. $a = g\sin\theta - \frac{5}{7}\mu_k g\cos\theta$
2. $a = \frac{5}{7}g\sin\theta$
3. $a = g\bigl(\sin\theta - \mu_k\cos\theta\bigr)$
4. $a = g\sin\theta - \frac{5}{2}\mu_k g\cos\theta$

*   **Generator Declared Correct**: `$a = g\bigl(\sin\theta - \mu_k\cos\theta\bigr)$`
*   **Solver Derived Option**: `a = g\bigl(\sin\theta - \mu_k\cos\theta\bigr)`
*   **Primary Governing Formula**: `$$$Ma = Mg\sin\theta - \mu_k Mg\cos\theta$$$`
*   **Given Parameters**: `{"M":"mass of the sphere","R":"radius of the sphere","\\theta":"inclination angle","\\mu_k":"coefficient of kinetic friction","g":"acceleration due to gravity"}`
*   **Auditable Numerical Target**: `0 m/s^2`

#### Step-by-Step Solver Derivation
```latex
Consider a solid sphere of mass M and radius R on an incline of angle \theta. Let the positive direction be down the plane. The forces on the sphere are:\n1. Gravitational component down the plane: $F_g = Mg\sin\theta$.\n2. Normal reaction $N = Mg\cos\theta$ (perpendicular to the plane).\n3. Kinetic friction $f_k$, which opposes the relative motion at the contact point. Since the sphere initially slides down the plane, the relative motion at the contact is downwards, therefore the kinetic friction acts **up** the plane with magnitude $f_k = \mu_k N = \mu_k Mg\cos\theta$.\n\nWrite Newton’s second law for translation (down the plane positive):\n$$ Mg\,a = Mg\sin\theta - f_k $$\nSubstituting $f_k$ gives\n$$ a = g\sin\theta - \mu_k g\cos\theta. $$\n\nFor rotation about the centre, the torque due to friction is $\tau = f_k R$ (tending to spin the sphere forward). Using the moment of inertia of a solid sphere $I = \frac{2}{5}MR^2$,\n$$ I\,\alpha = f_k R \quad\Rightarrow\quad \alpha = \frac{f_k R}{I}=\frac{\mu_k Mg\cos\theta\,R}{(2/5)MR^2}=\frac{5}{2}\frac{\mu_k g\cos\theta}{R}. $$\nThe angular acceleration is not needed for the linear acceleration because the sphere is slipping (the no‑slip condition $a=\alpha R$ does not hold). The linear acceleration derived from the translational equation is therefore the correct result.\n\nCheck limiting cases:\n- If $\mu_k=0$, $a = g\sin\theta$, the expected acceleration for a frictionless slide.\n- For $\mu_k>0$, the friction term subtracts from $g\sin\theta$, reducing the acceleration, as expected.\nThus the correct expression matches option 3.\n\nAll units are consistent (each term has dimensions of acceleration).
```

#### Explanatory Curation
> 1. Identify the forces along the incline: weight component $Mg\sin\theta$ down the plane and kinetic friction $f_k=\mu_k Mg\cos\theta$ up the plane.\\n2. Write Newton's second law for translation: $Ma = Mg\sin\theta - f_k$.\\n3. Substitute $f_k$ and cancel $M$: $a = g\sin\theta - \mu_k g\cos\theta$.\\n4. No pure‑rolling condition $a=\alpha R$ is used because the sphere is slipping; friction only provides a torque but does not affect the translational equation.

----

### Topic 2: Electromagnetic Induction [Class 12 - Physics]
*   **Subtopic**: `Expanding circular loop in a non-uniform decaying magnetic field with dual-source EMF`
*   **Cognitive Difficulty**: `BAND 12 — Multi-Layer Differential Integration` (ELO: 2900)
*   **Standard Error Trap**: `physics.electromagnetism.induced_emf.sign_error`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
A thin conducting circular loop of resistance r_0 lies in the xy-plane with centre at origin. Its radius expands linearly as R(t) = R0 + v0*t. A non-uniform time-varying magnetic field perpendicular to the loop plane is given by B(x,y,t) = B0*(1 + alpha*(x^2+y^2))*exp(-beta*t). Find the induced current I(t).
Options: 1] I(t) = (pi*B0*exp(-beta*t)/r0) * [beta*(R(t)^2 + alpha/2 * R(t)^4) - 2*R(t)*v0*(1 + alpha*R(t)^2)], 2] I(t) = (pi*B0*exp(-beta*t)/r0) * [beta*(R(t)^2 + alpha/2 * R(t)^4) + 2*R(t)*v0*(1 + alpha*R(t)^2)], 3] I(t) = (pi*B0*exp(-beta*t)/r0) * [beta*R(t)^2 - 2*R(t)*v0], 4] I(t) = (pi*B0*beta*R0^2*exp(-beta*t))/r0
```

#### Curated & Typeset Question (LaTeX)
> A thin conducting circular loop of resistance $r_{0}$ lies in the $xy$‑plane with its centre at the origin. Its radius expands linearly as $R(t)=R_{0}+v_{0}t$. A non‑uniform, time‑varying magnetic field perpendicular to the loop plane is given by $$B(x,y,t)=B_{0}\bigl(1+\alpha (x^{2}+y^{2})\bigr)e^{-\beta t}.$$ Find the induced current $I(t)$ in the loop.

#### Options List
1. $I(t)=\frac{\pi B_{0}e^{-\beta t}}{r_{0}}\left[\beta\left(R(t)^{2}+\frac{\alpha}{2}R(t)^{4}\right)-2R(t)v_{0}\left(1+\alpha R(t)^{2}\right)\right]$
2. $I(t)=\frac{\pi B_{0}e^{-\beta t}}{r_{0}}\left[\beta\left(R(t)^{2}+\frac{\alpha}{2}R(t)^{4}\right)+2R(t)v_{0}\left(1+\alpha R(t)^{2}\right)\right]$
3. $I(t)=\frac{\pi B_{0}e^{-\beta t}}{r_{0}}\left[\beta R(t)^{2}-2R(t)v_{0}\right]$
4. $I(t)=\frac{\pi B_{0}\beta R_{0}^{2}e^{-\beta t}}{r_{0}}$

*   **Generator Declared Correct**: `$I(t)=\frac{\pi B_{0}e^{-\beta t}}{r_{0}}\left[\beta\left(R(t)^{2}+\frac{\alpha}{2}R(t)^{4}\right)-2R(t)v_{0}\left(1+\alpha R(t)^{2}\right)\right]$`
*   **Solver Derived Option**: `I(t)=\frac{\pi B_{0}e^{-\beta t}}{r_{0}}\left[\beta\left(R(t)^{2}+\frac{\alpha}{2}R(t)^{4}\right)-2R(t)v_{0}\left(1+\alpha R(t)^{2}\right)\right]`
*   **Primary Governing Formula**: `$$$\Phi(t)=\pi B_{0}e^{-\beta t}\left[R(t)^{2}+\frac{\alpha}{2}R(t)^{4}\right]$$$`
*   **Given Parameters**: `{"r_{0}":"resistance of the loop","R_{0}":"initial radius","v_{0}":"constant radial expansion speed","B_{0}":"magnetic field amplitude","α":"spatial non‑uniformity coefficient","β":"temporal decay constant"}`
*   **Auditable Numerical Target**: `0 A`

#### Step-by-Step Solver Derivation
```latex
The magnetic flux through the expanding circular loop is\n\[\Phi(t)=\int_{0}^{R(t)}\int_{0}^{2\pi} B_{0}\bigl(1+\alpha r^{2}\bigr)e^{-\beta t}\,r\,d\theta\,dr\n=2\pi B_{0}e^{-\beta t}\int_{0}^{R(t)}\bigl(r+\alpha r^{3}\bigr)dr\n=2\pi B_{0}e^{-\beta t}\left[\frac{r^{2}}{2}+\frac{\alpha r^{4}}{4}\right]_{0}^{R(t)}\n=\pi B_{0}e^{-\beta t}\Bigl(R^{2}+\frac{\alpha}{2}R^{4}\Bigr),\]\nwhere \(R(t)=R_{0}+v_{0}t\).  The induced emf follows Faraday's law \(\varepsilon=-\frac{d\Phi}{dt}\):\n\[\frac{d\Phi}{dt}=\pi B_{0}\frac{d}{dt}\Bigl[e^{-\beta t}\bigl(R^{2}+\frac{\alpha}{2}R^{4}\bigr)\Bigr]\n=\pi B_{0}e^{-\beta t}\Bigl[-\beta\bigl(R^{2}+\frac{\alpha}{2}R^{4}\bigr)+\frac{d}{dt}\bigl(R^{2}+\frac{\alpha}{2}R^{4}\bigr)\Bigr].\]\nSince \(\frac{d}{dt}(R^{2}+\frac{\alpha}{2}R^{4})=(2R+2\alpha R^{3})\,\dot R\n=2Rv_{0}(1+\alpha R^{2})\),\n\[\frac{d\Phi}{dt}=\pi B_{0}e^{-\beta t}\Bigl[-\beta\bigl(R^{2}+\frac{\alpha}{2}R^{4}\bigr)+2Rv_{0}(1+\alpha R^{2})\Bigr].\]\nThus the emf is\n\[\varepsilon=-\frac{d\Phi}{dt}=\pi B_{0}e^{-\beta t}\Bigl[\beta\bigl(R^{2}+\frac{\alpha}{2}R^{4}\bigr)-2Rv_{0}(1+\alpha R^{2})\Bigr].\]\nDividing by the loop resistance \(r_{0}\) gives the induced current\n\[I(t)=\frac{\varepsilon}{r_{0}}=\frac{\pi B_{0}e^{-\beta t}}{r_{0}}\Bigl[\beta\bigl(R(t)^{2}+\frac{\alpha}{2}R(t)^{4}\bigr)-2R(t)v_{0}\bigl(1+\alpha R(t)^{2}\bigr)\Bigr].\]\nAll units are consistent (Tesla·m^{2}/s = V, divided by Ω gives A).
```

#### Explanatory Curation
> 1. Compute the magnetic flux through the expanding loop: $$\Phi(t)=\int_{0}^{2\pi}\!\int_{0}^{R(t)} B_{0}\bigl(1+\alpha r^{2}\bigr)e^{-\beta t}\,r\,dr\,d\theta = \pi B_{0}e^{-\beta t}\left[R(t)^{2}+\frac{\alpha}{2}R(t)^{4}\right].$$\n2. Differentiate the flux with respect to time using the product rule and $\dot{R}=v_{0}$: $$\frac{d\Phi}{dt}=\pi B_{0}e^{-\beta t}\Big[-\beta\bigl(R^{2}+\frac{\alpha}{2}R^{4}\bigr)+2v_{0}R\bigl(1+\alpha R^{2}\bigr)\Big].$$\n3. Apply Faraday’s law $\mathcal{E}= -\frac{d\Phi}{dt}$ to obtain the induced emf: $$\mathcal{E}=\pi B_{0}e^{-\beta t}\Big[\beta\bigl(R^{2}+\frac{\alpha}{2}R^{4}\bigr)-2v_{0}R\bigl(1+\alpha R^{2}\bigr)\Big].$$\n4. Ohm’s law gives the current $I=\mathcal{E}/r_{0}$, leading to the final expression shown in the correct option.

----

### Topic 3: Integral Calculus [Class 12 - Mathematics]
*   **Subtopic**: `Riemann sum to definite integral conversion with polynomial integrand`
*   **Cognitive Difficulty**: `BAND 12 — Advanced Riemann Sums & Integral Inequalities` (ELO: 2980)
*   **Standard Error Trap**: `math.calculus.riman_sum_misinterpretation`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
Evaluate the limit: lim(n->infinity) (1/n) * sum_{r=1}^{n} [r^2/n^2 * ln(1 + r/n)].
Options: A) 2*ln(2) - 3/4, B) 2*ln(2) - 1, C) ln(2) - 1/2, D) 2*ln(2) - 5/4
```

#### Curated & Typeset Question (LaTeX)
> Evaluate the limit\n$$\lim_{n\to\infty}\frac{1}{n}\sum_{r=1}^{n}\left(\frac{r^{2}}{n^{2}}\,\ln\!\left(1+\frac{r}{n}\right)\right).$$

#### Options List
1. $\frac{2}{3}\ln 2 - \frac{5}{18}$
2. $2\ln 2 - \frac{3}{4}$
3. $\ln 2 - \frac{1}{2}$
4. $2\ln 2 - 1$

*   **Generator Declared Correct**: `$\frac{2}{3}\ln 2 - \frac{5}{18}$`
*   **Solver Derived Option**: `\frac{2}{3}\ln 2 - \frac{5}{18}`
*   **Primary Governing Formula**: `$$$\displaystyle \lim_{n\to\infty}\frac{1}{n}\sum_{r=1}^{n}\left(\frac{r^{2}}{n^{2}}\ln\!\left(1+\frac{r}{n}\right)\right)=\int_{0}^{1}x^{2}\ln(1+x)\,dx$$$`
*   **Auditable Numerical Target**: `0.1843203426 unitless`

#### Step-by-Step Solver Derivation
```latex
We interpret the sum as a Riemann sum. Let x_r = r/n, then Δx = 1/n. The expression becomes\n\[\frac{1}{n}\sum_{r=1}^{n}\left(\frac{r^{2}}{n^{2}}\ln\!\left(1+\frac{r}{n}\right)\right) = \sum_{r=1}^{n} x_r^{2}\ln(1+x_r)\,\Delta x\]\nwhich tends, as n\to\infty, to the integral\n\[I = \int_{0}^{1} x^{2}\ln(1+x)\,dx.\]\nIntegrate by parts: let u = \ln(1+x), dv = x^{2}dx. Then du = \frac{dx}{1+x}, v = \frac{x^{3}}{3}. Hence\n\[I = \left[\frac{x^{3}}{3}\ln(1+x)\right]_{0}^{1} - \int_{0}^{1}\frac{x^{3}}{3}\frac{dx}{1+x} = \frac{1}{3}\ln2 - \frac{1}{3}\int_{0}^{1}\frac{x^{3}}{1+x}\,dx.\]\nPerform polynomial division:\n\[\frac{x^{3}}{1+x}=x^{2}-x+1-\frac{1}{1+x}.\]\nThus\n\[\int_{0}^{1}\frac{x^{3}}{1+x}\,dx = \int_{0}^{1}(x^{2}-x+1)\,dx - \int_{0}^{1}\frac{dx}{1+x}\n= \left[\frac{x^{3}}{3}\right]_{0}^{1} - \left[\frac{x^{2}}{2}\right]_{0}^{1} + \left[x\right]_{0}^{1} - \left[\ln(1+x)\right]_{0}^{1}\n= \frac{1}{3} - \frac{1}{2} + 1 - \ln2 = \frac{5}{6} - \ln2.\]\nTherefore\n\[I = \frac{1}{3}\ln2 - \frac{1}{3}\left(\frac{5}{6} - \ln2\right) = \frac{2}{3}\ln2 - \frac{5}{18}.\]\nHence the original limit equals \(\frac{2}{3}\ln2 - \frac{5}{18}\).
```

#### Explanatory Curation
> 1. Recognize the expression as a Riemann sum: \n$$\frac{1}{n}\sum_{r=1}^{n}\left(\frac{r}{n}\right)^{2}\ln\!\left(1+\frac{r}{n}\right)\to\int_{0}^{1}x^{2}\ln(1+x)\,dx.$$\n2. Integrate by parts with $u=\ln(1+x)$, $dv=x^{2}dx$; then $du=\frac{dx}{1+x}$, $v=\frac{x^{3}}{3}$.\n3. Obtain $$\int_{0}^{1}x^{2}\ln(1+x)dx = \left.\frac{x^{3}}{3}\ln(1+x)\right|_{0}^{1} - \frac{1}{3}\int_{0}^{1}\frac{x^{3}}{1+x}dx.$$\n4. Simplify the remaining integral using polynomial division: $$\frac{x^{3}}{1+x}=x^{2}-x+1-\frac{1}{1+x},$$ leading to $$\int_{0}^{1}\frac{x^{3}}{1+x}dx = \frac{5}{6}-\ln2.$$\n5. Assemble the result: $$\int_{0}^{1}x^{2}\ln(1+x)dx = \frac{2}{3}\ln2 - \frac{5}{18}.$$ Hence the limit equals this value.

----

### Topic 4: Probability [Class 12 - Mathematics]
*   **Subtopic**: `Urn replacement stochastic transition matrix calculations`
*   **Cognitive Difficulty**: `BAND 12 — Urn Replacement stochastic chains` (ELO: 2920)
*   **Standard Error Trap**: `math.probability.impossible_event`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: 🔧 **HEALED & APPROVED**

#### Ingested Messy Public Question
```text
An urn has 3 red and 2 blue balls. Draw a ball, replace it with 2 balls of opposite color and 1 of same color. Another urn has 1 red and 4 blue balls, draw a ball and transfer. Find probability Urn 1 is all red before it gets larger than 12 balls.
Options: A) 12/65, B) 17/85, C) 14/105, D) Complex stochastic outcome
```

#### Curated & Typeset Question (LaTeX)
> An urn initially contains $3$ red and $2$ blue balls. At each step a ball is drawn uniformly at random, then it is replaced by $2$ balls of the opposite colour and $1$ ball of the same colour. The process stops as soon as the total number of balls in the urn exceeds $12$. What is the probability that, before the stopping time, the urn contains only red balls?

#### Options List
1. 0
2. 1/13
3. 3/26
4. 5/52

*   **Generator Declared Correct**: `0`
*   **Solver Derived Option**: `0`
*   **Primary Governing Formula**: `$$$P(\text{all red before }N>12)=0$$$`
*   **Given Parameters**: `{"R_0":"3","B_0":"2","N_{\\text{max}}":"12"}`
*   **Auditable Numerical Target**: `0 probability`

#### Step-by-Step Solver Derivation
```latex
Let (R_n, B_n) be the numbers of red and blue balls after n steps. Initially (R_0, B_0) = (3, 2). At each step a ball is drawn uniformly at random. If a red ball is drawn, we remove it and replace it by 2 blue balls (opposite colour) and 1 red ball (same colour). Hence the net change is: ΔR = 0, ΔB = +2. If a blue ball is drawn, the net change is: ΔR = +2, ΔB = 0. Therefore the number of red balls after n steps is\nR_n = 3 + 2·X_n, where X_n is the number of times a blue ball has been drawn up to step n. The number of blue balls after n steps is\nB_n = 2 + 2·(n - X_n) = 2 + 2n - 2X_n.\nSince 0 ≤ X_n ≤ n, we have B_n = 2 + 2n - 2X_n ≥ 2 (because the smallest possible value occurs when X_n = n, giving B_n = 2). Thus the blue count never drops below its initial value of 2; it can only stay the same (when a blue ball is drawn) or increase (when a red ball is drawn). Consequently the urn can never become "all red" at any time prior to stopping.\nThe process stops when the total number of balls exceeds 12. Starting from 5 balls and gaining +2 balls each step, the totals are 5, 7, 9, 11, 13. The stopping occurs after the 4th step (total 13). Since at steps n = 0,1,2,3 the blue count B_n ≥ 2, the event "the urn contains only red balls before the stopping time" is impossible.\nHence the required probability is 0, corresponding to option 1.\n
```

#### Explanatory Curation
> 1. Observe that each draw of a blue ball adds two more blue balls, while a draw of a red ball adds only one blue ball. Hence the number of blue balls never decreases.\\n2. To have the urn consist solely of red balls, the count of blue balls must become zero, which is impossible under the replacement rule.\\n3. Since the event "all red before the urn size exceeds 12" cannot occur, its probability is $0$.

----

### Topic 5: Thermodynamics [Class 11 - Chemistry]
*   **Subtopic**: `Entropy changes in non-ideal gas cycles coupled with dynamic chemical dissociation`
*   **Cognitive Difficulty**: `BAND 12 — Thermodynamic-Kinetic Coupling` (ELO: 2910)
*   **Standard Error Trap**: `chemistry.thermo.irreversibility_entropy_misinterpretation`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
Real gas cycle with (P + a/V^2)(V-b) = RT. Irreversible cycle with dissociation A <-> 2B. Calculate total entropy change of system + surroundings. Heat capacity is Cp(T) = gamma * T^2.
Options: A) dS = gamma*T dT, B) delta S_univ = complex equation with ln(V) and b, C) Zero, D) delta S_univ > 0 but depends on dissociation fraction alpha
```

#### Curated & Typeset Question (LaTeX)
> A real gas obeys the van der Waals equation \((P + \frac{a}{V^{2}})(V - b) = RT\). The gas undergoes an irreversible cyclic process during which the reaction \(\mathrm{A \rightleftharpoons 2B}\) proceeds to a fractional conversion \(\alpha\). The molar heat capacity of the gas is temperature‑dependent: \(C_{p}(T) = \gamma T^{2}\). The initial and final temperatures of the cycle are \(T_{i}=300\,\text{K}\) and \(T_{f}=400\,\text{K}\) respectively. Given \(a = 1\,\text{atm·L}^{2}\text{mol}^{-2}\), \(b = 0.1\,\text{L·mol}^{-1}\), \(\gamma = 0.01\,\text{J·mol}^{-1}\text{K}^{-3}\) and \(\alpha = 0.2\), calculate the total entropy change of the system plus the surroundings (\(\Delta S_{\text{univ}}\)).

#### Options List
1. $\Delta S = \gamma\,T\,\Delta T$
2. $\Delta S_{\text{univ}} = R\ln\left(\frac{V_{f}-b}{V_{i}-b}\right) - \frac{a}{T}\left(\frac{1}{V_{f}} - \frac{1}{V_{i}}\right)$
3. $\Delta S_{\text{univ}} = 0$
4. $\Delta S_{\text{univ}} > 0\;\text{and depends on the dissociation fraction }\alpha$

*   **Generator Declared Correct**: `$\Delta S_{\text{univ}} > 0\;\text{and depends on the dissociation fraction }\alpha$`
*   **Solver Derived Option**: `ΔS_{\text{univ}} > 0\;\text{and depends on the dissociation fraction }\alpha`
*   **Primary Governing Formula**: `$$ΔS_{univ}=∫_{T_i}^{T_f} \frac{C_p(T)}{T}\,dT - \frac{∫_{T_i}^{T_f} C_p(T)\,dT}{T_{avg}} - R[\alpha\ln\alpha + (1-\alpha)\ln(1-\alpha)]$$`
*   **Given Parameters**: `{"a":"1 atm·L^2·mol^{-2}","b":"0.1 L·mol^{-1}","γ":"0.01 J·mol^{-1}·K^{-3}","T_i":"300 K","T_f":"400 K","α":"0.2"}`
*   **Auditable Numerical Target**: `8 J·K^{-1}`

#### Step-by-Step Solver Derivation
```latex
The total entropy change of the universe is the sum of the entropy change of the gas (system) and that of the surroundings.  Because the process is irreversible, the second law requires \(\Delta S_{\text{univ}}>0\).  The detailed evaluation proceeds as follows.\n\n**1. Entropy change of the gas due to the temperature variation**\nThe molar heat capacity is given as \(C_{p}(T)=\gamma T^{2}\).  For a reversible heating from \(T_{i}=300\,\text{K}\) to \(T_{f}=400\,\text{K}\) the entropy change of one mole is\n\[\n\Delta S_{T}=\int_{T_i}^{T_f}\frac{C_{p}(T)}{T}\,dT=\int_{T_i}^{T_f}\frac{\gamma T^{2}}{T}\,dT\n   =\gamma\int_{T_i}^{T_f}T\,dT\n   =\frac{\gamma}{2}\bigl(T_f^{2}-T_i^{2}\bigr).\n\]\nWith \(\gamma=0.01\,\text{J mol}^{-1}\text{K}^{-3}\) this gives\n\[\n\Delta S_{T}=\frac{0.01}{2}\bigl(400^{2}-300^{2}\bigr)\;\text{J K}^{-1}\text{mol}^{-1}\n   =0.005\,(160000-90000)\;\text{J K}^{-1}\text{mol}^{-1}\n   =0.005\times 70000\;\text{J K}^{-1}\text{mol}^{-1}\n   =350\;\text{J K}^{-1}\text{mol}^{-1}.\n\]\n\n**2. Entropy change due to the chemical reaction**\nThe reaction \(\mathrm{A}\rightleftharpoons 2\mathrm{B}\) proceeds to a fractional conversion \(\alpha\).  Let the initial amount of A be 1 mol and the initial amount of B be 0.  After conversion the composition is\n\[\n n_{A}=1-\alpha,\qquad n_{B}=2\alpha.\n\]\nThe total number of moles after reaction is \(n_{\text{tot}}=1-\alpha+2\alpha=1+\alpha\).\nThe molar entropy change associated with mixing (assuming ideal‑mixing behaviour) is\n\[\n\Delta S_{\text{rxn}}=-R\sum_i n_i\ln\frac{n_i}{n_{\text{tot}}}\n   =-R\bigl[(1-\alpha)\ln\frac{1-\alpha}{1+\alpha}+2\alpha\ln\frac{2\alpha}{1+\alpha}\bigr].\n\]\nFor \(\alpha=0.2\) one obtains\n\[\n\Delta S_{\text{rxn}}=-8.314\bigl[0.8\ln\frac{0.8}{1.2}+0.4\ln\frac{0.4}{1.2}\bigr]\n   \approx -8.314\bigl[0.8\ln(0.667)+0.4\ln(0.333)\bigr]\n   \approx -8.314\bigl[0.8(-0.405)+0.4(-1.099)\bigr]\n   \approx -8.314\bigl[-0.324-0.440\bigr]\n   \approx -8.314(-0.764)\approx 6.35\;\text{J K}^{-1}\text{mol}^{-1}.\n\]\nThus the reaction contributes a **positive** entropy change because the number of particles increases (2 B from 1 A).  The total entropy change of the gas is\n\[\n\Delta S_{\text{gas}}=\Delta S_{T}+\Delta S_{\text{rxn}}\n   =350\;\text{J K}^{-1}+6.35\;\text{J K}^{-1}\n   \approx 356.35\;\text{J K}^{-1}\n\]\n(per mole of the original A).\n\n**3. Entropy change of the surroundings**\nThe heat supplied to the gas during the temperature rise is\n\[\nQ=\int_{T_i}^{T_f}C_{p}(T)\,dT = \gamma\int_{T_i}^{T_f}T^{2}\,dT\n   = \frac{\gamma}{3}\bigl(T_f^{3}-T_i^{3}\bigr).\n\]\nNumerically,\n\[\nQ=\frac{0.01}{3}\bigl(400^{3}-300^{3}\bigr)\;\text{J mol}^{-1}\n   =0.00333\,(64\times10^{6}-27\times10^{6})\;\text{J mol}^{-1}\n   \approx 0.00333\times 37\times10^{6}\;\text{J mol}^{-1}\n   \approx 123 000\;\text{J mol}^{-1}.\n\]\nThe surroundings lose this amount of heat; if the surroundings are large and remain at an average temperature \(T_{\text{surr}}\approx (T_i+T_f)/2=350\,\text{K}\), their entropy change is\n\[\n\Delta S_{\text{surr}} = -\frac{Q}{T_{\text{surr}}}\n   = -\frac{1.23\times10^{5}}{350}\;\text{J K}^{-1}\n   \approx -351\;\text{J K}^{-1}.\n\]\n\n**4. Entropy change of the universe**\nFinally,\n\[\n\Delta S_{\text{univ}} = \Delta S_{\text{gas}} + \Delta S_{\text{surr}}\n   \approx 356.35\;\text{J K}^{-1} - 351\;\text{J K}^{-1}\n   \approx 5.3\;\text{J K}^{-1}>0.\n\]\nThe small positive value is a direct consequence of the irreversibility of the temperature rise and of the increase in the number of particles due to the reaction (the term containing \(\alpha\)).  Hence the entropy of the universe is **greater than zero** and its magnitude depends on the conversion fraction \(\alpha\).\n\n**5. Consistency checks**\n- Units: each term is in J K⁻¹ mol⁻¹, as required for entropy.\n- The van der Waals parameters \(a\) and \(b\) do not appear because the volume change is not specified; the entropy change is dominated by the temperature change and the reaction.\n- The second‑law inequality \(\Delta S_{\text{univ}}>0\) is satisfied.\n\nTherefore the correct choice is option 4.
```

#### Explanatory Curation
> 1. Compute the heat supplied: $Q = \int_{T_i}^{T_f} C_p(T)\,dT = \gamma\frac{T_f^{3}-T_i^{3}}{3}$.\\n2. Entropy change of the gas: $\Delta S_{\text{sys}} = \int_{T_i}^{T_f} \frac{C_p(T)}{T}\,dT = \gamma\frac{T_f^{2}-T_i^{2}}{2}$.\\n3. Entropy change of the surroundings: $\Delta S_{\text{surr}} = -\frac{Q}{T_{\text{avg}}}$ with $T_{\text{avg}} \approx (T_i+T_f)/2$.\\n4. Chemical contribution from dissociation: $\Delta S_{\text{chem}} = -R\big[\alpha\ln\alpha + (1-\alpha)\ln(1-\alpha)\big]$, which is positive for $0<\alpha<1$.\\n5. Total entropy: $\Delta S_{\text{univ}} = \Delta S_{\text{sys}} + \Delta S_{\text{surr}} + \Delta S_{\text{chem}}$, which evaluates to a small positive number, confirming the second law.

----

### Topic 6: Electrostatics [Class 12 - Physics]
*   **Subtopic**: `Electrostatic potential of infinite conducting cylinders under localized perturbations`
*   **Cognitive Difficulty**: `BAND 11 — Boundary Value Charge Distributions` (ELO: 2850)
*   **Standard Error Trap**: `physics.electrostatics.boundary_condition.misapplication`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
An infinite grounded conducting cylinder of radius R is placed in a uniform electric field E0 perpendicular to its axis. A line charge of linear density lambda is placed parallel to the cylinder axis at distance d. Find the potential V at a point in the plane perpendicular to the axis.
Options: A) V = -E0(r - R^2/r)cos(phi) - (lambda/(2*pi*epsilon0)) * ln(r1/r2), B) V = 0, C) V = constant, D) None of these.
```

#### Curated & Typeset Question (LaTeX)
> An infinite grounded conducting cylinder of radius $R$ is placed in a uniform electric field $E_0$ directed perpendicular to its axis. A line charge of linear density $\lambda$ is positioned parallel to the cylinder axis at a distance $d$ from the centre. Determine the electrostatic potential $V(r,\phi)$ at an arbitrary point $(r,\phi)$ in the plane perpendicular to the axis.

#### Options List
1. $V = -E_0\left(r - \frac{R^{2}}{r}\right)\cos\phi - \frac{\lambda}{2\pi\varepsilon_{0}}\ln\frac{r_{1}}{r_{2}}$
2. $V = 0$
3. $V = \text{constant}$
4. $V = -E_0 r\cos\phi + \frac{\lambda}{2\pi\varepsilon_{0}}\ln r$

*   **Generator Declared Correct**: `$V = -E_0\left(r - \frac{R^{2}}{r}\right)\cos\phi - \frac{\lambda}{2\pi\varepsilon_{0}}\ln\frac{r_{1}}{r_{2}}$`
*   **Solver Derived Option**: `V = -E_0\left(r - \frac{R^{2}}{r}\right)\cos\phi - \frac{\lambda}{2\pi\varepsilon_{0}}\ln\frac{r_{1}}{r_{2}}`
*   **Primary Governing Formula**: `$$$\frac{\partial^{2}V}{\partial r^{2}}+\frac{1}{r}\frac{\partial V}{\partial r}+\frac{1}{r^{2}}\frac{\partial^{2}V}{\partial \phi^{2}}=0$$$`
*   **Given Parameters**: `{"R":"R","E_0":"E_0","\\lambda":"\\lambda","d":"d"}`
*   **Auditable Numerical Target**: `0 V`

#### Step-by-Step Solver Derivation
```latex
We work in the plane perpendicular to the axis of the infinite cylinder (\(z\)–direction).  In cylindrical coordinates \((r,\phi)\) the potential satisfies Laplace’s equation \(\nabla^{2}V=0\) everywhere except on the line charge.  Because the system is linear we can treat the two external sources separately and add the results.\n\n**1. Uniform field \(E_{0}\) with a grounded cylinder**\n\nFor a uniform field \(\mathbf{E}_{0}=E_{0}\hat{x}\) the potential in free space is \(V_{\text{free}}=-E_{0}x=-E_{0}r\cos\phi\).  The presence of a grounded conducting cylinder of radius \(R\) imposes the boundary condition \(V(R,\phi)=0\).  Seeking a solution of the form \(V_{E}=A r\cos\phi + B\frac{\cos\phi}{r}\) (the only azimuthal \(\cos\phi\) term that satisfies Laplace’s equation), we apply the boundary condition:\n\[A R + \frac{B}{R}=0\quad\Rightarrow\quad B=-A R^{2}.\]\nMatching the far‑field behaviour (\(r\to\infty\)) with the original uniform field gives \(A=-E_{0}\).  Hence\n\[V_{E}(r,\phi)=-E_{0}\left(r-\frac{R^{2}}{r}\right)\cos\phi.\]\nThis is the well‑known result for a grounded cylinder in a uniform transverse field.\n\n**2. Line charge \(\lambda\) parallel to the axis, at distance \(d>R\)**\n\nA line charge in two dimensions produces a potential \(V_{\lambda}=\frac{\lambda}{2\pi\varepsilon_{0}}\ln \rho\), where \(\rho\) is the distance from the observation point to the line.  Let the real line charge be located at \((r=d,\phi=0)\).  Its distance to a generic point \((r,\phi)\) is\n\[\rho_{1}=\sqrt{r^{2}+d^{2}-2rd\cos\phi}.\]\nBecause the cylinder is grounded, we must add an image line charge inside the cylinder so that \(V=0\) on \(r=R\) for all \(\phi\).  Using the method of images (or the conformal‑mapping solution of Laplace’s equation) one finds that the image is a line charge of density\n\[\lambda'=-\frac{R}{d}\,\lambda,\]\nplaced on the same radial line but at the reciprocal distance\n\[d' = \frac{R^{2}}{d}\ (<R).\]\nIts distance to the observation point is\n\[\rho_{2}=\sqrt{r^{2}+d'^{2}-2r d'\cos\phi}.\]\nThe combined potential of the real and image charges is\n\[V_{\lambda}(r,\phi)=\frac{\lambda}{2\pi\varepsilon_{0}}\ln \rho_{1}+\frac{\lambda'}{2\pi\varepsilon_{0}}\ln \rho_{2}.\n\]\nSubstituting \(\lambda'\) and noting that \(\ln \rho_{2}^{\lambda'/\lambda}=\ln \rho_{2}^{-R/d}= -\frac{R}{d}\ln \rho_{2}\), the expression can be written as a single logarithm of a ratio:\n\[V_{\lambda}(r,\phi)=-\frac{\lambda}{2\pi\varepsilon_{0}}\ln\frac{\rho_{2}}{\rho_{1}}\equiv-\frac{\lambda}{2\pi\varepsilon_{0}}\ln\frac{r_{2}}{r_{1}},\]\nwhere we have renamed \(\rho_{1}=r_{1}\) and \(\rho_{2}=r_{2}\) for brevity.\nThe boundary condition \(V(R,\phi)=0\) is satisfied because at \(r=R\) the two logarithmic terms cancel exactly.\n\n**3. Superposition**\n\nThe total potential in the region outside the cylinder (\(r\ge R\)) is the sum of the contributions from the uniform field and the line charge:\n\[\boxed{V(r,\phi)=V_{E}(r,\phi)+V_{\lambda}(r,\phi)=-E_{0}\left(r-\frac{R^{2}}{r}\right)\cos\phi-\frac{\lambda}{2\pi\varepsilon_{0}}\ln\frac{r_{1}}{r_{2}}}.\]\nThis expression obeys:\n- Laplace’s equation everywhere except on the line charge,\n- the grounded condition \(V(R,\phi)=0\),\n- the correct far‑field behaviour (\(V\to -E_{0}r\cos\phi\) as \(r\to\infty\) and the logarithmic term tends to \(\frac{\lambda}{2\pi\varepsilon_{0}}\ln r\)).\nAll units are consistent: the first term has units of volts (\(E_{0}\times\text{length}\)), the second term is \(\lambda/(2\pi\varepsilon_{0})\) times a dimensionless logarithm, also volts.\n\nThus the answer matches option 1.
```

#### Explanatory Curation
> 1. Write Laplace's equation in cylindrical coordinates for the region outside the conductor and away from the line charge: $$\frac{\partial^{2}V}{\partial r^{2}}+\frac{1}{r}\frac{\partial V}{\partial r}+\frac{1}{r^{2}}\frac{\partial^{2}V}{\partial \phi^{2}}=0.$$\\n2. Superpose two solutions: (i) the potential of a uniform field $E_0$ perturbed by a grounded cylinder, $V_{\text{field}}=-E_0\left(r-\frac{R^{2}}{r}\right)\cos\phi$, which satisfies $V=0$ at $r=R$; (ii) the potential of a line charge at $r=d$, $V_{\text{line}}= -\frac{\lambda}{2\pi\varepsilon_{0}}\ln\frac{r_{1}}{r_{2}}$, where $r_{1}$ and $r_{2}$ are distances to the real and image charges respectively.\\n3. Enforce the boundary condition $V(R,\phi)=0$; the image charge method automatically ensures this for the line‑charge contribution.\\n4. Add the two contributions to obtain the total potential: $$V(r,\phi)= -E_0\left(r-\frac{R^{2}}{r}\right)\cos\phi-\frac{\lambda}{2\pi\varepsilon_{0}}\ln\frac{r_{1}}{r_{2}}.$$

----

### Topic 7: Dual Nature of Radiation [Class 12 - Physics]
*   **Subtopic**: `De Broglie wavelength & stopping potentials under variable monochromatic flux`
*   **Cognitive Difficulty**: `BAND 10 — Quantum Photoelectric Thresholds` (ELO: 2600)
*   **Standard Error Trap**: `physics.photoelectric.work_function_misinterpretation`
*   **Target Exam**: `NEET`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
When a monochromatic light of wavelength lambda is incident on a metal surface, the stopping potential is V. If the wavelength is changed to 3*lambda, the stopping potential becomes V/4. Find the threshold wavelength of the metal.
Options: A) 4*lambda, B) 5*lambda, C) 9*lambda, D) 3*lambda
```

#### Curated & Typeset Question (LaTeX)
> A monochromatic beam of light with wavelength $\lambda$ ejects electrons from a metal surface with a stopping potential $V$. When the wavelength is increased to $3\lambda$, the stopping potential becomes $V/4$. Assuming the work function of the metal remains unchanged, determine the threshold wavelength $\lambda_{\text{th}}$ of the metal.

#### Options List
1. 4$\lambda$
2. 5$\lambda$
3. 9$\lambda$
4. 3$\lambda$

*   **Generator Declared Correct**: `9$\lambda$`
*   **Solver Derived Option**: `9λ`
*   **Primary Governing Formula**: `$$eV = \frac{hc}{\lambda} - \phi$$`
*   **Given Parameters**: `{"V":"V","lambda":"λ"}`
*   **Auditable Numerical Target**: `9 λ`

#### Step-by-Step Solver Derivation
```latex
For the photoelectric effect the maximum kinetic energy of ejected electrons is given by \(eV_{stop}=h\nu-\phi\), where \(\phi\) is the work function.\\n\\n1. For the first wavelength \(\lambda\):\\n\[eV = \frac{hc}{\lambda} - \phi \tag{1}\]\\n2. For the increased wavelength \(3\lambda\) the stopping potential becomes \(V/4\):\\n\[e\frac{V}{4} = \frac{hc}{3\lambda} - \phi \tag{2}\]\\nSubtract (2) from (1) to eliminate \(\phi\):\\n\[eV - e\frac{V}{4} = \frac{hc}{\lambda} - \frac{hc}{3\lambda}\]\\n\[\frac{3}{4}eV = \frac{2}{3}\frac{hc}{\lambda}\]\\nSolve for \(eV\):\\n\[eV = \frac{8}{9}\frac{hc}{\lambda}\]\\nInsert this result back into (1) to find the work function:\\n\[\phi = \frac{hc}{\lambda} - eV = \frac{hc}{\lambda} - \frac{8}{9}\frac{hc}{\lambda} = \frac{1}{9}\frac{hc}{\lambda}\]\\nThe threshold wavelength \(\lambda_{\text{th}}\) satisfies \(\frac{hc}{\lambda_{\text{th}}}=\phi\):\\n\[\frac{hc}{\lambda_{\text{th}}}=\frac{1}{9}\frac{hc}{\lambda}\]\\nThus\\n\[\lambda_{\text{th}} = 9\lambda\]\\nHence the correct option is 9\lambda.
```

#### Explanatory Curation
> 1. Apply Einstein’s photoelectric equation for both wavelengths: \[ eV = \frac{hc}{\lambda} - \phi \] and \[ \frac{eV}{4} = \frac{hc}{3\lambda} - \phi . \]\n2. Subtract the second equation from the first to eliminate $\phi$: \[ \frac{3eV}{4} = \frac{2hc}{3\lambda} \] which gives \[ eV = \frac{8hc}{9\lambda}. \]\n3. Substitute $eV$ back into the first equation to find the work function: \[ \phi = \frac{hc}{\lambda} - \frac{8hc}{9\lambda} = \frac{hc}{9\lambda}. \]\n4. The threshold wavelength satisfies $\phi = hc/\lambda_{\text{th}}$, so \[ \lambda_{\text{th}} = \frac{hc}{\phi} = 9\lambda. \]

----

### Topic 8: Some Basic Concepts of Chemistry [Class 11 - Chemistry]
*   **Subtopic**: `Exact pH of dilute polyprotic acid mixtures under ionic strength corrections`
*   **Cognitive Difficulty**: `BAND 11 — Polyprotic Acid Buffers` (ELO: 2700)
*   **Standard Error Trap**: `chemistry.thermo.autoionization_neglect`
*   **Target Exam**: `JEE-Main`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
Calculate the pH of a 10^-8 M solution of hydrochloric acid (HCl) at 25 degrees C, taking auto-dissociation of water into account.
Options: A) 8.0, B) 7.0, C) 6.98, D) 6.0
```

#### Curated & Typeset Question (LaTeX)
> Calculate the pH of a $10^{-8}\ \text{M}$ solution of hydrochloric acid (HCl) at $25\ \degree\text{C}$, taking the auto‑dissociation of water into account.

#### Options List
1. 8.0
2. 7.0
3. 6.98
4. 6.0

*   **Generator Declared Correct**: `6.98`
*   **Solver Derived Option**: `6.98`
*   **Primary Governing Formula**: `$$$x^2 + C\,x - K_w = 0$$$`
*   **Given Parameters**: `{"C":"1 \\times 10^{-8} \\text{ M}","K_w":"1 \\times 10^{-14}"}`
*   **Auditable Numerical Target**: `6.98 pH`

#### Step-by-Step Solver Derivation
```latex
For a weak acid of concentration c = 1×10⁻⁸ M, the water auto‑ionization must be included. Let [H⁺] = x. The water equilibrium gives [H⁺][OH⁻] = K_w = 1.0×10⁻¹⁴ (at 25 °C). Charge balance requires that the total positive charge equals the total negative charge: x = [OH⁻] + c (since each HCl molecule adds one Cl⁻). Substituting [OH⁻] = K_w / x gives:\n\nx = K_w / x + c\n→ x² = K_w + c x\n→ x² – c x – K_w = 0.\n\nSolve the quadratic for the positive root:\n\nx = (c + √(c² + 4K_w))/2.\n\nInsert c = 1×10⁻⁸ M and K_w = 1×10⁻¹⁴:\n\nc² = 1×10⁻¹⁶,\n4K_w = 4×10⁻¹⁴,\n√(c² + 4K_w) ≈ √(4.01×10⁻¹⁴) = 2.0025×10⁻⁷.\n\nThus\nx = (1×10⁻⁸ + 2.0025×10⁻⁷)/2 = 2.1025×10⁻⁷ / 2 = 1.05125×10⁻⁷ M.\n\nThe pH is\npH = –log₁₀[x] = –log₁₀(1.05125×10⁻⁷) = 7 – log₁₀(1.05125) ≈ 7 – 0.0217 = 6.978 ≈ 6.98.\n\nTherefore the correct pH is approximately 6.98, matching option 3.
```

#### Explanatory Curation
> 1. Write the charge balance: $[H^+] = C + x$ and $[OH^-] = x$, where $C = 10^{-8}\ \text{M}$ is the added acid concentration and $x$ is the contribution from water.\n2. Apply the water ionisation constant: $[H^+][OH^-] = K_w = 10^{-14}$.\n3. Substitute the expressions: $(C + x)\,x = K_w$, leading to the quadratic $x^2 + Cx - K_w = 0$.\n4. Solve for $x$ using the positive root: $x = \frac{-C + \sqrt{C^2 + 4K_w}}{2}$.\n5. Compute total $[H^+] = C + x$ and obtain $\text{pH} = -\log_{10}[H^+]$, yielding $\text{pH} \approx 6.98$.

----

### Topic 9: Chemical Kinetics [Class 12 - Chemistry]
*   **Subtopic**: `Parallel first-order radioactive decay coupled with activation barriers`
*   **Cognitive Difficulty**: `BAND 12 — Steady-State Chain Mechanisms` (ELO: 2880)
*   **Standard Error Trap**: `chemistry.kinetics.activation_energy_weighted_average`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
For a parallel reaction where reactant A decays to products B and C with rate constants k1 and k2. The activation energies are E1 and E2 respectively. If at temperature T, the ratio of B to C is 2:1, find the overall activation energy E_eff for the consumption of A.
Options: A) E_eff = (2*E1 + E2)/3, B) E_eff = (E1 + E2)/2, C) E_eff = E1 + E2, D) None of these.
```

#### Curated & Typeset Question (LaTeX)
> In a parallel first‑order decay, reactant $A$ converts to products $B$ and $C$ with rate constants $k_1$ and $k_2$, respectively. Their activation energies are $E_1$ and $E_2$. At temperature $T$, the observed concentration ratio $[B]:[C]$ is $2:1$. Assuming the pre‑exponential factors for the two pathways are equal, determine the effective activation energy $E_{\text{eff}}$ that characterises the overall disappearance of $A$ (i.e., the Arrhenius activation energy of the total rate constant $k = k_1+k_2$).

#### Options List
1. A) $E_{\text{eff}} = \dfrac{2E_1 + E_2}{3}$
2. B) $E_{\text{eff}} = \dfrac{E_1 + E_2}{2}$
3. C) $E_{\text{eff}} = E_1 + E_2$
4. D) $E_{\text{eff}} = \sqrt{E_1^{2}+E_2^{2}}$

*   **Generator Declared Correct**: `A) $E_{\text{eff}} = \dfrac{2E_1 + E_2}{3}$`
*   **Solver Derived Option**: `A) $E_{\text{eff}} = \dfrac{2E_1 + E_2}{3}$`
*   **Primary Governing Formula**: `$$$$\begin{cases}\displaystyle \frac{d[A]}{dt}=-(k_1+k_2)[A]\\[4pt] \displaystyle \frac{d[B]}{dt}=k_1[A]\\[4pt] \displaystyle \frac{d[C]}{dt}=k_2[A]\\[4pt] k_i=A\exp\left(-\frac{E_i}{RT}\right)\end{cases}$$$$`
*   **Given Parameters**: `{"B:C":"2:1","T":"300 K","E1":"50 kJ·mol⁻¹","R":"8.314 J·mol⁻¹·K⁻¹"}`
*   **Auditable Numerical Target**: `50.58 kJ·mol⁻¹`

#### Step-by-Step Solver Derivation
```latex
For the parallel first‑order decay A \xrightarrow{k_1} B and A \xrightarrow{k_2} C, the fraction of A that ends up as B (or C) is determined solely by the ratio of the rate constants, independent of time. The observed concentration ratio [B]:[C] = 2:1 therefore gives\n\[\frac{k_1}{k_2}=2\quad\Rightarrow\quad k_1 = 2k_2.\]\n\nEach elementary rate constant follows the Arrhenius expression with a common pre‑exponential factor A:\n\[k_1 = A\,e^{-E_1/(RT)},\qquad k_2 = A\,e^{-E_2/(RT)}.\]\nTaking the ratio:\n\[\frac{k_1}{k_2}=\frac{e^{-E_1/(RT)}}{e^{-E_2/(RT)}} = e^{-(E_1-E_2)/(RT)} = e^{(E_2-E_1)/(RT)} = 2.\]\nThus\n\[\ln 2 = \frac{E_2-E_1}{RT}\] \nwhich simply confirms that the larger rate constant corresponds to the smaller activation energy, but the exact numerical difference is not needed for the final answer.\n\nThe overall disappearance rate of A is the sum\n\[k = k_1+k_2 = A\big(e^{-E_1/(RT)} + e^{-E_2/(RT)}\big).\]\nDefine an effective activation energy E_eff by the usual Arrhenius form\n\[k = A_{\text{eff}}\,e^{-E_{\text{eff}}/(RT)}.\]\nDifferentiating \(\ln k\) with respect to \(1/T\) gives the temperature‑dependent activation energy:\n\[\frac{d\ln k}{d(1/T)} = -\frac{R\,E_{\text{eff}}}{R}= -\frac{E_{\text{eff}}}{RT^2}\]\nbut more conveniently, using the chain rule for the sum of exponentials, one obtains the weighted‑average expression\n\[E_{\text{eff}} = \frac{k_1E_1 + k_2E_2}{k_1+k_2}.\]\nSubstituting \(k_1 = 2k_2\) gives\n\[E_{\text{eff}} = \frac{2k_2\,E_1 + k_2\,E_2}{3k_2}=\frac{2E_1+E_2}{3}.\]\nThus the effective activation energy that characterises the overall disappearance of A is the arithmetic mean weighted by the relative contribution of each pathway, i.e. \( (2E_1+E_2)/3 \).\n\nTherefore the correct choice is option A.
```

#### Explanatory Curation
> 1. For parallel first‑order decay: $\displaystyle \frac{d[A]}{dt}=-(k_1+k_2)[A]$, $\frac{d[B]}{dt}=k_1[A]$, $\frac{d[C]}{dt}=k_2[A]$.\\n2. At steady conversion the product ratio equals the ratio of the rate constants: $\frac{[B]}{[C]}=\frac{k_1}{k_2}=2$. Hence $k_1=2k_2$.\\n3. Using the Arrhenius expression $k_i=A\exp\left(-\frac{E_i}{RT}\right)$ and equal pre‑exponential factors $A$, we have $\frac{k_1}{k_2}=\exp\left(-\frac{E_1-E_2}{RT}\right)=2$, which gives $E_2=E_1+RT\ln2$.\\n4. The overall rate constant is $k=k_1+k_2$. Its Arrhenius activation energy is the weighted average $E_{\text{eff}}=\frac{k_1E_1+k_2E_2}{k_1+k_2}$. Substituting $k_1=2k_2$ yields $E_{\text{eff}}=\frac{2E_1+E_2}{3}$.\\n5. Inserting the numerical values $E_1=50\ \text{kJ·mol}^{-1}$, $T=300\ \text{K}$, $R=8.314\ \text{J·mol}^{-1}\text{K}^{-1}$ gives $E_2\approx51.73\ \text{kJ·mol}^{-1}$ and $E_{\text{eff}}\approx50.58\ \text{kJ·mol}^{-1}$.

----

### Topic 10: Organic Chemistry: Basic Principles [Class 11 - Chemistry]
*   **Subtopic**: `Multi-step reaction sequences including stereochemical changes during SN2' substitutions`
*   **Cognitive Difficulty**: `BAND 11 — Stereochemical Reaction Pathways` (ELO: 2800)
*   **Standard Error Trap**: `chemistry.organic.stereochemistry.configuration_loss`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: 🔧 **HEALED & APPROVED**

#### Ingested Messy Public Question
```text
What is the major organic product formed when (R)-3-chlorobut-1-ene is treated with sodium cyanide in DMF via SN2' substitution?
Options: A) (S)-pent-3-enenitrile, B) (R)-pent-3-enenitrile, C) (E)-pent-2-enenitrile, D) Racemic pent-3-enenitrile
```

#### Curated & Typeset Question (LaTeX)
> When (R)-3‑chlorobut‑1‑ene is treated with sodium cyanide (NaCN) in DMF, the reaction proceeds via an SN2' (allylic substitution) mechanism. Which of the following is the major organic product formed?

#### Options List
1. (S)-pent‑3‑enenitrile
2. (R)-pent‑3‑enenitrile
3. (E)-pent‑2‑enenitrile
4. Racemic pent‑3‑enenitrile

*   **Generator Declared Correct**: `Racemic pent‑3‑enenitrile`
*   **Solver Derived Option**: `Racemic pent‑3‑enenitrile`
*   **Primary Governing Formula**: `$$$\text{(R)-CH}_{2}=\text{CH-CH(Cl)-CH}_{3} \xrightarrow[\text{DMF}]{\text{NaCN}} \text{NC-CH}_{2}\text{-CH}=\text{CH-CH}_{3}$$$`
*   **Given Parameters**: `{"solvent":"DMF","reagent":"NaCN"}`
*   **Auditable Numerical Target**: `0 N/A`

#### Step-by-Step Solver Derivation
```latex
The substrate (R)-3‑chlorobut‑1‑ene has the structure CH2=CH‑CH(Cl)‑CH3.  The allylic carbon (the carbon bearing Cl) is chiral (R).  In an SN2' (allylic substitution) reaction the nucleophile attacks the terminal carbon of the double bond (C1) while the leaving group departs from the allylic carbon (C3).  The reaction proceeds concertedly in an anti‑periplanar geometry.  The result is:\n\n1. The C–Cl bond breaks, converting C3 from sp³ to sp² (it becomes part of the new double bond).\n2. CN⁻ forms a new σ‑bond to the terminal carbon C1, which becomes saturated.\n3. The original C=C bond shifts one carbon over, giving a new C=C between the former C2 and C3 atoms.\n\nThe product therefore has the skeleton:\n\n    NC‑CH2‑CH=CH‑CH3\n\nCounting from the nitrile carbon (the new carbon added by CN⁻) gives a five‑carbon chain with the double bond between carbons 3 and 4.  This is pent‑3‑enenitrile.\n\nBecause the allylic carbon (C3) becomes sp² in the product, the original stereogenic centre is lost; the intermediate that determines configuration is planar.  Consequently the product is formed without any stereochemical bias – a racemic mixture (actually an achiral molecule, but the term ‘racemic’ is used in the answer choices to indicate loss of chirality).  No other isomer (e.g., pent‑2‑enenitrile) is favored: the SN2' pathway gives the more substituted internal alkene, which is pent‑3‑enenitrile.\n\nThus the major organic product is racemic pent‑3‑enenitrile.
```

#### Explanatory Curation
> 1. The substrate (R)-CH₂=CH‑CH(Cl)‑CH₃ possesses an allylic chloride; SN2' attacks the γ‑carbon, displacing chloride and forming a new C–C bond at the terminal carbon.\\n2. NaCN provides the nucleophile CN⁻, which attacks the allylic position opposite to the leaving group, giving the allylic nitrile.\\n3. The reaction proceeds with inversion at the carbon bearing Cl, but the newly formed product NC‑CH₂‑CH=CH‑CH₃ (pent‑3‑enenitrile) lacks a stereogenic centre; thus the original configuration is lost and a racemic mixture is obtained.\\n4. No geometric isomerism (E/Z) is introduced because the double bond is internal to the chain and the product is achiral.\\n5. Hence the major product is racemic pent‑3‑enenitrile.

----

### Topic 11: Coordination Compounds [Class 12 - Chemistry]
*   **Subtopic**: `CFSE and magnetic moments in strong vs weak field ligand complexes`
*   **Cognitive Difficulty**: `BAND 10 — Crystal Field Splitting Theory` (ELO: 2650)
*   **Standard Error Trap**: `chemistry.crystal_field.spin_state_misinterpretation`
*   **Target Exam**: `JEE-Main`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
Find the crystal field stabilization energy (CFSE) and spin-only magnetic moment of [Co(F)6]3- complex (Co atomic number is 27).
Options: A) CFSE = -0.4 Delta_o, magnetic moment = 4.90 BM, B) CFSE = -2.4 Delta_o, magnetic moment = 0 BM, C) CFSE = -0.4 Delta_o, magnetic moment = 0 BM, D) CFSE = -2.4 Delta_o, magnetic moment = 4.90 BM
```

#### Curated & Typeset Question (LaTeX)
> For the octahedral complex $\mathrm{[CoF_{6}]^{3-}}$, determine (i) the crystal field stabilization energy (CFSE) expressed in terms of $\Delta_{0}$, and (ii) the spin‑only magnetic moment $\mu_{\text{so}}$ (in Bohr magnetons).

#### Options List
1. CFSE = -0.4$\Delta_{0}$, $\mu_{\text{so}} = 4.90\,\text{BM}$
2. CFSE = -2.4$\Delta_{0}$, $\mu_{\text{so}} = 0\,\text{BM}$
3. CFSE = -0.4$\Delta_{0}$, $\mu_{\text{so}} = 0\,\text{BM}$
4. CFSE = -2.4$\Delta_{0}$, $\mu_{\text{so}} = 4.90\,\text{BM}$

*   **Generator Declared Correct**: `CFSE = -0.4$\Delta_{0}$, $\mu_{\text{so}} = 4.90\,\text{BM}$`
*   **Solver Derived Option**: `CFSE = -0.4$\Delta_{0}$, $\mu_{\text{so}} = 4.90\,\text{BM}$`
*   **Primary Governing Formula**: `$$CFSE = (-0.4 n_{t_{2g}} + 0.6 n_{e_{g}})\,\Delta_{0}; \; \mu_{\text{so}} = \sqrt{n(n+2)}\,\text{BM}$$`
*   **Given Parameters**: `{"oxidation_state":"+3","d_electrons":"6","ligand":"F⁻ (weak field)","unpaired_electrons":"4"}`
*   **Auditable Numerical Target**: `4.9 BM`

#### Step-by-Step Solver Derivation
```latex
1. Determine oxidation state of Co in [CoF6]^{3-}: let x = oxidation state. x + 6(-1) = -3 ⇒ x = +3. Thus Co is in +3 oxidation state.\n2. Electron count: neutral Co is [Ar]3d^7 4s^2. Removing three electrons (first the 4s^2, then one 3d) gives Co^{3+} with a d^6 configuration.\n3. Identify ligand field strength: F^- is a weak-field ligand, therefore the complex is high‑spin.\n4. High‑spin d^6 electron distribution in an octahedral field: t_{2g} (lower) gets 4 electrons (one pair + two unpaired), e_g (higher) gets 2 electrons (both unpaired). Hence configuration = t_{2g}^4 e_g^2.\n5. Crystal‑field stabilization energy (CFSE) = (n_{t2g})(-0.4Δ_0) + (n_{eg})(+0.6Δ_0)\n   = 4(-0.4Δ_0) + 2(+0.6Δ_0) = -1.6Δ_0 + 1.2Δ_0 = -0.4Δ_0.\n6. Number of unpaired electrons = 2 (from t_{2g}) + 2 (from e_g) = 4.\n7. Spin‑only magnetic moment μ_{so} = √[n(n+2)] BM = √[4(4+2)] BM = √24 BM ≈ 4.90 BM.\nThus the correct combination is CFSE = -0.4Δ_0 and μ_{so} = 4.90 BM.
```

#### Explanatory Curation
> 1. Oxidation state: In $[\mathrm{CoF_{6}}]^{3-}$ the charge on Co is +3, giving a $d^{6}$ configuration.\n2. Ligand field: $\mathrm{F^{-}}$ is a weak‑field ligand ⇒ high‑spin octahedral splitting.\n3. Electron filling: high‑spin $d^{6}$ → $t_{2g}^{4}e_{g}^{2}$ with 4 unpaired electrons.\n4. CFSE: $$\text{CFSE}=(-0.4\times4+0.6\times2)\Delta_{0}= -0.4\Delta_{0}.$$\n5. Spin‑only magnetic moment: $$\mu_{\text{so}}=\sqrt{n(n+2)}\,\text{BM}=\sqrt{4\times6}\,\text{BM}=\sqrt{24}\,\text{BM}\approx4.90\,\text{BM}.$$

----

### Topic 12: Solutions [Class 12 - Chemistry]
*   **Subtopic**: `Partial association and Van 't Hoff factors in non-polar organic solvents`
*   **Cognitive Difficulty**: `BAND 9 — Colligative Associations` (ELO: 2550)
*   **Standard Error Trap**: `chemistry.thermo.association_i_misinterpretation`
*   **Target Exam**: `NEET`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
Acetic acid dimerizes in benzene. A 0.1 m solution of acetic acid in benzene shows a freezing point depression of 0.256 K. Find the degree of association of acetic acid if Kf for benzene is 5.12 K kg/mol.
Options: A) 50%, B) 80%, C) 90%, D) 100%
```

#### Curated & Typeset Question (LaTeX)
> Acetic acid ($\mathrm{CH_3COOH}$) dimerizes in benzene according to $2\,\mathrm{HA}\rightleftharpoons(\mathrm{HA})_2$. A $0.1\,\text{m}$ solution of acetic acid in benzene shows a freezing‑point depression of $\Delta T_f = 0.256\,\text{K}$. Given the cryoscopic constant of benzene $K_f = 5.12\,\text{K\,kg\,mol^{-1}}$, calculate the degree of association (fraction dimerized) of acetic acid.

#### Options List
1. 50 %
2. 80 %
3. 90 %
4. 100 %

*   **Generator Declared Correct**: `100 %`
*   **Solver Derived Option**: `100 %`
*   **Primary Governing Formula**: `$$$$\Delta T_f = i\,K_f\,m$$$$`
*   **Given Parameters**: `{"\\Delta T_f":"0.256\\,\\text{K}","K_f":"5.12\\,\\text{K\\,kg\\,mol^{-1}}","m":"0.1\\,\\text{mol\\,kg^{-1}}"}`
*   **Auditable Numerical Target**: `100 %`

#### Step-by-Step Solver Derivation
```latex
Let the initial molality of acetic acid (HA) be \(c_0 = 0.10\,\text{m}\). For the dimerization equilibrium \(2\,\text{HA} \rightleftharpoons (\text{HA})_2\), let \(x\) be the molality of the dimer formed at equilibrium. Then:\n\n- Monomer concentration at equilibrium: \(c_{\text{HA}} = c_0 - 2x\).\n- Dimer concentration at equilibrium: \(c_{(\text{HA})_2}= x\).\n\nThe total concentration of solute particles (which determines the freezing‑point depression) is the sum of the concentrations of all species:\n\[ m_{\text{total}} = c_{\text{HA}} + c_{(\text{HA})_2} = (c_0 - 2x) + x = c_0 - x. \]\n\nFreezing‑point depression is given by \(\Delta T_f = K_f\,m_{\text{total}}\). Using the data:\n\[ 0.256\,\text{K} = 5.12\,\frac{\text{K·kg}}{\text{mol}}\times m_{\text{total}} \]\n\[ \Rightarrow m_{\text{total}} = \frac{0.256}{5.12}=0.050\,\text{m}. \]\n\nHence:\n\[ c_0 - x = 0.050 \quad\Rightarrow\quad x = c_0 - 0.050 = 0.100 - 0.050 = 0.050\,\text{m}. \]\n\nThe degree of association \(\alpha\) is defined as the fraction of the original monomer units that become part of dimers:\n\[ \alpha = \frac{\text{monomer units in dimers}}{\text{initial monomer units}} = \frac{2x}{c_0}. \]\nSubstituting the values:\n\[ \alpha = \frac{2\times0.050}{0.100}=1.0 \;\text{(i.e., 100%)}. \]\nThus all acetic‑acid molecules are dimerized in the benzene solution.\n\nHence the correct choice is 100 %.
```

#### Explanatory Curation
> 1. The freezing‑point depression for a non‑electrolyte is\n$$\Delta T_f = i\,K_f\,m,$$\nwhere $i$ is the van ’t Hoff factor.\n\n2. Compute $i$ from the data:\n$$i = \frac{\Delta T_f}{K_f\,m}=\frac{0.256}{5.12\times0.1}=0.5.$$\n\n3. For dimerization, the van ’t Hoff factor is expressed in terms of the degree of association $\alpha$ (fraction of monomers that dimerize):\n$$i = 1-\frac{\alpha}{2}.$$\n\n4. Equate the two expressions for $i$ and solve for $\alpha$:\n$$1-\frac{\alpha}{2}=0.5\;\Rightarrow\;\frac{\alpha}{2}=0.5\;\Rightarrow\;\alpha=1.0,$$\nwhich corresponds to $100\%$ of the acetic acid molecules forming dimers.\n\nThus the degree of association is $100\%$.

----

### Topic 13: Complex Numbers [Class 11 - Mathematics]
*   **Subtopic**: `Locus of complex points under fractionally linear transformations`
*   **Cognitive Difficulty**: `BAND 11 — Mobius Transformations on Complex Plane` (ELO: 2890)
*   **Standard Error Trap**: `math.complex.modulus.square_missing`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
If |z - i| / |z + i| = 2, find the locus of the complex number z in the Argand plane.
Options: A) A circle centered at (0, -5i/3) with radius 4/3, B) A straight line parallel to the real axis, C) An ellipse, D) A circle centered at (0, 5i/3) with radius 4/3
```

#### Curated & Typeset Question (LaTeX)
> If \(\displaystyle\frac{|z - i|}{|z + i|} = 2\), find the locus of the complex number \(z\) in the Argand plane.

#### Options List
1. A) A circle centered at (0, -5i/3) with radius 4/3
2. B) A straight line parallel to the real axis
3. C) An ellipse
4. D) A circle centered at (0, 5i/3) with radius 4/3

*   **Generator Declared Correct**: `A) A circle centered at (0, -5i/3) with radius 4/3`
*   **Solver Derived Option**: `A) A circle centered at (0, -5i/3) with radius 4/3`
*   **Primary Governing Formula**: `$$$|z-i|^2 = 4|z+i|^2$$$`
*   **Given Parameters**: `{"k":"2"}`
*   **Auditable Numerical Target**: `1.3333333333333333 unitless`

#### Step-by-Step Solver Derivation
```latex
Let z = x + iy, where x and y are real. Then\n\[|z - i| = \sqrt{x^2 + (y-1)^2},\quad |z + i| = \sqrt{x^2 + (y+1)^2}.\]\nThe given condition is\n\[\frac{|z-i|}{|z+i|}=2 \;\Longrightarrow\; |z-i| = 2\,|z+i|.\]\nSquaring both sides eliminates the square‑roots:\n\[x^2+(y-1)^2 = 4\bigl[x^2+(y+1)^2\bigr].\]\nExpand the terms:\n\[x^2 + y^2 -2y +1 = 4x^2 + 4y^2 +8y +4.\]\nBring all terms to the right‑hand side:\n\[0 = 4x^2 +4y^2 +8y +4 - x^2 - y^2 +2y -1,\]\nwhich simplifies to\n\[3x^2 + 3y^2 +10y +3 = 0.\]\nDivide by 3:\n\[x^2 + y^2 + \frac{10}{3}y + 1 = 0.\]\nComplete the square in y:\n\[y^2 + \frac{10}{3}y = \left(y+\frac{5}{3}\right)^2 - \left(\frac{5}{3}\right)^2.\]\nSubstituting back:\n\[x^2 + \left(y+\frac{5}{3}\right)^2 - \frac{25}{9} + 1 = 0,\]\n\[x^2 + \left(y+\frac{5}{3}\right)^2 = \frac{25}{9} - 1 = \frac{16}{9}.\]\nThus the locus is a circle with centre \((0, -\frac{5}{3})\) (i.e. \(0-\frac{5i}{3}\) in the Argand plane) and radius \(\sqrt{\frac{16}{9}} = \frac{4}{3}\). This matches option A.
```

#### Explanatory Curation
> 1. Square the given modulus equation: \(|z-i|^2 = 4|z+i|^2\).\\n2. Write \(z = x+iy\) and expand: \(x^2+(y-1)^2 = 4\bigl[x^2+(y+1)^2\bigr]\).\\n3. Simplify to obtain \(x^2 + y^2 + \frac{10}{3}y + 1 = 0\).\\n4. Complete the square in \(y\): \(x^2 + (y+\frac{5}{3})^2 = \frac{16}{9}\).\\n5. Recognize the standard circle equation \((x-0)^2 + (y+\frac{5}{3})^2 = (\frac{4}{3})^2\), giving centre \((0,-\frac{5}{3})\) and radius \(\frac{4}{3}\).

----

### Topic 14: Determinants [Class 12 - Mathematics]
*   **Subtopic**: `Consistency of linear systems under parameter-dependent determinant singularities`
*   **Cognitive Difficulty**: `BAND 11 — Matrix Parametric Singularities` (ELO: 2820)
*   **Standard Error Trap**: `math.linear_algebra.singular_matrix`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
For what values of lambda does the system of equations x + y + z = 1, x + 2y + 4z = lambda, x + 4y + 10z = lambda^2 have a unique solution?
Options: A) For all real lambda, B) Only lambda = 1 or 2, C) No values of lambda (determinant is 0), D) None of these.
```

#### Curated & Typeset Question (LaTeX)
> For what values of the parameter $\lambda$ does the linear system $$\begin{cases} x + y + z = 1 \\ x + 2y + 4z = \lambda \\ x + 4y + 10z = \lambda^{2} \end{cases}$$ have a unique solution?

#### Options List
1. For every real $\lambda$.
2. Only for $\lambda = 1$ or $\lambda = 2$.
3. For no real $\lambda$ (the coefficient matrix is singular).
4. For a single specific $\lambda$ determined by the consistency condition.

*   **Generator Declared Correct**: `For no real $\lambda$ (the coefficient matrix is singular).`
*   **Solver Derived Option**: `For no real $\`
*   **Primary Governing Formula**: `$$Coefficient matrix $A = \begin{pmatrix}1&1&1\\1&2&4\\1&4&10\end{pmatrix}$$$`
*   **Given Parameters**: `{"lambda":"parameter"}`
*   **Auditable Numerical Target**: `0 unitless`

#### Step-by-Step Solver Derivation
```latex
We examine the coefficient matrix A of the system: \[A = \begin{pmatrix}1 & 1 & 1\\ 1 & 2 & 4\\ 1 & 4 & 10\end{pmatrix}.\] A unique solution exists iff det(A) \neq 0. Compute the determinant: \n\[\det A =\begin{vmatrix}1&1&1\\1&2&4\\1&4&10\end{vmatrix}.\] Subtract the first row from the second and third rows (row operations of the type R_i \leftarrow R_i - R_1 do not change the determinant): \n\[\begin{pmatrix}1&1&1\\0&1&3\\0&3&9\end{pmatrix}.\] Expanding along the first column gives \n\[\det A = 1\cdot\begin{vmatrix}1&3\\3&9\end{vmatrix} = 1\,(1\cdot9-3\cdot3) = 1\,(9-9) = 0.\] Thus det(A)=0 for every real \(\lambda\). The matrix is singular, so its rank is at most 2. A unique solution would require rank = 3 (the number of unknowns), which is impossible. Hence no real \(\lambda\) yields a unique solution; at best the system could be inconsistent or have infinitely many solutions for particular \(\lambda\), but never a single solution. \nTherefore the correct choice is option 3.
```

#### Explanatory Curation
> 1. Form the coefficient matrix $A = \begin{pmatrix}1&1&1\\1&2&4\\1&4&10\end{pmatrix}$.\n2. Compute its determinant: $\det A = \begin{vmatrix}1&1&1\\1&2&4\\1&4&10\end{vmatrix}=0$ (e.g., subtract the first row from the others and evaluate).\n3. Since $\det A = 0$, the system is never non‑singular; hence no $\lambda$ can give a unique solution.\n4. The system may be consistent for particular $\lambda$, but uniqueness requires $\det A \neq 0$, which never occurs.

----

### Topic 15: Three Dimensional Geometry [Class 12 - Mathematics]
*   **Subtopic**: `Shortest distance between parametric non-intersecting skew lines in R^3`
*   **Cognitive Difficulty**: `BAND 11 — Skew Line Projections` (ELO: 2860)
*   **Standard Error Trap**: `math.geometry.skew_line.missing_absolute_value`
*   **Target Exam**: `JEE-Advanced`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
Find the shortest distance between the lines x/2 = y/(-3) = z/1 and (x-2)/3 = (y-1)/(-5) = (z+2)/2.
Options: A) 1/sqrt(3), B) 3/sqrt(6), C) 9/sqrt(38), D) 1/sqrt(26)
```

#### Curated & Typeset Question (LaTeX)
> Find the shortest distance between the skew lines \(\frac{x}{2}=\frac{y}{-3}=\frac{z}{1}\) and \(\frac{x-2}{3}=\frac{y-1}{-5}=\frac{z+2}{2}\).

#### Options List
1. $\frac{1}{\sqrt{3}}$
2. $\frac{3}{\sqrt{6}}$
3. $\frac{9}{\sqrt{38}}$
4. $\frac{1}{\sqrt{26}}$

*   **Generator Declared Correct**: `$\frac{1}{\sqrt{3}}$`
*   **Solver Derived Option**: `$\frac{1}{\sqrt{3}}$`
*   **Primary Governing Formula**: `$$d = \frac{|(P_2 - P_1) \cdot (d_1 \times d_2)|}{\|d_1 \times d_2\|}$$`
*   **Given Parameters**: `{"d1":"(2, -3, 1)","d2":"(3, -5, 2)","P1":"(0, 0, 0)","P2":"(2, 1, -2)"}`
*   **Auditable Numerical Target**: `0.5773502691896258 `

#### Step-by-Step Solver Derivation
```latex
Let the first line L₁ be given by \(\frac{x}{2}=\frac{y}{-3}=\frac{z}{1}=t\). Hence a parametric form is \(\mathbf{r}_1(t)= (2t, -3t, t)\) with direction vector \(\mathbf{d}_1 = \langle 2,-3,1\rangle\) and a point \(P_0=(0,0,0)\).\\nSimilarly, write the second line L₂ as \(\frac{x-2}{3}=\frac{y-1}{-5}=\frac{z+2}{2}=s\), giving \(\mathbf{r}_2(s)= (2+3s,\;1-5s,\;-2+2s)\) with direction vector \(\mathbf{d}_2 = \langle 3,-5,2\rangle\) and a point \(Q_0=(2,1,-2)\).\\nThe shortest distance between two skew lines is\\n\[ d = \frac{|(Q_0-P_0)\cdot(\mathbf{d}_1\times\mathbf{d}_2)|}{|\mathbf{d}_1\times\mathbf{d}_2|}. \]\\nCompute the cross product:\\n\[\mathbf{d}_1\times\mathbf{d}_2 = \begin{vmatrix} \mathbf{i}&\mathbf{j}&\mathbf{k}\\ 2&-3&1\\ 3&-5&2 \end{vmatrix}=\langle -1,-1,-1\rangle. \]\\nIts magnitude is \(|\mathbf{d}_1\times\mathbf{d}_2| = \sqrt{(-1)^2+(-1)^2+(-1)^2}=\sqrt{3}.\)\\nNow \(Q_0-P_0 = (2,1,-2)\). Dot product with the cross product:\\n\[(2,1,-2)\cdot(-1,-1,-1) = -2-1+2 = -1.\] The absolute value is 1.\\nTherefore\\n\[ d = \frac{1}{\sqrt{3}}. \]\\nThus the shortest distance equals \(\frac{1}{\sqrt{3}}\).
```

#### Explanatory Curation
> 1. Extract direction vectors \(\mathbf{d_1}=\langle2,-3,1\rangle\) and \(\mathbf{d_2}=\langle3,-5,2\rangle\) and points \(P_1=(0,0,0)\), \(P_2=(2,1,-2)\).\\n2. Compute the cross product \[\mathbf{d_1}\times\mathbf{d_2}=\begin{vmatrix}\mathbf{i}&\mathbf{j}&\mathbf{k}\\2&-3&1\\3&-5&2\end{vmatrix}=(-1,-1,-1)\] so \(\|\mathbf{d_1}\times\mathbf{d_2}\|=\sqrt{3}\).\\n3. Form the connecting vector \(\mathbf{P}=P_2-P_1=(2,1,-2)\) and evaluate the scalar triple product \[|\mathbf{P}\cdot(\mathbf{d_1}\times\mathbf{d_2})|=|(2,1,-2)\cdot(-1,-1,-1)|=| -1|=1.\]\\n4. Apply the skew‑line distance formula \[d=\frac{|\mathbf{P}\cdot(\mathbf{d_1}\times\mathbf{d_2})|}{\|\mathbf{d_1}\times\mathbf{d_2}\|}=\frac{1}{\sqrt{3}}.\]

----

### Topic 16: Molecular Basis of Inheritance [Class 12 - Biology]
*   **Subtopic**: `Chargaff's rules apply to dsDNA as whole, not to individual strands`
*   **Cognitive Difficulty**: `BAND 10 — Chargaff Single-Strand Composition Trap` (ELO: 2700)
*   **Standard Error Trap**: `biology.genetics.chargaff_single_strand_trap`
*   **Target Exam**: `NEET`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
A double-stranded DNA molecule contains 20% Adenine. A researcher assumes the template strand also contains 30% Guanine (same as the overall dsDNA) and uses this to calculate that the mRNA will have 30% Cytosine. Which of the following statements correctly evaluates this reasoning?
Options: A) The reasoning is correct; Chargaff's rules apply to each individual strand so the template strand does have 30% G, giving 30% C in the mRNA. B) The reasoning is incorrect; the base composition of each individual strand is not determined solely by the overall dsDNA percentages, so %G in the template strand is unknown and mRNA %C cannot be determined. C) The reasoning is incorrect; the mRNA %C equals the overall %A in the dsDNA, which is 20%. D) The reasoning is incorrect; the mRNA %C equals 100% minus the sum of A, G, and T in the dsDNA.
```

#### Curated & Typeset Question (LaTeX)
> A double‑stranded DNA molecule contains $20\%$ adenine (A). A researcher assumes that the template strand also contains $30\%$ guanine (G) (the same as the overall dsDNA) and uses this to calculate that the resulting mRNA will have $30\%$ cytosine (C). Which of the following statements correctly evaluates this reasoning?

#### Options List
1. A) The reasoning is correct; Chargaff's rules apply to each individual strand so the template strand indeed has $30\%$ G, giving $30\%$ C in the mRNA.
2. B) The reasoning is incorrect; the base composition of each strand cannot be inferred from the overall dsDNA percentages, therefore the %G in the template strand is unknown and the %C in the mRNA cannot be determined from the given information.
3. C) The reasoning is incorrect; the %C in the mRNA equals the overall %A in the dsDNA, i.e. $20\%$.
4. D) The reasoning is incorrect; the %C in the mRNA equals $100\%$ minus the sum of adenine, guanine, and thymine percentages in the dsDNA.

*   **Generator Declared Correct**: `B) The reasoning is incorrect; the base composition of each strand cannot be inferred from the overall dsDNA percentages, therefore the %G in the template strand is unknown and the %C in the mRNA cannot be determined from the given information.`
*   **Solver Derived Option**: `B) The reasoning is incorrect; the base composition of each strand cannot be inferred from the overall dsDNA percentages, therefore the %G in the template strand is unknown and the %C in the mRNA cannot be determined from the given information.`
*   **Primary Governing Formula**: `$$$\%A_{\text{ds}} = \%T_{\text{ds}},\quad \%G_{\text{ds}} = \%C_{\text{ds}},\quad \%A_{\text{ds}} + \%T_{\text{ds}} + \%G_{\text{ds}} + \%C_{\text{ds}} = 100\%$$$`
*   **Given Parameters**: `{"%A_{ds}":"20%"}`
*   **Auditable Numerical Target**: `0 %`

#### Step-by-Step Solver Derivation
```latex
The problem states that a double‑stranded DNA (dsDNA) molecule contains 20 % adenine (A). By Chargaff's rules, which apply to the *whole* dsDNA molecule, the percentages of complementary bases are equal: %A = %T and %G = %C. Therefore, for the dsDNA as a whole we have:\n\n- %A = 20 %  →  %T = 20 % (by Chargaff)\n- The remaining fraction is 100 % – (20 % + 20 %) = 60 % which must be split equally between G and C, giving %G = %C = 30 % for the *overall* dsDNA.\n\nHowever, Chargaff's rules do **not** apply to each individual strand. The two complementary strands can have any distribution of A, T, G, C so long as, when paired, the overall dsDNA composition satisfies the above percentages. For example, one strand could contain 10 % A, 30 % T, 40 % G, 20 % C while the complementary strand contains the corresponding 10 % T, 30 % A, 20 % C, 40 % G. Both strands together still give the required overall 20 % A, 20 % T, 30 % G, 30 % C.\n\nBecause the composition of the *template* strand is not specified, we cannot deduce its %G. Consequently, when transcription creates mRNA using the template strand, the percentage of cytosine (C) in the mRNA— which equals the %G of the template strand—cannot be determined from the given information. The researcher’s assumption that the template strand also contains 30 % G is unwarranted.\n\nThus the correct evaluation is that the reasoning is incorrect; the %G in the template strand is unknown, and the %C in the mRNA cannot be inferred from the provided dsDNA percentages.
```

#### Explanatory Curation
> 1. Chargaff's rules apply to the double‑stranded DNA as a whole: $\%A_{\text{ds}} = \%T_{\text{ds}}$ and $\%G_{\text{ds}} = \%C_{\text{ds}}$.\n2. Given $\%A_{\text{ds}} = 20\%$, we obtain $\%T_{\text{ds}} = 20\%$. The remaining $60\%$ of bases are split equally between G and C, so $\%G_{\text{ds}} = \%C_{\text{ds}} = 30\%$.\n3. These percentages describe the **whole** duplex, not the individual strands; the template strand may have any distribution that pairs correctly with its complement.\n4. Because the template strand's guanine content is not fixed by the overall percentages, the cytosine content of the transcribed mRNA cannot be deduced from the given data. Hence the researcher’s reasoning is flawed.

----

### Topic 17: Photosynthesis in Higher Plants [Class 11 - Biology]
*   **Subtopic**: `Enzymatic efficiency of RuBisCO in C3 vs C4 plants under high temperatures`
*   **Cognitive Difficulty**: `BAND 9 — Photosynthetic Enzymatic Limits` (ELO: 2500)
*   **Standard Error Trap**: `biology.misconception.location_confusion`
*   **Target Exam**: `NEET`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
In C4 plants, the primary CO2 acceptor is PEP in the mesophyll cells. What is the first stable product of carbon fixation and where is RuBisCO located?
Options: A) Oxaloacetic acid in mesophyll; RuBisCO in bundle sheath, B) Phosphoglyceric acid in mesophyll; RuBisCO in bundle sheath, C) Oxaloacetic acid in bundle sheath; RuBisCO in mesophyll, D) Phosphoglyceric acid in bundle sheath; RuBisCO in mesophyll
```

#### Curated & Typeset Question (LaTeX)
> In C$_4$ photosynthetic plants, the initial CO$_2$ acceptor in the mesophyll cells is phosphoenolpyruvate (PEP). Identify the first stable product formed after CO$_2$ fixation and specify the cellular compartment where the enzyme RuBisCO operates.

#### Options List
1. Oxaloacetic acid in mesophyll; RuBisCO in bundle sheath
2. Phosphoglyceric acid in mesophyll; RuBisCO in bundle sheath
3. Oxaloacetic acid in bundle sheath; RuBisCO in mesophyll
4. Phosphoglyceric acid in bundle sheath; RuBisCO in mesophyll

*   **Generator Declared Correct**: `Oxaloacetic acid in mesophyll; RuBisCO in bundle sheath`
*   **Solver Derived Option**: `Oxaloacetic acid in mesophyll; RuBisCO in bundle sheath`
*   **Primary Governing Formula**: `$$v = V_{\max}\frac{[CO_2]}{K_m + [CO_2]}$$`
*   **Given Parameters**: `{"V_{\\max}":"100 \\; \\mu mol \\; m^{-2} \\; s^{-1}","K_m":"0.3 \\; mM","[CO_2]":"0.5 \\; mM"}`
*   **Auditable Numerical Target**: `62.5 µmol·m⁻²·s⁻¹`

#### Step-by-Step Solver Derivation
```latex
In C₄ photosynthesis the first CO₂‑fixing enzyme is PEP carboxylase, which is localized in the cytosol of mesophyll cells. The reaction is:\n\nPEP + HCO₃⁻ → Oxaloacetate + Pi\n\nOxaloacetate (oxaloacetic acid) is the first stable C₄‑acid formed after CO₂ fixation. It is rapidly reduced to malate (or transaminated to aspartate) and shuttled to the bundle‑sheath cells. In the bundle‑sheath chloroplasts CO₂ is released from the C₄‑acid and then fixed by the Calvin‑cycle enzyme RuBisCO. Hence RuBisCO operates in the bundle‑sheath compartment (specifically in the bundle‑sheath chloroplast stroma). Therefore the correct combination is: oxaloacetic acid formed in the mesophyll and RuBisCO acting in the bundle sheath.
```

#### Explanatory Curation
> 1. In C$_4$ leaves, PEP carboxylase in mesophyll chloroplasts fixes CO$_2$ to form oxaloacetate: $$\text{PEP} + CO_2 \xrightarrow{\text{PEP carboxylase}} \text{Oxaloacetate}$$\n2. Oxaloacetate is rapidly reduced to malate (or aspartate) and shuttled to the bundle‑sheath cells.\n3. In the bundle sheath, malate is decarboxylated, releasing CO$_2$ for the Calvin cycle.\n4. RuBisCO, the CO$_2$‑fixing enzyme of the Calvin cycle, resides in the bundle‑sheath chloroplasts.\n5. Hence the first stable product is oxaloacetic acid in the mesophyll, and RuBisCO is located in the bundle sheath.

----

### Topic 18: Excretory Products and Elimination [Class 11 - Biology]
*   **Subtopic**: `Osmotic gradients in Henle's Loop during counter-current multiplication`
*   **Cognitive Difficulty**: `BAND 9 — Counter-Current Concentrative Exchange` (ELO: 2580)
*   **Standard Error Trap**: `biology.physiology.misinterpretation`
*   **Target Exam**: `NEET`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
Which part of the nephron is completely impermeable to water but highly permeable to active or passive absorption of electrolytes?
Options: A) Descending limb of Henle's loop, B) Ascending limb of Henle's loop, C) Proximal convoluted tubule, D) Distal convoluted tubule
```

#### Curated & Typeset Question (LaTeX)
> Which part of the nephron is completely impermeable to water but highly permeable to active or passive absorption of electrolytes?

#### Options List
1. Descending limb of Henle's loop
2. Ascending limb of Henle's loop
3. Proximal convoluted tubule
4. Distal convoluted tubule

*   **Generator Declared Correct**: `Ascending limb of Henle's loop`
*   **Solver Derived Option**: `Ascending limb of Henle's loop`
*   **Primary Governing Formula**: `$$N/A$$`
*   **Auditable Numerical Target**: `0 `

#### Step-by-Step Solver Derivation
```latex
The nephron segments differ in their permeability to water and solutes:\n1. **Descending limb of Henle's loop** – highly permeable to water (water follows the osmotic gradient) but relatively impermeable to solutes. Hence it cannot be the answer because the question asks for a segment that is *completely impermeable to water*.\n2. **Ascending limb of Henle's loop** – the thick segment contains the Na⁺‑K⁺‑2Cl⁻ cotransporter and is involved in active reabsorption of Na⁺, K⁺ and Cl⁻. The thin segment allows passive reabsorption of Na⁺ and Cl⁻. Importantly, the epithelium of the ascending limb lacks aquaporin channels, making it *impermeable to water*. Thus it matches the description: water‑impermeable but electrolyte‑permeable (both active and passive mechanisms).\n3. **Proximal convoluted tubule** – reabsorbs a large fraction of filtered water and solutes; it is permeable to water, so it does not satisfy the “completely impermeable to water” criterion.\n4. **Distal convoluted tubule** – reabsorbs electrolytes under hormonal control and does have some water permeability (especially under antidiuretic hormone influence), but it is not completely water‑impermeable.\nTherefore, the only nephron segment that is completely impermeable to water while allowing active/passive electrolyte absorption is the **ascending limb of Henle's loop**.\n\nConclusion: Option 2 is correct.
```

#### Explanatory Curation
> 1. The descending limb of Henle's loop is highly permeable to water but has limited electrolyte transport.\newline 2. The ascending limb (especially the thin segment) is impermeable to water, preventing water reabsorption.\newline 3. The thick segment of the ascending limb actively transports Na⁺, K⁺, and Cl⁻ via Na⁺‑K⁺‑2Cl⁻ cotransporters and passive channels.\newline 4. Therefore, the nephron segment that fits the description is the ascending limb of Henle's loop.

----

### Topic 19: Principles of Inheritance and Variation [Class 12 - Biology]
*   **Subtopic**: `Mapping linkage distances and recombination frequency from test-cross ratios`
*   **Cognitive Difficulty**: `BAND 11 — Gene Linkage Chromosome Recombination` (ELO: 2700)
*   **Standard Error Trap**: `biology.genetics.recombination_frequency_misinterpretation`
*   **Target Exam**: `NEET`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
A dihybrid test cross for two genes A and B in Drosophila shows 82% parental combinations and 18% recombinant combinations. What is the distance between the two genes on the chromosome?
Options: A) 18 centimorgans, B) 82 centimorgans, C) 9 centimorgans, D) 41 centimorgans
```

#### Curated & Typeset Question (LaTeX)
> A dihybrid test cross for two genes \(A\) and \(B\) in *Drosophila* shows $82\%$ parental combinations and $18\%$ recombinant combinations. What is the genetic distance between the two genes on the chromosome?

#### Options List
1. $18\,\text{cM}$
2. $82\,\text{cM}$
3. $9\,\text{cM}$
4. $41\,\text{cM}$

*   **Generator Declared Correct**: `$18\,\text{cM}$`
*   **Solver Derived Option**: `18 cM`
*   **Primary Governing Formula**: `$$$d = r \times 100$$$`
*   **Given Parameters**: `{"r":"0.18"}`
*   **Auditable Numerical Target**: `18 cM`

#### Step-by-Step Solver Derivation
```latex
In a dihybrid test cross, the proportion of recombinant offspring directly reflects the recombination frequency (RF) between the two loci. Genetic distance in centimorgans (cM) is defined as RF × 100. Here, recombinant combinations = 18% of the total progeny, so RF = 0.18. Therefore, distance = 0.18 × 100 = 18 cM.
```

#### Explanatory Curation
> 1. The recombination frequency \(r\) is equal to the proportion of recombinant progeny.\\n   $$r = \frac{\text{recombinant\%}}{100}=\frac{18}{100}=0.18.$$\\n2. Genetic distance (in centimorgans) is defined as \(d = r\times100\).\\n   $$d = 0.18 \times 100 = 18\,\text{cM}.$$\\n3. Hence the distance between genes \(A\) and \(B\) is $18\,\text{cM}$.

----

### Topic 20: Biotechnology: Principles and Processes [Class 12 - Biology]
*   **Subtopic**: `Agarose gel electrophoresis band migration rates based on fragment base-pair length`
*   **Cognitive Difficulty**: `BAND 10 — Gel Electrophoresis Analysis` (ELO: 2620)
*   **Standard Error Trap**: `biology.electrophoresis.polarity_misinterpretation`
*   **Target Exam**: `NEET`
*   **Verdict**: ✅ **APPROVED (FIRST PASS)**

#### Ingested Messy Public Question
```text
During agarose gel electrophoresis, DNA fragments separate according to their size. Which of the following is correct regarding the migration speed of fragments?
Options: A) Smallest fragments migrate slowest towards the cathode, B) Largest fragments migrate fastest towards the anode, C) Smallest fragments migrate fastest towards the anode, D) Largest fragments migrate slowest towards the anode
```

#### Curated & Typeset Question (LaTeX)
> During agarose gel electrophoresis, DNA fragments separate according to their size. Which of the following statements correctly describes the migration speed of the fragments?

#### Options List
1. The smallest fragments migrate slowest towards the cathode.
2. The largest fragments migrate fastest towards the anode.
3. The smallest fragments migrate fastest towards the anode.
4. The largest fragments migrate slowest towards the anode.

*   **Generator Declared Correct**: `The smallest fragments migrate fastest towards the anode.`
*   **Solver Derived Option**: `The smallest fragments migrate fastest towards the anode.`
*   **Primary Governing Formula**: `$$$$\mu = \frac{v}{E}$$$$`
*   **Given Parameters**: `{"v_{small}":"0.25\\,\\text{cm\\,s}^{-1}","E":"100\\,\\text{V\\,cm}^{-1}"}`
*   **Auditable Numerical Target**: `0.0025 cm^{2}\,V^{-1}\,s^{-1}`

#### Step-by-Step Solver Derivation
```latex
DNA molecules carry a uniform negative charge due to the phosphate backbone. In an agarose gel, an electric field \(\mathbf{E}\) is established between the cathode (negative) and the anode (positive). The electrophoretic force on a DNA fragment is \(\mathbf{F}=q\mathbf{E}\), where \(q\) is proportional to the fragment length (more phosphates → more charge). However, the fragment also experiences a viscous drag force \(\mathbf{F}_d = -\gamma v\) from the gel matrix, where \(\gamma\) is a friction coefficient that increases with the fragment’s hydrodynamic radius (i.e., its size). The steady‑state velocity is obtained from force balance:\n\[ qE = \gamma v \quad \Rightarrow \quad v = \frac{qE}{\gamma}. \]\nFor DNA, \(q \propto L\) (length) and \(\gamma \propto L^{\alpha}\) with \(\alpha > 1\) because larger fragments experience disproportionately larger friction in the porous agarose network. Consequently, the mobility \(\mu = v/E = q/\gamma\) decreases with increasing length. Therefore, smaller fragments (smaller \(L\)) have a lower friction coefficient relative to their charge and move faster, while larger fragments move slower. Since DNA is negatively charged, it migrates toward the positive electrode, i.e., the anode. Hence, the correct description is that the smallest fragments migrate fastest towards the anode.
```

#### Explanatory Curation
> 1. DNA carries a uniform negative charge; under an electric field it moves toward the positive electrode (anode).\\n2. The electrophoretic mobility $\mu$ is defined as $\mu = \frac{v}{E}$, where $v$ is the migration velocity and $E$ the electric field strength.\\n3. Mobility is inversely proportional to the frictional coefficient, which increases with fragment length; therefore shorter fragments experience less friction and attain higher $v$ for the same $E$.\\n4. Consequently, the smallest fragments travel fastest toward the anode, while larger fragments move more slowly.

----

