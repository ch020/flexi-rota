import axios from 'axios';

// Use the environment variable to set the base URL for your API
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
console.log("Base URL:", baseURL);

/**
 * Gets the cookie with the specified name, or null if not found.
 * @param name - The name of the cookie to retrieve.
 * @returns {string|null}
 */
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

/**
 * Base API object for all FlexiRota API calls. Automatically handles authorisation.
 * @type {axios.AxiosInstance}
 */
const api = axios.create({
    baseURL,          // Set base URL to the environment variable
    withCredentials: true, // Ensure cookies are sent with each request
});

api.interceptors.request.use(
    config => {
        const access = getCookie('access');
        if (access) {
            config.headers['Authorization'] = `Bearer ${access}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            getCookie('refresh')
        ) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(`${baseURL}token/refresh/`, {
                    refresh: getCookie('refresh'),
                });

                const newAccess = res.data.access;
                document.cookie = `access=${newAccess};path=/`;

                originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
                return api(originalRequest);
            } catch (error) {
                console.error('Token refresh failed: ', error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

/**
 * Sets authorisation cookies. Should be called upon login.
 * @param {string} access - The access token.
 * @param {string} refresh - The refresh token.
 */
export function setAuthCookies(access, refresh) {
    document.cookie = `access=${access};path=/`;
    document.cookie = `refresh=${refresh};path=/`;
}

/**
 * Clears any authorisation cookies. Should be called upon logout.
 */
export function clearAuthCookies() {
    document.cookie = 'access=; Max-Age=0; path=/';
    document.cookie = 'refresh=; Max-Age=0; path=/';
}
