import type { NextAuthConfig } from "next-auth"
import type { JWT } from "next-auth/jwt"

const TRAINEE = "trainee"
const TRAINER = "trainer"

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl, headers } = request;
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const path = nextUrl.pathname;
      const isAuthPage = path === "/" || path === "/register" || path === "/forgot-password" || path === "/reset-password";
      
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        const isServerAction = headers.has("next-action");
        if (isServerAction) {
          return true;
        }
        return false; 
      }


      if (path.startsWith("/dashboard/trainers") && userRole !== TRAINEE) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (path.startsWith("/dashboard/trainees") && userRole !== TRAINER) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (path.startsWith("/dashboard/workout-plans/edit") && userRole !== TRAINER) {
        return Response.redirect(new URL("/dashboard/workout-plans", nextUrl));
      }

      if (path.startsWith("/dashboard/workout-plans/create") && userRole !== TRAINER) {
        return Response.redirect(new URL("/dashboard/workout-plans", nextUrl));
      }

      return true; 
    },

    async session({ session, token }) {
      const t = token as JWT

      session.error = t.error

      if (session.user) {
        session.user.id = t.id
        session.user.role = t.role
      }

      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig