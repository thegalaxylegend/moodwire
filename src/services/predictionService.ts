// predictionService.ts
// Sophisticated score prediction algorithm provided by DeepSeek (The Logic Specialist)
// Enhanced heavily with Claude 2024/2025 Realistic Bracket interpolation

export type ExamType = "jee_mains" | "neet" | "jee_advanced" | string;

export interface ExamConstants {
    MAX_SCORE: number;
    MIN_SCORE: number;
    CANDIDATES: number;
    VOLATILITY: number;
    GROWTH: number;
}

export type StudentProfile = {
    currentMockScore: number;
    topicStrength: number; // 0 to 1
    examType: ExamType;
    monthsUntilExam?: number; // Default: 6 months
    consistencyFactor?: number; // 0 to 1, default: 0.7
};

export interface RankResult {
    rank: number;
    percentile: number;
    rankRange: {
        optimistic: number;
        pessimistic: number;
    };
    qualificationStatus: string;
    caveat?: string;
}

export type PredictionResult = {
    predictedScore: number;
    predictedPercentile: number;
    predictedRank: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    rawScore: number;
    qualificationStatus: string;
    caveat?: string;
    rankRange: {
        optimistic: number;
        pessimistic: number;
    };
    collegeFitment?: CollegeFitResult[];
};

export interface CollegeFitResult {
    institution: string;
    branch: string;
    probability: number; // 0 to 1
    requiredRank: number;
    status: 'Safe' | 'Probable' | 'Dream' | 'Reach';
}

export const getExamConstants = (examType: string): ExamConstants => {
    switch (resolveExam(examType)) {
        case "jee_mains": return { MAX_SCORE: 300, MIN_SCORE: -75, CANDIDATES: 1_400_000, VOLATILITY: 0.15, GROWTH: 0.12 };
        case "neet": return { MAX_SCORE: 720, MIN_SCORE: -180, CANDIDATES: 2_500_000, VOLATILITY: 0.08, GROWTH: 0.10 };
        case "jee_advanced": return { MAX_SCORE: 360, MIN_SCORE: -120, CANDIDATES: 180_000, VOLATILITY: 0.20, GROWTH: 0.15 };

        default: return { MAX_SCORE: 100, MIN_SCORE: 0, CANDIDATES: 1_000_000, VOLATILITY: 0.10, GROWTH: 0.10 };
    }
};

function resolveExam(examType: string): string {
    const t = examType.toLowerCase().replace(/[\s_-]+/g, "_");
    if (t.includes("advanced")) return "jee_advanced";
    if (t.includes("mains") || (t.includes("jee") && !t.includes("advanced"))) return "jee_mains";
    if (t.includes("neet") || t.includes("medical")) return "neet";

    return "unknown";
}

type Bracket = readonly [number, number];

const JEE_MAINS_BRACKETS: readonly Bracket[] = [
    [300, 2], [298, 10], [295, 25], [292, 60], [290, 110], [288, 180], [285, 300], [283, 450],
    [280, 650], [278, 900], [275, 1200], [272, 1600], [270, 2100], [268, 2700], [265, 3500],
    [262, 4500], [260, 5600], [257, 7000], [255, 8700], [252, 10500], [250, 12500], [247, 15000],
    [245, 18000], [242, 22000], [240, 26000], [237, 31000], [235, 37000], [232, 44000], [230, 52000],
    [225, 65000], [220, 80000], [215, 97000], [210, 116000], [205, 138000], [200, 162000],
    [195, 188000], [190, 216000], [185, 246000], [180, 278000], [175, 312000], [170, 348000],
    [165, 386000], [160, 425000], [155, 466000], [150, 509000], [145, 553000], [140, 598000],
    [135, 643000], [130, 689000], [120, 775000], [110, 853000], [100, 921000], [90, 972000],
    [80, 1010000], [70, 1040000], [60, 1060000], [50, 1080000], [0, 1140000],
];

const NEET_BRACKETS: readonly Bracket[] = [
    [720, 35], [719, 68], [718, 82], [717, 100], [716, 112], [715, 130], [714, 155], [713, 185],
    [712, 220], [711, 265], [710, 315], [709, 375], [708, 440], [707, 515], [706, 600], [705, 695],
    [704, 800], [703, 915], [702, 1040], [701, 1175], [700, 1320], [698, 1600], [695, 2000],
    [692, 2500], [690, 3000], [687, 3600], [685, 4200], [682, 5000], [680, 5900], [677, 7000],
    [675, 8200], [672, 9700], [670, 11300], [667, 13200], [665, 15300], [662, 17700], [660, 20400],
    [657, 23500], [655, 27000], [652, 31000], [650, 35500], [648, 40000], [645, 45000], [642, 50500],
    [640, 56000], [637, 62000], [635, 68500], [632, 75500], [630, 83000], [627, 91000], [625, 99500],
    [622, 108500], [620, 118000], [615, 132000], [610, 148000], [605, 165000], [600, 184000],
    [595, 205000], [590, 228000], [585, 252000], [580, 278000], [575, 305000], [570, 334000],
    [565, 364000], [560, 396000], [555, 429000], [550, 463000], [540, 534000], [530, 607000],
    [520, 682000], [510, 758000], [500, 836000], [490, 915000], [480, 994000], [470, 1073000],
    [460, 1151000], [450, 1228000], [440, 1302000], [430, 1373000], [420, 1441000], [410, 1505000],
    [400, 1564000], [390, 1618000], [380, 1667000], [370, 1710000], [360, 1748000], [340, 1850000],
    [300, 2050000], [0, 2500000],
];

