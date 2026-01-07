import axios from "axios";

// Đổi URL này theo đúng cấu hình backend của bạn (thường là http://localhost:8000/api)
const API_URL = "http://localhost:8000/api"; 

const ProductSaleService = {
  // 1. Lấy danh sách các sản phẩm ĐANG SALE (Hàm bị thiếu gây ra lỗi)
  getActiveSales: async () => {
    try {
      const response = await axios.get(`${API_URL}/sales`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 2. Lấy danh sách sản phẩm để hiện lên Modal chọn
  getProducts: async (params) => {
    try {
      const response = await axios.get(`${API_URL}/sales/products-selection`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 3. Lưu chương trình khuyến mãi
  create: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/sales/store`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 4. Xóa sản phẩm khỏi danh sách khuyến mãi
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/product-sales/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default ProductSaleService;