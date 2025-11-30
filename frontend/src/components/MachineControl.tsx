import { useState, useRef, useEffect } from 'react';
import { machineAPI, machineControlAPI } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import {
  AlertTriangle,
  Activity,
  Thermometer,
  Video,
  VideoOff,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Box,
  Filter,
  Cpu,
  Upload,
  X,
  Zap,
  Layers,
  Server,
  Play,
  Pause,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface Machine {
  id: string;
  name: string;
  location: string;
  status: {
    power: boolean;
    temperature: number;
  };
  statistics: {
    processedToday: number;
    currentBatch: number; // This now represents "Sisa Batch Hari Ini"
    efficiency: number;
    errorRate: number;
  };
  logs: {
    id: number;
    message: string;
    time: string;
    type: 'success' | 'info' | 'warning';
  }[];
}

export default function MachineControl() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Add Machine State
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineLocation, setNewMachineLocation] = useState('');
  const [isAddingMachine, setIsAddingMachine] = useState(false);

  // Dummy Camera State
  const [selectedCamera, setSelectedCamera] = useState('Camera 1');
  const cameras = ['Camera 1', 'Camera 2', 'Camera 3', 'Camera 4', 'Camera 5'];

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const isCameraActiveRef = useRef(false);
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);
  const [detectionResult, setDetectionResult] = useState<{ status: 'healthy' | 'defect' | null, accuracy: number }>({
    status: null,
    accuracy: 0
  });
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Fetch Machines
  // Fetch Machines
  const fetchMachines = async () => {
    try {
      const response = await machineControlAPI.getMachines();
      if (response.success) {
        setMachines(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch machines:", error);
    }
  };

  // Auto-select first machine if none selected
  useEffect(() => {
    if (!selectedMachineId && machines.length > 0) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  // Toggle machine power (with database logging)
  const toggleMachinePower = async (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;

    try {
      // Call API to toggle power (this already creates a log in backend)
      const response = await machineControlAPI.toggleMachine(machineId, 'power');

      if (response.success) {
        // Just refresh to get the updated state from backend - no local state manipulation
        await fetchMachines();
      }
    } catch (error) {
      console.error('Failed to toggle machine power:', error);
      alert('Gagal mengubah status mesin. Silakan coba lagi.');
    }
  };

  // Complete batch (with database logging)
  const simulateBatchCompletion = async (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;

    if (!machine.status.power) {
      alert('Nyalakan mesin terlebih dahulu!');
      return;
    }

    if (machine.statistics.currentBatch === 0) {
      alert('Tidak ada batch yang perlu diselesaikan!');
      return;
    }

    try {
      const batchNumber = machine.statistics.processedToday + 1;

      // Save log to database via API
      const logMessage = `Batch #${batchNumber} selesai diproses dengan akurasi ${machine.statistics.efficiency}%`;
      await machineControlAPI.createLog(machineId, logMessage, 'success');

      // Just refresh to get the updated state from backend - no local state manipulation
      await fetchMachines();
    } catch (error: any) {
      console.error('Failed to complete batch:', error);
      alert('Gagal menyelesaikan batch.');
    }
  };

  // Add Machine
  const handleAddMachine = async () => {
    if (!newMachineName || !newMachineLocation) {
      alert('Nama dan Lokasi mesin harus diisi!');
      return;
    }

    setIsAddingMachine(true);
    try {
      const response = await machineControlAPI.createMachine({
        name: newMachineName,
        location: newMachineLocation
      });

      if (response.success) {
        alert('Mesin berhasil ditambahkan!');
        setIsAddMachineOpen(false);
        setNewMachineName('');
        setNewMachineLocation('');
        await fetchMachines();
      }
    } catch (error) {
      console.error('Failed to add machine:', error);
      alert('Gagal menambahkan mesin.');
    } finally {
      setIsAddingMachine(false);
    }
  };

  // Initial Fetch & Polling
  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentMachine = machines.find(m => String(m.id) === String(selectedMachineId));

  // Get logs for current machine - ONLY from database
  const currentMachineLogs = currentMachine
    ? (currentMachine.logs || [])
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 20) // Show only last 20 logs
    : [];

  // Toggle Video Stream (Webcam)
  const toggleVideoStream = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve(null);
            };
          }
        });

        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Play error:', playError);
        }

        setIsCameraActive(true);
        isCameraActiveRef.current = true;

        setTimeout(() => {
          startAnalysisLoop();
        }, 500);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      isCameraActiveRef.current = false;
      setDetectionResult({ status: null, accuracy: 0 });

      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
        analysisInterval.current = null;
      }
    }
  };

  const startAnalysisLoop = () => {
    if (analysisInterval.current) clearInterval(analysisInterval.current);

    analysisInterval.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && isCameraActiveRef.current) {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;

        if (videoWidth === 0 || videoHeight === 0) return;

        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
          context.drawImage(videoRef.current, 0, 0);

          canvasRef.current.toBlob(async (blob) => {
            if (blob) {
              try {
                const response = await machineAPI.analyzeFrame(blob);
                if (response.success) {
                  setDetectionResult({
                    status: response.data.status,
                    accuracy: response.data.accuracy
                  });
                  setAnalysisError(null);
                } else {
                  setAnalysisError("Analysis Failed");
                }
              } catch (error) {
                setAnalysisError("Connection Error");
              }
            }
          }, 'image/jpeg', 0.8);
        }
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUploadedFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
  };

  if (!currentMachine) return <div className="p-8 text-center text-gray-500">Memuat data mesin...</div>;

  // Calculate total statistics
  const totalStats = machines.reduce((acc, machine) => ({
    processedToday: acc.processedToday + machine.statistics.processedToday,
    avgEfficiency: acc.avgEfficiency + machine.statistics.efficiency,
    activeMachines: acc.activeMachines + (machine.status.power ? 1 : 0),
    totalMachines: machines.length
  }), { processedToday: 0, avgEfficiency: 0, activeMachines: 0, totalMachines: machines.length });

  // Correct average efficiency calculation
  totalStats.avgEfficiency = totalStats.totalMachines > 0 ? totalStats.avgEfficiency / totalStats.totalMachines : 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[#4B2E05] mb-2 text-2xl font-bold">Kontrol Mesin</h2>
          <p className="text-gray-600">Monitor dan kontrol mesin sortir kopi secara real-time</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border shadow-sm">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Pilih Mesin:</span>
            <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
              <SelectTrigger className="w-[180px] border-0 p-0 h-auto focus:ring-0 text-[#4B2E05] font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={String(machine.id)}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={fetchMachines}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Dialog open={isAddMachineOpen} onOpenChange={setIsAddMachineOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#4B2E05] hover:bg-[#3A2204]">
                <Plus className="w-4 h-4" />
                Tambah Mesin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Mesin Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Mesin</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Mesin Sortir A"
                    value={newMachineName}
                    onChange={(e) => setNewMachineName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    placeholder="Contoh: Gudang Utama"
                    value={newMachineLocation}
                    onChange={(e) => setNewMachineLocation(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMachineOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddMachine} disabled={isAddingMachine} className="bg-[#4B2E05] hover:bg-[#3A2204]">
                  {isAddingMachine ? 'Menambahkan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Machine Control Simulation Panel */}
      {currentMachine && (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#4B2E05] text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Simulasi Kontrol Mesin (Demo)
                </CardTitle>
                <p className="text-xs text-gray-600 mt-1">Panel simulasi untuk presentasi - kontrol mesin dan batch</p>
              </div>
              <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                Simulasi
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => toggleMachinePower(currentMachine.id)}
                className={`gap-2 ${currentMachine.status.power
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
                  }`}
                size="sm"
              >
                <Zap className="w-4 h-4" />
                {currentMachine.status.power ? 'Matikan Mesin' : 'Nyalakan Mesin'}
              </Button>

              <Button
                onClick={() => simulateBatchCompletion(currentMachine.id)}
                disabled={!currentMachine.status.power || currentMachine.statistics.currentBatch === 0}
                className="gap-2 bg-[#56743D] hover:bg-[#4C7C2E]"
                size="sm"
              >
                <CheckCircle className="w-4 h-4" />
                Selesaikan Batch
              </Button>

              <div className="text-xs text-gray-600 ml-auto flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${currentMachine.status.power ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                Status: <span className="font-medium text-[#4B2E05]">{currentMachine.status.power ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Stats Cards - Mimicking OrderManagement Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Mesin Aktif</p>
                <div className="text-[#4B2E05] text-2xl font-bold">
                  {totalStats.activeMachines} <span className="text-sm text-gray-400 font-normal">/ {totalStats.totalMachines}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Diproses</p>
                <div className="text-[#4B2E05] text-2xl font-bold">{totalStats.processedToday.toLocaleString()}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Box className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Rata-rata Efisiensi</p>
                <div className="text-[#4B2E05] text-2xl font-bold">{totalStats.avgEfficiency.toFixed(1)}%</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Mesin</p>
                <div className="text-[#4B2E05] text-2xl font-bold">{machines.length} Unit</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Server className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Machine Specifics (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Machine Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#4B2E05] text-lg">{currentMachine.name}</CardTitle>
                <Badge className={currentMachine.status.power ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}>
                  {currentMachine.status.power ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Server className="w-3 h-3" /> {currentMachine.location}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Suhu Mesin</span>
                  <span className="text-[#4B2E05] font-bold">{currentMachine.status.temperature}°C</span>
                </div>
                <Progress value={(currentMachine.status.temperature / 80) * 100} className="h-2" />
              </div>

              {/* Detailed Stats List - Mimicking "Top Customers" style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[#4B2E05] font-medium text-sm">Diproses Hari Ini</span>
                  </div>
                  <span className="text-[#4B2E05] font-bold">{currentMachine.statistics.processedToday.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-[#4B2E05] font-medium text-sm">Sisa Batch</span>
                  </div>
                  <span className="text-[#4B2E05] font-bold">{currentMachine.statistics.currentBatch}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-[#4B2E05] font-medium text-sm">Efisiensi</span>
                  </div>
                  <span className="text-[#4B2E05] font-bold">{currentMachine.statistics.efficiency}%</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="text-[#4B2E05] font-medium text-sm">Error Rate</span>
                  </div>
                  <span className="text-[#4B2E05] font-bold">{currentMachine.statistics.errorRate}%</span>
                </div>
              </div>

              {!currentMachine.status.power && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="ml-2 font-medium text-xs">
                    Mesin mati. Aktifkan power untuk memulai.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Video & Logs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Video Monitoring */}
          <Card className="overflow-hidden">
            <CardHeader className="py-3 border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#4B2E05] text-base flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Live Monitoring
                </CardTitle>

                <div className="flex items-center gap-2">
                  <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map(cam => (
                        <SelectItem key={cam} value={cam}>{cam}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant={isCameraActive ? "destructive" : "default"}
                    onClick={toggleVideoStream}
                    className={`h-8 text-xs ${!isCameraActive ? 'bg-[#56743D] hover:bg-[#4C7C2E]' : ''}`}
                  >
                    {isCameraActive ? <><Pause className="w-3 h-3 mr-2" /> Stop</> : <><Play className="w-3 h-3 mr-2" /> Start</>}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <div className="relative aspect-video bg-black">
              <canvas ref={canvasRef} className="hidden" />

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
              />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Uploaded" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  ) : (
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
                  )}
                  <div className="z-10 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                      <VideoOff className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Feed kamera tidak aktif</p>

                    <div className="flex gap-3 justify-center">
                      <label htmlFor="upload-video-image" className="cursor-pointer">
                        <Button variant="outline" size="sm" className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => document.getElementById('upload-video-image')?.click()}>
                          <Upload className="w-3 h-3 mr-2" />
                          Upload Foto
                        </Button>
                      </label>
                      <input id="upload-video-image" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                      {uploadedImage && (
                        <Button variant="ghost" size="sm" onClick={removeUploadedImage} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                          <X className="w-3 h-3 mr-2" />
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Overlays */}
              {isCameraActive && (
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="bg-black/60 backdrop-blur text-white px-3 py-2 rounded-lg border border-white/10 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${detectionResult.status === 'healthy' ? 'bg-green-500' : detectionResult.status === 'defect' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-1">Status</p>
                      <p className="text-sm font-bold leading-none">
                        {analysisError ? 'ERROR' : detectionResult.status === 'defect' ? 'DEFECT' : detectionResult.status === 'healthy' ? 'HEALTHY' : 'SCANNING...'}
                      </p>
                    </div>
                    <div className="w-px h-6 bg-white/20 mx-1" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-1">Conf.</p>
                      <p className="text-sm font-bold leading-none">{detectionResult.accuracy}%</p>
                    </div>
                  </div>

                  <div className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold animate-pulse">
                    LIVE
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* System Logs */}
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-[#4B2E05] text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Log Aktivitas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[250px] overflow-y-auto">
                {currentMachineLogs.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {currentMachineLogs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${log.type === 'success' ? 'bg-green-100 text-green-600' :
                          log.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                          {log.type === 'success' && <CheckCircle className="w-3 h-3" />}
                          {log.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
                          {log.type === 'info' && <Activity className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#4B2E05]">{log.message}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(log.time).toLocaleString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    Belum ada aktivitas tercatat
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}