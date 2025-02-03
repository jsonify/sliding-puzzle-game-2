// src/components/SlidePuzzle/test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import SlidePuzzle from '.'
import { describe, it, expect } from 'vitest'

describe('<SlidePuzzle />', () => {
  // Update helper functions to be more precise
  const getPuzzleTiles = () =>
    screen.getAllByRole('button').filter(button => {
      const label = button.getAttribute('aria-label')
      // Only get main puzzle tiles, not solution tiles
      return (label?.includes('Tile ') || label === 'Empty tile') && 
             !label?.includes('solution')
    })

  const getSolutionTiles = () =>
    screen.getAllByRole('button').filter(button => {
      const label = button.getAttribute('aria-label')
      return label?.includes('solution') && label !== 'Empty solution tile'
    })

  const getTileIds = (tiles: HTMLElement[]) =>
    tiles
      .map(tile => tile.getAttribute('aria-label'))
      .filter(label => label && !label.includes('Empty'))
      .map(label => parseInt(label!.replace(/\D/g, '')))

  it('initializes with a random permutation of the solution', () => {
    render(<SlidePuzzle />)
    
    // Get initial board state
    const puzzleTiles = getPuzzleTiles()
    const nonEmptyPuzzleTiles = puzzleTiles.filter(tile => 
      !tile.getAttribute('aria-label')?.includes('Empty')
    )
    const initialTileIds = getTileIds(nonEmptyPuzzleTiles)
    
    // Get solution tiles
    const solutionTiles = getSolutionTiles()
    const solutionTileIds = getTileIds(solutionTiles)
    
    // Verify counts
    expect(initialTileIds.length).toBe(24) // 25 total - 1 empty tile
    expect(solutionTileIds.length).toBe(24) // Same for solution
    
    // Sort both arrays to compare contents
    const sortedInitial = [...initialTileIds].sort((a, b) => a - b)
    const sortedSolution = [...solutionTileIds].sort((a, b) => a - b)
    
    // Verify same set of numbers
    expect(sortedInitial).toEqual(sortedSolution)
    // Verify different ordering
    expect(initialTileIds).not.toEqual(solutionTileIds)
  })

  const getMovableTiles = () => 
    getPuzzleTiles().filter(tile => !(tile as HTMLButtonElement).disabled)

  const getEmptyTile = () => 
    getPuzzleTiles().find(tile => 
      tile.getAttribute('aria-label') === 'Empty tile'
    )

  it('renders the puzzle board with correct layout', () => {
    render(<SlidePuzzle />)
    
    expect(screen.getByText('Puzzle Board')).toBeInTheDocument()
    expect(screen.getByText('Solution')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /randomize/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solve all but last/i })).toBeInTheDocument()
    expect(getPuzzleTiles()).toHaveLength(25)
  })

  it('initializes with exactly one empty tile', () => {
    render(<SlidePuzzle />)
    
    const emptyTiles = getPuzzleTiles().filter(tile => 
      tile.getAttribute('aria-label') === 'Empty tile'
    )
    
    expect(emptyTiles).toHaveLength(1)
  })

  it('allows moving tiles in same row or column as empty space', () => {
    render(<SlidePuzzle />)
    
    // There can be up to 9 movable tiles in a 5x5 grid
    // (4 in row + 4 in column + 1 at intersection)
    const movableTiles = getMovableTiles()
    expect(movableTiles.length).toBeGreaterThanOrEqual(2)
    expect(movableTiles.length).toBeLessThanOrEqual(9)
    
    // Record initial position of a movable tile
    const tileToMove = movableTiles[0]
    const initialAriaLabel = tileToMove.getAttribute('aria-label')
    
    // Move the tile
    fireEvent.click(tileToMove)
    
    // Tile should now be in a different position
    const movedTile = screen.getByLabelText(initialAriaLabel!)
    expect(movedTile).not.toBe(tileToMove)
  })

  it('prevents moving tiles not in same row/column as empty space', () => {
    render(<SlidePuzzle />)
    
    // Find non-movable tiles (those not in same row/column as empty space)
    const nonMovableTiles = getPuzzleTiles()
      .filter(tile => (tile as HTMLButtonElement).disabled)
    
    // There should be at least 16 non-movable tiles 
    // (25 total - max 8 movable - 1 empty)
    expect(nonMovableTiles.length).toBeGreaterThanOrEqual(16)
    
    // Try to click a non-movable tile
    fireEvent.click(nonMovableTiles[0])
    
    // Board state shouldn't change
    expect(getEmptyTile()).toBeInTheDocument()
    expect(nonMovableTiles[0]).toBeDisabled()
  })

  it('maintains board state after randomize', () => {
    render(<SlidePuzzle />)
    
    const randomizeButton = screen.getByRole('button', { name: /randomize/i })
    fireEvent.click(randomizeButton)
    
    expect(getPuzzleTiles()).toHaveLength(25)
    expect(getEmptyTile()).toBeInTheDocument()
    
    const movableTiles = getMovableTiles()
    expect(movableTiles.length).toBeGreaterThanOrEqual(2)
    expect(movableTiles.length).toBeLessThanOrEqual(9)
  })

  it('slides multiple tiles when clicking tile in same row as empty space', () => {
    render(<SlidePuzzle />)
    
    // First let's check what tiles we actually have after solve all but last
    const checkInitialState = () => {
      const tiles = getPuzzleTiles().slice(-5)
      const labels = tiles.map(tile => tile.getAttribute('aria-label'))
      console.log('Initial bottom row:', labels)
    }
    
    fireEvent.click(screen.getByRole('button', { name: /solve all but last/i }))
    checkInitialState()
    
    // Get all movable tiles and their positions
    const movableTiles = getMovableTiles()
    const movableLabels = movableTiles.map(tile => tile.getAttribute('aria-label'))
    console.log('Movable tiles:', movableLabels)
    
    // Get bottom row tiles
    const bottomRowTiles = getPuzzleTiles().slice(-5)
    
    // Log the current state
    const initialLabels = bottomRowTiles.map(tile => tile.getAttribute('aria-label'))
    console.log('Current bottom row:', initialLabels)
    
    // Click and log what happened
    fireEvent.click(bottomRowTiles[0])
    
    const newBottomRowTiles = getPuzzleTiles().slice(-5)
    const newLabels = newBottomRowTiles.map(tile => tile.getAttribute('aria-label'))
    console.log('After click bottom row:', newLabels)
  })

  it('maintains exactly one empty tile when sliding', () => {
    render(<SlidePuzzle />)
    
    // Get to known state
    fireEvent.click(screen.getByRole('button', { name: /solve all but last/i }))
    
    // Verify we start with exactly one empty tile
    const initialEmptyTiles = getPuzzleTiles()
      .filter(tile => tile.getAttribute('aria-label') === 'Empty tile')
    expect(initialEmptyTiles).toHaveLength(1)
    
    // Click the leftmost tile in bottom row
    const bottomRowTiles = getPuzzleTiles().slice(-5)
    fireEvent.click(bottomRowTiles[0])
    
    // Verify we still have exactly one empty tile
    const newEmptyTiles = getPuzzleTiles()
      .filter(tile => tile.getAttribute('aria-label') === 'Empty tile')
    expect(newEmptyTiles).toHaveLength(1)
  })

  it('initializes with exactly four tiles of each color', () => {
    render(<SlidePuzzle />)
    
    // Get only the main puzzle tiles (not solution tiles)
    const tiles = getPuzzleTiles()
      .filter(tile => tile.getAttribute('aria-label')?.includes('Tile '))
    
    // Get background color classes
    const colorCounts = new Map<string, number>()
    tiles.forEach(tile => {
      const colorClass = Array.from(tile.classList)
        .find(cls => cls.startsWith('bg-') && !cls.includes('gray'))
      
      if (colorClass) {
        colorCounts.set(colorClass, (colorCounts.get(colorClass) || 0) + 1)
      }
    })
    
    // Verify each color appears exactly 4 times
    colorCounts.forEach((count, color) => {
      expect(count).toBe(4)
    })
    
    // Verify we have all 6 colors
    expect(colorCounts.size).toBe(6)
  })

  it('shows success message when puzzle is solved', () => {
    render(<SlidePuzzle />)
    
    // Click "Solve All But Last" to get to a near-solved state
    fireEvent.click(screen.getByRole('button', { name: /solve all but last/i }))
    
    // Verify no success message yet
    expect(screen.queryByTestId('success-message')).not.toBeInTheDocument()
    
    // Get movable tiles
    const movableTiles = screen.getAllByRole('button')
      .filter(tile => !(tile as HTMLButtonElement).disabled)
      .filter(tile => !tile.getAttribute('aria-label')?.includes('solution'))
    
    // Move the last tile
    fireEvent.click(movableTiles[0])
    
    // Check for success message using test-id and text content
    const successMessage = screen.getByTestId('success-message')
    expect(successMessage).toBeInTheDocument()
    expect(successMessage).toHaveTextContent('Congratulations')
    expect(successMessage).toHaveTextContent('Puzzle Solved')
    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument()
  })
  
