import { askAI } from '../lib/ai';
import { extractJSON } from '../lib/utils';


export interface CheatSheetContent {
    topic: string;
    summary: string;
    keyPoints: string[];
    formulas: { name: string; formula: string }[];
    viralTips: string[];
}

export const generateCheatSheetContent = async (topic: string, subject: string): Promise<CheatSheetContent | null> => {
    const prompt = `
        You are a Top-Tier Educator preparing a "Viral Revision Cheat Sheet" for ${topic} in ${subject}.
        The goal is to provide maximum value in minimum time ($100 chapter value in 1 page).
        
        Requirements:
        1. Summary: Exactly 2 impactful sentences summarizing the core concept.
        2. High-Yield Points: 5-7 "Must-Know" points that frequently appear in exams like JEE/NEET/UPSC.
        3. Formulas/Definitions: List the 4 most critical formulas or definitions with their names.
        4. Viral Pro-Tips: 3 expert shortcuts, mnemonics, or common traps to avoid.
        
        Format as JSON:
        {
          "topic": "${topic}",
          "summary": "...",
          "keyPoints": ["...", "..."],
          "formulas": [{"name": "...", "formula": "..."}],
          "viralTips": ["...", "..."]
        }
    `;

    try {
        const response = await askAI("Master Mentor", prompt, 'groq');
        if (response) {
            return extractJSON(response) as CheatSheetContent;
        }
    } catch (e) {
        console.error("Cheat sheet generation failed", e);
    }
    return null;
};

export const downloadCheatSheetPDF = async (content: CheatSheetContent) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Aesthetics: Background Gradient / Border
    doc.setDrawColor(100, 100, 255);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10); // Page Border

    // Header Block
    doc.setFillColor(30, 30, 50);
    doc.rect(5, 5, pageWidth - 10, 45, 'F');

    // Branding
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("EXAM COMPASS", 15, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 255);
    doc.text("VIRAL REVISION SERIES • RANK #1 PREPARATION", 15, 32);

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(content.topic.toUpperCase(), 15, 43);

    // Accent Line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.line(15, 46, 60, 46);

    // --- Content Section ---
    let currentY = 65;

    // 2. Summary Section
    doc.setTextColor(30, 30, 50);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CORE CONCEPT SUMMARY", 15, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const summaryLines = doc.splitTextToSize(content.summary, pageWidth - 30);
    doc.text(summaryLines, 15, currentY);
    currentY += (summaryLines.length * 6) + 10;

    // 3. High-Yield Points
    doc.setFillColor(245, 245, 255);
    doc.rect(10, currentY - 6, pageWidth - 20, 8, 'F');
    doc.setTextColor(30, 30, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("HIGH-YIELD REVISION POINTS", 15, currentY);
    currentY += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    content.keyPoints.forEach(point => {
        const pLines = doc.splitTextToSize(`• ${point}`, pageWidth - 35);
        doc.text(pLines, 20, currentY);
        currentY += (pLines.length * 6);
    });
    currentY += 10;

    // 4. Formulas Table
    if (content.formulas && content.formulas.length > 0) {
        autoTable(doc, {
            startY: currentY,
            head: [['Critical Concept / Formula', 'Details']],
            body: content.formulas.map(f => [f.name, f.formula]),
            theme: 'grid',
            headStyles: { fillColor: [100, 100, 255], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            margin: { left: 15, right: 15 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 5. Success Tips (Pro Hacks)
    doc.setFillColor(255, 245, 245);
    doc.rect(10, currentY - 6, pageWidth - 20, 8, 'F');
    doc.setTextColor(220, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("EXPERT HACKS & VIRAL TIPS 🚀", 15, currentY);
    currentY += 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    content.viralTips.forEach(tip => {
        const tLines = doc.splitTextToSize(`★ ${tip}`, pageWidth - 35);
        doc.text(tLines, 20, currentY);
        currentY += (tLines.length * 6);
    });

    // 6. Footer Layout
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
    doc.text("Exam-Compass Viral Revision Engine | Track your progress at exam-compass.com", pageWidth / 2, footerY, { align: 'center' });

    // Save
    doc.save(`${content.topic.replace(/\s+/g, '_')}_Viral_CheatSheet.pdf`);
};
