import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { t } = useLanguage();
  const { role } = useAuth();
  const { account, contract, isLoading } = useWeb3();
  const [candidateName, setCandidateName] = useState('');
  const [candidateParty, setCandidateParty] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const navigate = useNavigate();
  const { session, isCheckingSession } = useAuth();

  useEffect(() => {
    // Check for admin token via AuthContext
    if (isCheckingSession) return;
    if (!session || session.role !== 'admin') {
      navigate('/');
    }
  }, [navigate, session, isCheckingSession]);

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
    <div className="gov-panel p-6 sm:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold font-heading text-[#112e51]">{t('admin.title')}</h1>
        <p className="text-[#565c65] mt-2">{t('admin.subtitle')}</p>
      </div>

      {status.message && (
        <div className={`mb-6 ${status.type === 'error' ? 'gov-alert-error' : status.type === 'success' ? 'gov-alert-success' : 'gov-alert-info'} rounded-sm`}>
          <strong>Status:</strong> {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Candidate Form */}
        <div className="bg-cream p-6 rounded-sm border border-[#dfe1e2]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#005ea2] text-white rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            </div>
            <h2 className="text-xl font-bold font-heading text-[#112e51]">{t('admin.reg_candidate')}</h2>
          </div>
          
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div>
              <label className="gov-input-label" htmlFor="candidateName">{t('admin.cand_name')}</label>
              <input
                id="candidateName"
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. John Doe"
                className="gov-input"
              />
            </div>
            <div>
              <label className="gov-input-label" htmlFor="candidateParty">{t('admin.cand_party')}</label>
              <input
                id="candidateParty"
                type="text"
                value={candidateParty}
                onChange={(e) => setCandidateParty(e.target.value)}
                placeholder="e.g. Independent"
                className="gov-input"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="gov-button"
              >
                {t('admin.add_btn')}
              </button>
            </div>
          </form>
        </div>

        {/* Set Dates Form */}
        <div className="bg-cream p-6 rounded-sm border border-[#dfe1e2]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#005ea2] text-white rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-xl font-bold font-heading text-[#112e51]">{t('admin.schedule')}</h2>
          </div>

          <form onSubmit={handleSetDates} className="space-y-4">
            <div>
              <label className="gov-input-label" htmlFor="startDate">{t('admin.start_date')}</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="gov-input"
              />
            </div>
            <div>
              <label className="gov-input-label" htmlFor="endDate">{t('admin.end_date')}</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="gov-input"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="gov-button"
              >
                {t('admin.update_btn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Admin;
