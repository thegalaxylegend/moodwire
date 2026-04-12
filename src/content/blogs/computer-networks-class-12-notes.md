---
heroImage: "/blog-images/computer-networks-class-12-notes.webp"
title: "Computer Networks Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide"
description: "Computer Networks Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-04-12."
category: "Revision"
date: "2026-04-12"
practice_link: "/class-12/computer-science/computer-networks"
---


![Computer Networks Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog-images/computer-networks-class-12-notes.webp)

*Last Updated: 2026-04-12*

<div [class](/blog/theory-of-computation-class-12-notes)="quick-summary">

### 🚀 Quick Recall — Last Night Summary

- *
- End-to-End Principle: The end-to-end principle in computer networks states that functions should be performed at the edges of the network, rather than within the network itself.
- *
- Store and Forward: The store and forward technique in packet switching networks involves storing each packet in a buffer and then forwarding it to the next node.
- *
- Connection-Oriented vs Connectionless: Connection-oriented communication establishes a dedicated circuit before data transfer, while connectionless communication sends data independently without establishing a circuit.
- *
- OSI Model: The OSI model is a 7-layered reference model for computer networks, providing a standardized framework for understanding network functions and protocols.
- *
- Network Topologies: Network topologies include bus, star, ring, and mesh networks, each with its own advantages and disadvantages.
- *
- TCP/IP Model: The TCP/IP model is a 4-layered reference model for computer networks, providing a simplified framework for understanding network functions and protocols.
- *
- Protocols: Protocols such as HTTP, FTP, and SMTP are used for communication between devices in a network, while protocols like DNS and DHCP provide essential network services.
- *
- Network Devices: Network devices such as routers, switches, and hubs are used to connect and manage devices in a network, while firewalls and intrusion detection systems provide security.
- *
- Network Security: Network security involves protecting the network from unauthorized access, malicious attacks, and data breaches, using techniques like encryption, firewalls, and access control.

</div>

## 📋 Table of Contents

