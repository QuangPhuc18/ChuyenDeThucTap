import httpAxios, { setAuthToken } from "./httpAxios";

const normalize = (res) => res?.data ?? res;

const UserService = {
  // AUTH
  login: async (loginInput, password) => {
    const res = await httpAxios.post("login", { login: loginInput, password });
    const data = normalize(res);
    if (data?.status && data?.token) {
      setAuthToken(data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data.user || {}));
      }
    }
    return data;
  },

  logout: async () => {
    try { await httpAxios.post("logout"); } catch (_) {}
    setAuthToken(null);
    return { status: true };
  },

  getProfile: async () => {
    const res = await httpAxios.get("profile");
    return normalize(res);
  },

  updateProfile: async (formData) => {
    const res = await httpAxios.post("profile/update", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return normalize(res);
  },

  changePassword: async (data) => {
    const res = await httpAxios.post("profile/change-password", data);
    return normalize(res);
  },

  // ORDERS (member)
  getMyOrders: async () => {
    const res = await httpAxios.get("my-orders");
    return normalize(res);
  },

  cancelOrder: async (orderId) => {
    const res = await httpAxios.post(`my-orders/${orderId}/cancel`);
    return normalize(res);
  },

  // USER CRUD (admin)
  getList: async (params) => normalize(await httpAxios.get("user", { params })),
  getById: async (id) => normalize(await httpAxios.get(`user/${id}`)),
  create: async (data) => {
    if (data instanceof FormData) {
      return normalize(await httpAxios.post("user", data, { headers: { "Content-Type": "multipart/form-data" } }));
    }
    return normalize(await httpAxios.post("user", data));
  },
  update: async (id, data) => {
    if (data instanceof FormData) {
      if (!data.has("_method")) data.append("_method", "PUT");
      return normalize(await httpAxios.post(`user/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }));
    }
    return normalize(await httpAxios.put(`user/${id}`, data));
  },
  delete: async (id) => normalize(await httpAxios.delete(`user/${id}`)),
};

export default UserService;