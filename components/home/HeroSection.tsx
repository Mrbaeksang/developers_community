'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Code2, Users, Zap } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            개발자들을 위한{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              지식 공유 플랫폼
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            코드를 공유하고, 질문하고, 함께 성장하세요. 국내 최고의 개발자
            커뮤니티에서 당신의 개발 여정을 시작하세요.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/posts/new">
                글쓰기 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/explore">둘러보기</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-20 grid gap-8 sm:grid-cols-3"
        >
          <FeatureCard
            icon={Code2}
            title="코드 공유"
            description="문법 강조, 코드 블록, 마크다운을 지원하여 아이디어를 명확하게 전달하세요."
          />
          <FeatureCard
            icon={Users}
            title="활발한 커뮤니티"
            description="수천 명의 개발자들과 지식을 공유하고 네트워킹하세요."
          />
          <FeatureCard
            icon={Zap}
            title="빠른 피드백"
            description="질문에 대한 답변을 빠르게 받고, 실시간으로 토론에 참여하세요."
          />
        </motion.div>
      </div>

      {/* 배경 장식 */}
      <div className="absolute -top-10 -right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
    </section>
  )
}

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md"
    >
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  )
}
