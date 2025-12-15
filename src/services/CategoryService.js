import httpAxios from "./httpAxios";

const CategoryService = {

    // GET LIST
    getList: async (params) => {
        return await httpAxios.get("categories", { params });
    },

    // GET DETAIL
    getById: async (id) => {
        return await httpAxios.get(`categories/${id}`);
    },

    // CREATE CATEGORY (WITH IMAGE)
    create: async (data) => {
        // If caller already provided a FormData, send it directly.
        // DO NOT set Content-Type manually so axios can add boundary.
        if (data instanceof FormData) {
            return await httpAxios.post("categories", data);
        }

        // Otherwise build FormData from plain object
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });

        return await httpAxios.post("categories", formData);
    },

    // UPDATE CATEGORY (PUT METHOD SPOOFING)
    update: async (id, data) => {
        // If caller passed a FormData, ensure _method is present then send directly
        if (data instanceof FormData) {
            if (!data.has('_method')) {
                data.append('_method', 'PUT');
            }
            return await httpAxios.post(`categories/${id}`, data);
        }

        // Otherwise build FormData from plain object
        const formData = new FormData();

        Object.keys(data).forEach(key => {
            const value = data[key];

            // If image is not a File, skip it (keep old image)
            if (key === "image" && !(value instanceof File)) {
                return;
            }

            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });

        // Laravel PUT by method spoofing
        formData.append("_method", "PUT");

        return await httpAxios.post(`categories/${id}`, formData);
    },

    // DELETE CATEGORY
    delete: async (id) => {
        return await httpAxios.delete(`categories/${id}`);
    }
};

export default CategoryService;