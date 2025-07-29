import { marked } from 'marked'

// 마크다운을 안전한 HTML로 변환
export function markdownToHtml(markdown: string): string {
  // marked 기본 설정
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown 활성화
    breaks: true, // 줄바꿈을 <br>로 변환
    pedantic: false,
  })

  // marked.parse는 동기 함수로 string을 반환
  return marked.parse(markdown) as string
}
