import micromatch from 'micromatch'

export default {
  '*.{js,jsx,ts,tsx}': async (files) => {
    // Windows 경로 정규화
    const match = micromatch(files, '*.{js,jsx,ts,tsx}')
    const filesStr = match.map((file) => `"${file}"`).join(' ')

    if (filesStr) {
      return [
        `prettier --check ${filesStr}`, // 먼저 포맷 체크
        `prettier --write ${filesStr}`, // 포맷 수정
        `eslint --fix ${filesStr}`,     // ESLint 수정
        `prettier --check ${filesStr}`, // 최종 포맷 확인
      ]
    }
    return []
  },
  '*.{json,css,md}': async (files) => {
    const match = micromatch(files, '*.{json,css,md}')
    const filesStr = match.map((file) => `"${file}"`).join(' ')

    if (filesStr) {
      return [
        `prettier --check ${filesStr}`, // 먼저 포맷 체크
        `prettier --write ${filesStr}`, // 포맷 수정
        `prettier --check ${filesStr}`, // 최종 포맷 확인
      ]
    }
    return []
  },
}
