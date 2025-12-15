import httpAxios from "./httpAxios";

// Chỉ dùng normalize cho các hàm getList nếu cần thiết, 
// nhưng với cấu trúc response chuẩn {status, data} thì KHÔNG NÊN dùng normalize kiểu này.
const normalize = (res) => res?.data ?? res;

const PostService = {
  getList: async (params = {}) => {
    const res = await httpAxios.get("posts", { params });
    // Nếu API getList trả về {data: [...], meta: ...} thì normalize ở đây có thể OK
    // Nhưng an toàn nhất là return res để component tự xử lý
    return normalize(res); 
  },

  getById: async (id) => {
    try {
      const res = await httpAxios.get(`posts/${id}`);
      // 👇 SỬA: Trả về nguyên gốc res để lấy được status: true
      return res; 
    } catch (err) {
      return err?.response?.data ?? { status: false, message: err.message };
    }
  },

  create: async (data) => {
    try {
      const res = await httpAxios.post("posts", data);
      // 👇 SỬA: Không dùng normalize
      return res;
    } catch (err) {
      return err?.response?.data ?? { status: false, message: err.message };
    }
  },

  update: async (id, data) => {
    try {
      let res;
      if (data instanceof FormData) {
        // Đảm bảo _method được set đúng
        if (!data.has('_method')) {
          data.append('_method', 'PUT');
        }
        
        // 👇 SỬA QUAN TRỌNG: 
        // 1. Bỏ headers thủ công (Axios tự nhận diện FormData)
        // 2. Dùng post cho method spoofing
        res = await httpAxios.post(`posts/${id}`, data); 
      } else {
        res = await httpAxios.put(`posts/${id}`, data);
      }
      
      console.log('Update response:', res);
      
      // 👇 SỬA QUAN TRỌNG: Return nguyên res, không normalize
      return res; 

    } catch (err) {
      console.error('Update error:', err);
      return err?.response?.data ?? { status: false, message: err.message };
    }
  },

  delete: async (id) => {
    try {
      const res = await httpAxios.delete(`posts/${id}`);
      return res; // 👇 SỬA: Return res
    } catch (err) {
      return err?.response?.data ?? { status: false, message: err.message };
    }
  }
};

export default PostService;