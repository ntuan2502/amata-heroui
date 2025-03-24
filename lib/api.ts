import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

// Tạo một instance của Axios
const api = axios.create({
  baseURL: API_URL,
});

// Thêm Interceptor để xử lý lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      Cookies.remove("user");
      window.location.href = "/login"; // Chuyển hướng về login
    }
    return Promise.reject(error);
  }
);

export default api;
