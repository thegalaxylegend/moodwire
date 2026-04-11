---
heroImage: "/blog-images/operating-systems-class-12-notes.webp"
title: "Operating Systems Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide"
description: "Operating Systems Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide Revision Notes. Last Updated: 2026-04-11."
category: "Revision"
date: "2026-04-11"
practice_link: "/class-11/computer-science/operating-systems-class-12-notes"
---


![Operating Systems Class 12 Computer Science Revision — GATE & Boards 2026 Grandmaster Guide](/blog-images/operating-systems-class-12-notes.webp)

*Last Updated: 2026-04-11*

<div [class](/blog/atoms-class-12-notes)="quick-summary">

### 🚀 Quick Recall — Last Night Summary

- 0
- Process Scheduling
- : **Always** encounter questions on SRTF (Shortest Remaining Time First) scheduling algorithm — always
- 0
- Process Scheduling
- : **Frequently** encounter questions on Round Robin scheduling algorithm — frequently
- 0
- Process Synchronization
- : **Always** encounter questions on Monitors (e.g.
- Dining Philosophers problem) — always
- 0
- Memory Management
- : **Frequently** encounter questions on segmentation and paging — frequently
- 0
- File Systems
- : **Always** encounter questions on file system structure (e.g.
- inodes
- file permissions) — always
- 0
- Process Synchronization
- : **Frequently** encounter questions on Semaphores (e.g.
- Binary Semaphores
- Counting Semaphores) — frequently
- 0
- Memory Management
- : **Always** encounter questions on Virtual Memory (e.g.
- page replacement algorithms) — always
- 0
- File Systems
- : **Frequently** encounter questions on file system security (e.g.
- file permissions
- access control lists) — frequently
- 0
- Process Scheduling
- : **Always** encounter questions on Priority Scheduling (e.g.
- Rate Monotonic Scheduling) — always
- 0
- Process Synchronization
- : **Frequently** encounter questions on Mutex Locks (e.g.
- Pthreads) — frequently

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

- **Turnaround Time (TAT):** \frac{1}{{\lambda}} = \frac{1}{{1/TAT}} = \frac{1}{TAT} — Average time taken by the process to complete, including waiting time in the ready queue and service time.
 - **Waiting Time (WT):** WT = \frac{\sum (AT - ST)}{n} — Average time spent by a process waiting in the ready queue, where AT is arrival time and ST is start time.
 - **Response Time (RT):** RT = \frac{\sum (FT - AT)}{n} — Time between submission of a request and the first response, where FT is finish time and AT is arrival time.
 - **Throughput (T):** T = \frac{n}{TAT} — Rate of process completion by the system.
 - **CPU Utilization (U):** U = \frac{\sigma}{\sigma + \pi} — Percentage of time the CPU is busy, where \sigma is the time spent by the CPU in executing processes and \pi is the time spent by the CPU in the idle state.
 - **Priority Scheduling (PS) Formula:** P = \frac{1}{p} — Priority of a process, where p is the priority number.
 - **SJF (Shortest Job First) Scheduling Formula:** SJF = \frac{1}{b} — Priority of a process based on burst time, where b is the burst time of a process.
 - **FCFS (First-Come-First-Served) Scheduling Formula:** FCFS = \frac{AT}{ST} — Priority of a process based on arrival time, where AT is arrival time and ST is start time.
 - **RR (Round Robin) Scheduling Formula:** RR = \frac{1}{q} — Time quantum, where q is the time slice allocated to each process.
 - **LIFO (Last-In-First-Out) Scheduling Formula:** LIFO = \frac{FT}{AT} — Priority of a process based on finish time, where FT is finish time and AT is arrival time.
 - **Multilevel Feedback Queue Scheduling Formula:** MLFQ = \frac{1}{q} \times \frac{1}{p} — Priority of a process based on time quantum and priority, where q is the time slice allocated to each process and p is the priority number.
 - **Banker's Algorithm Formula:** BA = \frac{Need}{Max} — Test for safety, where Need is the maximum requirement of a process and Max is the maximum resource available.
 - **Huffman Coding Formula:** HC = \frac{1}{p} \times \log_2{p} — Variable-length prefix code for data compression, where p is the probability of a symbol.
 - **Page Replacement Algorithm (PRA) Formula:** PRA = \frac{1}{p} \times \frac{1}{f} — Replacement of pages in memory, where p is the page fault rate and f is the frequency of page access.

## <a id="-the-5-mistakes-that-cost-marks"></a>🪤 The 5 Mistakes That Cost Marks

