import prisma from '../config/database';
import { resumeService } from './resume.service';
import cloudinary from '../config/cloudinary';

export const coverLetterService = {
  uploadCoverLetter: async (userId: string, file: Express.Multer.File) => {
    try {
      const extractionResult = await resumeService.extractText(file.mimetype, file.buffer);
      
      if (!extractionResult.success) {
        return extractionResult; // Returns { success: false, error: ... }
      }

      let fileUrl = null;
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'raw', folder: 'cover_letters' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
        fileUrl = (uploadResult as any).secure_url;
      } catch (uploadError) {
        console.error('Cloudinary cover letter upload error:', uploadError);
      }

      const coverLetter = await prisma.coverLetter.create({
        data: {
          userId,
          originalFilename: file.originalname,
          fileUrl,
          rawText: extractionResult.text,
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
        data: coverLetter
      };
    } catch (error) {
      console.error('Upload cover letter error:', error);
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  listCoverLetters: async (userId: string) => {
    try {
      const coverLetters = await prisma.coverLetter.findMany({
        where: { userId },
        select: {
          id: true,
          originalFilename: true,
          fileUrl: true,
          uploadedAt: true
        },
        orderBy: { uploadedAt: 'desc' }
      });

      return { success: true as const, data: coverLetters };
    } catch (error) {
      console.error('List cover letters error:', error);
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  deleteCoverLetter: async (userId: string, coverLetterId: string) => {
    try {
      const result = await prisma.coverLetter.deleteMany({
        where: { id: coverLetterId, userId }
      });

      if (result.count === 0) {
        return { success: false as const, error: 'Cover letter not found' };
      }

      return { success: true as const, data: null };
    } catch (error) {
      console.error('Delete cover letter error:', error);
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  }
};
