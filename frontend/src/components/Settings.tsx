import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Mail,
  DollarSign,
  Database,
  Globe,
  Clock,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Coffee,
  Sliders,
  FileText,
  Lock,
  Server,
  Newspaper
} from 'lucide-react';

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'PiKopi',
    systemEmail: 'admin@pikopi.id',
    systemPhone: '0812-9876-5432',
    language: 'id',
    timezone: 'Asia/Jakarta',
    currency: 'IDR'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    systemAlerts: true,
    weeklyReport: true,
    monthlyReport: true
  });

  // Sorting System Settings
  const [sortingSettings, setSortingSettings] = useState({
    accuracyThreshold: 85,
    defectSensitivity: 75,
    autoMode: true,
    batchSize: 500,
    qualityCheck: true,
    realTimeMonitoring: true
  });

  // Pricing Settings
  const [pricingSettings, setPricingSettings] = useState({
    pricePerKg: 13000,
    bulkDiscount: 10,
    minimumOrder: 10,
    tax: 11,
    expressCharge: 50000,
    insuranceRate: 2
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
    sessionTimeout: 30,
    twoFactorAuth: false,
    ipWhitelist: false,
    loginAttempts: 5
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.pikopi.id',
    smtpPort: '587',
    smtpUser: 'noreply@pikopi.id',
    smtpSecurity: 'tls',
    fromName: 'PiKopi System',
    replyTo: 'support@pikopi.id'
  });

  // Backup Settings
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    cloudBackup: true,
    localBackup: true
  });

  // News Settings
  const [newsSettings, setNewsSettings] = useState({
    displayLimit: 3,
    autoPublish: false,
    defaultCategory: 'Update Teknologi',
    imageRequired: true,
    excerptMaxLength: 150,
    contentMinLength: 100,
    dateFormat: 'DD/MM/YYYY',
    showAuthor: true,
    enableComments: false,
    featuredNewsEnabled: true,
    notifyOnPublish: true
  });

  // Save Settings
  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1500);
  };

  // Reset to Defaults
  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang semua pengaturan ke default?')) {
      // Reset all settings to default
      setSaveSuccess(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#4B2E05] mb-2">Pengaturan Sistem</h2>
          <p className="text-gray-600">Kelola konfigurasi dan preferensi sistem PiKopi</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Default
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#4C7C2E] hover:bg-[#3d6324] gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <p>Pengaturan berhasil disimpan!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Umum</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifikasi</span>
          </TabsTrigger>
          <TabsTrigger value="sorting" className="gap-2">
            <Coffee className="w-4 h-4" />
            <span className="hidden sm:inline">Sortir</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Harga</span>
          </TabsTrigger>
          <TabsTrigger value="news" className="gap-2">
            <Newspaper className="w-4 h-4" />
            <span className="hidden sm:inline">Berita</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Keamanan</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#4B2E05] flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Pengaturan Umum
              </CardTitle>
              <CardDescription>
                Konfigurasi dasar sistem dan informasi perusahaan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="system-name">Nama Sistem</Label>
                  <Input
                    id="system-name"
                    value={generalSettings.systemName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, systemName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system-email">Email Sistem</Label>
                  <Input
                    id="system-email"
                    type="email"
                    value={generalSettings.systemEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, systemEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system-phone">Nomor Telepon</Label>
                  <Input
                    id="system-phone"
                    value={generalSettings.systemPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, systemPhone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Bahasa</Label>
                  <Select value={generalSettings.language} onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Waktu</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Jakarta">WIB (Jakarta)</SelectItem>
                      <SelectItem value="Asia/Makassar">WITA (Makassar)</SelectItem>
                      <SelectItem value="Asia/Jayapura">WIT (Jayapura)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Mata Uang</Label>
                  <Select value={generalSettings.currency} onValueChange={(value) => setGeneralSettings({ ...generalSettings, currency: value })}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#4B2E05] flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Pengaturan Notifikasi
              </CardTitle>
              <CardDescription>
                Kelola preferensi notifikasi dan alert sistem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="email-notif">Notifikasi Email</Label>
                    <p className="text-sm text-gray-600">Terima notifikasi melalui email</p>
                  </div>
                  <Switch
                    id="email-notif"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="sms-notif">Notifikasi SMS</Label>
                    <p className="text-sm text-gray-600">Terima notifikasi melalui SMS</p>
                  </div>
                  <Switch
                    id="sms-notif"
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smsNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="push-notif">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Terima notifikasi push di browser</p>
                  </div>
                  <Switch
                    id="push-notif"
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="order-notif">Notifikasi Pesanan</Label>
                    <p className="text-sm text-gray-600">Notifikasi untuk pesanan baru</p>
                  </div>
                  <Switch
                    id="order-notif"
                    checked={notificationSettings.orderNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, orderNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="system-alerts">Alert Sistem</Label>
                    <p className="text-sm text-gray-600">Notifikasi untuk masalah sistem</p>
                  </div>
                  <Switch
                    id="system-alerts"
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, systemAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="weekly-report">Laporan Mingguan</Label>
                    <p className="text-sm text-gray-600">Terima laporan setiap minggu</p>
                  </div>
                  <Switch
                    id="weekly-report"
                    checked={notificationSettings.weeklyReport}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, weeklyReport: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="monthly-report">Laporan Bulanan</Label>
                    <p className="text-sm text-gray-600">Terima laporan setiap bulan</p>
                  </div>
                  <Switch
                    id="monthly-report"
                    checked={notificationSettings.monthlyReport}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, monthlyReport: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sorting System Settings */}
        <TabsContent value="sorting">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#4B2E05] flex items-center gap-2">
                <Coffee className="w-5 h-5" />
                Pengaturan Sistem Sortir
              </CardTitle>
              <CardDescription>
                Konfigurasi parameter deteksi dan sortir biji kopi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="accuracy-threshold">Threshold Akurasi Minimum</Label>
                    <Badge className="bg-blue-100 text-blue-700">{sortingSettings.accuracyThreshold}%</Badge>
                  </div>
                  <Slider
                    id="accuracy-threshold"
                    value={[sortingSettings.accuracyThreshold]}
                    onValueChange={([value]) => setSortingSettings({ ...sortingSettings, accuracyThreshold: value })}
                    min={70}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">Sistem akan memberikan alert jika akurasi di bawah nilai ini</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="defect-sensitivity">Sensitivitas Deteksi Cacat</Label>
                    <Badge className="bg-orange-100 text-orange-700">{sortingSettings.defectSensitivity}%</Badge>
                  </div>
                  <Slider
                    id="defect-sensitivity"
                    value={[sortingSettings.defectSensitivity]}
                    onValueChange={([value]) => setSortingSettings({ ...sortingSettings, defectSensitivity: value })}
                    min={50}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">Tingkat sensitivitas dalam mendeteksi biji cacat</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="batch-size">Ukuran Batch (biji)</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    value={sortingSettings.batchSize}
                    onChange={(e) => setSortingSettings({ ...sortingSettings, batchSize: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Jumlah biji per batch sortir</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="auto-mode">Mode Otomatis</Label>
                      <p className="text-sm text-gray-600">Sistem berjalan otomatis tanpa intervensi</p>
                    </div>
                    <Switch
                      id="auto-mode"
                      checked={sortingSettings.autoMode}
                      onCheckedChange={(checked) => setSortingSettings({ ...sortingSettings, autoMode: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="quality-check">Quality Check Ganda</Label>
                      <p className="text-sm text-gray-600">Lakukan pengecekan kualitas dua kali</p>
                    </div>
                    <Switch
                      id="quality-check"
                      checked={sortingSettings.qualityCheck}
                      onCheckedChange={(checked) => setSortingSettings({ ...sortingSettings, qualityCheck: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="realtime-monitor">Real-time Monitoring</Label>
                      <p className="text-sm text-gray-600">Monitor proses sortir secara real-time</p>
                    </div>
                    <Switch
                      id="realtime-monitor"
                      checked={sortingSettings.realTimeMonitoring}
                      onCheckedChange={(checked) => setSortingSettings({ ...sortingSettings, realTimeMonitoring: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* News Settings */}
        <TabsContent value="news">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#4B2E05] flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                Pengaturan Berita
              </CardTitle>
              <CardDescription>
                Kelola konfigurasi tampilan dan publikasi berita
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="display-limit">Jumlah Berita di Landing Page</Label>
                    <Input
                      id="display-limit"
                      type="number"
                      value={newsSettings.displayLimit}
                      onChange={(e) => setNewsSettings({ ...newsSettings, displayLimit: parseInt(e.target.value) })}
                      min={1}
                      max={10}
                    />
                    <p className="text-sm text-gray-600">Maksimal berita yang ditampilkan di halaman utama</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-category">Kategori Default</Label>
                    <Select value={newsSettings.defaultCategory} onValueChange={(value) => setNewsSettings({ ...newsSettings, defaultCategory: value })}>
                      <SelectTrigger id="default-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Penghargaan">Penghargaan</SelectItem>
                        <SelectItem value="Kemitraan">Kemitraan</SelectItem>
                        <SelectItem value="Update Teknologi">Update Teknologi</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Pengumuman">Pengumuman</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600">Kategori yang dipilih otomatis saat membuat berita baru</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt-length">Panjang Maksimal Ringkasan (karakter)</Label>
                    <Input
                      id="excerpt-length"
                      type="number"
                      value={newsSettings.excerptMaxLength}
                      onChange={(e) => setNewsSettings({ ...newsSettings, excerptMaxLength: parseInt(e.target.value) })}
                      min={50}
                      max={300}
                    />
                    <p className="text-sm text-gray-600">Batasan karakter untuk ringkasan berita</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content-min">Panjang Minimal Konten (karakter)</Label>
                    <Input
                      id="content-min"
                      type="number"
                      value={newsSettings.contentMinLength}
                      onChange={(e) => setNewsSettings({ ...newsSettings, contentMinLength: parseInt(e.target.value) })}
                      min={50}
                      max={500}
                    />
                    <p className="text-sm text-gray-600">Konten berita minimal harus berisi karakter ini</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-format">Format Tanggal</Label>
                    <Select value={newsSettings.dateFormat} onValueChange={(value) => setNewsSettings({ ...newsSettings, dateFormat: value })}>
                      <SelectTrigger id="date-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (27/10/2025)</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (10/27/2025)</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-10-27)</SelectItem>
                        <SelectItem value="DD MMM YYYY">DD MMM YYYY (27 Okt 2025)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600">Format tampilan tanggal publikasi</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="auto-publish">Auto-Publish</Label>
                      <p className="text-sm text-gray-600">Publikasikan berita otomatis setelah dibuat</p>
                    </div>
                    <Switch
                      id="auto-publish"
                      checked={newsSettings.autoPublish}
                      onCheckedChange={(checked) => setNewsSettings({ ...newsSettings, autoPublish: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="image-required">Gambar Wajib</Label>
                      <p className="text-sm text-gray-600">Gambar harus diisi saat membuat berita</p>
                    </div>
                    <Switch
                      id="image-required"
                      checked={newsSettings.imageRequired}
                      onCheckedChange={(checked) => setNewsSettings({ ...newsSettings, imageRequired: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="show-author">Tampilkan Penulis</Label>
                      <p className="text-sm text-gray-600">Tampilkan nama penulis di berita</p>
                    </div>
                    <Switch
                      id="show-author"
                      checked={newsSettings.showAuthor}
                      onCheckedChange={(checked) => setNewsSettings({ ...newsSettings, showAuthor: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="featured-news">Berita Unggulan</Label>
                      <p className="text-sm text-gray-600">Aktifkan fitur berita unggulan</p>
                    </div>
                    <Switch
                      id="featured-news"
                      checked={newsSettings.featuredNewsEnabled}
                      onCheckedChange={(checked) => setNewsSettings({ ...newsSettings, featuredNewsEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="enable-comments">Aktifkan Komentar</Label>
                      <p className="text-sm text-gray-600">Izinkan pengguna memberikan komentar</p>
                    </div>
                    <Switch
                      id="enable-comments"
                      checked={newsSettings.enableComments}
                      onCheckedChange={(checked) => setNewsSettings({ ...newsSettings, enableComments: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="notify-publish">Notifikasi Publikasi</Label>
                      <p className="text-sm text-gray-600">Kirim notifikasi saat berita dipublikasikan</p>
                    </div>
                    <Switch
                      id="notify-publish"
                      checked={newsSettings.notifyOnPublish}
                      onCheckedChange={(checked) => setNewsSettings({ ...newsSettings, notifyOnPublish: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-blue-800">
                      <p className="font-medium mb-1">Preview Pengaturan</p>
                      <div className="text-sm space-y-1">
                        <p>• Landing page akan menampilkan <strong>{newsSettings.displayLimit}</strong> berita terbaru</p>
                        <p>• Kategori default: <strong>{newsSettings.defaultCategory}</strong></p>
                        <p>• Ringkasan maksimal <strong>{newsSettings.excerptMaxLength}</strong> karakter</p>
                        <p>• Format tanggal: <strong>{newsSettings.dateFormat}</strong></p>
                        {newsSettings.autoPublish && <p>• ✓ Berita otomatis dipublikasikan</p>}
                        {newsSettings.imageRequired && <p>• ✓ Gambar wajib diisi</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Settings */}
        <TabsContent value="pricing">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#4B2E05] flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pengaturan Harga
              </CardTitle>
              <CardDescription>
                Kelola harga layanan dan biaya tambahan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price-per-kg">Harga per Kilogram (Rp)</Label>
                  <Input
                    id="price-per-kg"
                    type="number"
                    value={pricingSettings.pricePerKg}
                    onChange={(e) => setPricingSettings({ ...pricingSettings, pricePerKg: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Harga dasar sortir per kg</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-discount">Diskon Bulk (%)</Label>
                  <Input
                    id="bulk-discount"
                    type="number"
                    value={pricingSettings.bulkDiscount}
                    onChange={(e) => setPricingSettings({ ...pricingSettings, bulkDiscount: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Diskon untuk pesanan besar</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum-order">Minimum Order (kg)</Label>
                  <Input
                    id="minimum-order"
                    type="number"
                    value={pricingSettings.minimumOrder}
                    onChange={(e) => setPricingSettings({ ...pricingSettings, minimumOrder: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Jumlah minimum pesanan</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax">Pajak (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    value={pricingSettings.tax}
                    onChange={(e) => setPricingSettings({ ...pricingSettings, tax: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Persentase pajak</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="express-charge">Biaya Express (Rp)</Label>
                  <Input
                    id="express-charge"
                    type="number"
                    value={pricingSettings.expressCharge}
                    onChange={(e) => setPricingSettings({ ...pricingSettings, expressCharge: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Biaya untuk pengiriman express</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance-rate">Biaya Asuransi (%)</Label>
                  <Input
                    id="insurance-rate"
                    type="number"
                    value={pricingSettings.insuranceRate}
                    onChange={(e) => setPricingSettings({ ...pricingSettings, insuranceRate: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Persentase biaya asuransi</p>
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-blue-900 mb-2">Kalkulasi Harga Contoh</h4>
                <div className="space-y-1 text-blue-800">
                  <p>Pesanan 25kg: Rp {(pricingSettings.pricePerKg * 25).toLocaleString('id-ID')}</p>
                  <p>Dengan pajak {pricingSettings.tax}%: Rp {(pricingSettings.pricePerKg * 25 * (1 + pricingSettings.tax / 100)).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#4B2E05] flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Pengaturan Keamanan
              </CardTitle>
              <CardDescription>
                Kelola kebijakan keamanan dan akses sistem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password-length">Panjang Password Minimum</Label>
                    <Input
                      id="password-length"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (menit)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-attempts">Maksimal Login Attempts</Label>
                    <Input
                      id="login-attempts"
                      type="number"
                      value={securitySettings.loginAttempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, loginAttempts: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="special-char">Wajib Karakter Khusus</Label>
                      <p className="text-sm text-gray-600">Password harus mengandung karakter khusus</p>
                    </div>
                    <Switch
                      id="special-char"
                      checked={securitySettings.requireSpecialChar}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireSpecialChar: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="require-number">Wajib Angka</Label>
                      <p className="text-sm text-gray-600">Password harus mengandung angka</p>
                    </div>
                    <Switch
                      id="require-number"
                      checked={securitySettings.requireNumber}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireNumber: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Aktifkan autentikasi dua faktor</p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                      <p className="text-sm text-gray-600">Batasi akses berdasarkan IP</p>
                    </div>
                    <Switch
                      id="ip-whitelist"
                      checked={securitySettings.ipWhitelist}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, ipWhitelist: checked })}
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-yellow-800">
                      <p className="font-medium mb-1">Perhatian Keamanan</p>
                      <p className="text-sm">Pastikan kebijakan keamanan yang ketat untuk melindungi data sensitif sistem.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#4B2E05] flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Pengaturan Email
              </CardTitle>
              <CardDescription>
                Konfigurasi SMTP dan template email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input
                    id="smtp-user"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-security">Security</Label>
                  <Select value={emailSettings.smtpSecurity} onValueChange={(value) => setEmailSettings({ ...emailSettings, smtpSecurity: value })}>
                    <SelectTrigger id="smtp-security">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reply-to">Reply-To Email</Label>
                  <Input
                    id="reply-to"
                    type="email"
                    value={emailSettings.replyTo}
                    onChange={(e) => setEmailSettings({ ...emailSettings, replyTo: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  Test Koneksi Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#4B2E05] flex items-center gap-2">
                <Database className="w-5 h-5" />
                Pengaturan Backup
              </CardTitle>
              <CardDescription>
                Kelola backup otomatis dan penyimpanan data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="auto-backup">Backup Otomatis</Label>
                    <p className="text-sm text-gray-600">Backup data secara otomatis</p>
                  </div>
                  <Switch
                    id="auto-backup"
                    checked={backupSettings.autoBackup}
                    onCheckedChange={(checked) => setBackupSettings({ ...backupSettings, autoBackup: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="backup-frequency">Frekuensi Backup</Label>
                    <Select value={backupSettings.backupFrequency} onValueChange={(value) => setBackupSettings({ ...backupSettings, backupFrequency: value })}>
                      <SelectTrigger id="backup-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Setiap Jam</SelectItem>
                        <SelectItem value="daily">Harian</SelectItem>
                        <SelectItem value="weekly">Mingguan</SelectItem>
                        <SelectItem value="monthly">Bulanan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup-time">Waktu Backup</Label>
                    <Input
                      id="backup-time"
                      type="time"
                      value={backupSettings.backupTime}
                      onChange={(e) => setBackupSettings({ ...backupSettings, backupTime: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retention-days">Retensi Data (hari)</Label>
                    <Input
                      id="retention-days"
                      type="number"
                      value={backupSettings.retentionDays}
                      onChange={(e) => setBackupSettings({ ...backupSettings, retentionDays: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="cloud-backup">Cloud Backup</Label>
                      <p className="text-sm text-gray-600">Simpan backup di cloud storage</p>
                    </div>
                    <Switch
                      id="cloud-backup"
                      checked={backupSettings.cloudBackup}
                      onCheckedChange={(checked) => setBackupSettings({ ...backupSettings, cloudBackup: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="local-backup">Local Backup</Label>
                      <p className="text-sm text-gray-600">Simpan backup di server lokal</p>
                    </div>
                    <Switch
                      id="local-backup"
                      checked={backupSettings.localBackup}
                      onCheckedChange={(checked) => setBackupSettings({ ...backupSettings, localBackup: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="gap-2">
                    <Database className="w-4 h-4" />
                    Backup Sekarang
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Restore Backup
                  </Button>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-green-800">
                      <p className="font-medium mb-1">Backup Terakhir</p>
                      <p className="text-sm">18 Oktober 2025, 02:00 WIB - Berhasil (2.3 GB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
