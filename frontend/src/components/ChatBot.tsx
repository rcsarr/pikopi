import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, X, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatBotProps {
  currentUser: {
    name: string;
    email: string;
  };
}

const ChatBot: React.FC<ChatBotProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
    
    // Welcome message for first time users
    const hasWelcomed = localStorage.getItem(`welcomed_${currentUser.email}`);
    if (!hasWelcomed) {
      setTimeout(() => {
        const welcomeMsg: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Halo ${currentUser.name}! 👋 Saya PilahBot, asisten virtual PilahKopi. Saya siap membantu Anda dengan informasi tentang layanan sortir kopi kami. Ada yang bisa saya bantu?`,
          timestamp: new Date()
        };
        setMessages([welcomeMsg]);
        saveChatHistory([welcomeMsg]);
        localStorage.setItem(`welcomed_${currentUser.email}`, 'true');
      }, 500);
    }
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = () => {
    const allChats = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    const userChat = allChats.find((chat: any) => chat.userId === currentUser.email);
    
    if (userChat && userChat.messages) {
      const loadedMessages = userChat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(loadedMessages);
    }
  };

  const saveChatHistory = (msgs: Message[]) => {
    const allChats = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    const chatIndex = allChats.findIndex((chat: any) => chat.userId === currentUser.email);
    
    const chatData = {
      userId: currentUser.email,
      userName: currentUser.name,
      messages: msgs,
      lastMessage: msgs[msgs.length - 1]?.text || '',
      lastTimestamp: msgs[msgs.length - 1]?.timestamp || new Date(),
      unread: msgs.filter(m => m.sender === 'user').length
    };

    if (chatIndex >= 0) {
      allChats[chatIndex] = chatData;
    } else {
      allChats.push(chatData);
    }

    localStorage.setItem('chatMessages', JSON.stringify(allChats));
  };

  const getBotResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();

    // Greeting
    if (lowerMsg.match(/\b(hai|halo|hello|hi|selamat)\b/)) {
      return 'Halo! Senang bisa membantu Anda. Ada yang ingin ditanyakan tentang layanan sortir kopi kami? 😊';
    }

    // Services & Packages
    if (lowerMsg.match(/\b(layanan|jasa|servis|paket|harga|biaya|tarif)\b/)) {
      return `Kami menyediakan 3 paket layanan sortir biji kopi Arabika:\n\n📦 Basic - Rp 50.000/kg\n- Sortir otomatis dengan sensor dasar\n- Waktu proses: 2-3 hari\n- Laporan hasil sortir\n\n📦 Standard - Rp 100.000/kg\n- Sortir dengan AI detection\n- Waktu proses: 1-2 hari\n- Laporan detail + foto\n\n📦 Premium - Rp 150.000/kg\n- Triple sorting dengan quality check\n- Waktu proses: 1 hari\n- Video proses + sertifikat kualitas\n\nBerminat memesan? Silakan buka menu "Pesan Jasa Sortir"!`;
    }

    // Ordering process
    if (lowerMsg.match(/\b(pesan|order|cara|bagaimana|beli)\b/)) {
      return 'Cara memesan sangat mudah:\n\n1️⃣ Buka menu "Pesan Jasa Sortir"\n2️⃣ Pilih paket yang sesuai kebutuhan\n3️⃣ Isi detail pesanan (berat, alamat)\n4️⃣ Pilih metode pembayaran\n5️⃣ Upload bukti transfer\n6️⃣ Tunggu verifikasi dari admin\n\nSetelah pembayaran terverifikasi, Anda bisa mengirim biji kopi ke alamat kami!';
    }

    // Payment methods
    if (lowerMsg.match(/\b(bayar|pembayaran|transfer|payment|bank|ewallet|gopay|ovo|dana)\b/)) {
      return 'Kami menerima berbagai metode pembayaran:\n\n🏦 Transfer Bank:\n- BCA: 1234567890 a/n PilahKopi\n- BNI: 0987654321 a/n PilahKopi\n- Mandiri: 1122334455 a/n PilahKopi\n\n💳 E-Wallet:\n- GoPay: 081234567890\n- OVO: 081234567890\n- DANA: 081234567890\n\nSetelah transfer, jangan lupa upload bukti pembayaran ya!';
    }

    // Order status
    if (lowerMsg.match(/\b(status|pesanan|order|tracking|lacak)\b/)) {
      return 'Untuk mengecek status pesanan Anda:\n\n1. Buka menu "Pesanan Saya"\n2. Lihat daftar semua pesanan\n3. Status akan ditampilkan (Pending, Processing, Completed)\n\nAnda juga bisa melihat detail pesanan dan riwayat pembayaran di sana!';
    }

    // Machine & Technology
    if (lowerMsg.match(/\b(mesin|teknologi|robot|ai|computer vision|sensor)\b/)) {
      return 'PilahKopi menggunakan teknologi canggih:\n\n🤖 Robotika precision sorting\n👁️ Computer vision dengan AI\n📊 Sensor kualitas multi-spektrum\n⚙️ Sistem otomatis terintegrasi\n\nSemua mesin dipantau real-time untuk memastikan kualitas sortir terbaik!';
    }

    // Quality & Results
    if (lowerMsg.match(/\b(kualitas|hasil|akurasi|jaminan|garansi)\b/)) {
      return 'Kami menjamin kualitas sortir terbaik:\n\n✅ Akurasi sortir hingga 99.5%\n✅ Pemisahan biji cacat & biji baik\n✅ Laporan detail hasil sortir\n✅ Garansi kepuasan pelanggan\n\nSemua paket dilengkapi dokumentasi lengkap!';
    }

    // Delivery & Shipping
    if (lowerMsg.match(/\b(kirim|pengiriman|alamat|lokasi|antar)\b/)) {
      return 'Untuk pengiriman biji kopi:\n\n📍 Alamat kami:\nJl. Kopi Arabika No. 123\nMalang, Jawa Timur 65141\n\n📦 Anda bisa mengirim via:\n- JNE, JNT, SiCepat\n- Atau antar langsung ke lokasi kami\n\nSetelah proses selesai, kami akan kirim balik ke alamat Anda!';
    }

    // Contact & Support
    if (lowerMsg.match(/\b(kontak|hubungi|telepon|email|whatsapp|wa)\b/)) {
      return 'Hubungi kami:\n\n📞 Telepon: (0341) 123-4567\n📱 WhatsApp: 0812-3456-7890\n📧 Email: info@pilahkopi.com\n\n⏰ Jam operasional:\nSenin - Jumat: 08.00 - 17.00 WIB\nSabtu: 08.00 - 12.00 WIB';
    }

    // Hours & Schedule
    if (lowerMsg.match(/\b(jam|buka|tutup|operasional|jadwal)\b/)) {
      return 'Jam operasional PilahKopi:\n\n⏰ Senin - Jumat: 08.00 - 17.00 WIB\n⏰ Sabtu: 08.00 - 12.00 WIB\n⏰ Minggu & Hari Libur: Tutup\n\nMesin sortir beroperasi 24/7 untuk proses yang lebih cepat!';
    }

    // Thanks
    if (lowerMsg.match(/\b(terima kasih|thanks|makasih|tengkyu)\b/)) {
      return 'Sama-sama! Senang bisa membantu. Jangan ragu untuk bertanya lagi jika ada yang ingin ditanyakan. Selamat menikmati layanan PilahKopi! ☕😊';
    }

    // Goodbye
    if (lowerMsg.match(/\b(bye|dadah|sampai jumpa|selesai)\b/)) {
      return 'Sampai jumpa! Terima kasih telah menggunakan layanan PilahKopi. Semoga biji kopi Anda menghasilkan kualitas terbaik! ☕👋';
    }

    // Default response
    return 'Maaf, saya belum memahami pertanyaan Anda. Saya bisa membantu dengan informasi tentang:\n\n• Layanan & Paket\n• Cara Pemesanan\n• Metode Pembayaran\n• Status Pesanan\n• Teknologi Mesin\n• Kualitas & Hasil\n• Pengiriman\n• Kontak Kami\n\nSilakan tanyakan sesuai topik di atas! 😊';
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = getBotResponse(inputValue);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };

      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      setIsTyping(false);
    }, 800 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  if (isMinimized) {
    return (
      <Button
        onClick={() => setIsMinimized(false)}
        className="h-14 px-6 rounded-full shadow-2xl hover:shadow-xl transition-all hover:scale-105"
        style={{ backgroundColor: '#4B2E05' }}
      >
        <Bot className="mr-2 h-5 w-5" />
        Chat dengan PilahBot
      </Button>
    );
  }

  return (
    <div className="w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-6rem)] sm:max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ backgroundColor: '#4B2E05' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5E6CA' }}>
            <Bot className="h-6 w-6" style={{ color: '#4B2E05' }} />
          </div>
          <div>
            <h3 className="text-white">PilahBot</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-400 text-green-400 text-xs">
                <div className="h-2 w-2 rounded-full bg-green-400 mr-1 animate-pulse" />
                Online
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(true)}
          className="text-white hover:bg-white/10"
        >
          <Minimize2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth chatbot-messages">
        <div className="space-y-4">
          {messages.map((message) => (
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
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[80%]">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#F5E6CA' }}
                >
                  <Bot className="h-4 w-4" style={{ color: '#4B2E05' }} />
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F5E6CA' }}>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t flex-shrink-0 bg-white">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ketik pesan Anda..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            style={{ backgroundColor: '#4B2E05' }}
            className="text-white hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tips: Tanyakan tentang layanan, harga, cara order, atau pembayaran
        </p>
      </div>
    </div>
  );
};

export default ChatBot;
