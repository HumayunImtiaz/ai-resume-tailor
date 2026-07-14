import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { //Agar sirf new PrismaClient() use karen to multiple Prisma clients aur unnecessary database connections ban sakte hain. globalThis pehle check karta hai ke PrismaClient already exist karta hai ya nahi. Agar karta hai to usi ko reuse karta hai, warna naya bana deta hai. Is se unnecessary database connections avoid hote hain
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
