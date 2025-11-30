import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Alert, AlertDescription } from './ui/alert';
import { Coffee, Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import logoImage from 'figma:asset/4dd15d3bf546fd413c470482994e9b74ecf4af1b.png';

interface ForgotPasswordProps {
  onNavigateToLogin: () => void;
}

export default function ForgotPassword({ onNavigateToLogin }: ForgotPasswordProps) {
  const [step, setStep] = useState<'email' | 'code' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send Reset Email
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('code');
    }, 1500);
  };

  // Step 2: Verify Reset Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Simple validation - in production, verify with backend
      if (resetCode === '123456') {
        setStep('reset');
      } else {
        setError('Kode verifikasi tidak valid. Gunakan: 123456 (demo)');
      }
    }, 1500);
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (newPassword.length < 8) {
      setError('Password harus minimal 8 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1500);
  };

  // Resend Code
  const handleResendCode = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setError('Kode verifikasi baru telah dikirim ke email Anda');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B2E05] to-[#3C2409] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block text-[#F5E6CA] space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-full bg-[#56743D] flex items-center justify-center">
              <Coffee className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-[#F5E6CA]">PiKopi</h1>
              <p className="text-[#F5E6CA]/70">Computer Vision Sorting System</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-[#F5E6CA]">Lupa Password?</h2>
            <p className="text-[#F5E6CA]/80">
              Jangan khawatir! Masukkan email Anda dan kami akan mengirimkan kode verifikasi untuk mengatur ulang password.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzZWN1cml0eXxlbnwxfHx8fDE3MzA1MDM0OTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Secure coffee system"
              className="w-full h-64 object-cover"
            />
          </div>

          <div className="bg-[#F5E6CA]/10 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-[#F5E6CA] mb-3">Tips Keamanan:</h3>
            <ul className="space-y-2 text-[#F5E6CA]/80 text-sm">
              <li>✓ Gunakan password minimal 8 karakter</li>
              <li>✓ Kombinasikan huruf besar, kecil, angka & simbol</li>
              <li>✓ Jangan bagikan password ke siapapun</li>
              <li>✓ Ubah password secara berkala</li>
            </ul>
          </div>
        </div>

        {/* Right Side - Reset Password Form */}
        <Card className="bg-white shadow-2xl border-0">
          <CardHeader className="space-y-2 pb-6">
            <div className="md:hidden flex items-center gap-2 mb-4">
              <img 
                src={logoImage} 
                alt="PiKopi Logo" 
                className="h-14 w-auto"
              />
            </div>
            
            <CardTitle className="text-[#4B2E05]">
              {step === 'email' && 'Lupa Password'}
              {step === 'code' && 'Verifikasi Kode'}
              {step === 'reset' && 'Reset Password'}
              {step === 'success' && 'Berhasil!'}
            </CardTitle>
            
            <CardDescription>
              {step === 'email' && 'Masukkan email Anda untuk menerima kode verifikasi'}
              {step === 'code' && `Kami telah mengirim kode verifikasi ke ${email}`}
              {step === 'reset' && 'Masukkan password baru Anda'}
              {step === 'success' && 'Password Anda telah berhasil diubah'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Step 1: Email Input */}
            {step === 'email' && (
              <form onSubmit={handleSendResetEmail} className="space-y-5">
                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#56743D] hover:bg-[#4C7C2E] text-white"
                >
                  {loading ? 'Mengirim...' : 'Kirim Kode Verifikasi'}
                </Button>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-[#56743D] hover:text-[#4C7C2E] flex items-center gap-2 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke halaman login
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Code Verification */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                {error && (
                  <Alert className={error.includes('demo') ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}>
                    <AlertDescription className={error.includes('demo') ? 'text-red-700' : 'text-blue-700'}>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-800">
                    <strong>Demo Mode:</strong> Gunakan kode <strong>123456</strong> untuk melanjutkan
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="code">Kode Verifikasi</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Masukkan 6 digit kode"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="text-center tracking-widest border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                    maxLength={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#56743D] hover:bg-[#4C7C2E] text-white"
                >
                  {loading ? 'Memverifikasi...' : 'Verifikasi Kode'}
                </Button>

                <div className="text-center space-y-3">
                  <p className="text-gray-600">
                    Tidak menerima kode?{' '}
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading}
                      className="text-[#56743D] hover:text-[#4C7C2E]"
                    >
                      Kirim ulang
                    </button>
                  </p>
                  
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Kembali ke halaman login
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Masukkan password baru"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Konfirmasi password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 border-gray-300 focus:border-[#56743D] focus:ring-[#56743D]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Kekuatan Password:</span>
                      <span className={`${
                        newPassword.length >= 12 ? 'text-green-600' :
                        newPassword.length >= 8 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {newPassword.length >= 12 ? 'Kuat' :
                         newPassword.length >= 8 ? 'Sedang' :
                         'Lemah'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          newPassword.length >= 12 ? 'bg-green-600 w-full' :
                          newPassword.length >= 8 ? 'bg-yellow-600 w-2/3' :
                          'bg-red-600 w-1/3'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#56743D] hover:bg-[#4C7C2E] text-white"
                >
                  {loading ? 'Mengatur Ulang...' : 'Reset Password'}
                </Button>
              </form>
            )}

            {/* Step 4: Success */}
            {step === 'success' && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <div>
                  <h3 className="text-[#4B2E05] mb-2">Password Berhasil Diubah!</h3>
                  <p className="text-gray-600">
                    Password Anda telah berhasil diubah. Silakan login dengan password baru Anda.
                  </p>
                </div>

                <Button
                  onClick={onNavigateToLogin}
                  className="w-full bg-[#56743D] hover:bg-[#4C7C2E] text-white"
                >
                  Kembali ke Halaman Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
