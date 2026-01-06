import { Link, useLocation } from 'react-router-dom';
import NewsletterSignup from './NewsletterSignup';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <Link to="/" className="logo-container">
            <img src="/logo.png" alt="Valentino Tree" className="logo-image" />
          </Link>
          <nav className="nav">
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            >
              Home
            </Link>
            <Link 
              to="/book" 
              className={location.pathname === '/book' ? 'nav-link active' : 'nav-link'}
            >
              Book Appointment
            </Link>
            <Link 
              to="/store" 
              className={location.pathname.startsWith('/store') ? 'nav-link active' : 'nav-link'}
            >
              Store
            </Link>
            <Link 
              to="/admin" 
              className={location.pathname === '/admin' ? 'nav-link active' : 'nav-link'}
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="container">
          <NewsletterSignup compact={true} />
          <p>&copy; 2025 Valentino Tree. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

