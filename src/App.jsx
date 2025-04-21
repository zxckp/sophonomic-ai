import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Workshop from './pages/Workshop';
import Profile from './pages/Profile';
import Saving from './pages/Saving';  // Add this import
import './Styles/App.css';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/workshop" element={<Workshop />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/import" element={<Saving />} />  {/* Add this route */}
      </Routes>
    </div>
  );
}

export default App;