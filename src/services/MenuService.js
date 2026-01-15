import httpAxios from "./httpAxios";

const normalize = (res) => res?.data ?? res;

const MenuService = {
  // Lấy danh sách (Có thể truyền params: position='mainmenu', parent_id=0...)
  getList: async (params = {}) => {
    try {
      const res = await httpAxios.get("menus", { params });
      return normalize(res);
    } catch (err) {
      return err.response?.data || { status: false, message: err.message };
    }
  },

  getById: async (id) => {
    try {
      const res = await httpAxios.get(`menus/${id}`);
      return normalize(res);
    } catch (err) {
      return err.response?.data || { status: false, message: err.message };
    }
  },

  create: async (data) => {
    try {
      const res = await httpAxios.post("menus", data);
      return normalize(res);
    } catch (err) {
      return err.response?.data || { status: false, message: err.message };
    }
  },

  update: async (id, data) => {
    try {
      const res = await httpAxios.put(`menus/${id}`, data);
      return normalize(res);
    } catch (err) {
      return err.response?.data || { status: false, message: err.message };
    }
  },

  delete: async (id) => {
    try {
      const res = await httpAxios.delete(`menus/${id}`);
      return normalize(res);
    } catch (err) {
      return err.response?.data || { status: false, message: err.message };
    }
  }
};

export default MenuService;