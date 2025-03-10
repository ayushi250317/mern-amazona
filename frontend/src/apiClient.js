import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_BASE_URL, // Use the base URL from .env
});

export default apiClient;
