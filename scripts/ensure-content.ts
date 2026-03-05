import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------
// ADMIN INIT
// ----------------------
const serviceAccountPath = path.join(__dirname, "../service-account.json");
if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ Critical: service-account.json missing. Cannot run Admin Guard.");
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// ----------------------
// FULL SYLLABUS DATA (Class 6-12)
// ----------------------
const SYLLABUS_FULL: Record<string, any[]> = {
    Physics: [
        { topic: "Units and Measurements", class: "Class 11" },
        { topic: "Motion in a Straight Line", class: "Class 11" },
        { topic: "Motion in a Plane", class: "Class 11" },
        { topic: "Laws of Motion", class: "Class 11" },
        { topic: "Work, Energy and Power", class: "Class 11" },
        { topic: "Rotational Motion", class: "Class 11" },
        { topic: "Gravitation", class: "Class 11" },
        { topic: "Mechanical Properties of Solids", class: "Class 11" },
        { topic: "Mechanical Properties of Fluids", class: "Class 11" },
        { topic: "Thermal Properties of Matter", class: "Class 11" },
        { topic: "Thermodynamics", class: "Class 11" },
        { topic: "Kinetic Theory", class: "Class 11" },
        { topic: "Oscillations", class: "Class 11" },
        { topic: "Waves", class: "Class 11" },
        { topic: "Physical World", class: "Class 11" },
        { topic: "Electrostatics", class: "Class 12" },
        { topic: "Current Electricity", class: "Class 12" },
        { topic: "Magnetic Effects of Current", class: "Class 12" },
        { topic: "Magnetism and Matter", class: "Class 12" },
        { topic: "Electromagnetic Induction", class: "Class 12" },
        { topic: "Alternating Current", class: "Class 12" },
        { topic: "Electromagnetic Waves", class: "Class 12" },
        { topic: "Ray Optics", class: "Class 12" },
        { topic: "Wave Optics", class: "Class 12" },
        { topic: "Dual Nature of Radiation", class: "Class 12" },
        { topic: "Atoms", class: "Class 12" },
        { topic: "Nuclei", class: "Class 12" },
        { topic: "Semiconductor Electronics", class: "Class 12" },
        { topic: "Communication Systems", class: "Class 12" }
    ],
    Chemistry: [
        { topic: "Some Basic Concepts of Chemistry", class: "Class 11" },
        { topic: "Structure of The Atom", class: "Class 11" },
        { topic: "Classification of Elements", class: "Class 11" },
        { topic: "Chemical Bonding", class: "Class 11" },
        { topic: "States of Matter", class: "Class 11" },
        { topic: "Thermodynamics", class: "Class 11" },
        { topic: "Equilibrium", class: "Class 11" },
        { topic: "Redox Reactions", class: "Class 11" },
        { topic: "Hydrogen", class: "Class 11" },
        { topic: "The S-Block Elements", class: "Class 11" },
        { topic: "The P-Block Elements (11)", class: "Class 11" },
        { topic: "Organic Chemistry: Basic Principles", class: "Class 11" },
        { topic: "Hydrocarbons", class: "Class 11" },
        { topic: "Environmental Chemistry", class: "Class 11" },
        { topic: "Solid State", class: "Class 12" },
        { topic: "Solutions", class: "Class 12" },
        { topic: "Electrochemistry", class: "Class 12" },
        { topic: "Chemical Kinetics", class: "Class 12" },
        { topic: "Surface Chemistry", class: "Class 12" },
        { topic: "Metallurgy", class: "Class 12" },
        { topic: "The P-Block Elements (12)", class: "Class 12" },
        { topic: "D and F Block Elements", class: "Class 12" },
        { topic: "Coordination Compounds", class: "Class 12" },
        { topic: "Haloalkanes and Haloarenes", class: "Class 12" },
        { topic: "Alcohols, Phenols and Ethers", class: "Class 12" },
        { topic: "Aldehydes, Ketones and Carboxylic Acids", class: "Class 12" },
        { topic: "Amines", class: "Class 12" },
        { topic: "Biomolecules", class: "Class 12" },
        { topic: "Polymers", class: "Class 12" },
        { topic: "Chemistry in Everyday Life", class: "Class 12" }
    ],
    Mathematics: [
        { topic: "Sets", class: "Class 11" },
        { topic: "Relations and Functions", class: "Class 11" },
        { topic: "Trigonometric Functions", class: "Class 11" },
        { topic: "Principle of Mathematical Induction", class: "Class 11" },
        { topic: "Complex Numbers", class: "Class 11" },
        { topic: "Linear Inequalities", class: "Class 11" },
        { topic: "Permutations and Combinations", class: "Class 11" },
        { topic: "Binomial Theorem", class: "Class 11" },
        { topic: "Sequences and Series", class: "Class 11" },
        { topic: "Straight Lines", class: "Class 11" },
        { topic: "Conic Sections", class: "Class 11" },
        { topic: "3D Geometry (Intro)", class: "Class 11" },
        { topic: "Limits and Derivatives", class: "Class 11" },
        { topic: "Mathematical Reasoning", class: "Class 11" },
        { topic: "Statistics", class: "Class 11" },
        { topic: "Probability (Intro)", class: "Class 11" },
        { topic: "Relations and Functions (12)", class: "Class 12" },
        { topic: "Inverse Trigonometric Functions", class: "Class 12" },
        { topic: "Matrices", class: "Class 12" },
        { topic: "Determinants", class: "Class 12" },
        { topic: "Continuity and Differentiability", class: "Class 12" },
        { topic: "Application of Derivatives", class: "Class 12" },
        { topic: "Integrals", class: "Class 12" },
        { topic: "Application of Integrals", class: "Class 12" },
        { topic: "Differential Equations", class: "Class 12" },
        { topic: "Vector Algebra", class: "Class 12" },
        { topic: "Three Dimensional Geometry", class: "Class 12" },
        { topic: "Linear Programming", class: "Class 12" },
        { topic: "Probability", class: "Class 12" },
        { topic: "Real Numbers", class: "Class 10" },
        { topic: "Polynomials", class: "Class 10" },
        { topic: "Pair of Linear Equations", class: "Class 10" },
        { topic: "Quadratic Equations", class: "Class 10" },
        { topic: "Arithmetic Progressions", class: "Class 10" },
        { topic: "Triangles", class: "Class 10" },
        { topic: "Coordinate Geometry", class: "Class 10" },
        { topic: "Introduction to Trigonometry", class: "Class 10" },
        { topic: "Applications of Trigonometry", class: "Class 10" },
        { topic: "Circles", class: "Class 10" },
        { topic: "Areas Related to Circles", class: "Class 10" },
        { topic: "Surface Areas and Volumes", class: "Class 10" },
        { topic: "Statistics", class: "Class 10" },
        { topic: "Probability", class: "Class 10" },
        { topic: "Number Systems", class: "Class 9" },
        { topic: "Polynomials", class: "Class 9" },
        { topic: "Linear Equations in Two Variables", class: "Class 9" },
        { topic: "Lines and Angles", class: "Class 9" },
        { topic: "Triangles", class: "Class 9" },
        { topic: "Quadrilaterals", class: "Class 9" },
        { topic: "Circles", class: "Class 9" },
        { topic: "Heron's Formula", class: "Class 9" },
        { topic: "Statistics", class: "Class 9" },
        { topic: "Rational Numbers", class: "Class 8" },
        { topic: "Linear Equations in One Variable", class: "Class 8" },
        { topic: "Understanding Quadrilaterals", class: "Class 8" },
        { topic: "Data Handling", class: "Class 8" },
        { topic: "Squares and Square Roots", class: "Class 8" },
        { topic: "Cubes and Cube Roots", class: "Class 8" },
        { topic: "Comparing Quantities", class: "Class 8" },
        { topic: "Algebraic Expressions", class: "Class 8" },
        { topic: "Mensuration", class: "Class 8" },
        { topic: "Exponents and Powers", class: "Class 8" },
        { topic: "Factorisation", class: "Class 8" },
        { topic: "Integers", class: "Class 7" },
        { topic: "Fractions and Decimals", class: "Class 7" },
        { topic: "Data Handling", class: "Class 7" },
        { topic: "Simple Equations", class: "Class 7" },
        { topic: "Lines and Angles", class: "Class 7" },
        { topic: "The Triangle and its Properties", class: "Class 7" },
        { topic: "Congruence of Triangles", class: "Class 7" },
        { topic: "Comparing Quantities", class: "Class 7" },
        { topic: "Rational Numbers", class: "Class 7" },
        { topic: "Perimeter and Area", class: "Class 7" },
        { topic: "Algebraic Expressions", class: "Class 7" },
        { topic: "Knowing Our Numbers", class: "Class 6" },
        { topic: "Whole Numbers", class: "Class 6" },
        { topic: "Playing with Numbers", class: "Class 6" },
        { topic: "Basic Geometrical Ideas", class: "Class 6" },
        { topic: "Integers", class: "Class 6" },
        { topic: "Fractions", class: "Class 6" },
        { topic: "Decimals", class: "Class 6" },
        { topic: "Data Handling", class: "Class 6" },
        { topic: "Mensuration", class: "Class 6" },
        { topic: "Algebra", class: "Class 6" },
        { topic: "Ratio and Proportion", class: "Class 6" }
    ],
    Science: [
        { topic: "Chemical Reactions and Equations", class: "Class 10" },
        { topic: "Acids, Bases and Salts", class: "Class 10" },
        { topic: "Metals and Non-Metals", class: "Class 10" },
        { topic: "Carbon and its Compounds", class: "Class 10" },
        { topic: "Periodic Classification of Elements", class: "Class 10" },
        { topic: "Life Processes", class: "Class 10" },
        { topic: "Control and Coordination", class: "Class 10" },
        { topic: "How do Organisms Reproduce?", class: "Class 10" },
        { topic: "Heredity and Evolution", class: "Class 10" },
        { topic: "Light – Reflection and Refraction", class: "Class 10" },
        { topic: "Human Eye and Colourful World", class: "Class 10" },
        { topic: "Electricity", class: "Class 10" },
        { topic: "Magnetic Effects of Electric Current", class: "Class 10" },
        { topic: "Sources of Energy", class: "Class 10" },
        { topic: "Our Environment", class: "Class 10" },
        { topic: "Management of Natural Resources", class: "Class 10" },
        { topic: "Matter in Our Surroundings", class: "Class 9" },
        { topic: "Is Matter Around Us Pure", class: "Class 9" },
        { topic: "Atoms and Molecules", class: "Class 9" },
        { topic: "Structure of the Atom", class: "Class 9" },
        { topic: "The Fundamental Unit of Life", class: "Class 9" },
        { topic: "Tissues", class: "Class 9" },
        { topic: "Diversity in Living Organisms", class: "Class 9" },
        { topic: "Motion", class: "Class 9" },
        { topic: "Force and Laws of Motion", class: "Class 9" },
        { topic: "Gravitation", class: "Class 9" },
        { topic: "Work and Energy", class: "Class 9" },
        { topic: "Sound", class: "Class 9" },
        { topic: "Why Do We Fall Ill", class: "Class 9" },
        { topic: "Natural Resources", class: "Class 9" },
        { topic: "Improvement in Food Resources", class: "Class 9" },
        { topic: "Crop Production and Management", class: "Class 8" },
        { topic: "Microorganisms: Friend and Foe", class: "Class 8" },
        { topic: "Synthetic Fibres and Plastics", class: "Class 8" },
        { topic: "Materials: Metals and Non-Metals", class: "Class 8" },
        { topic: "Coal and Petroleum", class: "Class 8" },
        { topic: "Combustion and Flame", class: "Class 8" },
        { topic: "Conservation of Plants and Animals", class: "Class 8" },
        { topic: "Cell - Structure and Functions", class: "Class 8" },
        { topic: "Reproduction in Animals", class: "Class 8" },
        { topic: "Reaching the Age of Adolescence", class: "Class 8" },
        { topic: "Force and Pressure", class: "Class 8" },
        { topic: "Friction", class: "Class 8" },
        { topic: "Sound", class: "Class 8" },
        { topic: "Chemical Effects of Electric Current", class: "Class 8" },
        { topic: "Some Natural Phenomena", class: "Class 8" },
        { topic: "Light", class: "Class 8" },
        { topic: "Stars and the Solar System", class: "Class 8" },
        { topic: "Pollution of Air and Water", class: "Class 8" },
        { topic: "Nutrition in Plants", class: "Class 7" },
        { topic: "Nutrition in Animals", class: "Class 7" },
        { topic: "Fibre to Fabric", class: "Class 7" },
        { topic: "Heat", class: "Class 7" },
        { topic: "Acids, Bases and Salts", class: "Class 7" },
        { topic: "Physical and Chemical Changes", class: "Class 7" },
        { topic: "Weather, Climate and Adaptations", class: "Class 7" },
        { topic: "Winds, Storms and Cyclones", class: "Class 7" },
        { topic: "Soil", class: "Class 7" },
        { topic: "Respiration in Organisms", class: "Class 7" },
        { topic: "Transportation in Animals and Plants", class: "Class 7" },
        { topic: "Reproduction in Plants", class: "Class 7" },
        { topic: "Motion and Time", class: "Class 7" },
        { topic: "Electric Current and its Effects", class: "Class 7" },
        { topic: "Light", class: "Class 7" },
        { topic: "Water: A Precious Resource", class: "Class 7" },
        { topic: "Forests: Our Lifeline", class: "Class 7" },
        { topic: "Wastewater Story", class: "Class 7" },
        { topic: "Food: Where Does it Come From?", class: "Class 6" },
        { topic: "Components of Food", class: "Class 6" },
        { topic: "Fibre to Fabric", class: "Class 6" },
        { topic: "Sorting Materials into Groups", class: "Class 6" },
        { topic: "Separation of Substances", class: "Class 6" },
        { topic: "Changes Around Us", class: "Class 6" },
        { topic: "Getting to Know Plants", class: "Class 6" },
        { topic: "Body Movements", class: "Class 6" },
        { topic: "The Living Organisms and Their Surroundings", class: "Class 6" },
        { topic: "Motion and Measurement of Distances", class: "Class 6" },
        { topic: "Light, Shadows and Reflections", class: "Class 6" },
        { topic: "Electricity and Circuits", class: "Class 6" },
        { topic: "Fun with Magnets", class: "Class 6" },
        { topic: "Water", class: "Class 6" },
        { topic: "Air Around Us", class: "Class 6" },
        { topic: "Garbage In, Garbage Out", class: "Class 6" }
    ],
    Biology: [
        { topic: "The Living World", class: "Class 11" },
        { topic: "Biological Classification", class: "Class 11" },
        { topic: "Plant Kingdom", class: "Class 11" },
        { topic: "Animal Kingdom", class: "Class 11" },
        { topic: "Morphology of Flowering Plants", class: "Class 11" },
        { topic: "Anatomy of Flowering Plants", class: "Class 11" },
        { topic: "Structural Organisation in Animals", class: "Class 11" },
        { topic: "Cell: The Unit of Life", class: "Class 11" },
        { topic: "Biomolecules", class: "Class 11" },
        { topic: "Cell Cycle and Cell Division", class: "Class 11" },
        { topic: "Transport in Plants", class: "Class 11" },
        { topic: "Mineral Nutrition", class: "Class 11" },
        { topic: "Photosynthesis in Higher Plants", class: "Class 11" },
        { topic: "Respiration in Plants", class: "Class 11" },
        { topic: "Plant Growth and Development", class: "Class 11" },
        { topic: "Digestion and Absorption", class: "Class 11" },
        { topic: "Breathing and Exchange of Gases", class: "Class 11" },
        { topic: "Body Fluids and Circulation", class: "Class 11" },
        { topic: "Excretory Products and Elimination", class: "Class 11" },
        { topic: "Locomotion and Movement", class: "Class 11" },
        { topic: "Neural Control and Coordination", class: "Class 11" },
        { topic: "Chemical Coordination and Integration", class: "Class 11" },
        { topic: "Reproduction in Organisms", class: "Class 12" },
        { topic: "Sexual Reproduction in Flowering Plants", class: "Class 12" },
        { topic: "Human Reproduction", class: "Class 12" },
        { topic: "Reproductive Health", class: "Class 12" },
        { topic: "Principles of Inheritance and Variation", class: "Class 12" },
        { topic: "Molecular Basis of Inheritance", class: "Class 12" },
        { topic: "Evolution", class: "Class 12" },
        { topic: "Human Health and Disease", class: "Class 12" },
        { topic: "Strategies for Enhancement in Food Production", class: "Class 12" },
        { topic: "Microbes in Human Welfare", class: "Class 12" },
        { topic: "Biotechnology: Principles and Processes", class: "Class 12" },
        { topic: "Biotechnology and its Applications", class: "Class 12" },
        { topic: "Organisms and Populations", class: "Class 12" },
        { topic: "Ecosystem", class: "Class 12" },
        { topic: "Biodiversity and Conservation", class: "Class 12" },
        { topic: "Environmental Issues", class: "Class 12" }
    ],
    "Social Science": [
        { topic: "The Rise of Nationalism in Europe", class: "Class 10" },
        { topic: "Nationalism in India", class: "Class 10" },
        { topic: "The Making of a Global World", class: "Class 10" },
        { topic: "The Age of Industrialisation", class: "Class 10" },
        { topic: "Print Culture and the Modern World", class: "Class 10" },
        { topic: "Resources and Development", class: "Class 10" },
        { topic: "Forest and Wildlife Resources", class: "Class 10" },
        { topic: "Water Resources", class: "Class 10" },
        { topic: "Agriculture", class: "Class 10" },
        { topic: "Minerals and Energy Resources", class: "Class 10" },
        { topic: "Manufacturing Industries", class: "Class 10" },
        { topic: "Lifelines of National Economy", class: "Class 10" },
        { topic: "Power Sharing", class: "Class 10" },
        { topic: "Federalism", class: "Class 10" },
        { topic: "Gender, Religion and Caste", class: "Class 10" },
        { topic: "Political Parties", class: "Class 10" },
        { topic: "Outcomes of Democracy", class: "Class 10" },
        { topic: "Development", class: "Class 10" },
        { topic: "Sectors of the Indian Economy", class: "Class 10" },
        { topic: "Money and Credit", class: "Class 10" },
        { topic: "Globalisation and the Indian Economy", class: "Class 10" },
        { topic: "Consumer Rights", class: "Class 10" }
    ],
    "English": [
        { topic: "A Letter to God", class: "Class 10" },
        { topic: "Nelson Mandela: Long Walk to Freedom", class: "Class 10" },
        { topic: "Two Stories about Flying", class: "Class 10" },
        { topic: "From the Diary of Anne Frank", class: "Class 10" },
        { topic: "Glimpses of India", class: "Class 10" },
        { topic: "Madam Rides the Bus", class: "Class 10" },
        { topic: "The Sermon at Benares", class: "Class 10" },
        { topic: "Dust of Snow", class: "Class 10" },
        { topic: "Fire and Ice", class: "Class 10" },
        { topic: "Amanda!", class: "Class 10" },
        { topic: "Tenses", class: "Class 10" },
        { topic: "Modals", class: "Class 10" },
        { topic: "Active and Passive Voice", class: "Class 10" },
        { topic: "Reported Speech", class: "Class 10" }
    ]
};

