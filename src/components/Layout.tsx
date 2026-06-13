import { Outlet, Link, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `${isActive ? 'border-[#005ea2] text-[#005ea2]' : 'border-transparent text-[#565c65] hover:border-[#1b1b1b] hover:text-[#1b1b1b]'} inline-flex items-center px-1 pt-1 border-b-4 text-base font-bold transition-colors`;
  };

  return (
    <div className="min-h-screen bg-[#f8f5ec] flex flex-col">

      {/* Main Header */}
      <header className="bg-[#f8f5ec] border-b border-[#dfe1e2] shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex w-full justify-between items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <img src="/favicon.ico" alt="Prajatantra Logo" className="w-10 h-10 rounded-sm shadow-sm" />
                <span className="text-2xl font-bold font-heading text-[#112e51]">Official Prajatantra e-Voting Platform</span>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8 h-full">
                {(!localStorage.getItem('auth_token') && !localStorage.getItem('adminToken')) && (
                  <>
                    <Link to="/" className={getLinkClass('/')}>Voter Portal</Link>
                    <Link to="/admin-login" className={getLinkClass('/admin-login')}>Admin Login</Link>
                  </>
                )}
                {localStorage.getItem('auth_token') && (
                  <Link to="/voting" className={getLinkClass('/voting')}>Voting Portal</Link>
                )}
                {localStorage.getItem('adminToken') && (
                  <Link to="/admin" className={getLinkClass('/admin')}>Administration</Link>
                )}
                {(localStorage.getItem('auth_token') || localStorage.getItem('adminToken')) && (
                  <button 
                    onClick={() => {
                      localStorage.removeItem('auth_token');
                      localStorage.removeItem('adminToken');
                      window.location.href = '/';
                    }} 
                    className="text-base font-bold text-[#b50909] border-b-4 border-transparent hover:border-[#b50909] transition-colors"
                  >
                    Secure Logout
                  </button>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-6 lg:p-8 flex items-start justify-center relative z-10 pt-10">
        <div className="w-full max-w-5xl">
          <Outlet />
        </div>
      </main>

      <footer className="mt-auto py-8 px-4 border-t border-[#dfe1e2] bg-[#f8f5ec]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-[#565c65]">
            Official Prajatantra e-Voting Platform
          </p>
          <p className="text-xs text-[#565c65] mt-2">
            &copy; {new Date().getFullYear()} Government Voting Agency. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
