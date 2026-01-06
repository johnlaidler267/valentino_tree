import { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    active: true,
    in_stock: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const getAdminPassword = () => {
    return localStorage.getItem('adminPassword') || '';
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/store/admin/products`, {
        headers: { 'x-admin-password': getAdminPassword() }
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/store/admin/orders`, {
        headers: { 'x-admin-password': getAdminPassword() }
      });
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const loadProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      active: product.active === 1,
      in_stock: product.in_stock === 1
    });
    setActiveTab('products');
    setError('');
    setSuccess('');
  };

  const newProduct = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      active: true,
      in_stock: true
    });
    setError('');
    setSuccess('');
  };

  const saveProduct = async () => {
    if (!formData.name.trim() || !formData.price) {
      setError('Name and price are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedProduct) {
        await axios.put(
          `${API_URL}/store/admin/products/${selectedProduct.id}`,
          formData,
          { headers: { 'x-admin-password': getAdminPassword() } }
        );
        setSuccess('Product updated successfully');
      } else {
        await axios.post(
          `${API_URL}/store/admin/products`,
          formData,
          { headers: { 'x-admin-password': getAdminPassword() } }
        );
        setSuccess('Product created successfully');
        newProduct();
      }
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/store/admin/products/${id}`, {
        headers: { 'x-admin-password': getAdminPassword() }
      });
      if (selectedProduct?.id === id) {
        newProduct();
      }
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const toggleProductStatus = async (product, field) => {
    const currentValue = product[field] === 1 || product[field] === true;
    const updatedProduct = {
      ...product,
      [field]: !currentValue
    };
    try {
      await axios.put(
        `${API_URL}/store/admin/products/${product.id}`,
        {
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          image_url: updatedProduct.image_url,
          active: field === 'active' ? !currentValue : (product.active === 1),
          in_stock: field === 'in_stock' ? !currentValue : (product.in_stock === 1)
        },
        { headers: { 'x-admin-password': getAdminPassword() } }
      );
      fetchProducts();
      if (selectedProduct?.id === product.id) {
        loadProduct({
          ...product,
          active: field === 'active' ? (!currentValue ? 1 : 0) : product.active,
          in_stock: field === 'in_stock' ? (!currentValue ? 1 : 0) : product.in_stock
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      completed: '#10b981',
      failed: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="product-management">
      <div className="product-tabs">
        <button
          className={activeTab === 'products' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('products')}
        >
          Products ({products.length})
        </button>
        <button
          className={activeTab === 'orders' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('orders')}
        >
          Orders ({orders.length})
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="products-panel">
          <div className="panel-header">
            <h3>{selectedProduct ? 'Edit Product' : 'New Product'}</h3>
            <button className="btn-secondary" onClick={newProduct}>
              New Product
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="product-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="price">Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                className="form-textarea"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="image_url">Image URL</label>
              <input
                type="url"
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Active (visible in store)
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                  />
                  In Stock
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={saveProduct}
                disabled={loading}
              >
                {loading ? 'Saving...' : selectedProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>

          <div className="products-list">
            <h3>All Products</h3>
            {products.length === 0 ? (
              <p className="empty-state">No products yet. Create your first product above.</p>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="product-image" />
                    )}
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p className="product-price">${product.price.toFixed(2)}</p>
                      {product.description && (
                        <p className="product-description">{product.description}</p>
                      )}
                      <div className="product-status">
                        <span className={`status-badge ${product.active ? 'active' : 'inactive'}`}>
                          {product.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`status-badge ${product.in_stock ? 'in-stock' : 'out-of-stock'}`}>
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <div className="product-actions">
                        <button
                          className="btn-small btn-primary"
                          onClick={() => loadProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-small btn-secondary"
                          onClick={() => toggleProductStatus(product, 'active')}
                        >
                          {product.active === 1 ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn-small btn-danger"
                          onClick={() => deleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="orders-panel">
          <h3>Order History</h3>
          {orders.length === 0 ? (
            <p className="empty-state">No orders yet.</p>
          ) : (
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.product_name}</td>
                      <td>
                        <div>{order.customer_name || 'N/A'}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {order.customer_email}
                        </div>
                      </td>
                      <td>${order.amount.toFixed(2)}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;

