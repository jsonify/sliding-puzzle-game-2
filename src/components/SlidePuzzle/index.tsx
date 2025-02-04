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

// Helper function to find empty position
const findEmptyPosition = (board: (Tile | null)[][]): Position | null => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (board[i][j] === null) {
        return { row: i, col: j }
      }
    }
  }
  return null
}

const SlidePuzzle: React.FC = () => {
  // State for the puzzle board
  const [board, setBoard] = useState<(Tile | null)[][]>([])
  const [emptyPosition, setEmptyPosition] = useState<Position>({ row: GRID_SIZE - 1, col: GRID_SIZE - 1 })
  const [solution, setSolution] = useState<(Tile | null)[][]>([])
  const [isSolved, setIsSolved] = useState(false)

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
    
    // Ensure we have exactly 24 tiles (25 cells - 1 empty)
    if (tiles.length !== 24) {
      console.error('Invalid number of tiles:', tiles.length)
      return
    }
    
    // Multiple shuffles for increased randomness
    let shuffledTiles = [...tiles]
    // Perform multiple shuffles
    for (let i = 0; i < 3; i++) {
      shuffledTiles = shuffle(shuffledTiles)
    }
    
    // Create the board placing all tiles except the last cell
    const newBoard: (Tile | null)[][] = []
    let tileIndex = 0
    
    for (let i = 0; i < GRID_SIZE; i++) {
      const row: (Tile | null)[] = []
      for (let j = 0; j < GRID_SIZE; j++) {
        if (i === GRID_SIZE - 1 && j === GRID_SIZE - 1) {
          row.push(null) // The last cell is always empty
        } else {
          row.push(shuffledTiles[tileIndex++])
        }
      }
      newBoard.push(row)
    }
    
    // Make 200 random valid moves to shuffle the board more thoroughly
    for (let i = 0; i < 200; i++) {
      const emptyPos = findEmptyPosition(newBoard)
      if (!emptyPos) {
        console.error('No empty position found')
        break
      }

      // Find adjacent tiles that can be moved with direction tracking
      const { row, col } = emptyPos
      const possibleMoves = [
        { row: row - 1, col, dir: 'up' }, // up
        { row: row + 1, col, dir: 'down' }, // down
        { row, col: col - 1, dir: 'left' }, // left
        { row, col: col + 1, dir: 'right' }  // right
      ].filter(pos =>
        pos.row >= 0 && pos.row < GRID_SIZE &&
        pos.col >= 0 && pos.col < GRID_SIZE
      )

      if (possibleMoves.length > 0) {
        // Add weights to moves to prevent back-and-forth patterns
        const weightedMoves: typeof possibleMoves = []
        possibleMoves.forEach(move => {
          // Add each move multiple times based on position to create weighted randomness
          const weight = Math.floor(Math.random() * 3) + 1 // 1-3 copies of each move
          for (let w = 0; w < weight; w++) {
            weightedMoves.push(move)
          }
        })
        
        // Pick a random move from the weighted list
        const move = weightedMoves[Math.floor(Math.random() * weightedMoves.length)]
        // Swap tiles
        const temp = newBoard[move.row][move.col]
        newBoard[move.row][move.col] = null
        newBoard[emptyPos.row][emptyPos.col] = temp
      }
    }
    
    // Create the solution board with sorted tiles
    const sortedTiles = [...tiles].sort((a, b) => a.id - b.id)
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
    setIsSolved(false)
  }, [])

  // Check if puzzle is solved
  const checkPuzzleSolved = useCallback((newBoard: (Tile | null)[][]) => {
    // Check if all tiles except the last position match the solution
    const isMatchingSolution = solution.every((row, i) =>
      row.every((solutionTile, j) => {
        // Skip checking the last position
        if (i === GRID_SIZE - 1 && j === GRID_SIZE - 1) return true
        
        const currentTile = newBoard[i][j]
        // Both tiles should be null or both should have matching IDs
        return (!currentTile && !solutionTile) || (currentTile?.id === solutionTile?.id)
      })
    )

    // Check if the empty space is in the correct position
    const isEmptySpaceCorrect = !newBoard[GRID_SIZE - 1][GRID_SIZE - 1]

    // Consider the puzzle solved if all tiles match and empty space is correct
    return isMatchingSolution && isEmptySpaceCorrect
  }, [solution])

  // Initialize on mount
  useEffect(() => {
    initializeBoard()
  }, [initializeBoard])

  // Check if a tile can be moved
  const canMoveTile = (row: number, col: number): boolean => {
    // Cannot move tile that doesn't exist
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false

    // Cannot move the empty space itself
    if (board[row][col] === null) return false

    // Must be in same row or column as empty space
    const sameRow = row === emptyPosition.row
    const sameCol = col === emptyPosition.col

    if (!sameRow && !sameCol) return false

    // For row movement, all tiles between must be non-null
    if (sameRow) {
      const start = Math.min(col, emptyPosition.col)
      const end = Math.max(col, emptyPosition.col)
      return Array.from({ length: end - start - 1 }, (_, i) => start + i + 1)
        .every(i => board[row][i] !== null)
    }

    // For column movement, all tiles between must be non-null
    if (sameCol) {
      const start = Math.min(row, emptyPosition.row)
      const end = Math.max(row, emptyPosition.row)
      return Array.from({ length: end - start - 1 }, (_, i) => start + i + 1)
        .every(i => board[i][col] !== null)
    }

    return false
  }
  
  const moveTile = (row: number, col: number) => {
    if (!canMoveTile(row, col)) return
  
    const newBoard = board.map(row => [...row])
    
    if (row === emptyPosition.row) {
      if (col < emptyPosition.col) {
        // Shift tiles left, starting from the empty position
        for (let i = emptyPosition.col - 1; i >= col; i--) {
          newBoard[row][i + 1] = newBoard[row][i]
        }
        newBoard[row][col] = null
      } else if (col > emptyPosition.col) {
        // Shift tiles right, starting from the empty position
        for (let i = emptyPosition.col + 1; i <= col; i++) {
          newBoard[row][i - 1] = newBoard[row][i]
        }
        newBoard[row][col] = null
      }
    } else if (col === emptyPosition.col) {
      if (row < emptyPosition.row) {
        for (let i = emptyPosition.row - 1; i >= row; i--) {
          newBoard[i + 1][col] = newBoard[i][col]
        }
        newBoard[row][col] = null
      } else if (row > emptyPosition.row) {
        for (let i = emptyPosition.row + 1; i <= row; i++) {
          newBoard[i - 1][col] = newBoard[i][col]
        }
        newBoard[row][col] = null
      }
    }
  
    setBoard(newBoard)
    setEmptyPosition({ row, col })
  
    // Check if puzzle is solved after move
    const isSolvedNow = checkPuzzleSolved(newBoard)
    console.log('Checking puzzle solved:', { row, col, isSolvedNow })
    setIsSolved(isSolvedNow)
  }

  // Solve all but last tile
  const solveAllButLast = () => {
    if (!solution.length) return
    
    // Create a copy of the solution board
    const newBoard = solution.map(row => row.map(tile => tile))
    
    // Swap the last two tiles
    const lastRowIndex = GRID_SIZE - 1
    const secondLastColIndex = GRID_SIZE - 2
    const lastColIndex = GRID_SIZE - 1
    
    // Move empty space to second-to-last position
    newBoard[lastRowIndex][secondLastColIndex] = null
    // Move the last tile to the last position
    newBoard[lastRowIndex][lastColIndex] = solution[lastRowIndex][secondLastColIndex]
    
    setBoard(newBoard)
    setEmptyPosition({ row: lastRowIndex, col: secondLastColIndex })
    setIsSolved(false)
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Puzzle Board</h1>
      
      <div className="flex space-x-4">
        {isSolved ? (
          <>
            <div className="flex items-center rounded-lg bg-green-100 px-6 py-2 text-green-800" data-testid="success-message">
              <span role="img" aria-label="celebration" className="mr-2">
                🎉
              </span>
              Congratulations! Puzzle Solved!
            </div>
            <button
              onClick={() => {
                initializeBoard()
                setIsSolved(false)
              }}
              className="rounded-full bg-indigo-500 px-6 py-2 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Start Over
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
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