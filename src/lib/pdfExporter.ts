
export interface PDFExportOptions {
    title: string;
    filename: string;
    category?: string;
    userName?: string;
    userClass?: string;
    targetYear?: number;
    docId?: string;
    isExamMode?: boolean;
    contentHtml: string;
}

/**
 * Premium PDF Exporter Utility
 * Encapsulates the "Ironclad" high-quality PDF generation DNA from the Notes section.
 */
export const exportPremiumPDF = async (options: PDFExportOptions) => {
    const {
        title,
        filename,
        category = 'Academic Archive',
        userName = 'Scholar',
        userClass = 'Class 12th',
        targetYear = new Date().getFullYear(),
        isExamMode = false,
        contentHtml
    } = options;

    const syntheticHtml = `
        <div id="pdf-shadow-renderer" style="background-color: #ffffff; color: #000000; box-sizing: border-box; overflow-wrap: break-word; width: 100%; font-family: 'Times New Roman', serif;">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
            <style>
                /* COVER PAGE STYLING */
                #pdf-cover {
                    height: 260mm; /* Adjusted to fit within A4 margins (297mm - margins) */
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    padding: 40px;
                    page-break-after: always;
                    border: 20px solid #f8fafc;
                    box-sizing: border-box;
                }
                #pdf-cover .logo { font-size: 48pt; font-weight: 900; color: #4338ca; margin-bottom: 20px; letter-spacing: -2px; font-family: sans-serif; }
                #pdf-cover .chapter { font-size: 36pt; font-weight: 800; color: #1e293b; margin-bottom: 60px; line-height: 1.2; }
                #pdf-cover .meta-box { background: #f1f5f9; padding: 40px; border-radius: 40px; width: 80%; }
                #pdf-cover .meta-item { margin: 15px 0; font-size: 16pt; font-weight: 700; color: #475569; }
                #pdf-cover .session { color: #6366f1; text-transform: uppercase; letter-spacing: 4px; font-size: 12pt; margin-top: 40px; }

                /* CONTENT STYLING */
                .content-body { padding: 40px 60px; }
                .mermaid svg, .mermaid-container svg { width: 100% !important; max-width: 100% !important; height: auto !important; }
                .katex .mfrac .frac-line { 
                    border-bottom-width: 1.5pt !important; 
                    position: static !important;
                    display: block !important;
                    margin: 2px 0 !important;
                }
                .katex .vlist-t { vertical-align: middle !important; }
                
                /* TYPOGRAPHY */
                h1 { font-size: 32pt; text-align: center; color: #4338ca; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 40px; font-weight: 900; }
                h2 { font-size: 24pt; color: #1e1b4b; border-left: 12px solid #6366f1; padding-left: 20px; background: #f8fafc; margin-top: 50px; padding-block: 20px; font-weight: 800; page-break-after: avoid; }
                h3 { font-size: 18pt; color: #4338ca; margin-top: 35px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
                p, li { font-size: 13pt; line-height: 1.8; color: #1e293b; margin-bottom: 18px; text-align: justify; }
                
                blockquote { border-left: 6px solid #e2e8f0; padding-left: 30px; font-style: italic; color: #64748b; margin: 30px 0; }
                table { width: 100%; border-collapse: collapse; margin: 30px 0; }
                th, td { border: 1px solid #e2e8f0; padding: 12px; font-size: 11pt; }
                th { background: #f8fafc; font-weight: 800; }
                
                .practice-box { margin-top: 80px; padding: 50px; border: 5px solid #6366f1; border-radius: 32px; background: #ffffff; page-break-inside: avoid; }
            </style>

            <!-- PAGE 1: COVER PAGE -->
            <div id="pdf-cover">
                <div class="logo">EXAM COMPASS</div>
                <div class="chapter">${title.replace(/notes|blog/gi, '').trim()}</div>
                <div class="meta-box">
                    <div class="meta-item">${category}: ${title}</div>
                    <div class="meta-item">Prepared for: ${userName}</div>
                    <div class="meta-item">Curriculum: ${userClass}</div>
                    <div class="meta-item">Format: ${isExamMode ? 'Revision Mastery' : 'Full Archive'}</div>
                </div>
                <div class="session">Session ${targetYear}-${targetYear + 1}</div>
                <div style="margin-top: 100px; font-weight: 900; opacity: 0.1; font-size: 80pt;">CONFIDENTIAL</div>
            </div>

            <!-- PAGE 2+: CONTENT -->
            <div class="content-body">
                ${contentHtml}
            </div>
        </div>
    `;

    const pdfOptions = {
        margin: [15, 10, 15, 10] as [number, number, number, number],
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            letterRendering: true
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const, compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const }
    };

    try {
        const html2pdf = (await import('html2pdf.js')).default;
        const worker = html2pdf().set(pdfOptions).from(syntheticHtml).toPdf();
        const pdf = await worker.get('pdf');
        const totalPages = pdf.internal.getNumberOfPages();

        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Add Footer (Page Numbers)
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text(
                `Page ${i} of ${totalPages}`, 
                pdf.internal.pageSize.getWidth() / 2, 
                pdf.internal.pageSize.getHeight() - 10, 
                { align: 'center' }
            );

            // Add Header (Clean Name) - Skip on cover page
            if (i > 1) {
                pdf.setFontSize(8);
                pdf.text(
                    `${title.replace(/notes|blog/gi, '').trim()} | AI Premium Archive`, 
                    15, 
                    10
                );
            }
        }

        pdf.save(filename);
        return true;
    } catch (e) {
        console.error("Premium export failed", e);
        throw e;
    }
};
