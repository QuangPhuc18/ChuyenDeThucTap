import httpAxios from "./httpAxios";

const normalize = (res) => res?.data ?? res;

const ContactService = {
  getList: async (params = {}) => {
    const res = await httpAxios.get("contacts", { params });
    return normalize(res);
  },

  getById: async (id) => {
    const res = await httpAxios.get(`contacts/${id}`);
    return normalize(res);
  },

  create: async (data) => {
    const res = await httpAxios.post("contacts", data);
    return normalize(res);
  },

  reply: async (id, data) => {
    const res = await httpAxios.post(`contacts/${id}/reply`, data);
    return normalize(res);
  },

  delete: async (id) => {
    const res = await httpAxios.delete(`contacts/${id}`);
    return normalize(res);
  }
};

export default ContactService;