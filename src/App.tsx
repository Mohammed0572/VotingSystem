import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import VoterLogin from './pages/VoterLogin';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import Voting from './pages/Voting';
import { Web3Provider } from './context/Web3Context';

function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<VoterLogin />} />
            <Route path="admin-login" element={<AdminLogin />} />
            <Route path="admin" element={<Admin />} />
            <Route path="voting" element={<Voting />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;