- **Mistake 1:** Incorrectly calculating the {\(Turnaround\ Time\)} in a process scheduling algorithm.
 - *Costs:* 4-6 marks
 - *Fix:* Understand that {\(Turnaround\ Time\)} = {\(Completion\ Time\)} - {\(Arrival\ Time\)}. Make sure to calculate the completion time correctly by adding the burst time to the arrival time.
 - **Mistake 2:** Not considering the concept of {\(Priority\ Scheduling\)} when dealing with multiple processes.
 - *Costs:* 5-7 marks
 - *Fix:* Always consider the priority of each process and how it affects the scheduling algorithm. Use the formula: {\(Priority\)} = {\(1 / Priority\ Number\)} to calculate the priority.
 - **Mistake 3:** Forgetting to apply the {\(Banker's\ Algorithm\)} when dealing with deadlocks.
 - *Costs:* 6-8 marks
 - *Fix:* Always apply the {\(Banker's\ Algorithm\)} to detect deadlocks. Use the formula: {\(Need\)} = {\(Max\)} - {\(Allocation\)} to calculate the need of each process.
 - **Mistake 4:** Incorrectly calculating the {\(Page\ Fault\ Rate\)} in a paging system.
 - *Costs:* 4-6 marks
 - *Fix:* Understand that {\(Page\ Fault\ Rate\)} = {\(Number\ of\ Page\ Faults\)} / {\(Total\ Number\ of\ Requests\)}. Make sure to calculate the number of page faults correctly.
 - **Mistake 5:** Not considering the concept of {\(Segregation\)} when dealing with memory management.
 - *Costs:* 5-7 marks
 - *Fix:* Always consider the segregation of the program into smaller segments. Use the formula: {\(Segment\ Table\)} = {\(Base\ Address\)} + {\(Limit\)} to calculate the segment table.

## <a id="-3-solved-pyqs"></a>✏️ 3 Solved PYQs

- **Q1:** Consider a system with a paging scheme where the page size is 4 KB and the physical memory is 16 MB. If a process requires 20 MB of virtual memory, how many page frames will be required to store the process in memory, assuming each page frame is of the same size as the page?
 - **Trap:** Students often get confused between page size and page frame size, and how to calculate the number of page frames required.
 - **Solution:**
 - First, calculate the total number of pages required for the process: $\frac{20 \times 1024}{4} = 5120$ pages.
 - Since each page frame is of the same size as the page (4 KB), we need to calculate how many page frames can fit in the physical memory: $\frac{16 \times 1024}{4} = 4096$ page frames.
 - However, the question asks for the number of page frames required to store the process, which is determined by the number of pages the process has, not the size of the physical memory. Thus, the calculation should focus on the process's requirements, not the memory's capacity.
 - The number of page frames required equals the number of pages the process needs because each page must be stored in a page frame. Therefore, the calculation should consider the process's size in relation to the page size.
 - **Answer:** 5120 page frames are required to store the process, but given the physical memory constraint, only 4096 page frames are available. The actual requirement is based on the process's size, but the system can only provide up to its capacity.
 
 - **Q2:** In a multi-programming system with a round-robin scheduling algorithm, if the time quantum (or time slice) is set to 10 ms and each process requires 30 ms of CPU time, how many processes can be accommodated within a 1-second time frame?
 - **Trap:** Students may miscalculate the number of time quanta available in 1 second or misunderstand how the round-robin algorithm works.
 - **Solution:**
 - Calculate the total number of time quanta in 1 second: $\frac{1000}{10} = 100$ time quanta.
 - Determine how many time quanta each process needs: $\frac{30}{10} = 3$ time quanta per process.
 - Calculate the number of processes that can be accommodated: $\frac{100}{3} \approx 33.33$. Since we cannot have a fraction of a process, we consider how the round-robin algorithm works - each process gets a turn until it completes its time. Thus, the system can accommodate 33 processes because the 34th process would not be able to complete within the given time frame.
 - **Answer:** 33 processes can be accommodated.
 
 - **Q3:** A computer system uses a virtual memory paging scheme with a page size of 8 KB. If the program requires 32 KB of memory and the system has enough page frames to allocate 4 pages to each process, how much virtual memory can each process use if the main memory is 128 MB and there are 16 processes?
 - **Trap:** Students might confuse virtual memory with physical memory or misunderstand how page allocation affects memory availability.
 - **Solution:**
 - Calculate the total number of page frames available: The main memory is 128 MB, or $128 \times 1024$ KB. With a page size of 8 KB, the total number of page frames is $\frac{128 \times 1024}{8} = 16384$.
 - Since there are 16 processes and each is allocated 4 pages (or page frames), the total number of page frames allocated is $16 \times 4 = 64$ page frames.
 - Calculate the virtual memory each process can use: Each process is allocated 4 page frames, and each page frame is 8 KB, so $4 \times 8 = 32$ KB of virtual memory per process.
 - **Answer:** 32 KB of virtual memory can be used by each process.

## <a id="-the-one-thing-most-students-get-wrong"></a>🧠 The One Thing Most Students Get Wrong

- **The Core Concept:** The key concept that differentiates high scorers from average ones in Operating Systems is the understanding of $\Delta$ (delta) values in **Page Replacement Algorithms**, specifically in the context of **Optimal Page Replacement**.
 - **What 85% scorers do:** Most students focus on basic page replacement algorithms like **First-In-First-Out (FIFO)** and **Least Recently Used (LRU)** without delving into the intricacies of optimal page replacement. They often struggle to calculate $\Delta$ values, which represent the distance to the next reference of a page, and thus fail to optimize their page replacement strategy.
 - **What 95% scorers do:** High scorers, on the other hand, master the **Optimal Page Replacement Algorithm**, which involves calculating $\Delta$ values for each page in memory. They understand that the optimal algorithm replaces the page with the highest $\Delta$ value, i.e., the page that will not be referenced for the longest time. This understanding allows them to minimize page faults, which is critical in optimizing system performance. For instance, given a sequence of page references, a 95% scorer would calculate the $\Delta$ values as follows:
 
 \begin{array}{|c|c|c|c|}
 \hline
 \text{Page} & 1 & 2 & 3 \\
 \hline
 \text{$\Delta$ value} & $\Delta_1$ & $\Delta_2$ & $\Delta_3$ \\
 \hline
 \end{array}
 
 where $\Delta_i$ represents the distance to the next reference of page $i$. By comparing these $\Delta$ values, they can determine which page to replace to minimize future page faults, using the formula: 
 
 \text{Page to replace} = \arg\max_{i} \Delta_i
 
 This advanced understanding of page replacement algorithms and the strategic use of $\Delta$ values sets high scorers apart from their peers.

| Page Replacement Algorithm | Description | Optimization Strategy |
| --- | --- | --- |
| FIFO | Replaces the page that has been in memory for the longest time | Not optimal, as it does not consider future page references |
| LRU | Replaces the page that has not been referenced for the longest time | Better than FIFO, but still not optimal |
| Optimal Page Replacement | Replaces the page with the highest $\Delta$ value | Minimizes page faults by considering future page references |

## <a id="-ayushs-note"></a>👁️ Ayush's Note

- **The Hidden Pattern:** In Operating Systems, a specific pattern emerges when analyzing $5$-year Pyqs. It becomes evident that the concept of $\times$ (multiplication) is often used to calculate the number of $\text{page faults}$ in a system. For instance, given a $\text{page replacement algorithm}$ like $\text{LRU}$ or $\text{FIFO}$, we can use the formula $\text{Page Faults} = \times \text{(number of pages)} \times \text{(number of frames)}$ to determine the total number of page faults. Furthermore, the $\text{Paging Algorithm}$ is also crucial in determining page faults.,- **How to Apply It:** To apply this pattern, one must first identify the type of page replacement algorithm being used. If it is $\text{LRU}$, then we use the $\text{stack algorithm}$ to calculate page faults. On the other hand, if it is $\text{FIFO}$, we use the $\text{queue algorithm}$. The key here is to recognize that the $\text{page fault rate}$ is directly proportional to the $\text{number of pages}$ and inversely proportional to the $\text{number of frames}$, which can be expressed as $\frac{1}{\text{Page Fault Rate}} = \frac{\text{Number of Frames}}{\text{Number of Pages}}$.,- **PYQ-Specific Trend:** Upon analyzing $5$-year Pyqs, a trend emerges that questions often focus on the $\text{optimality}$ of a particular page replacement algorithm. For instance, questions may ask to compare the $\text{performance}$ of $\text{LRU}$ vs $\text{FIFO}$ or to determine the $\text{optimal}$ page replacement algorithm for a given scenario. The trend also suggests that Pyqs often test the ability to $\text{derive}$ the $\text{page fault rate}$ formula from first principles, which can be expressed as $\text{Page Fault Rate} = \frac{\text{Number of Page Faults}}{\text{Total Number of Requests}}$.,- **Formula Application:** Another crucial aspect is the application of formulas to solve problems. For example, the $\text{page fault rate}$ can be calculated using the formula $\text{Page Fault Rate} = \frac{1}{\text{Number of Frames}} \times \frac{\text{Number of Pages}}{\text{Total Number of Requests}}$. Additionally, the $\text{average memory access time}$ can be calculated using the formula $\text{Average Memory Access Time} = \text{Page Fault Rate} \times \text{Page Fault Time} + (1 - \text{Page Fault Rate}) \times \text{Memory Access Time}$.

| Page Replacement Algorithm | Page Fault Rate | Average Memory Access Time |
| --- | --- | --- |
| $\text{LRU}$ | $\frac{1}{\text{Number of Frames}} \times \frac{\text{Number of Pages}}{\text{Total Number of Requests}}$ | $\text{Page Fault Rate} \times \text{Page Fault Time} + (1 - \text{Page Fault Rate}) \times \text{Memory Access Time}$ |
| $\text{FIFO}$ | $\frac{1}{\text{Number of Frames}} \times \frac{\text{Number of Pages}}{\text{Total Number of Requests}}$ | $\text{Page Fault Rate} \times \text{Page Fault Time} + (1 - \text{Page Fault Rate}) \times \text{Memory Access Time}$ |

## <a id="-last-5-minutes-box"></a>🔁 Last 5 Minutes Box

- {\displaystyle \textrm{Turnaround Time} = \textrm{Completion Time} - \textrm{Arrival Time}} 
 - {\displaystyle \textrm{Waiting Time} = \textrm{Turnaround Time} - \textrm{Burst Time}}
 - {\displaystyle \textrm{Response Time} = \textrm{Time of first response} - \textrm{Arrival Time}}
 - {\displaystyle \textrm{Throughput} = \frac{\textrm{Number of processes completed}}{\textrm{Time taken to complete them}}}
 - {\displaystyle \textrm{Priority} = \frac{1}{\textrm{Priority Number}}}
 - Key facts:
 - The primary goal of an operating system is to manage computer hardware and provide a platform for running application software.
 - Operating systems act as a bridge between the user and the computer hardware.
 - The main components of an operating system include process management, memory management, file management, input/output management, and security.
 - Common mistakes:
 - Incorrectly calculating the turnaround time and waiting time for a given set of processes.
 - Failing to consider the priority of processes in scheduling algorithms.

## <a id="-practice-mcqs"></a>📝 Practice MCQs

**1. What is the primary function of the Page Table in a virtual memory system?**

A) To store the mapping of virtual addresses to physical addresses
B) To manage the allocation and deallocation of memory
C) To schedule processes for execution
D) To handle interrupts

