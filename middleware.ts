import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, publicRoutes} from '@/routes';

const {auth} = NextAuth(authConfig)

export default auth((req) => {
    const {nextUrl} = req;
    const isLoggedIn = !!req.auth;

    console.log(`Middleware triggered for path: ${nextUrl.pathname}`);

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);

    if (isApiAuthRoute) {
        console.log(`API Auth Route detected: ${nextUrl.pathname}`);
        return null;
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            console.log(`Authenticated user trying to access auth route, redirecting to: ${DEFAULT_LOGIN_REDIRECT}`);
            return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
        }
        console.log(`Unauthenticated user accessing auth route: ${nextUrl.pathname}`);
        return null;
    }

    if (!isLoggedIn && !isPublicRoute) {
        console.log(`Unauthenticated user trying to access protected route, redirecting to login: ${nextUrl.pathname}`);
        return Response.redirect(new URL('/auth/login', nextUrl))
    }

    return null;
})

// Optionally, don't invoke Middleware on some paths
export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
