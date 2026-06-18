import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Voting from './Voting';
import { BrowserRouter } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
const { mockContract } = vi.hoisted(() => ({
  mockContract: {
    getDates: vi.fn(),
    getCountCandidates: vi.fn(),
    getCandidate: vi.fn(),
    checkVote: vi.fn(),
    vote: vi.fn(),
  }
}));

// Mock Web3 Context
vi.mock('../context/Web3Context', () => {
  return {
    useWeb3: vi.fn().mockReturnValue({
      account: '0x123',
      contract: mockContract,
      isLoading: false,
      web3: null,
    }),
  };
});

// Mock Language Context
vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    role: 'user',
    voter_id: 'VTR-123',
    setAuth: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('Voting Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Voting />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(useWeb3).mockReturnValueOnce({
      account: '0x123',
      contract: null,
      isLoading: true,
      web3: null,
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
