import React, { useState } from 'react';
import axios from 'axios';

export default function Auth({ onSuccessfulAuth }) {
  // --- YOUR EXISTING LOGIC REMAINS UNTOUCHED ---
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
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
        const response = await axios.post('http://127.0.0.1:8000/login', {
          email: email,
          password: password
        });
        if(response.data) {
           onSuccessfulAuth(); 
        }
      } else {
        const response = await axios.post('http://127.0.0.1:8000/register', {
          name: name,
          email: email,
          password: password
        });
        setSuccessMsg("Registration successful! Please sign in.");
        setIsLogin(true); 
      }
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // FULL SCREEN BACKGROUND WRAPPER
    <div 
      className="min-h-screen w-full font-sans relative flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1920&auto=format&fit=crop')" 
      }}
    >
      {/* DEEP GREEN/BLACK OVERLAY TO UNIFY THE PAGE */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950/90 via-green-900/80 to-black/70"></div>
      
      {/* MAIN CONTENT CONTAINER */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 py-12">
        
        {/* LEFT SIDE - Floating Text */}
        <div className="flex-1 text-white flex flex-col justify-center">
          <h1 className="text-5xl lg:text-6xl font-extrabold mb-4 tracking-wide text-green-400 drop-shadow-lg">
            Krishi-Rakshak
          </h1>
          <h2 className="text-3xl lg:text-4xl font-semibold mb-6 drop-shadow-md">
            Your Crop's AI Guardian
          </h2>
          
          <p className="text-xl font-light mb-12 italic border-l-4 border-green-500 pl-6 text-gray-200 leading-relaxed max-w-xl">
            "Empowering farmers with the intelligence of tomorrow, to protect the harvests of today."
          </p>
          
          {/* Feature List */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl w-max backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-lg">1</div>
              <p className="text-lg text-white font-medium pr-4">Instant Leaf Disease Detection</p>
            </div>
            <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl w-max backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-lg">2</div>
              <p className="text-lg text-white font-medium pr-4">Multilingual Voice Support</p>
            </div>
            <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl w-max backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-lg">3</div>
              <p className="text-lg text-white font-medium pr-4">Smart Treatment Recommendations</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Floating Login Card */}
        <div className="w-full max-w-md">
          {/* Added ring/shadow to make it pop off the background */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 border border-white/20">
            
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-green-700 mb-2">
                {isLogin ? "Login" : "Create Account"}
              </h2>
              <p className="text-gray-500">
                {isLogin ? "Sign in to your account." : "Join Krishi-Rakshak today."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {!isLogin && (
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50"
                    placeholder="Rahul Farmer"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50"
                  placeholder="farmer@example.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50"
                  placeholder="••••••••"
                />
              </div>

              {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
              {successMsg && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">{successMsg}</div>}

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full text-white text-xl font-bold py-3 px-4 rounded-lg transition duration-300 transform active:scale-95 ${isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-500/30'}`}
              >
                {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Register")}
              </button>

            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-green-700 hover:text-green-900 font-semibold text-m focus:outline-none transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}