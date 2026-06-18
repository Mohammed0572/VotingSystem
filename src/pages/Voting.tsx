import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Candidate {
  id: number;
  name: string;
  party: string;
  voteCount: number;
}

const Voting = () => {
  const { t } = useLanguage();
  const { role } = useAuth();
  const { account, contract, isLoading } = useWeb3();
  const { session, isCheckingSession } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for the session cookie check to finish before redirecting
    if (isCheckingSession) return;
    if (!session) {
      navigate('/');
      return;
    }

    if (contract) {
      loadVotingData();
    }
  }, [contract, navigate, session, isCheckingSession]);

  const loadVotingData = async () => {
    try {
      const datesResult = await contract.getDates();
      setDates({
        start: new Date(datesResult[0].toNumber() * 1000).toDateString(),
        end: new Date(datesResult[1].toNumber() * 1000).toDateString()
      });

      const count = await contract.getCountCandidates();
      const candidatesArray = [];
      for (let i = 1; i <= count.toNumber(); i++) {
        const data = await contract.getCandidate(i);
        candidatesArray.push({
          id: data[0].toNumber(),
          name: data[1],
          party: data[2],
          voteCount: data[3].toNumber()
        });
      }
      setCandidates(candidatesArray);

      const voted = await contract.checkVote({ from: account });
      setHasVoted(voted);
    } catch (error) {
      console.error("Error loading voting data:", error);
    }
  };

  // Generate NOTA pseudo-candidate if candidates loaded
  const displayCandidates = [...candidates];
  if (candidates.length > 0) {
    displayCandidates.push({ id: 9999, name: 'NOTA', party: 'None of the Above', voteCount: 0 });
  }

  const handleVote = async () => {
    if (isVoting || hasVoted) return;

    if (!selectedCandidate) {
      setMessage({ text: 'Please select a candidate first.', type: 'error' });
      return;
    }

    const isValidCandidate = displayCandidates.some(c => c.id === selectedCandidate);
    if (!isValidCandidate) {
      setMessage({ text: 'Invalid candidate selected.', type: 'error' });
      return;
    }

    setIsVoting(true);
    setMessage({ text: 'Waiting for blockchain confirmation...', type: 'info' });

    try {
      await contract.vote(Number(selectedCandidate), { from: account });
      setHasVoted(true);
      setMessage({ text: 'Your vote has been successfully cast!', type: 'success' });
      await loadVotingData(); // Refresh counts
    } catch (error) {
      console.error("Voting error:", error);
      setMessage({ text: 'Error casting vote. You may have already voted or the transaction failed.', type: 'error' });
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grow flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-india-blue mb-4"></div>
        <p className="text-text-secondary font-medium">Connecting to Blockchain...</p>
      </div>
    );
  }


  return (
    <div className="w-full">
      {/* Hero banner */}
      <div className="hero-banner rounded-lg mb-6">
        <div className="hero-text">
          <h1>{t('voting.title')}<br/>{t('voting.subtitle')}</h1>
          <p>Your vote is encrypted, stored on the Ethereum blockchain, and cannot be altered. Biometric verification is required before casting your vote.</p>
          <span className="voter-id">VOTER ID: KA/24/038 — Verified ✓</span>
        </div>
        <div className="hero-graphic">🗳️</div>
      </div>

      {/* Main content grid */}
      <div className="main-content p-0!">
        
        {/* Sidebar */}
        <div>
          <div className="sidebar-card">
            <div className="sidebar-card-head">Navigation</div>
            <div className="sidebar-item active">
              <div className="sidebar-icon">🗳</div> Cast Your Vote
            </div>
            <div className="sidebar-item">
              <div className="sidebar-icon">🪪</div> Voter Profile
            </div>
            <div className="sidebar-item">
              <div className="sidebar-icon">📍</div> Polling Booth
            </div>
            <div className="sidebar-item">
              <div className="sidebar-icon">📄</div> Instructions
            </div>
            <div className="sidebar-item">
              <div className="sidebar-icon">☎</div> Helpline 1950
            </div>
          </div>

          <div className="status-card">
            <div className="status-head">Session Status</div>
            <div className="status-body">
              <div className="status-row"><span>Biometric</span><span className="val">✓ Verified</span></div>
              <div className="status-row"><span>Wallet</span><span className="val">{account ? 'Connected' : 'Disconnected'}</span></div>
              <div className="status-row"><span>Network</span><span className="val">Local Ganache</span></div>
              <div className="status-row"><span>Session</span><span className="val">14:59 left</span></div>
              <div className="status-row"><span>Voted</span><span className="val">{hasVoted ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
        </div>

        {/* Voting card */}
        <div className="vote-card flex flex-col">
          <div className="vote-card-head">
            <div>
              <h3>{t('voting.cand_name')}</h3>
              <p>Active Period: {dates.start || 'TBA'} - {dates.end || 'TBA'}</p>
            </div>
            <div className="step-pill">STEP 1 OF 3</div>
          </div>
          <div className="progress-bar"><div className="progress-fill"></div></div>

          <div className="vote-body flex-1">
            <h4>Registered Candidates</h4>
            
            {displayCandidates.length === 0 ? (
              <p className="text-text-secondary py-8 text-center">No candidates are currently registered.</p>
            ) : (
              displayCandidates.map((candidate, index) => (
                <div 
                  key={candidate.id} 
                  className={`candidate-row ${selectedCandidate === candidate.id ? 'selected' : ''}`}
                  onClick={() => !hasVoted && setSelectedCandidate(candidate.id)}
                >
                  <div className="radio-outer"><div className="radio-inner"></div></div>
                  <div className="cand-symbol">{candidate.id === 9999 ? '🌻' : '👤'}</div>
                  <div className="cand-info">
                    <div className="name">{candidate.name}</div>
                    <div className="party">{candidate.party}</div>
                    <div className="constit">{candidate.id === 9999 ? 'As per EC directive' : `Constituency ID · S/N 00${index + 1}`}</div>
                  </div>
                  <div className="cand-no">{candidate.id === 9999 ? '—' : (index + 1).toString().padStart(2, '0')}</div>
                </div>
              ))
            )}

            {hasVoted && (
              <div className="p-4 mb-6 rounded-sm bg-india-green-light border-l-4 border-india-green text-india-green font-bold text-center">
                ✓ You have successfully cast your official vote.
              </div>
            )}
            
            {message.text && !hasVoted && (
              <div className={`mt-6 p-4 rounded-md font-bold text-center flex items-center justify-center gap-3 ${message.type === 'error' ? 'bg-[#FFF5F5] text-danger border border-danger' : 'bg-india-blue-lt text-india-blue border border-india-blue'}`}>
                {isVoting && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-india-blue"></div>}
                {message.text}
              </div>
            )}
          </div>

          <div className="vote-footer mt-auto">
            <p className="disclaimer">Once submitted, your vote is recorded on the blockchain and cannot be changed. Ensure your selection is correct before proceeding.</p>
            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedCandidate(null)}
                disabled={hasVoted || isVoting}
              >
                Reset
              </button>
              <button 
                className="btn-primary"
                onClick={handleVote}
                disabled={hasVoted || isVoting || !selectedCandidate}
              >
                {isVoting ? t('voter.processing') : t('voting.confirm')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Voting;
