import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Voting from './pages/Voting';
import { Web3Provider } from './context/Web3Context';

function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Login />} />
            <Route path="admin" element={<Admin />} />
            <Route path="voting" element={<Voting />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;
