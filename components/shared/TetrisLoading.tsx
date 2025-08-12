'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface TetrisLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

// 테트리스 블록 정의
const TETROMINOS = [
  { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400 border-cyan-500' }, // I
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'bg-yellow-400 border-yellow-500',
  }, // O
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: 'bg-purple-400 border-purple-500',
  }, // T
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: 'bg-blue-400 border-blue-500',
  }, // L
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: 'bg-orange-400 border-orange-500',
  }, // J
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: 'bg-green-400 border-green-500',
  }, // S
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: 'bg-red-400 border-red-500',
  }, // Z
]

const GRID_WIDTH = 10
const GRID_HEIGHT = 20
const DROP_SPEED = 500 // milliseconds

export function TetrisLoading({
  size = 'md',
  text,
  className,
}: TetrisLoadingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [grid, setGrid] = useState<number[][]>(() =>
    Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(0))
  )
  const [currentPiece, setCurrentPiece] = useState<{
    x: number
    y: number
    shape: number[][]
    color: string
  } | null>(null)
  const lastDropRef = useRef(0)

  // 블록 크기 설정
  const blockSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  }
  const blockSize = blockSizes[size]

  // 새 블록 생성
  const spawnNewPiece = () => {
    const randomTetromino =
      TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)]
    setCurrentPiece({
      x: Math.floor(GRID_WIDTH / 2) - 1,
      y: 0,
      shape: randomTetromino.shape,
      color: randomTetromino.color,
    })
  }

  // 충돌 체크
  const checkCollision = (piece: typeof currentPiece, grid: number[][]) => {
    if (!piece) return false

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x
          const newY = piece.y + y

          if (
            newX < 0 ||
            newX >= GRID_WIDTH ||
            newY >= GRID_HEIGHT ||
            (newY >= 0 && grid[newY][newX])
          ) {
            return true
          }
        }
      }
    }
    return false
  }

  // 블록 고정
  const lockPiece = (piece: typeof currentPiece, grid: number[][]) => {
    if (!piece) return grid

    const newGrid = grid.map((row) => [...row])
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const gridY = piece.y + y
          const gridX = piece.x + x
          if (
            gridY >= 0 &&
            gridY < GRID_HEIGHT &&
            gridX >= 0 &&
            gridX < GRID_WIDTH
          ) {
            newGrid[gridY][gridX] = 1
          }
        }
      }
    }

    // 완성된 줄 제거
    const clearedGrid = newGrid.filter(
      (row) => !row.every((cell) => cell === 1)
    )
    while (clearedGrid.length < GRID_HEIGHT) {
      clearedGrid.unshift(Array(GRID_WIDTH).fill(0))
    }

    return clearedGrid
  }

  // 애니메이션 루프
  const animate = (timestamp: number) => {
    if (!currentPiece) {
      spawnNewPiece()
    } else if (timestamp - lastDropRef.current > DROP_SPEED) {
      lastDropRef.current = timestamp

      const movedPiece = { ...currentPiece, y: currentPiece.y + 1 }

      if (checkCollision(movedPiece, grid)) {
        const newGrid = lockPiece(currentPiece, grid)
        setGrid(newGrid)

        // 그리드가 가득 찼으면 초기화
        if (newGrid[0].some((cell) => cell === 1)) {
          setGrid(
            Array(GRID_HEIGHT)
              .fill(null)
              .map(() => Array(GRID_WIDTH).fill(0))
          )
        }

        spawnNewPiece()
      } else {
        setCurrentPiece(movedPiece)
      }
    }

    // Canvas 렌더링
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Clear canvas
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw grid
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1
        for (let x = 0; x <= GRID_WIDTH; x++) {
          ctx.beginPath()
          ctx.moveTo(x * blockSize, 0)
          ctx.lineTo(x * blockSize, GRID_HEIGHT * blockSize)
          ctx.stroke()
        }
        for (let y = 0; y <= GRID_HEIGHT; y++) {
          ctx.beginPath()
          ctx.moveTo(0, y * blockSize)
          ctx.lineTo(GRID_WIDTH * blockSize, y * blockSize)
          ctx.stroke()
        }

        // Draw locked blocks
        grid.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell) {
              ctx.fillStyle = '#6b7280'
              ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize)
              ctx.strokeStyle = '#4b5563'
              ctx.lineWidth = 2
              ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize)
            }
          })
        })

        // Draw current piece
        if (currentPiece) {
          const colors = {
            'bg-cyan-400 border-cyan-500': '#22d3ee',
            'bg-yellow-400 border-yellow-500': '#facc15',
            'bg-purple-400 border-purple-500': '#c084fc',
            'bg-blue-400 border-blue-500': '#60a5fa',
            'bg-orange-400 border-orange-500': '#fb923c',
            'bg-green-400 border-green-500': '#4ade80',
            'bg-red-400 border-red-500': '#f87171',
          }

          currentPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
              if (cell) {
                const drawX = (currentPiece.x + x) * blockSize
                const drawY = (currentPiece.y + y) * blockSize

                ctx.fillStyle =
                  colors[currentPiece.color as keyof typeof colors] || '#6b7280'
                ctx.fillRect(drawX, drawY, blockSize, blockSize)

                // 블록 테두리
                ctx.strokeStyle = '#000000'
                ctx.lineWidth = 2
                ctx.strokeRect(drawX, drawY, blockSize, blockSize)
              }
            })
          })
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPiece, grid])

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_WIDTH * blockSize}
          height={GRID_HEIGHT * blockSize}
          className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        />

        {/* 장식 요소 */}
        <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-400 border-2 border-black rotate-45" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-400 border-2 border-black rotate-45" />
      </div>

      {text && (
        <div className="text-center">
          <p className="text-lg font-black text-black animate-pulse">{text}</p>
          <div className="flex justify-center gap-1 mt-2">
            <div
              className="w-2 h-2 bg-black rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-black rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-black rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 모바일 체크 유틸리티
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  const userAgent = window.navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile',
  ]

  const isMobileUA = mobileKeywords.some((keyword) =>
    userAgent.includes(keyword)
  )
  const isMobileWidth = window.innerWidth <= 768

  return isMobileUA || isMobileWidth
}
