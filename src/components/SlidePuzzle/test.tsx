// src/components/SlidePuzzle/test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import SlidePuzzle from '.'
import { describe, it, expect } from 'vitest'

describe('<SlidePuzzle />', () => {
  it('renders the puzzle board with correct layout', () => {
    render(<SlidePuzzle />)
    
    expect(screen.getByText('Puzzle Board')).toBeInTheDocument()
    expect(screen.getByText('Solution')).toBeInTheDocument()
    
    // Check for control buttons
    const randomizeButton = screen.getByRole('button', { name: /randomize/i })
    const solveButton = screen.getByRole('button', { name: /solve all but last/i })
    expect(randomizeButton).toBeInTheDocument()
    expect(solveButton).toBeInTheDocument()
    
    // Check for grid cells (5x5 grid = 25 cells)
    // Filter buttons to only include those with tile-related aria-labels
    const tiles = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Tile') || 
      button.getAttribute('aria-label') === 'Empty tile'
    )
    expect(tiles).toHaveLength(25)
  })

  it('allows clicking randomize button', () => {
    render(<SlidePuzzle />)
    
    const randomizeButton = screen.getByRole('button', { name: /randomize/i })
    fireEvent.click(randomizeButton)
    
    // Check that the grid is still complete after randomizing
    const tiles = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Tile') || 
      button.getAttribute('aria-label') === 'Empty tile'
    )
    expect(tiles).toHaveLength(25)
  })

  it('allows clicking solve button', () => {
    render(<SlidePuzzle />)
    
    const solveButton = screen.getByRole('button', { name: /solve all but last/i })
    fireEvent.click(solveButton)
    
    // Check that the grid is still complete after solving
    const tiles = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Tile') || 
      button.getAttribute('aria-label') === 'Empty tile'
    )
    expect(tiles).toHaveLength(25)
  })

  it('shows solution grid', () => {
    render(<SlidePuzzle />)
    
    const solutionSection = screen.getByText('Solution')
    expect(solutionSection).toBeInTheDocument()
    
    // The solution grid should be visible but not interactive
    const solutionGrid = solutionSection.parentElement
    expect(solutionGrid).toBeInTheDocument()
  })
})
