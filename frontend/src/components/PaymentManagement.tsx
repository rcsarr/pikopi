import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Check, X, Eye, Search, Filter, CreditCard, Clock, CheckCircle, XCircle, Calendar, User, Package } from 'lucide-react';
import { motion } from 'motion/react';

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

interface Order {
  id: string;
  userId: string;
  userName?: string;
  packageName: string;
  weight: number;
  price: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, statusFilter]);

  const loadData = () => {
    const paymentsData = JSON.parse(localStorage.getItem('pilahkopi_payments') || '[]');
    const ordersData = JSON.parse(localStorage.getItem('pilahkopi_orders') || '[]');
    const usersData = JSON.parse(localStorage.getItem('pilahkopi_users') || '[]');

    // Enrich orders with user names
    const enrichedOrders = ordersData.map((order: Order) => {
      const user = usersData.find((u: any) => u.email === order.userId);
      return {
        ...order,
        userName: user ? user.fullName : order.userId,
      };
    });

    setPayments(paymentsData.sort((a: Payment, b: Payment) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    ));
    setOrders(enrichedOrders);
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.accountName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const getOrder = (orderId: string) => {
    return orders.find(o => o.id === orderId);
  };

  const handleViewDetail = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailDialog(true);
  };

  const handleVerifyClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowVerifyDialog(true);
  };

  const handleRejectClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleVerify = () => {
    if (!selectedPayment) return;

    const updatedPayments = payments.map(p => 
      p.id === selectedPayment.id
        ? { ...p, status: 'verified' as const, verifiedAt: new Date().toISOString() }
        : p
    );

    localStorage.setItem('pilahkopi_payments', JSON.stringify(updatedPayments));

    // Update order status
    const ordersData = JSON.parse(localStorage.getItem('pilahkopi_orders') || '[]');
    const updatedOrders = ordersData.map((o: Order) => 
      o.id === selectedPayment.orderId
        ? { ...o, paymentStatus: 'verified', status: 'processing' }
        : o
    );
    localStorage.setItem('pilahkopi_orders', JSON.stringify(updatedOrders));

    setPayments(updatedPayments);
    setShowVerifyDialog(false);
    setShowDetailDialog(false);
    setSuccessMessage('Pembayaran berhasil diverifikasi');
    setShowSuccessAlert(true);
    loadData();
  };

  const handleReject = () => {
    if (!selectedPayment || !rejectionReason.trim()) return;

    const updatedPayments = payments.map(p => 
      p.id === selectedPayment.id
        ? { ...p, status: 'rejected' as const, rejectionReason, verifiedAt: new Date().toISOString() }
        : p
    );

    localStorage.setItem('pilahkopi_payments', JSON.stringify(updatedPayments));

    // Update order status
    const ordersData = JSON.parse(localStorage.getItem('pilahkopi_orders') || '[]');
    const updatedOrders = ordersData.map((o: Order) => 
      o.id === selectedPayment.orderId
        ? { ...o, paymentStatus: 'rejected' }
        : o
    );
    localStorage.setItem('pilahkopi_orders', JSON.stringify(updatedOrders));

    setPayments(updatedPayments);
    setShowRejectDialog(false);
    setShowDetailDialog(false);
    setSuccessMessage('Pembayaran berhasil ditolak');
    setShowSuccessAlert(true);
    loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Terverifikasi</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    verified: payments.filter(p => p.status === 'verified').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#4B2E05]">Manajemen Pembayaran</h1>
            <p className="text-gray-600">Kelola dan verifikasi pembayaran pelanggan</p>
          </div>
          <CreditCard className="w-12 h-12 text-[#56743D]" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="border-2 border-[#4B2E05]/20">
          <CardHeader className="pb-3">
            <CardDescription>Total Pembayaran</CardDescription>
            <CardTitle className="text-3xl text-[#4B2E05]">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Menunggu Verifikasi</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-green-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Terverifikasi</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.verified}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-red-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Ditolak</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-2 border-[#4B2E05]/20">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-[#4B2E05]">Daftar Pembayaran</CardTitle>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari ID pembayaran/pesanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="verified">Terverifikasi</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pembayaran</TableHead>
                    <TableHead>ID Pesanan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tanggal Upload</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Tidak ada data pembayaran
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => {
                      const order = getOrder(payment.orderId);
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                          <TableCell className="font-mono text-sm">{payment.orderId}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <p>{order?.userName || 'Unknown'}</p>
                                <p className="text-xs text-gray-500">{payment.accountName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{payment.method.split(' - ')[0]}</p>
                            <p className="text-xs text-gray-500 font-mono">
                              {payment.method.split(' - ')[1]}
                            </p>
                          </TableCell>
                          <TableCell>Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {new Date(payment.uploadedAt).toLocaleDateString('id-ID')}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.uploadedAt).toLocaleTimeString('id-ID')}
                            </p>
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetail(payment)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {payment.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleVerifyClick(payment)}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectClick(payment)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
            <DialogDescription>ID: {selectedPayment?.id}</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">ID Pesanan</Label>
                  <p className="font-mono">{selectedPayment.orderId}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-600">Nama Pengirim</Label>
                  <p>{selectedPayment.accountName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Metode Pembayaran</Label>
                  <p>{selectedPayment.method}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Jumlah</Label>
                  <p className="text-xl text-[#4B2E05]">
                    Rp {selectedPayment.amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Tanggal Upload</Label>
                  <p>{new Date(selectedPayment.uploadedAt).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {selectedPayment.notes && (
                <div>
                  <Label className="text-gray-600">Catatan</Label>
                  <p className="bg-gray-50 p-3 rounded mt-1">{selectedPayment.notes}</p>
                </div>
              )}

              {selectedPayment.rejectionReason && (
                <div>
                  <Label className="text-red-600">Alasan Penolakan</Label>
                  <p className="bg-red-50 p-3 rounded mt-1 text-red-700">
                    {selectedPayment.rejectionReason}
                  </p>
                </div>
              )}

              {selectedPayment.verifiedAt && (
                <div>
                  <Label className="text-gray-600">Tanggal Verifikasi</Label>
                  <p>{new Date(selectedPayment.verifiedAt).toLocaleString('id-ID')}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-600">Bukti Pembayaran</Label>
                <div className="mt-2 border-2 border-gray-200 rounded-lg p-4">
                  <img
                    src={selectedPayment.proofImage}
                    alt="Bukti pembayaran"
                    className="max-w-full max-h-96 mx-auto rounded"
                  />
                </div>
              </div>

              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleVerifyClick(selectedPayment);
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Verifikasi Pembayaran
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleRejectClick(selectedPayment);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Tolak Pembayaran
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verifikasi Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin memverifikasi pembayaran ini? Setelah diverifikasi, pesanan akan
              diproses dan status tidak dapat diubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerify}
              className="bg-green-600 hover:bg-green-700"
            >
              Ya, Verifikasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              Berikan alasan penolakan pembayaran ini agar pelanggan dapat memperbaiki bukti pembayaran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Contoh: Bukti transfer tidak jelas, nominal tidak sesuai, rekening pengirim tidak valid, dll."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Tolak Pembayaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Alert */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Berhasil
            </AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-[#56743D] hover:bg-[#56743D]/90">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
