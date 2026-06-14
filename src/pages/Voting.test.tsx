import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Voting from './Voting';
import { BrowserRouter } from 'react-router-dom';

// Mock Web3 Context
const mockContract = {
  getDates: vi.fn(),
  getCountCandidates: vi.fn(),
  getCandidate: vi.fn(),
  checkVote: vi.fn(),
  vote: vi.fn(),
};

vi.mock('../context/Web3Context', () => ({
  useWeb3: () => ({
    account: '0x123',
    contract: mockContract,
    isLoading: false,
  }),
}));

// Mock Language Context
vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

describe('Voting Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'fake-token'); // Bypass redirect
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Voting />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(require('../context/Web3Context').useWeb3).mockReturnValueOnce({
      account: '0x123',
      contract: null,
      isLoading: true,
    });
    renderComponent();
    expect(screen.getByText('Connecting to Blockchain...')).toBeInTheDocument();
  });

  it('loads candidates from contract', async () => {
    mockContract.getDates.mockResolvedValue([{ toNumber: () => Math.floor(Date.now() / 1000) }, { toNumber: () => Math.floor(Date.now() / 1000) + 86400 }]);
    mockContract.getCountCandidates.mockResolvedValue({ toNumber: () => 1 });
    mockContract.getCandidate.mockResolvedValue([{ toNumber: () => 1 }, 'Alice', 'Party A', { toNumber: () => 0 }]);
    mockContract.checkVote.mockResolvedValue(false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    expect(screen.getByText('Party A')).toBeInTheDocument();
  });

  it('shows success message if user has already voted', async () => {
    mockContract.getDates.mockResolvedValue([{ toNumber: () => Math.floor(Date.now() / 1000) }, { toNumber: () => Math.floor(Date.now() / 1000) + 86400 }]);
    mockContract.getCountCandidates.mockResolvedValue({ toNumber: () => 0 });
    mockContract.checkVote.mockResolvedValue(true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('✓ You have successfully cast your official vote.')).toBeInTheDocument();
    });
  });

  it('allows voting workflow', async () => {
    mockContract.getDates.mockResolvedValue([{ toNumber: () => Math.floor(Date.now() / 1000) }, { toNumber: () => Math.floor(Date.now() / 1000) + 86400 }]);
    mockContract.getCountCandidates.mockResolvedValue({ toNumber: () => 1 });
    mockContract.getCandidate.mockResolvedValue([{ toNumber: () => 1 }, 'Alice', 'Party A', { toNumber: () => 0 }]);
    mockContract.checkVote.mockResolvedValue(false);
    mockContract.vote.mockResolvedValue(true);

    renderComponent();

    // Wait for candidate to load
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Select candidate
    fireEvent.click(screen.getByText('Alice').closest('.candidate-row')!);

    // Confirm vote
    const confirmButton = screen.getByText('voting.confirm');
    expect(confirmButton).not.toBeDisabled();
    
    // Simulate click
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockContract.vote).toHaveBeenCalledWith(1, { from: '0x123' });
    });
  });
});
