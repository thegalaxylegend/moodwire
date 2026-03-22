export interface BlogPDFInput {
    title: string;
    category: string;
    date: string;
    markdown: string;
}

interface PDFSection {
    type: 'heading' | 'text' | 'bullet' | 'blockquote' | 'table-row';
    content: string;
    level?: number; // for headings: 2, 3, etc.
}

/** Parse markdown into structured sections for PDF rendering */
function parseMarkdownSections(md: string): PDFSection[] {
    const sections: PDFSection[] = [];
    const lines = md.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) continue;

        // Skip images, HTML tags, TOC anchor links, horizontal rules
        if (trimmed.startsWith('![') || trimmed.startsWith('<a id=') || trimmed.startsWith('<div') || trimmed.startsWith('</div') || trimmed === '---' || trimmed.startsWith('<!--')) continue;

        // Skip the quick-summary block content (it's within <div class="quick-summary">...</div>)
        if (trimmed.startsWith('**Quick Recall')) continue;

        // Table of Contents — skip lines that are just links
        if (/^\d+\.\s*\[.*\]\(#.*\)$/.test(trimmed)) continue;

        // Headings
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            let text = headingMatch[2];
            // Clean markdown formatting from heading text
            text = cleanMarkdown(text);
            if (text.length > 0) {
                sections.push({ type: 'heading', content: text, level });
            }
            continue;
        }

        // Blockquotes
        if (trimmed.startsWith('>')) {
            const quoteText = cleanMarkdown(trimmed.replace(/^>\s*/, '').replace(/^#{1,4}\s*/, ''));
            if (quoteText.length > 0) {
                sections.push({ type: 'blockquote', content: quoteText });
            }
            continue;
        }

        // Table rows
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            // Skip separator rows like |:---:|:---:|
            if (/^\|[\s:-]+\|/.test(trimmed) && !trimmed.match(/[a-zA-Z0-9]/)) continue;
            const cells = trimmed.split('|').filter(c => c.trim()).map(c => cleanMarkdown(c.trim()));
            if (cells.length > 0) {
                sections.push({ type: 'table-row', content: cells.join('  |  ') });
            }
            continue;
        }

        // Bullets
        if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
            const bulletText = cleanMarkdown(trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, ''));
            if (bulletText.length > 0) {
                sections.push({ type: 'bullet', content: bulletText });
            }
            continue;
        }

        // Regular text
        const cleaned = cleanMarkdown(trimmed);
        if (cleaned.length > 0) {
            sections.push({ type: 'text', content: cleaned });
        }
    }

    return sections;
}

