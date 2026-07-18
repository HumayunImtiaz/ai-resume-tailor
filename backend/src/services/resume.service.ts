import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import prisma from '../config/database';

export const resumeService = {
  extractText: async (mimetype: string, buffer: Buffer) => {
    try {
      if (mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return { success: true as const, text: result.text };
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const data = await mammoth.extractRawText({ buffer });
        return { success: true as const, text: data.value };
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
          rawText: extractionResult.text
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
  }
};