it('resets the puzzle when clicking start over', () => {
render(<SlidePuzzle />)

// Get to a solved state first
fireEvent.click(screen.getByRole('button', { name: /solve all but last/i }))
const movableTile = screen.getAllByRole('button')
    .filter(tile => !(tile as HTMLButtonElement).disabled)
    .filter(tile => !tile.getAttribute('aria-label')?.includes('solution'))[0]
fireEvent.click(movableTile)

// Wait for success state using test-id
const successMessage = screen.getByTestId('success-message')
expect(successMessage).toBeInTheDocument()
expect(successMessage).toHaveTextContent('Congratulations')

// Click start over
fireEvent.click(screen.getByRole('button', { name: /start over/i }))

// Success message should be gone
expect(screen.queryByTestId('success-message')).not.toBeInTheDocument()

// Verify the game controls are back
expect(screen.getByRole('button', { name: /randomize/i })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /solve all but last/i })).toBeInTheDocument()
})

it('properly checks puzzle completion', () => {
render(<SlidePuzzle />)

// Get to a nearly solved state
fireEvent.click(screen.getByRole('button', { name: /solve all but last/i }))

// Verify we're not in a solved state yet
expect(screen.queryByTestId('success-message')).not.toBeInTheDocument()

// Get movable tiles
const movableTiles = screen.getAllByRole('button')
    .filter(tile => !(tile as HTMLButtonElement).disabled)
    .filter(tile => !tile.getAttribute('aria-label')?.includes('solution'))

// Move the last tile
fireEvent.click(movableTiles[0])

// Now we should see the success message
const successMessage = screen.getByTestId('success-message')
expect(successMessage).toBeInTheDocument()
expect(successMessage).toHaveTextContent('Congratulations')
expect(successMessage).toHaveTextContent('Puzzle Solved')
})
})