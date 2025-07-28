import micromatch from 'micromatch'

export default {
  '*.{js,jsx,ts,tsx}': async (files) => {
    // Windows 경로 정규화
    const match = micromatch(files, '*.{js,jsx,ts,tsx}')
    const filesStr = match.map((file) => `"${file}"`).join(' ')

    if (filesStr) {
      return [`prettier --write ${filesStr}`, `eslint --fix ${filesStr}`]
    }
    return []
  },
  '*.{json,css,md}': async (files) => {
    const match = micromatch(files, '*.{json,css,md}')
    const filesStr = match.map((file) => `"${file}"`).join(' ')

    if (filesStr) {
      return `prettier --write ${filesStr}`
    }
    return []
  },
}
