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
      await contract.vote(selectedCandidate, { from: account });
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
    <div className="glass-panel p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Decentralized Voting Dashboard</h1>
        <p className="text-gray-600 font-medium text-lg">
          Voting Period: <span className="text-primary-600">{dates.start || 'TBA'} - {dates.end || 'TBA'}</span>
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate Name</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Party</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Votes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <tr 
                key={candidate.id} 
                className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${selectedCandidate === candidate.id ? 'bg-blue-50' : ''}`}
                onClick={() => !hasVoted && setSelectedCandidate(candidate.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {!hasVoted && (
                      <input
                        type="radio"
                        name="candidate"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3 cursor-pointer"
                        checked={selectedCandidate === candidate.id}
                        onChange={() => setSelectedCandidate(candidate.id)}
                      />
                    )}
                    <span className="font-medium text-gray-900">{candidate.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.party}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">{candidate.voteCount}</td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No candidates available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center">
        {hasVoted ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg flex items-center gap-3 w-full max-w-md shadow-sm">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="font-medium">You have already cast your vote.</span>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <button
              onClick={handleVote}
              disabled={isVoting || !selectedCandidate}
              className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex justify-center items-center gap-2"
            >
              {isVoting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing Vote...
                </>
              ) : (
                'Cast Secure Vote'
              )}
            </button>
            
            {message.text && (
              <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : message.type === 'success' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                {message.text}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 text-center border-t border-gray-100 pt-6">
        <p className="text-xs text-gray-400 font-mono bg-gray-100 inline-block px-3 py-1 rounded border border-gray-200">
          Connected Wallet: {account ? account : 'Not Connected'}
        </p>
      </div>
    </div>
  );
};

export default Voting;
