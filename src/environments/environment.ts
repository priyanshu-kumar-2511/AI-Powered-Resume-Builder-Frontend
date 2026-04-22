export const environment = {
  production: false,
  // Route all API calls through the API Gateway (port 8080).
  // Previously authApiUrl pointed directly to auth-service (8081),
  // bypassing the gateway's CORS, routing, and logging middleware.
  authApiUrl: 'http://localhost:8080/api/v1/auth',
  resumeApiUrl: 'http://localhost:8080/api/v1/resumes',
  gatewayUrl: 'http://localhost:8080',
  // OAuth2 base URL — used by loginWithGoogle / loginWithLinkedIn
  oauth2BaseUrl: 'http://localhost:8080'
};
