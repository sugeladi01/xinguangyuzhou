/* ============================================
   api.js — 统一 API 配置与请求封装
   ============================================ */

const API_BASE = '';

// Token 管理
const TokenManager = {
    getToken() {
        return localStorage.getItem('xinguang_token') || '';
    },
    setToken(token) {
        localStorage.setItem('xinguang_token', token);
    },
    removeToken() {
        localStorage.removeItem('xinguang_token');
    },
    getUser() {
        try {
            const u = localStorage.getItem('xinguang_user');
            return u ? JSON.parse(u) : null;
        } catch { return null; }
    },
    setUser(user) {
        localStorage.setItem('xinguang_user', JSON.stringify(user));
    },
    removeUser() {
        localStorage.removeItem('xinguang_user');
    },
    isLoggedIn() {
        return !!this.getToken();
    }
};

// 通用请求封装
async function apiRequest(path, options = {}) {
    const url = API_BASE + path;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    const token = TokenManager.getToken();
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    try {
        const resp = await fetch(url, { ...options, headers });
        const data = await resp.json();
        if (resp.status === 401) {
            // Token 过期或无效
            TokenManager.removeToken();
            TokenManager.removeUser();
        }
        return data;
    } catch (err) {
        console.error('API request failed:', path, err);
        return { code: -1, message: '网络请求失败，请检查网络连接' };
    }
}

// ===== Auth API =====
const AuthAPI = {
    async register(username, password, nickname) {
        const res = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, nickname })
        });
        if (res.code === 201 && res.data) {
            TokenManager.setToken(res.data.token);
            TokenManager.setUser(res.data.user);
        }
        return res;
    },
    async login(username, password) {
        const res = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        if (res.code === 200 && res.data) {
            TokenManager.setToken(res.data.token);
            TokenManager.setUser(res.data.user);
        }
        return res;
    },
    async getProfile() {
        return apiRequest('/api/auth/profile');
    },
    logout() {
        TokenManager.removeToken();
        TokenManager.removeUser();
    }
};

// ===== Messages API =====
const MessagesAPI = {
    async getList(page = 1, pageSize = 20) {
        return apiRequest(`/api/messages?page=${page}&pageSize=${pageSize}`);
    },
    async create(content) {
        return apiRequest('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    },
    async remove(id) {
        return apiRequest(`/api/messages/${id}`, { method: 'DELETE' });
    }
};

// ===== Shares API =====
const SharesAPI = {
    async getList(page = 1, pageSize = 20, category) {
        let url = `/api/shares?page=${page}&pageSize=${pageSize}`;
        if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
        return apiRequest(url);
    },
    async getDetail(id) {
        return apiRequest(`/api/shares/${id}`);
    },
    async create(title, category, content, cover = '') {
        return apiRequest('/api/shares', {
            method: 'POST',
            body: JSON.stringify({ title, category, content, cover })
        });
    },
    async like(id) {
        return apiRequest(`/api/shares/${id}/like`, { method: 'POST' });
    },
    async remove(id) {
        return apiRequest(`/api/shares/${id}`, { method: 'DELETE' });
    }
};

// ===== Seminars API =====
const SeminarsAPI = {
    async getList(page = 1, pageSize = 20, tab) {
        let url = `/api/seminars?page=${page}&pageSize=${pageSize}`;
        if (tab) url += `&tab=${encodeURIComponent(tab)}`;
        return apiRequest(url);
    },
    async getDetail(id) {
        return apiRequest(`/api/seminars/${id}`);
    },
    async create(title, description, mode, time_display, tags) {
        return apiRequest('/api/seminars', {
            method: 'POST',
            body: JSON.stringify({ title, description, mode, time_display, tags })
        });
    },
    async like(id) {
        return apiRequest(`/api/seminars/${id}/like`, { method: 'POST' });
    },
    async join(id) {
        return apiRequest(`/api/seminars/${id}/join`, { method: 'POST' });
    },
    async addComment(id, content) {
        return apiRequest(`/api/seminars/${id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }
};

// ===== Goals API =====
const GoalsAPI = {
    async getList(category, done) {
        let url = '/api/goals';
        const params = [];
        if (category && category !== 'all') params.push(`category=${encodeURIComponent(category)}`);
        if (done !== undefined) params.push(`done=${done}`);
        if (params.length) url += '?' + params.join('&');
        return apiRequest(url);
    },
    async create(text, category, priority = 1) {
        return apiRequest('/api/goals', {
            method: 'POST',
            body: JSON.stringify({ text, category, priority })
        });
    },
    async update(id, updates) {
        return apiRequest(`/api/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },
    async remove(id) {
        return apiRequest(`/api/goals/${id}`, { method: 'DELETE' });
    }
};
