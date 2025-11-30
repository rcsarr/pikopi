import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import AdminUserView from './AdminUserView';
import { orderAPI, paymentAPI } from '../services/api';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  Coffee,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  Settings,
  Cpu,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Order {
  id: string;
  userId: number;  // Backend returns number, not string

  // ✅ Fix: Backend uses "customer" prefix
  customerName: string;   // was: userName
  customerEmail: string;  // was: userEmail
  customerPhone: string;  // was: userPhone
  customerAddress: string;  // was: address

  coffeeType: string;
  weight: number;  // Backend returns 'weight', not 'kilograms'
  price: number;   // Backend returns 'price', not 'totalPrice'

  createdAt: string;  // Backend returns 'createdAt', not 'orderDate'
  deliveryDate: string | null;

  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'verified' | 'rejected';
  notes: string | null;

  machineId?: string | null;
  machineName?: string | null;

  payment?: {
    id: string;
    method: string;
    accountName: string;
    amount: number;
    proofImage: string;
    status: 'pending' | 'verified' | 'rejected';
    uploadedAt: string;
    verifiedAt?: string;
    notes?: string;
    rejectionReason?: string;
  } | null;
}


interface Machine {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export default function OrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState('all');
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Order['payment'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ✅ REAL DATA: Available machines (you can also fetch this from backend later)
  const machines: Machine[] = [
    { id: 'MCH-001', name: 'Mesin Sortir A', location: 'Lantai 1 - Zona Produksi', status: 'active' },
    { id: 'MCH-002', name: 'Mesin Sortir B', location: 'Lantai 1 - Zona Quality Control', status: 'active' },
    { id: 'MCH-003', name: 'Mesin Sortir C', location: 'Lantai 2 - Zona Ekspor', status: 'inactive' }
  ];

  // ✅ REAL DATA: Fetch orders from database
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📡 Fetching orders from API...');
      const response = await orderAPI.getOrders();

      if (response.success && response.data) {
        console.log(`✅ Received ${response.data.length} orders`);

        // ✅ Map API response to match your Order interface
        const mappedOrders: Order[] = response.data.map((apiOrder: any) => ({
          id: apiOrder.id,
          userId: String(apiOrder.userId),
          userName: apiOrder.customerName || '-',
          userEmail: apiOrder.customerEmail || '-',
          userPhone: apiOrder.customerPhone || '-',
          address: apiOrder.customerAddress || '-',
          coffeeType: apiOrder.coffeeType || 'Arabika',
          kilograms: apiOrder.weight || 0,
          totalPrice: apiOrder.price || 0,
          orderDate: apiOrder.createdAt
            ? new Date(apiOrder.createdAt).toLocaleDateString('id-ID')
            : '-',
          deliveryDate: apiOrder.deliveryDate
            ? new Date(apiOrder.deliveryDate).toLocaleDateString('id-ID')
            : '-',
          status: apiOrder.status,
          paymentStatus: apiOrder.paymentStatus,
          notes: apiOrder.notes || '',
          machineId: apiOrder.machineId,
          machineName: apiOrder.machineName,
          payment: apiOrder.payment || null  // ✅ Payment already included from backend
        }));

        setOrders(mappedOrders);

        // Debug: Check payment data
        mappedOrders.forEach(order => {
          if (order.payment) {
            console.log(`Order ${order.id} has payment:`, order.payment.id);
          } else {
            console.log(`Order ${order.id} has no payment data`);
          }
        });

      } else {
        setError('Failed to load orders');
      }
    } catch (err: any) {
      console.error('❌ Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };



  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');

  // ✅ Update filteredOrders to include payment filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesOrderId = selectedOrderId === 'all' || order.id === selectedOrderId;

    // ✅ NEW: Payment status filter
    const matchesPaymentStatus =
      filterPaymentStatus === 'all' ||
      (filterPaymentStatus === 'unpaid' && !order.paymentStatus) ||
      order.paymentStatus === filterPaymentStatus;

    return matchesSearch && matchesStatus && matchesOrderId && matchesPaymentStatus;
  });

