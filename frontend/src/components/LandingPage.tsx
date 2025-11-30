import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { motion } from "motion/react";
import logoImage from 'figma:asset/4dd15d3bf546fd413c470482994e9b74ecf4af1b.png';
import {
  Camera,
  Cpu,
  BarChart3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Calendar,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Award,
  Star,
  Quote,
  ChevronRight,
  Coffee,
  Sparkles,
  Target,
  Clock,
} from "lucide-react";
import { newsAPI } from "../services/api";

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export default function LandingPage({
  onNavigateToLogin,
  onNavigateToRegister,
}: LandingPageProps) {
  const [news, setNews] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await newsAPI.getAllNews({ limit: 3, includeDrafts: false });
        if (response.success) {
          setNews(response.data.news);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchNews();
  }, []);

  const features = [
    {
      icon: Camera,
      title: "Deteksi Otomatis",
      description:
        "Menggunakan kamera dan AI untuk menganalisis kualitas biji dengan presisi tinggi.",
      color: "bg-blue-500",
    },
    {
      icon: Cpu,
      title: "Klasifikasi Cerdas",
      description:
        "Mengelompokkan biji berdasarkan tingkat cacat menggunakan CNN model.",
      color: "bg-purple-500",
    },
    {
      icon: BarChart3,
      title: "Dashboard Realtime",
      description:
        "Menampilkan hasil sortir dan statistik secara visual dan real-time.",
      color: "bg-green-500",
    },
    {
      icon: Zap,
      title: "Proses Cepat",
      description:
        "Mampu memproses hingga 10,000+ biji kopi per jam dengan akurasi tinggi.",
      color: "bg-yellow-500",
    },
    {
      icon: Shield,
      title: "Kualitas Terjamin",
      description:
        "Akurasi deteksi hingga 98.5% untuk hasil sortir yang konsisten.",
      color: "bg-red-500",
    },
    {
      icon: TrendingUp,
      title: "Efisiensi Maksimal",
      description:
        "3x lebih cepat dari sortir manual dengan biaya operasional rendah.",
      color: "bg-orange-500",
    },
  ];

  const stats = [
    { value: "98.5%", label: "Akurasi Deteksi", icon: Target },
    { value: "10,000+", label: "Biji/Jam", icon: Zap },
    { value: "50+", label: "Mitra UMKM", icon: Users },
    { value: "3x", label: "Lebih Cepat", icon: Clock },
  ];

  const benefits = [
    {
      text: "Hemat waktu hingga 70% dari sortir manual",
      icon: Clock,
    },
    {
      text: "Tingkatkan kualitas produk dengan konsistensi tinggi",
      icon: Award,
    },
    {
      text: "Kurangi biaya operasional jangka panjang",
      icon: TrendingUp,
    },
    {
      text: "Dapatkan laporan detail untuk setiap batch",
      icon: BarChart3,
    },
    { text: "Support teknis dan training gratis", icon: Users },
    { text: "Garansi dan maintenance teratur", icon: Shield },
  ];

  const testimonials = [
    {
      name: "Budi Santoso",
      role: "Pemilik UMKM Kopi Gayo",
      image:
        "https://images.unsplash.com/photo-1618496899001-b58ebcbeef26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGZhcm1lciUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MTQ1NTM1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      quote:
        "PiKopi mengubah bisnis saya. Proses sortir yang tadinya 8 jam kini hanya 2 jam dengan hasil lebih konsisten!",
      rating: 5,
    },
    {
      name: "Siti Aminah",
      role: "Produsen Kopi Toraja",
      image:
        "https://images.unsplash.com/photo-1618496899001-b58ebcbeef26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGZhcm1lciUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MTQ1NTM1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      quote:
        "Akurasi sistem ini luar biasa. Kualitas kopi saya meningkat dan buyer lebih percaya dengan produk kami.",
      rating: 5,
    },
    {
      name: "Ahmad Wijaya",
      role: "Eksportir Kopi Mandailing",
      image:
        "https://images.unsplash.com/photo-1618496899001-b58ebcbeef26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGZhcm1lciUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MTQ1NTM1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      quote:
        "Investasi terbaik untuk bisnis kopi. ROI tercapai dalam 6 bulan dan customer satisfaction naik drastis.",
      rating: 5,
    },
  ];

  const packages = [
    {
      name: "Paket Starter",
      price: "Mulai dari Rp 15.000/kg",
      description: "Cocok untuk UMKM pemula",
      features: [
        "5-20 kg per order",
        "Akurasi 95%+",
        "Dashboard monitoring",
        "Laporan digital",
        "Support email",
      ],
      badge: "UMKM",
      color: "border-blue-500",
      highlight: false,
    },
    {
      name: "Paket Bisnis",
      price: "Mulai dari Rp 13.000/kg",
      description: "Paling populer untuk bisnis",
      features: [
        "21-50 kg per order",
        "Akurasi 97%+",
        "Prioritas antrian",
        "Konsultasi gratis",
        "Support 24/7",
        "Free pickup",
      ],
      badge: "POPULER",
      color: "border-green-500",
      highlight: true,
    },
    {
      name: "Paket Enterprise",
      price: "Mulai dari Rp 11.000/kg",
      description: "Untuk volume besar",
      features: [
        "51+ kg per order",
        "Akurasi 98.5%+",
        "Harga spesial",
        "Account manager",
        "Custom SLA",
        "Free delivery",
      ],
      badge: "HEMAT",
      color: "border-orange-500",
      highlight: false,
    },
  ];



  const galleryImages = [
    {
      url: "https://images.unsplash.com/photo-1717144838873-2239fd93df69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwY29mZmVlJTIwYmVhbnN8ZW58MXx8fHwxNzYwNTk4MTg0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      label: "Sehat",
    },
    {
      url: "https://images.unsplash.com/photo-1652248939452-6de84124f8a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBiZWFucyUyMHJvYXN0ZWR8ZW58MXx8fHwxNzYwNTAzNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      label: "Sehat",
    },
    {
      url: "https://images.unsplash.com/photo-1668923570518-9eb1f838f19b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmFiaWNhJTIwY29mZmVlJTIwYmVhbnN8ZW58MXx8fHwxNzYwNTk4MTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      label: "Sehat",
    },
    {
      url: "https://images.unsplash.com/photo-1634993073618-5312c9781162?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWZlY3RpdmUlMjBjb2ZmZWUlMjBiZWFuc3xlbnwxfHx8fDE3NjA1MjE3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      label: "Cacat",
    },
    {
      url: "https://images.unsplash.com/photo-1652248939452-6de84124f8a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBiZWFucyUyMHJvYXN0ZWR8ZW58MXx8fHwxNzYwNTAzNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      label: "Cacat",
    },
    {
      url: "https://images.unsplash.com/photo-1668923570518-9eb1f838f19b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmFiaWNhJTIwY29mZmVlJTIwYmVhbnN8ZW58MXx8fHwxNzYwNTk4MTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      label: "Sehat",
    },
  ];

  const faqs = [
    {
      question: "Berapa minimum pemesanan?",
      answer:
        "Minimum pemesanan adalah 5 kg untuk Paket Starter. Kami juga menyediakan paket untuk volume lebih besar dengan harga lebih kompetitif.",
    },
    {
      question: "Berapa lama waktu proses sortir?",
      answer:
        "Waktu proses bervariasi tergantung volume. Umumnya 1-3 hari untuk paket standard, dengan prioritas lebih cepat untuk paket bisnis dan enterprise.",
    },
    {
      question: "Apakah ada garansi akurasi?",
      answer:
        "Ya, kami memberikan garansi akurasi minimal 95% untuk semua paket. Jika akurasi di bawah standar, kami akan melakukan proses ulang gratis.",
    },
    {
      question: "Bagaimana cara memesan jasa sortir?",
      answer:
        'Daftar akun, login, dan pilih menu "Pesan Jasa". Isi detail pesanan, dan tim kami akan menghubungi untuk konfirmasi.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={logoImage}
                alt="PiKopi Logo"
                className="h-12 w-auto"
              />
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#beranda"
                className="text-gray-700 hover:text-[#4B2E05] transition-colors"
              >
                Beranda
              </a>
              <a
                href="#tentang"
                className="text-gray-700 hover:text-[#4B2E05] transition-colors"
              >
                Tentang
              </a>
              <a
                href="#fitur"
                className="text-gray-700 hover:text-[#4B2E05] transition-colors"
              >
                Fitur
              </a>
              <a
                href="#paket"
                className="text-gray-700 hover:text-[#4B2E05] transition-colors"
              >
                Paket
              </a>
              <a
                href="#testimoni"
                className="text-gray-700 hover:text-[#4B2E05] transition-colors"
              >
                Testimoni
              </a>
              <a
                href="#berita"
                className="text-gray-700 hover:text-[#4B2E05] transition-colors"
              >
                Berita
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-[#4B2E05] text-[#4B2E05] hover:bg-[#F5E6CA]"
                onClick={onNavigateToLogin}
              >
                Login
              </Button>
              <Button
                className="bg-gradient-to-r from-[#56743D] to-[#4C7C2E] hover:from-[#4C7C2E] hover:to-[#56743D] text-white shadow-lg"
                onClick={onNavigateToRegister}
              >
                Daftar Gratis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="beranda"
        className="relative overflow-hidden bg-gradient-to-br from-[#F5E6CA] via-white to-[#E8D5B7] py-16 md:py-24"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#56743D]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4B2E05]/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <Badge className="bg-[#56743D] text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Teknologi AI Terdepan
              </Badge>

              <h1 className="text-[#4B2E05] leading-tight">
                Sortir Kopi Cerdas,
                <br />
                <span className="text-[#56743D]">
                  Hasil Lebih Berkualitas
                </span>
              </h1>

              <p className="text-gray-700 text-lg">
                Tingkatkan kualitas dan efisiensi produksi kopi
                Anda dengan sistem sortir otomatis berbasis AI
                dan Computer Vision. Akurat, cepat, dan
                terpercaya.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#4C7C2E] to-[#56743D] hover:from-[#56743D] hover:to-[#4C7C2E] text-white shadow-xl group"
                  onClick={onNavigateToRegister}
                >
                  Mulai Sekarang
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-[#4B2E05] text-[#4B2E05] hover:bg-[#F5E6CA]"
                  onClick={() =>
                    document
                      .getElementById("tentang")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Pelajari Lebih Lanjut
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center">
                  <div className="text-[#4B2E05]">98.5%</div>
                  <p className="text-gray-600">Akurasi</p>
                </div>
                <div className="text-center">
                  <div className="text-[#4B2E05]">10k+</div>
                  <p className="text-gray-600">Biji/Jam</p>
                </div>
                <div className="text-center">
                  <div className="text-[#4B2E05]">50+</div>
                  <p className="text-gray-600">Mitra</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1725969603501-fa3a58b7298b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzb3J0aW5nJTIwbWFjaGluZXxlbnwxfHx8fDE3NjA1MjE3ODR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Coffee Sorting Machine"
                  className="w-full h-[500px] object-cover"
                />
                {/* Floating badges */}
                <div className="absolute top-6 right-6 bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-gray-500 text-sm">
                        Akurasi
                      </p>
                      <p className="text-[#4B2E05]">98.5%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-[#4B2E05] to-[#6A4B2E] text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-white/10 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-[#F5E6CA]" />
                </div>
                <div className="text-[#F5E6CA] mb-2">
                  {stat.value}
                </div>
                <p className="text-white/80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1728044849242-516700295875?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBwcm9jZXNzaW5nJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjE1NTIzMzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Coffee Processing Technology"
                  className="w-full h-[500px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[#4B2E05]">
                      Penghargaan
                    </p>
                    <p className="text-gray-600 text-sm">
                      Inovasi 2025
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <Badge className="bg-[#56743D]/10 text-[#56743D]">
                Tentang Kami
              </Badge>

              <h2 className="text-[#4B2E05]">
                Solusi Sortir Kopi Terpercaya untuk UMKM
                Indonesia
              </h2>

              <p className="text-gray-700">
                PiKopi adalah sistem sortir biji kopi
                otomatis berbasis AI dan Computer Vision yang
                dirancang khusus untuk membantu UMKM kopi
                Indonesia meningkatkan kualitas dan efisiensi
                produksi.
              </p>

              <p className="text-gray-700">
                Dengan teknologi CNN (Convolutional Neural
                Network) dan robotika presisi, kami mampu
                mengidentifikasi dan memisahkan biji kopi sehat
                dari yang cacat dengan akurasi hingga 98.5%.
              </p>

              <div className="space-y-3 pt-4">
                {benefits.slice(0, 4).map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-gray-700">
                      {benefit.text}
                    </p>
                  </div>
                ))}
              </div>

              <Button
                className="bg-[#4C7C2E] hover:bg-[#56743D] text-white mt-6"
                onClick={() =>
                  document
                    .getElementById("paket")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Lihat Paket Layanan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="fitur"
        className="py-20 bg-gradient-to-br from-[#F5E6CA] to-white"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-[#56743D]/10 text-[#56743D] mb-4">
              Fitur Unggulan
            </Badge>
            <h2 className="text-[#4B2E05] mb-4">
              Teknologi Canggih untuk Hasil Optimal
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Sistem kami dilengkapi dengan berbagai fitur
              modern untuk memastikan proses sortir yang
              efisien, akurat, dan dapat diandalkan
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group hover:-translate-y-2">
                  <CardContent className="p-8 text-center space-y-4">
                    <div
                      className={`w-16 h-16 mx-auto ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-[#4B2E05]">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="paket" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-[#56743D]/10 text-[#56743D] mb-4">
              Paket Layanan
            </Badge>
            <h2 className="text-[#4B2E05] mb-4">
              Pilih Paket Sesuai Kebutuhan Anda
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Kami menyediakan berbagai paket yang disesuaikan
              dengan volume dan kebutuhan bisnis Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
              >
                <Card
                  className={`relative border-2 ${pkg.color} ${pkg.highlight ? "shadow-2xl scale-105" : "shadow-lg"} hover:shadow-2xl transition-all duration-300`}
                >
                  {pkg.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-600 text-white px-4 py-1">
                        {pkg.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    {!pkg.highlight && (
                      <Badge className="mx-auto mb-4 bg-gray-100 text-gray-700">
                        {pkg.badge}
                      </Badge>
                    )}
                    <CardTitle className="text-[#4B2E05] mt-2">
                      {pkg.name}
                    </CardTitle>
                    <p className="text-gray-600 text-sm mt-2">
                      {pkg.description}
                    </p>
                    <div className="text-[#4C7C2E] mt-4">
                      {pkg.price}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Separator />
                    <ul className="space-y-3">
                      {pkg.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2"
                        >
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-6 ${pkg.highlight ? "bg-gradient-to-r from-[#4C7C2E] to-[#56743D]" : "bg-[#56743D]"} hover:bg-[#4C7C2E] text-white`}
                      onClick={onNavigateToRegister}
                    >
                      Pilih Paket
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimoni"
        className="py-20 bg-gradient-to-br from-[#F5E6CA] to-white"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-[#56743D]/10 text-[#56743D] mb-4">
              Testimoni
            </Badge>
            <h2 className="text-[#4B2E05] mb-4">
              Dipercaya oleh UMKM Kopi Indonesia
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Lihat bagaimana PiKopi membantu meningkatkan
              bisnis kopi para mitra kami
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                  <CardContent className="p-8">
                    <Quote className="w-10 h-10 text-[#56743D]/20 mb-4" />

                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map(
                        (_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 fill-yellow-400 text-yellow-400"
                          />
                        ),
                      )}
                    </div>

                    <p className="text-gray-700 mb-6 italic">
                      "{testimonial.quote}"
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        <ImageWithFallback
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[#4B2E05]">
                          {testimonial.name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section id="berita" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-[#56743D]/10 text-[#56743D] mb-4">
              Berita & Update
            </Badge>
            <h2 className="text-[#4B2E05] mb-4">
              Update Terbaru PiKopi
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Ikuti perkembangan terbaru, pencapaian, dan
              inovasi kami dalam meningkatkan kualitas sortir
              kopi Indonesia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {isLoadingNews ? (
              // Loading skeletons
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : news.length > 0 ? (
              news.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                  viewport={{ once: true }}
                >
                  <Card
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white group cursor-pointer h-full flex flex-col"
                    onClick={onNavigateToLogin}
                  >
                    <div className="relative h-48 overflow-hidden shrink-0">
                      <ImageWithFallback
                        src={item.imageUrl || "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-[#56743D] text-white">
                          {item.category || "Berita"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</span>
                      </div>
                      <h3 className="text-[#4B2E05] mb-3 line-clamp-2 font-semibold text-lg">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm flex-grow">
                        {item.excerpt}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-[#56743D] hover:text-[#4C7C2E] p-0 h-auto gap-2 group mt-auto self-start"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToLogin();
                        }}
                      >
                        Baca Selengkapnya
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                <p>Belum ada berita terbaru.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Button
              variant="outline"
              className="border-2 border-[#4B2E05] text-[#4B2E05] hover:bg-[#F5E6CA]"
              onClick={onNavigateToLogin}
            >
              Lihat Semua Berita
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#4B2E05] to-[#6A4B2E] text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-white">
              Siap Meningkatkan Kualitas Kopi Anda?
            </h2>
            <p className="text-[#F5E6CA] text-lg">
              Bergabunglah dengan 50+ UMKM kopi yang telah
              merasakan manfaat PiKopi. Daftar sekarang dan
              dapatkan konsultasi gratis!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-[#4B2E05] hover:bg-[#F5E6CA] shadow-xl"
                onClick={onNavigateToRegister}
              >
                Daftar Sekarang
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#4B2E05] text-[#4B2E05] hover:bg-[#F5E6CA]"
                onClick={() =>
                  document
                    .getElementById("tentang")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Hubungi Kami
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Flow */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-[#56743D]/10 text-[#56743D] mb-4">
              Cara Kerja
            </Badge>
            <h2 className="text-[#4B2E05] mb-4">
              Proses Sortir Otomatis
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Sistem kami menggunakan teknologi CNN dan robotika
              untuk proses sortir yang cepat dan akurat
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex-1 text-center"
              >
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                  <Camera className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-[#4B2E05] mb-2">
                  1. Capture
                </h3>
                <p className="text-gray-600">
                  Kamera menangkap gambar biji kopi secara
                  real-time
                </p>
              </motion.div>

              <div className="hidden md:block">
                <ChevronRight className="w-8 h-8 text-[#56743D]" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex-1 text-center"
              >
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                  <Cpu className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-[#4B2E05] mb-2">
                  2. Analyze
                </h3>
                <p className="text-gray-600">
                  AI menganalisis dan mengklasifikasi setiap
                  biji
                </p>
              </motion.div>

              <div className="hidden md:block">
                <ChevronRight className="w-8 h-8 text-[#56743D]" />
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="flex-1 text-center"
              >
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-[#4B2E05] mb-2">3. Sort</h3>
                <p className="text-gray-600">
                  Biji sehat dan cacat terpisah secara otomatis
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section
        id="galeri"
        className="py-20 bg-gradient-to-br from-[#F5E6CA] to-white"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-[#56743D]/10 text-[#56743D] mb-4">
              Galeri
            </Badge>
            <h2 className="text-[#4B2E05] mb-4">
              Hasil Klasifikasi Kualitas Biji
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Contoh hasil sortir biji kopi sehat dan cacat
              menggunakan teknologi PiKopi
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                className="relative group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <ImageWithFallback
                  src={image.url}
                  alt={`Coffee beans ${image.label}`}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-white ${image.label === "Sehat"
                        ? "bg-green-600"
                        : "bg-red-600"
                        }`}
                    >
                      {image.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-[#56743D]/10 text-[#56743D] mb-4">
              FAQ
            </Badge>
            <h2 className="text-[#4B2E05] mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Temukan jawaban untuk pertanyaan umum tentang
              layanan PiKopi
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
              >
                <Card className="border-2 border-gray-200 hover:border-[#56743D] transition-colors">
                  <CardContent className="p-6">
                    <h3 className="text-[#4B2E05] mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Masih ada pertanyaan?
            </p>
            <Button
              variant="outline"
              className="border-2 border-[#4B2E05] text-[#4B2E05] hover:bg-[#F5E6CA]"
            >
              Hubungi Tim Kami
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4B2E05] text-[#F5E6CA] py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src={logoImage}
                  alt="PiKopi Logo"
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-[#F5E6CA]/70">
                Sistem sortir biji kopi berbasis AI dan Computer
                Vision untuk meningkatkan kualitas produksi kopi
                Indonesia
              </p>
            </div>

            <div>
              <h3 className="mb-4">Menu Cepat</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#beranda"
                    className="text-[#F5E6CA]/70 hover:text-[#F5E6CA] transition-colors"
                  >
                    Beranda
                  </a>
                </li>
                <li>
                  <a
                    href="#tentang"
                    className="text-[#F5E6CA]/70 hover:text-[#F5E6CA] transition-colors"
                  >
                    Tentang
                  </a>
                </li>
                <li>
                  <a
                    href="#fitur"
                    className="text-[#F5E6CA]/70 hover:text-[#F5E6CA] transition-colors"
                  >
                    Fitur
                  </a>
                </li>
                <li>
                  <a
                    href="#paket"
                    className="text-[#F5E6CA]/70 hover:text-[#F5E6CA] transition-colors"
                  >
                    Paket
                  </a>
                </li>
                <li>
                  <a
                    href="#testimoni"
                    className="text-[#F5E6CA]/70 hover:text-[#F5E6CA] transition-colors"
                  >
                    Testimoni
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4">Kontak</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-[#F5E6CA]/70">
                  <Mail className="w-4 h-4" />
                  <span>info@pikopi.id</span>
                </li>
                <li className="flex items-center gap-2 text-[#F5E6CA]/70">
                  <MapPin className="w-4 h-4" />
                  <span>Jakarta, Indonesia</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4">Ikuti Kami</h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#56743D] flex items-center justify-center hover:bg-[#4C7C2E] transition-colors"
                >
                  <Facebook className="w-5 h-5 text-white" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#56743D] flex items-center justify-center hover:bg-[#4C7C2E] transition-colors"
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#56743D] flex items-center justify-center hover:bg-[#4C7C2E] transition-colors"
                >
                  <Mail className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
          </div>

          <Separator className="bg-[#F5E6CA]/20 my-8" />

          <div className="text-center text-[#F5E6CA]/70">
            <p>
              &copy; 2025 PiKopi. All rights reserved. Made
              with ❤️ for Indonesian Coffee Industry
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}