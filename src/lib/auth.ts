import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getSheetData } from './sheets';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        
        try {
          // Check if it's the admin
          if (
            credentials.username === process.env.ADMIN_USERNAME &&
            credentials.password === process.env.ADMIN_PASSWORD
          ) {
            return {
              id: 'admin',
              name: 'Admin',
              type: 'admin',
            };
          }
          
          // Check if it's a company
          const data = await getSheetData('companies');
          const companies = data.slice(1); // Skip header row
          
          const company = companies.find(
            (row) => row[2] === credentials.username
          );
          
          if (!company) {
            return null;
          }
          
          // Check if the company is enabled
          const isEnabled = company[5] === 'true';
          if (!isEnabled) {
            throw new Error('This account has been disabled');
          }
          
          // Verify password
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            company[3]
          );
          
          if (!passwordMatch) {
            return null;
          }
          
          return {
            id: company[0],
            name: company[1],
            type: 'company',
            image: company[4] || null,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = user.type;
        token.image = user.image || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.type = token.type as string;
        session.user.image = token.image as string | null;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
};

// Extend next-auth types
declare module 'next-auth' {
  interface User {
    id: string;
    type: string;
    image?: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      type: string;
    };
  }
} 