import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import logger from '../config/logger';


function sanitizeForPdf(text: string): string {
  if (!text) return text;
  return text
    .replace(/→/g, '-')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/‘/g, "'")
    .replace(/’/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/…/g, '...')
    // Strip any remaining characters outside the basic WinAnsi-safe range
    // eslint-disable-next-line no-control-regex
    .replace(/[^\u0000-\u00FF]/g, '');
}

export interface StructuredResume {
  fullName: string;
  title?: string;
  contactLine?: {
    email: string;
    phone?: string;
    location?: string;
    links?: { label: string; url: string }[];
  } | string;
  summary: string;
  skillCategories?: {
    category: string;
    skills: string[];
  }[];
  experience: {
    role: string;
    company: string;
    dates: string;
    location?: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    school: string;
    dates: string;
  }[];
  projects?: {
    name: string;
    bullets: string[];
  }[];
  certifications?: string[];
}

export interface PdfGenerationResult {
  success: boolean;
  data?: Buffer;
  error?: string;
}

export async function generateResumePdf(resume: StructuredResume): Promise<PdfGenerationResult> {
  try {
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const margin = 36; // 0.5 inch
    const availableWidth = 612 - margin * 2; // US Letter width is 612, height 792

    let page = pdfDoc.addPage([612, 792]);
    let currentY = 792 - margin;

    
    const drawSanitizedText = (p: any, text: string, options: any) => {
      p.drawText(sanitizeForPdf(text), options);
    };

    const getSanitizedWidth = (font: any, text: string, size: number) => {
      return font.widthOfTextAtSize(sanitizeForPdf(text), size);
    };

    const rgbColor = (r: number, g: number, b: number) => rgb(r / 255, g / 255, b / 255);
    const darkGray = rgbColor(85, 85, 85);
    const black = rgbColor(0, 0, 0);
    const linkColor = rgbColor(5, 99, 193);

    const checkNewPage = (neededHeight: number) => {
      if (currentY - neededHeight < margin) {
        page = pdfDoc.addPage([612, 792]);
        currentY = 792 - margin;
      }
    };

    const drawTextWrapped = (text: string, font: any, size: number, color: any, x: number, lineSpacing = 1.2) => {
      const words = text.split(' ');
      let line = '';
      const lines = [];

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = getSanitizedWidth(font, testLine, size);
        if (testWidth > (availableWidth - (x - margin)) && i > 0) {
          lines.push(line);
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const lineHeight = size * lineSpacing;
      // Evaluate space for all lines
      checkNewPage(lines.length * lineHeight);

      for (const l of lines) {
        drawSanitizedText(page, l.trim(), {
          x,
          y: currentY - size,
          size,
          font,
          color,
        });
        currentY -= lineHeight;
      }
      return currentY;
    };

    // Heading: Full Name
    if (resume.fullName) {
      const nameSize = 22;
      const textWidth = getSanitizedWidth(helveticaBold, resume.fullName, nameSize);
      checkNewPage(nameSize * 1.2);
      drawSanitizedText(page, resume.fullName, {
        x: (612 - textWidth) / 2,
        y: currentY - nameSize,
        size: nameSize,
        font: helveticaBold,
        color: black,
      });
      currentY -= nameSize * 1.2;
    }

    // Title
    if (resume.title) {
      currentY -= 5;
      const titleSize = 11;
      const textWidth = getSanitizedWidth(helveticaFont, resume.title, titleSize);
      checkNewPage(titleSize * 1.2);
      drawSanitizedText(page, resume.title, {
        x: (612 - textWidth) / 2,
        y: currentY - titleSize,
        size: titleSize,
        font: helveticaFont,
        color: darkGray,
      });
      currentY -= titleSize * 1.2 + 5;
    }

    // Contact
    if (resume.contactLine) {
      currentY -= 5;
      const contactSize = 9;

      if (typeof resume.contactLine === 'string') {
        const textWidth = getSanitizedWidth(helveticaFont, resume.contactLine, contactSize);
        checkNewPage(contactSize * 1.2);
        drawSanitizedText(page, resume.contactLine, {
          x: (612 - textWidth) / 2,
          y: currentY - contactSize,
          size: contactSize,
          font: helveticaFont,
          color: black,
        });
        currentY -= contactSize * 1.2 + 10;
      } else {
        const parts: { text: string; type: string; url?: string; width: number }[] = [];
        let totalWidth = 0;
        const separator = '  |  ';
        const sepWidth = getSanitizedWidth(helveticaFont, separator, contactSize);

        const addPart = (type: string, text: string, url?: string) => {
          if (parts.length > 0) totalWidth += sepWidth;
          const width = getSanitizedWidth(helveticaFont, text, contactSize);
          parts.push({ text, type, url, width });
          totalWidth += width;
        };

        const cl = resume.contactLine;
        if (cl.email) addPart('link', cl.email, `mailto:${cl.email}`);
        if (cl.phone) addPart('text', cl.phone);
        if (cl.location) addPart('text', cl.location);
        if (cl.links) {
          cl.links.forEach((l) => {
            addPart(l.url ? 'link' : 'text', l.label, l.url);
          });
        }

        let startX = (612 - totalWidth) / 2;
        checkNewPage(contactSize * 1.2);

        parts.forEach((p, idx) => {
          if (idx > 0) {
            drawSanitizedText(page, separator, {
              x: startX,
              y: currentY - contactSize,
              size: contactSize,
              font: helveticaFont,
              color: black,
            });
            startX += sepWidth;
          }

          if (p.type === 'link' && p.url) {
            drawSanitizedText(page, p.text, {
              x: startX,
              y: currentY - contactSize,
              size: contactSize,
              font: helveticaFont,
              color: linkColor,
            });

            // Add link annotation
            const rect = [startX, currentY - contactSize - 2, startX + p.width, currentY];
            const ref = pdfDoc.context.obj({
              Type: 'Annot',
              Subtype: 'Link',
              Rect: rect,
              Border: [0, 0, 0],
              A: { Type: 'Action', S: 'URI', URI: p.url },
            });

            let annots = page.node.Annots();
            if (!annots) {
              annots = pdfDoc.context.obj([]);
              page.node.set(pdfDoc.context.obj('Annots'), annots);
            }
            annots.push(ref);
          } else {
            drawSanitizedText(page, p.text, {
              x: startX,
              y: currentY - contactSize,
              size: contactSize,
              font: helveticaFont,
              color: black,
            });
          }
          startX += p.width;
        });

        currentY -= contactSize * 1.2 + 10;
      }
    }

    // Divider
    currentY -= 5;
    checkNewPage(5);
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: 612 - margin, y: currentY },
      thickness: 1,
      color: black,
    });
    currentY -= 15;

    const drawSectionHeading = (title: string) => {
      currentY -= 10;
      const size = 11;
      checkNewPage(size * 1.2);
      drawSanitizedText(page, title, {
        x: margin,
        y: currentY - size,
        size,
        font: helveticaBold,
        color: black,
      });
      currentY -= size * 1.2 + 5;
    };

    // Summary
    if (resume.summary) {
      drawSectionHeading('PROFESSIONAL SUMMARY');
      drawTextWrapped(resume.summary, helveticaFont, 9.5, black, margin);
      currentY -= 10;
    }

    // SKILLS & CORE COMPETENCIES
    if (resume.skillCategories && resume.skillCategories.length > 0) {
      drawSectionHeading('SKILLS & CORE COMPETENCIES');

      for (const cat of resume.skillCategories) {
        const categoryTitle = `${cat.category}: `;
        const titleWidth = getSanitizedWidth(helveticaBold, categoryTitle, 9.5);
        
        checkNewPage(12);
        const prevY = currentY;
        drawSanitizedText(page, categoryTitle, { x: margin, y: currentY - 9.5, size: 9.5, font: helveticaBold, color: black });
        drawTextWrapped(cat.skills.join(', '), helveticaFont, 9.5, black, margin + titleWidth);
        currentY = prevY - (prevY - currentY) + 2; 
      }
      currentY -= 8;
    }

    // Experience
    if (resume.experience && resume.experience.length > 0) {
      drawSectionHeading('PROFESSIONAL EXPERIENCE');

      for (const exp of resume.experience) {
        const roleCompany = `${exp.role} - ${exp.company}`;
        const dates = exp.dates;

        checkNewPage(15);
        drawSanitizedText(page, roleCompany, { x: margin, y: currentY - 9.5, size: 9.5, font: helveticaBold });
        if (dates) {
          const dateWidth = getSanitizedWidth(helveticaBold, dates, 9.5);
          drawSanitizedText(page, dates, { x: 612 - margin - dateWidth, y: currentY - 9.5, size: 9.5, font: helveticaBold });
        }
        currentY -= 9.5 * 1.2 + 2;

        if (exp.location) {
          checkNewPage(12);
          drawSanitizedText(page, exp.location, { x: margin, y: currentY - 9.5, size: 9.5, font: helveticaOblique });
          currentY -= 9.5 * 1.2 + 2;
        } else {
          currentY -= 2;
        }

        if (exp.bullets && exp.bullets.length > 0) {
          for (const bullet of exp.bullets) {
            const bulletSymbol = '•  ';
            const bw = getSanitizedWidth(helveticaFont, bulletSymbol, 9.5);
            checkNewPage(12);
            drawSanitizedText(page, bulletSymbol, { x: margin + 10, y: currentY - 9.5, size: 9.5, font: helveticaFont, color: black });

            const prevY = currentY;
            drawTextWrapped(bullet, helveticaFont, 9.5, black, margin + 10 + bw);
            currentY = prevY - (prevY - currentY) + 2;
          }
        }
        currentY -= 10;
      }
    }

    // Education
    if (resume.education && resume.education.length > 0) {
      drawSectionHeading('EDUCATION');
      for (const edu of resume.education) {
        const degSchool = `${edu.degree} - ${edu.school}`;
        const dates = edu.dates;

        checkNewPage(15);
        drawSanitizedText(page, degSchool, { x: margin, y: currentY - 9.5, size: 9.5, font: helveticaBold });
        if (dates) {
          const dateWidth = getSanitizedWidth(helveticaBold, dates, 9.5);
          drawSanitizedText(page, dates, { x: 612 - margin - dateWidth, y: currentY - 9.5, size: 9.5, font: helveticaBold });
        }
        currentY -= 9.5 * 1.2 + 6;
      }
      currentY -= 4;
    }

    // Projects
    if (resume.projects && resume.projects.length > 0) {
      drawSectionHeading('PROJECTS');
      for (const proj of resume.projects) {
        checkNewPage(12);
        drawSanitizedText(page, proj.name, { x: margin, y: currentY - 9.5, size: 9.5, font: helveticaBold });
        currentY -= 9.5 * 1.2 + 3;

        if (proj.bullets && proj.bullets.length > 0) {
          for (const bullet of proj.bullets) {
            const bulletSymbol = '•  ';
            const bw = getSanitizedWidth(helveticaFont, bulletSymbol, 9.5);
            checkNewPage(12);
            drawSanitizedText(page, bulletSymbol, { x: margin + 10, y: currentY - 9.5, size: 9.5, font: helveticaFont });

            const prevY = currentY;
            drawTextWrapped(bullet, helveticaFont, 9.5, black, margin + 10 + bw);
            currentY = prevY - (prevY - currentY) + 2;
          }
        }
        currentY -= 8;
      }
    }

    // Certifications
    if (resume.certifications && resume.certifications.length > 0) {
      drawSectionHeading('CERTIFICATIONS');
      for (const cert of resume.certifications) {
        const bulletSymbol = '•  ';
        const bw = getSanitizedWidth(helveticaFont, bulletSymbol, 9.5);
        checkNewPage(12);
        drawSanitizedText(page, bulletSymbol, { x: margin + 10, y: currentY - 9.5, size: 9.5, font: helveticaFont });
        drawTextWrapped(cert, helveticaFont, 9.5, black, margin + 10 + bw);
      }
    }

    const pdfBytes = await pdfDoc.save();
    return { success: true, data: Buffer.from(pdfBytes) };
  } catch (error: any) {
    logger.error('Error generating PDF', { message: (error as Error).message, stack: (error as Error).stack });
    return { success: false, error: 'Could not generate document' };
  }
}
