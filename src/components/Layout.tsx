import { Outlet, Link, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `${isActive ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col font-sans">
      <nav className="glass-panel sticky top-4 z-50 mx-4 mt-4 px-6 rounded-2xl shadow-sm border border-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between h-16">
            <div className="flex w-full justify-between items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">SecureVote</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/" className={getLinkClass('/')}>Login</Link>
                <Link to="/voting" className={getLinkClass('/voting')}>Voting Dashboard</Link>
                <Link to="/admin" className={getLinkClass('/admin')}>Admin Panel</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </div>
      </main>

      <footer className="mt-auto py-6 px-4">
        <p className="text-center text-sm text-gray-500 font-medium">
          &copy; {new Date().getFullYear()} Decentralized Voting System. Secured by Ethereum.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
