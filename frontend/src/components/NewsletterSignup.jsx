import { useState } from 'react';
import axios from 'axios';
import './NewsletterSignup.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NewsletterSignup = ({ compact = false }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/newsletter/subscribe`, {
        email,
        name: name || null
      });

      setStatus({ 
        type: 'success', 
        message: response.data.message || 'Successfully subscribed to newsletter!'
      });
      setEmail('');
      setName('');
    } catch (error) {
      setStatus({ 
        type: error.response?.data?.alreadySubscribed ? 'info' : 'error',
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to subscribe. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div className="newsletter-signup-compact">
        <form onSubmit={handleSubmit} className="newsletter-form-compact">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="newsletter-input-compact"
          />
          <button 
            type="submit" 
            className="newsletter-btn-compact"
            disabled={isSubmitting}
          >
            {isSubmitting ? '...' : 'Subscribe'}
          </button>
        </form>
        {status && (
          <div className={`newsletter-alert newsletter-alert-${status.type}`}>
            {status.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="newsletter-signup">
      <h3>Stay Connected</h3>
      <p>Subscribe to our newsletter for tree care tips, seasonal advice, and special offers.</p>
      <form onSubmit={handleSubmit} className="newsletter-form">
        <div className="newsletter-form-group">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="newsletter-input"
          />
        </div>
        <div className="newsletter-form-group">
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="newsletter-input"
          />
        </div>
        <button 
          type="submit" 
          className="newsletter-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Subscribing...' : 'Subscribe to Newsletter'}
        </button>
      </form>
      {status && (
        <div className={`newsletter-alert newsletter-alert-${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
};

export default NewsletterSignup;

