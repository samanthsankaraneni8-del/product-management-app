
import { useState, useEffect } from 'react';
import Login from './Login';

const API_URL = '/api/products';

function getHeaders() {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? { loggedIn: true } : null;
  });

  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle expired or invalid tokens
  function handleUnauthorized() {
    localStorage.removeItem('token');
    setUser(null);
    setProducts([]);
    setError('Your session has expired. Please log in again.');
  }

  // Load products from the backend
  async function fetchProducts() {
    if (!localStorage.getItem('token')) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setError(error.message || 'Could not load products.');
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load products after login
  useEffect(() => {
    if (user) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [user]);

  // Add or update a product
  async function saveProduct(event) {
    event.preventDefault();

    if (
      !name.trim() ||
      price === '' ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      alert('Enter a product name and a valid price.');
      return;
    }

    const isEditing = editingId !== null;
    const url = isEditing ? `${API_URL}/${editingId}` : API_URL;

    try {
      setError('');

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price)
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed: ${response.status}`);
      }

      cancelEdit();
      await fetchProducts();
    } catch (error) {
      setError(error.message || 'Could not save the product.');
      console.error('Save product error:', error);
    }
  }

  // Fill the form for editing
  function editProduct(product) {
    setName(product.name);
    setPrice(String(product.price));
    setEditingId(product.id);
  }

  // Clear the form
  function cancelEdit() {
    setName('');
    setPrice('');
    setEditingId(null);
  }

  // Delete a product
  async function deleteProduct(id) {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setError('');

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed: ${response.status}`);
      }

      if (String(editingId) === String(id)) {
        cancelEdit();
      }

      await fetchProducts();
    } catch (error) {
      setError(error.message || 'Could not delete the product.');
      console.error('Delete product error:', error);
    }
  }

  // Log out
  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setProducts([]);
    cancelEdit();
    setError('');
  }

  // Show login page when logged out
  if (!user) {
    return <Login onLogin={() => setUser({ loggedIn: true })} />;
  }

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <h1>Product Management App</h1>

      <button
        type="button"
        onClick={logout}
        style={{ marginBottom: '20px' }}
      >
        Logout
      </button>

      <h2>{editingId !== null ? 'Edit Product' : 'Add Product'}</h2>

      <form
        onSubmit={saveProduct}
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '25px'
        }}
      >
        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />

        <button type="submit">
          {editingId !== null ? 'Update Product' : 'Add Product'}
        </button>

        {editingId !== null && (
          <button type="button" onClick={cancelEdit}>
            Cancel
          </button>
        )}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Products</h2>
      <p>Total products: {products.length}</p>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 && !error ? (
        <p>No products available. Add your first product!</p>
      ) : (
        products.map((product) => (
          <div
            key={product.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '12px'
            }}
          >
            <h3>{product.name}</h3>
            <p>Price: ${Number(product.price).toFixed(2)}</p>

            <button
              type="button"
              onClick={() => editProduct(product)}
              style={{ marginRight: '8px' }}
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => deleteProduct(product.id)}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default App;
