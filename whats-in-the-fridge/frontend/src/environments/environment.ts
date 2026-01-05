// Production environment - hosted on same Azure Web App as backend
export const environment = {
  production: true,
  // Using relative paths since frontend and backend are on same domain
  apiUrl: '/api',
  uploadsUrl: '/uploads'
};
