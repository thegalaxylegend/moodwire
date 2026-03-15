
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync('c:/Users/Admin/Downloads/Desktop/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const class11Chapters = {
    Physics: [
        "Units and Measurements",
        "Motion in a Straight Line",
        "Motion in a Plane",
        "Laws of Motion",
        "Work, Energy and Power",
        "Rotational Motion",
        "Gravitation",
        "Mechanical Properties of Solids",
        "Mechanical Properties of Fluids",
        "Thermal Properties of Matter",
        "Thermodynamics",
        "Kinetic Theory",
        "Oscillations",
        "Waves",
        "Physical World"
    ],
    Chemistry: [
        "Some Basic Concepts of Chemistry",
        "Structure of The Atom",
        "Classification of Elements",
        "Chemical Bonding",
        "States of Matter",
        "Thermodynamics",
        "Equilibrium",
        "Redox Reactions",
        "Hydrogen",
        "The S-Block Elements",
        "The P-Block Elements (11)",
        "Organic Chemistry: Basic Principles",
        "Hydrocarbons",
        "Environmental Chemistry"
    ],
    Mathematics: [
        "Sets",
        "Relations and Functions",
        "Trigonometric Functions",
        "Principle of Mathematical Induction",
        "Complex Numbers",
        "Linear Inequalities",
        "Permutations and Combinations",
        "Binomial Theorem",
        "Sequences and Series",
        "Straight Lines",
        "Conic Sections",
        "3D Geometry (Intro)",
        "Limits and Derivatives",
        "Mathematical Reasoning",
        "Statistics",
        "Probability (Intro)"
    ],
    Biology: [
        "The Living World",
        "Biological Classification",
        "Plant Kingdom",
        "Animal Kingdom",
        "Morphology of Flowering Plants",
        "Anatomy of Flowering Plants",
        "Structural Organisation in Animals",
        "Cell: The Unit of Life",
        "Biomolecules",
        "Cell Cycle and Cell Division",
        "Transport in Plants",
        "Mineral Nutrition",
        "Photosynthesis in Higher Plants",
        "Respiration in Plants",
        "Plant Growth and Development",
        "Digestion and Absorption",
        "Breathing and Exchange of Gases",
        "Body Fluids and Circulation",
        "Excretory Products and Elimination",
        "Locomotion and Movement",
        "Neural Control and Coordination",
        "Chemical Coordination and Integration"
    ]
};

async function countQuestions() {
    console.log("Starting question count for Class 11th...\n");
    const results = [];

    for (const [subject, chapters] of Object.entries(class11Chapters)) {
        console.log(`Processing ${subject}...`);
        for (const chapter of chapters) {
            const snapshot = await db.collection('engine_questions')
                .where('subject', '==', subject)
                .where('chapter', '==', chapter)
                .count()
                .get();
            
            const count = snapshot.data().count;
            results.push({ subject, chapter, count });
        }
    }

    console.log("\n--- Results ---\n");
    console.table(results);
    
    fs.writeFileSync('c:/Users/Admin/Downloads/Desktop/scripts/question_counts_class11.json', JSON.stringify(results, null, 2));
    console.log("\nResults saved to question_counts_class11.json");
}

countQuestions().catch(console.error);