- [⚡ Formula Bank](#-formula-bank)
- [🪤 The 5 Mistakes That Cost Marks](#-the-5-mistakes-that-cost-marks)
- [✏️ 3 Solved PYQs](#-3-solved-pyqs)
- [🧠 The One Thing Most Students Get Wrong](#-the-one-thing-most-students-get-wrong)
- [👁️ Ayush's Note](#-ayushs-note)
- [🔁 Last 5 Minutes Box](#-last-5-minutes-box)
- [📝 Practice MCQs](#-practice-mcqs)

## <a id="-formula-bank"></a>⚡ Formula Bank

- **Throughput Formula:** \frac{{Total \; Data \; Transferred}}{{Total \; Time \; Taken}} = \frac{{D}}{{T}} — (D = Total Data Transferred, T = Total Time Taken)
 - **Bandwidth Formula:** B = \frac{{D}}{{T}} — (B = Bandwidth, D = Data Transferred, T = Time Taken)
 - **Propagation Delay Formula:** t_p = \frac{{d}}{{s}} — (t_p = Propagation Delay, d = Distance, s = Speed of Signal)
 - **Transmission Delay Formula:** t_t = \frac{{L}}{{R}} — (t_t = Transmission Delay, L = Length of Packet, R = Rate of Transmission)
 - **Queueing Delay Formula:** t_q = \frac{{Q}}{{R}} — (t_q = Queueing Delay, Q = Average Queue Length, R = Rate of Transmission)
 - **Total Delay Formula:** t_{total} = t_t + t_p + t_q — (t_total = Total Delay, t_t = Transmission Delay, t_p = Propagation Delay, t_q = Queueing Delay)
 - **Round-Trip Time (RTT) Formula:** RTT = 2 \times (t_t + t_p) — (RTT = Round-Trip Time, t_t = Transmission Delay, t_p = Propagation Delay)
 - **Packet Loss Rate Formula:** PLR = \frac{{P_{lost}}}{{P_{sent}}} — (PLR = Packet Loss Rate, P_lost = Number of Lost Packets, P_sent = Total Number of Sent Packets)
 - **Throughput of Stop-and-Wait Protocol Formula:** T = \frac{{1}}{{RTT + t_t}} — (T = Throughput, RTT = Round-Trip Time, t_t = Transmission Delay)
 - **Throughput of Sliding Window Protocol Formula:** T = \frac{{W}}{{RTT + t_t}} — (T = Throughput, W = Window Size, RTT = Round-Trip Time, t_t = Transmission Delay)

## <a id="-the-5-mistakes-that-cost-marks"></a>🪤 The 5 Mistakes That Cost Marks

- **Mistake 1:** Confusing OSI and TCP/IP Model Layers and Protocols.\n 

- *Costs:* 2-4 marks per question. These are fundamental conceptual questions, often MCQ-based (matching, true/false, identifying incorrect statements). A single mix-up can cascade.\n

## <a id="-3-solved-pyqs"></a>✏️ 3 Solved PYQs

{
 "heading": "✏️ 3 Solved PYQs",
 "body": "- **Q1:** A company has a Class C network address 192.168.10.0. They need to create 5 subnets for different departments. What is the minimum number of bits required for subnetting, and what would be the subnet mask in dotted decimal notation?\n - **Trap:** Students often confuse the number of subnets needed with the number of host bits available. Another common mistake is incorrectly calculating the subnet mask by converting the binary representation to dotted decimal, especially in the last octet.\n - **Solution:**\n - **Step 1: Determine subnet bits.** We need to create 5 subnets. The number of subnets must be a power of 2, such that $2^n \ge \text{number of subnets}$.\n - For 5 subnets, we need $2^n \ge 5$. The smallest integer $n$ that satisfies this condition is $n=3$, because $2^3 = 8$. This means **3 bits are required for subnetting**.\n - **Step 2: Identify default network mask.** A Class C network address (like 192.168.10.0) has a default subnet mask of 255.255.255.0.\n - In binary, this is: 11111111.11111111.11111111.00000000.\n - This indicates 24 network bits and 8 host bits.\n - **Step 3: Calculate new subnet mask.** We borrow 3 bits from the host portion (the last octet) for subnetting.\n - The new subnet mask will have $24 + 3 = 27$ network bits.\n - The binary representation of the new subnet mask will be:\n  \underbrace{11111111.11111111.1 }}

## <a id="-the-one-thing-most-students-get-wrong"></a>🧠 The One Thing Most Students Get Wrong

- **The Core Concept:** While most students can perform basic subnetting, the real differentiator is mastering **Variable Length Subnet Masking (VLSM)** and **Classless Inter-Domain Routing (CIDR)** for **optimal IP address allocation and efficient route summarization**. It's not just about dividing networks; it's

## <a id="-ayushs-note"></a>👁️ Ayush's Note

- **The Hidden Pattern: The Bottleneck Principle in Data Transmission.** Forget just plugging numbers into formulas. PYQs, especially the trickier ones in Communication Systems, don't just test your knowledge of Shannon-Hartley or Nyquist. They test your ability to identify the *actual limiting factor* when multiple constraints are present. You'll be given scenarios with channel bandwidth, Signal-to-Noise Ratio (SNR), and often an implicit or explicit number of discrete signal levels ($M$). Your job isn't to calculate both and pick one randomly; it's to understand that the *true maximum data rate* is always dictated by the most restrictive condition. It’s like having a pipeline

## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box

{
 "heading": "🔁 Last 5 Minutes Box",
 "body": "

- **5 Key Formulas:**\n

- \text{Bandwidth-Delay Product} = \text{Bandwidth} \times \text{Propagation Delay} This gives the maximum number of bits 'in flight' or the capacity of the link.\n

- \text{Throughput} = \frac{\text{Amount of Data Transferred}}{\text{Total Time Taken}} Represents the effective data rate achieved over a link, often less than bandwidth.\n

- \text{Usable Hosts in a Subnet} = 2^{\text{number of host bits}} 

- 2 Remember to subtract 2 for the network address and broadcast address.\n

- \text{Propagation Delay} = \frac{\text{Distance}}{\text{Speed of Signal in Medium}} Time taken for a bit to travel from sender to receiver.\n

- \text{Efficiency of Sliding Window Protocol} = \frac{\text{Window Size}}{1 + 2a} where $a = \frac{\text{Propagation Time}}{\text{Transmission Time}}$ (for}

## <a id="-practice-mcqs"></a>📝 Practice MCQs

**1. A packet switching network uses**
**A)**  circuit switching
**B)**  store and forward
**C)**  connection oriented
**D)**  connectionless

**Answer:** D) Packet switching networks use connectionless communication, where each packet is routed independently without establishing a dedicated circuit.

---

**2. The protocol which provides logical addressing in a network is**
**A)**  IP
**B)**  ICMP
**C)**  TCP
**D)**  UDP

**Answer:** A) The Internet Protocol (IP) provides logical addressing in a network, allowing devices to communicate with each other using IP addresses.

---

**3. A network that uses a hub as the central device is classified as**
**A)**  bus network
**B)**  star network
**C)**  ring network
**D)**  mesh network

**Answer:** B) A star network uses a hub or central device to connect multiple devices, making it a type of network where all devices are connected to a central point.

---

**4. Error detection and correction mechanism used in UDP is**
**A)**  checksum
**B)**  CRC
**C)**  parity
**D)**  stop and wait

**Answer:** A) The checksum mechanism in UDP is used to detect errors in data transmission, but it does not correct errors. It only alerts the receiver that an error has occurred.

---

**5. The transport layer protocol used for reliable data transfer is**
**A)**  TCP
**B)**  UDP
**C)**  ICMP
**D)**  HTTP

**Answer:** A) The Transmission Control Protocol (TCP) is a transport layer protocol that provides reliable data transfer by ensuring that data is delivered in the correct order and error-free.

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-12/computer-science/computer-networks) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Databases (DBMS) Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog/databases-dbms-class-12-notes)
- 📖 [Operating Systems Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog/operating-systems-class-12-notes)
- 📖 [Theory of Computation Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog/theory-of-computation-class-12-notes)
- 📖 [Application of Derivatives Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-derivatives-class-12-notes)