const JEE_ADVANCED_BRACKETS: readonly Bracket[] = [
    [355, 1], [345, 5], [335, 20], [325, 50], [315, 100], [308, 150], [300, 220], [292, 310],
    [285, 420], [278, 560], [272, 720], [265, 920], [260, 1100], [255, 1320], [250, 1600],
    [245, 1950], [240, 2360], [235, 2850], [230, 3450], [225, 4150], [220, 5000], [215, 6000],
    [210, 7200], [205, 8600], [200, 10200], [195, 12000], [190, 14000], [185, 16300], [180, 18900],
    [175, 21800], [170, 25000], [165, 28500], [160, 32300], [155, 36400], [150, 40800], [145, 45400],
    [140, 47000], [136, 48000], [126, 48248], [0, 48248],
];



const BRACKET_MAP: Record<string, readonly Bracket[]> = {
    jee_mains: JEE_MAINS_BRACKETS,
    neet: NEET_BRACKETS,
    jee_advanced: JEE_ADVANCED_BRACKETS,

};

function interpolateRank(score: number, brackets: readonly Bracket[]): number {
    if (score >= brackets[0][0]) return brackets[0][1];
    if (score <= brackets[brackets.length - 1][0]) {
        return brackets[brackets.length - 1][1];
    }
    for (let i = 0; i < brackets.length - 1; i++) {
        const [hiScore, hiRank] = brackets[i];
        const [loScore, loRank] = brackets[i + 1];

        if (score <= hiScore && score >= loScore) {
            const t = (hiScore - score) / (hiScore - loScore);
            if (hiRank === loRank) return hiRank;
            const logRank = Math.log(hiRank) * (1 - t) + Math.log(loRank) * t;
            return Math.round(Math.exp(logRank));
        }
        return { 
            inst: "General Admission", 
            branch: "Other Branches", 
            rank: 100000 
        };
    }
    return brackets[brackets.length - 1][1];
}

function getRankBand(rank: number, score: number, exam: string): { optimistic: number; pessimistic: number } {
    let spread: number;
    switch (exam) {
        case "jee_mains": spread = score >= 280 ? 0.35 : score >= 200 ? 0.22 : 0.17; break;
        case "neet": spread = score >= 715 ? 0.60 : score >= 680 ? 0.20 : score >= 550 ? 0.15 : 0.12; break;
        case "jee_advanced": spread = score >= 300 ? 0.25 : score >= 200 ? 0.18 : 0.15; break;

        default: spread = 0.20;
    }
    return {
        optimistic: Math.max(1, Math.round(rank * (1 - spread))),
        pessimistic: Math.round(rank * (1 + spread)),
    };
}

function qualificationLabel(rank: number, exam: string, score: number): string {
    switch (exam) {
        case "jee_mains":
            if (rank <= 100) return "🏆 Top IITs — CS/EE at IIT Bombay/Delhi/Madras likely";
            if (rank <= 500) return "🥇 Top IITs — all branches accessible";
            if (rank <= 2500) return "🎯 IIT admission highly probable (various branches)";
            if (rank <= 10000) return "✅ Top NITs — CS/ECE/EEE very likely";
            if (rank <= 25000) return "👍 Top NITs (various branches) + IIITs";
            if (rank <= 60000) return "📘 Mid-tier NITs + good IIITs/GFTIs";
            if (rank <= 150000) return "📗 Lower NITs + private colleges";
            if (rank <= 400000) return "📙 Below NIT cutoff — state/private options";
            return "⚠️  Below qualifying bracket for NITs";

        case "neet":
            if (rank <= 57) return "🏆 AIIMS New Delhi (closes ~AIR 50–57)";
            if (rank <= 200) return "🥇 Top AIIMS campuses (Jodhpur, Bhopal, Mangalagiri…)";
            if (rank <= 1000) return "🎯 JIPMER + top government medical colleges";
            if (rank <= 5000) return "✅ Government MBBS — AIQ seats likely";
            if (rank <= 15000) return "👍 Government MBBS (AIQ + state quota)";
            if (rank <= 50000) return "📘 Government MBBS (state quota feasible)";
            if (rank <= 100000) return "📗 Government BDS / Private MBBS territory";
            if (rank <= 300000) return "📙 Private medical college options";
            if (score >= 360) return "⚠️  Qualified — below government seat cut-off";
            return "❌ Below NEET qualifying threshold (~360 general)";

        case "jee_advanced":
            if (score < 126) return "❌ Below minimum qualifying marks (35% aggregate required)";
            if (rank <= 100) return "🏆 IIT Bombay/Delhi CS — top choice accessible";
            if (rank <= 500) return "🥇 Top IITs — CS/EE at premier IITs";
            if (rank <= 1500) return "🎯 Top IITs — all branches except CS at IIT Bombay/Delhi";
            if (rank <= 5000) return "✅ Mid-tier IITs — strong branch options";
            if (rank <= 15000) return "👍 Lower IITs — various branches";
            if (rank <= 35000) return "📘 IIT admission on IIT BHU / lower IITs";
            if (rank <= 48248) return "📗 Qualified — IIT admission marginal";
            return "⚠️  Qualified but no IIT seat likely";


            return "—";
        default:
            return "—";
    }
}

