import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { newsAPI } from "../services/api";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
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

export default function NewsManagement() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load news from API
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get all news (including drafts) for admin
      const response = await newsAPI.getAllNews({
        limit: 100,
        includeDrafts: true,
      });
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
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat berita");
      console.error("Error loading news:", err);
    } finally {
      setLoading(false);
    }
  };

  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [deletingNews, setDeletingNews] = useState<News | null>(null);
  const [viewingNews, setViewingNews] = useState<News | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    imageUrl: "",
    category: "",
    status: "draft" as "published" | "draft",
  });

  // Open create dialog
  const handleCreate = () => {
    setEditingNews(null);
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      imageUrl: "",
      category: "",
      status: "draft",
    });
    setShowDialog(true);
  };

  // Open edit dialog
  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      excerpt: newsItem.excerpt,
      imageUrl: newsItem.imageUrl,
      category: newsItem.category,
      status: newsItem.status,
    });
    setShowDialog(true);
  };

  // Save news (create or update)
  const handleSave = async () => {
    if (!formData.title || !formData.content || !formData.excerpt) {
      setError("Judul, konten, dan ringkasan wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingNews) {
        // Update existing news
        const response = await newsAPI.updateNews(editingNews.id, {
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          category: formData.category,
          imageUrl: formData.imageUrl || undefined,
          isPublished: formData.status === "published",
        });

        if (response.success) {
          await loadNews(); // Reload news
          setShowDialog(false);
          resetForm();
        }
      } else {
        // Create new news
        const response = await newsAPI.createNews({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          category: formData.category,
          imageUrl: formData.imageUrl || undefined,
          isPublished: formData.status === "published",
        });

        if (response.success) {
          await loadNews(); // Reload news
          setShowDialog(false);
          resetForm();
        }
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan berita");
      console.error("Error saving news:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      imageUrl: "",
      category: "",
      status: "draft",
    });
  };

  // Delete news
  const handleDelete = async () => {
    if (!deletingNews) return;

    try {
      setLoading(true);
      setError(null);
      const response = await newsAPI.deleteNews(deletingNews.id);
      if (response.success) {
        await loadNews(); // Reload news
        setShowDeleteDialog(false);
        setDeletingNews(null);
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghapus berita");
      console.error("Error deleting news:", err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle status
  const toggleStatus = async (newsId: string) => {
    const newsItem = news.find((n) => n.id === newsId);
    if (!newsItem) return;

    try {
      setLoading(true);
      setError(null);
      const newStatus = newsItem.status === "published" ? false : true;
      const response = await newsAPI.updateNews(newsId, {
        isPublished: newStatus,
      });
      if (response.success) {
        await loadNews(); // Reload news
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengubah status berita");
      console.error("Error toggling status:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: news.length,
    published: news.filter((n) => n.status === "published").length,
    draft: news.filter((n) => n.status === "draft").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#4B2E05] mb-2">Kelola Berita</h2>
          <p className="text-gray-600">
            Buat dan kelola berita untuk ditampilkan di landing page
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-[#56743D] hover:bg-[#4C7C2E] gap-2"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          Tambah Berita
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-700" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Berita</p>
                <div className="text-[#4B2E05]">{stats.total}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Terpublikasi</p>
                <div className="text-[#4B2E05]">{stats.published}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Draft</p>
                <div className="text-[#4B2E05]">{stats.draft}</div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* News Table */}
      <Card>
        <CardContent className="p-0">
          {loading && news.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">Memuat berita...</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tanggal Publikasi</TableHead>
                  <TableHead>Penulis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.map((newsItem) => (
                  <TableRow key={newsItem.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-[#4B2E05]">{newsItem.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-[#4B2E05] line-clamp-1">
                          {newsItem.title}
                        </p>
                        <p className="text-gray-500 text-sm line-clamp-1">
                          {newsItem.excerpt}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#56743D] text-white">
                        {newsItem.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {newsItem.publishDate || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{newsItem.author}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleStatus(newsItem.id)}
                        className="cursor-pointer"
                        disabled={loading}
                      >
                        <Badge
                          className={
                            newsItem.status === "published"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          }
                        >
                          {newsItem.status === "published"
                            ? "Terpublikasi"
                            : "Draft"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewingNews(newsItem)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(newsItem)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeletingNews(newsItem);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#4B2E05]">
              {editingNews ? "Edit Berita" : "Tambah Berita Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingNews
                ? "Update informasi berita"
                : "Buat berita baru untuk ditampilkan di landing page"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Berita *</Label>
              <Input
                placeholder="Masukkan judul berita..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Input
                placeholder="Contoh: Penghargaan, Kemitraan, Update Teknologi"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Ringkasan (Excerpt) *</Label>
              <Textarea
                placeholder="Ringkasan singkat berita (1-2 kalimat)..."
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Konten Lengkap *</Label>
              <Textarea
                placeholder="Tulis konten berita lengkap di sini..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>URL Gambar</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status Publikasi</Label>
              <div className="flex gap-4">
                <button
                  onClick={() => setFormData({ ...formData, status: "draft" })}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${formData.status === "draft"
                    ? "border-[#56743D] bg-[#F5E6CA]"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <AlertCircle className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                  <p className="text-sm">Draft</p>
                </button>
                <button
                  onClick={() =>
                    setFormData({ ...formData, status: "published" })
                  }
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${formData.status === "published"
                    ? "border-[#56743D] bg-[#F5E6CA]"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <p className="text-sm">Publikasi</p>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#56743D] hover:bg-[#4C7C2E]"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : editingNews ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewingNews && (
        <Dialog open={!!viewingNews} onOpenChange={() => setViewingNews(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#4B2E05]">
                {viewingNews.title}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {viewingNews.publishDate}
                <span>•</span>
                <span>Oleh {viewingNews.author}</span>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {viewingNews.imageUrl && (
                <img
                  src={viewingNews.imageUrl}
                  alt={viewingNews.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <Badge className="bg-[#56743D] text-white">
                {viewingNews.category}
              </Badge>

              <p className="text-gray-700 italic">{viewingNews.excerpt}</p>

              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">
                  {viewingNews.content}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4B2E05]">Hapus Berita</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus berita ini?
            </DialogDescription>
          </DialogHeader>

          {deletingNews && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-700" />
              <AlertDescription className="text-red-700">
                <strong>{deletingNews.title}</strong> akan dihapus secara
                permanen dan tidak dapat dikembalikan.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
