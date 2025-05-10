import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API;


if (!API_BASE_URL) {
  console.warn("Biến môi trường API chưa được định nghĩa.");
} else {
  console.log(`API Base URL đang được sử dụng: ${API_BASE_URL}`);
}


const api = axios.create({
  baseURL: API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
