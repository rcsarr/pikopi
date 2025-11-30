import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Coffee, User, Shield, Check } from 'lucide-react';
import logoImage from 'figma:asset/4dd15d3bf546fd413c470482994e9b74ecf4af1b.png';

export default function RoleInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B2E05] to-[#3C2409] p-6 flex items-center justify-center">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex flex-col items-center justify-center gap-3 mb-4">
            <img 
              src={logoImage} 
              alt="PiKopi Logo" 
              className="h-20 w-auto"
            />
            <h1 className="text-[#F5E6CA]">PiKopi</h1>
          </div>
          <h2 className="text-[#F5E6CA] mb-2">Sistem Sortir Kopi Berbasis AI</h2>
          <p className="text-[#F5E6CA]/70">Pilih role untuk melihat perbedaan akses</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* User Role */}
          <Card className="bg-white border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-t-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <CardTitle className="text-white">Pengguna</CardTitle>
              </div>
              <p className="text-white/80">Role untuk UMKM dan pengguna biasa</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-[#4B2E05]">Fitur Akses:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dashboard personal hasil sortir</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Melihat hasil sortir kopi milik sendiri</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Galeri cacat dengan fitur lapor kesalahan</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Riwayat batch personal</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Edit profil dan pengaturan</span>
                </li>
              </ul>

              <div className="pt-4 border-t">
                <p className="text-gray-600">Cocok untuk:</p>
                <p className="text-[#4B2E05]">Pemilik UMKM Kopi, Petani Kopi</p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Role */}
          <Card className="bg-white border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-t-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <CardTitle className="text-white">Administrator</CardTitle>
              </div>
              <p className="text-white/80">Role untuk pengelola sistem</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-[#4B2E05]">Fitur Akses:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dashboard sistem keseluruhan</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Melihat semua data sortir dari semua user</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Galeri cacat lengkap dengan kontrol penuh</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Manajemen pengguna dan akses sistem</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Pengaturan sistem dan konfigurasi AI</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Laporan analytics dan monitoring</span>
                </li>
              </ul>

              <div className="pt-4 border-t">
                <p className="text-gray-600">Cocok untuk:</p>
                <p className="text-[#4B2E05]">Tim Teknis, System Administrator</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-white/10 border-[#F5E6CA]/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-[#F5E6CA] mb-2">Perbedaan Utama</h3>
              <div className="grid md:grid-cols-3 gap-6 text-[#F5E6CA]/80">
                <div>
                  <div className="text-[#F5E6CA]">Scope Data</div>
                  <p>User: Data pribadi</p>
                  <p>Admin: Semua data</p>
                </div>
                <div>
                  <div className="text-[#F5E6CA]">Kontrol Sistem</div>
                  <p>User: Terbatas</p>
                  <p>Admin: Penuh</p>
                </div>
                <div>
                  <div className="text-[#F5E6CA]">UI Design</div>
                  <p>User: Horizontal nav</p>
                  <p>Admin: Sidebar nav</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
