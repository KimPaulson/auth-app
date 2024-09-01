import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import { LoginSchema } from '@/schemas';
import { getUserByEmail } from '@/data/user';
import Github from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export default {
    providers: [
        Google({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Github({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
        Credentials({
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials);

                if (validatedFields.success) {
                    let { email, password } = validatedFields.data;
                    
                    // Normalize the email to lower case for case-insensitive matching
                    email = email.toLowerCase();

                    const user = await getUserByEmail(email);
                    if (!user || !user.password) {
                        console.log('User not found or missing password');
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) {
                        console.log('Passwords match, user authorized');
                        return user;
                    } else {
                        console.log('Password does not match');
                    }
                } else {
                    console.log('Credentials validation failed', validatedFields.error);
                }

                return null;
            }
        })
    ],
} satisfies NextAuthConfig;