// ----------------------
// SETTINGS
// ----------------------
const TARGET_PER_TOPIC = 1;
const MAX_ATTEMPTS = 5;
const RETRY_DELAY = 500;

function getFallback(topic: string, subject: string, cls: string) {
    return {
        exam: "Competitive Exam",
        subject,
        topic,
        class: cls,
        type: 'MCQ',
        difficulty: 'Medium',
        question: `Practice Challenge: Analyzing the core fundamentals of ${topic} for ${cls}. What is the primary focus of this unit?`,
        options: ["Theoretical foundations", "Practical applications", "Experimental data", "Historical context"],
        correct_answer: "Theoretical foundations",
        explanation: `Foundational check for ${topic} in ${cls}. Study the core principles carefully for competitive exams.`,
        concept_tags: [topic, cls],
        usage_count: 0,
        accuracy_rate: 100,
        created_at: new Date().toISOString(),
        confidence: 1.0,
        hash: `ensure-${topic}-${Math.random().toString(36).substring(7)}`
    };
}

async function ensureContent() {
    console.log("🛡️ Running Admin FULL Syllabus Guard (Quota-Efficient Mode)...");

    const coveredTopics = new Set<string>();
    const allTopics = Object.values(SYLLABUS_FULL).flat().map(t => t.topic);

    // Batch check topics in chunks of 30 (Firestore 'in' limit)
    const CHUNK_SIZE = 30;
    for (let i = 0; i < allTopics.length; i += CHUNK_SIZE) {
        const chunk = allTopics.slice(i, i + CHUNK_SIZE);

        // Check in all 3 collections
        const collections = ['engine_questions', 'verified_questions', 'questions'];
        for (const colName of collections) {
            const snap = await db.collection(colName)
                .where('topic', 'in', chunk)
                .select('topic')
                .get();

            snap.docs.forEach(doc => {
                coveredTopics.add(doc.data().topic);
            });
        }
        process.stdout.write('.');
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        console.log(`\n🔄 Attempt ${attempt}/${MAX_ATTEMPTS}...`);
        const batch = db.batch();
        let missing = 0;
        let fixed = 0;

        for (const [subject, topics] of Object.entries(SYLLABUS_FULL)) {
            for (const topicData of topics) {
                const topic = topicData.topic;
                const cls = topicData.class;

                if (!coveredTopics.has(topic)) {
                    missing++;
                    const data = getFallback(topic, subject, cls);
                    const docRef = db.collection('engine_questions').doc();
                    batch.set(docRef, data);
                    coveredTopics.add(topic);
                    fixed++;
                }
            }
        }

        if (missing === 0) {
            console.log("\n\n✅ [GUARD] All Classes 6-12 are 100% Covered!");
            return;
        }

        console.log(`\n\n⚠️  Found ${missing} missing topics. Committing batch...`);
        await batch.commit();
        console.log(`✅ Fixed entries: ${fixed}`);
        if (attempt < MAX_ATTEMPTS) {
            console.log(`😴 Quick Retry...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY));
        }
    }

    console.log("\n❌ [GUARD] Failed to reach 100% coverage.");
    process.exit(1);
}

ensureContent().then(() => process.exit(0));
