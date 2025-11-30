import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Users,
  Mail,
  Phone,
  Calendar,
  Filter,
  Download,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  joinDate: string;
  totalOrders: number;
  lastActive: string;
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "user" as "admin" | "user",
    status: "active" as "active" | "inactive",
  });

  // Users from API
  const [users, setUsers] = useState<User[]>([]);

  // Load users on mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [searchQuery, statusFilter, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getUsers({
        search: searchQuery || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: 100,
      });

      if (response.success) {
        const formattedUsers: User[] = response.data.users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          company: u.companyName || "",
          role: u.role as "admin" | "user",
          status: u.isActive ? "active" : "inactive",
          joinDate: new Date(u.createdAt).toISOString().split("T")[0],
          totalOrders: 0, // TODO: Get from user detail
          lastActive: u.lastLogin
            ? formatDate(u.lastLogin)
            : "Belum pernah login",
        }));
        setUsers(formattedUsers);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat users");
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID");
  };

  // Users are already filtered by API, so use directly
  const filteredUsers = users;

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    admins: users.filter((u) => u.role === "admin").length,
    regularUsers: users.filter((u) => u.role === "user").length,
  };

  // Handle add user - Note: User creation should use authAPI.register
  const handleAddUser = async () => {
    try {
      setLoading(true);
      setError(null);
      // Note: User creation should use authAPI.register, but for admin we might need a different endpoint
      // For now, show error that this feature needs backend support
      setError(
        "Fitur tambah user memerlukan endpoint backend khusus. Gunakan register untuk menambah user baru."
      );
      setIsAddUserOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Gagal menambah user");
      console.error("Error adding user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.updateUser(selectedUser.id, {
        name: formData.name,
        phone: formData.phone,
        companyName: formData.company,
        role: formData.role,
        isActive: formData.status === "active",
      });

      if (response.success) {
        setIsEditUserOpen(false);
        setSelectedUser(null);
        resetForm();
        // Reload users
        await loadUsers();
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengupdate user");
      console.error("Error updating user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.deleteUser(selectedUser.id);

      if (response.success) {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        // Reload users
        await loadUsers();
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghapus user");
      console.error("Error deleting user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      role: user.role,
      status: user.status,
    });
    setIsEditUserOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = async (user: User) => {
    try {
      setLoading(true);
      const response = await adminAPI.getUserDetail(user.id);
      if (response.success) {
        const userData = response.data.user;
        setSelectedUser({
          ...user,
          totalOrders: response.data.orders?.length || 0,
        });
        setIsViewUserOpen(true);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail user");
      console.error("Error loading user detail:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "user",
      status: "active",
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const csv = [
      [
        "ID",
        "Nama",
        "Email",
        "Telepon",
        "Perusahaan",
        "Role",
        "Status",
        "Bergabung",
        "Total Pesanan",
      ],
      ...filteredUsers.map((u) => [
        u.id,
        u.name,
        u.email,
        u.phone,
        u.company,
        u.role,
        u.status,
        u.joinDate,
        u.totalOrders,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pengguna.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#4B2E05] mb-2">Manajemen Pengguna</h2>
          <p className="text-gray-600">Kelola pengguna dan hak akses sistem</p>
        </div>
        <Button
          onClick={() => setIsAddUserOpen(true)}
          className="bg-[#4C7C2E] hover:bg-[#3d6324] gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Pengguna</p>
                <div className="text-[#4B2E05]">{stats.total}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Aktif</p>
                <div className="text-green-600">{stats.active}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Tidak Aktif</p>
                <div className="text-orange-600">{stats.inactive}</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Admin</p>
                <div className="text-purple-600">{stats.admins}</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">User Biasa</p>
                <div className="text-blue-600">{stats.regularUsers}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Cari nama, email, atau perusahaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="bg-white border-0 shadow-lg">
        <CardContent className="p-6">
          {loading && users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">Memuat users...</p>
            </div>
          )}
          <div className="relative overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Perusahaan</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Pesanan</TableHead>
                  <TableHead>Terakhir Aktif</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback
                            className={
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-gray-700">{user.name}</p>
                          <p className="text-gray-500">{user.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.company}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }
                      >
                        {user.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }
                      >
                        {user.status === "active" ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-[#4B2E05]">
                        {user.totalOrders} pesanan
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-600">{user.lastActive}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50">
                          <DropdownMenuItem
                            onClick={() => openViewDialog(user)}
                            className="cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(user)}
                            className="cursor-pointer"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(user)}
                            className="text-red-600 cursor-pointer hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-[#4B2E05] mb-2">Tidak Ada Pengguna</h3>
              <p className="text-gray-600">
                Tidak ada pengguna yang sesuai dengan filter
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#4B2E05]">
              Tambah Pengguna Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Nama Lengkap *</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-phone">Nomor Telepon *</Label>
                <Input
                  id="add-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="0812-xxxx-xxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-company">Perusahaan</Label>
                <Input
                  id="add-company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Nama perusahaan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "user") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="add-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-status">Status</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="add-status"
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        status: checked ? "active" : "inactive",
                      })
                    }
                  />
                  <Label htmlFor="add-status" className="cursor-pointer">
                    {formData.status === "active" ? "Aktif" : "Tidak Aktif"}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddUserOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleAddUser}
              className="bg-[#4C7C2E] hover:bg-[#3d6324]"
              disabled={!formData.name || !formData.email || !formData.phone}
            >
              Tambah Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#4B2E05]">Edit Pengguna</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Lengkap *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Nomor Telepon *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-company">Perusahaan</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "user") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="edit-status"
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        status: checked ? "active" : "inactive",
                      })
                    }
                  />
                  <Label htmlFor="edit-status" className="cursor-pointer">
                    {formData.status === "active" ? "Aktif" : "Tidak Aktif"}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditUserOpen(false);
                setSelectedUser(null);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleEditUser}
              className="bg-[#4C7C2E] hover:bg-[#3d6324]"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewUserOpen} onOpenChange={setIsViewUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#4B2E05]">
              Detail Pengguna
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#F5E6CA] to-[#E8D5B7] rounded-lg">
                <Avatar className="w-20 h-20">
                  <AvatarFallback
                    className={
                      selectedUser.role === "admin"
                        ? "bg-purple-600 text-white"
                        : "bg-blue-600 text-white"
                    }
                  >
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-[#4B2E05] mb-1">{selectedUser.name}</h3>
                  <div className="flex gap-2">
                    <Badge
                      className={
                        selectedUser.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    >
                      {selectedUser.role === "admin" ? "Admin" : "User"}
                    </Badge>
                    <Badge
                      className={
                        selectedUser.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }
                    >
                      {selectedUser.status === "active"
                        ? "Aktif"
                        : "Tidak Aktif"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-gray-600">ID Pengguna</p>
                  <p className="text-[#4B2E05]">{selectedUser.id}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-600">Perusahaan</p>
                  <p className="text-[#4B2E05]">{selectedUser.company}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-600">Email</p>
                  <div className="flex items-center gap-2 text-[#4B2E05]">
                    <Mail className="w-4 h-4" />
                    <span>{selectedUser.email}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-600">Telepon</p>
                  <div className="flex items-center gap-2 text-[#4B2E05]">
                    <Phone className="w-4 h-4" />
                    <span>{selectedUser.phone}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-600">Bergabung Sejak</p>
                  <div className="flex items-center gap-2 text-[#4B2E05]">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedUser.joinDate}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-600">Total Pesanan</p>
                  <p className="text-[#4B2E05]">
                    {selectedUser.totalOrders} pesanan
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-600">Terakhir Aktif</p>
                  <p className="text-[#4B2E05]">{selectedUser.lastActive}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewUserOpen(false);
                setSelectedUser(null);
              }}
            >
              Tutup
            </Button>
            <Button
              onClick={() => {
                setIsViewUserOpen(false);
                if (selectedUser) openEditDialog(selectedUser);
              }}
              className="bg-[#4C7C2E] hover:bg-[#3d6324]"
            >
              Edit Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4B2E05]">
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <p className="text-gray-700">
                Apakah Anda yakin ingin menghapus pengguna{" "}
                <span className="text-[#4B2E05]">{selectedUser.name}</span>?
              </p>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">
                  ⚠️ Tindakan ini tidak dapat dibatalkan. Semua data pengguna
                  termasuk riwayat pesanan akan dihapus secara permanen.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
