import NextAuth from 'next-auth';
import authConfig from '@/auth.config';
import { getUserById } from '@/data/user';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { db } from '@/lib/db';

export const { auth, handlers, signIn, signOut } = NextAuth({
    pages: {
        signIn: '/auth/login',
        error: '/auth/error',
    },

    callbacks: {
        async signIn({ user, account }) {
            console.log("Attempting to sign in with account:", account);

            // Allow OAuth without email verification
            if (account?.provider !== 'credentials') return true;

            if (!user.id) {
                console.error("User ID is missing.");
                throw new Error('User ID is missing');
            }

            const existingUser = await getUserById(user.id);

            if (!existingUser) {
                console.error("User not found for ID:", user.id);
                throw new Error('User not found');
            }

            if (!existingUser.emailVerified) {
                console.error("Email not verified for user:", existingUser.email);
                throw new Error('Email not verified');
            }

            console.log("Email verified for user:", existingUser.email);

            if (existingUser.isTwoFactorEnabled) {
                console.log("User has 2FA enabled, verifying...");
                const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

                if (!twoFactorConfirmation) {
                    console.error("Two-factor confirmation not found for user:", existingUser.id);
                    throw new Error('Two-factor authentication failed');
                }

                // Delete 2FA confirmation for next sign in
                await db.verificationToken.delete({
                    where: { id: twoFactorConfirmation.id }
                });

                console.log("2FA verification successful for user:", existingUser.email);
            }

            console.log("Sign in successful for user:", existingUser.email);
            return true;
        },

        async session({ token, session }) {
            try {
                if (token.sub && session.user) {
                    session.user.id = token.sub;
                }

                if (token.role && session.user) {
                    session.user.role = token.role as 'ADMIN' | 'USER';
                }

                if (token.isTwoFactorEnabled && session.user) {
                    session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
                }

                return session;
            } catch (error) {
                console.error("Error during session callback:", error);
                return session; // Return session even if there's an error
            }
        },

        async jwt({ token }) {
            try {
                if (!token.sub) {
                    console.error("JWT token sub is missing.");
                    return token;
                }

                const existingUser = await getUserById(token.sub);

                if (!existingUser) {
                    console.error("User not found during JWT callback:", token.sub);
                    return token;
                }

                token.role = existingUser.role;
                token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

                return token;
            } catch (error) {
                console.error("Error during JWT callback:", error);
                return token; // Return token even if there's an error
            }
        },
    },
    adapter: PrismaAdapter(db),
    session: { strategy: 'jwt' },
    ...authConfig,
});
