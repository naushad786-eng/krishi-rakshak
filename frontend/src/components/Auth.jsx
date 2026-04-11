import { useState } from 'react';
import axios from 'axios';

export default function Auth({ onSuccessfulAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // New state variables for handling loading and errors
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- REAL LOGIN LOGIC ---
        const response = await axios.post('http://127.0.0.1:8000/login', {
          email: email,
          password: password
        });
        
        // Save the digital ID card (JWT token) in the browser's local storage
        localStorage.setItem('krishi_token', response.data.access_token);
        
        // Tell the App component we successfully logged in!
        onSuccessfulAuth(); 

      } else {
        // --- REAL REGISTRATION LOGIC ---
        await axios.post('http://127.0.0.1:8000/register', {
          name: name,
          email: email,
          password: password
        });
        
        // If successful, show a message and flip back to the login screen
        setSuccessMsg('Registration successful! Please sign in.');
        setIsLogin(true);
        setPassword(''); // Clear the password for security
      }
    } catch (err) {
      // Catch any 400 or 403 errors from FastAPI and display them
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Cannot connect to the server. Is FastAPI running?');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-green-100">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-green-800">Krishi-Rakshak</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Register as a new farmer'}
          </p>
        </div>

        {/* Display Error Messages */}
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* Display Success Messages */}
        {successMsg && (
          <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md border border-green-200">
            {successMsg}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Ramesh Kumar"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="farmer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 text-white rounded-md transition-colors ${
              isLoading ? 'bg-green-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMsg('');
            }}
            className="text-sm text-green-600 hover:text-green-500 hover:underline focus:outline-none"
          >
            {isLogin 
              ? "Don't have an account? Register here." 
              : "Already have an account? Sign in."}
          </button>
        </div>

      </div>
    </div>
  );
}