import { Document, Packer, Paragraph, TextRun } from 'docx';

export interface DocxGenerationResult {
  success: boolean;
  data?: Buffer;
  error?: string;
}

export async function generateResumeDocx(tailoredText: string): Promise<DocxGenerationResult> {
  try {
    // Split on double newlines, fallback to single newlines if no double newlines exist
    const separator = tailoredText.includes('\n\n') ? '\n\n' : '\n';
    const paragraphsTexts = tailoredText.split(separator).filter(text => text.trim() !== '');

    const childParagraphs = paragraphsTexts.map(text => {
      // 11pt font size in Word is 22 half-points
      return new Paragraph({
        children: [
          new TextRun({
            text: text.trim(),
            font: "Calibri",
            size: 22, 
          }),
        ],
        spacing: {
          after: 120, // 120 twips spacing after paragraph
        },
      });
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            }
          }
        },
        children: childParagraphs,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    
    return { 
      success: true, 
      data: buffer 
    };
  } catch (error: any) {
    console.error('Error generating DOCX:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to generate DOCX file' 
    };
  }
}
