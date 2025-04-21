import { Link } from 'react-router-dom';
import '../Styles/Sidebar.css'; // Correct CSS import path

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Sophonomic</h2>
      </div>
      <nav className="sidebar-nav">
        <Link to="/home" className="nav-item">
          🏠 Dashboard
        </Link>
        <Link to="/workshop" className="nav-item">
          🧠 Financial Workshop
        </Link>
        <Link to="/profile" className="nav-item active">
          ⚙️ Profile & Settings
        </Link>
      </nav>
    </div>
  );
}