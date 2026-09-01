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

/**
 * Converts plain extracted text into formatted HTML for in-browser preview.
 * Detects section headings (all-caps lines), bullet points, and paragraphs.
 */
const rawTextToHtml = (rawText: string): string => {
  const lines = rawText.split('\n');
  let html = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      html += '<div style="margin-bottom:6px"></div>';
      continue;
    }

    // Detect section headings: short, mostly uppercase lines (e.g. "EXPERIENCE", "SKILLS")
    const isHeading =
      line.length < 60 &&
      line === line.toUpperCase() &&
      /[A-Z]/.test(line) &&
      !/^\d/.test(line);

    if (isHeading) {
      html += `<h2 style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1a1a2e;margin:20px 0 6px;padding-bottom:4px;border-bottom:1.5px solid #e5e7eb;">${line}</h2>`;
    } else if (/^[•\-–—*]/.test(line)) {
      // Bullet point
      const content = line.replace(/^[•\-–—*]\s*/, '');
      html += `<div style="display:flex;gap:8px;margin-bottom:3px;"><span style="color:#6b7280;margin-top:2px;">•</span><span style="font-size:13px;color:#374151;line-height:1.6;">${content}</span></div>`;
    } else {
      // Regular paragraph / name / contact line
      const fontSize = i < 3 && line.length < 50 ? '15px' : '13px';
      const fontWeight = i < 3 && line.length < 50 ? '600' : '400';
      html += `<p style="font-size:${fontSize};font-weight:${fontWeight};color:#1f2937;line-height:1.7;margin:0 0 2px;">${line}</p>`;
    }
  }

  return `<div style="font-family:'Inter',system-ui,sans-serif;max-width:100%;padding:32px 40px;background:#fff;">${html}</div>`;
};

export const resumeService = {
  buildPreviewHtml: rawTextToHtml,
  extractText: async (mimetype: string, buffer: Buffer, originalname?: string) => {
    try {
      let rawText = '';
      let links: ResumeLink[] = [];

      // Determine file type — check MIME type first, then fall back to file extension
      // (Some browsers/OS send 'application/octet-stream' for .docx files)
      const ext = originalname ? originalname.substring(originalname.lastIndexOf('.')).toLowerCase() : '';
      const isPdf = mimetype === 'application/pdf' || ext === '.pdf';
      const isDocx =
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/zip' ||
        mimetype === 'application/msword' ||
        mimetype === 'application/octet-stream' ||
        ext === '.docx';

      if (isPdf && !isDocx) {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        rawText = result.text;
      } else if (isDocx) {
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
      const extractionResult = await resumeService.extractText(file.mimetype, file.buffer, file.originalname);
      
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

  getResumePreview: async (userId: string, resumeId: string) => {
    try {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId },
        select: { id: true, originalFilename: true, rawText: true }
      });

      if (!resume) {
        return { success: false as const, error: 'Resume not found' };
      }

      // Convert rawText to formatted HTML
      const html = rawTextToHtml(resume.rawText);
      return { success: true as const, data: { html, filename: resume.originalFilename } };
    } catch (error) {
      logger.error('Get resume preview error', { error });
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
