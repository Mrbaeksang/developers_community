// 아이콘 테스트
const LucideIcons = require('lucide-react')

console.log('Layout 아이콘 존재 여부:', 'Layout' in LucideIcons)
console.log('Layout 타입:', typeof LucideIcons.Layout)

// 다른 가능한 이름들 테스트
const possibleNames = [
  'Layout',
  'LayoutGrid',
  'LayoutList',
  'LayoutTemplate',
  'Layers',
]

possibleNames.forEach((name) => {
  if (LucideIcons[name]) {
    console.log(`${name}: 존재함 (타입: ${typeof LucideIcons[name]})`)
  } else {
    console.log(`${name}: 없음`)
  }
})
