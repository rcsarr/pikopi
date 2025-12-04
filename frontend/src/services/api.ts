// API Configuration
// Change this to your backend URL or set VITE_API_URL in environment variable
// ✅ FIXED: Tambahkan /api di base URL
const API_BASE_URL = 'http://localhost:5010/api';


// Token management
export const getToken = (): string | null => {
  return localStorage.getItem("authToken");
};

export const setToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

export const removeToken = (): void => {
  localStorage.removeItem("authToken");
};

// API Request helper
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  companyName?: string;
}

interface UpdateProfileData {
  name?: string;
  phone?: string;
  companyName?: string;
  address?: string; // ✅ Added address
  profileImage?: File | null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = false, headers = {}, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  // ✅ Use Record<string, string> to avoid HeadersInit type issues
  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  // ✅ Hanya set Content-Type jika body BUKAN FormData
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // ✅ Add authentication token if available (not just if required)
  const token = getToken();
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  } else if (requiresAuth) {
    throw new Error('Authentication required. Please login first.');
  }

  try {
    console.log(
      `${fetchOptions.method || 'GET'} ${url}`,  // ✅ Log full URL
      fetchOptions.body instanceof FormData ? '[FormData]' :
        token ? 'WITH TOKEN' : 'NO TOKEN'  // ✅ Show token status
    );

    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      credentials: 'include',  // ✅ IMPORTANT: Add this for cookies/sessions
    });

    // ✅ Log response status
    console.log(`Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      if (response.status === 401) {
        // Jangan hapus token untuk endpoint login/register
        const isAuthEndpoint = endpoint === '/auth/login' || endpoint === '/auth/register';

        if (!isAuthEndpoint) {
          removeToken();
          localStorage.removeItem('user');
          throw new Error('Sesi berakhir. Silakan login kembali.');
        }
      }

      let errorMessage = 'Terjadi kesalahan pada server';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = `${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    // ✅ Handle empty responses (204, etc.)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data as T;
    } else {
      // Return success object for empty responses
      return { success: true } as T;
    }

  } catch (error) {
    console.error('API Request Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan di http://localhost:5010');
  }
}


// Auth API
export const authAPI = {
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    companyName?: string;
    address?: string;
    role?: string;
  }) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: {
        userId: string;
        email: string;
        name: string;
        role: string;
        emailVerificationRequired: boolean;
      };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  login: async (email: string, password: string, role?: string) => {
    const response = await apiRequest<{
      success: boolean;
      message: string;
      data: {
        token: string;
        user: {
          id: string;
          email: string;
          name: string;
          role: string;
          phone?: string;
          profileImage?: string;
          emailVerified: boolean;
        };
        expiresIn: number;
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });

    // Save token to localStorage
    if (response.success && response.data.token) {
      setToken(response.data.token);
      // Also save user data for quick access
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  },

  getCurrentUser: async () => {
    return apiRequest<{
      success: boolean;
      data: {
        id: string;
        email: string;
        name: string;
        role: string;
        phone?: string;
        profileImage?: string;
        companyName?: string;
        address?: string;
        emailVerified: boolean;
      };
    }>("/auth/me", {
      method: "GET",
      requiresAuth: true,
    });
  },

  // ✅ UNIFIED updateProfile function - menggabungkan kedua versi
  updateProfile: async (data: UpdateProfileData) => {
    // Jika ada profileImage dan berupa File, kirim sebagai FormData
    if (data.profileImage && data.profileImage instanceof File) {
      const formData = new FormData();

      if (data.name) formData.append('name', data.name);
      if (data.phone) formData.append('phone', data.phone);
      if (data.companyName) formData.append('companyName', data.companyName);
      if (data.address) formData.append('address', data.address);
      formData.append('profileImage', data.profileImage);

      const response = await apiRequest<{
        success: boolean;
        message: string;
        data: {
          id: string;
          email: string;
          name: string;
          role: string;
          phone?: string;
          profileimage?: string;  // backend return lowercase
          companyname?: string;   // backend return lowercase
          address?: string;
          emailVerified: boolean;
        };
      }>("/auth/update-profile", {
        method: 'PUT',
        body: formData,
        requiresAuth: true,
      });

      // Update user data in localStorage
      if (response.success && response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }

      return response;
    }

    // Jika tidak ada file, kirim sebagai JSON (exclude profileImage)
    const { profileImage, ...jsonData } = data;

    const response = await apiRequest<{
      success: boolean;
      message: string;
      data: {
        id: string;
        email: string;
        name: string;
        role: string;
        phone?: string;
        profileimage?: string;
        companyname?: string;
        address?: string;
        emailVerified: boolean;
      };
    }>("/auth/update-profile", {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(jsonData),
    });

    // Update user data in localStorage
    if (response.success && response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
    }

    return response;
  },

  logout: async () => {
    try {
      await apiRequest<{
        success: boolean;
        message: string;
      }>("/auth/logout", {
        method: "POST",
        requiresAuth: true,
      });
    } catch (error) {
      console.warn(
        "Logout endpoint failed, clearing local storage anyway:",
        error
      );
    } finally {
      removeToken();
      localStorage.removeItem("user");
    }
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return apiRequest<{
      success: boolean;
      message: string;
      status: string;
      database: string;
    }>("/health", {  // ✅ FIXED: Hapus /api
      method: "GET",
    });
  },
};

