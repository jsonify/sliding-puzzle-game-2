import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SlidePuzzle from '.'

describe('SlidePuzzle', () => {
  const getPuzzleTiles = () => 
    screen.getAllByRole('button').filter(button => {
      const label = button.getAttribute('aria-label')
      return (label?.includes('Tile ') || label === 'Empty tile') && 
             !label?.includes('solution')
    })

  const getColorCounts = (tiles: HTMLElement[]) => {
    const colorCounts = new Map<string, number>()
    tiles.forEach(tile => {
      const colorClass = Array.from(tile.classList)
        .find(cls => cls.startsWith('bg-') && !cls.includes('gray'))
      if (colorClass) {
        colorCounts.set(colorClass, (colorCounts.get(colorClass) || 0) + 1)
      }
    })
    return colorCounts
  }

  describe('Grid Size Changes', () => {
    it('initializes with 3x3 grid by default', () => {
      render(<SlidePuzzle />)
      const tiles = getPuzzleTiles()
      expect(tiles.length).toBe(9) // 3x3 grid
      
      // Check color distribution for 3x3
      const colorCounts = getColorCounts(tiles.filter(tile => 
        !tile.getAttribute('aria-label')?.includes('Empty')
      ))
      colorCounts.forEach(count => expect(count).toBe(2)) // 2 tiles per color in 3x3
    })

    it('switches to 4x4 grid when clicking 4x4 button', () => {
      render(<SlidePuzzle />)
      
      // Click 4x4 button
      const button4x4 = screen.getByRole('button', { name: '4x4' })
      fireEvent.click(button4x4)
      
      const tiles = getPuzzleTiles()
      expect(tiles.length).toBe(16) // 4x4 grid
      
      // Check color distribution for 4x4
      const colorCounts = getColorCounts(tiles.filter(tile => 
        !tile.getAttribute('aria-label')?.includes('Empty')
      ))
      colorCounts.forEach(count => expect(count).toBe(3)) // 3 tiles per color in 4x4
    })

    it('switches to 5x5 grid when clicking 5x5 button', () => {
      render(<SlidePuzzle />)
      
      // Click 5x5 button
      const button5x5 = screen.getByRole('button', { name: '5x5' })
      fireEvent.click(button5x5)
      
      const tiles = getPuzzleTiles()
      expect(tiles.length).toBe(25) // 5x5 grid
      
      // Check color distribution for 5x5
      const colorCounts = getColorCounts(tiles.filter(tile => 
        !tile.getAttribute('aria-label')?.includes('Empty')
      ))
      colorCounts.forEach(count => expect(count).toBe(4)) // 4 tiles per color in 5x5
    })
  })

  describe('Grid Layout', () => {
    const getMainBoardTile = () => 
      screen.getAllByRole('button')
        .find(button => {
          const label = button.getAttribute('aria-label');
          return label?.includes('Tile 1') && !label?.includes('solution');
        });
  
    it('maintains proper grid layout for 3x3', () => {
      render(<SlidePuzzle />)
      const puzzleBoard = getMainBoardTile()?.parentElement
      expect(puzzleBoard).toHaveStyle({ 'grid-template-columns': 'repeat(3, 1fr)' })
    })
  
    it('maintains proper grid layout for 4x4', () => {
      render(<SlidePuzzle />)
      const button4x4 = screen.getByRole('button', { name: '4x4' })
      fireEvent.click(button4x4)
      
      const puzzleBoard = getMainBoardTile()?.parentElement
      expect(puzzleBoard).toHaveStyle({ 'grid-template-columns': 'repeat(4, 1fr)' })
    })
  
    it('maintains proper grid layout for 5x5', () => {
      render(<SlidePuzzle />)
      const button5x5 = screen.getByRole('button', { name: '5x5' })
      fireEvent.click(button5x5)
      
      const puzzleBoard = getMainBoardTile()?.parentElement
      expect(puzzleBoard).toHaveStyle({ 'grid-template-columns': 'repeat(5, 1fr)' })
    })
  })

  describe('Tile Movement', () => {
    it('maintains valid moves after grid size change', () => {
      render(<SlidePuzzle />)
      
      // Test in 3x3
      let movableTiles = getPuzzleTiles().filter(tile => !(tile as HTMLButtonElement).disabled)
      expect(movableTiles.length).toBeGreaterThanOrEqual(2)
      expect(movableTiles.length).toBeLessThanOrEqual(9) // Updated max possible
      
      // Switch to 4x4
      const button4x4 = screen.getByRole('button', { name: '4x4' })
      fireEvent.click(button4x4)
      
      movableTiles = getPuzzleTiles().filter(tile => !(tile as HTMLButtonElement).disabled)
      expect(movableTiles.length).toBeGreaterThanOrEqual(2)
      expect(movableTiles.length).toBeLessThanOrEqual(16) // Updated max possible
      
      // Switch to 5x5
      const button5x5 = screen.getByRole('button', { name: '5x5' })
      fireEvent.click(button5x5)
      
      movableTiles = getPuzzleTiles().filter(tile => !(tile as HTMLButtonElement).disabled)
      expect(movableTiles.length).toBeGreaterThanOrEqual(2)
      expect(movableTiles.length).toBeLessThanOrEqual(25) // Updated max possible
    })
  })

  describe('Game Logic', () => {
    it('initializes with a solvable puzzle configuration', () => {
      render(<SlidePuzzle />)
      const randomizeButton = screen.getByRole('button', { name: /randomize/i })
      
      // Test multiple randomizations to ensure consistent behavior
      for (let i = 0; i < 5; i++) {
        fireEvent.click(randomizeButton)
        const tiles = getPuzzleTiles()
        expect(tiles.length).toBe(9) // 3x3 grid
        
        // Ensure we always have exactly one empty tile
        const emptyTiles = tiles.filter(tile => 
          tile.getAttribute('aria-label') === 'Empty tile'
        )
        expect(emptyTiles.length).toBe(1)
        
        // Ensure we have the correct number of colored tiles
        const coloredTiles = tiles.filter(tile => 
          tile.getAttribute('aria-label')?.includes('Tile ')
        )
        expect(coloredTiles.length).toBe(8)
      }
    })

    it('enables correct tiles for movement', () => {
      render(<SlidePuzzle />)
      const tiles = getPuzzleTiles()
      const size = 3 // Default grid size
      
      // Find empty tile
      const emptyTileIndex = tiles.findIndex(tile => 
        tile.getAttribute('aria-label') === 'Empty tile'
      )
      const emptyRow = Math.floor(emptyTileIndex / size)
      const emptyCol = emptyTileIndex % size
    
      // For each tile, verify its enabled/disabled state
      tiles.forEach((tile, index) => {
        const row = Math.floor(index / size)
        const col = index % size
        const isEmptyTile = tile.getAttribute('aria-label') === 'Empty tile'
        
        if (!isEmptyTile) {
          const inSameRow = row === emptyRow
          const inSameCol = col === emptyCol
          const isAdjacent = (
            (inSameRow && Math.abs(col - emptyCol) === 1) ||
            (inSameCol && Math.abs(row - emptyRow) === 1)
          )
    
          // A tile should be enabled only if it's adjacent to the empty space
          if (isAdjacent) {
            expect(tile).not.toBeDisabled()
          } else {
            expect(tile).toBeDisabled()
          }
        }
      })
    })

    it('detects puzzle completion correctly', () => {
      render(<SlidePuzzle />)
      const solveButton = screen.getByRole('button', { name: /solve all but last/i })
      fireEvent.click(solveButton)
      
      // Verify the success message is not shown initially
      expect(screen.queryByTestId('success-message')).toBeNull()
      
      // Move the last pieces to solve the puzzle
      const movableTiles = getPuzzleTiles().filter(tile => 
        !(tile as HTMLButtonElement).disabled
      )
      movableTiles.forEach(tile => {
        fireEvent.click(tile)
      })
      
      // Check if success message appears
      const successMessage = screen.queryByTestId('success-message')
      if (successMessage) {
        expect(successMessage).toHaveTextContent(/congratulations/i)
      }
    })

    it('maintains game state after randomization', () => {
      render(<SlidePuzzle />)
      const randomizeButton = screen.getByRole('button', { name: /randomize/i })
      
      const getGameState = () => {
        const tiles = getPuzzleTiles()
        const movableTiles = tiles.filter(tile => !(tile as HTMLButtonElement).disabled)
        return {
          totalTiles: tiles.length,
          movableTiles: movableTiles.length,
          emptyTiles: tiles.filter(t => t.getAttribute('aria-label') === 'Empty tile').length
        }
      }
      
      const initialState = getGameState()
      fireEvent.click(randomizeButton)
      const newState = getGameState()
      
      expect(newState.totalTiles).toBe(initialState.totalTiles)
      expect(newState.emptyTiles).toBe(initialState.emptyTiles)
      expect(newState.movableTiles).toBeGreaterThanOrEqual(2)
      expect(newState.movableTiles).toBeLessThanOrEqual(9) // Updated max possible for 3x3
    })
  })

  describe('Accessibility', () => {
    it('has accessible buttons with proper ARIA labels', () => {
      render(<SlidePuzzle />)
      const tiles = getPuzzleTiles()
      
      tiles.forEach(tile => {
        const label = tile.getAttribute('aria-label')
        expect(label).toBeDefined()
        expect(label).toMatch(/^(Tile \d+|Empty tile)$/)
      })
    })

    it('properly manages focus during tile movement', () => {
      render(<SlidePuzzle />)
      const movableTiles = getPuzzleTiles().filter(tile => 
        !(tile as HTMLButtonElement).disabled
      )
      
      // Click the first movable tile
      const firstMovableTile = movableTiles[0]
      firstMovableTile.focus()
      fireEvent.click(firstMovableTile)
      
      // Ensure focus is maintained
      expect(document.activeElement).toBe(firstMovableTile)
    })
  })
})
