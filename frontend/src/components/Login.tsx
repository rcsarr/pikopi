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
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import logoImage from "figma:asset/4dd15d3bf546fd413c470482994e9b74ecf4af1b.png";
import { authAPI } from "../services/api";

interface LoginProps {
  onNavigateToRegister: () => void;
  onNavigateToUserDashboard: () => void;
  onNavigateToAdminDashboard: () => void;
  onNavigateToLanding: () => void;
  onNavigateToForgotPassword: () => void;
}

export default function Login({
  onNavigateToRegister,
  onNavigateToUserDashboard,
  onNavigateToAdminDashboard,
  onNavigateToLanding,
  onNavigateToForgotPassword,
}: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // Added error state
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email dan password harus diisi");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Format email tidak valid");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login(
        email.trim().toLowerCase(),
        password
      );

      if (response.success && response.data.user) {
        // Navigate based on user role
        if (response.data.user.role === "admin") {
          onNavigateToAdminDashboard();
        } else {
          onNavigateToUserDashboard();
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Login gagal. Periksa email dan password Anda.";

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
            <h2 className="text-[#F5E6CA]">Selamat Datang Kembali!</h2>
            <p className="text-[#F5E6CA]/80">
              Masuk ke dashboard admin untuk memantau hasil sortir biji kopi dan
              menganalisis data secara real-time.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1652248939452-6de84124f8a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBiZWFucyUyMHJvYXN0ZWR8ZW58MXx8fHwxNzYwNTAzNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Coffee beans"
              className="w-full h-64 object-cover"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="text-[#F5E6CA]">95%+</div>
              <p className="text-[#F5E6CA]/70">Akurasi</p>
            </div>
            <div className="text-center">
              <div className="text-[#F5E6CA]">10K+</div>
              <p className="text-[#F5E6CA]/70">Biji/Jam</p>
            </div>
            <div className="text-center">
              <div className="text-[#F5E6CA]">24/7</div>
              <p className="text-[#F5E6CA]/70">Monitoring</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="bg-white shadow-2xl border-0">
          <CardHeader className="space-y-2 pb-6">
            <div className="md:hidden flex items-center gap-2 mb-4">
              <img src={logoImage} alt="PiKopi Logo" className="h-14 w-auto" />
            </div>
            <CardTitle className="text-[#4B2E05]">Masuk ke Akun</CardTitle>
            <CardDescription>
              Masukkan email dan password Anda untuk mengakses dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">


              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@pikopi.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                    required
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#56743D] focus:ring-[#56743D]"
                  />
                  <span className="text-gray-600">Ingat saya</span>
                </label>
                <button
                  type="button"
                  onClick={onNavigateToForgotPassword}
                  className="text-[#56743D] hover:text-[#4C7C2E]"
                >
                  Lupa password?
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#56743D] hover:bg-[#4C7C2E] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Masuk..." : "Masuk"}
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
                  Belum punya akun?{" "}
                  <button
                    type="button"
                    onClick={onNavigateToRegister}
                    className="text-[#56743D] hover:text-[#4C7C2E]"
                  >
                    Daftar sekarang
                  </button>
                </p>
              </div>

              <div className="text-center pt-4">
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
