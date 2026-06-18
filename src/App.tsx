import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import VoterLogin from './pages/VoterLogin';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import Voting from './pages/Voting';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Accessibility from './pages/Accessibility';
import Contact from './pages/Contact';
import { Web3Provider } from './context/Web3Context';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Web3Provider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<VoterLogin />} />
                <Route path="admin-login" element={<AdminLogin />} />
                <Route path="admin" element={<Admin />} />
                <Route path="voting" element={<Voting />} />
                <Route path="terms" element={<Terms />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="accessibility" element={<Accessibility />} />
                <Route path="contact" element={<Contact />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </Web3Provider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

