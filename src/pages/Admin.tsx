import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { account, contract, isLoading } = useWeb3();
  const [candidateName, setCandidateName] = useState('');
  const [candidateParty, setCandidateParty] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    // Check for admin token
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const updateStatus = (msg: string, type: string) => {
    setStatus({ message: msg, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 5000);
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateParty.trim()) {
      updateStatus('Please fill all candidate fields.', 'error');
      return;
    }

    try {
      updateStatus('Processing transaction on blockchain...', 'info');
      await contract.addCandidate(candidateName, candidateParty, { from: account });
      updateStatus('Candidate added successfully!', 'success');
      setCandidateName('');
      setCandidateParty('');
    } catch (error) {
      console.error(error);
      updateStatus('Failed to add candidate. Ensure you are the owner.', 'error');
    }
  };

  const handleSetDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      updateStatus('Please select both start and end dates.', 'error');
      return;
    }

    try {
      const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
      const endUnix = Math.floor(new Date(endDate).getTime() / 1000);
      
      updateStatus('Processing transaction on blockchain...', 'info');
      await contract.setDates(startUnix, endUnix, { from: account });
      updateStatus('Voting dates set successfully!', 'success');
    } catch (error) {
      console.error(error);
      updateStatus('Failed to set dates. Ensure you are the owner.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage election parameters and candidates.</p>
      </div>

      {status.message && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium border ${status.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : status.type === 'success' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Candidate Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add Candidate</h2>
          </div>
          
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Political Party</label>
              <input
                type="text"
                value={candidateParty}
                onChange={(e) => setCandidateParty(e.target.value)}
                placeholder="e.g. Independent"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-primary-500"
            >
              Add to Blockchain
            </button>
          </form>
        </div>

        {/* Set Dates Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Election Schedule</h2>
          </div>

          <form onSubmit={handleSetDates} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-purple-500"
            >
              Update Schedule
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Admin;
