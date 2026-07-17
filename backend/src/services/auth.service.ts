import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import env from '../config/env';
import { z } from 'zod';
import { signupSchema, loginSchema } from '../validators/auth.validator';

type SignupInput = z.infer<typeof signupSchema>;
type LoginInput = z.infer<typeof loginSchema>;

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
  },

  login: async (data: LoginInput) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        return { success: false as const, error: "Invalid email or password" };
      }

      const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

      if (!isValidPassword) {
        return { success: false as const, error: "Invalid email or password" };
      }

      const token = jwt.sign({ userId: user.id }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn as any
      });

      return {
        success: true as const,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          }
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false as const, error: "Something went wrong, please try again" };
    }
  },

  getProfile: async (userId: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      if (!user) {
        return { success: false as const, error: "User not found" };
      }

      return { success: true as const, data: user };
    } catch (error) {
      console.error('Profile error:', error);
      return { success: false as const, error: "Something went wrong, please try again" };
    }
  }
};