**Answer:** A) The Page Table is responsible for storing the mapping of virtual addresses to physical addresses, enabling the operating system to translate virtual addresses to physical addresses.

---

**2. Which of the following is an example of a synchronization primitive?**

A) Semaphore
B) Mutex
C) Pipe
D) Socket

**Answer:** A) A semaphore is a synchronization primitive used to control access to shared resources by multiple processes.

---

**3. What is the purpose of the context switch in an operating system?**

A) To switch between user and kernel mode
B) To switch between processes
C) To switch between threads
D) To switch between input/output operations

**Answer:** B) A context switch is the process of switching between two or more processes or threads, allowing the operating system to manage multiple tasks concurrently.

---

**4. Which of the following is an example of a deadlock situation?**

A) Process P1 is waiting for resource R1, and process P2 is waiting for resource R2
B) Process P1 is waiting for resource R1, and process P2 is holding resource R1
C) Process P1 is waiting for resource R1, and process P2 is waiting for resource R2
D) Process P1 is holding resource R1, and process P2 is holding resource R2

**Answer:** C) A deadlock situation occurs when two or more processes are unable to proceed because each is waiting for a resource held by another process.

---

**5. What is the primary function of the Process Scheduler in an operating system?**

A) To manage the allocation and deallocation of memory
B) To schedule processes for execution
C) To handle interrupts
D) To manage input/output operations

**Answer:** B) The Process Scheduler is responsible for scheduling processes for execution, allocating CPU time to each process, and managing process execution.

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/class-11/computer-science/operating-systems-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Communication Systems Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/communication-systems-class-12-notes)
- 📖 [Application of Derivatives Class 12 Mathematics Revision — JEE 2026 Grandmaster Guide](/blog/application-of-derivatives-class-12-notes)
- 📖 [Atoms Class 12 Physics Revision — JEE & NEET 2026 Grandmaster Guide](/blog/atoms-class-12-notes)
- 📖 [Biodiversity and Conservation Class 12 Biology Revision — NEET 2026 Grandmaster Guide](/blog/biodiversity-and-conservation-class-12-notes)
