const browserLocation = typeof window !== 'undefined' ? window.location : null;
const isLocalFrontendDev = !!browserLocation
  && ['localhost', '127.0.0.1'].includes(browserLocation.hostname)
  && browserLocation.port === '4200';

export const GATEWAY_ORIGIN = isLocalFrontendDev ? 'http://localhost:8080' : '';
export const API_BASE = `${GATEWAY_ORIGIN}/api/v1`;
export const AUTH_API = `${API_BASE}/auth`;
export const TEMPLATE_API = `${API_BASE}/templates`;
export const RESUME_API = `${API_BASE}/resumes`;
export const SECTION_API = `${API_BASE}/sections`;
export const NOTIFICATION_API = `${API_BASE}/notifications`;
export const AI_API = `${API_BASE}/ai`;
export const PAYMENT_API = `${API_BASE}/payments`;

// Keep this off by default so localhost uses the real Razorpay test checkout popup.
export const USE_LOCALHOST_SIMULATED_PAYMENT = false && isLocalFrontendDev;
