---
heroImage: "/blog-images/operating-systems-class-12-notes.webp"
title: "Operating Systems Class 12 Exam Prep Revision — Grandmaster Guide"
description: "Operating Systems Class 12 Exam Prep Revision — Grandmaster Guide Revision Notes. Last Updated: 2026-04-20."
category: "Exam Notes"
date: "2026-04-20"
practice_link: "/practice/operating-systems-class-12-notes"
manualReview: false
---

## ⚡ Formula Bank
- $Time\ Quantum = \frac{Total\ Time}{Number\ of\ Processes}$
- $Turnaround\ Time = Completion\ Time - Arrival\ Time$
- $Waiting\ Time = Turnaround\ Time - Burst\ Time$
- $Response\ Time = First\ Response - Arrival\ Time$
- $Throughput = \frac{Number\ of\ Processes\ Completed}{Time}$
- $Priority = \frac{1}{Priority\ Number}$
- $FCFS\ (First\ Come\ First\ Served)\ Algorithm = Non-Preemptive$
- $SJF\ (Shortest\ Job\ First)\ Algorithm = Non-Preemptive$
- $RR\ (Round\ Robin)\ Algorithm = Preemptive$
- $Priority\ Scheduling\ Algorithm = Preemptive\ or\ Non-Preemptive$
- $LRU\ (Least\ Recently\ Used)\ Page\ Replacement\ Algorithm = Replace\ the\ page\ that\ has\ not\ been\ used\ recently$
- $Optimal\ Page\ Replacement\ Algorithm = Replace\ the\ page\ that\ will\ not\ be\ used\ for\ the\ longest\ time$
- $Multilevel\ Feedback\ Queue\ Scheduling\ Algorithm = Multiple\ queues\ with\ different\ priority\ levels$

## 🪤 The 5 Mistakes That Cost Marks
- Not understanding the difference between Preemptive and Non-Preemptive Scheduling Algorithms
- Not being able to calculate Turnaround Time, Waiting Time, and Response Time
- Not knowing the different types of Page Replacement Algorithms
- Not being able to explain the concept of Deadlock and how to prevent it
- Not understanding the concept of Semaphore and how it is used for process synchronization

## ✏️ 3 Solved PYQs
- **Question 1:** A computer system has 3 processes with arrival times 0, 2, and 4, and burst times 5, 3, and 2. Calculate the average turnaround time using the FCFS scheduling algorithm.
  - Arrival Time: 0, 2, 4
  - Burst Time: 5, 3, 2
  - Completion Time: 5, 8, 10
  - Turnaround Time: 5, 6, 6
  - Average Turnaround Time: $\frac{5+6+6}{3} = \frac{17}{3} = 5.67$
- **Question 2:** A computer system has 4 pages with page sizes 1, 2, 3, and 4. The page reference string is 1, 2, 3, 4, 2, 1, 3, 2. Calculate the [number](/blog/number-systems-class-9-notes) of page faults using the LRU page replacement algorithm.
  - Page Reference String: 1, 2, 3, 4, 2, 1, 3, 2
  - Page Faults: 4 (initial pages), 0 (page 2 already in memory), 0 (page 1 already in memory), 0 (page 3 already in memory), 0 (page 2 already in memory)
  - Total Page Faults: 4
- **Question 3:** A computer system has 2 processes with arrival times 0 and 2, and burst times 5 and 3. Calculate the average waiting time using the SJF scheduling algorithm.
  - Arrival Time: 0, 2
  - Burst Time: 5, 3
  - Completion Time: 5, 8
  - Turnaround Time: 5, 6
  - Waiting Time: 0, 3
  - Average Waiting Time: $\frac{0+3}{2} = \frac{3}{2} = 1.5$

## 🧠 The One Thing Most Students Get Wrong
- Not understanding the concept of Deadlock and how to prevent it. A deadlock is a situation where two or more processes are blocked indefinitely, each waiting for the other to release a resource. To prevent deadlock, we can use the following methods:
  - Mutual Exclusion: Ensure that only one process can access a resource at a time.
  - Hold and Wait: Ensure that a process does not hold a resource and wait for another resource.
  - No Preemption: Ensure that a process does not preempt another process.
  - Circular Wait: Ensure that there is no circular wait between processes.

## 👁️ Ayush's Note
- To solve problems related to Operating [systems](/blog/number-systems-class-9-notes), always start by identifying the type of scheduling algorithm or page replacement algorithm used.
- Make sure to calculate the turnaround time, waiting time, and response time for each process.
- Use the formula bank to calculate the average turnaround time, average waiting time, and throughput.
- Always draw a diagram to visualize the problem and the solution.
- Practice, practice, practice! The more you practice, the better you will become at solving problems related to Operating Systems.

## 🔁 Last 5 Minutes Box
- Make sure to review the formula bank and the different types of scheduling algorithms and page replacement algorithms.
- Review the concept of Deadlock and how to prevent it.
- Practice calculating the turnaround time, waiting time, and response time for each process.
- Review the concept of Semaphore and how it is used for process synchronization.
- Make sure to review the solved PYQs and practice solving similar problems.

## 📝 Practice MCQs
**1. Which of the following scheduling algorithms is non-preemptive?**
-
A) FCFS
-
B) SJF
-
C) RR
-
D) Priority Scheduling

**Answer: A) FCFS. Explanation: FCFS is a non-preemptive scheduling algorithm, meaning that once a process is started, it will run to completion before the next process is started.**

**2. Which of the following page replacement algorithms replaces the page that has not been used recently?**
-
A) LRU
-
B) Optimal
-
C) FIFO
-
D) Priority

**Answer: A) LRU. Explanation: LRU replaces the page that has not been used recently.**

**3. What is the average turnaround time for the following processes using the FCFS scheduling algorithm?**
- Arrival Time: 0, 2, 4
- Burst Time: 5, 3, 2
-
A) 5.67
-
B) 6.33
-
C) 7.00
-
D) 8.00

**Answer: A) 5.67. Explanation: The average turnaround time is calculated by summing the turnaround times for each process and dividing by the number of processes.**

**4. Which of the following is a method to prevent deadlock?**
-
A) Mutual Exclusion
-
B) Hold and Wait
-
C) No Preemption
-
D) All of the above

**Answer: D) All of the above. Explanation: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait are all methods to prevent deadlock.**

**5. What is the purpose of a semaphore in Operating Systems?**
-
A) To synchronize processes
-
B) To allocate memory
-
C) To handle interrupts
-
D) To manage files

**Answer: A) To synchronize processes. Explanation: A semaphore is a variable that is used to synchronize processes and prevent them from accessing a shared resource simultaneously.**

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/practice/operating-systems-class-12-notes) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*

---

## 📚 Related Topics

Continue your revision with these related guides:

- 📖 [Number Systems 9 Class 9 Exam Prep Revision — Grandmaster Guide](/blog/number-systems-class-9-notes)
- 📖 [Aldehydes Ketones And Carboxylic Acids Class 12 Exam Prep Revision — Grandmaster Guide](/blog/aldehydes-ketones-and-carboxylic-acids-class-12-notes)
- 📖 [Amines Class 12 Exam Prep Revision — Grandmaster Guide](/blog/amines-class-12-notes)
- 📖 [Application Of Derivatives Class 12 Exam Prep Revision — Grandmaster Guide](/blog/application-of-derivatives-class-12-notes)
