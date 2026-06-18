import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { setLang, t } = useLanguage();
  const { role, logout } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <div className="min-h-screen bg-(--cream) flex flex-col">

      {/* Government top strip */}
      <div className="gov-top-strip">
        <div className="gov-emblem flex items-center justify-center p-0 bg-transparent border-none">
          <img src="/Logo.png" alt="GOI Logo" className="w-12 h-12 object-cover rounded-full bg-[var(--cream)] shadow-sm" />
        </div>
        <div className="gov-titles">
          <h2>{t('layout.title')}</h2>
          <p>{t('layout.desc')}</p>
        </div>
      </div>

      {/* Nav bar */}
      <div className="gov-nav flex w-full">
        <div className="flex-1 flex items-center">
          {/* Left side, empty when not logged in to balance the right side */}
          {role === 'user' && (
            <Link to="/voting" className={location.pathname === '/voting' ? 'active' : ''}>{t('layout.cast_vote')}</Link>
          )}
          {role === 'admin' && (
            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>{t('layout.admin')}</Link>
          )}
        </div>

        {!role && (
          <div className="flex justify-center items-center">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>{t('layout.voter_portal')}</Link>
            <Link to="/admin-login" className={location.pathname === '/admin-login' ? 'active' : ''}>{t('layout.admin_login')}</Link>
          </div>
        )}

        <div className="flex-1 flex justify-end items-center">
        {role && (
          <button 
            onClick={async () => {
              await logout();
              window.location.href = '/';
            }} 
            className="lang-btn"
            style={{ marginRight: '16px', borderColor: 'var(--danger)', color: '#FFE0E0' }}
          >
            {t('layout.logout')}
          </button>
        )}
        <div className="relative">
          <button 
            className="lang-btn"
            onClick={() => setShowLangMenu(!showLangMenu)}
          >
            {t('layout.btn')}
          </button>
          
          {showLangMenu && (
            <div className="absolute right-0 mt-2 py-1 w-32 bg-white rounded-md shadow-xl z-50 border border-gray-200">
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setLang('en'); setShowLangMenu(false); }}>English</button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setLang('hi'); setShowLangMenu(false); }}>हिंदी</button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setLang('kn'); setShowLangMenu(false); }}>ಕನ್ನಡ</button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { setLang('ta'); setShowLangMenu(false); }}>தமிழ்</button>
            </div>
          )}
        </div>
      </div>
      </div>

      <main id="main" className="grow flex flex-col items-center p-4 sm:p-6 lg:p-8 w-full">
        <div className="w-full max-w-5xl grow flex flex-col">
          <Outlet />
        </div>
      </main>

      <div className="gov-footer mt-auto">
        <span>© {new Date().getFullYear()} Prajatantra e-Voting Platform</span>
        <span>
          <Link to="/terms">Terms</Link> · 
          <Link to="/privacy">Privacy</Link> · 
          <Link to="/accessibility">Accessibility</Link> · 
          <Link to="/contact">Contact</Link>
        </span>
      </div>
    </div>
  );
};

export default Layout;