// Forum API
export const forumAPI = {
  getThreads: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category) queryParams.append("category", params.category);
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return apiRequest<{
      success: boolean;
      data: Array<{  // ✅ FIXED: data is array, not object with threads
        id: string;
        title: string;
        content?: string;  // ✅ ADD content
        authorId: string;
        authorName: string;
        authorRole: string;
        category: string;
        isPinned: boolean;
        isLocked: boolean;
        messagesCount: number;
        viewsCount: number;
        lastActivity: string;
        createdAt: string;
      }>;
    }>(`/forum/threads${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  getThreadMessages: async (threadId: string) => {
    return apiRequest<{
      success: boolean;
      data: {
        thread: any;
        messages: Array<{
          id: string;
          authorName: string;
          authorRole: string;
          content: string;
          likesCount: number;
          createdAt: string;
          replies?: Array<{
            id: string;
            authorName: string;
            content: string;
            createdAt: string;
          }>;
        }>;
        pagination: any;
      };
    }>(`/forum/threads/${threadId}/messages`, {
      method: "GET",
    });
  },

  createThread: async (data: {
    title: string;
    content: string;
    category: string;
  }) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: {
        threadId: string;
        thread: any;
        firstMessage: any;
      };
    }>("/forum/threads", {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  },

  // ✅ RENAMED: postMessage (keep this name)
  postMessage: async (
    threadId: string,
    data: { content: string; parentMessageId?: string }
  ) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: {
        id: string;           // ✅ ADD id
        messageId: string;
        authorName: string;   // ✅ ADD authorName
        authorRole: string;   // ✅ ADD authorRole
        content: string;      // ✅ ADD content
        createdAt: string;    // ✅ ADD createdAt
        likesCount: number;   // ✅ ADD likesCount
        message: any;
      };
    }>(`/forum/threads/${threadId}/messages`, {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  },



  deleteThread: async (threadId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/forum/threads/${threadId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },

  deleteMessage: async (messageId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/forum/messages/${messageId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },
};

// Batch API
export const batchAPI = {
  getOrderBatches: async (orderId: string) => {
    return apiRequest<{
      success: boolean;
      data: Array<{
        id: string;
        orderId: string;
        batchNumber: number;
        status: string;
        totalWeight: number;
        totalBeans: number;
        healthyBeans: number;
        defectiveBeans: number;
        accuracy: number;
        imageUrl?: string;
        sampleHealthy1Url?: string;
        sampleHealthy2Url?: string;
        sampleDefective1Url?: string;
        sampleDefective2Url?: string;
        createdAt: string;
      }>;
    }>(`/orders/${orderId}/batches`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  getBatchesHistory: async (params: { period: 'month' | 'year', year: number, month?: number }) => {
    const queryParams = new URLSearchParams({
      period: params.period,
      year: params.year.toString(),
      ...(params.month && { month: params.month.toString() })
    });

    return apiRequest<{
      success: boolean;
      data: Array<{
        id: string;
        orderId: string;
        batchNumber: number;
        status: string;
        totalWeight: number;
        totalBeans: number;
        healthyBeans: number;
        defectiveBeans: number;
        accuracy: number;
        imageUrl?: string;
        sampleHealthy1Url?: string;
        sampleHealthy2Url?: string;
        sampleDefective1Url?: string;
        sampleDefective2Url?: string;
        createdAt: string;
      }>;
    }>(`/batches/history?${queryParams}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  autoGenerateBatches: async (orderId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: Array<{
        id: string;
        orderId: string;
        batchNumber: number;
        status: string;
        totalWeight: number;
        totalBeans: number;
        healthyBeans: number;
        defectiveBeans: number;
        accuracy: number;
        createdAt: string;
      }>;
    }>(`/orders/${orderId}/batches/auto-generate`, {
      method: "POST",
      requiresAuth: true,
    });
  },

  updateBatch: async (batchId: string, data: any) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: any;
    }>(`/batches/${batchId}`, {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  },
};

