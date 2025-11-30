import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { newsAPI } from "../services/api";
import {
  Calendar,
  FileText,
  User,
  Search,
  Filter,
  Eye,
  ArrowLeft,
  Newspaper,
} from "lucide-react";

interface News {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  publishDate: string;
  author: string;
  status: "published" | "draft";
  category: string;
}

export default function NewsView() {
  const [news, setNews] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  // Load news from API
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsAPI.getAllNews({ limit: 100 });

      if (response.success) {
        // Transform API response to component format
        const transformedNews: News[] = response.data.news.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          excerpt: n.excerpt,
          imageUrl: n.imageUrl || "",
          publishDate: n.publishedAt
            ? new Date(n.publishedAt).toISOString().split("T")[0]
            : "",
          author: n.authorName,
          status: n.isPublished ? "published" : "draft",
          category: n.category,
        }));

        setNews(transformedNews);
        setFilteredNews(transformedNews);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat berita");
      console.error("Error loading news:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter news
  useEffect(() => {
    // Use API search if available, otherwise filter client-side
    if (searchQuery || selectedCategory !== "all") {
      loadNewsWithFilters();
    } else {
      setFilteredNews(news);
    }
  }, [searchQuery, selectedCategory]);

  const loadNewsWithFilters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsAPI.getAllNews({
        limit: 100,
        search: searchQuery || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      });

      if (response.success) {
        const transformedNews: News[] = response.data.news.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          excerpt: n.excerpt,
          imageUrl: n.imageUrl || "",
          publishDate: n.publishedAt
            ? new Date(n.publishedAt).toISOString().split("T")[0]
            : "",
          author: n.authorName,
          status: n.isPublished ? "published" : "draft",
          category: n.category,
        }));

        setFilteredNews(transformedNews);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat berita");
      console.error("Error loading news:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle search input change dengan debounce (opsional)
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);

    // Clear timer sebelumnya
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set timer baru - search otomatis setelah 1 detik tidak mengetik
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(value);
    }, 1000); // 1 detik delay
  };

  // ✅ Handle Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Clear debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Langsung search
      setSearchQuery(searchInput);
    }
  };

  // ✅ Handle onBlur (cursor keluar dari input)
  const handleSearchBlur = () => {
    // Clear debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    // Search saat blur
    setSearchQuery(searchInput);
  };

  // Get unique categories
  const categories = Array.from(new Set(news.map((n) => n.category)));

  return (
    <div className="space-y-6">
      {/* Header - tetap sama */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#4B2E05] mb-2">Berita & Update</h2>
          <p className="text-gray-600">
            Update terbaru dan informasi seputar PilahKopi
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Error Message - tetap sama */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filter & Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ✅ Search dengan kontrol baru */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari berita... (tekan Enter atau klik di luar untuk mencari)"
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onBlur={handleSearchBlur}
                className="pl-10"
                disabled={loading}
              />
            </div>

            {/* Category Filter - tetap sama */}
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      {/* News Count */}
      <div className="flex items-center gap-2 text-gray-600">
        <FileText className="w-4 h-4" />
        <span>Menampilkan {filteredNews.length} berita</span>
      </div>

      {/* News Grid */}
      {loading && filteredNews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Memuat berita...</p>
          </CardContent>
        </Card>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((newsItem) => (
            <Card
              key={newsItem.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white group cursor-pointer"
              onClick={() => setSelectedNews(newsItem)}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-gray-200">
                <ImageWithFallback
                  src={newsItem.imageUrl}
                  alt={newsItem.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-[#56743D] text-white">
                    {newsItem.category}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-6">
                {/* Date & Author */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{newsItem.publishDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{newsItem.author}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-[#4B2E05] mb-3 line-clamp-2 group-hover:text-[#56743D] transition-colors">
                  {newsItem.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {newsItem.excerpt}
                </p>

                {/* Read More */}
                <Button
                  variant="ghost"
                  className="text-[#56743D] hover:text-[#4C7C2E] hover:bg-[#F5E6CA] gap-2 px-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNews(newsItem);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Baca Selengkapnya
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 mb-2">Tidak Ada Berita</h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== "all"
                ? "Tidak ada berita yang sesuai dengan filter Anda"
                : "Belum ada berita yang dipublikasikan"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      {selectedNews && (
        <Dialog
          open={!!selectedNews}
          onOpenChange={() => setSelectedNews(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="space-y-4">
                {/* Image */}
                {selectedNews.imageUrl && (
                  <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-200">
                    <ImageWithFallback
                      src={selectedNews.imageUrl}
                      alt={selectedNews.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Category Badge */}
                <Badge className="bg-[#56743D] text-white">
                  {selectedNews.category}
                </Badge>

                {/* Title */}
                <DialogTitle className="text-[#4B2E05]">
                  {selectedNews.title}
                </DialogTitle>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedNews.publishDate}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedNews.author}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Excerpt */}
              <p className="text-gray-700 italic border-l-4 border-[#56743D] pl-4 bg-[#F5E6CA] p-3 rounded">
                {selectedNews.excerpt}
              </p>

              {/* Content */}
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedNews.content}
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>ID: {selectedNews.id}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedNews(null)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
