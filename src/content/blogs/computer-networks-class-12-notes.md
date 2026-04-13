---
heroImage: "/blog-images/computer-networks-class-12-notes.webp"
title: "Computer Networks Class 12 (Computer Science) Comprehensive Notes — Boards 2026 Encyclopedia"
description: "Computer Networks Class 12 (Computer Science) Comprehensive Notes — Boards 2026 Encyclopedia Revision Notes. Last Updated: 2026-04-12."
category: "Revision"
date: "2026-04-12"
practice_link: "/practice/computer-networks-class-12-notes"
---


## 📋 Table of Contents

- [Fundamental Concepts](#fundamental-concepts)
- [**Network Fundamentals**](#network-fundamentals)
 - [**Network Types**](#network-types)
 - [**Network Topologies**](#network-topologies)
- [**Network Devices**](#network-devices)
 - [**Device Functions**](#device-functions)
 - [**Device Characteristics**](#device-characteristics)
- [**Network Protocols**](#network-protocols)
 - [**Transport Layer Protocols**](#transport-layer-protocols)
 - [**Application Layer Protocols**](#application-layer-protocols)
 - [**Protocol Derivations**](#protocol-derivations)
- [**Network Security**](#network-security)
 - [**Security Threats**](#security-threats)
 - [**Security Measures**](#security-measures)
- [Network Architecture](#network-architecture)
- [Network Architecture](#network-architecture)
 - [**OSI Model**](#osi-model)
- [Network Layers](#network-layers)
 - [**Data Transmission**](#data-transmission)
 - [**TCP/IP Model**](#tcpip-model)
- [Network Protocols](#network-protocols)
- [Data Transmission Example](#data-transmission-example)
- [Network Performance](#network-performance)
- [Network Protocols and Services](#network-protocols-and-services)
- [**Network Protocols**](#network-protocols)
 - [**TCP/IP Protocol Suite**](#tcpip-protocol-suite)
- [**IP Addressing**](#ip-addressing)
 - [**IPv4**](#ipv4)
 - [**IPv6**](#ipv6)
- [**Subnetting**](#subnetting)
- [**DHCP and DNS**](#dhcp-and-dns)
- [**Network Services**](#network-services)
- [**Mathematical Formulation**](#mathematical-formulation)
- [**Conclusion**](#conclusion)
- [Network Security and Management](#network-security-and-management)
- [**Network Security Threats**](#network-security-threats)
- [**Security Measures**](#security-measures)
 - [**Encryption Techniques**](#encryption-techniques)
 - [**Network Management Protocols**](#network-management-protocols)
- [**Network Performance Optimization**](#network-performance-optimization)
 - [**Mathematical Modeling of Network Performance**](#mathematical-modeling-of-network-performance)
 - [**Network Security Threat Modeling**](#network-security-threat-modeling)
- [Advanced Networking Topics](#advanced-networking-topics)
- [**Wireless Networks**](#wireless-networks)
- [**Mobile Networks**](#mobile-networks)
- [**Cloud Computing**](#cloud-computing)
- [**Virtual Private Networks (VPNs)**](#virtual-private-networks-vpns)
- [**Network Virtualization**](#network-virtualization)
- [**Software-Defined Networking (SDN)**](#softwaredefined-networking-sdn)
- [Solved PYQs](#solved-pyqs)
- [Step 3: Solved PYQs](#step-3-solved-pyqs)
 - [3.1 PYQ 1](#31-pyq-1)
 - [3.2 PYQ 2](#32-pyq-2)
 - [3.3 PYQ 3](#33-pyq-3)
- [Practice MCQs](#practice-mcqs)

## <a id="fundamental-concepts"></a>Fundamental Concepts

## <a id="network-fundamentals"></a>**Network Fundamentals**
### <a id="network-types"></a>**Network Types**
* **LAN** (Local Area Network): connects devices in a limited area.
* **WAN** (Wide Area Network): connects devices over a large area.
* **Wi-Fi** (Wireless Fidelity): connects devices wirelessly.
* **MAN** (Metropolitan Area Network): connects devices in a metropolitan area.
* **WLAN** (Wireless Local Area Network): connects devices wirelessly in a limited area.

### <a id="network-topologies"></a>**Network Topologies**
* **Bus Topology**: devices connected to a single cable.
* **Star Topology**: devices connected to a central device.
* **Ring Topology**: devices connected in a circular configuration.
* **Mesh Topology**: each device connected to every other device.
* **Tree Topology**: combination of bus and star topologies.

## <a id="network-devices"></a>**Network Devices**
### <a id="device-functions"></a>**Device Functions**
* **Router**: routes traffic between networks.
* **Switch**: forwards traffic within a network.
* **Hub**: connects devices in a network.
* **Bridge**: connects two networks.
* **Gateway**: connects a network to the internet.

### <a id="device-characteristics"></a>**Device Characteristics**
* **Router**: uses **IP** addresses to route traffic.
* **Switch**: uses **MAC** addresses to forward traffic.
* **Hub**: broadcasts incoming traffic to all devices.
* **Bridge**: filters traffic between networks.
* **Gateway**: translates protocols between networks.

## <a id="network-protocols"></a>**Network Protocols**
### <a id="transport-layer-protocols"></a>**Transport Layer Protocols**
* **TCP** (Transmission Control Protocol): ensures reliable [data](/blog/data-structures-linear-class-11-revision-notes-gate-boards) transfer.
* **UDP** (User Datagram Protocol): ensures fast data transfer.
* **SCTP** (Stream Control Transmission Protocol): ensures reliable data transfer for multiple streams.

### <a id="application-layer-protocols"></a>**Application Layer Protocols**
* **HTTP** (Hypertext Transfer Protocol): transfers web pages.
* **FTP** (File Transfer Protocol): transfers files.
* **SMTP** (Simple Mail Transfer Protocol): transfers emails.
* **DNS** (Domain Name System): resolves domain names to **IP** addresses.

### <a id="protocol-derivations"></a>**Protocol Derivations**
The **TCP** three-way handshake can be derived as follows:

\begin{aligned}
&\text{Client sends SYN packet: } SYN = \langle seq, ack \rangle \\
&\text{Server responds with SYN-ACK packet: } SYN-ACK = \langle seq, ack + 1 \rangle \\
&\text{Client responds with ACK packet: } ACK = \langle seq + 1, ack \rangle
\end{aligned}

This derivation shows the sequence of packets exchanged during the **TCP** three-way handshake.

## <a id="network-security"></a>**Network Security**
### <a id="security-threats"></a>**Security Threats**
* **Malware**: software that harms a network.
* **Phishing**: attempts to steal sensitive information.
* **DDoS** (Distributed Denial of Service): overwhelms a network with traffic.
* **Man-in-the-Middle**: intercepts traffic between devices.
* **SQL Injection**: injects malicious code into [databases](/blog/databases-dbms-class-12-notes).

### <a id="security-measures"></a>**Security Measures**
* **Firewall**: blocks unauthorized traffic.
* **Encryption**: protects data with keys.
* **Authentication**: verifies device identities.
* **Access Control**: restricts device access.
* **Intrusion Detection**: detects security threats.

## <a id="network-architecture"></a>Network Architecture

### <a id="osi-model"></a>**OSI Model**
* **Physical Layer**: Defines physical means of data transmission.
* **Data Link Layer**: Ensures error-free transfer of data frames.
* **Network Layer**: Routes data between devices on different networks.
* **Transport Layer**: Provides reliable data transfer between devices.
* **Session Layer**: Establishes, maintains, and terminates connections.
* **Presentation Layer**: Converts data into a format understood by the receiving device.
* **Application Layer**: Supports functions such as email, file transfer, and web browsing.

## <a id="network-layers"></a>Network Layers
### <a id="data-transmission"></a>**Data Transmission**
* Data transmission through the **OSI Model** involves encapsulation of data in each layer.
* The **Physical Layer** transmits raw bits over a physical medium.
* The **Data Link Layer** adds a header and trailer to the data, creating a frame.
* The **Network Layer** adds a header, creating a packet.
* The **Transport Layer** adds a header and trailer, creating a segment.
* The **Session Layer** adds control information, creating a data stream.
* The **Presentation Layer** converts the data into a format understood by the receiving device.
* The **Application Layer** provides services such as email, file transfer, and web browsing.

### <a id="tcpip-model"></a>**TCP/IP Model**
* The **TCP/IP Model** consists of four layers: **Network Access**, **Internet**, **Transport**, and **Application**.
* The **Network Access Layer** combines the **Physical** and **Data Link Layers** of the **OSI Model**.
* The **Internet Layer** corresponds to the **Network Layer** of the **OSI Model**.
* The **Transport Layer** corresponds to the **Transport Layer** of the **OSI Model**.
* The **Application Layer** combines the **Session**, **Presentation**, and **Application Layers** of the **OSI Model**.

## <a id="network-protocols"></a>Network Protocols
* **TCP** (Transmission Control Protocol) provides reliable, connection-oriented data transfer.
* **UDP** (User Datagram Protocol) provides best-effort, connectionless data transfer.
* **IP** (Internet Protocol) provides logical addressing and routing of packets.
* **HTTP** (Hypertext Transfer Protocol) provides services for web browsing.
* **FTP** (File Transfer Protocol) provides services for file transfer.

## <a id="data-transmission-example"></a>Data Transmission Example
* A user sends an email from a device on one network to a device on another network.
* The **Application Layer** creates an email message.
* The **Presentation Layer** converts the email message into a format understood by the receiving device.
* The **Session Layer** establishes a connection with the receiving device.
* The **Transport Layer** adds a header and trailer, creating a segment.
* The **Network Layer** adds a header, creating a packet.
* The **Data Link Layer** adds a header and trailer, creating a frame.
* The **Physical Layer** transmits the frame over a physical medium.
* The receiving device receives the frame and reverses the process, ultimately delivering the email message to the user.

\text{Data Transmission Time} = \frac{\text{Data Size}}{\text{Bandwidth}} + \text{Propagation Delay}

This equation calculates the time it takes for data to be transmitted through a network, where **Data Size** is the size of the data being transmitted, **Bandwidth** is the rate at which data is transmitted, and **Propagation Delay** is the time it takes for the data to travel through the physical medium. 

## <a id="network-performance"></a>Network Performance
* **Throughput** measures the rate at which data is transmitted.
* **Latency** measures the time it takes for data to be transmitted.
* **Jitter** measures the variation in latency.
* **Packet Loss** measures the percentage of packets that are lost during transmission.
* **Error Rate** measures the percentage of errors that occur during transmission. 

The **OSI Model** and **TCP/IP Model** provide a framework for understanding how data is transmitted through a network. By understanding the different layers and protocols involved, network administrators can optimize network performance and troubleshoot issues.

## <a id="network-protocols-and-services"></a>Network Protocols and Services

### <a id="tcpip-protocol-suite"></a>**TCP/IP Protocol Suite**
* **TCP/IP** is a set of communication protocols used for interconnecting devices on the internet.
* **TCP** provides reliable data transfer between devices.
* **IP** provides logical addressing for devices on a network.

## <a id="ip-addressing"></a>**IP Addressing**
### <a id="ipv4"></a>**IPv4**
* **IPv4** uses 32-bit addresses, with 4.3 billion possible unique addresses.
* **IPv4** address format: $xxx.xxx.xxx.xxx$, where $xxx$ is a decimal value between 0 and 255.
* **Private IP addresses**: $10.xxx.xxx.xxx$, $172.16.xxx.xxx$ to $172.31.xxx.xxx$, $192.168.xxx.xxx$.
* **Public IP addresses**: all other IPv4 addresses.

### <a id="ipv6"></a>**IPv6**
* **IPv6** uses 128-bit addresses, with virtually unlimited unique addresses.
* **IPv6** address format: $xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx$, where $xxxx$ is a hexadecimal value.
* **IPv6** provides improved security and mobility compared to IPv4.

## <a id="subnetting"></a>**Subnetting**
* **Subnetting** is the process of dividing a large network into smaller sub-networks.
* **Subnet mask**: a 32-bit number that determines the scope of a sub-network.
* **Subnet mask** format: $xxx.xxx.xxx.xxx$, where $xxx$ is a decimal value between 0 and 255.
* **CIDR notation**: $xxx.xxx.xxx.xxx/xx$, where $xx$ is the number of bits in the subnet mask.

## <a id="dhcp-and-dns"></a>**DHCP and DNS**
* **DHCP** (Dynamic Host Configuration Protocol) assigns IP addresses to devices on a network.
* **DNS** (Domain Name System) resolves domain names to IP addresses.
* **DNS** uses a hierarchical structure to resolve domain names.
* **DNS** record types: A, AAAA, MX, NS, SOA, PTR.

## <a id="network-services"></a>**Network Services**
* **HTTP** (Hypertext Transfer Protocol) is used for transferring web pages.
* **FTP** (File Transfer Protocol) is used for transferring files.
* **SSH** (Secure Shell) is used for secure remote access to devices.
* **SMTP** (Simple Mail Transfer Protocol) is used for sending emails.
* **SNMP** (Simple Network Management Protocol) is used for network management.

## <a id="mathematical-formulation"></a>**Mathematical Formulation**
The probability of packet loss in a network can be modeled using the following equation:
P(\text{packet loss}) = 1 - e^{-\lambda t}
where $\lambda$ is the average packet arrival rate, $t$ is the time between packet transmissions, and $e$ is the base of the natural logarithm.
The throughput of a network can be calculated using the following equation:
\text{Throughput} = \frac{\text{packet size}}{\text{packet transmission time}}
where packet size is the size of the packet in bits, and packet transmission time is the time it takes to transmit the packet.
The latency of a network can be calculated using the following equation:
\text{Latency} = \frac{\text{packet transmission time}}{2} + \text{propagation delay}
where packet transmission time is the time it takes to transmit the packet, and propagation delay is the time it takes for the packet to propagate through the network.

## <a id="conclusion"></a>**Conclusion**
Key **network protocols** and **services** include:
* **TCP/IP**
* **IPv4** and **IPv6**
* **Subnetting**
* **DHCP** and **DNS**
* **HTTP**, **FTP**, **SSH**, **SMTP**, and **SNMP**.
These protocols and services work together to provide a and efficient network infrastructure.

## <a id="network-security-and-management"></a>Network Security and Management

## <a id="network-security-threats"></a>**Network Security Threats**
* **Hacking**: Unauthorized access to network resources.
* **Viruses**: Malicious code that replicates and damages systems.
* **Malware**: Software designed to harm or exploit systems.
* **Phishing**: Social engineering attacks to steal sensitive information.
* **DDoS**: Overwhelming networks with traffic to make them unavailable.

## <a id="security-measures"></a>**Security Measures**
* **Firewalls**: Network devices that control incoming and outgoing traffic.
* **Encryption**: Converting data into unreadable code to protect it.
* **Access Control**: Regulating user access to network resources.
* **Intrusion Detection Systems**: Monitoring networks for suspicious activity.
* **Virtual Private Networks**: Secure, encrypted connections over public networks.

### <a id="encryption-techniques"></a>**Encryption Techniques**
* **Symmetric Key Encryption**: Using the same key for encryption and decryption.
* **Asymmetric Key Encryption**: Using different keys for encryption and decryption.
* **Hash Functions**: One-way functions that produce fixed-size strings.
* **Digital Signatures**: Verifying authenticity and integrity of messages.
* **Key Exchange [algorithms](/blog/algorithms-design-class-11-revision-notes-gate-boards)**: Securely exchanging cryptographic keys.

### <a id="network-management-protocols"></a>**Network Management Protocols**
* **SNMP**: Managing and monitoring network devices.
* **ICMP**: Diagnosing and reporting network communication issues.
* **TCP/IP**: Suite of protocols for network communication.
* **DNS**: Translating domain names into IP addresses.
* **DHCP**: Assigning IP addresses to devices on a network.

## <a id="network-performance-optimization"></a>**Network Performance Optimization**
* **Traffic Management**: Controlling and prioritizing network traffic.
* **Quality of Service**: Ensuring reliable and efficient network performance.
* **Network Congestion**: Managing and preventing network overload.
* **Latency Reduction**: Minimizing delays in network communication.
* **Throughput Optimization**: Maximizing network bandwidth and efficiency.

### <a id="mathematical-modeling-of-network-performance"></a>**Mathematical Modeling of Network Performance**
The network performance can be modeled using the following equation:

P = \frac{1}{L} \cdot \frac{B}{D}

where $P$ is the network performance, $L$ is the latency, $B$ is the bandwidth, and $D$ is the distance between nodes.
The latency can be calculated using the formula:

L = \frac{D}{V} + \frac{P}{B}

where $V$ is the speed of the signal and $P$ is the packet size.
The throughput can be optimized using the following formula:

T = \frac{B}{L} \cdot \frac{1}{1 + \frac{P}{B}}

where $T$ is the throughput.

### <a id="network-security-threat-modeling"></a>**Network Security Threat Modeling**
The probability of a network security threat can be modeled using the following equation:

P(T) = \frac{1}{1 + e^{-\theta}}

where $P(T)$ is the probability of a threat, $\theta$ is the threat score, and $e$ is the base of the natural logarithm.
The threat score can be calculated using the following formula:

\theta = \sum_{i=1}^{n} w_i \cdot x_i

where $w_i$ is the weight of the $i^{th}$ factor, $x_i$ is the value of the $i^{th}$ factor, and $n$ is the number of factors. 
Using $x_i$ and $w_i$, the overall threat score $\theta$ can be derived as:

\theta = w_1 \cdot x_1 + w_2 \cdot x_2 + \ldots + w_n \cdot x_n

Then, by plugging the value of $\theta$ into the equation $P(T) = \frac{1}{1 + e^{-\theta}}$, we can obtain the probability of a network security threat.
This allows network administrators to prioritize and mitigate potential threats.

## <a id="advanced-networking-topics"></a>Advanced Networking Topics

## <a id="wireless-networks"></a>**Wireless Networks**
* **WiFi**: Wireless local area network technology.
* **WiMAX**: Wireless metropolitan area network technology.
* **LTE**: Long-term evolution wireless broadband technology.
* Key characteristics: 
 * High-speed data transfer
 * Low-latency communication
 * Mobility support

## <a id="mobile-networks"></a>**Mobile Networks**
* **5G**: Fifth-generation wireless network technology.
* **Network Slicing**: Multiple independent networks on a shared infrastructure.
* **Mobile Edge Computing**: Computing resources at the edge of the network.
* Benefits:
 * Enhanced mobile broadband
 * Ultra-reliable low-latency communication
 * Massive machine-type communications

## <a id="cloud-computing"></a>**Cloud Computing**
* **IaaS**: Infrastructure as a service cloud computing model.
* **PaaS**: Platform as a service cloud computing model.
* **SaaS**: Software as a service cloud computing model.
* Characteristics:
 * On-demand resource allocation
 * Scalability and flexibility
 * Reduced capital expenditures

## <a id="virtual-private-networks-vpns"></a>**Virtual Private Networks (VPNs)**
* **Encapsulation**: Encrypting and encapsulating data packets.
* **Tunneling**: Creating a secure tunnel for data transmission.
* **Authentication**: Verifying user identity and access rights.
* Advantages:
 * Secure remote access
 * Encryption and anonymity
 * Access to geo-restricted content

## <a id="network-virtualization"></a>**Network Virtualization**
* **VLANs**: Virtual local area networks.
* **VXLANs**: Virtual extensible local area networks.
* **NVGRE**: Network virtualization using generic routing encapsulation.
* Benefits:
 * Improved network scalability
 * Enhanced network flexibility
 * Simplified network management

## <a id="softwaredefined-networking-sdn"></a>**Software-Defined Networking (SDN)**
* **SDN Architecture**: Separation of control and data planes.
* **OpenFlow**: Standard protocol for SDN communication.
* **Network Functions Virtualization (NFV)**: Virtualizing network functions.
* Characteristics:
 * Centralized network management
 * Programmable network control
 * Increased network flexibility

The $SDN$ architecture can be represented as:

\begin{aligned}
&\text{Control Plane} \\
&\quad \begin{cases}
\text{SDN Controller} \\
\text{Network Applications}
\end{cases} \\
&\text{Data Plane} \\
&\quad \begin{cases}
\text{Switches} \\
\text{Routers}
\end{cases} \\
&\text{Southbound Interface} \\
&\quad \begin{cases}
\text{OpenFlow}
\end{cases} \\
\end{aligned}

Key $SDN$ benefits:
* Improved network manageability
* Enhanced network security
* Increased network scalability

Emerging trends in computer networking:
* **Edge Computing**: Computing resources at the edge of the network.
* **Artificial Intelligence (AI)**: Applying AI to network management and security.
* **Internet of Things (IoT)**: Connecting devices and sensors to the network.
* **Quantum Computing**: Applying quantum computing to network security and optimization.
* **Blockchain**: Applying blockchain to network security and management.

## <a id="solved-pyqs"></a>Solved PYQs

## <a id="step-3-solved-pyqs"></a>Step 3: Solved PYQs
### <a id="31-pyq-1"></a>3.1 PYQ 1
* **Computer Network**: Interconnected devices communicating.
* Given: $n$ devices, $m$ channels, $t$ time slots.
* Goal: Maximize data transfer rate $R$.
* Formula: $R = \frac{m \cdot t}{n}$.
* Example: $n = 10$, $m = 5$, $t = 2$.
* Solution: $R = \frac{5 \cdot 2}{10} = 1$.

### <a id="32-pyq-2"></a>3.2 PYQ 2
* **Network Topology**: Physical arrangement of devices.
* Types:
 * **Bus Topology**: Single cable connecting all devices.
 * **Star Topology**: Central device connecting all others.
 * **Ring Topology**: Devices connected in a circle.
* Given: $n$ devices, **Bus Topology**.
* Goal: Find the probability $P$ of collision.
* Formula: $P = \frac{1}{2^{n-1}}$.
* Example: $n = 5$.
* Solution: $P = \frac{1}{2^{5-1}} = \frac{1}{16}$.

### <a id="33-pyq-3"></a>3.3 PYQ 3
* **Network Protocol**: Set of rules for communication.
* **TCP/IP**: Most widely used protocol.
* Given: $x$ packets, $y$ packets lost.
* Goal: Find the **Throughput** $T$.
* Formula: $T = \frac{x - y}{x}$.
* Example: $x = 100$, $y = 20$.
* Solution: $T = \frac{100 - 20}{100} = \frac{4}{5}$.
* Derivation:

T = \frac{x - y}{x} = \frac{100 - 20}{100} = \frac{80}{100} = \frac{4}{5}

## <a id="practice-mcqs"></a>Practice MCQs

1. What is the primary function of the Transport Layer in the OSI model?
- A) To provide error-free transfer of data between devices
- B) To route data between networks
- C) To provide security for data transfer
- D) To manage network topology

2. Which of the following network topologies is characterized by a central device connecting all other devices?
- A) Mesh topology
- B) Star topology
- C) Bus topology
- D) Ring topology

3. What is the purpose of the subnet mask in IP addressing?
- A) To identify the network ID of an IP address
- B) To identify the host ID of an IP address
- C) To determine the default gateway of a network
- D) To configure the DNS server of a network

4. Which protocol is used for sending email between mail servers?
- A) HTTP
- B) FTP
- C) SMTP
- D) TCP

5. What is the term for a network that spans a large geographic area, such as a city or country?
- A) LAN (Local Area Network)
- B) WAN (Wide Area Network)
- C) MAN (Metropolitan Area Network)
- D) WLAN (Wireless Local Area Network)

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/practice/computer-networks-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [3D Geometry Class 11 (Mathematics) Comprehensive Notes — JEE & Boards 2026 Encyclopedia](/blog/3d-geometry-intro-class-11-revision-notes-jee-neet)
- 📖 [Algorithms: Design Class 11 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog/algorithms-design-class-11-revision-notes-gate-boards)
- 📖 [Data Structures: Linear Class 11 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog/data-structures-linear-class-11-revision-notes-gate-boards)
- 📖 [Computer Organization Class 11 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog/computer-organization-class-11-notes)
