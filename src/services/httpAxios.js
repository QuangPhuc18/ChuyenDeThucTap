import axios from 'axios';

const httpAxios = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    headers: {
        'Accept': 'application/json',
    },
});

httpAxios.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        return Promise.reject(error);
    }
);      

export default httpAxios;
