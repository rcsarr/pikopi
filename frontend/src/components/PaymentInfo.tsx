import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Building2, Wallet, CreditCard, Upload, Check, Clock } from 'lucide-react';

export default function PaymentInfo() {
  const paymentMethods = [
    {
      category: 'Transfer Bank',
      icon: Building2,
      methods: [
        { name: 'BCA', account: '1234567890', holder: 'PilahKopi Indonesia' },
        { name: 'BNI', account: '0987654321', holder: 'PilahKopi Indonesia' },
        { name: 'Mandiri', account: '1122334455', holder: 'PilahKopi Indonesia' },
      ]
    },
    {
      category: 'E-Wallet',
      icon: Wallet,
      methods: [
        { name: 'GoPay', account: '081234567890', holder: 'PilahKopi' },
        { name: 'OVO', account: '081234567890', holder: 'PilahKopi' },
        { name: 'DANA', account: '081234567890', holder: 'PilahKopi' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-[#4B2E05] mb-2">Metode Pembayaran</h2>
        <p className="text-gray-600">Pilih metode pembayaran yang sesuai untuk Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentMethods.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.category} className="border-2 border-[#4B2E05]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#4B2E05]">
                  <Icon className="w-5 h-5" />
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.methods.map((method, idx) => (
                  <div key={idx} className="p-3 bg-[#F5E6CA]/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#4B2E05]">{method.name}</p>
                      <Badge className="bg-[#56743D]">Aktif</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{method.holder}</p>
                    <p className="text-sm font-mono mt-1">{method.account}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-2 border-blue-500/30 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-[#4B2E05] flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Cara Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#56743D] text-white flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-[#4B2E05]">Buat Pesanan</p>
                <p className="text-sm text-gray-600">Pesan jasa sortir kopi melalui menu "Pesan Jasa"</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#56743D] text-white flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-[#4B2E05]">Pilih Metode Pembayaran</p>
                <p className="text-sm text-gray-600">Pilih transfer bank atau e-wallet yang tersedia</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#56743D] text-white flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-[#4B2E05] flex items-center gap-2">
                  Lakukan Transfer
                  <Clock className="w-4 h-4 text-gray-500" />
                </p>
                <p className="text-sm text-gray-600">Transfer ke nomor rekening/HP yang dipilih</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#56743D] text-white flex items-center justify-center flex-shrink-0">
                4
              </div>
              <div>
                <p className="text-[#4B2E05] flex items-center gap-2">
                  Upload Bukti Transfer
                  <Upload className="w-4 h-4 text-gray-500" />
                </p>
                <p className="text-sm text-gray-600">Foto/screenshot bukti transfer Anda</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[#4B2E05]">Tunggu Verifikasi</p>
                <p className="text-sm text-gray-600">Admin akan memverifikasi pembayaran Anda maksimal 1x24 jam</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-yellow-500/30 bg-yellow-50">
        <CardContent className="p-4">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Catatan Penting:</strong> Pastikan nominal transfer sesuai dengan total pesanan dan simpan bukti transfer sampai pesanan selesai diproses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