// Notification API
export const notificationAPI = {
  getNotifications: async (unreadOnly = false) => {
    return apiRequest<{
      success: boolean;
      data: Array<{
        id: string;
        userId: string;
        title: string;
        message: string;
        type: string;
        isRead: boolean;
        link?: string;
        createdAt: string;
      }>;
    }>(`/notifications?unread=${unreadOnly}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  getUnreadCount: async () => {
    return apiRequest<{
      success: boolean;
      count: number;
    }>("/notifications/unread-count", {
      method: "GET",
      requiresAuth: true,
    });
  },

  markAsRead: async (notificationId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
      requiresAuth: true,
    });
  },

  markAllAsRead: async () => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>("/notifications/mark-all-read", {
      method: "PATCH",
      requiresAuth: true,
    });
  },

  deleteNotification: async (notificationId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/notifications/${notificationId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },
};


// News API
export const newsAPI = {
  getAllNews: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    includeDrafts?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category && params.category !== "all")
      queryParams.append("category", params.category);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.includeDrafts) queryParams.append("includeDrafts", "true");

    const query = queryParams.toString();
    return apiRequest<{
      success: boolean;
      data: {
        news: Array<{
          id: string;
          title: string;
          content: string;
          excerpt: string;
          imageUrl: string;
          authorName: string;
          category: string;
          isPublished: boolean;
          publishedAt: string;
          viewsCount: number;
          createdAt: string;
          updatedAt: string;
        }>;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
        };
      };
    }>(`/news${query ? `?${query}` : ""}`, {  // ✅ FIXED: Hapus /api
      method: "GET",
    });
  },

  getNewsDetail: async (newsId: string) => {
    return apiRequest<{
      success: boolean;
      data: {
        id: string;
        title: string;
        content: string;
        excerpt: string;
        imageUrl: string;
        authorName: string;
        category: string;
        isPublished: boolean;
        publishedAt: string;
        viewsCount: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/news/${newsId}`, {  // ✅ FIXED: Hapus /api
      method: "GET",
    });
  },

  createNews: async (data: {
    title: string;
    content: string;
    excerpt?: string;
    category?: string;
    imageUrl?: string;
    isPublished?: boolean;
  }) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: {
        id: string;
        title: string;
        content: string;
        excerpt: string;
        imageUrl: string;
        authorName: string;
        category: string;
        isPublished: boolean;
        publishedAt: string;
        viewsCount: number;
        createdAt: string;
        updatedAt: string;
      };
    }>("/news", {  // ✅ FIXED: Hapus /api
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  },

  updateNews: async (
    newsId: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      category?: string;
      imageUrl?: string;
      isPublished?: boolean;
    }
  ) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: {
        id: string;
        title: string;
        content: string;
        excerpt: string;
        imageUrl: string;
        authorName: string;
        category: string;
        isPublished: boolean;
        publishedAt: string;
        viewsCount: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/news/${newsId}`, {  // ✅ FIXED: Hapus /api
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  },

  deleteNews: async (newsId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/news/${newsId}`, {  // ✅ FIXED: Hapus /api
      method: "DELETE",
      requiresAuth: true,
    });
  },
};

