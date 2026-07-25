import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import prisma from '../config/database';

interface ResumeLink {
  text: string;
  url: string;
}

const extractLinksFromHtml = (html: string): ResumeLink[] => {
  const links: ResumeLink[] = [];
  const anchorRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const url = match[1].trim();
    const text = match[2].trim();
    if (url && text) {
      links.push({ text, url });
    }
  }
  return links;
};

export const resumeService = {
  extractText: async (mimetype: string, buffer: Buffer) => {
    try {
      if (mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return { success: true as const, text: result.text, links: [] as ResumeLink[] };
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Extract plain text for AI analysis
        const textData = await mammoth.extractRawText({ buffer });
        // Extract HTML to capture hyperlinks
        const htmlData = await mammoth.convertToHtml({ buffer });
        const links = extractLinksFromHtml(htmlData.value);
        return { success: true as const, text: textData.value, links };
      }
      return { success: false as const, error: 'Only PDF and DOCX files are supported' };
    } catch (error) {
      console.error('Extract text error:', error);
      return { success: false as const, error: 'Could not parse the uploaded file' };
    }
  },

  uploadResume: async (userId: string, file: Express.Multer.File) => {
    try {
      const extractionResult = await resumeService.extractText(file.mimetype, file.buffer);
      
      if (!extractionResult.success) {
        return extractionResult; // Returns { success: false, error: ... }
      }

      const resume = await prisma.resume.create({
        data: {
          userId,
          originalFilename: file.originalname,
          rawText: extractionResult.text,
          links: extractionResult.links as any,
        },
        select: {
          id: true,
          originalFilename: true,
          uploadedAt: true
        }
      });

      return {
        success: true as const,
        data: resume
      };
    } catch (error) {
      console.error('Upload resume error:', error);
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  listResumes: async (userId: string) => {
    try {
      const resumes = await prisma.resume.findMany({
        where: { userId },
        select: {
          id: true,
          originalFilename: true,
          uploadedAt: true
        },
        orderBy: { uploadedAt: 'desc' }
      });

      return { success: true as const, data: resumes };
    } catch (error) {
      console.error('List resumes error:', error);
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  deleteResume: async (userId: string, resumeId: string) => {
    try {
      const result = await prisma.resume.deleteMany({
        where: { id: resumeId, userId }
      });

      if (result.count === 0) {
        return { success: false as const, error: 'Resume not found' };
      }

      return { success: true as const, data: null };
    } catch (error) {
      console.error('Delete resume error:', error);
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  }
};
