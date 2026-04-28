import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders the BuggyBooks glass navigation bar', () => {
    render(<App />);
    
    // Check if the brand title renders correctly
    const brandElement = screen.getByRole('heading', { name: /buggybooks/i });
    expect(brandElement).toBeInTheDocument();
    expect(brandElement).toHaveClass('nav-brand');
    
    // Check if the navigation links are present
    const catalogLink = screen.getByRole('link', { name: /catalog/i });
    const loginLink = screen.getByRole('link', { name: /login/i });
    
    expect(catalogLink).toBeInTheDocument();
    expect(loginLink).toBeInTheDocument();
  });
});
