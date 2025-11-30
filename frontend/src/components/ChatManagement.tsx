import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, User, Bot, Trash2, RefreshCw, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatConversation {
  userId: string;
  userName: string;
  messages: Message[];
  lastMessage: string;
  lastTimestamp: Date;
  unread: number;
}

const ChatManagement: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'unread'>('recent');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    const allChats = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    const parsedChats = allChats.map((chat: any) => ({
      ...chat,
      messages: chat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      lastTimestamp: new Date(chat.lastTimestamp)
    }));
    setConversations(parsedChats);
  };

  const markAsRead = (userId: string) => {
    const allChats = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    const chatIndex = allChats.findIndex((chat: any) => chat.userId === userId);
    
    if (chatIndex >= 0) {
      allChats[chatIndex].unread = 0;
      localStorage.setItem('chatMessages', JSON.stringify(allChats));
      loadConversations();
    }
  };

  const deleteConversation = (userId: string) => {
    const allChats = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    const filteredChats = allChats.filter((chat: any) => chat.userId !== userId);
    localStorage.setItem('chatMessages', JSON.stringify(filteredChats));
    loadConversations();
    if (selectedChat?.userId === userId) {
      setSelectedChat(null);
    }
  };

  const deleteAllConversations = () => {
    localStorage.removeItem('chatMessages');
    setConversations([]);
    setSelectedChat(null);
  };

  const getTotalUnread = () => {
    return conversations.reduce((sum, conv) => sum + conv.unread, 0);
  };

  const getTotalMessages = () => {
    return conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
  };

  const getFilteredConversations = () => {
    let filtered = conversations;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus === 'unread') {
      filtered = filtered.filter(conv => conv.unread > 0);
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime());
    } else if (sortBy === 'unread') {
      filtered.sort((a, b) => b.unread - a.unread);
    }

    return filtered;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    }
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredConversations = getFilteredConversations();

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div>
        <h2 className="text-gray-900 mb-2">Kelola Chat</h2>
        <p className="text-gray-600">Monitor dan kelola percakapan chatbot dengan pengguna</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Percakapan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" style={{ color: '#4B2E05' }} />
              <span className="text-2xl">{conversations.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Pesan Belum Dibaca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {getTotalUnread()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Pesan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTotalMessages()}</span>
              <span className="text-gray-500 text-sm">pesan</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Percakapan</CardTitle>
            <CardDescription>
              {getTotalUnread() > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {getTotalUnread()} belum dibaca
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search & Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari pengguna..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="unread">Belum Dibaca</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Terbaru</SelectItem>
                    <SelectItem value="unread">Belum Dibaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadConversations}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>

                {conversations.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Semua
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Semua Percakapan?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini tidak dapat dibatalkan. Semua riwayat percakapan akan dihapus permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAllConversations} className="bg-red-600">
                          Hapus Semua
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Conversation List */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Belum ada percakapan</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.userId}
                      onClick={() => {
                        setSelectedChat(conv);
                        markAsRead(conv.userId);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedChat?.userId === conv.userId
                          ? 'border-[#4B2E05] bg-[#F5E6CA]/20'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: '#56743D' }}
                            >
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{conv.userName}</p>
                              <p className="text-xs text-gray-500 truncate">{conv.userId}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 truncate ml-10">
                            {conv.lastMessage}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {formatDate(conv.lastTimestamp)}
                          </span>
                          {conv.unread > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conv.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedChat ? selectedChat.userName : 'Pilih Percakapan'}
                </CardTitle>
                {selectedChat && (
                  <CardDescription>{selectedChat.userId}</CardDescription>
                )}
              </div>
              {selectedChat && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Percakapan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Riwayat percakapan dengan {selectedChat.userName} akan dihapus permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteConversation(selectedChat.userId)}
                        className="bg-red-600"
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedChat ? (
              <ScrollArea className="h-[550px]">
                <div className="space-y-4">
                  {selectedChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: message.sender === 'user' ? '#56743D' : '#F5E6CA' }}
                        >
                          {message.sender === 'user' ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4" style={{ color: '#4B2E05' }} />
                          )}
                        </div>
                        <div>
                          <div
                            className={`rounded-lg p-3 ${
                              message.sender === 'user'
                                ? 'text-white'
                                : 'text-gray-800'
                            }`}
                            style={{
                              backgroundColor: message.sender === 'user' ? '#56743D' : '#F5E6CA'
                            }}
                          >
                            <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-1">
                            {formatFullDate(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[550px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Pilih percakapan untuk melihat pesan</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Chatbot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="mb-2" style={{ color: '#4B2E05' }}>Topik yang Dijawab Bot:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Layanan & Paket Sortir</li>
                <li>• Harga & Biaya</li>
                <li>• Cara Pemesanan</li>
                <li>• Metode Pembayaran</li>
                <li>• Status Pesanan</li>
                <li>• Teknologi Mesin</li>
                <li>• Pengiriman & Alamat</li>
                <li>• Kontak & Jam Operasional</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2" style={{ color: '#4B2E05' }}>Status Bot:</h4>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-green-400 text-green-400">
                    <div className="h-2 w-2 rounded-full bg-green-400 mr-1 animate-pulse" />
                    Online 24/7
                  </Badge>
                </div>
                <p>Bot akan merespons otomatis berdasarkan keyword dalam pertanyaan pengguna.</p>
                <p>Semua percakapan tersimpan dan dapat dipantau oleh admin.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatManagement;
