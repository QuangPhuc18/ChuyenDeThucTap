import httpAxios from "./httpAxios";

const TopicService = {
    // 1. Lấy danh sách (Phân trang, Lọc, Tìm kiếm)
    getList: async (params = {}) => {
        try {
            // params sẽ chứa: page, limit, search, status
            const response = await httpAxios.get('topics', { params });
            return response.data; 
        } catch (error) {
            console.error("Lỗi lấy danh sách chủ đề:", error);
            return null;
        }
    },

    // 2. Lấy chi tiết một chủ đề theo ID
    getById: async (id) => {
        try {
            const response = await httpAxios.get(`topics/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Lỗi lấy chủ đề #${id}:`, error);
            return null;
        }
    },

    // 3. Tạo mới chủ đề
    create: async (data) => {
        try {
            const response = await httpAxios.post('topics', data);
            return response.data;
        } catch (error) {
            // Trả về lỗi để Frontend hiển thị alert
            return error.response?.data || { status: false, message: "Lỗi kết nối server" };
        }
    },

    // 4. Cập nhật chủ đề
    update: async (id, data) => {
        try {
            // Laravel Resource dùng PUT cho update
            const response = await httpAxios.put(`topics/${id}`, data);
            return response.data;
        } catch (error) {
            return error.response?.data || { status: false, message: "Lỗi kết nối server" };
        }
    },

    // 5. Xóa chủ đề
    delete: async (id) => {
        try {
            const response = await httpAxios.delete(`topics/${id}`);
            return response.data;
        } catch (error) {
            return error.response?.data || { status: false, message: "Lỗi kết nối server" };
        }
    },

    // 6. Helper: Lấy tất cả chủ đề đang hoạt động (Dùng cho Dropdown chọn chủ đề ở trang Post)
    getAllActive: async () => {
        try {
            const response = await httpAxios.get('topics', { 
                params: { status: 1, limit: 100 } // Lấy tối đa 100 mục active
            });
            return response.data;
        } catch (error) {
            return null;
        }
    }
};

export default TopicService;