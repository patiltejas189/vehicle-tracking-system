const API_BASE = (import.meta.env.VITE_API_URL || 'https://vehicle-tracking-backend-prlb.onrender.com').replace(/\/$/, '');

// Force Vercel redeployment - API URL fix for production
export default API_BASE;