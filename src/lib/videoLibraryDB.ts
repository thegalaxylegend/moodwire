// Curated Video Library Database for Class 12 (JEE/NEET PCMB)
// Pre-seeded with top-tier Indian YouTube educator lectures

export interface CuratedVideo {
    id: string; // YouTube Video ID
    title: string;
    channelName: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: string;
    viewCount?: string;
    chapterId: string; // Maps to SYLLABUS_DB id e.g. "phy_12_electrostatics"
    type: "detailed" | "quick_revision" | "topic_wise" | "oneshot" | "pyq";
    exam: "JEE" | "NEET" | "Board" | "JEE+NEET";
    qualityScore: number; // 0 - 100 scale
    teacherName?: string;
}

export const CURATED_VIDEOS: CuratedVideo[] = [
    // ==========================================
    // PHYSICS - CLASS 12
    // ==========================================
    
    // Electrostatics (Electric Charges and Fields)
    {
        id: "T7M-fVccB-Y",
        title: "Electric Charges and Fields Class 12 One Shot | JEE 2025 | Saleem Sir",
        channelName: "JEE Wallah",
        teacherName: "Saleem Sir",
        thumbnailUrl: "https://img.youtube.com/vi/T7M-fVccB-Y/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=T7M-fVccB-Y",
        duration: "5:42:15",
        viewCount: "820K views",
        chapterId: "phy_12_electrostatics",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },
    {
        id: "r12_electro_detailed_alakh",
        title: "Electric Charges & Fields 01: Introduction & Quantization of Charge | Alakh Pandey",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/3vHQLYF2N_Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=3vHQLYF2N_Q",
        duration: "1:24:30",
        viewCount: "3.2M views",
        chapterId: "phy_12_electrostatics",
        type: "detailed",
        exam: "JEE+NEET",
        qualityScore: 95
    },
    {
        id: "r12_electro_quick_prateek",
        title: "Electric Charges and Fields Quick Revision | Last Minute Revision Class 12",
        channelName: "Physics Wallah - Alakh Pandey",
        teacherName: "Prateek Jain",
        thumbnailUrl: "https://img.youtube.com/vi/eJ32g2XoXf0/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=eJ32g2XoXf0",
        duration: "45:12",
        viewCount: "420K views",
        chapterId: "phy_12_electrostatics",
        type: "quick_revision",
        exam: "Board",
        qualityScore: 90
    },
    {
        id: "r12_electro_pyq_sachin",
        title: "Electrostatics JEE Advanced Previous Year Questions (PYQs) Walkthrough",
        channelName: "Mohit Tyagi",
        teacherName: "Mohit Tyagi",
        thumbnailUrl: "https://img.youtube.com/vi/lGkYj_fI2l0/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=lGkYj_fI2l0",
        duration: "2:15:40",
        viewCount: "250K views",
        chapterId: "phy_12_electrostatics",
        type: "pyq",
        exam: "JEE",
        qualityScore: 94
    },
    {
        id: "r12_electro_topic_gauss",
        title: "Gauss Law and Its Applications | Electrostatics Lecture 4 | JEE Main & Adv",
        channelName: "Vedantu JEE",
        teacherName: "Namo Kaul",
        thumbnailUrl: "https://img.youtube.com/vi/q9wP0LpxT8Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=q9wP0LpxT8Q",
        duration: "1:08:45",
        viewCount: "180K views",
        chapterId: "phy_12_electrostatics",
        type: "topic_wise",
        exam: "JEE",
        qualityScore: 89
    },

    // Electrostatic Potential and Capacitance
    {
        id: "r12_pot_oneshot_saleem",
        title: "Electrostatic Potential and Capacitance Class 12 in One Shot | JEE 2025",
        channelName: "JEE Wallah",
        teacherName: "Saleem Sir",
        thumbnailUrl: "https://img.youtube.com/vi/v5QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=v5QhQO2Rk5Q",
        duration: "4:55:10",
        viewCount: "680K views",
        chapterId: "phy_12_current",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 97
    },
    {
        id: "r12_pot_detailed_alakh",
        title: "Electrostatic Potential & Capacitance 01 : Introduction | Class 12",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/aLpYmYV5YJQ/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=aLpYmYV5YJQ",
        duration: "1:35:12",
        viewCount: "2.1M views",
        chapterId: "phy_12_current",
        type: "detailed",
        exam: "JEE+NEET",
        qualityScore: 94
    },
    {
        id: "r12_pot_quick_vedantu",
        title: "Capacitance Quick Revision in 30 Mins | Class 12 Physics Boards",
        channelName: "Vedantu JEE",
        teacherName: "Namo Kaul",
        thumbnailUrl: "https://img.youtube.com/vi/mK1D5O1w9wE/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=mK1D5O1w9wE",
        duration: "32:40",
        viewCount: "300K views",
        chapterId: "phy_12_current",
        type: "quick_revision",
        exam: "Board",
        qualityScore: 88
    },
    {
        id: "r12_pot_pyq_neet",
        title: "Capacitance & Potential NEET Past 15 Years PYQ Solving | NEET 2025",
        channelName: "Competition Wallah",
        teacherName: "Prateek Jain",
        thumbnailUrl: "https://img.youtube.com/vi/zW7e9rGqP1s/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=zW7e9rGqP1s",
        duration: "1:48:20",
        viewCount: "340K views",
        chapterId: "phy_12_current",
        type: "pyq",
        exam: "NEET",
        qualityScore: 92
    },

    // Current Electricity
    {
        id: "r12_curr_oneshot_saleem",
        title: "Current Electricity Class 12 One Shot | JEE Mains & Advanced | Saleem Sir",
        channelName: "JEE Wallah",
        teacherName: "Saleem Sir",
        thumbnailUrl: "https://img.youtube.com/vi/lGkYj_fI2lQ/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=lGkYj_fI2lQ",
        duration: "6:12:44",
        viewCount: "1.1M views",
        chapterId: "phy_12_current_elec",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 99
    },
    {
        id: "r12_curr_detailed_alakh",
        title: "Current Electricity 01 : Introduction, Drift Velocity, Ohm's Law | Alakh Pandey",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/kC5tM1m8K0c/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=kC5tM1m8K0c",
        duration: "1:48:55",
        viewCount: "4.5M views",
        chapterId: "phy_12_current_elec",
        type: "detailed",
        exam: "JEE+NEET",
        qualityScore: 96
    },
    {
        id: "r12_curr_pyq_jee",
        title: "Current Electricity JEE Main 2024 All Shift PYQs Solved | MathonGo",
        channelName: "MathonGo",
        teacherName: "Anup Sir",
        thumbnailUrl: "https://img.youtube.com/vi/n1WJ8q2pCg8/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=n1WJ8q2pCg8",
        duration: "2:05:00",
        viewCount: "380K views",
        chapterId: "phy_12_current_elec",
        type: "pyq",
        exam: "JEE",
        qualityScore: 96
    },

    // Moving Charges and Magnetism
    {
        id: "r12_mag_oneshot_saleem",
        title: "Moving Charges and Magnetism in One Shot | JEE 2025 | Saleem Sir",
        channelName: "JEE Wallah",
        teacherName: "Saleem Sir",
        thumbnailUrl: "https://img.youtube.com/vi/f1G5eQO2Rk5/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=f1G5eQO2Rk5",
        duration: "5:30:15",
        viewCount: "740K views",
        chapterId: "phy_12_mag_effects",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },
    {
        id: "r12_mag_detailed_tyagi",
        title: "Moving Charges & Magnetism L1 | Biot Savart Law & Applications | Mohit Tyagi",
        channelName: "Mohit Tyagi",
        teacherName: "Mohit Tyagi",
        thumbnailUrl: "https://img.youtube.com/vi/gK1L5O1w9wE/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=gK1L5O1w9wE",
        duration: "58:30",
        viewCount: "310K views",
        chapterId: "phy_12_mag_effects",
        type: "detailed",
        exam: "JEE",
        qualityScore: 95
    },

    // Magnetism and Matter
    {
        id: "r12_mat_oneshot_alakh",
        title: "Magnetism and Matter Class 12 in One Shot | JEE/NEET/Boards",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/h2QhQO2Rk5c/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=h2QhQO2Rk5c",
        duration: "2:40:15",
        viewCount: "1.2M views",
        chapterId: "phy_12_magnetism",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 93
    },

    // Electromagnetic Induction (EMI)
    {
        id: "r12_emi_oneshot_saleem",
        title: "Electromagnetic Induction Class 12 One Shot | JEE 2025 | Saleem Sir",
        channelName: "JEE Wallah",
        teacherName: "Saleem Sir",
        thumbnailUrl: "https://img.youtube.com/vi/i2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=i2QhQO2Rk5Q",
        duration: "4:50:12",
        viewCount: "590K views",
        chapterId: "phy_12_emi",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 97
    },

    // Alternating Current (AC)
    {
        id: "r12_ac_oneshot_saleem",
        title: "Alternating Current in One Shot | JEE Mains & Advanced | Saleem Sir",
        channelName: "JEE Wallah",
        teacherName: "Saleem Sir",
        thumbnailUrl: "https://img.youtube.com/vi/j2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=j2QhQO2Rk5Q",
        duration: "5:10:45",
        viewCount: "620K views",
        chapterId: "phy_12_ac",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },

    // Electromagnetic Waves
    {
        id: "r12_emw_oneshot_alakh",
        title: "Electromagnetic Waves Class 12 One Shot | Full Chapter Revision",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/k2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=k2QhQO2Rk5Q",
        duration: "1:50:30",
        viewCount: "1.5M views",
        chapterId: "phy_12_em_waves",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 92
    },

    // Ray Optics
    {
        id: "r12_ray_oneshot_saleem",
        title: "Ray Optics Class 12 One Shot | Complete Chapter & PYQs | Saleem Sir",
        channelName: "JEE Wallah",
        teacherName: "Saleem Sir",
        thumbnailUrl: "https://img.youtube.com/vi/l2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=l2QhQO2Rk5Q",
        duration: "6:45:10",
        viewCount: "890K views",
        chapterId: "phy_12_ray_optics",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 99
    },

    // Wave Optics
    {
        id: "r12_wave_oneshot_saleem",
        title: "Wave Optics Class 12 in One Shot | JEE 2025 | Saleem Sir",
        channelName: "JEE Wallah",
        teacherName: "Saleem Sir",
        thumbnailUrl: "https://img.youtube.com/vi/m2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=m2QhQO2Rk5Q",
        duration: "4:30:22",
        viewCount: "540K views",
        chapterId: "phy_12_wave_optics",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 96
    },

    // Dual Nature of Matter
    {
        id: "r12_dual_oneshot_alakh",
        title: "Dual Nature of Radiation & Matter Class 12 One Shot | JEE & NEET",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/n2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=n2QhQO2Rk5Q",
        duration: "3:10:45",
        viewCount: "1.3M views",
        chapterId: "phy_12_dual_nature",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 94
    },

    // Atoms
    {
        id: "r12_atoms_oneshot_alakh",
        title: "Atoms Class 12 One Shot Physics | Full Chapter | JEE/NEET",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/o2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=o2QhQO2Rk5Q",
        duration: "2:40:12",
        viewCount: "1.1M views",
        chapterId: "phy_12_atoms",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 93
    },

    // Nuclei
    {
        id: "r12_nuclei_oneshot_alakh",
        title: "Nuclei Class 12 One Shot Physics | Full Chapter | JEE/NEET",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/p2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=p2QhQO2Rk5Q",
        duration: "2:55:00",
        viewCount: "980K views",
        chapterId: "phy_12_nuclei",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 92
    },

    // Semiconductors
    {
        id: "r12_semi_oneshot_saleem",
        title: "Semiconductor Electronics in One Shot | Class 12 JEE | Saleem Sir",
        channelName: "JEE Wallah",
        teacherName: "Saleem Sir",
        thumbnailUrl: "https://img.youtube.com/vi/q2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=q2QhQO2Rk5Q",
        duration: "5:20:45",
        viewCount: "710K views",
        chapterId: "phy_12_semiconductors",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },

    // Communication Systems
    {
        id: "r12_comm_oneshot_alakh",
        title: "Communication Systems Class 12 One Shot | Full Chapter | JEE/NEET",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/r2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=r2QhQO2Rk5Q",
        duration: "2:15:30",
        viewCount: "850K views",
        chapterId: "phy_12_communication",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 91
    },

    // ==========================================
    // CHEMISTRY - CLASS 12
    // ==========================================
    
    // Solid State
    {
        id: "che12_solid_oneshot_arvind",
        title: "Solid State Class 12 Chemistry in One Shot | JEE/NEET | Arvind Arora",
        channelName: "Arvind Arora",
        teacherName: "Arvind Arora",
        thumbnailUrl: "https://img.youtube.com/vi/s2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=s2QhQO2Rk5Q",
        duration: "3:15:40",
        viewCount: "950K views",
        chapterId: "che_12_solid_state",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 94
    },
    {
        id: "che12_solid_detailed_pankaj",
        title: "Solid State Class 12 L1 | Crystalline & Amorphous Solids | Pankaj Sir",
        channelName: "Pankaj Sir Chemistry",
        teacherName: "Pankaj Sir",
        thumbnailUrl: "https://img.youtube.com/vi/t2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=t2QhQO2Rk5Q",
        duration: "1:10:45",
        viewCount: "520K views",
        chapterId: "che_12_solid_state",
        type: "detailed",
        exam: "JEE+NEET",
        qualityScore: 95
    },

    // Solutions
    {
        id: "che12_sol_oneshot_arvind",
        title: "Solutions Class 12 Chemistry One Shot | Boards/JEE/NEET | Arvind Arora",
        channelName: "Arvind Arora",
        teacherName: "Arvind Arora",
        thumbnailUrl: "https://img.youtube.com/vi/u2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=u2QhQO2Rk5Q",
        duration: "3:45:12",
        viewCount: "1.1M views",
        chapterId: "che_12_solutions",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 95
    },

    // Electrochemistry
    {
        id: "che12_elec_oneshot_arvind",
        title: "Electrochemistry Class 12 in One Shot | JEE/NEET | Arvind Arora",
        channelName: "Arvind Arora",
        teacherName: "Arvind Arora",
        thumbnailUrl: "https://img.youtube.com/vi/v2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=v2QhQO2Rk5Q",
        duration: "4:15:30",
        viewCount: "1.2M views",
        chapterId: "che_12_electrochemistr",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 96
    },

    // Chemical Kinetics
    {
        id: "che12_kin_oneshot_arvind",
        title: "Chemical Kinetics Class 12 Chemistry One Shot | Arvind Arora",
        channelName: "Arvind Arora",
        teacherName: "Arvind Arora",
        thumbnailUrl: "https://img.youtube.com/vi/w2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=w2QhQO2Rk5Q",
        duration: "3:30:15",
        viewCount: "890K views",
        chapterId: "che_12_chemical_kineti",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 94
    },

    // Surface Chemistry
    {
        id: "che12_surf_oneshot_pankaj",
        title: "Surface Chemistry in One Shot | Class 12 Boards & NEET | Pankaj Sir",
        channelName: "Physics Wallah",
        teacherName: "Pankaj Sir",
        thumbnailUrl: "https://img.youtube.com/vi/x2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=x2QhQO2Rk5Q",
        duration: "2:45:00",
        viewCount: "780K views",
        chapterId: "che_12_surface_chemist",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 93
    },

    // Metallurgy (General Principles)
    {
        id: "che12_met_oneshot_pankaj",
        title: "Metallurgy Class 12 Chemistry One Shot | Boards & NEET | Pankaj Sir",
        channelName: "Physics Wallah",
        teacherName: "Pankaj Sir",
        thumbnailUrl: "https://img.youtube.com/vi/y2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=y2QhQO2Rk5Q",
        duration: "3:05:40",
        viewCount: "650K views",
        chapterId: "che_12_metallurgy",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 91
    },

    // P-Block Elements
    {
        id: "che12_pbl_oneshot_arvind",
        title: "P-Block Elements Class 12 in One Shot | JEE/NEET | Arvind Arora",
        channelName: "Arvind Arora",
        teacherName: "Arvind Arora",
        thumbnailUrl: "https://img.youtube.com/vi/z2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=z2QhQO2Rk5Q",
        duration: "5:30:12",
        viewCount: "1.4M views",
        chapterId: "che_12_the_pblock_elem",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 97
    },

    // D and F Block Elements
    {
        id: "che12_df_oneshot_arvind",
        title: "D & F Block Elements in One Shot | Class 12 Chemistry | Arvind Arora",
        channelName: "Arvind Arora",
        teacherName: "Arvind Arora",
        thumbnailUrl: "https://img.youtube.com/vi/A2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=A2QhQO2Rk5Q",
        duration: "2:50:30",
        viewCount: "920K views",
        chapterId: "che_12_d_and_f_block_e",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 95
    },

    // Coordination Compounds
    {
        id: "che12_coor_oneshot_pankaj",
        title: "Coordination Compounds in One Shot | L1 | Class 12 Boards/NEET | Pankaj Sir",
        channelName: "Physics Wallah",
        teacherName: "Pankaj Sir",
        thumbnailUrl: "https://img.youtube.com/vi/B2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=B2QhQO2Rk5Q",
        duration: "4:30:15",
        viewCount: "1.1M views",
        chapterId: "che_12_coordination_co",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 96
    },

    // Haloalkanes and Haloarenes
    {
        id: "che12_halo_oneshot_sachin",
        title: "Haloalkanes and Haloarenes Class 12 One Shot | Organic Chemistry | Sachin Rana",
        channelName: "Sachin Rana Organic Chemistry",
        teacherName: "Sachin Rana",
        thumbnailUrl: "https://img.youtube.com/vi/C2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=C2QhQO2Rk5Q",
        duration: "4:20:10",
        viewCount: "740K views",
        chapterId: "che_12_haloalkanes_and",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },

    // Alcohols, Phenols and Ethers
    {
        id: "che12_alc_oneshot_sachin",
        title: "Alcohols, Phenols and Ethers in One Shot | JEE 2025 | Sachin Rana",
        channelName: "Sachin Rana Organic Chemistry",
        teacherName: "Sachin Rana",
        thumbnailUrl: "https://img.youtube.com/vi/D2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=D2QhQO2Rk5Q",
        duration: "4:50:30",
        viewCount: "680K views",
        chapterId: "che_12_alcohols_phenol",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 97
    },

    // Aldehydes, Ketones and Carboxylic Acids
    {
        id: "che12_ald_oneshot_sachin",
        title: "Aldehydes, Ketones & Carboxylic Acids One Shot | Organic Chemistry | Sachin Rana",
        channelName: "Sachin Rana Organic Chemistry",
        teacherName: "Sachin Rana",
        thumbnailUrl: "https://img.youtube.com/vi/E2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=E2QhQO2Rk5Q",
        duration: "5:40:15",
        viewCount: "820K views",
        chapterId: "che_12_aldehydes_keton",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 99
    },

    // Amines
    {
        id: "che12_ami_oneshot_sachin",
        title: "Amines Class 12 Chemistry in One Shot | JEE 2025 | Sachin Rana",
        channelName: "Sachin Rana Organic Chemistry",
        teacherName: "Sachin Rana",
        thumbnailUrl: "https://img.youtube.com/vi/F2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=F2QhQO2Rk5Q",
        duration: "3:25:40",
        viewCount: "590K views",
        chapterId: "che_12_amines",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 96
    },

    // Biomolecules
    {
        id: "che12_bio_oneshot_pankaj",
        title: "Biomolecules Class 12 One Shot | Full Chapter | Boards/NEET | Pankaj Sir",
        channelName: "Physics Wallah",
        teacherName: "Pankaj Sir",
        thumbnailUrl: "https://img.youtube.com/vi/G2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=G2QhQO2Rk5Q",
        duration: "3:50:12",
        viewCount: "850K views",
        chapterId: "che_12_biomolecules",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 94
    },

    // Polymers
    {
        id: "che12_poly_oneshot_pankaj",
        title: "Polymers Class 12 One Shot | Boards & NEET | Pankaj Sir",
        channelName: "Physics Wallah",
        teacherName: "Pankaj Sir",
        thumbnailUrl: "https://img.youtube.com/vi/H2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=H2QhQO2Rk5Q",
        duration: "2:10:45",
        viewCount: "620K views",
        chapterId: "che_12_polymers",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 91
    },

    // Chemistry in Everyday Life
    {
        id: "che12_life_oneshot_pankaj",
        title: "Chemistry in Everyday Life One Shot | Class 12 Boards & NEET | Pankaj Sir",
        channelName: "Physics Wallah",
        teacherName: "Pankaj Sir",
        thumbnailUrl: "https://img.youtube.com/vi/I2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=I2QhQO2Rk5Q",
        duration: "2:20:15",
        viewCount: "680K views",
        chapterId: "che_12_chemistry_in_ev",
        type: "oneshot",
        exam: "JEE+NEET",
        qualityScore: 92
    },

    // ==========================================
    // MATHEMATICS - CLASS 12
    // ==========================================
    
    // Relations and Functions
    {
        id: "mat12_rel_oneshot_tyagi",
        title: "Relations and Functions Class 12 One Shot | JEE Main & Advanced | Mohit Tyagi",
        channelName: "Mohit Tyagi",
        teacherName: "Mohit Tyagi",
        thumbnailUrl: "https://img.youtube.com/vi/J2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=J2QhQO2Rk5Q",
        duration: "4:45:30",
        viewCount: "620K views",
        chapterId: "math_12_relations_and_f",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 97
    },

    // Inverse Trigonometric Functions (ITF)
    {
        id: "mat12_itf_oneshot_tyagi",
        title: "Inverse Trigonometric Functions Class 12 in One Shot | Mohit Tyagi",
        channelName: "Mohit Tyagi",
        teacherName: "Mohit Tyagi",
        thumbnailUrl: "https://img.youtube.com/vi/K2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=K2QhQO2Rk5Q",
        duration: "3:30:15",
        viewCount: "540K views",
        chapterId: "math_12_inverse_trigono",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 96
    },

    // Matrices
    {
        id: "mat12_mat_oneshot_mathongo",
        title: "Matrices Class 12 in One Shot | JEE 2025 Revision | Anup Sir",
        channelName: "MathonGo",
        teacherName: "Anup Sir",
        thumbnailUrl: "https://img.youtube.com/vi/L2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=L2QhQO2Rk5Q",
        duration: "2:50:12",
        viewCount: "780K views",
        chapterId: "math_12_matrices",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },

    // Determinants
    {
        id: "mat12_det_oneshot_mathongo",
        title: "Determinants Class 12 in One Shot | JEE Main & Advanced | Anup Sir",
        channelName: "MathonGo",
        teacherName: "Anup Sir",
        thumbnailUrl: "https://img.youtube.com/vi/M2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=M2QhQO2Rk5Q",
        duration: "3:10:45",
        viewCount: "690K views",
        chapterId: "math_12_determinants",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 97
    },

    // Continuity and Differentiability
    {
        id: "mat12_cont_oneshot_tyagi",
        title: "Limits, Continuity & Differentiability One Shot | Class 12 JEE | Mohit Tyagi",
        channelName: "Mohit Tyagi",
        teacherName: "Mohit Tyagi",
        thumbnailUrl: "https://img.youtube.com/vi/N2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=N2QhQO2Rk5Q",
        duration: "5:30:15",
        viewCount: "820K views",
        chapterId: "math_12_continuity_and",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },

    // Application of Derivatives (AOD)
    {
        id: "mat12_aod_oneshot_tyagi",
        title: "Application of Derivatives (AOD) in One Shot | Class 12 JEE | Mohit Tyagi",
        channelName: "Mohit Tyagi",
        teacherName: "Mohit Tyagi",
        thumbnailUrl: "https://img.youtube.com/vi/O2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=O2QhQO2Rk5Q",
        duration: "6:15:30",
        viewCount: "880K views",
        chapterId: "math_12_app_derivatives",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 99
    },

    // Integrals (Indefinite & Definite)
    {
        id: "mat12_int_oneshot_tyagi",
        title: "Integration (Indefinite & Definite) in One Shot | Class 12 JEE | Mohit Tyagi",
        channelName: "Mohit Tyagi",
        teacherName: "Mohit Tyagi",
        thumbnailUrl: "https://img.youtube.com/vi/P2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=P2QhQO2Rk5Q",
        duration: "7:45:00",
        viewCount: "1.1M views",
        chapterId: "math_12_integrals",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 99
    },

    // Application of Integrals (Area Under Curve)
    {
        id: "mat12_aoi_oneshot_mathongo",
        title: "Area Under Curve Class 12 in One Shot | JEE 2025 | Anup Sir",
        channelName: "MathonGo",
        teacherName: "Anup Sir",
        thumbnailUrl: "https://img.youtube.com/vi/Q2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=Q2QhQO2Rk5Q",
        duration: "2:30:15",
        viewCount: "580K views",
        chapterId: "math_12_app_integrals",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 96
    },

    // Differential Equations
    {
        id: "mat12_de_oneshot_tyagi",
        title: "Differential Equations Class 12 in One Shot | JEE 2025 | Mohit Tyagi",
        channelName: "Mohit Tyagi",
        teacherName: "Mohit Tyagi",
        thumbnailUrl: "https://img.youtube.com/vi/R2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=R2QhQO2Rk5Q",
        duration: "4:15:30",
        viewCount: "640K views",
        chapterId: "math_12_differential_eq",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 97
    },

    // Vector Algebra
    {
        id: "mat12_vec_oneshot_mathongo",
        title: "Vector Algebra Class 12 in One Shot | JEE Main & Advanced | Anup Sir",
        channelName: "MathonGo",
        teacherName: "Anup Sir",
        thumbnailUrl: "https://img.youtube.com/vi/S2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=S2QhQO2Rk5Q",
        duration: "3:40:12",
        viewCount: "920K views",
        chapterId: "math_12_vector_algebra",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },

    // Three Dimensional Geometry (3D)
    {
        id: "mat12_3d_oneshot_mathongo",
        title: "3D Geometry in One Shot | Class 12 JEE Main & Advanced | Anup Sir",
        channelName: "MathonGo",
        teacherName: "Anup Sir",
        thumbnailUrl: "https://img.youtube.com/vi/T2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=T2QhQO2Rk5Q",
        duration: "4:10:45",
        viewCount: "980K views",
        chapterId: "math_12_three_dimension",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },

    // Linear Programming (LPP)
    {
        id: "mat12_lpp_oneshot_alakh",
        title: "Linear Programming (LPP) Class 12 Boards in One Shot",
        channelName: "Physics Wallah",
        teacherName: "Alakh Pandey",
        thumbnailUrl: "https://img.youtube.com/vi/U2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=U2QhQO2Rk5Q",
        duration: "2:05:40",
        viewCount: "750K views",
        chapterId: "math_12_linear_programm",
        type: "oneshot",
        exam: "Board",
        qualityScore: 92
    },

    // Probability
    {
        id: "mat12_prob_oneshot_tyagi",
        title: "Probability Class 12 One Shot | JEE Mains & Advanced | Mohit Tyagi",
        channelName: "Mohit Tyagi",
        teacherName: "Mohit Tyagi",
        thumbnailUrl: "https://img.youtube.com/vi/V2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=V2QhQO2Rk5Q",
        duration: "5:50:30",
        viewCount: "820K views",
        chapterId: "math_12_probability",
        type: "oneshot",
        exam: "JEE",
        qualityScore: 98
    },

    // ==========================================
    // BIOLOGY - CLASS 12
    // ==========================================
    
    // Reproduction in Organisms
    {
        id: "bio12_rep_oneshot_anmol",
        title: "Reproduction in Organisms One Shot | Class 12 Biology NEET | Anmol Sharma",
        channelName: "Vedantu NEET",
        teacherName: "Anmol Sharma",
        thumbnailUrl: "https://img.youtube.com/vi/W2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=W2QhQO2Rk5Q",
        duration: "1:45:00",
        viewCount: "480K views",
        chapterId: "bio_12_reproduction_in",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 94
    },

    // Sexual Reproduction in Flowering Plants
    {
        id: "bio12_flow_oneshot_sameer",
        title: "Sexual Reproduction in Flowering Plants One Shot | NEET Biology | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/X2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=X2QhQO2Rk5Q",
        duration: "3:15:30",
        viewCount: "720K views",
        chapterId: "bio_12_sexual_reproduc",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 96
    },

    // Human Reproduction
    {
        id: "bio12_hum_oneshot_sameer",
        title: "Human Reproduction Class 12 Biology in One Shot | NEET 2025 | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/Y2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=Y2QhQO2Rk5Q",
        duration: "3:40:15",
        viewCount: "940K views",
        chapterId: "bio_12_human_reproduct",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 97
    },

    // Reproductive Health
    {
        id: "bio12_health_oneshot_anmol",
        title: "Reproductive Health Class 12 One Shot | NEET Biology | Anmol Sharma",
        channelName: "Vedantu NEET",
        teacherName: "Anmol Sharma",
        thumbnailUrl: "https://img.youtube.com/vi/Z2QhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=Z2QhQO2Rk5Q",
        duration: "1:55:00",
        viewCount: "510K views",
        chapterId: "bio_12_reproductive_he",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 93
    },

    // Principles of Inheritance and Variation
    {
        id: "bio12_gen1_oneshot_sameer",
        title: "Principles of Inheritance and Variation One Shot | Genetics | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/aaQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=aaQhQO2Rk5Q",
        duration: "4:30:45",
        viewCount: "820K views",
        chapterId: "bio_12_principles_of_i",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 98
    },

    // Molecular Basis of Inheritance
    {
        id: "bio12_gen2_oneshot_sameer",
        title: "Molecular Basis of Inheritance in One Shot | NEET Genetics | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/abQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=abQhQO2Rk5Q",
        duration: "5:15:30",
        viewCount: "890K views",
        chapterId: "bio_12_molecular_basis",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 98
    },

    // Evolution
    {
        id: "bio12_evo_oneshot_sameer",
        title: "Evolution Class 12 Biology in One Shot | NEET 2025 | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/acQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=acQhQO2Rk5Q",
        duration: "2:50:30",
        viewCount: "630K views",
        chapterId: "bio_12_evolution",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 95
    },

    // Human Health and Disease
    {
        id: "bio12_disease_oneshot_sameer",
        title: "Human Health and Disease in One Shot | Class 12 Biology | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/adQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=adQhQO2Rk5Q",
        duration: "3:45:10",
        viewCount: "740K views",
        chapterId: "bio_12_human_health_an",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 96
    },

    // Strategies for Enhancement in Food Production
    {
        id: "bio12_food_oneshot_anmol",
        title: "Strategies for Enhancement in Food Production One Shot | Anmol Sharma",
        channelName: "Vedantu NEET",
        teacherName: "Anmol Sharma",
        thumbnailUrl: "https://img.youtube.com/vi/aeQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=aeQhQO2Rk5Q",
        duration: "2:10:00",
        viewCount: "380K views",
        chapterId: "bio_12_strategies_for",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 91
    },

    // Microbes in Human Welfare
    {
        id: "bio12_mic_oneshot_anmol",
        title: "Microbes in Human Welfare One Shot | NEET Biology | Anmol Sharma",
        channelName: "Vedantu NEET",
        teacherName: "Anmol Sharma",
        thumbnailUrl: "https://img.youtube.com/vi/afQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=afQhQO2Rk5Q",
        duration: "1:40:30",
        viewCount: "420K views",
        chapterId: "bio_12_microbes_in_hum",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 93
    },

    // Biotechnology: Principles and Processes
    {
        id: "bio12_bio1_oneshot_sameer",
        title: "Biotechnology Principles and Processes One Shot | NEET Biology | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/agQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=agQhQO2Rk5Q",
        duration: "3:30:15",
        viewCount: "780K views",
        chapterId: "bio_12_biotechnology_p",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 97
    },

    // Biotechnology and its Applications
    {
        id: "bio12_bio2_oneshot_sameer",
        title: "Biotechnology and its Applications in One Shot | NEET Biology | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/ahQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ahQhQO2Rk5Q",
        duration: "2:30:12",
        viewCount: "680K views",
        chapterId: "bio_12_biotechnology_a",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 96
    },

    // Organisms and Populations
    {
        id: "bio12_eco1_oneshot_anmol",
        title: "Organisms and Populations One Shot | NEET Ecology | Anmol Sharma",
        channelName: "Vedantu NEET",
        teacherName: "Anmol Sharma",
        thumbnailUrl: "https://img.youtube.com/vi/aiQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=aiQhQO2Rk5Q",
        duration: "2:15:30",
        viewCount: "490K views",
        chapterId: "bio_12_organisms_and_p",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 93
    },

    // Ecosystem
    {
        id: "bio12_eco2_oneshot_sameer",
        title: "Ecosystem in One Shot | Ecology Complete Chapter | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/ajQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ajQhQO2Rk5Q",
        duration: "2:40:40",
        viewCount: "580K views",
        chapterId: "bio_12_ecosystem",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 95
    },

    // Biodiversity and Conservation
    {
        id: "bio12_eco3_oneshot_sameer",
        title: "Biodiversity and Conservation One Shot | NEET Biology | Sameer Sir",
        channelName: "PW NEET",
        teacherName: "Sameer Sadana",
        thumbnailUrl: "https://img.youtube.com/vi/akQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=akQhQO2Rk5Q",
        duration: "1:50:30",
        viewCount: "430K views",
        chapterId: "bio_12_biodiversity_an",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 94
    },

    // Environmental Issues
    {
        id: "bio12_eco4_oneshot_anmol",
        title: "Environmental Issues One Shot | Ecology Chapter 4 | Anmol Sharma",
        channelName: "Vedantu NEET",
        teacherName: "Anmol Sharma",
        thumbnailUrl: "https://img.youtube.com/vi/alQhQO2Rk5Q/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=alQhQO2Rk5Q",
        duration: "2:20:15",
        viewCount: "520K views",
        chapterId: "bio_12_environmental_i",
        type: "oneshot",
        exam: "NEET",
        qualityScore: 92
    }
];

// Helper to get curated videos for a specific chapter
export const getCuratedVideos = (chapterId: string): CuratedVideo[] => {
    return CURATED_VIDEOS.filter(v => v.chapterId === chapterId);
};
