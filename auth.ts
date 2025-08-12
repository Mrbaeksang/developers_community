import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/core/prisma'

// 환경 변수 검증
const kakaoClientId = process.env.AUTH_KAKAO_ID
const kakaoClientSecret = process.env.AUTH_KAKAO_SECRET

if (!kakaoClientId || !kakaoClientSecret) {
  console.error('❌ KAKAO OAuth credentials missing:', {
    hasClientId: !!kakaoClientId,
    hasClientSecret: !!kakaoClientSecret,
    clientIdLength: kakaoClientId?.length || 0,
    clientSecretLength: kakaoClientSecret?.length || 0,
  })
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: true, // 프로덕션에서도 디버그 활성화 (임시)
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
    // 카카오 provider는 credentials가 있을 때만 추가
    ...(kakaoClientId && kakaoClientSecret
      ? [
          Kakao({
            clientId: kakaoClientId,
            clientSecret: kakaoClientSecret,
            // NextAuth v5 카카오 설정 명시적 지정
            authorization: {
              url: 'https://kauth.kakao.com/oauth/authorize',
              params: {
                scope: '', // 빈 문자열로 명시적 설정 (기본 scope 요청 방지)
              },
            },
            token: 'https://kauth.kakao.com/oauth/token',
            userinfo: 'https://kapi.kakao.com/v2/user/me',
            client: {
              token_endpoint_auth_method: 'client_secret_post',
            },
            checks: ['state'], // PKCE 비활성화
            profile(profile) {
              console.error('📱 Kakao profile received:', {
                id: profile.id,
                hasKakaoAccount: !!profile.kakao_account,
                hasProfile: !!profile.kakao_account?.profile,
                hasEmail: !!profile.kakao_account?.email,
              })

              return {
                id: String(profile.id),
                name:
                  profile.kakao_account?.profile?.nickname ||
                  profile.properties?.nickname ||
                  `카카오사용자_${profile.id}`,
                email:
                  profile.kakao_account?.email ||
                  `kakao_${profile.id}@devcom.local`, // 가상 이메일 사용
                image:
                  profile.kakao_account?.profile?.profile_image_url ||
                  profile.properties?.profile_image ||
                  null,
                role: 'USER' as const, // 기본 역할
              }
            },
          }),
        ]
      : []),
  ],
})
