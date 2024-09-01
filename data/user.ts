import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function getUserByEmail(email: string) {
    try {
        const user = await db.user.findFirst({
            where: {
                email: email.toLowerCase(),
            },
        });
        console.log('User found:', user);
        return user;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
}

export async function getUserById(userId: string) {
    try {
        const user = await db.user.findUnique({
            where: {
                id: userId,
            },
        });
        return user;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        return null;
    }
}
