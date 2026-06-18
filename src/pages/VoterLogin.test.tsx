import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VoterLogin from './VoterLogin';
import { BrowserRouter } from 'react-router-dom';

// Mock Language Context
vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Auth Context
const mockAuth = {
  setAuth: vi.fn(),
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

describe('VoterLogin Component', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <VoterLogin />
      </BrowserRouter>
    );
  };

  it('renders login form correctly', () => {
    renderComponent();
    expect(screen.getByLabelText('voter.id_label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'voter.enable_cam' })).toBeInTheDocument();
  });

  it('validates invalid paste input', () => {
    renderComponent();
    const input = screen.getByLabelText('voter.id_label');
    
    // Simulate paste with invalid characters
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.assign(pasteEvent, {
      clipboardData: {
        getData: () => 'INVALID_ID_WITH_SPECIAL_CHARS!@#'
      }
    });
    
    fireEvent(input, pasteEvent);
    
    // Check if error message is shown
    expect(screen.getByText(/Invalid paste format or length exceeded/i)).toBeInTheDocument();
  });

  it('allows valid paste input', () => {
    renderComponent();
    const input = screen.getByLabelText('voter.id_label') as HTMLInputElement;
    
    // Simulate paste with valid characters
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.assign(pasteEvent, {
      clipboardData: {
        getData: () => 'VTR-84291'
      }
    });
    
    fireEvent(input, pasteEvent);
    
    // Check if error message is NOT shown for valid paste
    expect(screen.queryByText(/Invalid paste format or length exceeded/i)).not.toBeInTheDocument();
  });
});
