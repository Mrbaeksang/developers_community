module.exports = {
  '*.{js,jsx,ts,tsx}': (filenames) =>
    `prettier --write ${filenames.map((file) => `"${file}"`).join(' ')}`,
  '*.{json,css}': (filenames) =>
    `prettier --write ${filenames.map((file) => `"${file}"`).join(' ')}`
}