// Admin API
export const adminAPI = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.role) queryParams.append("role", params.role);
    if (params?.status) queryParams.append("status", params.status);

    const query = queryParams.toString();
    return apiRequest<{
      success: boolean;
      data: {
        users: Array<{
          id: string;
          name: string;
          email: string;
          phone?: string;
          companyName?: string;
          role: string;
          isActive: boolean;
          createdAt: string;
          lastLogin?: string;
        }>;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
        };
      };
    }>(`/admin/users${query ? `?${query}` : ""}`, {  // ✅ FIXED: Hapus /api
      method: "GET",
      requiresAuth: true,
    });
  },

  getUserDetail: async (userId: string) => {
    return apiRequest<{
      success: boolean;
      data: {
        user: any;
        orders: any[];
      };
    }>(`/admin/users/${userId}`, {  // ✅ FIXED: Hapus /api
      method: "GET",
      requiresAuth: true,
    });
  },

  updateUser: async (
    userId: string,
    data: {
      name?: string;
      phone?: string;
      companyName?: string;
      role?: string;
      isActive?: boolean;
    }
  ) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: any;
    }>(`/admin/users/${userId}`, {  // ✅ FIXED: Hapus /api
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (userId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/admin/users/${userId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },

  getStatistics: async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    return apiRequest<{
      success: boolean;
      data: {
        overview: {
          totalUsers: number;
          activeUsers: number;
          inactiveUsers: number;
          adminUsers: number;
          regularUsers: number;
          totalOrders: number;
          pendingOrders: number;
          processingOrders: number;
          completedOrders: number;
          cancelledOrders: number;
          totalRevenue: number;
          totalKilograms: number;
        };
        revenueChart: Array<{ date: string; revenue: number }>;
        orderStatusChart: {
          pending: number;
          processing: number;
          completed: number;
          cancelled: number;
        };
      };
    }>(`/admin/statistics?period=${period}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  getPerformanceData: async (since?: string) => {
    const query = since ? `?since=${since}` : '';
    return apiRequest<{
      success: boolean;
      data: Array<{
        id: string;
        timestamp: string;
        accuracy: number;
        orderId: string;
      }>;
    }>(`/statistics/admin/performance${query}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
};

// ============================================
// MACHINE / AI APIs
// ============================================
export const machineAPI = {
  analyzeFrame: async (imageBlob: Blob) => {
    const formData = new FormData();
    formData.append('image', imageBlob, 'frame.jpg');

    return apiRequest<{
      success: boolean;
      data: {
        status: 'healthy' | 'defect';
        accuracy: number;
        label: string;
      };
    }>('/machine/analyze', {
      method: 'POST',
      body: formData,
      requiresAuth: true,
    });
  },
};

// ============================================
// MACHINE CONTROL APIs
// ============================================
export const machineControlAPI = {
  getMachines: async () => {
    return apiRequest<{
      success: boolean;
      data: any[];
    }>('/machines', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  toggleMachine: async (machineId: string, target: 'power') => {
    return apiRequest<{
      success: boolean;
      data: any;
    }>(`/machines/${machineId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ target }),
      requiresAuth: true,
    });
  },

  createLog: async (machineId: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: any;
    }>(`/machines/${machineId}/logs`, {
      method: 'POST',
      body: JSON.stringify({ message, type }),
      requiresAuth: true,
    });
  },

  createMachine: async (data: { name: string; location: string }) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: any;
    }>('/machines', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  }
};

// ============================================
// ORDER APIs
// ============================================
export const orderAPI = {
  createOrder: async (orderData: {
    packageName: string;
    weight: number;
    price: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    coffeeType?: string;
    deliveryDate?: string | null;
    notes?: string | null;
  }) => {
    return apiRequest('/orders', {  // ✅ FIXED: Sudah benar (tanpa /api)
      method: 'POST',
      body: JSON.stringify(orderData),
      requiresAuth: true,
    });
  },

  getOrders: async () => {
    return apiRequest<{
      success: boolean;
      data: Array<{
        id: string;
        userId: string;
        userName: string;
        packageName: string;
        weight: number;
        price: number;
        status: string;
        paymentStatus: string;
        customerName?: string;
        customerPhone?: string;
        customerEmail?: string;
        customerAddress?: string;
        coffeeType?: string;
        deliveryDate?: string;
        notes?: string;
        createdAt: string;
        updatedAt: string;
        completedAt?: string;
      }>;
    }>('/orders', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  getOrder: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}`, {  // ✅ FIXED: Sudah benar
      method: 'GET',
      requiresAuth: true,
    });
  },

  cancelOrder: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      requiresAuth: true,
    });
  },

  deleteOrder: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },

  createPayment: async (paymentData: {
    orderId: string;
    method: string;
    accountName: string;
    amount: number;
    proofImage: string;
    notes: string | null;
  }) => {
    return apiRequest('/payments', {  // ✅ FIXED: Sudah benar
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(paymentData),
    });
  },
  // ✅ Update order status
  updateOrderStatus: async (orderId: string, status: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: { id: string; status: string };
    }>(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify({ status })
    });
  },

  // ✅ Assign machine to order
  assignMachine: async (orderId: string, machineData: { machineId: string; machineName: string }) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: {
        id: string;
        machineId: string;
        machineName: string;
        status: string;
      };
    }>(`/admin/orders/${orderId}/assign-machine`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(machineData)
    });
  },

  updatePaymentStatus: async (
    orderId: string,
    status: 'pending' | 'verified' | 'rejected',
    rejectionReason?: string
  ) => {
    console.log(`Updating payment status for order ${orderId} to ${status}`);

    return apiRequest<{
      success: boolean;
      message: string;
      data: { id: string; paymentStatus: string };
    }>(`/admin/orders/${orderId}/payment-status`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify({
        status,
        rejectionReason
      })
    });
  },

  // ✅ Refresh orders
  refreshOrders: async () => {
    return apiRequest<{
      success: boolean;
      data: any[];
    }>('/orders/refresh', {
      method: 'GET',
      requiresAuth: true
    });
  }
};