  // ✅ REAL DATA: Calculate statistics from actual orders
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0)
  };

  // Open assign dialog
  const openAssignDialog = (order: Order) => {
    setAssigningOrder(order);
    setSelectedMachineId(order.machineId || '');
    setShowAssignDialog(true);
  };

  // ✅ REAL DATA: Assign machine to order (save to backend)
  const handleAssignMachine = async () => {
    if (!assigningOrder || !selectedMachineId) return;

    try {
      const machine = machines.find(m => m.id === selectedMachineId);
      if (!machine) return;

      console.log(`Assigning machine ${selectedMachineId} to order ${assigningOrder.id}...`);

      // TODO: Uncomment when backend endpoint is ready
      const response = await orderAPI.assignMachine(assigningOrder.id, {
        machineId: selectedMachineId,
        machineName: machine.name
      });

      if (response.success) {
        // Update local state hanya jika backend berhasil
        setOrders(orders.map(order =>
          order.id === assigningOrder.id
            ? {
              ...order,
              machineId: selectedMachineId,
              machineName: machine.name,
              status: order.status === 'pending' ? 'processing' : order.status
            }
            : order
        ));

        setShowAssignDialog(false);
        setAssigningOrder(null);
        setSelectedMachineId('');

        console.log(`✅ Machine assigned successfully to order ${assigningOrder.id}`);
        toast.success('Mesin berhasil di-assign!');
      } else {
        console.error('Failed to assign machine:', response.message);
        toast.error(`Gagal assign mesin: ${response.message}`);
      }
    } catch (error) {
      console.error('Error assigning machine:', error);
      toast.error('Gagal assign mesin. Silakan coba lagi.');
    }
  };

  // ✅ REAL DATA: Update order status (save to backend)
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log(`Updating order ${orderId} status to ${newStatus}...`);

      // TODO: Uncomment when backend endpoint is ready
      const response = await orderAPI.updateOrderStatus(orderId, newStatus);

      if (response.success) {
        // Update local state hanya jika backend berhasil
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        console.log(`✅ Order ${orderId} status updated successfully`);
        toast.success(`Status pesanan berhasil diupdate menjadi ${getStatusText(newStatus)}`);
      } else {
        console.error('Failed to update status:', response.message);
        toast.error(`Gagal update status: ${response.message}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Gagal update status pesanan. Silakan coba lagi.');
    }
  };

  const updatePaymentStatus = async (
    orderId: string,
    newStatus: 'pending' | 'verified' | 'rejected',
    rejectionReason?: string
  ) => {
    try {
      console.log(`Updating order ${orderId} payment status to ${newStatus}...`);

      const response = await orderAPI.updatePaymentStatus(orderId, newStatus, rejectionReason);

      if (response.success) {
        // Update local state
        setOrders(orders.map(order =>
          order.id === orderId
            ? {
              ...order,
              paymentStatus: newStatus,
              payment: order.payment ? {
                ...order.payment,
                status: newStatus,
                verifiedAt: newStatus !== 'pending' ? new Date().toISOString() : undefined,
                rejectionReason: rejectionReason
              } : undefined
            }
            : order
        ));

        console.log(`✅ Payment status updated successfully for order ${orderId}`);
        toast.success(`Status pembayaran berhasil diupdate menjadi ${getPaymentStatusText(newStatus)}`);
      } else {
        console.error('Failed to update payment status:', response.message);
        toast.error(`Gagal update status pembayaran: ${response.message}`);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Gagal update status pembayaran. Silakan coba lagi.');
    }
  };

  const refreshOrders = async () => {
    await fetchOrders();
  };

  // Get unique order IDs for filter
  const uniqueOrderIds = Array.from(new Set(orders.map(order => order.id)));

  // Status badge color
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status text
  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'processing': return 'Diproses';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  // OrderManagement.tsx - Setelah getStatusText function

  // ✅ Payment status badge color
  const getPaymentStatusColor = (status?: 'pending' | 'verified' | 'rejected') => {
    if (!status) return 'bg-gray-100 text-gray-700';

    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'verified': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // ✅ Payment status text
  const getPaymentStatusText = (status?: 'pending' | 'verified' | 'rejected') => {
    if (!status) return 'Belum Bayar';

    switch (status) {
      case 'pending': return 'Menunggu';
      case 'verified': return 'Terverifikasi';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  // ✅ Payment status icon
  const getPaymentStatusIcon = (status?: 'pending' | 'verified' | 'rejected') => {
    if (!status) return <XCircle className="w-3 h-3 mr-1" />;

    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 mr-1" />;
      case 'verified': return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'rejected': return <XCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };


  // ✅ REAL DATA: Calculate pie chart from actual orders
  const pieData = [
    { name: 'Selesai', value: stats.completed, color: '#22c55e' },
    { name: 'Diproses', value: stats.processing, color: '#3b82f6' },
    { name: 'Menunggu', value: stats.pending, color: '#eab308' }
  ].filter(item => item.value > 0); // Only show non-zero values

  // ✅ REAL DATA: Revenue trend (last 7 days)
  const revenueTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateString = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

    // Calculate revenue for this date
    const revenue = orders
      .filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate.toDateString() === date.toDateString();
      })
      .reduce((sum, order) => sum + order.totalPrice, 0);

    return {
      date: dateString,
      revenue: revenue / 1000 // Convert to thousands
    };
  });

  if (viewingUser) {
    return <AdminUserView userId={viewingUser} onBack={() => setViewingUser(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#4B2E05] mb-2">Kelola Pesanan</h2>
        <p className="text-gray-600">Monitor dan kelola semua pesanan sortir kopi</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={refreshOrders}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              Memuat...
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              Refresh
            </>
          )}
        </Button>
        <Button className="bg-[#56743D] hover:bg-[#4C7C2E] gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>

      {/* Statistics Cards - ✅ REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Pesanan</p>
                <div className="text-[#4B2E05]">{stats.total}</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Menunggu</p>
                <div className="text-[#4B2E05]">{stats.pending}</div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Diproses</p>
                <div className="text-[#4B2E05]">{stats.processing}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Selesai</p>
                <div className="text-[#4B2E05]">{stats.completed}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Revenue</p>
                <div className="text-[#4B2E05] text-sm">
                  Rp {(stats.totalRevenue / 1000000).toFixed(1)}jt
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="w-4 h-4" />
            Daftar Pesanan
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analitik
          </TabsTrigger>
        </TabsList>

        {/* Orders List Tab - ✅ REAL DATA */}
        <TabsContent value="orders" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari pesanan, nama, atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="processing">Diproses</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pembayaran</SelectItem>
                    <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                    <SelectItem value="verified">Terverifikasi</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                    <SelectItem value="unpaid">Belum Bayar</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pesanan</SelectItem>
                    {uniqueOrderIds.map(id => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table - ✅ REAL DATA */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-pulse" />
                    <p className="text-gray-600">Memuat data pesanan...</p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">Tidak ada pesanan ditemukan</p>
                    <p className="text-sm text-gray-500">
                      {searchQuery || filterStatus !== 'all'
                        ? 'Coba ubah filter pencarian'
                        : 'Belum ada pesanan yang masuk'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Pesanan</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Jenis Kopi</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Total Harga</TableHead>
                        <TableHead>Tanggal Pesan</TableHead>
                        <TableHead>Mesin</TableHead>
                        <TableHead>Status Pembayaran</TableHead>
                        <TableHead>Status Pesanan</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="text-[#4B2E05] font-mono text-sm">{order.id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-[#56743D] text-white">
                                  {order.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-[#4B2E05] font-medium">{order.userName}</p>
                                <p className="text-gray-500 text-sm">{order.userEmail}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Coffee className="w-4 h-4 text-[#56743D]" />
                              <span>{order.coffeeType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{order.kilograms} kg</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">Rp {order.totalPrice.toLocaleString('id-ID')}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {order.orderDate}
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.machineId ? (
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="text-[#4B2E05] text-sm font-medium">{order.machineName}</p>
                                  <p className="text-gray-500 text-xs font-mono">{order.machineId}</p>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAssignDialog(order)}
                                className="gap-2 text-xs"
                              >
                                <Settings className="w-3 h-3" />
                                Assign Mesin
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.paymentStatus || 'pending'}
                              onValueChange={(value) => updatePaymentStatus(order.id, value as 'pending' | 'verified' | 'rejected')}
                            >
                              <SelectTrigger className="w-[160px]">
                                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                                  {getPaymentStatusIcon(order.paymentStatus)}
                                  {getPaymentStatusText(order.paymentStatus)}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                                <SelectItem value="verified">Terverifikasi</SelectItem>
                                <SelectItem value="rejected">Ditolak</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value as Order['status'])}
                            >
                              <SelectTrigger className="w-[140px]">
                                <Badge className={getStatusColor(order.status)}>
                                  {getStatusText(order.status)}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Menunggu</SelectItem>
                                <SelectItem value="processing">Diproses</SelectItem>
                                <SelectItem value="completed">Selesai</SelectItem>
                                <SelectItem value="cancelled">Dibatalkan</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {/* View order details */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedOrder(order)}
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {/* Payment button - enhanced visibility */}
                              <Button
                                size="sm"
                                variant={order.payment ? "ghost" : "outline"}
                                onClick={() => {
                                  console.log('Payment button clicked!');
                                  console.log('Order:', order);
                                  console.log('Payment data:', order.payment);

                                  if (order.payment && order.payment.proofImage) {
                                    setSelectedPayment(order.payment);
                                  } else {
                                    toast.error('Bukti pembayaran belum tersedia untuk pesanan ini');
                                  }
                                }}
                                title={order.payment ? "Lihat Bukti Bayar" : "Belum ada pembayaran"}
                                className={order.payment
                                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  : "text-gray-500 border-gray-300"
                                }
                                disabled={!order.payment}
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>

                              {/* Machine assignment */}
                              {order.machineId && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openAssignDialog(order)}
                                  title="Ubah Mesin"
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>

                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab - ✅ REAL DATA with placeholders for unavailable data */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend - ✅ REAL DATA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">Tren Revenue 7 Hari Terakhir</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueTrend.some(d => d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [`Rp ${(value * 1000).toLocaleString('id-ID')}`, 'Revenue']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#56743D"
                        strokeWidth={2}
                        name="Revenue (ribu)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Belum ada data revenue</p>
                      <p className="text-sm">Data akan muncul setelah ada pesanan selesai</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart - ✅ REAL DATA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">Distribusi Status Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Belum ada data pesanan</p>
                      <p className="text-sm">Grafik akan muncul setelah ada pesanan</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary by Coffee Type - ✅ REAL DATA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">Pesanan per Jenis Kopi</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={
                      Object.entries(
                        orders.reduce((acc, order) => {
                          acc[order.coffeeType] = (acc[order.coffeeType] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => ({ type, count }))
                    }>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#56743D" name="Jumlah Pesanan" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Coffee className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Belum ada data jenis kopi</p>
                      <p className="text-sm">Data akan muncul setelah ada pesanan</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Customers - ✅ REAL DATA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">Pelanggan Teratas</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      orders.reduce((acc, order) => {
                        if (!acc[order.userId]) {
                          acc[order.userId] = {
                            name: order.userName,
                            totalOrders: 0,
                            totalSpent: 0
                          };
                        }
                        acc[order.userId].totalOrders++;
                        acc[order.userId].totalSpent += order.totalPrice;
                        return acc;
                      }, {} as Record<string, { name: string; totalOrders: number; totalSpent: number }>)
                    )
                      .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
                      .slice(0, 5)
                      .map(([userId, data]) => (
                        <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-[#56743D] text-white">
                                {data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[#4B2E05] font-medium">{data.name}</p>
                              <p className="text-sm text-gray-500">{data.totalOrders} pesanan</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[#4B2E05] font-semibold">
                              Rp {(data.totalSpent / 1000).toFixed(0)}k
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Belum ada data pelanggan</p>
                      <p className="text-sm">Data akan muncul setelah ada pesanan</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog - ✅ REAL DATA */}
      {
        selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#4B2E05] flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Detail Pesanan {selectedOrder.id}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Pelanggan</Label>
                    <p className="text-[#4B2E05] font-medium mt-1">{selectedOrder.userName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusText(selectedOrder.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-600 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Status Pembayaran
                      </Label>
                      <div className="mt-2">
                        <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                          {getPaymentStatusIcon(selectedOrder.paymentStatus)}
                          {getPaymentStatusText(selectedOrder.paymentStatus)}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick actions for payment */}
                    {selectedOrder.paymentStatus === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            updatePaymentStatus(selectedOrder.id, 'verified');
                            setSelectedOrder(null);
                          }}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verifikasi
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updatePaymentStatus(selectedOrder.id, 'rejected');
                            setSelectedOrder(null);
                          }}
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <p className="text-gray-700 mt-1">{selectedOrder.userEmail}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      No. Telepon
                    </Label>
                    <p className="text-gray-700 mt-1">{selectedOrder.userPhone}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Alamat Pengiriman
                  </Label>
                  <p className="text-gray-700 mt-1">{selectedOrder.address}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-600">Jenis Kopi</Label>
                    <p className="text-[#4B2E05] font-medium mt-1 flex items-center gap-2">
                      <Coffee className="w-4 h-4" />
                      {selectedOrder.coffeeType}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Jumlah</Label>
                    <p className="text-[#4B2E05] font-medium mt-1">{selectedOrder.kilograms} kg</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Total Harga</Label>
                    <p className="text-[#4B2E05] font-bold mt-1">
                      Rp {selectedOrder.totalPrice.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Tanggal Pesan</Label>
                    <p className="text-gray-700 mt-1">{selectedOrder.orderDate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Tanggal Pengiriman</Label>
                    <p className="text-gray-700 mt-1">{selectedOrder.deliveryDate}</p>
                  </div>
                </div>
                {selectedOrder.machineId && (
                  <div>
                    <Label className="text-gray-600">Mesin yang Digunakan</Label>
                    <div className="flex items-center gap-2 mt-1 p-3 bg-blue-50 rounded-lg">
                      <Cpu className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-[#4B2E05] font-medium">{selectedOrder.machineName}</p>
                        <p className="text-sm text-gray-500 font-mono">{selectedOrder.machineId}</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div>
                    <Label className="text-gray-600">Catatan Pesanan</Label>
                    <p className="text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )
      }

      {/* Assign Machine Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4B2E05] flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              Assign Mesin ke Pesanan
            </DialogTitle>
            <DialogDescription>
              Pilih mesin untuk memproses pesanan {assigningOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {assigningOrder && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Package className="w-4 h-4 text-blue-700" />
                <AlertDescription className="text-blue-700">
                  <strong>{assigningOrder.userName}</strong> - {assigningOrder.kilograms} kg {assigningOrder.coffeeType}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Pilih Mesin</Label>
                <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mesin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem
                        key={machine.id}
                        value={machine.id}
                        disabled={machine.status !== 'active'}
                      >
                        <div className="flex items-center gap-2 py-1">
                          <Cpu className={`w-4 h-4 ${machine.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <p className="font-medium">{machine.name}</p>
                            <p className="text-xs text-gray-500">{machine.location}</p>
                          </div>
                          <Badge className={
                            machine.status === 'active' ? 'bg-green-100 text-green-700' :
                              machine.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                          }>
                            {machine.status === 'active' ? 'Aktif' :
                              machine.status === 'maintenance' ? 'Maintenance' :
                                'Nonaktif'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {assigningOrder.machineId && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="w-4 h-4 text-yellow-700" />
                  <AlertDescription className="text-yellow-700">
                    Pesanan ini sudah di-assign ke <strong>{assigningOrder.machineName}</strong>.
                    Assign ulang akan mengganti mesin yang digunakan.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAssignMachine}
              disabled={!selectedMachineId}
              className="bg-[#56743D] hover:bg-[#4C7C2E]"
            >
              <Cpu className="w-4 h-4 mr-2" />
              Assign Mesin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ✅ Payment Verification Dialog */}
      {
        selectedPayment && (
          <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#4B2E05] flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Verifikasi Pembayaran
                </DialogTitle>
                <DialogDescription>
                  Periksa detail pembayaran dan bukti transfer sebelum verifikasi
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Payment Status Badge */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-600">Status Pembayaran</Label>
                    <div className="mt-2">
                      <Badge className={getPaymentStatusColor(selectedPayment.status as any)}>
                        {getPaymentStatusIcon(selectedPayment.status as any)}
                        {getPaymentStatusText(selectedPayment.status as any)}
                      </Badge>
                    </div>
                  </div>

                  {selectedPayment.verifiedAt && (
                    <div className="text-right">
                      <Label className="text-gray-600">Diverifikasi pada</Label>
                      <p className="text-sm text-gray-700 mt-1">
                        {new Date(selectedPayment.verifiedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Metode Pembayaran</Label>
                    <p className="text-[#4B2E05] font-medium mt-1">{selectedPayment.method}</p>
                  </div>

                  <div>
                    <Label className="text-gray-600">Nama Rekening</Label>
                    <p className="text-[#4B2E05] font-medium mt-1">{selectedPayment.accountName}</p>
                  </div>

                  <div>
                    <Label className="text-gray-600">Jumlah Transfer</Label>
                    <p className="text-[#4B2E05] font-medium mt-1">
                      Rp {selectedPayment.amount.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-600">Waktu Upload</Label>
                    <p className="text-[#4B2E05] font-medium mt-1">
                      {new Date(selectedPayment.uploadedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Payment Notes */}
                {selectedPayment.notes && (
                  <div>
                    <Label className="text-gray-600">Catatan Customer</Label>
                    <p className="text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                      {selectedPayment.notes}
                    </p>
                  </div>
                )}

                {/* Rejection Reason (if rejected) */}
                {selectedPayment.status === 'rejected' && selectedPayment.rejectionReason && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                    <AlertDescription className="text-red-700">
                      <strong>Alasan Penolakan:</strong> {selectedPayment.rejectionReason}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Payment Proof Image */}
                <div>
                  <Label className="text-gray-600 mb-2 block">Bukti Transfer</Label>
                  <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={selectedPayment.proofImage}
                      alt="Bukti Transfer"
                      className="w-full h-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                    {/* Image Actions */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(selectedPayment.proofImage, '_blank')}
                        className="bg-white hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Buka
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedPayment.proofImage;
                          link.download = `payment-proof-${selectedPayment.id}.jpg`;
                          link.click();
                        }}
                        className="bg-white hover:bg-gray-100"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Verification Actions (only if pending) */}
                {selectedPayment.status === 'pending' ? (
                  <div className="space-y-3">
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="w-4 h-4 text-yellow-700" />
                      <AlertDescription className="text-yellow-700">
                        Periksa bukti pembayaran dengan teliti sebelum verifikasi
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          // Get order ID from payment
                          const order = orders.find(o => o.payment?.id === selectedPayment.id);
                          if (order) {
                            updatePaymentStatus(order.id, 'verified');
                            setSelectedPayment(null);
                          }
                        }}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verifikasi Pembayaran
                      </Button>

                      <Button
                        onClick={() => {
                          const reason = prompt('Alasan penolakan (wajib diisi):');
                          if (reason) {
                            const order = orders.find(o => o.payment?.id === selectedPayment.id);
                            if (order) {
                              updatePaymentStatus(order.id, 'rejected', reason);
                              setSelectedPayment(null);
                            }
                          }
                        }}
                        variant="outline"
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Tolak Pembayaran
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                      Tutup
                    </Button>
                  </div>
                )}

                {/* Already Verified/Rejected Info */}
                {selectedPayment.status !== 'pending' && (
                  <Alert className={
                    selectedPayment.status === 'verified'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }>
                    {selectedPayment.status === 'verified' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-700" />
                        <AlertDescription className="text-green-700">
                          Pembayaran telah diverifikasi
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-700" />
                        <AlertDescription className="text-red-700">
                          Pembayaran telah ditolak
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )
      }
    </div >
  );
}

