import httpAxios from "./httpAxios";

const BannerService = {
    // GET LIST
    getList: async (params) => {
        return await httpAxios.get("banners", { params });
    },

    // GET DETAIL
    getById: async (id) => {
        return await httpAxios.get(`banners/${id}`);
    },

    // CREATE
    create: async (data) => {
        // If caller provides FormData, send directly (do not set Content-Type manually)
        if (data instanceof FormData) {
            return await httpAxios.post("banners", data);
        }

        const formData = new FormData();
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });

        return await httpAxios.post("banners", formData);
    },

    // UPDATE
    update: async (id, data) => {
        if (data instanceof FormData) {
            if (!data.has('_method')) data.append('_method', 'PUT');
            return await httpAxios.post(`banners/${id}`, data);
        }

        const formData = new FormData();
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (key === 'image' && !(value instanceof File)) return;
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });
        formData.append('_method', 'PUT');
        return await httpAxios.post(`banners/${id}`, formData);
    },

    // DELETE
    delete: async (id) => {
        return await httpAxios.delete(`banners/${id}`);
    }
};

export default BannerService;