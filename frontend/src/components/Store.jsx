import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Store.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Store = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    } else {
      fetchProducts();
    }

    // Check for success page
    const sessionId = searchParams.get('session_id');
    if (sessionId && window.location.pathname.includes('/success')) {
      // Payment successful
      setError('');
    }
  }, [id, searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/store/products`);
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async (productId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/store/products/${productId}`);
      setSelectedProduct(response.data);
    } catch (err) {
      setError('Product not found');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async (product) => {
    setCheckoutLoading(true);
    setError('');

    try {
      // Get customer email (could be from a form, but for simplicity, we'll prompt)
      const customerEmail = prompt('Please enter your email address:');
      if (!customerEmail) {
        setCheckoutLoading(false);
        return;
      }

      const customerName = prompt('Please enter your name (optional):') || '';

      const response = await axios.post(`${API_URL}/store/checkout`, {
        productId: product.id,
        customerEmail,
        customerName
      });

      // Redirect to checkout (Stripe or mock success page)
      if (response.data.url) {
        // If it's a mock response, it will redirect to success page directly
        window.location.href = response.data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start checkout');
      setCheckoutLoading(false);
    }
  };

  if (id && selectedProduct) {
    // Product detail page
    return (
      <div className="store-container">
        <div className="container">
          <button className="back-btn" onClick={() => navigate('/store')}>
            ← Back to Store
          </button>
          {error && <div className="alert alert-error">{error}</div>}
          {loading ? (
            <div className="loading">Loading product...</div>
          ) : (
            <div className="product-detail">
              <div className="product-detail-image">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} />
                ) : (
                  <div className="product-placeholder">No Image</div>
                )}
              </div>
              <div className="product-detail-info">
                <h1>{selectedProduct.name}</h1>
                <p className="product-detail-price">${selectedProduct.price.toFixed(2)}</p>
                {selectedProduct.description && (
                  <div className="product-detail-description">
                    <h3>Description</h3>
                    <p>{selectedProduct.description}</p>
                  </div>
                )}
                <button
                  className="buy-now-btn"
                  onClick={() => handleBuyNow(selectedProduct)}
                  disabled={checkoutLoading || !selectedProduct.in_stock}
                >
                  {checkoutLoading
                    ? 'Processing...'
                    : selectedProduct.in_stock
                    ? 'Buy Now'
                    : 'Out of Stock'}
                </button>
                {!selectedProduct.in_stock && (
                  <p className="out-of-stock-message">This product is currently out of stock.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Product listing page
  return (
    <div className="store-container">
      <div className="container">
        <div className="store-header">
          <h1>Store</h1>
          <p>Browse our selection of products</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-store">
            <p>No products available at the moment.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="product-image"
                    onClick={() => navigate(`/store/${product.id}`)}
                  />
                ) : (
                  <div
                    className="product-placeholder"
                    onClick={() => navigate(`/store/${product.id}`)}
                  >
                    No Image
                  </div>
                )}
                <div className="product-card-info">
                  <h3 onClick={() => navigate(`/store/${product.id}`)}>{product.name}</h3>
                  <p className="product-card-price">${product.price.toFixed(2)}</p>
                  {product.description && (
                    <p className="product-card-description">
                      {product.description.substring(0, 100)}
                      {product.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  <button
                    className="buy-now-btn-small"
                    onClick={() => handleBuyNow(product)}
                    disabled={checkoutLoading || !product.in_stock}
                  >
                    {checkoutLoading
                      ? 'Processing...'
                      : product.in_stock
                      ? 'Buy Now'
                      : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Success page component
export const StoreSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="store-container">
      <div className="container">
        <div className="success-page">
          <div className="success-icon">✓</div>
          <h1>Payment Successful!</h1>
          <p>Thank you for your purchase. Your order has been confirmed.</p>
          {sessionId && <p className="session-id">Session ID: {sessionId}</p>}
          <button className="back-to-store-btn" onClick={() => window.location.href = '/store'}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

// Cancel page component
export const StoreCancel = () => {
  return (
    <div className="store-container">
      <div className="container">
        <div className="cancel-page">
          <h1>Payment Cancelled</h1>
          <p>Your payment was cancelled. No charges were made.</p>
          <button className="back-to-store-btn" onClick={() => window.location.href = '/store'}>
            Back to Store
          </button>
        </div>
      </div>
    </div>
  );
};

export default Store;

