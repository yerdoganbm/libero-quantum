import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <div className="nav-brand">🌌 Libero Test App</div>
          <div className="nav-links">
            <Link to="/" data-testid="nav-home">Home</Link>
            <Link to="/about" data-testid="nav-about">About</Link>
            <Link to="/contact" data-testid="nav-contact">Contact</Link>
            <Link to="/dashboard" data-testid="nav-dashboard">Dashboard</Link>
          </div>
        </nav>

        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>© 2026 Libero Quantum | Built for testing</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
