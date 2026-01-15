import httpAxios from "./httpAxios";

const PostService = {
  // 1. Lấy danh sách bài viết
  getList: async (params = {}) => {
    try {
      const res = await httpAxios.get("posts", { params });
      // Trả về res.data để lấy JSON từ Laravel (bao gồm status, data, meta)
      return res.data; 
    } catch (err) {
      return err?.response?.data ?? { status: false, message: err.message, data: [] };
    }
  },

  // 2. Lấy chi tiết theo ID (Dùng cho Admin Edit)
  getById: async (id) => {
    try {
      const res = await httpAxios.get(`posts/${id}`);
      return res.data; // ✅ Thêm .data
    } catch (err) {
      return err?.response?.data ?? { status: false, message: err.message };
    }
  },

  // 3. Lấy chi tiết theo Slug (Dùng cho Frontend xem chi tiết)
  getDetail: async (slug) => {
    try {
      // Gọi đúng route api/post_detail/{slug}
      const res = await httpAxios.get(`post_detail/${slug}`);
      return res.data; // ✅ Thêm .data để Frontend nhận được { status: true, ... }
    } catch (err) {
      return err?.response?.data ?? { status: false, message: err.message };
    }
  },

  // 4. Lấy bài viết liên quan
  getRelated: async (topicId, excludeId) => {
    try {
      // Gọi đúng route api/post_related
      const res = await httpAxios.get(`post_related/${topicId}/${excludeId}`);
      return res.data; // ✅ Thêm .data
    } catch (err) {
      // Trả về data rỗng để không làm lỗi giao diện
      return { status: false, data: [] };
    }
  },

  // 5. Tạo mới bài viết
  create: async (data) => {
    try {
      const res = await httpAxios.post("posts", data);
      return res.data; // ✅ Thêm .data
    } catch (err) {
      return err?.response?.data ?? { status: false, message: err.message };
    }
  },

  // 6. Cập nhật bài viết
  update: async (id, data) => {
    try {
      let res;
      if (data instanceof FormData) {
        // Laravel method spoofing cho upload file
        if (!data.has('_method')) {
          data.append('_method', 'PUT');
        }
        res = await httpAxios.post(`posts/${id}`, data);
      } else {
        res = await httpAxios.put(`posts/${id}`, data);
      }
      return res.data; // ✅ Thêm .data
    } catch (err) {
      console.error('Update error:', err);
      return err?.response?.data ?? { status: false, message: err.message };
    }
  },

  // 7. Xóa bài viết
  delete: async (id) => {
    try {
      const res = await httpAxios.delete(`posts/${id}`);
      return res.data; // ✅ Thêm .data
    } catch (err) {
      return err?.response?.data ?? { status: false, message: err.message };
    }
  }
};

export default PostService;