'use server';

import * as z from 'zod';
import { LoginSchema } from '@/schemas';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { generateVerificationToken, generateTwoFactorToken } from '@/lib/tokens';
import { sendVerificationEmail, sendTwoFactorTokenEmail } from '@/lib/mail';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';

export const login = async (values: z.infer<typeof LoginSchema>) => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        console.log('Validation failed:', validatedFields.error);
        return { error: 'Invalid credentials' };
    }

    const { email, password, code } = validatedFields.data;

    console.log('Attempting login with email:', email);

    const existingUser = await getUserByEmail(email);

    if (!existingUser || !existingUser.email || !existingUser.password) {
        console.log('No user found or missing email/password:', { existingUser });
        return { error: 'Invalid credentials' };
    }

    console.log('User found:', existingUser.email);

    if (!existingUser.emailVerified) {
        const verificationToken = await generateVerificationToken(existingUser.email);

        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token,
        );

        console.log('Verification email sent to:', existingUser.email);
        return { success: 'Confirmation Email sent! Please verify your email before logging in.' };
    }

    if (existingUser.isTwoFactorEnabled && existingUser.email) {
        if (code) {
            const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);

            if (!twoFactorToken || twoFactorToken.token !== code) {
                console.log('Invalid or expired 2FA code:', { code, twoFactorToken });
                return { error: 'Invalid code' };
            }

            const hasExpired = new Date(twoFactorToken.expires) < new Date();

            if (hasExpired) {
                console.log('2FA code expired for user:', existingUser.email);
                return { error: 'Code expired!' };
            }

            await db.twoFactorToken.delete({
                where: { id: twoFactorToken.id }
            });

            const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

            if (existingConfirmation) {
                await db.twoFactorConfirmation.delete({
                    where: { id: existingConfirmation.id }
                });
            }

            await db.twoFactorConfirmation.create({
                data: {
                    userId: existingUser.id,
                }
            });

            console.log('2FA successful for user:', existingUser.email);
            return { success: 'Two-factor authentication successful' };
        } else {
            const twoFactorToken = await generateTwoFactorToken(existingUser.email);
            await sendTwoFactorTokenEmail(
                twoFactorToken.email,
                twoFactorToken.token,
            );

            console.log('2FA token sent to:', existingUser.email);
            return { twoFactor: true, message: 'Two-factor authentication code sent. Please check your email.' };
        }
    }

    try {
        const result = await signIn('credentials', {
            email,
            password,
            redirect: false, // We handle redirection on the client side
        });

        console.log('Sign-in result:', result);

        if (result?.error) {
            console.log('Sign-in failed with credentials:', { email, error: result.error });
            return { error: 'Invalid credentials!' };
        }

        console.log('Sign-in successful:', { email });
        return { success: 'Login successful', redirectTo: DEFAULT_LOGIN_REDIRECT };
    } catch (error) {
        if (error instanceof AuthError) {
            console.log('AuthError encountered during sign-in:', error);
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'Invalid credentials!' };
                default:
                    return { error: 'Something went wrong!' };
            }
        }

        console.log('Unexpected error during sign-in:', error);
        return { error: 'Unexpected error occurred' };
    }
};
