// src/services/auth.ts
// Auth state utilities

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  phone?: string;
  profileImage?: string;
  companyName?: string;
  address?: string;
  emailVerified: boolean;
}

// ========================================
// Token Management
// ========================================

/**
 * Get stored JWT token from localStorage
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem("authToken");  // ✅ Consistent key
};

/**
 * Save JWT token to localStorage
 */
export const setStoredToken = (token: string): void => {
  localStorage.setItem("authToken", token);  // ✅ NEW FUNCTION
  console.log("✅ Token saved to localStorage");
};

/**
 * Remove JWT token from localStorage
 */
export const removeStoredToken = (): void => {
  localStorage.removeItem("authToken");
  console.log("🗑️ Token removed from localStorage");
};

// ========================================
// User Management
// ========================================

/**
 * Get stored user data from localStorage
 */
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

/**
 * Save user data to localStorage
 */
export const setStoredUser = (user: User): void => {
  localStorage.setItem("user", JSON.stringify(user));
  console.log("✅ User data saved to localStorage");
};

/**
 * Remove user data from localStorage
 */
export const removeStoredUser = (): void => {
  localStorage.removeItem("user");
  console.log("🗑️ User data removed from localStorage");
};

// ========================================
// Authentication State
// ========================================

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = (): boolean => {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);  // ✅ Check both token AND user
};

/**
 * Clear all authentication data (logout)
 */
export const clearAuth = (): void => {
  removeStoredToken();
  removeStoredUser();
  console.log("🚪 User logged out - all auth data cleared");
};

/**
 * Initialize auth state from localStorage
 * Call this when app starts
 */
export const initializeAuth = (): { token: string | null; user: User | null } => {
  const token = getStoredToken();
  const user = getStoredUser();
  
  if (token && user) {
    console.log("✅ Auth initialized - User logged in:", user.email);
  } else {
    console.log("❌ Auth initialized - No user logged in");
  }
  
  return { token, user };
};
