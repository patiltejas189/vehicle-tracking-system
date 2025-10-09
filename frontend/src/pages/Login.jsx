import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSpinner, FaRocket, FaMapMarkerAlt, FaRoute, FaShieldAlt, FaChartLine, FaGlobe } from 'react-icons/fa';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [particles, setParticles] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const features = [
    { icon: FaMapMarkerAlt, title: "GPS Tracking", desc: "Real-time vehicle location monitoring", color: "from-blue-500 to-cyan-500" },
    { icon: FaRoute, title: "Route Analytics", desc: "Advanced route optimization & insights", color: "from-purple-500 to-pink-500" },
    { icon: FaShieldAlt, title: "Fleet Security", desc: "Comprehensive safety & compliance", color: "from-green-500 to-emerald-500" },
    { icon: FaChartLine, title: "Analytics Pro", desc: "Deep performance metrics & reporting", color: "from-orange-500 to-red-500" }
  ];

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Animated Particles Background */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDuration: `${particle.speed * 3}s`,
              animationDelay: `${particle.id * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-spin" style={{animationDuration: '20s'}}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-spin" style={{animationDuration: '25s', animationDirection: 'reverse'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative">
          <div className="max-w-lg">
            {/* Logo & Brand */}
            <div className="mb-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <FaRocket className="text-white text-3xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    FleetFlow
                  </h1>
                  <p className="text-blue-200 text-lg">Next-Gen Fleet Management</p>
                </div>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                  Revolutionize Your<br />
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Fleet Operations
                  </span>
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed mb-8">
                  Experience cutting-edge GPS tracking, AI-powered analytics, and comprehensive fleet management in one stunning platform.
                </p>
              </div>

              {/* Feature Showcase */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="flex items-center space-x-6 mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${features[currentFeature].color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    {React.createElement(features[currentFeature].icon, { className: "text-white text-2xl" })}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-xl mb-1">{features[currentFeature].title}</h3>
                    <p className="text-blue-200 text-sm leading-relaxed">{features[currentFeature].desc}</p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex space-x-3">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        index === currentFeature ? 'w-8 bg-white' : 'w-3 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">99.9%</div>
                  <div className="text-sm text-blue-200">Uptime SLA</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">24/7</div>
                  <div className="text-sm text-blue-200">Global Support</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">50+</div>
                  <div className="text-sm text-blue-200">Enterprise Features</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-lg">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-10">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <FaRocket className="text-white text-2xl" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  FleetFlow
                </h1>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/30 transform hover:scale-[1.02] transition-all duration-500">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <FaGlobe className="text-white text-2xl" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Welcome Aboard</h2>
                <p className="text-gray-600 text-lg">Access your fleet command center</p>
              </div>

              {/* Login Form */}
              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Username Field */}
                <div className="space-y-3">
                  <label htmlFor="username" className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Username or Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <FaUser className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 group-focus-within:scale-110" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="block w-full pl-16 pr-6 py-5 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white text-lg font-medium shadow-lg focus:shadow-xl"
                      placeholder="Enter your credentials"
                      value={credentials.username}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-3">
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <FaLock className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 group-focus-within:scale-110" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="block w-full pl-16 pr-16 py-5 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white text-lg font-medium shadow-lg focus:shadow-xl"
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-6 flex items-center hover:text-blue-500 transition-all duration-300 hover:scale-110"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-6 w-6 text-gray-400" />
                      ) : (
                        <FaEye className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-medium animate-bounce shadow-lg">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-5 px-8 border border-transparent text-xl font-bold rounded-2xl text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <FaSpinner className="animate-spin -ml-1 mr-4 h-7 w-7" />
                        <span className="text-lg">Authenticating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-lg">Launch Dashboard</span>
                        <svg className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Badge */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                  <FaShieldAlt className="mr-2 text-green-600 text-sm" />
                  <span className="text-sm text-green-700 font-medium">Bank-level security & encryption</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-white/60 text-sm">
                © 2024 FleetFlow. Transforming fleet management worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;