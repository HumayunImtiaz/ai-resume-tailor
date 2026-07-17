import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import env from '../config/env';
import { z } from 'zod';
import { signupSchema } from '../validators/auth.validator';

type SignupInput = z.infer<typeof signupSchema>;

export const authService = {
  signup: async (data: SignupInput) => {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return { success: false as const, error: "Email already registered" };
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      });

      // Assert jwtExpiresIn type or let it default if needed
      // Our config casts to a string
      const token = jwt.sign({ userId: user.id }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn as any
      });

      return {
        success: true as const,
        data: {
          token,
          user
        }
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false as const, error: "Something went wrong, please try again" };
    }
  }
};
