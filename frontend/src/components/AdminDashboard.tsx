import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import AdminProfileDropdown from "./AdminProfileDropdown";
import Forum from "./Forum";
import OrderManagement from "./OrderManagement";
import UserManagement from "./UserManagement";
import SettingsPage from "./Settings";
import MachineControl from "./MachineControl";
import NewsManagement from "./NewsManagement";
import logoImage from "figma:asset/4dd15d3bf546fd413c470482994e9b74ecf4af1b.png";
import { authAPI, orderAPI, adminAPI, batchAPI } from "../services/api";
import {
  LayoutDashboard,
  Database,
  ImageIcon,
  Clock,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Download,
  RefreshCw,
  AlertTriangle,
  Trash2,
  ZoomIn,
  Coffee,
  Package,
  FileText,
  User,
  ChevronDown,
  Plus,
  Edit,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface DashboardProps {
  onNavigateToLanding: () => void;
}

interface DashboardOrder {
  id: string;
  userName: string;
  coffeeType: string;
  kilograms: number;
  sortingData: {
    id: string;
    time: string;
    total: number;
    healthy: number;
    defect: number;
    accuracy: number;
    orderId: string;
    userName: string;
  }[];
  batchHistory: {
    batch: string;
    time: string;
    beans: number;
    accuracy: number;
    status: string;
    orderId: string;
  }[];
  defectImages: any[];
}

export default function Dashboard({ onNavigateToLanding }: DashboardProps) {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState("all");

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

  const [isLoading, setIsLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<DashboardOrder[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // Batch Management State
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserForBatch, setSelectedUserForBatch] = useState<string>("");
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [selectedOrderForBatch, setSelectedOrderForBatch] = useState<string>("");
  const [batchList, setBatchList] = useState<any[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [isGeneratingBatches, setIsGeneratingBatches] = useState(false);

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminAPI.getUsers({ limit: 100 });
        if (response.success) {
          setUsers(response.data.users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch orders when user selected
  useEffect(() => {
    if (selectedUserForBatch) {
      const fetchUserOrders = async () => {
        try {
          const response = await adminAPI.getUserDetail(selectedUserForBatch);
          if (response.success) {
            setUserOrders(response.data.orders);
          }
        } catch (error) {
          console.error("Error fetching user orders:", error);
        }
      };
      fetchUserOrders();
    } else {
      setUserOrders([]);
    }
  }, [selectedUserForBatch]);

  // Fetch batches when order selected
  useEffect(() => {
    if (selectedOrderForBatch) {
      fetchBatches(selectedOrderForBatch);
    } else {
      setBatchList([]);
    }
  }, [selectedOrderForBatch]);

  const fetchBatches = async (orderId: string) => {
    try {
      const response = await batchAPI.getOrderBatches(orderId);
      if (response.success) {
        setBatchList(response.data);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const handleAutoGenerateBatches = async () => {
    if (!selectedOrderForBatch) return;

    try {
      setIsGeneratingBatches(true);
      const response = await batchAPI.autoGenerateBatches(selectedOrderForBatch);
      if (response.success) {
        alert(response.message);
        fetchBatches(selectedOrderForBatch);
      }
    } catch (error: any) {
      alert(error.message || "Gagal membuat batch otomatis");
    } finally {
      setIsGeneratingBatches(false);
    }
  };

  const handleSaveBatch = async () => {
    if (!editingBatch) return;

    try {
      const response = await batchAPI.updateBatch(editingBatch.id, {
        totalWeight: parseFloat(editingBatch.totalWeight),
        status: editingBatch.status
      });

      if (response.success) {
        setIsBatchModalOpen(false);
        fetchBatches(selectedOrderForBatch);
        setEditingBatch(null);
      }
    } catch (error: any) {
      alert("Gagal menyimpan batch");
    }
  };

  // Fetch real orders and performance data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ordersRes, perfRes] = await Promise.all([
          orderAPI.getOrders(),
          adminAPI.getPerformanceData()
        ]);

        if (ordersRes.success) {
          // Map API data to Dashboard structure
          const mappedOrders = ordersRes.data.map((order: any) => {
            // Create mock sorting data if not present (since backend might only have summary)
            // If backend has sortingResults, use it.
            const sortingResult = order.sortingResults || null;

            const sortingData = sortingResult ? [{
              id: `#${order.id.substring(0, 4)}`,
              time: new Date(order.createdAt).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
              total: sortingResult.total_beans || 0,
              healthy: sortingResult.healthy_beans || 0,
              defect: sortingResult.defective_beans || 0,
              accuracy: sortingResult.accuracy || 0,
              orderId: order.id,
              userName: order.userName
            }] : [];

            const batchHistory = sortingResult ? [{
              batch: `#${order.id.substring(0, 4)}`,
              time: new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              beans: sortingResult.total_beans || 0,
              accuracy: sortingResult.accuracy || 0,
              status: order.status === 'completed' ? 'completed' : 'processing',
              orderId: order.id
            }] : [];

            return {
              id: order.id,
              userName: order.userName,
              coffeeType: order.coffeeType || order.packageName,
              kilograms: order.weight,
              sortingData: sortingData,
              batchHistory: batchHistory,
              defectImages: [] // API doesn't provide images yet
            };
          });
          setAllOrders(mappedOrders);
        }

        if (perfRes.success) {
          // Format performance data for chart
          const formattedPerf = perfRes.data.map(log => ({
            time: new Date(log.timestamp).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
            accuracy: log.accuracy,
            orderId: log.orderId // Include orderId
          }));
          setPerformanceData(formattedPerf);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on selected order
  const getFilteredData = () => {
    if (selectedOrderId === "all") {
      return {
        sortingData: allOrders.flatMap((order) => order.sortingData),
        batchHistory: allOrders.flatMap((order) => order.batchHistory),
        defectImages: allOrders.flatMap((order) => order.defectImages),
      };
    } else {
      const order = allOrders.find((o) => o.id === selectedOrderId);
      return {
        sortingData: order?.sortingData || [],
        batchHistory: order?.batchHistory || [],
        defectImages: order?.defectImages || [],
      };
    }
  };

  const { sortingData, batchHistory, defectImages } = getFilteredData();

  // Function to refresh data
  const handleRefresh = async (background = false) => {
    try {
      if (!background) setIsLoading(true);
      const [ordersRes, perfRes] = await Promise.all([
        orderAPI.getOrders(),
        adminAPI.getPerformanceData()
      ]);

      if (ordersRes.success) {
        const mappedOrders = ordersRes.data.map((order: any) => {
          const sortingResult = order.sortingResults || null;

          const sortingData = sortingResult ? [{
            id: `#${order.id.substring(0, 4)}`,
            time: new Date(order.createdAt).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
            total: sortingResult.total_beans || 0,
            healthy: sortingResult.healthy_beans || 0,
            defect: sortingResult.defective_beans || 0,
            accuracy: sortingResult.accuracy || 0,
            orderId: order.id,
            userName: order.userName
          }] : [];

          const batchHistory = sortingResult ? [{
            batch: `#${order.id.substring(0, 4)}`,
            time: new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            beans: sortingResult.total_beans || 0,
            accuracy: sortingResult.accuracy || 0,
            status: order.status === 'completed' ? 'completed' : 'processing',
            orderId: order.id
          }] : [];

          return {
            id: order.id,
            userName: order.userName,
            coffeeType: order.coffeeType || order.packageName,
            kilograms: order.weight,
            sortingData: sortingData,
            batchHistory: batchHistory,
            defectImages: []
          };
        });
        setAllOrders(mappedOrders);
      }

      if (perfRes.success) {
        const formattedPerf = perfRes.data.map(log => ({
          time: new Date(log.timestamp).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
          accuracy: log.accuracy,
          orderId: log.orderId // Include orderId
        }));
        setPerformanceData(formattedPerf);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      if (!background) setIsLoading(false);
    }
  };

  // Real-time polling
  useEffect(() => {
    const intervalId = setInterval(() => {
      handleRefresh(true);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Function to export data as CSV
  const handleExportCSV = () => {
    if (sortingData.length === 0) {
      alert('Tidak ada data untuk di-export');
      return;
    }

    // Create CSV header
    const headers = ['Order ID', 'Pengguna', 'Waktu', 'Jumlah Biji', 'Sehat', 'Cacat', 'Akurasi (%)'];

    // Create CSV rows
    const rows = sortingData.map(row => [
      row.orderId,
      row.userName,
      row.time,
      row.total,
      row.healthy,
      row.defect,
      row.accuracy
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `data-sortir-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate pie data from filtered sorting data
  const totalHealthy = sortingData.reduce((sum, item) => sum + item.healthy, 0);
  const totalDefect = sortingData.reduce((sum, item) => sum + item.defect, 0);

  const pieData = [
    { name: "Sehat", value: totalHealthy, color: "#4C7C2E" },
    { name: "Cacat", value: totalDefect, color: "#DC2626" },
  ];

  // Performance data from sorted batches
  // Performance data from sorted batches or real performance logs
  // If we have real performance logs (global), use them. Otherwise fallback to order-specific data.
  const chartData = selectedOrderId === 'all'
    ? performanceData
    : performanceData.filter(item => item.orderId === selectedOrderId); // Use history for specific order too

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "machine", icon: Coffee, label: "Kontrol Mesin" },
    { id: "orders", icon: Package, label: "Kelola Pesanan" },
    { id: "news", icon: FileText, label: "Kelola Berita" },
    { id: "data", icon: Database, label: "Data Sortir" },
    { id: "history", icon: Clock, label: "Riwayat Batch" },
    { id: "forum", icon: Coffee, label: "Forum" },
    { id: "users", icon: Users, label: "Pengguna" },
    { id: "settings", icon: SettingsIcon, label: "Pengaturan" },
  ];

  const totalBeans = pieData.reduce((acc, item) => acc + item.value, 0);
  const healthyPercentage = ((pieData[0].value / totalBeans) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#E0E0E0]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#3C2409] text-[#F5E6CA] z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <img src={logoImage} alt="PiKopi Logo" className="h-14 w-auto" />
            <div>
              <p className="text-[#F5E6CA]/60">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeMenu === item.id
                  ? "bg-[#56743D] text-white"
                  : "text-[#F5E6CA]/70 hover:bg-[#4B2E05] hover:text-[#F5E6CA]"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#F5E6CA]/70 hover:bg-[#4B2E05] hover:text-[#F5E6CA] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[#4B2E05]">Dashboard Admin</h1>
                <span className="px-3 py-1 bg-red-600 text-white rounded-full">
                  Admin
                </span>
              </div>
              <p className="text-gray-600">
                Sabtu, 18 Oktober 2025 • Panel Kontrol Sistem
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Order Filter */}
              <Select
                value={selectedOrderId}
                onValueChange={setSelectedOrderId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter ID Pesanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>Semua Pesanan</span>
                    </div>
                  </SelectItem>
                  {allOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.id} - {order.userName} ({order.kilograms}kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <AdminProfileDropdown
                onNavigateToSettings={() => setActiveMenu("settings")}
                onNavigateToLanding={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
          {activeMenu === "dashboard" && (
            <div className="space-y-6">
              {/* Filter Badge Info */}
              {selectedOrderId !== "all" && (
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-6 h-6" />
                        <div>
                          <p className="text-white">
                            Monitoring Pesanan: {selectedOrderId}
                          </p>
                          <p className="text-blue-100">
                            {
                              allOrders.find((o) => o.id === selectedOrderId)
                                ?.userName
                            }{" "}
                            -{" "}
                            {
                              allOrders.find((o) => o.id === selectedOrderId)
                                ?.coffeeType
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="text-blue-600 bg-white hover:bg-blue-50"
                        onClick={() => setSelectedOrderId("all")}
                      >
                        Lihat Semua
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alert - only show if there's low accuracy in filtered data */}
              {sortingData.some((item) => item.accuracy < 85) && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    ⚠️ Peringatan: Akurasi deteksi turun di bawah 85% pada
                    beberapa batch.
                  </AlertDescription>
                </Alert>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-gray-600 flex items-center justify-between">
                      <span>
                        {selectedOrderId === "all"
                          ? "Total Biji"
                          : "Total Biji Pesanan"}
                      </span>
                      {selectedOrderId !== "all" && (
                        <Badge className="bg-blue-600">{selectedOrderId}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-[#4B2E05]">
                      {totalBeans.toLocaleString()}
                    </div>
                    <p className="text-gray-500 mt-1">biji kopi</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-gray-600 flex items-center justify-between">
                      <span>Biji Sehat</span>
                      {selectedOrderId !== "all" && (
                        <Badge className="bg-blue-600">{selectedOrderId}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-green-600">
                      {pieData[0].value.toLocaleString()}
                    </div>
                    <p className="text-gray-500 mt-1">{healthyPercentage}%</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-gray-600 flex items-center justify-between">
                      <span>Biji Cacat</span>
                      {selectedOrderId !== "all" && (
                        <Badge className="bg-blue-600">{selectedOrderId}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-red-600">
                      {pieData[1].value.toLocaleString()}
                    </div>
                    <p className="text-gray-500 mt-1">
                      {(100 - parseFloat(healthyPercentage)).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-gray-600 flex items-center justify-between">
                      <span>Akurasi Sistem</span>
                      {selectedOrderId !== "all" && (
                        <Badge className="bg-blue-600">{selectedOrderId}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-[#56743D]">
                      {(() => {
                        if (selectedOrderId === 'all') {
                          // Use latest 10 data points from performanceData
                          if (performanceData.length === 0) return 0;
                          const latestData = performanceData.slice(-10);
                          const avg = latestData.reduce((sum, item) => sum + item.accuracy, 0) / latestData.length;
                          return avg.toFixed(1);
                        } else {
                          // Use sortingData for specific order
                          if (sortingData.length === 0) return 0;
                          const avg = sortingData.reduce((sum, item) => sum + item.accuracy, 0) / sortingData.length;
                          return avg.toFixed(1);
                        }
                      })()}
                      %
                    </div>
                    <Progress
                      value={(() => {
                        if (selectedOrderId === 'all') {
                          if (performanceData.length === 0) return 0;
                          const latestData = performanceData.slice(-10);
                          return latestData.reduce((sum, item) => sum + item.accuracy, 0) / latestData.length;
                        } else {
                          if (sortingData.length === 0) return 0;
                          return sortingData.reduce((sum, item) => sum + item.accuracy, 0) / sortingData.length;
                        }
                      })()}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-[#4B2E05] flex items-center justify-between">
                      <span>Distribusi Biji Kopi</span>
                      {selectedOrderId !== "all" && (
                        <Badge className="bg-blue-600">{selectedOrderId}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {totalBeans > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-400">
                        <p>Tidak ada data sortir</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-[#4B2E05] flex items-center justify-between">
                      <span>Performa Akurasi</span>
                      {selectedOrderId !== "all" && (
                        <Badge className="bg-blue-600">{selectedOrderId}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis domain={[80, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="#56743D"
                            strokeWidth={2}
                            name="Akurasi (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-400">
                        <p>Tidak ada data performa</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeMenu === "data" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#4B2E05]">Data Sortir</h2>
                  {selectedOrderId !== "all" && (
                    <Badge className="mt-2 bg-blue-600">
                      {selectedOrderId}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleRefresh(false)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    className="bg-[#56743D] hover:bg-[#4C7C2E] gap-2"
                    onClick={handleExportCSV}
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Pengguna</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Jumlah Biji</TableHead>
                        <TableHead>Sehat</TableHead>
                        <TableHead>Cacat</TableHead>
                        <TableHead>Akurasi (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortingData.length > 0 ? (
                        sortingData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.orderId}</TableCell>
                            <TableCell>{row.userName}</TableCell>
                            <TableCell>{row.time}</TableCell>
                            <TableCell>{row.total}</TableCell>
                            <TableCell className="text-green-600">
                              {row.healthy}
                            </TableCell>
                            <TableCell className="text-red-600">
                              {row.defect}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{row.accuracy}%</span>
                                <Progress value={row.accuracy} className="w-20" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                            Tidak ada data sortir
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}



          {activeMenu === "history" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[#4B2E05] text-2xl font-bold">Riwayat Batch</h2>
                <div className="flex gap-3">
                  {/* User Select */}
                  <Select value={selectedUserForBatch} onValueChange={setSelectedUserForBatch}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Pilih Pengguna" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Order Select */}
                  <Select
                    value={selectedOrderForBatch}
                    onValueChange={setSelectedOrderForBatch}
                    disabled={!selectedUserForBatch}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Pilih Pesanan" />
                    </SelectTrigger>
                    <SelectContent>
                      {userOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.id} - {order.weight}kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Auto Generate Button */}
                  <Button
                    onClick={handleAutoGenerateBatches}
                    disabled={!selectedOrderForBatch || isGeneratingBatches || batchList.length > 0}
                    className="bg-[#56743D] hover:bg-[#4C7C2E]"
                  >
                    {isGeneratingBatches ? "Memproses..." : "Auto Generate (Max 10kg)"}
                  </Button>
                </div>
              </div>

              {/* Batch List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batchList.length > 0 ? (
                  batchList.map((batch) => (
                    <Card key={batch.id} className="bg-white shadow-lg border-0">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold text-[#4B2E05]">
                          Batch #{batch.batchNumber}
                        </CardTitle>
                        <Badge variant={batch.status === 'completed' ? 'default' : 'secondary'}>
                          {batch.status}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Berat Total</span>
                            <span className="font-bold">{batch.totalWeight} kg</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Biji</span>
                            <span className="font-bold">{batch.totalBeans}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Akurasi</span>
                            <span className={`font-bold ${batch.accuracy > 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {batch.accuracy}%
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => {
                              setEditingBatch(batch);
                              setIsBatchModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" /> Edit Batch
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    {selectedOrderForBatch
                      ? "Belum ada batch untuk pesanan ini. Silakan generate otomatis."
                      : "Pilih pengguna dan pesanan untuk melihat batch."}
                  </div>
                )}
              </div>

              {/* Edit Batch Modal */}
              <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Batch #{editingBatch?.batchNumber}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Berat Total (kg)</Label>
                      <Input
                        type="number"
                        value={editingBatch?.totalWeight || ''}
                        onChange={(e) => setEditingBatch({ ...editingBatch, totalWeight: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editingBatch?.status || 'pending'}
                        onValueChange={(val: string) => setEditingBatch({ ...editingBatch, status: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBatchModalOpen(false)}>Batal</Button>
                    <Button onClick={handleSaveBatch}>Simpan Perubahan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeMenu === "machine" && <MachineControl />}

          {activeMenu === "users" && <UserManagement />}

          {activeMenu === "orders" && <OrderManagement />}

          {activeMenu === "news" && <NewsManagement />}

          {activeMenu === "forum" && (
            <Forum userRole="admin" userName="Admin Sistem" />
          )}

          {activeMenu === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
