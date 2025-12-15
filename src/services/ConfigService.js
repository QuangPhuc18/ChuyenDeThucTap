import httpAxios from "./httpAxios";

const normalize = (res) => res?.data ?? res;

const ConfigService = {
  getList: async (params = {}) => {
    const res = await httpAxios.get("configs", { params });
    return normalize(res);
  },

  getById: async (id) => {
    const res = await httpAxios.get(`configs/${id}`);
    return normalize(res);
  },

  create: async (data) => {
    const res = await httpAxios.post("configs", data);
    return normalize(res);
  },

  update: async (id, data) => {
    // method spoofing so backend accepts update via POST if needed
    const res = await httpAxios.post(`configs/${id}`, { ...data, _method: "PUT" });
    return normalize(res);
  },

  delete: async (id) => {
    const res = await httpAxios.delete(`configs/${id}`);
    return normalize(res);
  }
};

export default ConfigService;