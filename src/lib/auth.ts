import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { sendLoginNotification } from "./email-events";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Send login notification email
        console.log(`🔔 Attempting to send login notification to ${user.email}`);
        try {
          const emailResult = await sendLoginNotification(user.id, {
            email: user.email,
            name: user.name
          }, {
            ipAddress: 'unknown', // NextAuth doesn't provide IP in authorize
            userAgent: 'unknown',
            timestamp: new Date()
          });
          console.log(`✅ Login notification sent to ${user.email}, result: ${emailResult}`);
        } catch (emailError) {
          console.error('❌ Failed to send login notification:', emailError);
          // Don't fail the login if email fails
        }

        // Track login in database
        try {
          await prisma.loginHistory.create({
            data: {
              userId: user.id,
              ipAddress: 'unknown', // NextAuth doesn't provide IP in authorize
              userAgent: 'unknown',
              status: 'SUCCESS',
              location: 'Unknown',
              deviceType: 'Unknown',
              browser: 'Unknown'
            }
          });
          console.log(`📊 Login tracked for user ${user.email}`);
        } catch (trackingError) {
          console.error('❌ Failed to track login:', trackingError);
          // Don't fail the login if tracking fails
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
