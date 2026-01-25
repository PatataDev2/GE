import axios from 'axios';

const BASE = import.meta.env.VITE_BASE_API_URL;

const api = axios.create({ 

baseURL: `${BASE}/users/api/v1/`,


})


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if(token){
config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;



  });

  export const getCurrentUser = () => {  return api.get('me/');  };
  export const registerUser = (userData) => api.post('register/',userData);
  export const loginUser = (credentials) => api.post('login/',credentials);
  export const refreshToken = (refreshToken) => axios.post(`${BASE}/users/api/v1/token/refresh/`, { refresh});

  export default api;