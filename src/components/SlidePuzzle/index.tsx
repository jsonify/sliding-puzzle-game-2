// src/components/SlidePuzzle/index.tsx
import React, { useState, useCallback, useEffect } from 'react'
import { classNames } from 'utils'

// Types for our puzzle
type TileColor = 'red' | 'blue' | 'green' | 'yellow' | 'pink' | 'teal'

interface Tile {
  id: number
  color: TileColor
}

interface Position {
  row: number
  col: number
}

// Constants
const GRID_SIZE = 5
const COLORS: TileColor[] = ['red', 'blue', 'green', 'yellow', 'pink', 'teal']

const colorToTailwind: Record<TileColor, string> = {
  red: 'bg-red-400',
  blue: 'bg-sky-400',
  green: 'bg-emerald-300',
  yellow: 'bg-yellow-200',
  pink: 'bg-rose-300',
  teal: 'bg-teal-400'
}

const SlidePuzzle: React.FC = () => {
  // State for the puzzle board
  const [board, setBoard] = useState<(Tile | null)[][]>([])
  const [emptyPosition, setEmptyPosition] = useState<Position>({ row: GRID_SIZE - 1, col: GRID_SIZE - 1 })
  const [solution, setSolution] = useState<(Tile | null)[][]>([])

  // Initialize the puzzle board
  const initializeBoard = useCallback(() => {
    const newBoard: (Tile | null)[][] = []
    let id = 1

    for (let i = 0; i < GRID_SIZE; i++) {
      const row: (Tile | null)[] = []
      for (let j = 0; j < GRID_SIZE; j++) {
        if (i === GRID_SIZE - 1 && j === GRID_SIZE - 1) {
          row.push(null) // Empty tile
        } else {
          row.push({
            id,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
          })
          id++
        }
      }
      newBoard.push(row)
    }

    setBoard(newBoard)
    setSolution([...newBoard.map(row => [...row])])
    setEmptyPosition({ row: GRID_SIZE - 1, col: GRID_SIZE - 1 })
  }, [])

  // Initialize on mount
  useEffect(() => {
    initializeBoard()
  }, [initializeBoard])

  // Check if a tile can be moved
  const canMoveTile = (row: number, col: number): boolean => {
    return (
      (Math.abs(row - emptyPosition.row) === 1 && col === emptyPosition.col) ||
      (Math.abs(col - emptyPosition.col) === 1 && row === emptyPosition.row)
    )
  }

  // Move a tile
  const moveTile = (row: number, col: number) => {
    if (!canMoveTile(row, col)) return

    const newBoard = [...board.map(row => [...row])]
    newBoard[emptyPosition.row][emptyPosition.col] = board[row][col]
    newBoard[row][col] = null

    setBoard(newBoard)
    setEmptyPosition({ row, col })
  }

  // Solve all but last tile
  const solveAllButLast = () => {
    if (!solution.length) return
    
    const newBoard = [...solution.map(row => [...row])]
    newBoard[GRID_SIZE - 1][GRID_SIZE - 1] = null
    setBoard(newBoard)
    setEmptyPosition({ row: GRID_SIZE - 1, col: GRID_SIZE - 1 })
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Puzzle Board</h1>
      
      <div className="flex space-x-4">
        <button
          onClick={initializeBoard}
          className="rounded-full bg-emerald-500 px-6 py-2 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Randomize
        </button>
        <button
          onClick={solveAllButLast}
          className="rounded-full bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Solve All But Last
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="grid grid-cols-5 gap-2">
          {board.map((row, rowIndex) =>
            row.map((tile, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => moveTile(rowIndex, colIndex)}
                className={classNames(
                  'h-16 w-16 rounded-lg transition-all duration-200',
                  tile ? colorToTailwind[tile.color] : 'bg-gray-200',
                  canMoveTile(rowIndex, colIndex) ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'
                )}
                disabled={!canMoveTile(rowIndex, colIndex)}
                aria-label={tile ? `Tile ${tile.id}` : 'Empty tile'}
              />
            ))
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Solution</h2>
        <div className="grid grid-cols-5 gap-1">
          {solution.map((row, rowIndex) =>
            row.map((tile, colIndex) => (
              <div
                key={`solution-${rowIndex}-${colIndex}`}
                className={classNames(
                  'h-8 w-8 rounded-lg',
                  tile ? colorToTailwind[tile.color] : 'bg-gray-200'
                )}
                aria-hidden="true"
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default SlidePuzzle
