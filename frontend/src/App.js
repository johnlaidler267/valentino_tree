import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import NewsletterSignup from './components/NewsletterSignup';
import Store, { StoreSuccess, StoreCancel } from './components/Store';
import './App.css';

function Home() {
  return (
    <div className="home-container">
      <div className="container">
        <section className="hero">
          <h1>Valentino Tree</h1>
          <p className="hero-subtitle">Treecare with a vision</p>
        </section>

        <section className="services">
          <h2>Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>Tree Removal</h3>
              <p>Safe and efficient tree removal for any size tree.</p>
            </div>
            <div className="service-card">
              <h3>Tree Trimming</h3>
              <p>Professional pruning and trimming to keep your trees healthy.</p>
            </div>
            <div className="service-card">
              <h3>Stump Grinding</h3>
              <p>Complete stump removal and grinding services.</p>
            </div>
            <div className="service-card">
              <h3>Emergency Service</h3>
              <p>24/7 emergency tree removal for storm damage.</p>
            </div>
            <div className="service-card">
              <h3>Tree Health Assessment</h3>
              <p>Expert evaluation of tree health and recommendations.</p>
            </div>
            <div className="service-card">
              <h3>Consultation</h3>
              <p>Professional advice for all your tree care needs.</p>
            </div>
          </div>
        </section>

        <section className="cta">
          <h2>Ready to Get Started?</h2>
          <p>Schedule your <strong>free consultation</strong> today! Get expert advice and a no-obligation quote for all your tree care needs.</p>
          <Link to="/book?service=consultation" className="cta-button">Book Appointment</Link>
        </section>

        <section className="newsletter-section">
          <NewsletterSignup />
        </section>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<BookingForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/:id" element={<Store />} />
          <Route path="/store/success" element={<StoreSuccess />} />
          <Route path="/store/cancel" element={<StoreCancel />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
