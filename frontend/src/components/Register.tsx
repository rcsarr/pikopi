import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Coffee,
  Mail,
  Lock,
  User,
  Building,
  Eye,
  EyeOff,
  Phone,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import logoImage from "figma:asset/4dd15d3bf546fd413c470482994e9b74ecf4af1b.png";
import { authAPI } from "../services/api";

interface RegisterProps {
  onNavigateToLogin: () => void;
  onNavigateToUserDashboard: () => void;
  onNavigateToAdminDashboard: () => void;
  onNavigateToLanding: () => void;
}

export default function Register({
  onNavigateToLogin,
  onNavigateToUserDashboard,
  onNavigateToAdminDashboard,
  onNavigateToLanding,
}: RegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null); // Added error state
  const [success, setSuccess] = useState<string | null>(null); // Added success state
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Nama, email, dan password harus diisi");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Format email tidak valid");
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError("Password harus minimal 8 karakter");
      return;
    }

    if (formData.password.length > 128) {
      setError("Password terlalu panjang (maksimal 128 karakter)");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak sesuai");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        companyName: formData.company.trim() || undefined,
        role: "user",
      });

      if (response.success) {
        setSuccess("Registrasi berhasil! Silakan login dengan akun Anda.");
        // Clear form
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          password: "",
          confirmPassword: "",
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          onNavigateToLogin();
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registrasi gagal. Silakan coba lagi.";

      // Check for network errors
      if (errorMessage.includes("Tidak dapat terhubung")) {
        setError(
          "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B2E05] to-[#3C2409] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block text-[#F5E6CA] space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <img src={logoImage} alt="PiKopi Logo" className="h-20 w-auto" />
            <div>
              <h1 className="text-[#F5E6CA]">PiKopi</h1>
              <p className="text-[#F5E6CA]/70">
                Computer Vision Sorting System
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-[#F5E6CA]">Bergabunglah Dengan Kami!</h2>
            <p className="text-[#F5E6CA]/80">
              Daftar sekarang untuk mengakses sistem sortir biji kopi berbasis
              AI dan tingkatkan kualitas produk kopi Anda.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1668923570518-9eb1f838f19b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmFiaWNhJTIwY29mZmVlJTIwYmVhbnN8ZW58MXx8fHwxNzYwNTk4MTgzfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Coffee beans"
              className="w-full h-64 object-cover"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#56743D] flex items-center justify-center">
                <span className="text-white">✓</span>
              </div>
              <p className="text-[#F5E6CA]/80">Akurasi sortir hingga 95%</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#56743D] flex items-center justify-center">
                <span className="text-white">✓</span>
              </div>
              <p className="text-[#F5E6CA]/80">
                Dashboard monitoring real-time
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#56743D] flex items-center justify-center">
                <span className="text-white">✓</span>
              </div>
              <p className="text-[#F5E6CA]/80">Analisis data komprehensif</p>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <Card className="bg-white shadow-2xl border-0">
          <CardHeader className="space-y-2 pb-6">
            <div className="md:hidden flex items-center gap-2 mb-4">
              <img src={logoImage} alt="PiKopi Logo" className="h-14 w-auto" />
            </div>
            <CardTitle className="text-[#4B2E05]">Buat Akun Baru</CardTitle>
            <CardDescription>
              Lengkapi formulir di bawah untuk membuat akun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@perusahaan.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="08XX-XXXX-XXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Perusahaan</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Nama perusahaan"
                      value={formData.company}
                      onChange={handleChange}
                      className="pl-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Masukkan ulang password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 mt-1 rounded border-gray-300 text-[#56743D] focus:ring-[#56743D]"
                  required
                />
                <label htmlFor="terms" className="text-gray-600">
                  Saya setuju dengan{" "}
                  <a href="#" className="text-[#56743D] hover:text-[#4C7C2E]">
                    syarat dan ketentuan
                  </a>{" "}
                  yang berlaku
                </label>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#56743D] hover:bg-[#4C7C2E] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Mendaftar..." : "Daftar Sekarang"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-gray-500">atau</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600">
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-[#56743D] hover:text-[#4C7C2E]"
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLanding}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Kembali ke halaman utama
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
