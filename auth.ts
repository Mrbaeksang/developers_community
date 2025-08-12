import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/core/prisma'

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일 기본 세션 만료
    updateAge: 24 * 60 * 60, // 24시간마다 세션 업데이트
  },
  pages: {
    signIn: '/auth/signin',
  },
  cookies: {
    pkceCodeVerifier: {
      name: 'authjs.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // 첫 로그인 시 DB에서 사용자 정보 가져오기
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { globalRole: true },
        })
        token.role = dbUser?.globalRole || 'USER'
      }

      // 세션 업데이트 시 DB에서 최신 역할 정보 가져오기
      if (trigger === 'update' && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { globalRole: true },
        })
        token.role = dbUser?.globalRole || 'USER'
      }

      // 기존 세션에도 role이 없다면 다시 조회
      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { globalRole: true },
        })
        token.role = dbUser?.globalRole || 'USER'
      }

      return token
    },
    session({ session, token }) {
      if (token && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as 'USER' | 'MANAGER' | 'ADMIN'
      }
      return session
    },
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || '',
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    // 카카오 provider - 이메일 없이 닉네임과 프로필 이미지만 사용
    ...(process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET
      ? [
          Kakao({
            clientId: process.env.AUTH_KAKAO_ID,
            clientSecret: process.env.AUTH_KAKAO_SECRET,
            authorization: {
              params: {
                scope: 'profile_nickname profile_image', // 실제 권한 있는 항목만
              },
            },
            profile(profile) {
              return {
                id: String(profile.id),
                name:
                  profile.kakao_account?.profile?.nickname ||
                  `카카오사용자_${profile.id}`,
                email: `kakao_${profile.id}@devcom.local`, // 가상 이메일 (권한 없으므로)
                image:
                  profile.kakao_account?.profile?.profile_image_url || null,
              }
            },
          }),
        ]
      : []),
  ],
})
