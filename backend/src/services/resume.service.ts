import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import prisma from '../config/database';
import cloudinary from '../config/cloudinary';
import logger from '../config/logger';

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
      let rawText = '';
      let links: ResumeLink[] = [];

      if (mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        rawText = result.text;
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Extract plain text for AI analysis
        const textData = await mammoth.extractRawText({ buffer });
        // Extract HTML to capture hyperlinks
        const htmlData = await mammoth.convertToHtml({ buffer });
        links = extractLinksFromHtml(htmlData.value);
        rawText = textData.value;
      } else {
        return { success: false as const, error: 'Only PDF and DOCX files are supported' };
      }

      // Sanitize extracted text by stripping null bytes
      // eslint-disable-next-line no-control-regex
      rawText = rawText.replace(/\u0000/g, '');

      // Fallback: extract any visible URLs from the raw text for both formats
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(com|org|net|io|me|dev)\/[a-zA-Z0-9.\-_\/]+)/gi;
      let match;
      while ((match = urlRegex.exec(rawText)) !== null) {
        let url = match[1];
        if (url.endsWith(',') || url.endsWith('!') || url.endsWith('.') || url.endsWith(')')) {
          url = url.slice(0, -1);
        }
        if (!url.toLowerCase().startsWith('http')) {
          url = 'https://' + url;
        }
        // Avoid duplicates
        if (!links.some(l => l.url.toLowerCase() === url.toLowerCase())) {
          links.push({ text: 'Link', url });
        }
      }

      return { success: true as const, text: rawText, links };
    } catch (error) {
      logger.error('Extract text error', { error });
      return { success: false as const, error: 'Could not parse the uploaded file' };
    }
  },

  uploadResume: async (userId: string, file: Express.Multer.File) => {
    try {
      const extractionResult = await resumeService.extractText(file.mimetype, file.buffer);
      
      if (!extractionResult.success) {
        return extractionResult; // Returns { success: false, error: ... }
      }

      let fileUrl = null;
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'raw', folder: 'resumes' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
        fileUrl = (uploadResult as any).secure_url;
      } catch (uploadError) {
        logger.error('Cloudinary resume upload error', { error: uploadError });
      }

      const resume = await prisma.resume.create({
        data: {
          userId,
          originalFilename: file.originalname,
          fileUrl,
          rawText: extractionResult.text,
          links: extractionResult.links as any,
        },
        select: {
          id: true,
          originalFilename: true,
          fileUrl: true,
          uploadedAt: true
        }
      });

      return {
        success: true as const,
        data: resume
      };
    } catch (error) {
      logger.error('Upload resume error', { error });
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
          fileUrl: true,
          uploadedAt: true
        },
        orderBy: { uploadedAt: 'desc' }
      });

      return { success: true as const, data: resumes };
    } catch (error) {
      logger.error('List resumes error', { error });
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
      logger.error('Delete resume error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  listTailoredVersions: async (userId: string, resumeId: string) => {
    try {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId }
      });

      if (!resume) {
        return { success: false as const, error: 'Resume not found' };
      }

      const versions = await prisma.tailoredVersion.findMany({
        where: { resumeId },
        select: {
          id: true,
          matchScore: true,
          createdAt: true,
          jobDescription: {
            select: {
              id: true,
              title: true,
              company: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return { success: true as const, data: versions };
    } catch (error) {
      logger.error('List tailored versions error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  deleteAllTailoredVersions: async (userId: string) => {
    try {
      const result = await prisma.tailoredVersion.deleteMany({
        where: {
          resume: {
            userId
          }
        }
      });

      return { success: true as const, data: { count: result.count } };
    } catch (error) {
      logger.error('Delete all tailored versions error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  }
};
