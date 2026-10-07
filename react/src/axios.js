import axios from "axios";
import router from "./router";
import { API_BASE_URL } from "./apiConfig";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

axiosClient.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('TOKEN')}`
  return config
});

axiosClient.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('TOKEN')
    window.location.reload();
    // router.navigate('/login')
    return error;
  }
  throw error;
})

export default axiosClient;