/**
 * Historical 2024 Admission Data (Approximate AIR Closings - General/Open)
 */
const COLLEGE_ADMISSION_DATA: Record<string, Array<{ inst: string; branch: string; rank: number }>> = {
    jee_advanced: [
        { inst: "IIT Bombay", branch: "Computer Science", rank: 68 },
        { inst: "IIT Bombay", branch: "Electrical Engineering", rank: 480 },
        { inst: "IIT Delhi", branch: "Computer Science", rank: 115 },
        { inst: "IIT Madras", branch: "Computer Science", rank: 150 },
        { inst: "IIT Kanpur", branch: "Computer Science", rank: 250 },
        { inst: "IIT Kharagpur", branch: "Computer Science", rank: 400 },
        { inst: "IIT Roorkee", branch: "Computer Science", rank: 500 },
        { inst: "IIT Guwahati", branch: "Computer Science", rank: 650 },
        { inst: "IIT Hyderabad", branch: "Computer Science", rank: 700 }
    ],
    jee_mains: [
        { inst: "NIT Trichy", branch: "Computer Science", rank: 1500 },
        { inst: "NIT Surathkal", branch: "Computer Science", rank: 2500 },
        { inst: "NIT Warangal", branch: "Computer Science", rank: 3200 },
        { inst: "MNNIT Allahabad", branch: "Computer Science", rank: 5000 },
        { inst: "IIIT Hyderabad", branch: "Computer Science", rank: 2200 },
        { inst: "IIIT Bangalore", branch: "Computer Science", rank: 7500 },
        { inst: "DTU Delhi", branch: "Computer Science", rank: 12000 },
        { inst: "NSUT Delhi", branch: "Computer Science", rank: 15000 }
    ],
    neet: [
        { inst: "AIIMS New Delhi", branch: "MBBS", rank: 57 },
        { inst: "MAMC Delhi", branch: "MBBS", rank: 120 },
        { inst: "VMMC Delhi", branch: "MBBS", rank: 150 },
        { inst: "AIIMS Jodhpur", branch: "MBBS", rank: 500 },
        { inst: "AIIMS Bhopal", branch: "MBBS", rank: 600 },
        { inst: "JIPMER Puducherry", branch: "MBBS", rank: 300 },
        { inst: "KGMU Lucknow", branch: "MBBS", rank: 2000 }
    ]
};

function getCaveat(_score: number, _exam: string): string | undefined {
    return undefined;
}

export class PredictionService {
    predictRank(profile: StudentProfile): PredictionResult {
        const { examType, currentMockScore, topicStrength, monthsUntilExam = 6, consistencyFactor = 0.7 } = profile;
        const constants = getExamConstants(examType);

        // Limit mock score to MAX_SCORE
        const validScore = Math.max(constants.MIN_SCORE, Math.min(currentMockScore, constants.MAX_SCORE));

        // Step 1: Apply normalization bias
        const normalizedScore = this.applyNormalizationBias(validScore, constants);

        // Step 2: Calculate growth projection
        const projectedScore = this.calculateGrowthProjection(
            normalizedScore,
            topicStrength,
            consistencyFactor,
            monthsUntilExam,
            constants
        );

        // Step 3: Map score to percentile/rank
        const rankResult = this.scoreToRank(projectedScore, examType, constants);

        // Step 4: Calculate confidence interval
        const confidenceInterval = this.calculateConfidenceInterval(
            projectedScore,
            topicStrength,
            consistencyFactor,
            constants
        );

        return {
            predictedScore: Math.round(projectedScore * 100) / 100,
            predictedPercentile: rankResult.percentile,
            predictedRank: rankResult.rank,
            confidenceInterval: {
                lower: Math.round(confidenceInterval.lower * 100) / 100,
                upper: Math.round(confidenceInterval.upper * 100) / 100,
            },
            rawScore: validScore,
            qualificationStatus: rankResult.qualificationStatus,
            caveat: rankResult.caveat,
            rankRange: rankResult.rankRange,
            collegeFitment: this.calculateCollegeFitment(rankResult.rank, examType)
        };
    }

