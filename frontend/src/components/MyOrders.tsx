import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { orderAPI } from '../services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Package, Search, Calendar, CreditCard, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Order {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  kilograms: number;
  coffeeType: string;
  deliveryDate: string;
  notes: string;
  packageType: string;
  pricePerKg: number;
  totalPrice: number;
  orderDate: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'verified' | 'rejected';
}

export default function MyOrders({ userEmail, onPayOrder }: { userEmail: string; onPayOrder: (orderId: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  // ✅ Load orders dari backend (HAPUS fallback localStorage)
  const loadOrders = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await orderAPI.getOrders();
      
      if (response.success) {
        const transformedOrders = response.data.map((order: any) => ({
          id: order.id,
          name: order.customerName || order.userName || '',
          phone: order.customerPhone || '',
          email: order.customerEmail || '',
          address: order.customerAddress || '',
          kilograms: order.weight,
          coffeeType: order.coffeeType || 'Arabika',
          deliveryDate: order.deliveryDate || '',
          notes: order.notes || '',
          packageType: order.packageName,
          pricePerKg: order.price / order.weight,
          totalPrice: order.price,
          orderDate: order.createdAt,
          status: order.status,
          paymentStatus: order.paymentStatus === 'verified' ? 'verified' : 
                        order.paymentStatus === 'rejected' ? 'rejected' :
                        order.paymentStatus === 'pending' ? 'pending' : undefined,
        }));

        const sortedOrders = transformedOrders.sort((a: Order, b: Order) =>
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );

        setOrders(sortedOrders);
      } else {
        throw new Error(response.message || 'Gagal memuat pesanan');
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Gagal memuat pesanan dari server');
      
      // ✅ HAPUS fallback localStorage - biarkan kosong jika error
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Filter orders (di DALAM komponen)
  const filterOrders = () => {
    let filtered = [...orders];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.packageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.coffeeType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  // ✅ Status badge helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><AlertCircle className="w-3 h-3 mr-1" />Diproses</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Dibatalkan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline" className="border-red-500 text-red-600">Belum Bayar</Badge>;
    }
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Menunggu Verifikasi</Badge>;
      case 'verified':
        return <Badge className="bg-green-500">Terverifikasi</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ✅ Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    needPayment: orders.filter(o => !o.paymentStatus).length,
  };

  // ✅ HANYA SATU return statement
  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
        >
          <p className="font-semibold">❌ Error</p>
          <p className="text-sm">{error}</p>
          <Button 
            onClick={loadOrders} 
            size="sm" 
            className="mt-2 bg-red-600 hover:bg-red-700"
          >
            Coba Lagi
          </Button>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#4B2E05] text-3xl font-bold">Pesanan Saya</h1>
            <p className="text-gray-600">Kelola dan pantau pesanan Anda</p>
          </div>
          <Package className="w-12 h-12 text-[#56743D]" />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        <Card className="border-2 border-[#4B2E05]/20">
          <CardHeader className="pb-3">
            <CardDescription>Total Pesanannnn</CardDescription>
            <CardTitle className="text-3xl text-[#4B2E05]">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Menunggu</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-blue-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Diproses</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.processing}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-green-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Selesai</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-red-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Perlu Bayar</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.needPayment}</CardTitle>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-2 border-[#4B2E05]/20">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-[#4B2E05]">Daftar Pesanan</CardTitle>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari ID pesanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="processing">Diproses</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-[#4B2E05] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-4">Memuat pesanan...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pesanannnn</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Berat</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          {searchQuery || statusFilter !== 'all' 
                            ? 'Tidak ada pesanan yang sesuai dengan filter' 
                            : 'Belum ada pesanan'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.packageType}</p>
                              <p className="text-xs text-gray-500">{order.coffeeType}</p>
                            </div>
                          </TableCell>
                          <TableCell>{order.kilograms} kg</TableCell>
                          <TableCell className="font-semibold">
                            Rp {order.totalPrice.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {new Date(order.orderDate).toLocaleDateString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                          <TableCell className="text-right">
                            {!order.paymentStatus && (
                              <Button
                                size="sm"
                                onClick={() => onPayOrder(order.id)}
                                className="bg-[#56743D] hover:bg-[#56743D]/90"
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Bayar
                              </Button>
                            )}
                            {order.paymentStatus === 'rejected' && (
                              <Button
                                size="sm"
                                onClick={() => onPayOrder(order.id)}
                                variant="destructive"
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Upload Ulang
                              </Button>
                            )}
                            {order.paymentStatus === 'pending' && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                Menunggu
                              </Badge>
                            )}
                            {order.paymentStatus === 'verified' && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Lunas
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
