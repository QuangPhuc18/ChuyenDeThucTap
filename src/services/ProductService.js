import httpAxios from "./httpAxios";

const ProductService = {
    // Lấy danh sách
    getList: async (params) => {
        return await httpAxios.get('products', { params: params });
    },

    // Lấy chi tiết
    getById: async (id) => {
        return await httpAxios.get(`products/${id}`);
    },

    // Thêm sản phẩm
    create: async (formData) => {
        // Axios tự động nhận diện FormData và set header đúng
        return await httpAxios.post('products', formData); 
    },

    // Cập nhật sản phẩm (POST + _method=PUT)
    update: async (id, formData) => {
        return await httpAxios.post(`products/${id}`, formData);
    },

    // Xóa sản phẩm
    delete: async (id) => {
        return await httpAxios.delete(`products/${id}`);
    }
}

export default ProductService;