    private calculateCollegeFitment(rank: number, examType: string): CollegeFitResult[] {
        const exam = resolveExam(examType);
        const refData = COLLEGE_ADMISSION_DATA[exam];
        if (!refData) return [];

        return refData.map(item => {
            let probability = 0;
            let status: CollegeFitResult['status'] = 'Reach';

            if (rank <= item.rank * 0.8) {
                probability = 0.95;
                status = 'Safe';
            } else if (rank <= item.rank) {
                probability = 0.75;
                status = 'Probable';
            } else if (rank <= item.rank * 1.3) {
                probability = 0.40;
                status = 'Dream';
            } else {
                probability = 0.10;
                status = 'Reach';
            }

            return {
                institution: item.inst,
                branch: item.branch,
                probability,
                requiredRank: item.rank,
                status
            };
        }).sort((a, b) => b.probability - a.probability).slice(0, 5);
    }

    private applyNormalizationBias(score: number, constants: ExamConstants): number {
        // Bypass normalization for top 5% scores to avoid unfair rank suppression
        if (score >= constants.MAX_SCORE * 0.95) return score;

        const difficultyFactor = score > constants.MAX_SCORE * 0.8 ? 1.01 : 1.05;
        const normalizedScore = score * (1 / difficultyFactor);
        return Math.min(normalizedScore, constants.MAX_SCORE);
    }

    private calculateGrowthProjection(
        currentScore: number,
        topicStrength: number,
        consistency: number,
        months: number,
        constants: ExamConstants
    ): number {
        const learningCurve = 1 - Math.exp(-topicStrength * 3);
        const effectiveGrowthRate = constants.GROWTH * consistency * learningCurve;
        const growthFactor = Math.pow(1 + effectiveGrowthRate, months);
        const maxAchievable = constants.MAX_SCORE * (0.7 + 0.3 * topicStrength);
        const gap = Math.max(0, maxAchievable - currentScore);
        const projectedScore = currentScore + (gap * (1 - 1 / growthFactor));
        return Math.min(Math.max(projectedScore, currentScore), constants.MAX_SCORE);
    }

    private calculateConfidenceInterval(
        score: number,
        topicStrength: number,
        consistency: number,
        constants: ExamConstants
    ): { lower: number; upper: number } {
        const uncertainty = constants.VOLATILITY * (1.5 - topicStrength) * (2 - consistency);
        return {
            lower: Math.max(constants.MIN_SCORE, score * (1 - uncertainty * 0.8)),
            upper: Math.min(constants.MAX_SCORE, score * (1 + uncertainty * 0.5)),
        };
    }

    public scoreToRank(
        score: number,
        examType: string,
        constants?: ExamConstants
    ): { percentile: number; rank: number } & Omit<RankResult, "rank" | "percentile"> {
        const exam = resolveExam(examType);
        const c = constants ?? getExamConstants(examType);

        const clampedScore = Math.max(c.MIN_SCORE, Math.min(score, c.MAX_SCORE));
        const brackets: readonly Bracket[] = exam !== "unknown" && BRACKET_MAP[exam]
            ? BRACKET_MAP[exam]
            : [[c.MAX_SCORE, 1] as Bracket, [0, c.CANDIDATES] as Bracket];

        const rawRank = interpolateRank(clampedScore, brackets);
        const rank = Math.max(1, Math.min(rawRank, c.CANDIDATES));

        const percentile = parseFloat(
            Math.max(0, Math.min(100, ((c.CANDIDATES - rank) / c.CANDIDATES) * 100)).toFixed(4)
        );

        const rankRange = exam !== "unknown"
            ? getRankBand(rank, clampedScore, exam)
            : { optimistic: Math.max(1, rank - Math.round(rank * 0.15)), pessimistic: rank + Math.round(rank * 0.15) };

        const qualificationStatus = exam !== "unknown"
            ? qualificationLabel(rank, exam, clampedScore)
            : `Rank ~${rank.toLocaleString("en-IN")}`;

        const caveat = exam !== "unknown" ? getCaveat(clampedScore, exam) : undefined;

        return {
            rank,
            percentile,
            rankRange,
            qualificationStatus,
            ...(caveat ? { caveat } : {}),
        };
    }
}

export const predictionService = new PredictionService();
