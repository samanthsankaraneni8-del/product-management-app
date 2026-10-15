import { useState } from 'react';

const AUTH_URL = '/api/auth';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          'The server returned an invalid response. Please try again.'
        );
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (!data.token || !data.user) {
        throw new Error('The server response is missing login information.');
      }

      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Could not connect to the server. Check that the backend is running.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '80px auto',
        padding: '25px',
        fontFamily: 'Arial, sans-serif',
        border: '1px solid #ddd',
        borderRadius: '10px',
      }}
    >
      <h1>Product Management</h1>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px',
            margin: '8px 0 18px',
          }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px',
            margin: '8px 0 18px',
          }}
        />

        {error && (
          <p style={{ color: 'red' }} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;
