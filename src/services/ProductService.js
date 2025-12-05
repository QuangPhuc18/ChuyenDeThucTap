const { default: httpAxios } = require("./httpAxios");

const ProductService = {
    // Lấy danh sách sản phẩm (params: page, search, limit...)
    getList: async (params) => {
        return await httpAxios.get("products", { params });
    },

    // Lấy chi tiết 1 sản phẩm theo id
    getById: async (id) => {
        return await httpAxios.get(`products/${id}`);
    },

    // Tạo sản phẩm mới
    create: async (data) => {
        return await httpAxios.post("products", data);
    },

    // Cập nhật sản phẩm
    update: async (id, data) => {
        return await httpAxios.put(`products/${id}`, data);
    },

    // Xóa sản phẩm theo id
    delete: async (id) => {
        return await httpAxios.delete(`products/${id}`);
    },
};

export default ProductService;