// ============================================
// PAYMENT APIs
// ============================================
export const paymentAPI = {
  getPaymentMethods: async () => {
    return apiRequest('/payments/methods', {  // ✅ FIXED: Sudah benar
      method: 'GET',
      requiresAuth: false,
    });
  },

  uploadPayment: async (paymentData: {
    orderId: string;
    method: string;
    accountName: string;
    amount: number;
    proofImage: string;
    notes?: string;
  }) => {
    return apiRequest('/payments', {  // ✅ FIXED: Sudah benar
      method: 'POST',
      body: JSON.stringify(paymentData),
      requiresAuth: true,
    });
  },

  getPaymentByOrder: async (orderId: string) => {
    return apiRequest(`/payments/order/${orderId}`, {  // ✅ FIXED: Sudah benar
      method: 'GET',
      requiresAuth: true,
    });
  },
};

// ============================================
// SORTING APIs
// ============================================
export const sortingAPI = {
  getDashboardStats: async (params?: { period: 'all' | 'month' | 'year', year?: number, month?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.period) queryParams.append('period', params.period);
      if (params.year) queryParams.append('year', params.year.toString());
      if (params.month) queryParams.append('month', params.month.toString());
    }

    return apiRequest<{
      success: boolean;
      data: any;
    }>(`/sorting/dashboard?${queryParams.toString()}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  getSortingResults: async () => {
    return apiRequest('/sorting/results', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  createSortingResult: async (resultData: {
    orderId: string;
    totalBeans: number;
    healthyBeans: number;
    defectiveBeans: number;
    totalWeight: number;
    accuracy?: number;
  }) => {
    return apiRequest('/sorting/results', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(resultData),
    });
  },
};


export default {
  auth: authAPI,
  health: healthAPI,
  news: newsAPI,
  forum: forumAPI,
  admin: adminAPI,
  order: orderAPI,
  payment: paymentAPI,
};
