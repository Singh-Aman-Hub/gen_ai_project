// Chatbot: send user_id and query to backend
const chatWithUser = (user_id, query) => {
  return apiClient.post('/chat/user', { user_id, query });
};
import axios from 'axios';

// Create a central API client
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/', // FastAPI backend URL from .env (Vite)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Temporarily disable auth token interceptor
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// --- Authentication ---
const register = (name, email, password) => {
  return apiClient.post('/auth/register', { name, email, password });
};

const login = (email, password) => {
  return apiClient.post('/auth/login', { email, password });
};

const logout = () => {
  localStorage.removeItem('token');
};

// --- Documents & Analysis ---
// Accept FormData directly (with file and user_id)
const uploadDocument = (formData, isRawFormData = false) => {
  // If not raw, build FormData from file
  if (!isRawFormData) {
    const fd = new FormData();
    fd.append('file', formData);
    formData = fd;
  }
  return apiClient.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const getAnalysis = (documentId) => {
  return apiClient.get(`/analysis/${documentId}`);
};

const getUserDocuments = (userId) => {
  return apiClient.get(`/documents/user/${userId}`);
};

// --- Export all API functions ---
const apiService = {
  register,
  login,
  logout,
  uploadDocument,
  getAnalysis,
  chatWithUser,
  getUserDocuments,
};

export default apiService;