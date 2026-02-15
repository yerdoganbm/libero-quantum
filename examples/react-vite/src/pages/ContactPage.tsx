import { useState } from 'react';

export function ContactPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="page">
        <h1>Thank You!</h1>
        <p className="subtitle">Your message has been sent successfully.</p>
        <button onClick={() => setSubmitted(false)} data-testid="back-btn">
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Contact Us</h1>
      <div className="card">
        <form onSubmit={handleSubmit} data-testid="contact-form">
          <label>
            Name
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="name-input"
              required
            />
          </label>
          
          <label>
            Message
            <textarea
              placeholder="Your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="message-textarea"
              rows={5}
              required
            />
          </label>

          <button type="submit" data-testid="send-btn">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
