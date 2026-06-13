import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';

interface Candidate {
  id: number;
  name: string;
  party: string;
  voteCount: number;
}

const Voting = () => {
  const { account, contract, isLoading } = useWeb3();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/');
      return;
    }

    if (contract) {
      loadVotingData();
    }
  }, [contract, navigate]);

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

  const handleVote = async () => {
    if (!selectedCandidate) {
      setMessage({ text: 'Please select a candidate first.', type: 'error' });
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Connecting to Blockchain...</p>
      </div>
    );
  }

  return (
    <div className="gov-panel p-6 sm:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold font-heading text-[#112e51] mb-3">Official Voting Dashboard</h1>
        <p className="text-[#565c65] text-lg">
          Active Voting Period: <strong className="text-[#1b1b1b]">{dates.start || 'TBA'} - {dates.end || 'TBA'}</strong>
        </p>
      </div>

      <div className="bg-[#f8f5ec] rounded-sm border border-[#dfe1e2] overflow-hidden mb-8">
        <table className="min-w-full">
          <thead>
            <tr>
              <th scope="col" className="gov-table-header">Candidate Name</th>
              <th scope="col" className="gov-table-header">Political Party</th>
              <th scope="col" className="gov-table-header">Total Votes</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr 
                key={candidate.id} 
                className={`hover:bg-[#f8f5ec] transition-colors cursor-pointer ${selectedCandidate === candidate.id ? 'bg-[#e1f3f8]' : ''}`}
                onClick={() => !hasVoted && setSelectedCandidate(candidate.id)}
              >
                <td className="gov-table-cell">
                  <div className="flex items-center">
                    {!hasVoted && (
                      <input
                        type="radio"
                        name="candidate"
                        className="h-5 w-5 text-[#005ea2] focus:ring-[#005ea2] border-[#565c65] mr-4 cursor-pointer"
                        checked={selectedCandidate === candidate.id}
                        onChange={() => setSelectedCandidate(candidate.id)}
                      />
                    )}
                    <span className="font-bold text-[#1b1b1b]">{candidate.name}</span>
                  </div>
                </td>
                <td className="gov-table-cell text-[#565c65]">{candidate.party}</td>
                <td className="gov-table-cell font-bold text-[#112e51]">{candidate.voteCount}</td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-[#565c65] font-medium">No candidates are currently registered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center">
        {hasVoted ? (
          <div className="gov-alert-success flex items-center gap-3 w-full max-w-md rounded-sm">
            <svg className="w-6 h-6 text-[#00a91c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="font-bold">You have successfully cast your official vote.</span>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <button
              onClick={handleVote}
              disabled={isVoting || !selectedCandidate}
              className="gov-button disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isVoting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : (
                'Cast Official Vote'
              )}
            </button>
            
            {message.text && (
              <div className={`mt-4 ${message.type === 'error' ? 'gov-alert-error' : message.type === 'success' ? 'gov-alert-success' : 'gov-alert-info'} rounded-sm`}>
                <strong>Status:</strong> {message.text}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 text-center border-t border-[#dfe1e2] pt-6">
        <p className="text-sm text-[#565c65] bg-[#f8f5ec] inline-block px-4 py-2 border border-[#dfe1e2] rounded-sm">
          <strong>Blockchain Identity:</strong> {account ? account : 'Not Connected'}
        </p>
      </div>
    </div>
  );
};

export default Voting;
