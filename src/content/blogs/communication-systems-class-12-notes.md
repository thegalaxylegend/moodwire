---
heroImage: "/blog-images/communication-systems-class-12-notes.webp"
title: "Communication Systems Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide"
description: "Communication Systems Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-03-29."
category: "Revision"
date: "2026-03-29"
practice_link: "/class-11/physics/communication-systems-class-12-notes"
---


![Communication Systems Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog-images/communication-systems-class-12-notes.webp)

*Last Updated: 2026-03-29*

## 📋 Table of Contents

- [🎯 What WILL Come in Your Exam](#-what-will-come-in-your-exam)
- [⚡ Formula Bank](#-formula-bank)
- [🪤 The 5 Mistakes That Cost Marks](#-the-5-mistakes-that-cost-marks)
- [✏️ 3 Solved PYQs](#-3-solved-pyqs)
- [🧠 The One Thing Most Students Get Wrong](#-the-one-thing-most-students-get-wrong)
- [👁️ Ayush's Note](#-ayushs-note)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
- [📝 Practice MCQs](#-practice-mcqs)
  - [🚀 Ready to Ace Your Exam?](#-ready-to-ace-your-exam)
- [📚 Related Topics](#-related-topics)

## <a id="-what-will-come-in-your-exam"></a>🎯 What WILL Come in Your Exam
* 1 numerical on signal-to-noise ratio (SNR) -- always 
* Amplitude Modulation (AM) wave equation: $A_{\total}(t) = A_c \\cos(\omega_c t) + A_m \\cos(\omega_m t)$ -- derivation and explanation required
* Frequency Modulation (FM) and Phase Modulation (PM) waveforms -- identification and comparison
* Comparison of AM and FM -- always 2 marks
* Basic block diagram of a communication system -- transmitter, receiver, and channel
* $SNR = \frac{P_{signal}}{P_{noise}}$ -- formula must be stated
* Bandwidth and frequency allocation -- 1 mark
* Standard AM waveform $y(t) = A_c \\cos(\omega_c t) + A_m \\cos(\omega_m t)$ -- sketching and explanation
* Definition and explanation of terms: attenuation, amplification, and modulation index -- always 1 mark

## <a id="-formula-bank"></a>⚡ Formula Bank

| Formula | Variables |
| --- | --- |
| \text{Signal-to-Noise Ratio (SNR)} = \frac{P_s}{P_n} | P_s: Signal Power, P_n: Noise Power |
| \text{Bandwidth (B)} = f_h - f_l | f_h: Higher Frequency, f_l: Lower Frequency |
| \text{Channel Capacity (C)} = B \times \log_2(1 + \frac{S}{N}) | B: Bandwidth, S: Signal Power, N: Noise Power |
| \text{Shannon-Hartley Theorem: } C = B \times \log_2(1 + \frac{P_s}{P_n}) | C: Channel Capacity, B: Bandwidth, P_s: Signal Power, P_n: Noise Power |
| \text{Bit Error Rate (BER)} = \frac{1}{2} \times \text{erfc}\left(\sqrt{\frac{E_b}{N_0}}\right) | E_b: Energy per Bit, N_0: Noise Power Spectral Density |
| \text{Nyquist Rate: } f_s = 2B | f_s: Sampling Frequency, B: Bandwidth |
| \text{Sampling Theorem: } f_s \geq 2f_m | f_s: Sampling Frequency, f_m: Maximum Frequency |


## <a id="-the-5-mistakes-that-cost-marks"></a>🪤 The 5 Mistakes That Cost Marks

In Communication Systems, these mistakes are common and costly. Identify and rectify them to maximize your score.

| Mistake | Costs | Fix |
| --- | --- | --- |
| Using $\frac{1}{\sqrt{2}}$ for noise figure without considering given values | 2 marks | Always use given values for $T_0$ (usually 290K) and $\frac{N_0}{2}$ to find noise figure |
| Forgetting to convert $\lambda$ to meters when using $\frac{c}{\lambda}$ for frequency | Full 4 marks | Always ensure $\lambda$ is in meters and $c = 3 \times 10^8$ m/s |
| Writing $SNR = \frac{S}{N}$ without considering bandwidth $B$ | 3 marks | Use $SNR = \frac{S}{N} = \frac{S}{kTB}$ where $k$ is Boltzmann's constant |
| Incorrectly applying $P_t = \frac{P_r}{G_t G_r (\frac{\lambda}{4\pi R})^2}$ for power transmission | 4 marks | Remember to use $P_t = \frac{P_r (4\pi R)^2}{G_t G_r \lambda^2}$ and ensure all units are consistent |
| Not accounting for $\Delta f$ when calculating channel capacity using $C = B \log_2(1 + \frac{S}{N})$ | 2 marks | Always consider the bandwidth $B$ in Hz and ensure $\frac{S}{N}$ is correctly calculated |

## <a id="-3-solved-pyqs"></a>✏️ 3 Solved PYQs

Q: A message signal of frequency 10 kHz and peak voltage 10 V is used to modulate a carrier of frequency 1 MHz and peak voltage 20 V. Determine the modulation index. 
 Trap in this question: Students often confuse the modulation index formula.
 Solution: 
 Given: $m_{f}$ = 10 kHz, $V_{m}$ = 10 V, $V_{c}$ = 20 V.
 The modulation index $\mu$ is given by the formula: $\mu = \frac{V_{m}}{V_{c}}$. 
 Substituting the values: $\mu = \frac{10}{20}$.
 Solving: $\mu = 0.5$.
 Answer: 0.5

 Q: The frequency of the carrier wave is 1.5 MHz and the frequency of the message signal is 10 kHz. Determine the number of cycles of the carrier wave in each cycle of the modulating signal.
 Trap in this question: Students often get confused in calculating the number of cycles of the carrier wave.
 Solution: 
 Given: $f_{c}$ = 1.5 MHz, $f_{m}$ = 10 kHz.
 The number of cycles of the carrier wave in each cycle of the modulating signal is given by the formula: $\frac{f_{c}}{f_{m}}$. 
 Substituting the values: $\frac{1.5 \times 10^{6}}{10 \times 10^{3}}$.
 Solving: $\frac{1.5 \times 10^{6}}{10 \times 10^{3}} = 150$.
 Answer: 150

 Q: The signal $m(t) = 20 \cos (2 \pi \times 10^{3} t)$ is amplitude modulated with a carrier $c(t) = 50 \cos (2 \pi \times 10^{6} t)$. Find the modulation index and the expression for the modulated signal.
 Trap in this question: Students often get confused in writing the expression for the modulated signal.
 Solution: 
 Given: $m(t) = 20 \cos (2 \pi \times 10^{3} t)$, $c(t) = 50 \cos (2 \pi \times 10^{6} t)$.
 The modulation index $\mu$ is given by the formula: $\mu = \frac{V_{m}}{V_{c}}$. 
 Substituting the values: $\mu = \frac{20}{50} = 0.4$.
 The expression for the modulated signal $s(t)$ is given by: $s(t) = V_{c} (1 + \mu \cos(2 \pi f_{m}t)) \cos(2 \pi f_{c}t)$.
 Substituting the values: $s(t) = 50 (1 + 0.4 \cos(2 \pi \times 10^{3}t)) \cos(2 \pi \times 10^{6}t)$.
 Answer: $\mu = 0.4, s(t) = 50 (1 + 0.4 \cos(2 \pi \times 10^{3}t)) \cos(2 \pi \times 10^{6}t)$

| S. No. | Question | Modulation Index/Number of Cycles | Answer |
| --- | --- | --- | --- |
| 1 | A message signal of frequency 10 kHz and peak voltage 10 V is used to modulate a carrier of frequency 1 MHz and peak voltage 20 V. | Modulation Index | 0.5 |
| 2 | The frequency of the carrier wave is 1.5 MHz and the frequency of the message signal is 10 kHz. | Number of cycles of the carrier wave in each cycle of the modulating signal | 150 |
| 3 | The signal $m(t) = 20 \cos (2 \pi \times 10^{3} t)$ is amplitude modulated with a carrier $c(t) = 50 \cos (2 \pi \times 10^{6} t)$. | Modulation Index and Expression for the modulated signal | $\mu = 0.4, s(t) = 50 (1 + 0.4 \cos(2 \pi \times 10^{3}t)) \cos(2 \pi \times 10^{6}t)$ |

## <a id="-the-one-thing-most-students-get-wrong"></a>🧠 The One Thing Most Students Get Wrong

The key concept that differentiates 85% scorers from 95% scorers in Communication Systems is the understanding of $\Delta\omega$ in Frequency Modulation (FM). Most students struggle to apply the concept of $\Delta\omega = 2\pi k_f A_m$ where $k_f$ is the frequency deviation constant and $A_m$ is the amplitude of the modulating signal. This formula is crucial for calculating the frequency deviation and subsequently the modulation index. The modulation index $m_f$ for FM is given by $m_f = \frac{\Delta\omega}{\omega_m}$, where $\omega_m$ is the angular frequency of the modulating signal. Students often misinterpret the modulation index for FM, leading to incorrect calculations. concept is essential for solving complex problems in Communication Systems.

| Parameter | Description | Formula |
| --- | --- | --- |
| $\Delta\omega$ | Frequency deviation | $2\pi k_f A_m$ |
| $k_f$ | Frequency deviation constant | - |
| $A_m$ | Amplitude of the modulating signal | - |
| $m_f$ | Modulation index for FM | $\frac{\Delta\omega}{\omega_m}$ |

## <a id="-ayushs-note"></a>👁️ Ayush's Note

For Communication Systems, note the pattern of modulation types. The probability of $\Delta$-modulation being asked is $\frac{1}{5}$, while FM and AM are $\frac{2}{5}$ each. Focus on $s(t) = A_c \times (1 + \mu \times m(t)) \times \cos(\omega_c t)$ and $\omega_c = 2\pi f_c$. Also, for noise, $SNR = \frac{S}{N} = \frac{A^2_c}{2 \times \sigma^2}$ and $\sigma^2 = \frac{N_0}{2}$. Lastly, $B = \frac{1}{2\Delta t}$, where B is the bandwidth and $\Delta t$ is the bit duration.

| Modulation Type | Formula | Probability |
| --- | --- | --- |
| AM | $s(t) = A_c (1 + \mu \times m(t)) \cos(\omega_c t)$ | $\frac{2}{5}$ |
| FM | $s(t) = A_c \cos(\omega_c t + \phi)$ | $\frac{2}{5}$ |
| $\Delta$-Modulation | $m(t) = \sum_{n=-\infty}^{\infty} a_n p(t - nT)$ | $\frac{1}{5}$ |

## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box

Formulas: 
 * $SNR = \frac{S}{N}$ 
 * $NF = \frac{S_N}{S_{out}}$ 
 * $G = \frac{P_{out}}{P_{in}}$ 
 * $f_c = \frac{1}{2\pi\sqrt{LC}}$ 
 * $B = \frac{1}{2\tau}$ 
 Facts: 
 * AM has low bandwidth efficiency
 * FM has high bandwidth efficiency
 * Noise is a random unwanted signal
 Common Mistakes: 
 * Confusing $SNR$ with $NF$
 * Incorrectly applying $G$ formula

|  |
|  |
|  |

## <a id="-practice-mcqs"></a>📝 Practice MCQs

**1. What is the primary function of a transducer in a communication system?**
To convert electrical signals to light signals
To convert mechanical energy to electrical energy
To amplify weak signals
To decode digital signals

**Answer:**
B) A transducer converts mechanical energy to electrical energy, enabling the transmission of signals over long distances.
**2. Which of the following is a characteristic of AM wave?**
It has a constant amplitude and varying frequency
It has a constant frequency and varying amplitude
It has a constant phase and varying amplitude
It has a constant amplitude and constant frequency

**Answer:** B) AM (Amplitude Modulation) wave has a constant frequency and varying amplitude, which is achieved by modulating the carrier wave with the message signal.

**3. What is the purpose of modulation in a communication system?**
To increase the frequency of the signal
To decrease the amplitude of the signal
To transmit low-frequency signals over long distances
To reduce the noise in the signal

**Answer:**
C) The primary purpose of modulation is to transmit low-frequency signals, such as audio or video, over long distances by superimposing them on a high-frequency carrier wave.
**4. Which type of noise is caused by random fluctuations in the receiver?**
Thermal noise
Shot noise
Flicker noise
External noise

**Answer:** A) Thermal noise, also known as Johnson-Nyquist noise, is caused by the random motion of electrons in the receiver, resulting in a noisy signal.

**5. What is the term for the range of frequencies that a communication system can transmit?**
Bandwidth
Frequency range
Wavelength
Data rate

**Answer:** A) Bandwidth refers to the range of frequencies that a communication system can transmit, and it is typically measured in hertz (Hz).

---

### <a id="-ready-to-ace-your-exam"></a>🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Communication Systems Full Mock Test**](/class-11/physics/communication-systems-class-12-notes) now and track your progress against thousands of students.

---

## <a id="-related-topics"></a>📚 Related Topics

Continue your revision with these related guides:

- 📖 [Atoms Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/atoms-class-12-notes)
- 📖 [Dual Nature of Radiation Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/dual-nature-of-radiation-class-12-notes)
- 📖 [Nuclei Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/nuclei-class-12-notes)
- 📖 [Semiconductor Electronics Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/semiconductor-electronics-class-12-notes)

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/physics/communication-systems-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Atoms Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/atoms-class-12-notes)
- 📖 [Dual Nature of Radiation Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/dual-nature-of-radiation-class-12-notes)
- 📖 [Nuclei Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/nuclei-class-12-notes)
- 📖 [Semiconductor Electronics Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/semiconductor-electronics-class-12-notes)
