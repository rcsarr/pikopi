import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { orderAPI } from '../services/api';
import PaymentMethod from './PaymentMethod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
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
import {
  ShoppingCart,
  Package,
  Calendar,
  MapPin,
  Phone,
  User,
  Coffee,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Zap,
  Check,
  CreditCard,
  Search,
  Clock,
  XCircle,
  AlertCircle,
  ListOrdered,
  PlusCircle,
  ArrowLeft
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

import { motion } from 'motion/react';

interface OrderHubProps {
  userName: string;
  userEmail: string;
  userPhone: string;
  onPayNow?: (orderId: string) => void;
}

interface OrderData {
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

interface Payment {
  id: string;
  orderId: string;
  method: string;
  accountName: string;
  amount: number;
  proofImage: string;
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
  verifiedAt?: string;
  notes?: string;
  rejectionReason?: string;
}

type PackageType = 'small' | 'medium' | 'large' | null;

interface PackageInfo {
  name: string;
  range: string;
  minKg: number;
  maxKg: number | null;
  price: number;
  features: string[];
  badge: string;
  color: string;
  icon: typeof Package;
}

const packages: Record<'small' | 'medium' | 'large', PackageInfo> = {
  small: {
    name: 'Paket Kecil',
    range: '5-20 kg',
    minKg: 5,
    maxKg: 20,
    price: 15000,
    features: [
      'Sortir otomatis dengan AI',
      'Akurasi 95%+',
      'Laporan digital',
      'Estimasi 1-2 hari',
      'Dashboard monitoring'
    ],
    badge: 'UMKM',
    color: 'bg-blue-500',
    icon: Package
  },
  medium: {
    name: 'Paket Menengah',
    range: '21-50 kg',
    minKg: 21,
    maxKg: 50,
    price: 13000,
    features: [
      'Semua fitur Paket Kecil',
      'Prioritas antrian',
      'Konsultasi gratis',
      'Estimasi 2-3 hari',
      'Diskon 13% per kg'
    ],
    badge: 'POPULER',
    color: 'bg-green-500',
    icon: TrendingUp
  },
  large: {
    name: 'Paket Besar',
    range: '51+ kg',
    minKg: 51,
    maxKg: null,
    price: 11000,
    features: [
      'Semua fitur Paket Menengah',
      'Harga spesial',
      'Free pickup & delivery',
      'Estimasi 3-5 hari',
      'Diskon 27% per kg'
    ],
    badge: 'HEMAT',
    color: 'bg-orange-500',
    icon: Zap
  }
};

export default function OrderHub({ userName, userEmail, userPhone, onPayNow }: OrderHubProps) {
  const [activeTab, setActiveTab] = useState('new-order');
  const [orderData, setOrderData] = useState({
    name: userName,
    phone: userPhone,
    email: userEmail,
    address: '',
    kilograms: '',
    coffeeType: 'Arabika',
    deliveryDate: '',
    notes: ''
  });
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<OrderData | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderData | null>(null);


  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // My Orders states
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  // Di dalam component OrderHub, cari fungsi loadOrders() dan ganti dengan:

  const loadOrders = async () => {
    try {
      console.log('📡 Loading orders from backend...');

      // ✅ Fetch dari backend API
      const response = await orderAPI.getOrders();

      if (response.success) {
        console.log('✅ Orders loaded:', response.data);

        // Transform data dari backend ke format frontend
        const transformedOrders = response.data.map((order: any) => ({
          id: order.id,
          name: order.customerName || order.userName || '',
          phone: order.customerPhone || '',
          email: order.customerEmail || orderData.email,
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

        // Sort by date descending
        const sortedOrders = transformedOrders.sort((a: OrderData, b: OrderData) =>
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );

        setOrders(sortedOrders);
      } else {
        console.error('❌ Failed to load orders:', response.message);
        setOrders([]);  // ✅ Kosongkan jika gagal, jangan fallback ke localStorage
      }
    } catch (err: any) {
      console.error('❌ Error loading orders:', err);
      setOrders([]);  // ✅ Kosongkan jika error, jangan fallback ke localStorage
    }
  };

  const handlePayNow = (orderId: string) => {
    console.log('💳 handlePayNow called with orderId:', orderId);
    console.log('📦 Available orders:', orders);

    // Cari order berdasarkan ID
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      console.error('❌ Order not found!');
      console.log('🔍 Order IDs in state:', orders.map(o => o.id));
      alert('Pesanan tidak ditemukan. Silakan muat ulang halaman.');
      return;
    }

    console.log('✅ Order found:', order);

    // Set selected order dan buka dialog/tab payment
    setSelectedOrderForPayment(order);

    // Option A: Jika menggunakan tab payment
    setActiveTab('payment');

    // Option B: Jika menggunakan dialog payment
    // setIsPaymentDialogOpen(true);
  };

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

  // Determine package based on weight
  const getPackageType = (kg: number): PackageType => {
    if (kg < 5) return null;
    if (kg >= 5 && kg <= 20) return 'small';
    if (kg >= 21 && kg <= 50) return 'medium';
    if (kg >= 51) return 'large';
    return null;
  };

  const currentKg = orderData.kilograms ? parseFloat(orderData.kilograms) : 0;
  const currentPackage = getPackageType(currentKg);
  const packageInfo = currentPackage ? packages[currentPackage] : null;
  const pricePerKg = packageInfo ? packageInfo.price : 15000;
  const totalPrice = currentKg >= 5 ? currentKg * pricePerKg : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setOrderData({
      ...orderData,
      [e.target.name]: e.target.value
    });
  };

  const handleOrder = async () => {
    console.log('🔴 === START handleOrder ===');

    if (!packageInfo) {
      setOrderError('Pilih paket yang valid (minimal 5 kg)');
      return;
    }

    if (!orderData.name || !orderData.phone || !orderData.address || currentKg < 5) {
      setOrderError('Lengkapi semua field yang wajib diisi');
      return;
    }

    setIsCreatingOrder(true);
    setOrderError('');

    try {
      console.log('📡 Sending to backend:', {
        packageName: packageInfo.name,
        weight: currentKg,
        price: totalPrice,
        customerName: orderData.name,
        customerPhone: orderData.phone,
        customerEmail: orderData.email,
        customerAddress: orderData.address,
        coffeeType: orderData.coffeeType,
        deliveryDate: orderData.deliveryDate || null,
        notes: orderData.notes || null,
      });

      // ✅ Kirim ke backend API
      const response = await orderAPI.createOrder({
        packageName: packageInfo.name,
        weight: currentKg,
        price: totalPrice,
        customerName: orderData.name,
        customerPhone: orderData.phone,
        customerEmail: orderData.email,
        customerAddress: orderData.address,
        coffeeType: orderData.coffeeType,
        deliveryDate: orderData.deliveryDate || null,
        notes: orderData.notes || null,
      });

      console.log('✅ Backend response:', response);

      if (response.success) {
        const orderDate = new Date().toISOString().split('T')[0];

        const newOrder: Order = {
          id: response.data.id,  // ✅ ID dari backend
          name: orderData.name,
          phone: orderData.phone,
          email: orderData.email,
          address: orderData.address,
          kilograms: currentKg,
          coffeeType: orderData.coffeeType,
          deliveryDate: orderData.deliveryDate || '',
          notes: orderData.notes,
          packageType: packageInfo.name,
          pricePerKg: pricePerKg,
          totalPrice: totalPrice,
          orderDate: orderDate,
          status: 'pending',
          paymentStatus: 'pending'
        };

        // Update local state
        setOrders(prevOrders => [newOrder, ...prevOrders]);

        // Save to localStorage (backup)
        const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
        existingOrders.push(newOrder);
        localStorage.setItem('userOrders', JSON.stringify(existingOrders));
        await loadOrders();
        // Show success dialog
        setSubmittedOrder(newOrder);
        setIsSuccessDialogOpen(true);

        // Reset form
        setOrderData({
          name: userName,
          phone: userPhone,
          email: userEmail,
          address: '',
          kilograms: '',
          coffeeType: 'Arabika',
          deliveryDate: '',
          notes: ''
        });

        console.log('🎉 Order created successfully!');
      } else {
        throw new Error(response.message || 'Gagal membuat order');
      }
    } catch (error: any) {
      console.error('❌ Error creating order:', error);
      setOrderError(error.message || 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsCreatingOrder(false);
      console.log('🔴 === END handleOrder ===');
    }
  };


  const isFormValid = orderData.name &&
    orderData.phone &&
    orderData.address &&
    orderData.kilograms &&
    currentKg >= 5;

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

  const handleRefreshOrders = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  // ✅ Function untuk cancel order
  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      console.log('🔴 Cancelling order:', orderToCancel);
      const response = await orderAPI.cancelOrder(orderToCancel);

      if (response.success) {
        console.log('✅ Order cancelled successfully');
        setShowCancelDialog(false);
        setOrderToCancel(null);
        await loadOrders(); // Reload orders
      } else {
        alert('Gagal membatalkan pesanan: ' + response.message);
      }
    } catch (err: any) {
      console.error('❌ Error cancelling order:', err);
      alert('Gagal membatalkan pesanan: ' + err.message);
    }
  };

  // ✅ Function untuk delete order
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      console.log('🗑️ Deleting order:', orderToDelete);
      const response = await orderAPI.deleteOrder(orderToDelete);

      if (response.success) {
        console.log('✅ Order deleted successfully');
        setShowDeleteDialog(false);
        setOrderToDelete(null);
        await loadOrders(); // Reload orders
      } else {
        alert('Gagal menghapus pesanan: ' + response.message);
      }
    } catch (err: any) {
      console.error('❌ Error deleting order:', err);
      alert('Gagal menghapus pesanan: ' + err.message);
    }
  };

  // ✅ Function untuk handle payment dengan warning
  const handlePayNowWithWarning = (orderId: string) => {
    setOrderToCancel(orderId); // Temporary store order ID
    setShowPaymentWarning(true);
  };

  const confirmPayment = () => {
    if (orderToCancel) {
      handlePayNow(orderToCancel);
    }
    setShowPaymentWarning(false);
    setOrderToCancel(null);
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    needPayment: orders.filter(o => !o.paymentStatus).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#4B2E05] mb-2">Layanan Pemesanan & Pesanan</h2>
            <p className="text-gray-600">Pesan jasa sortir kopi dan kelola pesanan Anda</p>
          </div>
          <Coffee className="w-12 h-12 text-[#56743D]" />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-[#F5E6CA]">
            <TabsTrigger
              value="new-order"
              className="gap-2 data-[state=active]:bg-[#4B2E05] data-[state=active]:text-white py-3"
            >
              <PlusCircle className="w-4 h-4" />
              Buat Pesanan Baru
            </TabsTrigger>
            <TabsTrigger
              value="my-orders"
              className="gap-2 data-[state=active]:bg-[#4B2E05] data-[state=active]:text-white py-3"
            >
              <ListOrdered className="w-4 h-4" />
              Pesanan Saya
              {stats.total > 0 && (
                <Badge className="ml-2 bg-red-500">{stats.total}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* New Order Tab */}
          <TabsContent value="new-order" className="space-y-6 mt-6">
            {/* Alert Minimum Order */}
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="w-5 h-5 text-yellow-700" />
              <AlertDescription className="text-yellow-800">
                <strong>Perhatian:</strong> Minimum pemesanan adalah <strong>5 kg</strong>. Paket akan otomatis disesuaikan berdasarkan jumlah pesanan Anda.
              </AlertDescription>
            </Alert>

            {/* Error Alert */}
            {orderError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-700" />
                <AlertDescription className="text-red-800">
                  <strong>❌ Error:</strong> {orderError}
                </AlertDescription>
              </Alert>
            )}


            {/* Pricing Packages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(packages).map(([key, pkg]) => {
                const isActive = currentPackage === key;
                return (
                  <Card
                    key={key}
                    className={`border-2 shadow-lg hover:shadow-xl transition-all relative overflow-hidden ${isActive
                        ? `${pkg.color} border-current`
                        : 'border-gray-200'
                      }`}
                  >
                    {/* Badge */}
                    <div className="absolute top-0 right-0">
                      <Badge className={`${isActive
                          ? 'bg-white text-[#4B2E05]'
                          : pkg.color === 'bg-blue-500'
                            ? 'bg-blue-100 text-blue-700'
                            : pkg.color === 'bg-green-500'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                        } rounded-tl-none rounded-br-none`}>
                        {pkg.badge}
                      </Badge>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
                    )}

                    <CardHeader className={`pb-4 ${isActive ? 'text-white' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <pkg.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#4B2E05]'}`} />
                        <CardTitle className={isActive ? 'text-white' : 'text-[#4B2E05]'}>
                          {pkg.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl ${isActive ? 'text-white' : 'text-[#4C7C2E]'}`}>
                          Rp {pkg.price.toLocaleString('id-ID')}
                        </span>
                        <span className={isActive ? 'text-white/80' : 'text-gray-600'}>/kg</span>
                      </div>
                      <p className={isActive ? 'text-white/90' : 'text-gray-600'}>
                        Untuk {pkg.range}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-green-600'
                              }`} />
                            <span className={isActive ? 'text-white' : 'text-gray-700'}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {isActive && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                          <Badge className="bg-white text-[#4B2E05] w-full justify-center">
                            ✓ PAKET AKTIF
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Separator />

            {/* Order Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Section */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#4B2E05] flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Form Pemesanan
                  </CardTitle>
                  <CardDescription>
                    Isi form di bawah ini untuk memesan jasa sortir kopi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="name"
                        name="name"
                        value={orderData.name}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Nama Anda"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon (WhatsApp) *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        value={orderData.phone}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="08XX-XXXX-XXXX"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={orderData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Lengkap *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Textarea
                        id="address"
                        name="address"
                        value={orderData.address}
                        onChange={handleChange}
                        className="pl-10 resize-none"
                        rows={3}
                        placeholder="Alamat lengkap untuk pickup/delivery"
                        required
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="coffeeType">Jenis Kopi</Label>
                    <div className="relative">
                      <Coffee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        id="coffeeType"
                        name="coffeeType"
                        value={orderData.coffeeType}
                        onChange={handleChange}
                        className="w-full pl-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C7C2E]"
                      >
                        <option value="Arabika">Arabika</option>
                        <option value="Robusta">Robusta</option>
                        <option value="Liberika">Liberika</option>
                        <option value="Campuran">Campuran</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kilograms">Jumlah (kg) *</Label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="kilograms"
                        name="kilograms"
                        type="number"
                        min="5"
                        step="0.5"
                        value={orderData.kilograms}
                        onChange={handleChange}
                        className={`pl-10 ${orderData.kilograms && currentKg < 5
                            ? 'border-red-500 focus:ring-red-500'
                            : ''
                          }`}
                        placeholder="Minimal 5 kg"
                        required
                      />
                    </div>

                    {/* Dynamic Package Info */}
                    {orderData.kilograms && currentKg >= 5 && packageInfo && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-green-800">
                            <strong>{packageInfo.name}</strong> - Rp {pricePerKg.toLocaleString('id-ID')}/kg
                          </p>
                          <p className="text-green-700 text-sm">
                            {packageInfo.range}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error for less than 5 kg */}
                    {orderData.kilograms && currentKg < 5 && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertTriangle className="w-4 h-4 text-red-700" />
                        <AlertDescription className="text-red-700">
                          Minimum pemesanan adalah <strong>5 kg</strong>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Helper text for minimum */}
                    {!orderData.kilograms && (
                      <p className="text-gray-500 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Minimum pemesanan: <strong>5 kg</strong>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">Tanggal Pengantaran (Opsional)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="deliveryDate"
                        name="deliveryDate"
                        type="date"
                        value={orderData.deliveryDate}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={orderData.notes}
                      onChange={handleChange}
                      className="resize-none"
                      rows={3}
                      placeholder="Instruksi khusus, preferensi waktu pickup, dll."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Summary Section */}
              <div className="space-y-6">
                <Card className={`border-0 shadow-lg ${packageInfo
                    ? `bg-gradient-to-br from-[#4B2E05] to-[#6A4B2E]`
                    : 'bg-gray-100'
                  } text-white`}>
                  <CardHeader>
                    <CardTitle className={packageInfo ? 'text-white' : 'text-gray-600'}>
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Ringkasan Pesanan
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {packageInfo ? (
                      <>
                        {/* Package Badge */}
                        <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[#F5E6CA]">Paket Dipilih:</span>
                            <Badge className="bg-white text-[#4B2E05]">
                              {packageInfo.badge}
                            </Badge>
                          </div>
                          <p className="text-xl">{packageInfo.name}</p>
                          <p className="text-[#F5E6CA] text-sm">{packageInfo.range}</p>
                        </div>

                        {/* Order Details */}
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-[#F5E6CA]">Jenis Kopi:</span>
                            <span>{orderData.coffeeType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#F5E6CA]">Jumlah:</span>
                            <span>{currentKg} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#F5E6CA]">Harga per kg:</span>
                            <span>Rp {pricePerKg.toLocaleString('id-ID')}</span>
                          </div>
                          <Separator className="bg-white/20" />
                          <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                            <span className="text-[#F5E6CA]">Total Harga:</span>
                            <div>
                              <div className="text-white text-xl">
                                Rp {totalPrice.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">
                          Masukkan jumlah pesanan minimal 5 kg untuk melihat ringkasan
                        </p>
                      </div>
                    )}

                    <Button
                      type="button"  // ✅ PENTING
                      onClick={handleOrder}
                      disabled={!isFormValid || isCreatingOrder}
                      className={`w-full gap-2 ${isFormValid && !isCreatingOrder
                          ? 'bg-white text-[#4B2E05] hover:bg-[#F5E6CA]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {isCreatingOrder ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#4B2E05] border-t-transparent rounded-full animate-spin" />
                          <span>Memproses...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          <span>Pesan Sekarang</span>
                        </div>
                      )}
                    </Button>


                    {!isFormValid && (
                      <p className="text-gray-400 text-center text-sm">
                        {currentKg < 5
                          ? 'Minimum pemesanan 5 kg'
                          : 'Lengkapi form terlebih dahulu'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Why PilahKopi Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4B2E05]">Kenapa PilahKopi?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-[#4B2E05]">Akurasi Tinggi</p>
                        <p className="text-gray-600">Sistem AI dengan akurasi 95%+</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-[#4B2E05]">Proses Cepat</p>
                        <p className="text-gray-600">10,000+ biji per jam</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-[#4B2E05]">Laporan Detail</p>
                        <p className="text-gray-600">Dashboard & laporan digital</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-[#4B2E05]">Harga Kompetitif</p>
                        <p className="text-gray-600">Mulai dari Rp 11.000/kg</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-0 shadow-lg bg-blue-50">
                  <CardContent className="p-4">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>Info:</strong> Setelah klik tombol "Pesan Sekarang", pesanan Anda akan diproses dan dapat dipantau melalui tab "Pesanan Saya".
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Orders Tab */}
          <TabsContent value="my-orders" className="space-y-6">
            <Card className="border-2 border-[#4B2E05]/20">
              <CardHeader className="bg-gradient-to-r from-[#4B2E05] to-[#56743D] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ListOrdered className="w-6 h-6" />
                      Pesanan Saya
                    </CardTitle>
                    <CardDescription className="text-[#F5E6CA]">
                      Daftar pesanan yang telah Anda buat
                    </CardDescription>
                  </div>
                  {/* ✅ Tombol Refresh */}
                  <Button
                    onClick={handleRefreshOrders}
                    disabled={isRefreshing}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  >
                    {isRefreshing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    {isRefreshing ? 'Memuat...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Belum ada pesanan</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Pesanan</TableHead>
                          <TableHead>Paket</TableHead>
                          <TableHead>Berat</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pembayaran</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{order.packageType}</TableCell>
                            <TableCell>{order.kilograms} kg</TableCell>
                            <TableCell className="font-semibold">
                              Rp {order.totalPrice.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  order.status === 'completed' ? 'default' :
                                    order.status === 'cancelled' ? 'destructive' :
                                      'secondary'
                                }
                              >
                                {order.status === 'pending' && 'Pending'}
                                {order.status === 'processing' && 'Diproses'}
                                {order.status === 'completed' && 'Selesai'}
                                {order.status === 'cancelled' && 'Dibatalkan'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {order.paymentStatus === 'verified' && (
                                <Badge className="bg-green-500">Terverifikasi</Badge>
                              )}
                              {order.paymentStatus === 'pending' && (
                                <Badge className="bg-yellow-500">Menunggu</Badge>
                              )}
                              {order.paymentStatus === 'rejected' && (
                                <Badge className="bg-red-500">Ditolak</Badge>
                              )}
                              {!order.paymentStatus && (
                                <Badge variant="outline">Belum Bayar</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {/* Tombol Bayar - hanya jika belum bayar dan tidak cancelled */}
                                {!order.paymentStatus && order.status !== 'cancelled' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePayNowWithWarning(order.id)}
                                    className="bg-[#56743D] hover:bg-[#56743D]/90"
                                  >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Bayar
                                  </Button>
                                )}

                                {/* Tombol Batalkan - hanya jika belum bayar dan pending */}
                                {!order.paymentStatus && order.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setOrderToCancel(order.id);
                                      setShowCancelDialog(true);
                                    }}
                                    className="border-red-500 text-red-500 hover:bg-red-50"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Batalkan
                                  </Button>
                                )}

                                {/* Tombol Hapus - hanya jika cancelled atau completed */}
                                {order.status === 'cancelled' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setOrderToDelete(order.id);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="border-gray-400 text-gray-600 hover:bg-gray-50"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Hapus
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

          <TabsContent value="payment" className="space-y-6">
            {selectedOrderForPayment ? (
              <div>
                <div className="mb-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab('my-orders');
                      setSelectedOrderForPayment(null); // Clear selected order
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-4B2E05 border-gray-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Pesanan Saya
                  </Button>
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Pembayaran untuk Order: {selectedOrderForPayment.id}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p><strong>Paket:</strong> {selectedOrderForPayment.packageType}</p>
                  <p><strong>Berat:</strong> {selectedOrderForPayment.kilograms} kg</p>
                  <p className="text-xl font-bold mt-2">
                    Total: Rp {selectedOrderForPayment.totalPrice.toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Payment form component */}
                <PaymentMethod
                  orderId={selectedOrderForPayment.id}
                  orderData={{
                    id: selectedOrderForPayment.id,
                    packageName: selectedOrderForPayment.packageType, // field harus ada
                    weight: selectedOrderForPayment.kilograms, // field harus ada
                    price: selectedOrderForPayment.totalPrice, // field harus ada dan number!
                    status: selectedOrderForPayment.status,
                    paymentStatus: selectedOrderForPayment.paymentStatus,
                    createdAt: selectedOrderForPayment.orderDate
                  }}
                  onBack={() => setActiveTab('my-orders')}
                />

              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Pilih pesanan yang ingin dibayar dari tab "Pesanan Saya"</p>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </motion.div>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={(open) => {
        setIsSuccessDialogOpen(open);
        if (!open) {
          // Switch to my orders tab after closing dialog
          setActiveTab('my-orders');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-[#4B2E05] text-2xl">
                Pesanan Berhasil Dibuat!
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Pesanan Anda telah diterima dan sedang menunggu konfirmasi admin
              </DialogDescription>
            </div>
          </DialogHeader>

          {submittedOrder && (
            <div className="space-y-4">
              {/* Order ID Banner */}
              <div className="bg-gradient-to-r from-[#4B2E05] to-[#6A4B2E] text-white p-4 rounded-lg text-center">
                <p className="text-[#F5E6CA] text-sm">ID Pesanan Anda</p>
                <p className="text-2xl mt-1">{submittedOrder.id}</p>
              </div>

              {/* Order Details */}
              <Card className="bg-[#F5E6CA]/30">
                <CardContent className="p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Nama Pemesan</p>
                      <p className="text-[#4B2E05]">{submittedOrder.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Paket</p>
                      <p className="text-[#4B2E05]">{submittedOrder.packageType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Jenis Kopi</p>
                      <p className="text-[#4B2E05]">{submittedOrder.coffeeType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Jumlah</p>
                      <p className="text-[#4B2E05]">{submittedOrder.kilograms} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Harga per kg</p>
                      <p className="text-[#4B2E05]">Rp {submittedOrder.pricePerKg.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Harga</p>
                      <p className="text-[#4B2E05]">Rp {submittedOrder.totalPrice.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-gray-600 text-sm">Alamat Pengiriman</p>
                    <p className="text-[#4B2E05]">{submittedOrder.address}</p>
                  </div>

                  {submittedOrder.deliveryDate && (
                    <div>
                      <p className="text-gray-600 text-sm">Tanggal Pengantaran</p>
                      <p className="text-[#4B2E05]">{submittedOrder.deliveryDate}</p>
                    </div>
                  )}

                  {submittedOrder.notes && (
                    <div>
                      <p className="text-gray-600 text-sm">Catatan</p>
                      <p className="text-[#4B2E05]">{submittedOrder.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-5 h-5 text-yellow-700" />
                    <p className="text-yellow-800 text-sm">
                      Status: <strong>Menunggu Konfirmasi</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-[#4B2E05] mb-2">📋 Langkah Selanjutnya:</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Lakukan pembayaran untuk memulai proses sortir</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Upload bukti pembayaran untuk verifikasi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Admin akan memverifikasi pembayaran Anda</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Proses sortir akan dimulai setelah verifikasi</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setIsSuccessDialogOpen(false);
                    setActiveTab('my-orders');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Lihat Pesanan Saya
                </Button>
                <Button
                  onClick={() => {
                    if (submittedOrder) {
                      // Langsung set order untuk payment
                      setSelectedOrderForPayment(submittedOrder);
                      setIsSuccessDialogOpen(false);
                      setActiveTab('payment');
                    }
                  }}
                  className="flex-1 bg-[#56743D] hover:bg-[#56743D]/90 text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Bayar Sekarang
                </Button>


              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Dialog Konfirmasi Cancel */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-6 h-6" />
              Batalkan Pesanan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan pesanan ini?
              Pesanan yang dibatalkan akan berstatus "Dibatalkan" dan dapat dihapus nanti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setOrderToCancel(null);
              }}
            >
              Tidak, Kembali
            </Button>
            <Button
              onClick={handleCancelOrder}
              className="bg-red-500 hover:bg-red-600"
            >
              Ya, Batalkan Pesanan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Konfirmasi Delete */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              Hapus Pesanan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pesanan ini dari daftar?
              Data pesanan akan dihapus permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setOrderToDelete(null);
              }}
            >
              Tidak, Kembali
            </Button>
            <Button
              onClick={handleDeleteOrder}
              className="bg-red-500 hover:bg-red-600"
            >
              Ya, Hapus Pesanan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Warning Sebelum Bayar */}
      <AlertDialog open={showPaymentWarning} onOpenChange={setShowPaymentWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#56743D]">
              <AlertCircle className="w-6 h-6" />
              Perhatian: Pembayaran
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">
                  Setelah Anda melakukan pembayaran, pesanan TIDAK DAPAT dibatalkan.
                </p>
                <p>
                  Pastikan semua detail pesanan sudah benar sebelum melanjutkan ke pembayaran.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentWarning(false);
                setOrderToCancel(null);
              }}
            >
              Periksa Lagi
            </Button>
            <Button
              onClick={confirmPayment}
              className="bg-[#56743D] hover:bg-[#56743D]/90"
            >
              Ya, Lanjut Bayar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
