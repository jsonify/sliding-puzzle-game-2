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
    // Create an array of all tiles needed (4 of each color)
    const tiles: Tile[] = []
    let id = 1
    
    // Add exactly 4 tiles of each color
    COLORS.forEach(color => {
      for (let i = 0; i < 4; i++) {
        tiles.push({ id: id++, color })
      }
    })
    
    // Fisher-Yates shuffle for better randomization
    const shuffle = <T,>(array: T[]): T[] => {
      const newArray = [...array]
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
      }
      return newArray
    }
    
    // Keep shuffling until we get a different order than solution
    let shuffledTiles: Tile[]
    const sortedTiles = [...tiles].sort((a, b) => a.id - b.id)
    
    do {
      shuffledTiles = shuffle(tiles)
    } while (shuffledTiles.every((tile, i) => tile.id === sortedTiles[i].id))
    
    // Create the board with randomized tiles
    const newBoard: (Tile | null)[][] = []
    let tileIndex = 0
    
    for (let i = 0; i < GRID_SIZE; i++) {
      const row: (Tile | null)[] = []
      for (let j = 0; j < GRID_SIZE; j++) {
        if (i === GRID_SIZE - 1 && j === GRID_SIZE - 1) {
          row.push(null) // Empty tile
        } else {
          row.push(shuffledTiles[tileIndex++])
        }
      }
      newBoard.push(row)
    }
  
    // Create the solution board with sorted tiles
    const solutionBoard: (Tile | null)[][] = []
    tileIndex = 0
    
    for (let i = 0; i < GRID_SIZE; i++) {
      const row: (Tile | null)[] = []
      for (let j = 0; j < GRID_SIZE; j++) {
        if (i === GRID_SIZE - 1 && j === GRID_SIZE - 1) {
          row.push(null) // Empty tile
        } else {
          row.push(sortedTiles[tileIndex++])
        }
      }
      solutionBoard.push(row)
    }
  
    setBoard(newBoard)
    setSolution(solutionBoard)
    setEmptyPosition({ row: GRID_SIZE - 1, col: GRID_SIZE - 1 })
  }, [])

  // Initialize on mount
  useEffect(() => {
    initializeBoard()
  }, [initializeBoard])

  // Check if a tile can be moved
  const canMoveTile = (row: number, col: number): boolean => {
    return (
      // Same row as empty space
      (row === emptyPosition.row) ||
      // Same column as empty space
      (col === emptyPosition.col)
    )
  }
  
  // Update the moveTile function:
  const moveTile = (row: number, col: number) => {
    if (!canMoveTile(row, col)) return
  
    const newBoard = [...board.map(row => [...row])]
    
    if (row === emptyPosition.row) {
      if (col < emptyPosition.col) {
        // Store clicked tile
        const clickedTile = newBoard[row][col]
        // Shift tiles left, starting from the empty position
        for (let i = emptyPosition.col - 1; i >= col; i--) {
          newBoard[row][i + 1] = newBoard[row][i]
        }
        // Place empty tile at clicked position
        newBoard[row][col] = null
      } else if (col > emptyPosition.col) {
        // Store clicked tile
        const clickedTile = newBoard[row][col]
        // Shift tiles right, starting from the empty position
        for (let i = emptyPosition.col + 1; i <= col; i++) {
          newBoard[row][i - 1] = newBoard[row][i]
        }
        // Place empty tile at clicked position
        newBoard[row][col] = null
      }
    } else if (col === emptyPosition.col) {
      // Similar logic for vertical movement
      if (row < emptyPosition.row) {
        const clickedTile = newBoard[row][col]
        for (let i = emptyPosition.row - 1; i >= row; i--) {
          newBoard[i + 1][col] = newBoard[i][col]
        }
        newBoard[row][col] = null
      } else if (row > emptyPosition.row) {
        const clickedTile = newBoard[row][col]
        for (let i = emptyPosition.row + 1; i <= row; i++) {
          newBoard[i - 1][col] = newBoard[i][col]
        }
        newBoard[row][col] = null
      }
    }
  
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
              <button
                key={`solution-${rowIndex}-${colIndex}`}
                className={classNames(
                  'h-8 w-8 rounded-lg',
                  tile ? colorToTailwind[tile.color] : 'bg-gray-200'
                )}
                aria-label={tile ? `solution ${tile.id}` : 'Empty solution tile'}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default SlidePuzzle
