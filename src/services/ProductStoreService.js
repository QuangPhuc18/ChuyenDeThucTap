import axios from "axios";
import httpAxios from "./httpAxios";
// Đảm bảo URL này đúng với server Laravel đang chạy (thường là port 8000)
const API_URL = "http://localhost:8000/api/store"; 

const ProductStoreService = {
  // 1. Lấy danh sách tồn kho
  getAll: async (params) => {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data; 
    } catch (error) {
      console.error("API getAll Error:", error);
      throw error;
    }
  },

  // 2. Nhập kho (Import)
  import: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/import`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
update: async (id, data) => await httpAxios.put(`store/${id}`, data),
  // 3. Xóa sản phẩm khỏi kho
  delete: async (productId) => {
    try {
      const response = await axios.delete(`${API_URL}/${productId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default ProductStoreService;