import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  User,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { authAPI } from "../services/api";

interface AdminProfileDropdownProps {
  onNavigateToSettings: () => void;
  onNavigateToLanding: () => void;
}

export default function AdminProfileDropdown({
  onNavigateToSettings,
  onNavigateToLanding,
}: AdminProfileDropdownProps) {
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      onNavigateToLanding();
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, navigate to landing
      onNavigateToLanding();
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition-colors">
          <div className="text-right">
            <p className="text-[#4B2E05]">Admin Sistem</p>
            <p className="text-gray-600">Super Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white">A</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-[#4B2E05]">Admin Sistem</p>
            <p className="text-gray-500">admin@pilahkopi.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onNavigateToSettings}
          className="cursor-pointer"
        >
          <User className="w-4 h-4 mr-2" />
          Profil Saya
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onNavigateToSettings}
          className="cursor-pointer"
        >
          <SettingsIcon className="w-4 h-4 mr-2" />
          Pengaturan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
