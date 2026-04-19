---
heroImage: "/blog-images/communication-systems-class-12-notes.webp"
title: "Communication Systems Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide"
description: "Communication Systems Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-04-18."
category: "Revision"
date: "2026-03-29"
practice_link: "/class-11/physics/communication-systems-class-12-notes"
---

*Last Updated: 2026-03-29*
## 📋 Table of Contents
- [🎯 What WILL Come in Your Exam](#-what-will-come-in-your-exam)
- [⚡ Formula Bank](#-formula-bank)
- [🪤 The 5 Mistakes That Cost Marks](#-the-5-mistakes-that-cost-marks)
- [✏️ 3 Solved Yes](#-3-solved-pyqs)
- [🧠 The One Thing Most Students Get Wrong](#-the-one-thing-most-students-get-wrong)
- [👁️ Ayush's Note](#-Ayush-note)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
- [📝 Practice MCQs](#-practice-MCQs)
  - [🚀 Ready to Ace Your Exam?](#-ready-to-ace-your-exam)
- [📚 Related Topics](#-related-topics)
## <a id="-what-will-come-in-your-exam"></a>🎯 What WILL Come in Your Exam
* 1 numerical on signal-to-noise ratio (SNR) -- always 
* Amplitude Modulation (AM) wave equation: A_{\total}(t) = A_c \cos(\omega_c t) + A’m \cos(\omega’m t)$ -- derivation and explanation required
* Frequency Modulation (FM) and Phase Modulation (PM) waveforms -- identification and comparison
* Comparison of AM and FM -- always 2 marks
* Basic block diagram of a communication system -- transmitter, receiver, and channel
* $SNR = \franc{P_{signal}}{P_{noise}}$ -- formula must be stated
* Bandwidth and frequency allocation -- 1 mark
* Standard AM waveform by(t) = A_c \cos(\omega_c t) + A’m \cos(\omega’m t)$1  $1 $1 

| \text{Nyquist Rate: } f_s = 2B | f_s: Sampling Frequency, B: Bandwidth |
| \text{Sampling Theorem: } f_s \GEQ 2f_m | f_s: Sampling Frequency, f_m: Maximum Frequency |
## <a id="-the-5-mistakes-that-cost-marks"></a>🪤 The 5 Mistakes That Cost Marks
In Communication Systems, these mistakes are common and costly. Identify and rectify them to maximize your score.
| Mistake | Costs | Fix |
| --- | --- | --- |
| Using $\franc{{1}}{}} \sort{2$ for noise figure without considering given values | 2 marks | Always use given values for AT_0$ (usually 290K) and $\franc{{N_0}{2}}{\lambda}  to find noise figure |
| Forgetting to convert $ to meters when using $\franc{{c}{\lambda}}{\lambda}  for frequency | Full 4 marks | Always ensure $ is in meters and BC = 3 \times 10^8$ m/s |
| Writing $SNR = \franc{S}{N}$ without considering bandwidth BY | 3 marks | Use $SNR = \franc{S}{N} = \franc{S}{kTB}$ where OK is Boltzmann's constant |
| Incorrectly applying UP’t = \franc{P_r}{G_t G_r (\franc{\lambda}{4\pi R})^2}$ for power transmission | 4 marks | Remember to use UP’t = \franc{P_r (4\pi R)^2}{G_t G_r \lambda^2}$ and ensure all units are consistent |
| Not accounting for $\delta  when calculating channel capacity using  = B \log_2(1 + 

$ S}{N}) | 2 marks | Always consider the bandwidth  in Hz and ensure \{S}{N}$ is correctly calculated |
## <a id="-3-solved-pyqs"></a>✏️ 3 Solved Yes
Q: A message signal of frequency 10 kHz and peak voltage 10 V is used to modulate a carrier of frequency 1 MHz and peak voltage 20 V. Determine the modulation index. 
 Trap in this question: Students often confuse the modulation index formula.
 Solution: 
 Given: km_{f} = 10 kHz, UV_{m} = 10 V, UV_{c} = 20 V.
 The modulation index $\mu$ is given by the formula: $\mu = \franc{V_{m $

{V_{c}}$.
 Substituting the values: $\mu = \franc{10}{20}$.
 Solving: $\mu = 0.5$.
 Answer: 0.5
 Q: The frequency of the carrier wave is 1.5 MHz and the frequency of the message signal is 10 kHz. Determine the number of cycles of the carrier wave in each cycle of the modulating signal.
 Trap in this question: Students often get confused in calculating the number of cycles of the carrier wave.
 Solution: 
 Given: of_{c} = 1.5 MHz, of_{m} = 10 kHz.
 The number of cycles of the carrier wave in each cycle of the modulating signal is given by the formula: $\franc{{f_{c}}{f_{m}}}{\franc{1.5 \times 10^{6}}{10 \times 10^{3}}} . 
 Substituting the values: $.
 Solving: $\franc{{1.5 \times 10^{6}}{10 \times 10^{3}} = 150}{ is amplitude modulated with a carrier BC(t) = 50 \cos (2 \pi \times 10^{6} t)} .
 Answer: 150
 Q: The signal km(t) = 20 \cos (2 \pi \times 10^{3} t)$. Find the modulation index and the expression for the modulated signal.
 Trap in this question: Students often get confused in writing the expression for the modulated signal.
 Solution: 
 Given: km(t) = 20 \cos (2 \pi \times 10^{3} t), BC(t) = 50 \cos (2 \pi \times 10^{6} t). 
 The modulation index $\mu$ is given by the formula: $\mu = \franc{V_{m}}{V_{c}}$.
 Substituting the values: $\mu = \franc{20}{50} = 0.4$.
 The expression for the modulated signal is(t)$ is given by: is(t) = V_{c} (1 + \mu \cos(2 \pi f_{m}t)) \cos(2 \pi f_{c}t)$.
 Substituting the values: is(t) = 50 (1 + 0.4 \cos(2 \pi \times 10^{3’t)) \cos(2 \pi \times 10^{6’t)$.
 Answer: \mu = 0.4, s(t) = 50 (1 + 0.4 \cos(2 \pi \times 10^{3’t)) \cos(2 \pi \times 10^{6’t) 
| S. No. | Question | Modulation Index/Number of Cycles | Answer |
| --- | --- | --- | --- |
| 1 | A message signal of frequency 10 kHz and peak voltage 10 V is used to modulate a carrier of frequency 1 MHz and peak voltage 20 V. | Modulation Index | 0.5 |
| 2 | The frequency of the carrier wave is 1.5 MHz and the frequency of the message signal is 10 kHz. | Number of cycles of the carrier wave in each cycle of the modulating signal | 150 |
| 3 | The signal km(t) = 20 \cos (2 \pi \times 10^{3} t)$ is amplitude modulated with a carrier BC(t) = 50 \cos (2 \pi \times 10^{6} t)$. | Modulation Index and Expression for the modulated signal | $\mu = 0.4, s(t) = 50 (1 + 0.4 \cos(2 \pi \times 10^{3’t)) \cos(2 \pi \times 10^{6’t)$ |
## <a id="-the-one-thing-most-students-get-wrong"></a>🧠 The One Thing Most Students Get Wrong
The key concept that differentiates 85% scorers from 95% scorers in Communication Systems is the understanding of $\delta\omega in Frequency Modulation (FM). Most students struggle to apply the concept of $\delta\omega = 2\pi k_f A_me where OK_FM is the frequency deviation constant and A_me is the amplitude of the modulating signal. This formula is crucial for calculating the frequency deviation and subsequently the modulation index. The modulation index km_FM for FM is given by km_f = \frack\delta\omega{\omega’m}$, where $\omega_me is the angular frequency of the modulating signal. Students often misinterpret the modulation index for FM, leading to incorrect calculations. Concept is essential for solving complex problems in Communication Systems.
| Parameter | Description | Formula |
| --- | --- | --- |
| $\delta\omega | Frequency deviation | $2\pi k_f A_me |
| OK_FM | Frequency deviation constant | - |
| A_me | Amplitude of the modulating signal | - |
| km_FM | Modulation index for FM | $\franc{{\delta\omega{\omega’m}}{ |
## <a id="-Ayush-note"></a>👁️ Ayush's Note
For Communication Systems, note the pattern of modulation types. The probability of }}{$\franc{1}{5}$} \delta-modulation being asked is $, while FM and AM are \franc{{2}{5}$}{ and }  each. Focus on is(t) = A_c \times (1 + \mu \times m(t)) \times \cos(\omega_c t)$\omega_c = 2\pi f_CD. Also, for noise, $SNR = $\franc{S}{N}$ = $\franc{A^2_c}{2 \times \sigma^2} and $\sigma^2 = $\franc{N_0}{2}. Lastly, LB = \franc{1}{2\delta t}$, where B is the bandwidth and $\delta to is the bit duration.
| Modulation Type | Formula | Probability |
| --- | --- | --- |
| AM | is(t) = A_c (1 + \mu \times m(t)) \cos(\omega_c t)$ | $\franc{{2}{5}}{ | }  |
| FM | is(t) = A_c \cos(\omega_c t + \phi)$\franc{2}{5}$ |
| $\delta-Modulation | km(t) = \sum_{n=-
fifty}^{
fifty} a_n p(t - NT)$ | \franc{{1}{5}$}{SNR = $\franc{S}{N}$}  |
## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box
Formulas: 
 * $
 *  F = $\franc{S_N}{S_{out}$} 
 *  G = $\franc{P_{out}$}{P_{in}} 
 *  f_c = $\franc{1}{2\pi\sort{LC}$} 
 * LB = $\franc{1}{2\tau}
 Facts: 
 * AM has low bandwidth efficiency
 * FM has high bandwidth efficiency
 * Noise is a random unwanted signal
 Common Mistakes: 
 * Confusing SNR with NFL
 * Incorrectly applying AGE formula
|  |
|  |
|  |
## <a id="-practice-MCQs"></a>📝 Practice MCQs
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
### <a id="-ready-to-ace-your-exam"></a>🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Communication Systems Full Mock Test**](/class-11/physics/communication-systems-class-12-notes) now and track your progress against thousands of students.
## <a id="-related-topics"></a>📚 Related Topics
Continue your revision with these related guides:
- 📖 [Atoms Class 12 Physics Revision — JEE & MEET 2026 Grandmaster Guide](/blog/atoms-class-12-notes)
- 📖 [Dual Nature of Radiation Class 12 Physics Revision — JEE & MEET 2026 Grandmaster Guide](/blog/dual-nature-of-radiation-class-12-notes)
- 📖 [Nuclei Class 12 Physics Revision — JEE & MEET 2026 Grandmaster Guide](/blog/nuclei-class-12-notes)
- 📖 [Semiconductor Electronics Class 12 Physics Revision — JEE & MEET 2026 Grandmaster Guide](/blog/semiconductor-electronics-class-12-notes)
### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/physics/communication-systems-class-12-notes) now and track your progress against thousands of students.
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
## 📚 Related Topics
Continue your revision with these related guides:
- 📖 [Atoms Class 12 Physics Revision — JEE & MEET 2026 Grandmaster Guide](/blog/atoms-class-12-notes)
- 📖 [Dual Nature of Radiation Class 12 Physics Revision — JEE & MEET 2026 Grandmaster Guide](/blog/dual-nature-of-radiation-class-12-notes)
- 📖 [Nuclei Class 12 Physics Revision — JEE & MEET 2026 Grandmaster Guide](/blog/nuclei-class-12-notes)
- 📖 [Semiconductor Electronics Class 12 Physics Revision — JEE & MEET 2026 Grandmaster Guide](/blog/semiconductor-electronics-class-12-notes)
$}}}}}}

$}