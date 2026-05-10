import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl, headers } = request;
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const path = nextUrl.pathname;
      const isAuthPage = path === "/" || path === "/register";
      
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


      if (path.startsWith("/dashboard/trainers") && userRole !== "trainee") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (path.startsWith("/dashboard/trainees") && userRole !== "trainer") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true; 
    },

    async session({ session, token }) {
      const t = token as any;

      session.accessToken = t.accessToken;
      session.refreshToken = t.refreshToken;
      session.error = t.error;

      if (session.user) {
        session.user.id = t.id;
        session.user.role = t.role;
      }

      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig