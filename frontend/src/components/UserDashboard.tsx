import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { orderAPI, sortingAPI, batchAPI, notificationAPI } from '../services/api';
import { generateBatchHistoryPDF } from '../utils/pdfGenerator';
import { getStoredToken } from '../services/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import Forum from "./Forum";
import OrderHub from "./OrderHub";
import PaymentMethod from "./PaymentMethod";
import ChatBot from "./ChatBot";
import NewsView from "./NewsView";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import logoImage from "figma:asset/4dd15d3bf546fd413c470482994e9b74ecf4af1b.png";
import { authAPI } from "../services/api";
import { getStoredUser } from "../services/auth";
import {
  LayoutDashboard,
  FileText,
  Clock,
  ImageIcon,
  User,
  LogOut,
  Bell,
  Download,
  Coffee,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Moon,
  Sun,
  Edit,
  Menu,
  X,
  Settings,
  Package,
  MessageSquare,
  Newspaper,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

interface UserDashboardProps {
  onNavigateToLanding: () => void;
}

export default function UserDashboard({
  onNavigateToLanding,
}: UserDashboardProps) {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [reportType, setReportType] = useState<'order' | 'month' | 'year'>('order');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedOrderIdForPayment, setSelectedOrderIdForPayment] = useState<
    string | null
  >(null);

  // Load user data from localStorage or API
  const storedUser = getStoredUser();
  const [userName, setUserName] = useState(storedUser?.name || "Budi Santoso");
  const [userEmail, setUserEmail] = useState(
    storedUser?.email || "budi@kopiusaha.id"
  );
  const [userPhone, setUserPhone] = useState(
    storedUser?.phone || "0812-3456-7890"
  );
  const [userCompany, setUserCompany] = useState(
    storedUser?.companyName || "Kopi Usaha Sentosa"
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // ✅ TAMBAHKAN state untuk order
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Batch History State
  const [orderBatches, setOrderBatches] = useState<any[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [selectedOrderForBatch, setSelectedOrderForBatch] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isBatchDetailOpen, setIsBatchDetailOpen] = useState(false);

  // Profile Photo Upload State
  const [profileImage, setProfileImage] = useState<string | null>(storedUser?.profileImage || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Load batches when filter changes
  useEffect(() => {
    const loadBatches = async () => {
      try {
        setIsLoadingBatches(true);
        let response;

        if (reportType === 'order') {
          if (!selectedOrderForBatch) {
            setOrderBatches([]);
            return;
          }
          response = await batchAPI.getOrderBatches(selectedOrderForBatch);
        } else {
          response = await batchAPI.getBatchesHistory({
            period: reportType,
            year: selectedDate.getFullYear(),
            month: reportType === 'month' ? selectedDate.getMonth() + 1 : undefined
          });
        }

        if (response.success) {
          setOrderBatches(response.data);
        }
      } catch (error) {
        console.error('Error loading batches:', error);
        setOrderBatches([]);
      } finally {
        setIsLoadingBatches(false);
      }
    };

    loadBatches();
  }, [selectedOrderForBatch, reportType, selectedDate]);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authAPI.getCurrentUser();
        if (user.success && user.data) {
          setUserName(user.data.name);
          setUserEmail(user.data.email);
          setUserPhone(user.data.phone || "");
          setUserCompany(user.data.companyName || "");
          // Load profile image if exists
          if (user.data.profileImage) {
            setProfileImage(user.data.profileImage);
          }
        }
      } catch (error) {
        // If API fails, use stored data
        if (storedUser) {
          setUserName(storedUser.name);
          setUserEmail(storedUser.email);
          setUserPhone(storedUser.phone || "");
          setUserCompany(storedUser.companyName || "");
          if (storedUser.profileImage) {
            setProfileImage(storedUser.profileImage);
          }
        }
      }
    };

    loadUserData();
  }, []);

  // Handle profile photo upload
  const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setProfileError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setProfileError('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  // ✅ TAMBAHKAN useEffect baru
  useEffect(() => {
    loadDashboardStats();
    loadUserOrders();
  }, []);


  // ✅ TAMBAHKAN function untuk load orders
  const loadUserOrders = async () => {
    try {
      setIsLoadingOrders(true);
      console.log('📦 Loading user orders...');
      const response = await orderAPI.getOrders();

      if (response.success) {
        setUserOrders(response.data);
        console.log('✅ Orders loaded:', response.data);
      }
    } catch (err: any) {
      console.error('❌ Error loading orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };



  // Load notifications
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.success) {
        setNotificationCount(response.count);
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      // Mark as read first
      await notificationAPI.markAsRead(notif.id);

      // Handle navigation based on link
      if (notif.link) {
        if (notif.link.includes('layanan') || notif.link.includes('pesanan') || notif.link.includes('pembayaran')) {
          setActiveMenu('layanan');
        } else if (notif.link.includes('riwayat')) {
          setActiveMenu('riwayat');
        } else if (notif.link.includes('forum')) {
          setActiveMenu('forum');
        }
      }

      // Close dropdown and reload notifications
      setIsNotificationOpen(false);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the notification click
    try {
      await notificationAPI.deleteNotification(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      console.log('📊 Loading dashboard stats...');
      const response = await sortingAPI.getDashboardStats({
        period: reportType === 'order' ? 'all' : reportType,
        year: selectedDate.getFullYear(),
        month: reportType === 'month' ? selectedDate.getMonth() + 1 : undefined
      });

      if (response.success) {
        setDashboardStats(response.data);
        console.log('✅ Dashboard stats loaded:', response.data);
      }
    } catch (err: any) {
      console.error('❌ Error loading dashboard stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Determine context based on reportType
      let context: { type: 'order' | 'month' | 'year', title: string, subtitle: string, data?: any };

      if (reportType === 'order') {
        // Find the selected order data
        const selectedOrder = userOrders.find(o => o.id === selectedOrderForBatch) || userOrders[0];
        context = {
          type: 'order',
          title: 'Per Pesanan',
          subtitle: selectedOrder ? `Pesanan ${selectedOrder.id}` : 'Tidak ada pesanan',
          data: selectedOrder
        };
      } else if (reportType === 'month') {
        const monthName = selectedDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        context = {
          type: 'month',
          title: 'Bulanan',
          subtitle: monthName
        };
      } else {
        context = {
          type: 'year',
          title: 'Tahunan',
          subtitle: selectedDate.getFullYear().toString()
        };
      }

      // Use quickStats which already handles different report types
      const stats = {
        total: quickStats.total,
        healthy: quickStats.healthy,
        defect: quickStats.defect,
        accuracy: quickStats.accuracy
      };

      // Generate PDF
      generateBatchHistoryPDF(context, orderBatches, stats, userName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  // Reload stats when filter changes
  useEffect(() => {
    if (activeMenu === 'dashboard') {
      loadDashboardStats();
    }
  }, [reportType, selectedDate, activeMenu]);

  const [selectedOrderFilter, setSelectedOrderFilter] = useState("all");
  // ✅ TAMBAHKAN computed value untuk filtered stats
  const filteredDashboardStats = useMemo(() => {
    if (!dashboardStats) return null;

    // Jika "all" atau tidak ada filter, return semua data
    if (selectedOrderFilter === 'all') {
      return dashboardStats;
    }

    // Filter orderStats berdasarkan order yang dipilih
    const filteredOrderStats = dashboardStats.orderStats?.filter(
      (order: any) => order.orderId === selectedOrderFilter
    ) || [];


    // Jika ada order spesifik yang dipilih, recalculate stats untuk order itu saja
    // Untuk sekarang, return stats lengkap tapi dengan orderStats yang filtered
    return {
      ...dashboardStats,
      orderStats: filteredOrderStats
    };
  }, [dashboardStats, selectedOrderFilter]);

  // Setelah function loadDashboardStats
  const handleRefreshDashboard = async () => {
    console.log('🔄 Starting dashboard refresh...');

    // 🔍 DEBUG: Check all localStorage keys
    console.log('📦 All localStorage keys:', Object.keys(localStorage));
    console.log('📦 localStorage contents:', {
      token: localStorage.getItem('token'),
      authToken: localStorage.getItem('authToken'),
      accessToken: localStorage.getItem('accessToken'),
      jwt: localStorage.getItem('jwt'),
      user: localStorage.getItem('user')
    });

    setIsRefreshing(true);

    try {

      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt');
      // Step 1: Clear current data
      console.log('📤 Clearing current data...');
      setUserOrders([]);

      // Step 2: Get auth token
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Step 3: Fetch fresh data with cache busting
      const timestamp = new Date().getTime();
      console.log(`📡 Fetching fresh data... (timestamp: ${timestamp})`);

      const response = await fetch(
        `http://localhost:5010/api/orders?_t=${timestamp}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Fresh data received:', data);

      // Step 4: Validate and update state
      if (data.success && Array.isArray(data.data)) {
        setUserOrders(data.data);
        console.log(`✅ Updated ${data.data.length} orders`);

        // Optional: Show success message
        // toast.success('Data berhasil diperbarui!');

      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (error: any) {
      console.error('❌ Error refreshing dashboard:', error);

      // User-friendly error message
      let errorMessage = 'Gagal memuat data terbaru';
      if (error.message.includes('token')) {
        errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Server error. Silakan coba lagi.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Tidak dapat terhubung ke server. Cek koneksi internet Anda.';
      }

      alert(errorMessage);

    } finally {
      setIsRefreshing(false);
      console.log('🏁 Refresh process completed');
    }
  };




  const handleLogout = async () => {
    try {
      await authAPI.logout();
      onNavigateToLanding();
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local storage and navigate
      onNavigateToLanding();
    }
  };



  const handleSaveProfile = async () => {
    setProfileError(null);
    setProfileSuccess(null);

    if (!userName.trim()) {
      setProfileError('Nama lengkap harus diisi');
      return;
    }

    setIsLoadingProfile(true);
    try {
      console.log('🔄 Updating profile...', {
        name: userName,
        phone: userPhone,
        companyName: userCompany,
        hasImage: !!imageFile,
      });

      const response = await authAPI.updateProfile({
        name: userName.trim(),
        phone: userPhone.trim() || undefined,
        companyName: userCompany.trim() || undefined,
        profileImage: imageFile || null,
      });

      console.log('✅ Profile update response:', response);

      if (response.success) {
        setProfileSuccess('Profil berhasil diperbarui!');

        // ✅ Update localStorage dengan data terbaru
        const updatedUser = response.data;
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // ✅ Update state dengan data baru
        setUserName(updatedUser.name || userName);
        setUserPhone(updatedUser.phone || '');
        setUserCompany(updatedUser.companyname || '');

        // ✅ PENTING: Update profile image dengan URL dari ImgBB
        if (updatedUser.profileimage) {
          console.log('🖼️ New profile image URL:', updatedUser.profileimage);
          setProfileImage(updatedUser.profileimage);
        }

        // Clear file input
        setImageFile(null);
        setIsProfileOpen(false);

        setTimeout(() => setProfileSuccess(null), 3000);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      setProfileError(
        error instanceof Error ? error.message : 'Gagal memperbarui profil'
      );
    } finally {
      setIsLoadingProfile(false);
    }
  };



  const filteredOrders = useMemo(() => {
    if (selectedOrderFilter === "all") {
      return userOrders;
    }
    return userOrders.filter(order => order.id === selectedOrderFilter);
  }, [userOrders, selectedOrderFilter]);

  // Filter data based on selected order
  const filteredOrderData =
    selectedOrderFilter === "all"
      ? userOrders
      : userOrders.filter((order) => order.id === selectedOrderFilter);

  // Calculate stats based on filtered data
  // ✅ Use dashboardStats for month/year, filteredOrders for per-order
  const quickStats = useMemo(() => {
    // If month or year filter is selected, use data from dashboardStats API
    if (reportType === 'month' || reportType === 'year') {
      if (!dashboardStats) {
        return {
          total: 0,
          healthy: 0,
          defect: 0,
          accuracy: 0
        };
      }
      return {
        total: dashboardStats.totalBeans || 0,
        healthy: dashboardStats.healthyBeans || 0,
        defect: dashboardStats.defectiveBeans || 0,
        accuracy: dashboardStats.accuracy || 0
      };
    }

    // For per-order filter, calculate from filteredOrders
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        total: 0,
        healthy: 0,
        defect: 0,
        accuracy: 0
      };
    }

    // Sum from sorting_results of FILTERED orders
    const total = filteredOrders.reduce((sum, order) =>
      sum + (order.sortingResults?.total_beans || 0), 0
    );

    const healthy = filteredOrders.reduce((sum, order) =>
      sum + (order.sortingResults?.healthy_beans || 0), 0
    );

    const defect = filteredOrders.reduce((sum, order) =>
      sum + (order.sortingResults?.defective_beans || 0), 0
    );

    const accuracy = total > 0
      ? Math.round((healthy / total) * 100)
      : 0;

    return { total, healthy, defect, accuracy };
  }, [filteredOrders, reportType, dashboardStats]);


  const allOrdersStats = useMemo(() => {
    if (!userOrders || userOrders.length === 0) {
      return [];
    }

    return userOrders.map(order => ({
      id: order.id,
      packageName: order.packageName || order.package_name,
      weight: order.weight || order.kilograms || 0,
      price: order.totalPrice || order.price || 0,
      totalBeans: order.sortingResults?.total_beans || 0,
      healthyBeans: order.sortingResults?.healthy_beans || 0,
      defectBeans: order.sortingResults?.defective_beans || 0,
      accuracy: order.sortingResults?.accuracy || 0
    }));
  }, [userOrders]);

  const pieData = [
    { name: "Sehat", value: quickStats.healthy, color: "#5D8C48" },
    { name: "Cacat", value: quickStats.defect, color: "#C2513D" },
  ];

  const recentActivity = [
    { time: "09:32", text: "Batch #041 selesai disortir", icon: "☕" },
    { time: "09:35", text: "93.4% akurat – hasil baik", icon: "✓" },
    { time: "09:38", text: "3 biji diklasifikasi ulang", icon: "🔄" },
  ];

  const sortingResults = [
    { id: "#B123", condition: "Sehat", confidence: 0.94, time: "09:35 AM" },
    { id: "#B124", condition: "Cacat", confidence: 0.88, time: "09:35 AM" },
    { id: "#B125", condition: "Sehat", confidence: 0.96, time: "09:36 AM" },
    { id: "#B126", condition: "Sehat", confidence: 0.92, time: "09:36 AM" },
    { id: "#B127", condition: "Cacat", confidence: 0.85, time: "09:37 AM" },
    { id: "#B128", condition: "Sehat", confidence: 0.97, time: "09:37 AM" },
  ];

  const defectGallery = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1634993073618-5312c9781162?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWZlY3RpdmUlMjBjb2ZmZWUlMjBiZWFuc3xlbnwxfHx8fDE3NjA1MjE3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      type: "Retak",
      confidence: 87,
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1652248939452-6de84124f8a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBiZWFucyUyMHJvYXN0ZWR8ZW58MXx8fHwxNzYwNTAzNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      type: "Pecah",
      confidence: 92,
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1668923570518-9eb1f838f19b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmFiaWNhJTIwY29mZmVlJTIwYmVhbnN8ZW58MXx8fHwxNzYwNTk4MTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      type: "Berjamur",
      confidence: 78,
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1634993073618-5312c9781162?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWZlY3RpdmUlMjBjb2ZmZWUlMjBiZWFuc3xlbnwxfHx8fDE3NjA1MjE3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      type: "Warna Gelap",
      confidence: 85,
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1652248939452-6de84124f8a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBiZWFucyUyMHJvYXN0ZWR8ZW58MXx8fHwxNzYwNTAzNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      type: "Pecah",
      confidence: 89,
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1668923570518-9eb1f838f19b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmFiaWNhJTIwY29mZmVlJTIwYmVhbnN8ZW58MXx8fHwxNzYwNTk4MTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      type: "Retak",
      confidence: 91,
    },
    {
      id: 7,
      url: "https://images.unsplash.com/photo-1634993073618-5312c9781162?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWZlY3RpdmUlMjBjb2ZmZWUlMjBiZWFuc3xlbnwxfHx8fDE3NjA1MjE3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      type: "Berjamur",
      confidence: 82,
    },
    {
      id: 8,
      url: "https://images.unsplash.com/photo-1652248939452-6de84124f8a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBiZWFucyUyMHJvYXN0ZWR8ZW58MXx8fHwxNzYwNTAzNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      type: "Warna Gelap",
      confidence: 88,
    },
  ];

  const batchHistory = [
    { batch: "#040", date: "03/10/2025", accuracy: 9224, beans: 3180 },
    { batch: "#039", date: "02/10/2025", accuracy: 91, beans: 3050 },
    { batch: "#038", date: "30/09/2025", accuracy: 90, beans: 2980 },
    { batch: "#037", date: "29/09/2025", accuracy: 93, beans: 3120 },
    { batch: "#036", date: "28/09/2025", accuracy: 92, beans: 3200 },
  ];

  // Trend data based on filtered orders (only for per-order mode)
  const trendData = useMemo(() => {
    if (reportType !== 'order') {
      // For month/year, show single aggregate point
      return dashboardStats ? [{
        order: reportType === 'month' ? `${selectedDate.toLocaleString('default', { month: 'short' })} ${selectedDate.getFullYear()}` : selectedDate.getFullYear().toString(),
        accuracy: dashboardStats.accuracy?.toFixed(1) || '0'
      }] : [];
    }
    return filteredOrderData
      .filter(order => order?.sortingResults?.total)
      .map((order) => ({
        order: order.id,
        accuracy: (
          ((order.sortingResults?.healthy ?? 0) / (order.sortingResults?.total ?? 1)) * 100
        ).toFixed(1),
      }));
  }, [reportType, filteredOrderData, dashboardStats, selectedDate]);


  // Order statistics for charts
  const orderStatsData = useMemo(() => {
    if (reportType !== 'order') {
      // For month/year, show aggregate stats
      if (!dashboardStats || !dashboardStats.orderStats) return [];
      return dashboardStats.orderStats.map((order: any) => ({
        id: order.orderId,
        kilograms: order.weight || 0,
        price: (order.totalCost || 0) / 1000,
        healthy: 0, // Not available in aggregate
        defect: 0,  // Not available in aggregate
      }));
    }
    return filteredOrderData
      .filter(order => order?.sortingResults)
      .map((order) => ({
        id: order.id,
        kilograms: order.kilograms || 0,
        price: (order.totalPrice || 0) / 1000,
        healthy: order.sortingResults?.healthy ?? 0,
        defect: order.sortingResults?.defect ?? 0,
      }));
  }, [reportType, filteredOrderData, dashboardStats]);

  // Sorted stats for "Statistik Semua Pesanan" chart
  const sortedAllOrdersStats = useMemo(() => {
    if (!userOrders || userOrders.length === 0) return [];
    return [...userOrders]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((order) => ({
        id: order.id,
        date: new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
        berat: order.weight || order.kilograms || 0,
        biaya: (order.totalPrice || order.price || 0) / 1000
      }));
  }, [userOrders]);

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "layanan", icon: Package, label: "Layanan & Pesanan" }, ,
    { id: "riwayat", icon: Clock, label: "Riwayat Batch" },
    { id: "berita", icon: Newspaper, label: "Berita" },
    { id: "forum", icon: TrendingUp, label: "Forum" },
  ];

  const accuracy = quickStats.total > 0
    ? ((quickStats.healthy / quickStats.total) * 100).toFixed(1)
    : "0.0";

  const getProfileImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;

    // Jika sudah full URL (http/https), return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Jika path lokal (/uploads/...), tambahkan base URL
    return `http://localhost:5010${imagePath}`;
  };

  console.log('🔍 DEBUG DATA:');
  console.log('userOrders:', userOrders);
  console.log('filteredOrders:', filteredOrders);
  console.log('quickStats:', quickStats);
  console.log('selectedOrderFilter:', selectedOrderFilter);

  // Cek order pertama
  if (userOrders.length > 0) {
    console.log('📦 First Order Structure:', userOrders[0]);
    console.log('📦 First Order sortingResults:', userOrders[0].sortingResults);
  }

  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4B2E05] flex items-center justify-center">
                <Coffee className="w-6 h-6 text-[#F5E6CA]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <img
                    src={logoImage}
                    alt="PiKopi Logo"
                    className="h-10 w-auto"
                  />
                  <Badge className="bg-blue-600 text-white hidden sm:inline-flex">
                    User
                  </Badge>
                </div>
                <p className="text-gray-500 hidden sm:block">Portal Pengguna</p>
              </div>
            </div>

            {/* Desktop Navigation Menu */}
            <nav className="hidden lg:flex items-center gap-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeMenu === item.id
                    ? "bg-[#4C7C2E] text-white shadow-md"
                    : "text-gray-700 hover:bg-[#F5E6CA]"
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Bell className="w-5 h-5 text-gray-600" />
                      {notificationCount > 0 && (
                        <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <h3 className="font-semibold text-[#4B2E05]">Notifikasi</h3>
                      {notificationCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Tidak ada notifikasi</p>
                      </div>
                    ) : (
                      <>
                        <div className="divide-y">
                          {(showAllNotifications ? notifications : notifications.slice(0, 5)).map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors relative group ${!notif.isRead ? 'bg-blue-50' : ''
                                }`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm text-[#4B2E05]">{notif.title}</h4>
                                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                  <span className="text-xs text-gray-400 mt-1 block">
                                    {new Date(notif.createdAt).toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!notif.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                  <button
                                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                                    title="Hapus notifikasi"
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {notifications.length > 5 && (
                          <div className="p-2 border-t">
                            <button
                              onClick={() => setShowAllNotifications(!showAllNotifications)}
                              className="w-full text-center text-xs text-blue-600 hover:text-blue-800 hover:underline py-1"
                            >
                              {showAllNotifications ? 'Tampilkan Lebih Sedikit' : `Tampilkan Lebih Banyak (${notifications.length - 5} lagi)`}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* User Profile Dropdown - Desktop */}
              <div className="hidden md:flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 pl-3 border-l hover:bg-gray-50 rounded-lg p-2 transition-colors">
                      <div className="text-right">
                        <p className="text-[#4B2E05]">{userName}</p>
                        <p className="text-gray-500">Pengguna</p>
                      </div>
                      <Avatar className="w-20 h-20">
                        {profileImage ? (
                          <img
                            src={getProfileImageUrl(profileImage) || ''}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ Failed to load image:', profileImage);
                              // Fallback ke initial jika gagal load
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <AvatarFallback className="text-2xl bg-[#4B2E05] text-white">
                          {userName?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-2">
                      <p className="text-[#4B2E05]">{userName}</p>
                      <p className="text-gray-500">{userEmail}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                      <User className="w-4 h-4 mr-2" />
                      Edit Profil
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Menu className="w-6 h-6 text-gray-700" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Coffee className="w-6 h-6 text-[#4B2E05]" />
                      Menu Navigasi
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-2">
                    {/* User Info */}
                    <div className="p-4 bg-[#F5E6CA] rounded-lg mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <AvatarFallback className="bg-blue-600 text-white">
                              {userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-[#4B2E05]">{userName}</p>
                          <p className="text-gray-600">{userEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveMenu(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === item.id
                          ? "bg-[#4C7C2E] text-white"
                          : "text-gray-700 hover:bg-[#F5E6CA]"
                          }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    ))}

                    {/* Divider */}
                    <div className="border-t my-4"></div>

                    {/* Profile & Settings */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-[#F5E6CA] transition-all"
                    >
                      <User className="w-5 h-5" />
                      <span>Edit Profil</span>
                    </button>



                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Edit Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#4B2E05]">
              Edit Profil Pengguna
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Error/Success Messages */}
            {profileError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{profileError}</p>
              </div>
            )}
            {profileSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-600">{profileSuccess}</p>
              </div>
            )}
            {/* Profile Header */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-[#4C7C2E] text-white text-2xl">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="flex-1">
                <h3 className="text-[#4B2E05] mb-1">{userName}</h3>
                <p className="text-gray-600">Pengguna Aktif</p>
              </div>
              <input
                type="file"
                id="profile-photo-upload"
                accept="image/*"
                onChange={handleProfilePhotoChange}
                className="hidden"
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById('profile-photo-upload')?.click()}
                type="button"
              >
                <Edit className="w-4 h-4" />
                Ubah Foto
              </Button>
            </div>

            {/* Controls */}


            {/* Profile Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama Lengkap</Label>
                  <Input
                    id="edit-name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={userEmail}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">
                    Email tidak dapat diubah
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Nomor HP</Label>
                  <Input
                    id="edit-phone"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company">UMKM Asal</Label>
                  <Input
                    id="edit-company"
                    value={userCompany}
                    onChange={(e) => setUserCompany(e.target.value)}
                  />
                </div>
              </div>



              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setProfileError(null);
                    setProfileSuccess(null);
                    // Reset to original values if cancelled
                    const stored = getStoredUser();
                    if (stored) {
                      setUserName(stored.name);
                      setUserPhone(stored.phone || "");
                      setUserCompany(stored.companyName || "");
                    }
                  }}
                  disabled={isLoadingProfile}
                >
                  Batal
                </Button>
                <Button
                  className="bg-[#4C7C2E] hover:bg-[#5D8C48]"
                  onClick={handleSaveProfile}
                  disabled={isLoadingProfile}
                >
                  {isLoadingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Dashboard */}
        {activeMenu === "dashboard" && (
          <div className="space-y-8">
            {/* Welcome Section with Filter */}
            <Card className="bg-gradient-to-r from-[#4B2E05] to-[#6A4B2E] text-white border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <h1 className="text-white">Halo, {userName} 👋</h1>
                    <p className="text-[#F5E6CA]">
                      Berikut hasil sortir kopi Anda.
                    </p>
                  </div>

                  {/* ✅ Mobile Refresh Button */}
                  <div className="md:hidden">
                    <Button
                      onClick={handleRefreshDashboard}
                      disabled={isRefreshing}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      {isRefreshing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* ✅ Desktop (Select + Refresh + Coffee Icon) */}
                  <div className="hidden md:flex items-center gap-4">
                    <Button
                      onClick={handleRefreshDashboard}
                      disabled={isRefreshing}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      {isRefreshing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {isRefreshing ? 'Memuat...' : 'Refresh'}
                    </Button>

                    {/* Report Type Selector */}
                    <Select
                      value={reportType}
                      onValueChange={(value: 'order' | 'month' | 'year') => setReportType(value)}
                    >
                      <SelectTrigger className="w-[150px] bg-white/10 text-white border-white/20">
                        <SelectValue placeholder="Tipe Laporan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Per Pesanan</SelectItem>
                        <SelectItem value="month">Bulanan</SelectItem>
                        <SelectItem value="year">Tahunan</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Conditional Second Filter */}
                    {reportType === 'order' ? (
                      <Select
                        value={selectedOrderFilter}
                        onValueChange={setSelectedOrderFilter}
                      >
                        <SelectTrigger className="w-[200px] bg-white text-gray-700">
                          <SelectValue placeholder="Filter Pesanan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              <span>Semua Pesanan</span>
                            </div>
                          </SelectItem>
                          {isLoadingOrders ? (
                            <SelectItem value="loading" disabled>Memuat...</SelectItem>
                          ) : userOrders.length > 0 ? (
                            userOrders.map((order) => (
                              <SelectItem key={order.id} value={order.id}>
                                {order.packageName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="empty" disabled>Tidak ada pesanan</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : reportType === 'month' ? (
                      <input
                        type="month"
                        value={selectedDate.toISOString().slice(0, 7)}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="h-10 px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    ) : (
                      <Select
                        value={selectedDate.getFullYear().toString()}
                        onValueChange={(val: string) => {
                          const newDate = new Date(selectedDate);
                          newDate.setFullYear(parseInt(val));
                          setSelectedDate(newDate);
                        }}
                      >
                        <SelectTrigger className="w-[120px] bg-white/10 text-white border-white/20">
                          <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* PDF Download Button */}
                    <Button
                      onClick={handleDownloadPDF}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                      title="Unduh Laporan PDF"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Mobile Filter */}
            <div className="md:hidden">
              <Select
                value={selectedOrderFilter}
                onValueChange={setSelectedOrderFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Pesanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>Semua Pesanan</span>
                    </div>
                  </SelectItem>
                  {userOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.id} - {order.coffeeType} ({order.kilograms}kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Stats - FROM FILTERED DATA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoadingStats ? (
                // Loading state
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-white border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : quickStats ? (
                // Data loaded - USE quickStats NOT dashboardStats
                <>
                  <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 mb-1">Jumlah Total Biji</p>
                          <div className="text-[#6A4B2E]">
                            {quickStats.total.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-[#6A4B2E] bg-opacity-10 rounded-xl flex items-center justify-center">
                          <Coffee className="w-6 h-6 text-[#6A4B2E]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 mb-1">Biji Sehat</p>
                          <div className="text-[#5D8C48]">
                            {quickStats.healthy.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-[#5D8C48] bg-opacity-10 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-[#5D8C48]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 mb-1">Biji Cacat</p>
                          <div className="text-[#C2513D]">
                            {quickStats.defect.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-[#C2513D] bg-opacity-10 rounded-xl flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-[#C2513D]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                // No data
                <Card className="col-span-3 bg-white border-0 shadow-lg">
                  <CardContent className="p-6 text-center text-gray-500">
                    <p>Belum ada data sortir</p>
                  </CardContent>
                </Card>
              )}
            </div>



            {/* Charts Section */}
            {/* Charts Section */}
            <div className="space-y-6">

              {/* Pie Chart */}
              {/* Pie Chart - DATA FROM FILTERED ORDERS */}
              {/* Pie Chart - FILTERED BY DROPDOWN */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#4B2E05] flex items-center justify-between">
                    <span>Grafik Komposisi</span>
                    {selectedOrderFilter !== "all" && (
                      <Badge variant="outline" className="text-xs">
                        {selectedOrderFilter}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {quickStats && quickStats.total > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: 'Sehat',
                                value: quickStats.healthy,
                                color: '#5D8C48'
                              },
                              {
                                name: 'Cacat',
                                value: quickStats.defect,
                                color: '#C2513D'
                              }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) =>
                              `${name}: ${value.toLocaleString('id-ID')} (${(percent * 100).toFixed(1)}%)`
                            }
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { color: '#5D8C48' },
                              { color: '#C2513D' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => value.toLocaleString('id-ID')}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="text-center mt-4 space-y-2">
                        <div className="flex justify-center gap-8">
                          <div>
                            <p className="text-gray-600 text-sm">Total Biji</p>
                            <p className="text-lg font-bold text-[#4B2E05]">
                              {quickStats.total.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Akurasi</p>
                            <p className="text-lg font-bold text-[#5D8C48]">
                              {quickStats.accuracy}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-400">
                      {isLoadingStats ? 'Memuat data...' : 'Tidak ada data untuk ditampilkan'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistik Semua Pesanan - ALWAYS SHOW ALL ORDERS */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#4B2E05]">
                    Statistik Semua Pesanan (Tidak Terfilter)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userOrders && userOrders.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[...userOrders]
                            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                            .map((order) => ({
                              id: order.id,
                              date: new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
                              berat: order.weight || order.kilograms || 0,
                              biaya: (order.totalPrice || order.price || 0) / 1000
                            }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="id"
                            tick={{ fontSize: 12, fill: '#666' }}
                            height={60}
                            interval={0}
                          />
                          <YAxis yAxisId="left" orientation="left" stroke="#4C7C2E" />
                          <YAxis yAxisId="right" orientation="right" stroke="#6A4B2E" />
                          <Tooltip />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="berat"
                            fill="#4C7C2E"
                            name="Berat (kg)"
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="biaya"
                            fill="#6A4B2E"
                            name="Biaya (Ribu Rp)"
                          />
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm mb-1">Total Pesanan</p>
                          <div className="text-2xl font-bold text-[#4B2E05]">
                            {userOrders.length}
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm mb-1">Total Berat</p>
                          <div className="text-2xl font-bold text-[#5D8C48]">
                            {userOrders.reduce((sum, order) =>
                              sum + (order.weight || order.kilograms || 0), 0
                            ).toFixed(1)} kg
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm mb-1">Total Biaya</p>
                          <div className="text-xl font-bold text-[#4B2E05]">
                            Rp {(userOrders.reduce((sum, order) =>
                              sum + (order.totalPrice || order.price || 0), 0
                            )).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm mb-1">Akurasi Keseluruhan</p>
                          <div className="text-2xl font-bold text-[#6A4B2E]">
                            {(() => {
                              const totalBeans = userOrders.reduce((sum, order) =>
                                sum + (order.sortingResults?.total_beans ?? 0), 0
                              );
                              const healthyBeans = userOrders.reduce((sum, order) =>
                                sum + (order.sortingResults?.healthy_beans ?? 0), 0
                              );

                              return totalBeans > 0
                                ? ((healthyBeans / totalBeans) * 100).toFixed(1)
                                : '0.0';
                            })()}%
                          </div>
                        </div>


                      </div>
                    </>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      Tidak ada data pesanan
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        )}

        {/* Layanan & Pesanan */}
        {activeMenu === "layanan" && !selectedOrderIdForPayment && (
          <OrderHub
            userName={userName}
            userEmail={userEmail}
            userPhone={userPhone}
            onPayNow={(orderId) => {
              setSelectedOrderIdForPayment(orderId);
            }}
          />
        )}



        {/* Riwayat Batch */}
        {activeMenu === "riwayat" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-[#4B2E05] text-2xl font-bold">Riwayat Batch</h2>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                {/* Download PDF Button */}
                {selectedOrderForBatch && orderBatches.length > 0 && (
                  <Button
                    onClick={handleDownloadPDF}
                    className="bg-[#4C7C2E] hover:bg-[#3D6325] text-white flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                )}

                {/* Order Selection Dropdown */}
                <div className="w-full md:w-72">
                  <Select
                    value={selectedOrderForBatch}
                    onValueChange={setSelectedOrderForBatch}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Pilih Pesanan" />
                    </SelectTrigger>
                    <SelectContent>
                      {userOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.packageName} ({order.weight}kg) - {new Date(order.createdAt).toLocaleDateString('id-ID')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {!selectedOrderForBatch ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-[#F5E6CA] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-[#4B2E05]" />
                </div>
                <h3 className="text-lg font-semibold text-[#4B2E05] mb-2">Pilih Pesanan</h3>
                <p className="text-gray-500">Silakan pilih pesanan untuk melihat riwayat batch</p>
              </div>
            ) : isLoadingBatches ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-[#4C7C2E] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Memuat data batch...</p>
              </div>
            ) : orderBatches.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500">Belum ada data batch untuk pesanan ini</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                  <div className="space-y-6">
                    {orderBatches.map((batch) => (
                      <div key={batch.id} className="relative pl-20">
                        <div className="absolute left-6 w-5 h-5 bg-[#4C7C2E] rounded-full border-4 border-white"></div>

                        <Card
                          className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setIsBatchDetailOpen(true);
                          }}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-[#4B2E05] font-bold text-lg">
                                  Batch #{batch.batchNumber}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                  {new Date(batch.createdAt).toLocaleString('id-ID')}
                                </p>
                              </div>
                              <Badge
                                className={`${batch.status === 'completed'
                                  ? batch.accuracy >= 90 ? 'bg-green-100 text-green-700'
                                    : batch.accuracy >= 80 ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                                  }`}
                              >
                                {batch.status === 'completed'
                                  ? `${batch.accuracy}% Akurat`
                                  : batch.status.charAt(0).toUpperCase() + batch.status.slice(1)
                                }
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-gray-500 text-sm">Berat Batch</p>
                                <p className="text-[#4B2E05] font-semibold">
                                  {batch.totalWeight} Kg
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-sm">Total Biji</p>
                                <p className="text-[#4B2E05] font-semibold">
                                  {batch.totalBeans.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Batch Detail Modal */}
            <Dialog open={isBatchDetailOpen} onOpenChange={setIsBatchDetailOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-[#4B2E05] text-xl">
                    Detail Batch #{selectedBatch?.batchNumber}
                  </DialogTitle>
                </DialogHeader>

                {selectedBatch && (
                  <div className="space-y-6">
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-[#F5E6CA] rounded-lg">
                        <p className="text-sm text-[#4B2E05] mb-1">Akurasi</p>
                        <p className="text-2xl font-bold text-[#4B2E05]">{selectedBatch.accuracy}%</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Total Berat</p>
                        <p className="text-xl font-semibold">{selectedBatch.totalWeight} Kg</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Biji Sehat</p>
                        <p className="text-xl font-semibold text-green-600">{selectedBatch.healthyBeans}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Biji Cacat</p>
                        <p className="text-xl font-semibold text-red-600">{selectedBatch.defectiveBeans}</p>
                      </div>
                    </div>

                    {/* Sample Images */}
                    <div>
                      <h4 className="font-semibold text-[#4B2E05] mb-4">Sampel Deteksi AI</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Healthy Samples */}
                        <div className="space-y-2">
                          <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden border-2 border-green-200">
                            <ImageWithFallback
                              src={selectedBatch.sampleHealthy1Url || "https://placehold.co/200x200?text=No+Image"}
                              alt="Healthy 1"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-center text-green-600 font-medium">Sehat (High Conf)</p>
                        </div>
                        <div className="space-y-2">
                          <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden border-2 border-green-200">
                            <ImageWithFallback
                              src={selectedBatch.sampleHealthy2Url || "https://placehold.co/200x200?text=No+Image"}
                              alt="Healthy 2"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-center text-green-600 font-medium">Sehat (Avg Conf)</p>
                        </div>

                        {/* Defective Samples */}
                        <div className="space-y-2">
                          <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden border-2 border-red-200">
                            <ImageWithFallback
                              src={selectedBatch.sampleDefective1Url || "https://placehold.co/200x200?text=No+Image"}
                              alt="Defective 1"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-center text-red-600 font-medium">Cacat (High Conf)</p>
                        </div>
                        <div className="space-y-2">
                          <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden border-2 border-red-200">
                            <ImageWithFallback
                              src={selectedBatch.sampleDefective2Url || "https://placehold.co/200x200?text=No+Image"}
                              alt="Defective 2"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-center text-red-600 font-medium">Cacat (Avg Conf)</p>
                        </div>
                      </div>
                    </div>

                    {/* Main Image */}
                    {selectedBatch.imageUrl && (
                      <div>
                        <h4 className="font-semibold text-[#4B2E05] mb-4">Foto Batch Full</h4>
                        <div className="rounded-xl overflow-hidden border border-gray-200">
                          <ImageWithFallback
                            src={selectedBatch.imageUrl}
                            alt="Full Batch"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Berita */}
        {activeMenu === "berita" && <NewsView />}

        {/* Forum */}
        {activeMenu === "forum" && (
          <Forum userRole="user" userName={userName} />
        )}

        {/* Payment Method */}
        {selectedOrderIdForPayment && (
          <PaymentMethod
            orderId={selectedOrderIdForPayment}
            onBack={() => {
              setSelectedOrderIdForPayment(null);
              setActiveMenu("layanan");
            }}
          />
        )}
      </main>

      {/* Floating ChatBot - Always Available */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <ChatBot currentUser={{ name: userName, email: userEmail }} />
      </div>
    </div>
  );
}