/** Strip markdown syntax and LaTeX for clean PDF text */
function cleanMarkdown(text: string): string {
    return text
        // Strip LaTeX: $$...$$ and $...$
        .replace(/\$\$[\s\S]*?\$\$/g, '[formula]')
        .replace(/\$([^$]+)\$/g, '$1')
        // Strip LaTeX commands
        .replace(/\\(text|frac|sqrt|left|right|times|cdot|geq|leq|neq|approx|infty|sum|int|AA|rightarrow|Rightarrow)\b/g, '')
        .replace(/[{}]/g, '')
        // Bold/italic → keep text
        .replace(/\*{1,3}(.+?)\*{1,3}/g, '$1')
        .replace(/_{1,3}(.+?)_{1,3}/g, '$1')
        // Inline code
        .replace(/`([^`]+)`/g, '$1')
        // Links → keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();
}

export const downloadBlogPDF = async (input: BlogPDFInput) => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pw - margin * 2;
    const bottomLimit = ph - 25; // leave space for footer
    let y = 0;
    let pageNum = 1;

    // ─── Colors ───
    const purple = { r: 120, g: 80, b: 220 };
    const darkBg = { r: 20, g: 20, b: 35 };
    const darkText = { r: 30, g: 30, b: 50 };
    const grayText = { r: 70, g: 70, b: 70 };
    const lightGray = { r: 130, g: 130, b: 150 };

    // ─── Helpers ───
    const drawFooter = () => {
        doc.setDrawColor(200, 200, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, ph - 18, pw - margin, ph - 18);
        doc.setFontSize(7);
        doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
        doc.setFont("helvetica", "normal");
        doc.text(`examcompass.pages.dev  |  ${input.category}  |  Page ${pageNum}`, pw / 2, ph - 12, { align: 'center' });
    };

    const ensureSpace = (needed: number) => {
        if (y + needed > bottomLimit) {
            drawFooter();
            doc.addPage();
            pageNum++;
            y = 20;
        }
    };

    // ═══════════════════════════════════════════
    //  PAGE 1 — HEADER
    // ═══════════════════════════════════════════

    // Dark header block
    doc.setFillColor(darkBg.r, darkBg.g, darkBg.b);
    doc.rect(0, 0, pw, 58, 'F');

    // Purple accent bar at top
    doc.setFillColor(purple.r, purple.g, purple.b);
    doc.rect(0, 0, pw, 3, 'F');

    // Brand name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("EXAM COMPASS", margin, 20);

    // Subtitle
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 170, 255);
    doc.text("REVISION NOTES  •  examcompass.pages.dev", margin, 27);

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const titleLines = doc.splitTextToSize(input.title, contentWidth);
    doc.text(titleLines, margin, 40);

    // Category & date
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 170, 255);
    doc.text(`${input.category}  |  ${input.date}`, margin, 54);

    // Purple underline
    doc.setDrawColor(purple.r, purple.g, purple.b);
    doc.setLineWidth(1.5);
    doc.line(margin, 58, margin + 40, 58);

    y = 68;

    // ═══════════════════════════════════════════
    //  CONTENT SECTIONS
    // ═══════════════════════════════════════════

    const sections = parseMarkdownSections(input.markdown);

    for (const section of sections) {
        switch (section.type) {
            case 'heading': {
                const isH2 = (section.level || 2) <= 2;
                const fontSize = isH2 ? 14 : 11;
                const spacing = isH2 ? 14 : 10;

                ensureSpace(spacing + 10);

                if (isH2) {
                    // Purple accent line before H2
                    y += 4;
                    doc.setDrawColor(purple.r, purple.g, purple.b);
                    doc.setLineWidth(0.8);
                    doc.line(margin, y, margin + 30, y);
                    y += 8;
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(fontSize);
                doc.setTextColor(darkText.r, darkText.g, darkText.b);
                const headLines = doc.splitTextToSize(section.content, contentWidth);
                doc.text(headLines, margin, y);
                y += headLines.length * (fontSize * 0.45) + 6;
                break;
            }

            case 'text': {
                ensureSpace(12);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(grayText.r, grayText.g, grayText.b);
                const textLines = doc.splitTextToSize(section.content, contentWidth);
                for (const line of textLines) {
                    ensureSpace(6);
                    doc.text(line, margin, y);
                    y += 5;
                }
                y += 3;
                break;
            }

            case 'bullet': {
                ensureSpace(10);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9.5);
                doc.setTextColor(grayText.r, grayText.g, grayText.b);

                // Purple bullet dot
                doc.setFillColor(purple.r, purple.g, purple.b);
                doc.circle(margin + 2, y - 1.2, 1.2, 'F');

                const bulletLines = doc.splitTextToSize(section.content, contentWidth - 10);
                for (let i = 0; i < bulletLines.length; i++) {
                    ensureSpace(5.5);
                    doc.text(bulletLines[i], margin + 7, y);
                    y += 5;
                }
                y += 1.5;
                break;
            }

            case 'blockquote': {
                ensureSpace(16);

                // Light purple background box
                const bqLines = doc.splitTextToSize(section.content, contentWidth - 16);
                const boxHeight = bqLines.length * 5 + 8;
                ensureSpace(boxHeight + 4);

                doc.setFillColor(245, 240, 255);
                doc.roundedRect(margin, y - 4, contentWidth, boxHeight, 2, 2, 'F');

                // Purple left bar
                doc.setFillColor(purple.r, purple.g, purple.b);
                doc.rect(margin, y - 4, 2.5, boxHeight, 'F');

                doc.setFont("helvetica", "italic");
                doc.setFontSize(9);
                doc.setTextColor(80, 60, 120);
                for (const bLine of bqLines) {
                    doc.text(bLine, margin + 8, y + 2);
                    y += 5;
                }
                y += 6;
                break;
            }

            case 'table-row': {
                ensureSpace(8);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);
                doc.setTextColor(grayText.r, grayText.g, grayText.b);

                // Light bg for table rows
                doc.setFillColor(248, 248, 252);
                doc.rect(margin, y - 4, contentWidth, 6.5, 'F');
                doc.setDrawColor(220, 220, 230);
                doc.setLineWidth(0.2);
                doc.line(margin, y + 2.5, pw - margin, y + 2.5);

                const rowText = doc.splitTextToSize(section.content, contentWidth - 4);
                doc.text(rowText[0] || '', margin + 2, y);
                y += 7;
                break;
            }
        }
    }

    // Final page footer
    drawFooter();

    // ─── Save ───
    const safeName = input.title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 60);
    doc.save(`${safeName}_ExamCompass.pdf`);
};

// Keep old exports for backward compat — used by TopicPage, SubjectPage, QuestionPage, etc.
export interface CheatSheetContent {
    topic: string;
    summary: string;
    keyPoints: string[];
    formulas: { name: string; formula: string }[];
    viralTips: string[];
}

export const generateCheatSheetContent = async (topic: string, subject: string): Promise<CheatSheetContent | null> => {
    const { askAI } = await import('../lib/ai');
    const { extractJSON } = await import('../lib/utils');

    const prompt = `
        You are a Top-Tier Educator preparing a "Viral Revision Cheat Sheet" for ${topic} in ${subject}.
        The goal is to provide maximum value in minimum time.

        Requirements:
        1. Summary: Exactly 2 impactful sentences summarizing the core concept.
        2. High-Yield Points: 5-7 "Must-Know" points that frequently appear in exams like JEE/NEET.
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
        const response = await askAI("Master Mentor", prompt, 'groq', [], { stream: false });
        if (response) {
            const parsed = extractJSON(response) as Partial<CheatSheetContent>;
            if (!parsed) return null;
            return {
                topic: parsed.topic || topic,
                summary: parsed.summary || `Key concepts and formulas for ${topic}.`,
                keyPoints: parsed.keyPoints || [],
                formulas: parsed.formulas || [],
                viralTips: parsed.viralTips || [],
            };
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
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pw - margin * 2;
    const bottomLimit = ph - 25;
    let y = 0;
    let pageNum = 1;

    const purple = { r: 120, g: 80, b: 220 };
    const darkBg = { r: 20, g: 20, b: 35 };

    const drawFooter = () => {
        doc.setDrawColor(200, 200, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, ph - 18, pw - margin, ph - 18);
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 150);
        doc.setFont("helvetica", "normal");
        doc.text(`examcompass.pages.dev  |  Page ${pageNum}`, pw / 2, ph - 12, { align: 'center' });
    };

    const ensureSpace = (needed: number) => {
        if (y + needed > bottomLimit) {
            drawFooter();
            doc.addPage();
            pageNum++;
            y = 20;
        }
    };

    // Header
    doc.setFillColor(darkBg.r, darkBg.g, darkBg.b);
    doc.rect(0, 0, pw, 52, 'F');
    doc.setFillColor(purple.r, purple.g, purple.b);
    doc.rect(0, 0, pw, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("EXAM COMPASS", margin, 20);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 170, 255);
    doc.text("VIRAL REVISION CHEAT SHEET", margin, 27);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const titleLines = doc.splitTextToSize((content.topic || 'Revision Sheet').toUpperCase(), contentWidth);
    doc.text(titleLines, margin, 42);

    y = 62;

    // Summary
    ensureSpace(20);
    doc.setDrawColor(purple.r, purple.g, purple.b);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 30, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 50);
    doc.text("CORE CONCEPT SUMMARY", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const summaryLines = doc.splitTextToSize(content.summary || '', contentWidth);
    for (const line of summaryLines) {
        ensureSpace(6);
        doc.text(line, margin, y);
        y += 5;
    }
    y += 8;

    // Key Points
    if ((content.keyPoints || []).length > 0) {
        ensureSpace(14);
        doc.setDrawColor(purple.r, purple.g, purple.b);
        doc.setLineWidth(0.8);
        doc.line(margin, y, margin + 30, y);
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 50);
        doc.text("HIGH-YIELD REVISION POINTS", margin, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(70, 70, 70);
        for (const point of content.keyPoints) {
            ensureSpace(10);
            doc.setFillColor(purple.r, purple.g, purple.b);
            doc.circle(margin + 2, y - 1.2, 1.2, 'F');
            const pLines = doc.splitTextToSize(point, contentWidth - 10);
            for (const pl of pLines) {
                ensureSpace(5.5);
                doc.text(pl, margin + 7, y);
                y += 5;
            }
            y += 1.5;
        }
        y += 6;
    }

    // Formulas Table
    if (content.formulas && content.formulas.length > 0) {
        ensureSpace(20);
        autoTable(doc, {
            startY: y,
            head: [['Formula / Concept', 'Details']],
            body: content.formulas.map(f => [f.name || '', f.formula || '']),
            theme: 'grid',
            headStyles: { fillColor: [purple.r, purple.g, purple.b], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8.5, textColor: [60, 60, 60] },
            margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Tips
    if ((content.viralTips || []).length > 0) {
        ensureSpace(14);
        doc.setDrawColor(purple.r, purple.g, purple.b);
        doc.setLineWidth(0.8);
        doc.line(margin, y, margin + 30, y);
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 50);
        doc.text("EXPERT TIPS & SHORTCUTS", margin, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(70, 70, 70);
        for (const tip of content.viralTips) {
            const bqLines = doc.splitTextToSize(tip, contentWidth - 16);
            const boxH = bqLines.length * 5 + 8;
            ensureSpace(boxH + 4);
            doc.setFillColor(245, 240, 255);
            doc.roundedRect(margin, y - 4, contentWidth, boxH, 2, 2, 'F');
            doc.setFillColor(purple.r, purple.g, purple.b);
            doc.rect(margin, y - 4, 2.5, boxH, 'F');
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(80, 60, 120);
            for (const bLine of bqLines) {
                doc.text(bLine, margin + 8, y + 2);
                y += 5;
            }
            y += 6;
        }
    }

    drawFooter();
    doc.save(`${(content.topic || 'Revision').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_ExamCompass.pdf`);
};
