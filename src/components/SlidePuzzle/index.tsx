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

// Types for grid sizes
type GridSize = 3 | 4 | 5

// Constants
const GRID_CONFIGS = {
  3: { colors: ['red', 'blue', 'green', 'yellow'], tilesPerColor: 2 },
  4: { colors: ['red', 'blue', 'green', 'yellow', 'pink'], tilesPerColor: 3 },
  5: { colors: ['red', 'blue', 'green', 'yellow', 'pink', 'teal'], tilesPerColor: 4 }
} as const

const colorToTailwind: Record<TileColor, string> = {
  red: 'bg-red-400',
  blue: 'bg-sky-400',
  green: 'bg-emerald-300',
  yellow: 'bg-yellow-200',
  pink: 'bg-rose-300',
  teal: 'bg-teal-400'
}

// Helper function to find empty position
const findEmptyPosition = (board: (Tile | null)[][], size: number): Position | null => {
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === null) {
        return { row: i, col: j }
      }
    }
  }
  return null
}

const SlidePuzzle: React.FC = () => {
  // State for the puzzle board
  const [gridSize, setGridSize] = useState<GridSize>(3)
  const [board, setBoard] = useState<(Tile | null)[][]>([])
  const [emptyPosition, setEmptyPosition] = useState<Position>({ row: 2, col: 2 })
  const [solution, setSolution] = useState<(Tile | null)[][]>([])
  const [isSolved, setIsSolved] = useState(false)

  // Get current grid configuration
  const currentConfig = GRID_CONFIGS[gridSize]

  // Initialize the puzzle board
  const initializeBoard = useCallback(() => {
    const { colors, tilesPerColor } = currentConfig
    const totalTiles = gridSize * gridSize - 1 // Leave one empty space
    
    // Create an array of all tiles needed
    const tiles: Tile[] = []
    let id = 1
    
    // Add tiles for each color
    colors.forEach(color => {
      for (let i = 0; i < tilesPerColor; i++) {
        tiles.push({ id: id++, color: color as TileColor })
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
    
    // Ensure we have the correct number of tiles
    if (tiles.length !== totalTiles) {
      console.error('Invalid number of tiles:', tiles.length, 'expected:', totalTiles)
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
    
    for (let i = 0; i < gridSize; i++) {
      const row: (Tile | null)[] = []
      for (let j = 0; j < gridSize; j++) {
        if (i === gridSize - 1 && j === gridSize - 1) {
          row.push(null) // The last cell is always empty
        } else {
          row.push(shuffledTiles[tileIndex++])
        }
      }
      newBoard.push(row)
    }
    // Make 200 random valid moves to shuffle the board more thoroughly
    for (let i = 0; i < 200; i++) {
      const emptyPos = findEmptyPosition(newBoard, gridSize)
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
        pos.row >= 0 && pos.row < gridSize &&
        pos.col >= 0 && pos.col < gridSize
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
    
    // Create the solution board with shuffled tiles
    const solutionTiles = shuffle([...tiles])
    const solutionBoard: (Tile | null)[][] = []
    tileIndex = 0
    
    for (let i = 0; i < gridSize; i++) {
      const row: (Tile | null)[] = []
      for (let j = 0; j < gridSize; j++) {
        if (i === gridSize - 1 && j === gridSize - 1) {
          row.push(null) // Empty tile
        } else {
          row.push(solutionTiles[tileIndex++])
        }
      }
      solutionBoard.push(row)
    }

    setBoard(newBoard)
    setSolution(solutionBoard)
    setEmptyPosition({ row: gridSize - 1, col: gridSize - 1 })
    setIsSolved(false)
  }, [gridSize, currentConfig])

  // Reinitialize when grid size changes
  useEffect(() => {
    initializeBoard()
  }, [gridSize, initializeBoard])

  // Check if puzzle is solved
  const checkPuzzleSolved = useCallback((newBoard: (Tile | null)[][]) => {
    // Check if all tiles except the last position match the solution
    const isMatchingSolution = solution.every((row, i) =>
      row.every((solutionTile, j) => {
        // Skip checking the last position
        if (i === gridSize - 1 && j === gridSize - 1) return true
        
        const currentTile = newBoard[i][j]
        // Both tiles should be null or both should have matching IDs
        return (!currentTile && !solutionTile) || (currentTile?.id === solutionTile?.id)
      })
    )

    // Check if the empty space is in the correct position
    const isEmptySpaceCorrect = !newBoard[gridSize - 1][gridSize - 1]

    // Consider the puzzle solved if all tiles match and empty space is correct
    return isMatchingSolution && isEmptySpaceCorrect
  }, [solution, gridSize])

  // Initialize on mount
  useEffect(() => {
    initializeBoard()
  }, [initializeBoard])

  // Check if a tile can be moved
  const canMoveTile = (row: number, col: number): boolean => {
    // Cannot move tile that doesn't exist or is outside the grid
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return false

    // Cannot move the empty space itself
    if (board[row][col] === null) return false

    // Check if tile is in same row or column as empty space
    const inSameRow = row === emptyPosition.row
    const inSameCol = col === emptyPosition.col
    
    // Check if tile is adjacent to empty space
    const isAdjacent = (
      (inSameRow && Math.abs(col - emptyPosition.col) === 1) ||
      (inSameCol && Math.abs(row - emptyPosition.row) === 1)
    )

    return isAdjacent
  }
  
  const moveTile = (row: number, col: number) => {
    if (!canMoveTile(row, col)) return
  
    const newBoard = board.map(row => [...row])
    const clickedTile = newBoard[row][col]
    
    // Simple swap between clicked tile and empty space
    newBoard[row][col] = null
    newBoard[emptyPosition.row][emptyPosition.col] = clickedTile
    
    setBoard(newBoard)
    setEmptyPosition({ row, col })
  
    // Check if puzzle is solved after move
    const isSolvedNow = checkPuzzleSolved(newBoard)
    setIsSolved(isSolvedNow)
  }

  // Solve all but last tile
  const solveAllButLast = () => {
    if (!solution.length) return
    
    // Create a copy of the solution board
    const newBoard = solution.map(row => row.map(tile => tile))
    
    // Swap the last two tiles
    const lastRowIndex = gridSize - 1
    const secondLastColIndex = gridSize - 2
    const lastColIndex = gridSize - 1
    
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
      
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setGridSize(3)}
            className={classNames(
              'rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-offset-2',
              gridSize === 3 ? 'bg-indigo-600' : 'bg-indigo-400 hover:bg-indigo-500'
            )}
          >
            3x3
          </button>
          <button
            onClick={() => setGridSize(4)}
            className={classNames(
              'rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-offset-2',
              gridSize === 4 ? 'bg-indigo-600' : 'bg-indigo-400 hover:bg-indigo-500'
            )}
          >
            4x4
          </button>
          <button
            onClick={() => setGridSize(5)}
            className={classNames(
              'rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-offset-2',
              gridSize === 5 ? 'bg-indigo-600' : 'bg-indigo-400 hover:bg-indigo-500'
            )}
          >
            5x5
          </button>
        </div>
        
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
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {board.map((row, rowIndex) =>
            row.map((tile, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => moveTile(rowIndex, colIndex)}
                className={classNames(
                  gridSize === 3 ? 'h-24 w-24' : gridSize === 4 ? 'h-20 w-20' : 'h-16 w-16',
                  'rounded-lg transition-all duration-200',
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
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {solution.map((row, rowIndex) =>
            row.map((tile, colIndex) => (
              <button
                key={`solution-${rowIndex}-${colIndex}`}
                className={classNames(
                  gridSize === 3 ? 'h-12 w-12' : gridSize === 4 ? 'h-10 w-10' : 'h-8 w-8',
                  'rounded-lg',
                  tile ? colorToTailwind[tile.color] : 'bg-gray-200'
                )}
                aria-label={tile ? `solution ${tile.id}` : 'Empty solution tile'}
              />
            ))
          )}
        </div>
      </div>
    </div>
    </div>
  )
}

export default SlidePuzzle