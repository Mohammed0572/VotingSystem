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

const mockWeb3State = vi.hoisted(() => ({
  account: '0x123',
  contract: {
    getDates: vi.fn(),
    getCountCandidates: vi.fn(),
    getCandidate: vi.fn(),
    checkVote: vi.fn(),
    vote: vi.fn(),
  },
  isLoading: false,
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

// Mock Auth Context
const mockAuth = {
  session: { role: 'user', voter_id: 'test' },
  isCheckingSession: false,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

describe('Voting Component', () => {
  beforeEach(() => {
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
    mockWeb3State.isLoading = true;
    mockWeb3State.contract = null as any;
    renderComponent();
    expect(screen.getByText('Connecting to Blockchain...')).toBeInTheDocument();
  });

  it('loads candidates from contract', async () => {
    mockWeb3State.isLoading = false;
    mockWeb3State.contract = {
      getDates: vi.fn().mockResolvedValue([{ toNumber: () => Math.floor(Date.now() / 1000) }, { toNumber: () => Math.floor(Date.now() / 1000) + 86400 }]),
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
    mockWeb3State.isLoading = false;
    mockWeb3State.contract = {
      getDates: vi.fn().mockResolvedValue([{ toNumber: () => Math.floor(Date.now() / 1000) }, { toNumber: () => Math.floor(Date.now() / 1000) + 86400 }]),
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
    mockWeb3State.isLoading = false;
    const mockVote = vi.fn().mockResolvedValue(true);
    mockWeb3State.contract = {
      getDates: vi.fn().mockResolvedValue([{ toNumber: () => Math.floor(Date.now() / 1000) }, { toNumber: () => Math.floor(Date.now() / 1000) + 86400 }]),
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
