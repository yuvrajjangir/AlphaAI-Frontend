const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_API_KEY = import.meta.env.VITE_AUTH_API_KEY;


export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': AUTH_API_KEY,
    ...(options.headers || {}),
  };

  const url = `${API_BASE_URL}${endpoint}`;
  console.log('Fetching:', url); 
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} - ${errorText}`);
  }

  return response;
};