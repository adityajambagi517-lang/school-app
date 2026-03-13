import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (userId: string, password: string) => {
        const response = await api.post('/auth/login', { userId, password });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await api.patch('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile');
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    updateProfile: async (data: any) => {
        const response = await api.patch('/auth/profile', data);
        if (response.data) {
            // Update stored user info
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, ...response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return response.data;
    },

    uploadProfilePicture: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/auth/profile/upload-picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data && response.data.url) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            currentUser.profilePicture = response.data.url;
            localStorage.setItem('user', JSON.stringify(currentUser));
        }
        return response.data;
    },
};

export const markcardsService = {
    create: async (data: any) => {
        const response = await api.post('/markcards', data);
        return response.data;
    },
    bulkCreate: async (data: any) => {
        const response = await api.post('/markcards/bulk', data);
        return response.data;
    },
    submit: async (id: string) => {
        const response = await api.patch(`/markcards/${id}/submit`);
        return response.data;
    },
    getByClass: async (classId: string) => {
        const response = await api.get(`/markcards/class/${classId}`);
        return response.data;
    },
    getStudentMarks: async (studentId: string) => {
        const response = await api.get(`/markcards/student/${studentId}`);
        return response.data;
    },
};

export const feesService = {
    create: async (data: any) => {
        const response = await api.post('/fees', data);
        return response.data;
    },
    submit: async (id: string) => {
        const response = await api.patch(`/fees/${id}/submit`);
        return response.data;
    },
    getByClass: async (classId: string) => {
        const response = await api.get(`/fees/class/${classId}`);
        return response.data;
    },
    getStudentFees: async (studentId: string) => {
        const response = await api.get(`/fees/student/${studentId}`);
        return response.data;
    },
};

export const attendanceService = {
    create: async (data: any) => {
        const response = await api.post('/attendance', data);
        return response.data;
    },
    bulkCreate: async (data: any) => {
        const response = await api.post('/attendance/bulk', data);
        return response.data;
    },
    getByClass: async (classId: string, date?: string) => {
        const params = date ? { date } : {};
        const response = await api.get(`/attendance/class/${classId}`, { params });
        return response.data;
    },
    getByStudent: async (studentId: string) => {
        const response = await api.get(`/attendance/student/${studentId}`);
        return response.data;
    },
};

export const studentsService = {
    getByClass: async (classId: string) => {
        const response = await api.get(`/students/class/${classId}`);
        return response.data;
    },
    search: async (query: string) => {
        const response = await api.get(`/students/search?q=${query}`);
        return response.data;
    },
};

export const classesService = {
    create: async (data: any) => {
        const response = await api.post('/classes', data);
        return response.data;
    },
    getAll: async () => {
        const response = await api.get('/classes');
        return response.data;
    },
    getByStudent: async (studentId: string) => {
        const response = await api.get(`/students/${studentId}/class`);
        return response.data;
    },
    assignTeacher: async (classId: string, teacherId: string) => {
        const response = await api.patch(`/classes/${classId}/assign-teacher`, { teacherId });
        return response.data;
    },
    delete: async (classId: string) => {
        const response = await api.delete(`/classes/${classId}`);
        return response.data;
    },
};

export const teachersService = {
    getAll: async () => {
        const response = await api.get('/teachers');
        return response.data;
    },
};

export const subjectsService = {
    create: async (data: any) => {
        const response = await api.post('/subjects', data);
        return response.data;
    },
    getAll: async () => {
        const response = await api.get('/subjects');
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/subjects/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/subjects/${id}`);
        return response.data;
    },
};

export const homeworkService = {
    create: async (data: any) => {
        const response = await api.post('/homework', data);
        return response.data;
    },
    getByClass: async (classId: string) => {
        const response = await api.get(`/homework/class/${classId}`);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/homework/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/homework/${id}`);
        return response.data;
    },
};

export const timetableService = {
    getByClass: async (classId: string) => {
        const response = await api.get(`/timetable/class/${classId}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/timetable', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/timetable/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/timetable/${id}`);
        return response.data;
    },
};

export const notificationsService = {
    getAll: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },
    markAsRead: async (id: string) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },
};

export const approvalsService = {
    getPending: async () => {
        const response = await api.get('/markcards/pending-approvals');
        return response.data;
    },
    approve: async (id: string, comments?: string) => {
        const response = await api.patch(`/markcards/edit-request/${id}/approve`, { comments });
        return response.data;
    },
    bulkApprove: async (editRequestIds: string[], comments?: string) => {
        const response = await api.patch('/markcards/bulk-approve', { editRequestIds, comments });
        return response.data;
    },
};

export const analyticsService = {
    getStudentPerformance: async (studentId: string) => {
        const response = await api.get(`/analytics/student/${studentId}/performance`);
        return response.data;
    },
    getStudentAttendanceRate: async (studentId: string, startDate: string, endDate: string) => {
        const response = await api.get(`/analytics/student/${studentId}/attendance-rate`, {
            params: { startDate, endDate }
        });
        return response.data;
    },
    getStudentSubjectAttendance: async (studentId: string, startDate: string, endDate: string) => {
        const response = await api.get(`/analytics/student/${studentId}/subject-attendance`, {
            params: { startDate, endDate }
        });
        return response.data;
    },
};

export const usersService = {
    getAll: async (page = 1, limit = 50) => {
        const response = await api.get('/users', { params: { page, limit } });
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    resetPassword: async (id: string) => {
        const response = await api.patch(`/users/${id}/reset-password`);
        return response.data;
    },
    toggleStatus: async (id: string) => {
        const response = await api.patch(`/users/${id}/toggle-status`);
        return response.data;
    },
};

export const noticesService = {
    create: async (formData: FormData) => {
        const response = await api.post('/notices', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    getAll: async () => {
        const response = await api.get('/notices');
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/notices/${id}`);
        return response.data;
    },
    toggleActive: async (id: string, isActive: boolean) => {
        const response = await api.patch(`/notices/${id}/toggle-active`, { isActive });
        return response.data;
    },
};

export default api;
