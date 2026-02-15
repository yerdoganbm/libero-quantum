import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Welcome, ${email}!`);
      navigate('/dashboard');
    }
  };

  return (
    <div className="page">
      <h1>Welcome to Libero Test App</h1>
      <p className="subtitle">Autonomous testing platform demonstration</p>

      <div className="card">
        <h2>Get Started</h2>
        <form onSubmit={handleSubmit} data-testid="signup-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email-input"
            required
          />
          <button type="submit" data-testid="submit-btn">
            Get Started →
          </button>
        </form>
      </div>

      <div className="features">
        <div className="feature">
          <h3>🗺️ Auto Mapping</h3>
          <p>Discovers your app structure automatically</p>
        </div>
        <div className="feature">
          <h3>🤖 Smart Generation</h3>
          <p>Generates intelligent test scenarios</p>
        </div>
        <div className="feature">
          <h3>🔄 Self-Healing</h3>
          <p>Fixes broken selectors automatically</p>
        </div>
      </div>
    </div>
  );
}
