import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home', () => {
  it('renders the Home component', () => {
    render(<Home />)
    
    // Check if the main heading "SmartTrack" is present in the document
    const heading = screen.getByRole('heading', { 
      level: 1,
      name: /SmartTrack/i
    })
    expect(heading).toBeInTheDocument()
  })

  it('renders the main content with SmartTrack branding', () => {
    render(<Home />)
    
    // Check for the main "SmartTrack" text in the navigation
    const navBranding = screen.getAllByText('SmartTrack')
    expect(navBranding.length).toBeGreaterThan(0)
  })
})
