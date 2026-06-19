import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Voting from './Voting';
import { BrowserRouter } from 'react-router-dom';

const mockWeb3State = vi.hoisted(() => ({
  account: '0x123',
  contract: {
    getElectionState: vi.fn().mockResolvedValue({ toNumber: () => 1 }), // Active
    getCountCandidates: vi.fn(),
    getCandidate: vi.fn(),
    checkVote: vi.fn(),
    vote: vi.fn(),
  },
  isLoading: false,
  web3: null,
}));

vi.mock('../context/Web3Context', () => ({
  useWeb3: () => mockWeb3State,
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
    // Reset to Active state before each test
    mockWeb3State.isLoading = false;
    mockWeb3State.contract = {
      getElectionState: vi.fn().mockResolvedValue({ toNumber: () => 1 }),
      getCountCandidates: vi.fn(),
      getCandidate: vi.fn(),
      checkVote: vi.fn(),
      vote: vi.fn(),
    };
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Voting />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    mockWeb3State.isLoading = true;
    mockWeb3State.contract = null as any;
    renderComponent();
    expect(screen.getByText('Connecting to Blockchain...')).toBeInTheDocument();
  });

  it('loads candidates from contract', async () => {
    mockWeb3State.contract = {
      getElectionState: vi.fn().mockResolvedValue({ toNumber: () => 1 }),
      getCountCandidates: vi.fn().mockResolvedValue({ toNumber: () => 1 }),
      getCandidate: vi.fn().mockResolvedValue([{ toNumber: () => 1 }, 'Alice', 'Party A', { toNumber: () => 0 }]),
      checkVote: vi.fn().mockResolvedValue(false),
      vote: vi.fn(),
    };

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    expect(screen.getByText('Party A')).toBeInTheDocument();
  });

  it('shows success message if user has already voted', async () => {
    mockWeb3State.contract = {
      getElectionState: vi.fn().mockResolvedValue({ toNumber: () => 1 }),
      getCountCandidates: vi.fn().mockResolvedValue({ toNumber: () => 0 }),
      getCandidate: vi.fn(),
      checkVote: vi.fn().mockResolvedValue(true),
      vote: vi.fn(),
    };

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('✓ You have successfully cast your official vote.')).toBeInTheDocument();
    });
  });

  it('allows voting workflow', async () => {
    const mockVote = vi.fn().mockResolvedValue(true);
    mockWeb3State.contract = {
      getElectionState: vi.fn().mockResolvedValue({ toNumber: () => 1 }),
      getCountCandidates: vi.fn().mockResolvedValue({ toNumber: () => 1 }),
      getCandidate: vi.fn().mockResolvedValue([{ toNumber: () => 1 }, 'Alice', 'Party A', { toNumber: () => 0 }]),
      checkVote: vi.fn().mockResolvedValue(false),
      vote: mockVote,
    };

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
      expect(mockVote).toHaveBeenCalledWith(1, { from: '0x123' });
    });
  });
});
