import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from '@/lib/prisma'

/**
 * Enhanced NextAuth configuration with Shopify customer context support
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('Sign in callback triggered for:', user?.email);
      try {
        // Check if there's Shopify customer context in the request
        // This could be passed via state parameter or session storage
        // For now, we'll allow all Google sign-ins
        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
}

/**
 * Associate a Shopify customer ID with a user account
 * This allows linking Shopify storefront customers with app users
 */
export async function associateShopifyCustomer(
  userId: string,
  shopDomain: string,
  shopifyCustomerId: string
) {
  try {
    // Store the association in user metadata or a separate table
    // For now, we'll use a simple approach with Account model
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'shopify',
          providerAccountId: `${shopDomain}:${shopifyCustomerId}`,
        },
      },
      create: {
        userId: userId,
        type: 'oauth',
        provider: 'shopify',
        providerAccountId: `${shopDomain}:${shopifyCustomerId}`,
      },
      update: {
        // Update timestamp or other metadata if needed
      },
    });

    console.log(`✅ Associated Shopify customer ${shopifyCustomerId} from ${shopDomain} with user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error associating Shopify customer:', error);
    return false;
  }
}

/**
 * Find a user associated with a Shopify customer ID
 */
export async function findUserByShopifyCustomer(
  shopDomain: string,
  shopifyCustomerId: string
) {
  try {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'shopify',
          providerAccountId: `${shopDomain}:${shopifyCustomerId}`,
        },
      },
      include: {
        user: true,
      },
    });

    return account?.user || null;
  } catch (error) {
    console.error('Error finding user by Shopify customer:', error);
    return null;
  }
}