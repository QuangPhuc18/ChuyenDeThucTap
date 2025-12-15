import httpAxios from "./httpAxios";

const normalizeResponse = (res) => {
  // Nếu httpAxios trả về axios response -> res.data tồn tại
  // Nếu httpAxios wrapper đã trả response.data trực tiếp -> res.data undefined
  return res?.data ?? res;
};

const UserService = {
    getList: async (params) => {
        const res = await httpAxios.get("user", { params });
        return normalizeResponse(res);
    },
    getById: async (id) => {
        const res = await httpAxios.get(`user/${id}`);
        return normalizeResponse(res);
    },
    create: async (data) => {
        // Nếu caller truyền FormData, gửi trực tiếp; không set Content-Type thủ công
        if (data instanceof FormData) {
            const res = await httpAxios.post("user", data);
            return normalizeResponse(res);
        }
        const res = await httpAxios.post("user", data);
        return normalizeResponse(res);
    },
    update: async (id, data) => {
        // Nếu truyền FormData, đảm bảo có _method=PUT
        if (data instanceof FormData) {
            if (!data.has('_method')) data.append('_method', 'PUT');
            const res = await httpAxios.post(`user/${id}`, data);
            return normalizeResponse(res);
        }
        // Nếu không phải FormData, gửi trực tiếp (server có thể chấp nhận json)
        const res = await httpAxios.post(`user/${id}`, data);
        return normalizeResponse(res);
    },
    delete: async (id) => {
        const res = await httpAxios.delete(`user/${id}`);
        return normalizeResponse(res);
    }
}

export default UserService;