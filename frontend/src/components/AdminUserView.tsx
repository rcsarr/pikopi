import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft,
  Coffee,
  CheckCircle,
  XCircle,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface Order {
  id: string;
  coffeeType: string;
  kilograms: number;
  totalPrice: number;
  orderDate: string;
  deliveryDate: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  notes: string;
}

interface UserData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userCompany: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  orders: Order[];
}

interface AdminUserViewProps {
  userData: UserData;
  onBack: () => void;
}

export default function AdminUserView({ userData, onBack }: AdminUserViewProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('all');

  // Filter data based on selected order ID
  const filteredOrders = selectedOrderId === 'all' 
    ? userData.orders 
    : userData.orders.filter(order => order.id === selectedOrderId);

  // Calculate statistics based on filtered orders
  const stats = {
    totalOrders: filteredOrders.length,
    totalKg: filteredOrders.reduce((sum, order) => sum + order.kilograms, 0),
    totalSpent: filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0),
    completedOrders: filteredOrders.filter(o => o.status === 'completed').length
  };

  // Status distribution
  const statusCounts = {
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    processing: filteredOrders.filter(o => o.status === 'processing').length,
    completed: filteredOrders.filter(o => o.status === 'completed').length,
    cancelled: filteredOrders.filter(o => o.status === 'cancelled').length
  };

  const pieData = [
    { name: 'Selesai', value: statusCounts.completed, color: '#4CAF50' },
    { name: 'Diproses', value: statusCounts.processing, color: '#2196F3' },
    { name: 'Menunggu', value: statusCounts.pending, color: '#FFA500' },
    { name: 'Dibatalkan', value: statusCounts.cancelled, color: '#F44336' }
  ].filter(item => item.value > 0);

  // Coffee type distribution
  const coffeeTypeData = filteredOrders.reduce((acc, order) => {
    if (!acc[order.coffeeType]) {
      acc[order.coffeeType] = 0;
    }
    acc[order.coffeeType] += order.kilograms;
    return acc;
  }, {} as Record<string, number>);

  const coffeeData = Object.entries(coffeeTypeData).map(([type, kg]) => ({
    name: type,
    value: kg
  }));

  // Revenue over time
  const revenueByDate = filteredOrders.reduce((acc, order) => {
    const date = order.orderDate;
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += order.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  const revenueData = Object.entries(revenueByDate).map(([date, revenue]) => ({
    date,
    revenue: revenue / 1000
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Orders timeline
  const ordersTimeline = filteredOrders.map(order => ({
    date: order.orderDate,
    orders: 1
  })).reduce((acc, item) => {
    const existing = acc.find(a => a.date === item.date);
    if (existing) {
      existing.orders += 1;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as { date: string; orders: number }[]).sort((a, b) => a.date.localeCompare(b.date));

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', className: 'bg-orange-100 text-orange-700' },
      processing: { label: 'Diproses', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Selesai', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-700' }
    };
    return statusConfig[status as keyof typeof statusConfig];
  };

  const COLORS = ['#4CAF50', '#2196F3', '#FFA500', '#F44336'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
          <div>
            <h2 className="text-[#4B2E05] mb-1">Dashboard Pengguna - {userData.userName}</h2>
            <p className="text-gray-600">Kelola dan pantau aktivitas pengguna berdasarkan ID pesanan</p>
          </div>
        </div>

        <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter ID Pesanan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Semua Pesanan
              </span>
            </SelectItem>
            {userData.orders.map(order => (
              <SelectItem key={order.id} value={order.id}>
                {order.id} - {order.coffeeType} ({order.kilograms}kg)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Info Card */}
      <Card className="bg-gradient-to-r from-[#4B2E05] to-[#6A4B2E] text-white border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 border-4 border-white">
                <AvatarFallback className="bg-white text-[#4B2E05]">
                  {userData.userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h3 className="text-white">{userData.userName}</h3>
                <div className="flex items-center gap-4 text-[#F5E6CA]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{userData.userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{userData.userPhone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#F5E6CA]">
                  <Coffee className="w-4 h-4" />
                  <span>{userData.userCompany}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#F5E6CA] mb-1">Bergabung sejak</p>
              <div className="text-white">{userData.joinDate}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">
                  {selectedOrderId === 'all' ? 'Total Pesanan' : 'Pesanan Terpilih'}
                </p>
                <div className="text-[#4B2E05]">{stats.totalOrders}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Kilogram</p>
                <div className="text-[#4B2E05]">{stats.totalKg} kg</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Coffee className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Pengeluaran</p>
                <div className="text-[#4B2E05]">Rp {stats.totalSpent.toLocaleString('id-ID')}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Pesanan Selesai</p>
                <div className="text-[#4B2E05]">{stats.completedOrders}</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Riwayat Pesanan</TabsTrigger>
          <TabsTrigger value="analytics">Analitik Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">
                  Distribusi Status Pesanan
                  {selectedOrderId !== 'all' && (
                    <Badge className="ml-2 bg-blue-600">{selectedOrderId}</Badge>
                  )}
                </CardTitle>
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
                    Tidak ada data untuk ditampilkan
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coffee Type Distribution */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">
                  Distribusi Jenis Kopi
                  {selectedOrderId !== 'all' && (
                    <Badge className="ml-2 bg-blue-600">{selectedOrderId}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {coffeeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={coffeeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#6A4B2E" name="Kilogram" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    Tidak ada data untuk ditampilkan
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">
                  Tren Pengeluaran
                  {selectedOrderId !== 'all' && (
                    <Badge className="ml-2 bg-blue-600">{selectedOrderId}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `Rp ${Number(value) * 1000}`} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#4C7C2E" strokeWidth={2} name="Pengeluaran (Ribu)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    Tidak ada data untuk ditampilkan
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orders Timeline */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">
                  Timeline Pesanan
                  {selectedOrderId !== 'all' && (
                    <Badge className="ml-2 bg-blue-600">{selectedOrderId}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersTimeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ordersTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="orders" fill="#2196F3" name="Jumlah Pesanan" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    Tidak ada data untuk ditampilkan
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#4B2E05]">
                Riwayat Pesanan Pengguna
                {selectedOrderId !== 'all' && (
                  <Badge className="ml-2 bg-blue-600">{selectedOrderId}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pesanan</TableHead>
                    <TableHead>Jenis Kopi</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pengiriman</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const statusConfig = getStatusBadge(order.status);
                    return (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="text-[#4B2E05]">{order.id}</TableCell>
                        <TableCell>{order.coffeeType}</TableCell>
                        <TableCell>{order.kilograms} kg</TableCell>
                        <TableCell>Rp {order.totalPrice.toLocaleString('id-ID')}</TableCell>
                        <TableCell>{order.orderDate}</TableCell>
                        <TableCell>{order.deliveryDate}</TableCell>
                        <TableCell>
                          <Badge className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-[#4B2E05] mb-2">Tidak Ada Pesanan</h3>
                  <p className="text-gray-600">Tidak ada pesanan yang sesuai dengan filter</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">Breakdown Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-700">Menunggu</span>
                  </div>
                  <div className="text-orange-600">{statusCounts.pending} pesanan</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-700">Diproses</span>
                  </div>
                  <div className="text-blue-600">{statusCounts.processing} pesanan</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-700">Selesai</span>
                  </div>
                  <div className="text-green-600">{statusCounts.completed} pesanan</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-700">Dibatalkan</span>
                  </div>
                  <div className="text-red-600">{statusCounts.cancelled} pesanan</div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#4B2E05]">Ringkasan Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Rata-rata per Pesanan</p>
                  <div className="text-[#4B2E05]">
                    Rp {stats.totalOrders > 0 ? (stats.totalSpent / stats.totalOrders).toLocaleString('id-ID') : 0}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Rata-rata Kilogram</p>
                  <div className="text-[#4B2E05]">
                    {stats.totalOrders > 0 ? (stats.totalKg / stats.totalOrders).toFixed(1) : 0} kg
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Success Rate</p>
                  <div className="text-[#4B2E05]">
                    {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Jenis Kopi Favorit</p>
                  <div className="text-[#4B2E05]">
                    {coffeeData.length > 0 ? coffeeData.sort((a, b) => b.value - a.value)[0].name : '-'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
