import httpAxios from "./httpAxios";

const ProductSaleService = {
    // 1. Lấy danh sách sản phẩm để chọn (cho Modal)
    // params bao gồm: { page: 1, keyword: '...' }
    getProducts: async (params) => {
        return await httpAxios.get('product-sales/products', { params: params });
    },

    // 2. Lưu chương trình khuyến mãi mới
    // data bao gồm: { name, date_begin, date_end, products: [{id, price_sale}, ...] }
    create: async (data) => {
        return await httpAxios.post('product-sales', data);
    }
};

export default ProductSaleService;