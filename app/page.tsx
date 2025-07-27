import { MainLayout } from '@/components/layouts/MainLayout'

export default async function Home() {
  return (
    <MainLayout>
      <div className="container py-8">
        {/* Hero Section */}
        <section className="relative mb-12 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
          <div className="relative px-8 py-16 md:py-24 text-center">
            <h1 className="mb-4 text-4xl md:text-6xl font-bold tracking-tight">
              개발자들의 지식 공유 플랫폼
            </h1>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-8">
              질문하고, 답변하고, 함께 성장하는 개발자 커뮤니티
            </p>
          </div>
        </section>

        {/* Placeholder for other sections */}
        <div className="text-center text-muted-foreground">
          <p>메인 페이지 콘텐츠가 여기에 추가될 예정입니다.</p>
        </div>
      </div>
    </MainLayout>
  )
}
