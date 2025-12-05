import axios from "axios";
const http = axios.create({
baseURL: "http://127.0.0.1:8000/api/",

  
});
httpAxios.interceptors.reponse.use(function onFulfilled(response) {
    return response.data;


},function onRejected(error) {
    return Promise.reject(error);
}

);
export default  httpAxios;