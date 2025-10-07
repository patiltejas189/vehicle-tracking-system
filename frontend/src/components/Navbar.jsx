import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBars, FaTimes, FaHome, FaExclamationTriangle, FaMap, FaCar, FaWrench, FaChartBar, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  if (!user) {
    return null;
  }

  const getNavLinks = () => {
    const links = [
      { to: '/', label: 'Dashboard', icon: FaHome },
      { to: '/alerts', label: 'Alerts', icon: FaExclamationTriangle },
      { to: '/map', label: 'Map', icon: FaMap }
    ];

    if (['admin', 'fleet_manager'].includes(user.role)) {
      links.push({ to: '/vehicles', label: 'Vehicles', icon: FaCar });
      links.push({ to: '/maintenance', label: 'Maintenance', icon: FaWrench });
      links.push({ to: '/analytics', label: 'Analytics', icon: FaChartBar });
    }

    if (user.role === 'admin') {
      links.splice(1, 0, { to: '/users', label: 'Users', icon: FaUser });
    }

    // Settings is available to all authenticated users
    links.push({ to: '/settings', label: 'Settings', icon: FaCog });

    return links;
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-800 text-white shadow-large flex-col z-50 animate-fade-in">
        <div className="p-6">
          <Link to="/" className="flex items-center text-2xl font-bold mb-8 text-white hover:text-primary-100 transition-colors duration-200">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3 shadow-medium">
              <span className="text-2xl">🚗</span>
            </div>
            <span className="hidden lg:block">Vehicle Tracker</span>
          </Link>
          
          <div className="space-y-1">
            {getNavLinks().map((link) => {
              const Icon = link.icon;
              const isActive = isActiveLink(link.to);
              return (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  className={`flex items-center py-3 px-4 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-white text-primary-600 shadow-medium' 
                      : 'hover:bg-primary-500 hover:bg-opacity-50 hover:translate-x-1'
                  }`}
                >
                  <Icon className={`mr-3 text-lg transition-colors duration-200 ${
                    isActive ? 'text-primary-600' : 'text-primary-200 group-hover:text-white'
                  }`} />
                  <span className={`font-medium ${
                    isActive ? 'text-primary-700' : 'text-white'
                  }`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="mt-auto p-6">
          <div className="mb-4 p-4 bg-primary-700 bg-opacity-50 rounded-xl backdrop-blur-sm border border-primary-500 border-opacity-30">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mr-3">
                <FaUser className="text-white text-sm" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-white">{user.username}</span>
                <span className="block text-xs text-primary-200 capitalize">{user.role.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center font-medium shadow-medium hover:shadow-large hover:scale-105"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="md:hidden bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-large z-50 sticky top-0">
        <div className="px-4">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center text-xl font-bold">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-2 shadow-medium">
                <span className="text-lg">🚗</span>
              </div>
              <span>Vehicle Tracker</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-xs text-primary-200 capitalize">{user.role.replace('_', ' ')}</div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-primary-500 rounded-lg transition-colors duration-200"
              >
                {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <nav className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-primary-600 via-primary-700 to-primary-800 text-white shadow-large flex-col z-50 animate-slide-in overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <Link to="/" className="flex items-center text-xl font-bold text-white" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-2 shadow-medium">
                    <span className="text-lg">🚗</span>
                  </div>
                  Vehicle Tracker
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-primary-500 rounded-lg transition-colors duration-200"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              
              <div className="space-y-1">
                {getNavLinks().map((link) => {
                  const Icon = link.icon;
                  const isActive = isActiveLink(link.to);
                  return (
                    <Link 
                      key={link.to} 
                      to={link.to} 
                      className={`flex items-center py-3 px-4 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-white text-primary-600 shadow-medium' 
                          : 'hover:bg-primary-500 hover:bg-opacity-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className={`mr-3 text-lg ${
                        isActive ? 'text-primary-600' : 'text-primary-200'
                      }`} />
                      <span className={`font-medium ${
                        isActive ? 'text-primary-700' : 'text-white'
                      }`}>
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-auto p-6">
              <div className="mb-4 p-4 bg-primary-700 bg-opacity-50 rounded-xl backdrop-blur-sm border border-primary-500 border-opacity-30">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mr-3">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-white">{user.username}</span>
                    <span className="block text-xs text-primary-200 capitalize">{user.role.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center font-medium shadow-medium hover:shadow-large"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Navbar;