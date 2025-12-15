// 'use client'

// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Search, Plus,
//   Edit, Trash2, ChevronRight, X, Save
// } from 'lucide-react';
// import ProductService from '../../../../services/ProductService'; // adjust path if needed

// const IMAGE_BASE_URL = 'http://localhost:8000/storage/';

// export default function ProductsPage() {
//   // --- STATE ---
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [pagination, setPagination] = useState({
//     current_page: 1,
//     last_page: 1,
//     total: 0,
//     per_page: 10
//   });

//   const [searchTerm, setSearchTerm] = useState('');

//   // Modal & Form
//   const [showModal, setShowModal] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [thumbnailPreview, setThumbnailPreview] = useState(null);

//   const [formData, setFormData] = useState({
//     id: '',
//     category_id: '',
//     name: '',
//     slug: '',
//     thumbnail: null,
//     content: '',
//     description: '',
//     price_buy: '',
//     status: 1
//   });

//   // categories (you may fetch these from backend instead)
//   const categories = [
//     { id: 1, name: 'Cà phê' },
//     { id: 2, name: 'Trà' },
//     { id: 3, name: 'Freeze' },
//     { id: 4, name: 'Bánh ngọt' }
//   ];
//   const attributes = [

//     { id: 1, name: 'Size' },
//   ]

//   // attributes list fetched from backend (/api/attributes)
//   const [attributesList, setAttributesList] = useState([]);

//   // Support multiple attribute groups (as in screenshot)
//   // Each group: { id: uniqueKey, attribute_id: '', values: [], input: '' }
//   const [attributeGroups, setAttributeGroups] = useState([]);

//   // --- API HANDLERS ---

//   const fetchProducts = useCallback(async (page = 1, search = '') => {
//     setLoading(true);
//     try {
//       const data = await ProductService.getList({
//         page,
//         limit: 10,
//         search
//       });
//       if (data.status) {
//         setProducts(data.data);
//         setPagination({
//           current_page: data.meta.current_page,
//           last_page: data.meta.last_page,
//           total: data.meta.total,
//           per_page: data.meta.per_page
//         });
//       }
//     } catch (err) {
//       console.error('Fetch products error', err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     const t = setTimeout(() => {
//       fetchProducts(pagination.current_page, searchTerm);
//     }, 400);
//     return () => clearTimeout(t);
//   }, [fetchProducts, pagination.current_page, searchTerm]);

//   useEffect(() => {
//     const fetchAttrs = async () => {
//       try {
//         const res = await fetch('/api/attributes');
//         if (!res.ok) return;
//         const json = await res.json();
//         // backend may return { data: [...] } or an array
//         const list = Array.isArray(json) ? json : (json.data || []);
//         setAttributesList(list);
//       } catch (err) {
//         console.warn('Cannot fetch attributes', err);
//       }
//     };
//     fetchAttrs();
//   }, []);

//   // --- Helpers for attribute groups ---
//   const addAttributeGroup = () => {
//     setAttributeGroups(prev => [
//       ...prev,
//       { id: Date.now().toString(), attribute_id: '', values: [], input: '' }
//     ]);
//   };

//   const removeAttributeGroup = (groupId) => {
//     setAttributeGroups(prev => prev.filter(g => g.id !== groupId));
//   };

//   const setGroupField = (groupId, key, value) => {
//     setAttributeGroups(prev => prev.map(g => g.id === groupId ? { ...g, [key]: value } : g));
//   };

//   const addValuesToGroup = (groupId) => {
//     setAttributeGroups(prev => prev.map(g => {
//       if (g.id !== groupId) return g;
//       const parts = String(g.input || '').split(',').map(p => p.trim()).filter(Boolean);
//       const merged = Array.from(new Set([...(g.values || []), ...parts]));
//       return { ...g, values: merged, input: '' };
//     }));
//   };

//   const removeValueFromGroup = (groupId, value) => {
//     setAttributeGroups(prev => prev.map(g => g.id === groupId ? { ...g, values: g.values.filter(v => v !== value) } : g));
//   };

//   // --- File change ---
//   const handleFileChange = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setFormData(prev => ({ ...prev, thumbnail: file }));
//     setThumbnailPreview(URL.createObjectURL(file));
//   };

//   const handleAddProduct = () => {
//     setEditMode(false);
//     setThumbnailPreview(null);
//     setFormData({
//       id: '', category_id: '', name: '', slug: '', thumbnail: null,
//       content: '', description: '', price_buy: '', status: 1
//     });
//     setAttributeGroups([]);
//     setShowModal(true);
//   };

//   const parseProductAttributeGroups = (product) => {
//     // try to read product.product_attributes (if backend returns related models)
//     // return array of { attribute_id, values }
//     if (!product) return [];
//     const pa = product.product_attributes || product.product_attribute || product.attributes;
//     if (!pa) return [];
//     // If pa is array of objects -> group by attribute_id
//     if (Array.isArray(pa) && pa.length > 0) {
//       if (typeof pa[0] === 'object' && pa[0] !== null && 'value' in pa[0]) {
//         const map = {};
//         pa.forEach(item => {
//           const aid = item.attribute_id || '0';
//           map[aid] = map[aid] || [];
//           map[aid].push(String(item.value));
//         });
//         return Object.keys(map).map(aid => ({ attribute_id: aid, values: Array.from(new Set(map[aid])) }));
//       } else {
//         // array of strings (no attribute id)
//         return [{ attribute_id: '', values: pa.map(String) }];
//       }
//     }
//     // if string => try parse JSON or comma
//     if (typeof pa === 'string') {
//       try {
//         const decoded = JSON.parse(pa);
//         if (Array.isArray(decoded)) return [{ attribute_id: '', values: decoded.map(String) }];
//       } catch {}
//       const parts = pa.split(',').map(s => s.trim()).filter(Boolean);
//       return [{ attribute_id: '', values: parts }];
//     }
//     return [];
//   };

//   const handleEditProduct = (product) => {
//     setEditMode(true);
//     const imageUrl = product.image_url || (product.thumbnail ? (IMAGE_BASE_URL + product.thumbnail) : null);
//     setThumbnailPreview(imageUrl);
//     setFormData({
//       ...formData,
//       id: product.id,
//       category_id: product.category_id || '',
//       name: product.name || '',
//       slug: product.slug || '',
//       thumbnail: product.thumbnail || null,
//       content: product.content || '',
//       description: product.description || '',
//       price_buy: product.price_buy || product.price || '',
//       status: product.status ?? 1
//     });

//     const groups = parseProductAttributeGroups(product).map(g => ({
//       id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
//       attribute_id: g.attribute_id ? String(g.attribute_id) : '',
//       values: g.values || [],
//       input: ''
//     }));
//     setAttributeGroups(groups.length ? groups : []);
//     setShowModal(true);
//   };

//   const handleChange = (e) => {
//     const { name, value, type } = e.target;
//     setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
//   };

//   const handleNameChange = (e) => {
//     const name = e.target.value;
//     const slug = String(name || '').toLowerCase().normalize('NFD')
//       .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
//       .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
//     setFormData(prev => ({ ...prev, name, slug }));
//   };

//   const handleSearchChange = (e) => {
//     setSearchTerm(e.target.value);
//     setPagination(prev => ({ ...prev, current_page: 1 }));
//   };

//   const changePage = (newPage) => {
//     if (newPage >= 1 && newPage <= pagination.last_page) {
//       setPagination(prev => ({ ...prev, current_page: newPage }));
//     }
//   };

//   const formatPrice = (price) => {
//     if (price === '' || price === null || price === undefined) return '0₫';
//     return Number(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫';
//   };

//   // --- Submit ---
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const data = new FormData();

//       data.append('category_id', formData.category_id);
//       data.append('name', formData.name);
//       data.append('slug', formData.slug);
//       data.append('content', formData.content);
//       data.append('description', formData.description);
//       data.append('price_buy', formData.price_buy);
//       data.append('status', formData.status);
//       data.append('quantity', 100);

//       if (formData.thumbnail && formData.thumbnail instanceof File) {
//         data.append('thumbnail', formData.thumbnail);
//       }

//       // Send attribute groups as product_attributes JSON (array of objects)
//       // Each object: { attribute_id: 1, values: ['S','M'] }
//       if (attributeGroups.length > 0) {
//         const prepared = attributeGroups.map(g => ({
//           attribute_id: g.attribute_id || null,
//           values: Array.isArray(g.values) ? g.values : []
//         }));
//         data.append('product_attributes', JSON.stringify(prepared));
//       }

//       // For backward compatibility, also add single attribute_id/product_attribute[] if only 1 group selected
//       if (attributeGroups.length === 1 && attributeGroups[0].attribute_id) {
//         data.append('attribute_id', String(attributeGroups[0].attribute_id));
//         (attributeGroups[0].values || []).forEach(v => data.append('product_attribute[]', String(v)));
//       }

//       // debug log
//       console.group('DEBUG FormData entries');
//       for (const pair of data.entries()) {
//         console.log(pair[0], pair[1]);
//       }
//       console.groupEnd();

//       let response;
//       if (editMode) {
//         data.append('_method', 'PUT');
//         response = await ProductService.update(formData.id, data);
//       } else {
//         response = await ProductService.create(data);
//       }

//       if (response.status) {
//         alert(editMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
//         setShowModal(false);
//         setAttributeGroups([]);
//         setFormData(prev => ({ ...prev, attribute_id: '' }));
//         fetchProducts(pagination.current_page, searchTerm);
//       } else {
//         alert(response.message || 'Không thể lưu sản phẩm');
//       }
//     } catch (err) {
//       console.error('Submit error', err);
//       const errResponse = err.response?.data;
//       if (errResponse?.errors) {
//         const firstError = Object.values(errResponse.errors)[0][0];
//         alert(`Lỗi: ${firstError}`);
//       } else {
//         alert(errResponse?.message || 'Lỗi hệ thống hoặc kết nối');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- Render UI ---
//   return (
//     <>
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
//           <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
//             <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Products</span>
//           </div>
//         </div>
//       </div>

//       <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
//         <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-lg font-bold text-gray-900 dark:text-white">Products List</h2>
//             <div className="flex gap-3">
//               <button onClick={handleAddProduct} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
//                 <Plus className="w-4 h-4" /> <span className="font-medium">Add Product</span>
//               </button>
//             </div>
//           </div>

//           <div className="relative flex-1 max-w-md">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search products..."
//               value={searchTerm}
//               onChange={handleSearchChange}
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
//             />
//           </div>
//         </div>

//         <div className="overflow-x-auto relative">
//           {loading && (
//             <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
//             </div>
//           )}

//           <table className="w-full">
//             <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ID</th>
//                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Product</th>
//                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Category</th>
//                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Price</th>
//                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
//                 <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
//               {products.map(product => (
//                 <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
//                   <td className="px-6 py-4 text-gray-600 dark:text-gray-400">#{product.id}</td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center gap-3">
//                       <img
//                         src={product.image_url || (product.thumbnail ? IMAGE_BASE_URL + product.thumbnail : 'https://via.placeholder.com/50')}
//                         alt={product.name}
//                         className="w-12 h-12 rounded-lg object-cover bg-gray-100"
//                       />
//                       <div>
//                         <span className="font-medium text-gray-900 dark:text-white block">{product.name}</span>
//                         {/* small attribute preview */}
//                         {(() => {
//                           const pa = product.product_attributes || product.product_attribute || product.attributes;
//                           if (!pa) return null;
//                           let display = [];
//                           if (Array.isArray(pa)) {
//                             if (pa.length && typeof pa[0] === 'object' && pa[0] !== null && 'value' in pa[0]) {
//                               display = pa.map(x => x.value);
//                             } else {
//                               display = pa;
//                             }
//                           } else if (typeof pa === 'string') {
//                             try {
//                               const p = JSON.parse(pa);
//                               if (Array.isArray(p)) display = p;
//                               else display = pa.split(',').map(s => s.trim()).filter(Boolean);
//                             } catch {
//                               display = pa.split(',').map(s => s.trim()).filter(Boolean);
//                             }
//                           }
//                           if (!display || display.length === 0) return null;
//                           return (
//                             <div className="flex gap-1 mt-1">
//                               {display.map(a => <span key={a} className="text-xs px-2 py-0.5 bg-gray-100 rounded">{a}</span>)}
//                             </div>
//                           );
//                         })()}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{categories.find(c => c.id === Number(product.category_id))?.name || 'Unknown'}</td>
//                   <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{formatPrice(product.price_buy || product.price)}</td>
//                   <td className="px-6 py-4">
//                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Number(product.status) === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
//                       {Number(product.status) === 1 ? 'Active' : 'Inactive'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center justify-center gap-2">
//                       <button onClick={() => handleEditProduct(product)} className="p-2 hover:bg-blue-50 rounded-lg group">
//                         <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
//                       </button>
//                       <button onClick={() => {
//                         if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
//                         ProductService.delete(product.id).then(res => {
//                           if (res.status) fetchProducts(pagination.current_page, searchTerm);
//                         }).catch(err => console.error(err));
//                       }} className="p-2 hover:bg-red-50 rounded-lg group">
//                         <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
//           <div className="text-sm text-gray-500">Page {pagination.current_page} of {pagination.last_page}</div>
//           <div className="flex gap-2">
//             <button onClick={() => changePage(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Previous</button>
//             <button onClick={() => changePage(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
//           </div>
//         </div>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editMode ? 'Edit Product' : 'Add New Product'}</h2>
//               <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6" encType="multipart/form-data">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-semibold mb-2">Category *</label>
//                   <select name="category_id" value={formData.category_id} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg">
//                     <option value="">Select category</option>
//                     {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold mb-2">Product Name *</label>
//                   <input type="text" name="name" value={formData.name} onChange={handleNameChange} required className="w-full px-4 py-3 border rounded-lg" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold mb-2">Slug</label>
//                   <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold mb-2">Price (VNĐ) *</label>
//                   <input type="number" name="price_buy" value={formData.price_buy} onChange={handleChange} required min="0" className="w-full px-4 py-3 border rounded-lg" />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-semibold mb-2">Thumbnail Image</label>
//                   <div className="flex items-center gap-4">
//                     {thumbnailPreview && (
//                       <div className="w-20 h-20 border rounded-lg overflow-hidden shrink-0">
//                         <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
//                       </div>
//                     )}
//                     <input type="file" name="thumbnail" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
//                   </div>
//                 </div>

//                 {/* ATTRIBUTE GROUPS */}
//                 <div className="md:col-span-2">
//                   <div className="flex items-center justify-between mb-3">
//                     <label className="block text-sm font-semibold">Thuộc tính & Biến thể</label>
//                     <button type="button" onClick={addAttributeGroup} className="text-sm px-3 py-1 bg-green-500 text-white rounded">Thêm thuộc tính</button>
//                   </div>

//                   <div className="space-y-3">
//                     {attributeGroups.length === 0 && <div className="text-sm text-gray-400">Chưa có thuộc tính nào.</div>}

//                     {attributeGroups.map(group => (
//                       <div key={group.id} className="p-3 border rounded-lg bg-gray-50">
//                         <div className="flex items-center gap-3 mb-2">
//                           <select value={group.attribute_id} onChange={(e) => setGroupField(group.id, 'attribute_id', e.target.value)} className="px-3 py-2 border rounded w-48">
//                             <option value="">-- Chọn thuộc tính --</option>
//                             {attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
//                           </select>

//                           <div className="flex-1">
//                             <input value={group.input} onKeyDown={(e) => {
//                               if (e.key === 'Enter' || e.key === ',') {
//                                 e.preventDefault(); addValuesToGroup(group.id);
//                               }
//                             }} onChange={(e) => setGroupField(group.id, 'input', e.target.value)} placeholder="Nhập giá trị (nhấn Enter hoặc dấu phẩy để thêm)" className="w-full px-3 py-2 border rounded" />
//                           </div>

//                           <button type="button" onClick={() => addValuesToGroup(group.id)} className="px-3 py-2 bg-blue-600 text-white rounded">Thêm</button>

//                           <button type="button" onClick={() => removeAttributeGroup(group.id)} className="ml-2 text-red-600">Xóa</button>
//                         </div>

//                         <div className="flex flex-wrap gap-2">
//                           {group.values.map(v => (
//                             <div key={v} className="flex items-center gap-2 bg-white border px-3 py-1 rounded">
//                               <span className="text-sm">{v}</span>
//                               <button type="button" onClick={() => removeValueFromGroup(group.id, v)} className="text-red-500">×</button>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-semibold mb-2">Description</label>
//                   <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-semibold mb-2">Content</label>
//                   <textarea name="content" value={formData.content} onChange={handleChange} rows={4} className="w-full px-4 py-3 border rounded-lg resize-none" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold mb-2">Status</label>
//                   <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
//                     <option value={1}>Active</option>
//                     <option value={0}>Inactive</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
//                 <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border rounded-lg hover:bg-gray-50">Cancel</button>
//                 <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
//                   <Save className="w-5 h-5" /> {editMode ? 'Update' : 'Create'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus,
  Edit, Trash2, ChevronRight, X, Save
} from 'lucide-react';
import ProductService from '../../../../services/ProductService'; // adjust path if needed

const IMAGE_BASE_URL = 'http://localhost:8000/storage/';

export default function ProductsPage() {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Modal & Form
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    category_id: '',
    name: '',
    slug: '',
    thumbnail: null,
    content: '',
    description: '',
    price_buy: '',
    status: 1
  });

  // Gallery: multiple images
  const [galleryFiles, setGalleryFiles] = useState([]); // new files to upload
  const [galleryPreviews, setGalleryPreviews] = useState([]); // object URLs for new files
  const [existingGallery, setExistingGallery] = useState([]); // existing images from backend (urls / objects)

  // categories (you may fetch these from backend instead)
  const categories = [
    { id: 1, name: 'Cà phê' },
    { id: 2, name: 'Trà' },
    { id: 3, name: 'Freeze' },
    { id: 4, name: 'Bánh ngọt' }
  ];
  const attributes = [
    { id: 1, name: 'Size' },
  ]

  // attributes list fetched from backend (/api/attributes)
  const [attributesList, setAttributesList] = useState([]);

  // Support multiple attribute groups (as in screenshot)
  // Each group: { id: uniqueKey, attribute_id: '', values: [], input: '' }
  const [attributeGroups, setAttributeGroups] = useState([]);

  // --- API HANDLERS ---

  const fetchProducts = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await ProductService.getList({
        page,
        limit: 10,
        search
      });
      if (data.status) {
        setProducts(data.data);
        setPagination({
          current_page: data.meta.current_page,
          last_page: data.meta.last_page,
          total: data.meta.total,
          per_page: data.meta.per_page
        });
      }
    } catch (err) {
      console.error('Fetch products error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts(pagination.current_page, searchTerm);
    }, 400);
    return () => clearTimeout(t);
  }, [fetchProducts, pagination.current_page, searchTerm]);

  useEffect(() => {
    const fetchAttrs = async () => {
      try {
        const res = await fetch('/api/attributes');
        if (!res.ok) return;
        const json = await res.json();
        // backend may return { data: [...] } or an array
        const list = Array.isArray(json) ? json : (json.data || []);
        setAttributesList(list);
      } catch (err) {
        console.warn('Cannot fetch attributes', err);
      }
    };
    fetchAttrs();
  }, []);

  // --- Helpers for attribute groups ---
  const addAttributeGroup = () => {
    setAttributeGroups(prev => [
      ...prev,
      { id: Date.now().toString(), attribute_id: '', values: [], input: '' }
    ]);
  };

  const removeAttributeGroup = (groupId) => {
    setAttributeGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const setGroupField = (groupId, key, value) => {
    setAttributeGroups(prev => prev.map(g => g.id === groupId ? { ...g, [key]: value } : g));
  };

  const addValuesToGroup = (groupId) => {
    setAttributeGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const parts = String(g.input || '').split(',').map(p => p.trim()).filter(Boolean);
      const merged = Array.from(new Set([...(g.values || []), ...parts]));
      return { ...g, values: merged, input: '' };
    }));
  };

  const removeValueFromGroup = (groupId, value) => {
    setAttributeGroups(prev => prev.map(g => g.id === groupId ? { ...g, values: g.values.filter(v => v !== value) } : g));
  };

  // --- File change ---
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, thumbnail: file }));
    setThumbnailPreview(URL.createObjectURL(file));
  };

  // Handle gallery multiple files selection
  const handleGalleryFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Create object URLs for previews
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setGalleryFiles(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewGalleryImage = (index) => {
    // revoke object URL
    const url = galleryPreviews[index];
    if (url) URL.revokeObjectURL(url);

    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clean up object URLs when modal closes or component unmounts
  const clearGallerySelections = () => {
    galleryPreviews.forEach(url => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    setGalleryPreviews([]);
    setGalleryFiles([]);
    setExistingGallery([]);
  };

  const handleAddProduct = () => {
    setEditMode(false);
    setThumbnailPreview(null);
    setFormData({
      id: '', category_id: '', name: '', slug: '', thumbnail: null,
      content: '', description: '', price_buy: '', status: 1
    });
    setAttributeGroups([]);
    clearGallerySelections();
    setShowModal(true);
  };

  const parseProductAttributeGroups = (product) => {
    // try to read product.product_attributes (if backend returns related models)
    // return array of { attribute_id, values }
    if (!product) return [];
    const pa = product.product_attributes || product.product_attribute || product.attributes;
    if (!pa) return [];
    // If pa is array of objects -> group by attribute_id
    if (Array.isArray(pa) && pa.length > 0) {
      if (typeof pa[0] === 'object' && pa[0] !== null && 'value' in pa[0]) {
        const map = {};
        pa.forEach(item => {
          const aid = item.attribute_id || '0';
          map[aid] = map[aid] || [];
          map[aid].push(String(item.value));
        });
        return Object.keys(map).map(aid => ({ attribute_id: aid, values: Array.from(new Set(map[aid])) }));
      } else {
        // array of strings (no attribute id)
        return [{ attribute_id: '', values: pa.map(String) }];
      }
    }
    // if string => try parse JSON or comma
    if (typeof pa === 'string') {
      try {
        const decoded = JSON.parse(pa);
        if (Array.isArray(decoded)) return [{ attribute_id: '', values: decoded.map(String) }];
      } catch {}
      const parts = pa.split(',').map(s => s.trim()).filter(Boolean);
      return [{ attribute_id: '', values: parts }];
    }
    return [];
  };

  const handleEditProduct = (product) => {
    setEditMode(true);
    const imageUrl = product.image_url || (product.thumbnail ? (IMAGE_BASE_URL + product.thumbnail) : null);
    setThumbnailPreview(imageUrl);
    setFormData({
      ...formData,
      id: product.id,
      category_id: product.category_id || '',
      name: product.name || '',
      slug: product.slug || '',
      thumbnail: product.thumbnail || null,
      content: product.content || '',
      description: product.description || '',
      price_buy: product.price_buy || product.price || '',
      status: product.status ?? 1
    });

    const groups = parseProductAttributeGroups(product).map(g => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      attribute_id: g.attribute_id ? String(g.attribute_id) : '',
      values: g.values || [],
      input: ''
    }));
    setAttributeGroups(groups.length ? groups : []);

    // existing gallery images (the backend returns list_images or gallery)
    // list_images: [{id, url, alt}] in index; gallery: [{id,url}] in show
    const listImgs = product.list_images || product.gallery || product.images || [];
    // Normalize to array of {id, url}
    const normalized = (Array.isArray(listImgs) ? listImgs : []).map(img => {
      if (typeof img === 'string') return { id: null, url: img };
      if (img && img.url) return { id: img.id || null, url: img.url };
      if (img && img.image) return { id: img.id || null, url: (img.image.startsWith('http') ? img.image : IMAGE_BASE_URL + img.image) };
      return null;
    }).filter(Boolean);
    setExistingGallery(normalized);

    // reset new gallery selections
    setGalleryFiles([]);
    galleryPreviews.forEach(url => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    setGalleryPreviews([]);

    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = String(name || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  const formatPrice = (price) => {
    if (price === '' || price === null || price === undefined) return '0₫';
    return Number(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫';
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      data.append('category_id', formData.category_id);
      data.append('name', formData.name);
      data.append('slug', formData.slug);
      data.append('content', formData.content);
      data.append('description', formData.description);
      data.append('price_buy', formData.price_buy);
      data.append('status', formData.status);
      data.append('quantity', 100);

      if (formData.thumbnail && formData.thumbnail instanceof File) {
        data.append('thumbnail', formData.thumbnail);
      }

      // append gallery files (multiple) as images[]
      if (galleryFiles.length > 0) {
        galleryFiles.forEach(file => {
          data.append('images[]', file);
        });
      }

      // Send attribute groups as product_attributes JSON (array of objects)
      // Each object: { attribute_id: 1, values: ['S','M'] }
      if (attributeGroups.length > 0) {
        const prepared = attributeGroups.map(g => ({
          attribute_id: g.attribute_id || null,
          values: Array.isArray(g.values) ? g.values : []
        }));
        data.append('product_attributes', JSON.stringify(prepared));
      }

      // For backward compatibility, also add single attribute_id/product_attribute[] if only 1 group selected
      if (attributeGroups.length === 1 && attributeGroups[0].attribute_id) {
        data.append('attribute_id', String(attributeGroups[0].attribute_id));
        (attributeGroups[0].values || []).forEach(v => data.append('product_attribute[]', String(v)));
      }

      // debug log
      console.group('DEBUG FormData entries');
      for (const pair of data.entries()) {
        console.log(pair[0], pair[1]);
      }
      console.groupEnd();

      let response;
      if (editMode) {
        data.append('_method', 'PUT');
        response = await ProductService.update(formData.id, data);
      } else {
        response = await ProductService.create(data);
      }

      if (response.status) {
        alert(editMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        setShowModal(false);
        setAttributeGroups([]);
        setFormData(prev => ({ ...prev, attribute_id: '' }));
        clearGallerySelections();
        fetchProducts(pagination.current_page, searchTerm);
      } else {
        alert(response.message || 'Không thể lưu sản phẩm');
      }
    } catch (err) {
      console.error('Submit error', err);
      const errResponse = err.response?.data;
      if (errResponse?.errors) {
        const firstError = Object.values(errResponse.errors)[0][0];
        alert(`Lỗi: ${firstError}`);
      } else {
        alert(errResponse?.message || 'Lỗi hệ thống hoặc kết nối');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Render UI ---
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Products</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Products List</h2>
            <div className="flex gap-3">
              <button onClick={handleAddProduct} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> <span className="font-medium">Add Product</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">#{product.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url || (product.thumbnail ? IMAGE_BASE_URL + product.thumbnail : 'https://via.placeholder.com/50')}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white block">{product.name}</span>
                        {/* small attribute preview */}
                        {(() => {
                          const pa = product.product_attributes || product.product_attribute || product.attributes;
                          if (!pa) return null;
                          let display = [];
                          if (Array.isArray(pa)) {
                            if (pa.length && typeof pa[0] === 'object' && pa[0] !== null && 'value' in pa[0]) {
                              display = pa.map(x => x.value);
                            } else {
                              display = pa;
                            }
                          } else if (typeof pa === 'string') {
                            try {
                              const p = JSON.parse(pa);
                              if (Array.isArray(p)) display = p;
                              else display = pa.split(',').map(s => s.trim()).filter(Boolean);
                            } catch {
                              display = pa.split(',').map(s => s.trim()).filter(Boolean);
                            }
                          }
                          if (!display || display.length === 0) return null;
                          return (
                            <div className="flex gap-1 mt-1">
                              {display.map(a => <span key={a} className="text-xs px-2 py-0.5 bg-gray-100 rounded">{a}</span>)}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{categories.find(c => c.id === Number(product.category_id))?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{formatPrice(product.price_buy || product.price)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Number(product.status) === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {Number(product.status) === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditProduct(product)} className="p-2 hover:bg-blue-50 rounded-lg group">
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </button>
                      <button onClick={() => {
                        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
                        ProductService.delete(product.id).then(res => {
                          if (res.status) fetchProducts(pagination.current_page, searchTerm);
                        }).catch(err => console.error(err));
                      }} className="p-2 hover:bg-red-50 rounded-lg group">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500">Page {pagination.current_page} of {pagination.last_page}</div>
          <div className="flex gap-2">
            <button onClick={() => changePage(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button onClick={() => changePage(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editMode ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => { setShowModal(false); clearGallerySelections(); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6" encType="multipart/form-data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Category *</label>
                  <select name="category_id" value={formData.category_id} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg">
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Product Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleNameChange} required className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Slug</label>
                  <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Price (VNĐ) *</label>
                  <input type="number" name="price_buy" value={formData.price_buy} onChange={handleChange} required min="0" className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Thumbnail Image</label>
                  <div className="flex items-center gap-4">
                    {thumbnailPreview && (
                      <div className="w-20 h-20 border rounded-lg overflow-hidden shrink-0">
                        <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input type="file" name="thumbnail" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </div>

                {/* GALLERY IMAGES */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Gallery Images (Multiple)</label>
                  <div className="flex items-center gap-4 mb-3">
                    <input type="file" name="images[]" onChange={handleGalleryFiles} accept="image/*" multiple className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {/* existing gallery (from backend) */}
                    {existingGallery.length > 0 && existingGallery.map((img, idx) => (
                      <div key={`existing-${idx}`} className="w-20 h-20 border rounded-lg overflow-hidden relative">
                        <img src={img.url} alt={`img-${idx}`} className="w-full h-full object-cover" />
                        {/* optionally show a small badge */}
                        <div className="absolute left-1 top-1 bg-white/80 text-xs px-1 rounded">Old</div>
                      </div>
                    ))}

                    {/* new selected gallery previews */}
                    {galleryPreviews.length > 0 && galleryPreviews.map((url, idx) => (
                      <div key={`new-${idx}`} className="w-20 h-20 border rounded-lg overflow-hidden relative">
                        <img src={url} alt={`new-${idx}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeNewGalleryImage(idx)} className="absolute right-1 top-1 bg-white/80 rounded px-1 text-sm">×</button>
                      </div>
                    ))}

                    {existingGallery.length === 0 && galleryPreviews.length === 0 && (
                      <div className="text-sm text-gray-400">Chưa có ảnh gallery nào.</div>
                    )}
                  </div>
                </div>

                {/* ATTRIBUTE GROUPS */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold">Thuộc tính & Biến thể</label>
                    <button type="button" onClick={addAttributeGroup} className="text-sm px-3 py-1 bg-green-500 text-white rounded">Thêm thuộc tính</button>
                  </div>

                  <div className="space-y-3">
                    {attributeGroups.length === 0 && <div className="text-sm text-gray-400">Chưa có thuộc tính nào.</div>}

                    {attributeGroups.map(group => (
                      <div key={group.id} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                          <select value={group.attribute_id} onChange={(e) => setGroupField(group.id, 'attribute_id', e.target.value)} className="px-3 py-2 border rounded w-48">
                            <option value="">-- Chọn thuộc tính --</option>
                            {attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>

                          <div className="flex-1">
                            <input value={group.input} onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault(); addValuesToGroup(group.id);
                              }
                            }} onChange={(e) => setGroupField(group.id, 'input', e.target.value)} placeholder="Nhập giá trị (nhấn Enter hoặc dấu phẩy để thêm)" className="w-full px-3 py-2 border rounded" />
                          </div>

                          <button type="button" onClick={() => addValuesToGroup(group.id)} className="px-3 py-2 bg-blue-600 text-white rounded">Thêm</button>

                          <button type="button" onClick={() => removeAttributeGroup(group.id)} className="ml-2 text-red-600">Xóa</button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {group.values.map(v => (
                            <div key={v} className="flex items-center gap-2 bg-white border px-3 py-1 rounded">
                              <span className="text-sm">{v}</span>
                              <button type="button" onClick={() => removeValueFromGroup(group.id, v)} className="text-red-500">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Content</label>
                  <textarea name="content" value={formData.content} onChange={handleChange} rows={4} className="w-full px-4 py-3 border rounded-lg resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button type="button" onClick={() => { setShowModal(false); clearGallerySelections(); }} className="px-6 py-3 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <Save className="w-5 h-5" /> {editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}