import { useState, useEffect } from "react";
import { forumAPI } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  Pin,
  MessageCircle,
  Clock,
  Shield,
  User as UserIcon,
  ArrowLeft,
  Trash2,
} from "lucide-react";

interface ForumProps {
  userRole: "admin" | "user";
  userName: string;
}

interface Message {
  id: string;
  authorName: string;           // ✅ Use authorName consistently
  authorRole: "admin" | "user"; // ✅ Use authorRole consistently
  content: string;
  createdAt: string;            // ✅ Use createdAt for raw timestamp

  replies?: Message[];
}



interface Thread {
  id: string;
  title: string;
  content?: string;
  author: string;
  role: "admin" | "user";
  timestamp: string;
  category: string;
  isPinned: boolean;
  messagesCount: number;
  viewsCount?: number;
  lastActivity: string;
  messages: Message[];
}

// ========================================
// DATE FORMATTING FUNCTIONS
// ========================================

/**
 * Format date untuk Threads (list view)
 */
const formatThreadDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    console.warn('formatThreadDate: dateString is null/undefined');
    return 'Tanggal tidak valid';
  }

  try {
    let normalizedDate = dateString;

    if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = `${dateString}Z`;
    }

    const date = new Date(normalizedDate);

    if (isNaN(date.getTime())) {
      console.error('formatThreadDate: Invalid date after parsing:', dateString);
      return 'Tanggal tidak valid';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) return 'Baru saja';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 10) return 'Baru saja';
    if (diffSecs < 60) return `${diffSecs} detik yang lalu`;
    if (diffMins === 1) return '1 menit yang lalu';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours === 1) return '1 jam yang lalu';
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return '1 hari yang lalu';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch (error) {
    console.error('formatThreadDate error:', error, 'Input:', dateString);
    return 'Tanggal tidak valid';
  }
};

/**
 * Format date untuk Messages (detail view)
 */
const formatMessageDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    console.warn('formatMessageDate: dateString is null/undefined');
    return 'Tanggal tidak valid';
  }

  try {
    let normalizedDate = dateString;

    if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDate = `${dateString}Z`;
    }

    const date = new Date(normalizedDate);

    if (isNaN(date.getTime())) {
      console.error('formatMessageDate: Invalid date after parsing:', dateString);
      return 'Tanggal tidak valid';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) return 'Baru saja';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 10) return 'Baru saja';
    if (diffSecs < 60) return `${diffSecs} detik yang lalu`;
    if (diffMins === 1) return '1 menit yang lalu';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours === 1) return '1 jam yang lalu';
    if (diffHours < 24) return `${diffHours} jam yang lalu`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);

    if (messageDate.getTime() === today.getTime()) {
      return `Hari ini ${date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return `Kemarin ${date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`;
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch (error) {
    console.error('formatMessageDate error:', error, 'Input:', dateString);
    return 'Tanggal tidak valid';
  }
};

// ========================================
// FORUM COMPONENT
// ========================================

const Forum: React.FC<ForumProps> = ({ userRole, userName }) => {
  // State declarations
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('umum');

  // Delete states
  const [showDeleteThreadDialog, setShowDeleteThreadDialog] = useState(false);
  const [showDeleteMessageDialog, setShowDeleteMessageDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const categories = [
    { label: 'Semua', value: 'Semua' },
    { label: 'Umum', value: 'umum' },
    { label: 'Tutorial', value: 'tutorial' },
    { label: 'Diskusi', value: 'diskusi' },
    { label: 'Fitur Request', value: 'fitur-request' },
    { label: 'Bantuan', value: 'bantuan' },
    { label: 'Pengumuman', value: 'pengumuman' },
  ];

  // Load threads on mount and when category changes
  useEffect(() => {
    loadThreads();
  }, [activeCategory]); // ✅ Removed searchQuery from dependency to prevent auto-search

  // Load thread messages when thread is selected
  useEffect(() => {
    if (selectedThread) {
      loadThreadMessages(selectedThread.id);
    }
  }, [selectedThread?.id]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      // ✅ Pass search query and category to API
      const response = await forumAPI.getThreads({
        limit: 50,
        search: searchQuery,
        category: activeCategory === 'Semua' ? undefined : activeCategory
      });

      if (response.success && Array.isArray(response.data)) {
        const formattedThreads = response.data.map((t: any) => ({
          id: t.id,
          title: t.title,
          content: t.content,
          author: t.authorName || 'Unknown',
          role: t.authorRole || 'user',
          timestamp: formatThreadDate(t.createdAt),
          category: t.category || 'Umum',
          isPinned: t.isPinned || false,
          messagesCount: t.messagesCount || 0,
          viewsCount: t.viewsCount || 0,
          lastActivity: formatThreadDate(t.lastActivity || t.createdAt),
          messages: [],
        }));

        setThreads(formattedThreads);
      }
    } catch (err: any) {
      console.error('❌ Error loading threads:', err);
      setError(err.message || 'Gagal memuat thread');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle search trigger
  const handleSearch = () => {
    loadThreads();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      setLoading(true);
      const response = await forumAPI.getThreadMessages(threadId);

      if (response.success) {
        let messages: any[] = [];

        if (response.data && Array.isArray(response.data.messages)) {
          messages = response.data.messages;
        }

        const formattedMessages: Message[] = messages.map((m: any) => ({
          id: m.id,
          authorName: m.authorName || 'Unknown',
          authorRole: (m.authorRole || 'user') as 'admin' | 'user',
          content: m.content || '',
          createdAt: m.createdAt || new Date().toISOString(),
          replies: m.replies?.map((r: any) => ({
            id: r.id,
            authorName: r.authorName || 'Unknown',
            authorRole: 'user' as const,
            content: r.content || '',
            createdAt: r.createdAt || new Date().toISOString(),
          })) || [],
        }));

        setThreadMessages(formattedMessages);
      }
    } catch (err: any) {
      console.error('❌ Error loading messages:', err);
      setError(err.message || 'Gagal memuat pesan');
      setThreadMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    try {
      const response = await forumAPI.postMessage(selectedThread.id, {
        content: newMessage,
      });

      if (response.success) {
        setNewMessage('');
        await loadThreadMessages(selectedThread.id);

        // ✅ Locally update the thread's lastActivity and messagesCount
        setThreads(prevThreads =>
          prevThreads.map(thread =>
            thread.id === selectedThread.id
              ? {
                ...thread,
                lastActivity: formatThreadDate(response.data.createdAt || new Date().toISOString()),
                messagesCount: thread.messagesCount + 1
              }
              : thread
          )
        );

        console.log('✅ Message sent and thread updated locally');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await forumAPI.createThread({
        title: newThreadTitle,
        content: newThreadContent,
        category: newThreadCategory,
      });

      if (response.success) {
        setNewThreadTitle('');
        setNewThreadContent('');
        setNewThreadCategory('umum');
        setIsCreateDialogOpen(false);
        await loadThreads();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat thread');
      console.error('Error creating thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = (thread: Thread) => {
    setSelectedThread(thread);
    setThreadMessages([]); // Reset messages while loading
  };

  const handleDeleteThread = async () => {
    if (!selectedThread) return;

    try {
      const response = await forumAPI.deleteThread(selectedThread.id);

      if (response.success) {
        setShowDeleteThreadDialog(false);
        setSelectedThread(null);
        await loadThreads();
        console.log('✅ Thread deleted successfully');
      }
    } catch (error) {
      console.error('❌ Error deleting thread:', error);
      alert('Failed to delete thread: ' + (error as Error).message);
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !selectedThread) return;

    try {
      const response = await forumAPI.deleteMessage(messageToDelete);

      if (response.success) {
        setShowDeleteMessageDialog(false);
        setMessageToDelete(null);
        await loadThreadMessages(selectedThread.id);

        // Update thread message count locally
        setThreads(prevThreads =>
          prevThreads.map(thread =>
            thread.id === selectedThread.id
              ? { ...thread, messagesCount: Math.max(0, thread.messagesCount - 1) }
              : thread
          )
        );

        console.log('✅ Message deleted successfully');
      }
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      alert('Failed to delete message: ' + (error as Error).message);
    }
  };







  if (selectedThread) {
    return (
      <div className="h-full flex flex-col bg-white rounded-xl shadow-lg">
        {/* Thread Header */}
        <div className="p-6 border-b">
          <Button
            variant="ghost"
            onClick={() => setSelectedThread(null)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Forum
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title dengan Pin */}
              <div className="flex items-center gap-3 mb-3">
                {selectedThread.isPinned && (
                  <Pin className="w-5 h-5 text-[#C2513D] fill-[#C2513D]/20" />
                )}
                <h2 className="text-2xl font-bold text-[#4B2E05]">
                  {selectedThread.title}
                </h2>
              </div>

              {/* Content Post */}
              {selectedThread.content && (
                <div className="mb-4 p-4 bg-[#F5E6CA]/10 rounded-lg border-l-4 border-[#4C7C2E]">
                  <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {selectedThread.content}
                  </p>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback
                      className={
                        selectedThread.role === "admin"
                          ? "bg-red-100 text-red-700 text-sm"
                          : "bg-blue-100 text-blue-700 text-sm"
                      }
                    >
                      {selectedThread.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900">
                    {selectedThread.author}
                  </span>
                  <Badge
                    className={
                      selectedThread.role === "admin"
                        ? "bg-red-600 text-white"
                        : "bg-blue-600 text-white"
                    }
                  >
                    {selectedThread.role === "admin" ? "Admin" : "User"}
                  </Badge>
                </div>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {selectedThread.timestamp}
                </span>
                <Badge variant="outline" className="font-medium">
                  {selectedThread.category}
                </Badge>
                {selectedThread.messagesCount > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    {selectedThread.messagesCount} Replies
                  </span>
                )}
              </div>
            </div>

            {/* Delete Thread Button */}
            {(selectedThread.author === userName || userRole === 'admin') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteThreadDialog(true)}
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Thread
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        {/* Messages Rendering */}
        <ScrollArea className="flex-1 p-6">
          {!Array.isArray(threadMessages) || threadMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet</p>
            </div>
          ) : (
            threadMessages.map((message) => {
              // ✅ ADD DEBUG HERE
              console.log('🔍 Message ID:', message.id);
              console.log('📅 createdAt value:', message.createdAt);
              console.log('📅 Type:', typeof message.createdAt);
              console.log('---');

              return (
                <Card key={message.id} className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback
                            className={
                              message.authorRole === "admin"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {message.authorName?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{message.authorName}</span>

                        <Badge
                          className={
                            message.authorRole === "admin"
                              ? "bg-red-600 text-white"
                              : "bg-blue-600 text-white"
                          }
                        >
                          {message.authorRole === "admin" ? "Admin" : "User"}
                        </Badge>

                        <span className="text-sm text-gray-500">
                          {formatMessageDate(message.createdAt)}
                        </span>
                      </div>

                      {/* Delete Message Button */}
                      {(message.authorName === userName || userRole === 'admin') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMessageToDelete(message.id);
                            setShowDeleteMessageDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </ScrollArea>


        {/* Reply Input */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback
                className={
                  userRole === "admin"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }
              >
                {userName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-3">
              <Textarea
                placeholder="Tulis balasan Anda..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="resize-none"
                rows={3}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-[#4C7C2E] hover:bg-[#5D8C48]"
                disabled={!newMessage.trim() || loading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Delete Thread Confirmation Dialog */}
        <AlertDialog open={showDeleteThreadDialog} onOpenChange={setShowDeleteThreadDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Thread?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus thread ini? Semua pesan di dalamnya juga akan dihapus.
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteThread}
                className="bg-red-600 hover:bg-red-700"
              >
                Hapus Thread
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Message Confirmation Dialog */}
        <AlertDialog open={showDeleteMessageDialog} onOpenChange={setShowDeleteMessageDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Pesan?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMessage}
                className="bg-red-600 hover:bg-red-700"
              >
                Hapus Pesan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#4B2E05] mb-2">Forum Diskusi</h2>
          <p className="text-gray-600">
            Diskusikan seputar sistem sortir kopi dengan admin dan pengguna
            lainnya
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#4C7C2E] hover:bg-[#5D8C48] gap-2">
              <Plus className="w-4 h-4" />
              Buat Topik Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#4B2E05]">
                Buat Topik Diskusi Baru
              </DialogTitle>
              <DialogDescription>
                Mulai diskusi baru dengan admin dan pengguna lainnya
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Topik</Label>
                <Input
                  id="title"
                  placeholder="Masukkan judul topik diskusi"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  value={newThreadCategory}
                  onChange={(e) => setNewThreadCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C7C2E]"
                >
                  {categories
                    .filter(c => c.value !== 'Semua')
                    .map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Isi Topik (Original Post)</Label>
                <Textarea
                  id="content"
                  placeholder="Tuliskan isi topik diskusi Anda..."
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-gray-500">
                  Ini adalah konten utama dari topik yang akan dibuat
                </p>
              </div>


              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleCreateThread}
                  className="bg-[#4C7C2E] hover:bg-[#5D8C48]"
                  disabled={
                    !newThreadTitle.trim() ||
                    !newThreadContent.trim() ||
                    loading
                  }
                >
                  {loading ? "Membuat..." : "Buat Topik"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Cari topik diskusi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown} // ✅ Trigger search on Enter
            onBlur={handleSearch}     // ✅ Trigger search on Blur
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Badge
            key={category.value}
            variant={activeCategory === category.value ? "default" : "outline"} // ✅ Highlight active category
            className={`px-4 py-2 cursor-pointer transition-colors ${activeCategory === category.value
              ? "bg-[#4C7C2E] hover:bg-[#5D8C48]"
              : "hover:bg-[#F5E6CA]"
              }`}
            onClick={() => setActiveCategory(category.value)} // ✅ Set active category
          >
            {category.label}
          </Badge>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Thread List */}
      {loading && threads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Memuat threads...</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {threads.map((thread) => (
          <Card
            key={thread.id}
            className="cursor-pointer hover:shadow-lg transition-all border-0 shadow-md"
            onClick={() => handleThreadClick(thread)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback
                    className={
                      thread.role === "admin"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }
                  >
                    {thread.author[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {thread.isPinned && (
                        <Pin className="w-4 h-4 text-[#C2513D]" />
                      )}
                      <h3 className="text-[#4B2E05]">{thread.title}</h3>
                    </div>
                    <Badge variant="outline">{thread.category}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <span>{thread.author}</span>
                      <Badge
                        className={
                          thread.role === "admin" ? "bg-red-600" : "bg-blue-600"
                        }
                      >
                        {thread.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {thread.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-gray-600">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>{thread.messagesCount} pesan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Terakhir: {thread.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && threads.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-[#4B2E05] mb-2">Tidak Ada Topik Ditemukan</h3>
            <p className="text-gray-600">
              Coba gunakan kata kunci lain atau buat topik baru
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Thread Confirmation Dialog */}
      <AlertDialog open={showDeleteThreadDialog} onOpenChange={setShowDeleteThreadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Thread?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus thread ini? Semua pesan di dalamnya juga akan dihapus.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteThread}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Thread
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Message Confirmation Dialog */}
      <AlertDialog open={showDeleteMessageDialog} onOpenChange={setShowDeleteMessageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Pesan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Forum;
