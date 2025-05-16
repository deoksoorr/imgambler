import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

// Session 타입 확장
declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      isAdmin?: boolean
    }
  }
}

const SERVER_BOOT_VERSION = process.env.SERVER_BOOT_VERSION || Date.now().toString();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // UTC+0 자정 만료
      const now = new Date();
      const nextUTC0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      token.exp = Math.floor(nextUTC0.getTime() / 1000);
      // 서버 재시작 시 강제 만료
      token.serverBoot = SERVER_BOOT_VERSION;
      if (user) {
        console.log('user in jwt:', user)
        let dbUserForSession = null
        if (user.email) {
          dbUserForSession = await prisma.user.findUnique({ where: { email: user.email } })
        }
        token.sub = dbUserForSession?.id ?? user.id ?? (user.email ?? undefined)
        token.name = user.name
        token.email = user.email
        token.image = user.image
        token.isAdmin = (user as any).isAdmin;
      }
      // isAdmin 판별용 dbUser는 별도
      let dbUser = null
      if (token.email) {
        dbUser = await prisma.user.findUnique({ where: { email: token.email } })
      } else if (token.sub) {
        dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
      }
      token.isAdmin = dbUser?.isAdmin === true;
      console.log('JWT 콜백 후 token:', token)
      return token
    },
    async session({ session, token }) {
      // 서버 재시작 시 강제 만료
      if (token.serverBoot && token.serverBoot !== SERVER_BOOT_VERSION) {
        session.expires = new Date(0).toISOString();
      } else {
        // UTC+0 자정 만료
        const now = new Date();
        const nextUTC0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        session.expires = nextUTC0.toISOString();
      }
      const t = token as any
      session.user = {
        id: typeof t?.sub === 'string' ? t.sub : (t?.sub ? String(t.sub) : undefined),
        name: t?.name ?? undefined,
        email: t?.email ?? undefined,
        image: t?.image ?? undefined,
        isAdmin: true,
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // 최초 로그인 시 image가 없으면 랜덤 아바타 할당
      if (!user.image) {
        user.image = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email || user.name || Math.random()}`
      }
      return true
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
  },
  events: {
    async createUser({ user }) {
      // 최초 회원가입 시 DB에 랜덤 아바타 이미지 저장
      const randomImage = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email || user.name || Math.random()}`
      await prisma.user.update({
        where: { id: user.id },
        data: { image: randomImage },
      })
    },
  },
  pages: {
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }