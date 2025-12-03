import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Upload, Copy, Check, ArrowLeft, AlertCircle, CreditCard, Wallet, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { orderAPI, paymentAPI } from '../services/api';
import { uploadPaymentProof } from '../services/supabase'; // ✅ Import helper function


interface Order {
  id: string;
  userId?: string;
  packageName: string;
  weight: number;
  price: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
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


interface PaymentMethodProps {
  orderId: string;
  orderData?: Order;
  onBack: () => void;
}


const paymentMethods = [
  {
    category: 'Transfer Bank',
    icon: Building2,
    methods: [
      { id: 'bca', name: 'BCA', accountNumber: '1234567890', accountName: 'PiKopi Indonesia' },
      { id: 'bni', name: 'BNI', accountNumber: '0987654321', accountName: 'PiKopi Indonesia' },
      { id: 'mandiri', name: 'Mandiri', accountNumber: '1122334455', accountName: 'PiKopi Indonesia' },
    ]
  },
  {
    category: 'E-Wallet',
    icon: Wallet,
    methods: [
      { id: 'gopay', name: 'GoPay', accountNumber: '081234567890', accountName: 'PiKopi' },
      { id: 'ovo', name: 'OVO', accountNumber: '081234567890', accountName: 'PiKopi' },
      { id: 'dana', name: 'DANA', accountNumber: '081234567890', accountName: 'PiKopi' },
    ]
  }
];


export default function PaymentMethod({ orderId, orderData, onBack }: PaymentMethodProps) {
  const [order, setOrder] = useState<Order | null>(orderData || null);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [accountName, setAccountName] = useState('');
  const [proofImage, setProofImage] = useState<string>('');
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedAccount, setCopiedAccount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [existingPayment, setExistingPayment] = useState<Payment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);


  useEffect(() => {
    console.log('💳 PaymentMethod mounted with orderId:', orderId);
    console.log('📦 Order data from props:', orderData);

    // Set order data
    if (orderData) {
      console.log('✅ Using order data from props');
      setOrder(orderData);
    } else {
      console.log('⚠️ No order data from props, searching localStorage...');
      let orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      let foundOrder = orders.find((o: Order) => o.id === orderId);

      if (foundOrder) {
        console.log('✅ Found order in userOrders:', foundOrder);
      } else {
        console.log('❌ Not found in userOrders, trying pilahkopi_orders...');
        orders = JSON.parse(localStorage.getItem('pilahkopi_orders') || '[]');
        foundOrder = orders.find((o: Order) => o.id === orderId);

        if (foundOrder) {
          console.log('✅ Found order in pilahkopi_orders:', foundOrder);
        } else {
          console.error('❌ Order not found in any localStorage key!');
        }
      }

      setOrder(foundOrder || null);
    }

    // ✅ Fetch existing payment from backend API
    const fetchExistingPayment = async () => {
      try {
        console.log('🔍 Fetching payment  from backend for order:', orderId);
        const paymentResponse: any = await paymentAPI.getPaymentByOrder(orderId);

        if (paymentResponse.success && paymentResponse.data) {
          const payment = paymentResponse.data;
          console.log('💰 Found existing payment from backend:', payment);
          setExistingPayment(payment);
          setSelectedMethod(payment.method);
          setAccountName(payment.accountName);
          setProofImage(payment.proofImage);
          setNotes(payment.notes || '');
        } else {
          console.log('🆕 No existing payment found, resetting form');
          resetForm();
        }
      } catch (error: any) {
        // If 404, it means no payment exists yet - this is normal
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          console.log('🆕 No payment found for this order (404), resetting form');
          resetForm();
        } else {
          console.error('❌ Error fetching payment:', error);
          // On error, still reset to avoid showing stale data
          resetForm();
        }
      }
    };

    const resetForm = () => {
      setExistingPayment(null);
      setSelectedMethod('');
      setAccountName('');
      setProofImage('');
      setNotes('');
      setProofImageFile(null);
      setFileName('');
    };

    fetchExistingPayment();
  }, [orderId, orderData]);


  const getMethodDetails = () => {
    for (const category of paymentMethods) {
      const method = category.methods.find(m => m.id === selectedMethod);
      if (method) return method;
    }
    return null;
  };


  const handleCopyAccount = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedAccount(accountNumber);
    setTimeout(() => setCopiedAccount(''), 2000);
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file terlalu besar. Maksimal 5MB');
        return;
      }

      setFileName(file.name);
      setProofImageFile(file);

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };


  // ✅ UPDATED: Gunakan helper function dari supabase.ts
  const handleSubmit = async () => {
    if (!selectedMethod || !accountName || !proofImage || !order || !proofImageFile) return;


    const methodDetails = getMethodDetails();
    if (!methodDetails) return;


    setIsSubmitting(true);
    setError('');
    setUploadProgress(0);


    try {
      // ✅ Step 1: Upload file ke Supabase menggunakan helper function
      console.log('📸 Step 1: Uploading file to Supabase...');
      setUploadProgress(30);

      const supabaseUrl = await uploadPaymentProof(proofImageFile, order.id);

      if (!supabaseUrl) {
        throw new Error('Gagal mendapatkan URL foto dari Supabase');
      }

      console.log('✅ Supabase upload successful:', supabaseUrl);
      setUploadProgress(60);


      // ✅ Step 2: Kirim data pembayaran ke backend
      console.log('💾 Step 2: Sending payment data to backend...');

      const paymentData = {
        orderId: order.id,
        method: methodDetails.id,
        accountName,
        amount: order.price,
        proofImage: supabaseUrl, // ✅ URL dari Supabase
        notes: notes || null,
      };

      console.log('📤 Sending to backend:', paymentData);

      const response = await orderAPI.createPayment(paymentData);

      console.log('✅ Backend response:', response);

      setUploadProgress(80);


      if (response.success) {
        // Simpan juga ke localStorage sebagai backup
        const payment: Payment = {
          id: response.data?.id || `PAY-${Date.now()}`,
          orderId: order.id,
          method: paymentData.method,
          accountName: paymentData.accountName,
          amount: paymentData.amount,
          proofImage: supabaseUrl,
          status: 'pending',
          uploadedAt: response.data?.uploadedAt || new Date().toISOString(),
          notes: paymentData.notes || undefined,
        };

        const payments = JSON.parse(localStorage.getItem('pilahkopi_payments') || '[]');
        const existingIndex = payments.findIndex((p: Payment) => p.orderId === orderId);

        if (existingIndex !== -1) {
          payments[existingIndex] = payment;
        } else {
          payments.push(payment);
        }

        localStorage.setItem('pilahkopi_payments', JSON.stringify(payments));

        // Update order payment status
        ['userOrders', 'pilahkopi_orders'].forEach(key => {
          const orders = JSON.parse(localStorage.getItem(key) || '[]');
          const orderIndex = orders.findIndex((o: Order) => o.id === orderId);
          if (orderIndex !== -1) {
            orders[orderIndex].paymentStatus = 'pending';
            localStorage.setItem(key, JSON.stringify(orders));
          }
        });

        setUploadProgress(100);
        setTimeout(() => {
          setShowSuccess(true);
        }, 500);
      } else {
        throw new Error(response.message || 'Gagal mengirim bukti pembayaran');
      }
    } catch (err: any) {
      console.error('❌ Error submitting payment:', err);
      setError(err.message || 'Gagal mengirim bukti pembayaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };


  const handleSuccessClose = () => {
    setShowSuccess(false);
    onBack();
  };



  if (!order || typeof order.price !== 'number') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Pesanan tidak ditemukan atau tidak valid</p>
          <p className="text-sm text-gray-600 mb-4">
            Order ID: {orderId}
          </p>
          <Button onClick={onBack} className="bg-[#56743D] hover:bg-[#56743D]/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* ✅ Error Alert */}
        {error && (
          <Card className="border-2 border-red-500 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Gagal Mengirim Pembayaran</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* ✅ Upload Progress Bar */}
        {isSubmitting && uploadProgress > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-sm font-semibold mb-2">Mengunggah: {uploadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#56743D] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}


        <Card className="border-2 border-[#4B2E05]/20">
          <CardHeader className="bg-gradient-to-r from-[#4B2E05] to-[#56743D] text-white">
            <CardTitle>Detail Pesanan</CardTitle>
            <CardDescription className="text-[#F5E6CA]">ID: {order.id}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Paket Layanan</p>
                <p className="font-semibold">{order.packageName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Berat</p>
                <p className="font-semibold">{order.weight} kg</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Total Pembayaran</p>
                <p className="text-3xl font-bold text-[#4B2E05]">
                  Rp {(order.price ?? 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        {existingPayment && existingPayment.status === 'verified' && (
          <Card className="border-2 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-green-600">
                <Check className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Pembayaran Terverifikasi</p>
                  <p className="text-sm">Pembayaran Anda telah dikonfirmasi oleh admin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {existingPayment && existingPayment.status === 'rejected' && (
          <Card className="border-2 border-red-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <AlertCircle className="w-6 h-6" />
                <p className="font-semibold">Pembayaran Ditolak</p>
              </div>
              {existingPayment.rejectionReason && (
                <p className="text-sm text-gray-600 ml-9">
                  Alasan: {existingPayment.rejectionReason}
                </p>
              )}
              <p className="text-sm text-gray-600 ml-9 mt-1">
                Silakan upload ulang bukti pembayaran yang benar
              </p>
            </CardContent>
          </Card>
        )}


        {existingPayment && existingPayment.status === 'pending' && (
          <Card className="border-2 border-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-yellow-600">
                <AlertCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Menunggu Verifikasi</p>
                  <p className="text-sm">Bukti pembayaran Anda sedang ditinjau oleh admin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        <Card className="border-2 border-[#4B2E05]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#4B2E05]">
              <CreditCard className="w-6 h-6" />
              Pilih Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              {paymentMethods.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.category} className="space-y-3">
                    <div className="flex items-center gap-2 text-[#4B2E05] font-semibold">
                      <Icon className="w-5 h-5" />
                      <p>{category.category}</p>
                    </div>
                    <div className="grid gap-3 ml-7">
                      {category.methods.map((method) => (
                        <div
                          key={method.id}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedMethod === method.id
                            ? 'border-[#56743D] bg-[#56743D]/5'
                            : 'border-gray-200 hover:border-[#56743D]/50'
                            }`}
                          onClick={() => setSelectedMethod(method.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <RadioGroupItem value={method.id} id={method.id} />
                              <div className="flex-1">
                                <Label htmlFor={method.id} className="cursor-pointer font-semibold">
                                  {method.name}
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">{method.accountName}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                                    {method.accountNumber}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyAccount(method.accountNumber);
                                    }}
                                    className="h-7 px-2"
                                  >
                                    {copiedAccount === method.accountNumber ? (
                                      <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>


            {selectedMethod && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4 border-t"
              >
                <div>
                  <Label htmlFor="accountName">Nama Pengirim *</Label>
                  <Input
                    id="accountName"
                    placeholder="Masukkan nama sesuai rekening pengirim"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>


                <div>
                  <Label htmlFor="proof">Upload Bukti Pembayaran *</Label>
                  <div className="mt-1">
                    <Input
                      id="proof"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor="proof"
                      className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-8 transition-colors ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#56743D]'
                        }`}
                    >
                      {proofImage ? (
                        <div className="text-center">
                          <img
                            src={proofImage}
                            alt="Bukti pembayaran"
                            className="max-h-48 mx-auto mb-2 rounded"
                          />
                          <p className="text-sm text-gray-600">{fileName}</p>
                          {!isSubmitting && (
                            <p className="text-xs text-[#56743D] mt-1">Klik untuk ganti gambar</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Klik untuk upload bukti pembayaran
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (Max 5MB)</p>
                        </div>
                      )}
                    </Label>
                  </div>
                </div>


                <div>
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Tambahkan catatan jika diperlukan"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>


                {/* ✅ Button dengan loading state */}
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedMethod || !accountName || !proofImage || isSubmitting}
                  className="w-full bg-[#56743D] hover:bg-[#56743D]/90 text-white"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim...</span>
                    </div>
                  ) : (
                    existingPayment ? 'Update Bukti Pembayaran' : 'Kirim Bukti Pembayaran'
                  )}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>


      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-6 h-6" />
              Bukti Pembayaran Berhasil Dikirim
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bukti pembayaran Anda telah berhasil dikirim ke Supabase dan sedang menunggu verifikasi dari admin.
              Anda akan menerima notifikasi setelah pembayaran diverifikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleSuccessClose}
              className="bg-[#56743D] hover:bg-[#56743D]/90"
            >
              Kembali ke Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
