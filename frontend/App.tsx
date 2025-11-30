import { useState, useEffect } from "react";
import LandingPage from "./src/components/LandingPage";
import Dashboard from "./src/components/AdminDashboard";
import UserDashboard from "./src/components/UserDashboard";
import Login from "./src/components/Login";
import Register from "./src/components/Register";
import RoleInfo from "./src/components/RoleInfo";
import ForgotPassword from "./src/components/ForgotPassword";
import { Button } from "./src/components/ui/button";
import { isAuthenticated, getStoredUser } from "./src/services/auth";

export default function App() {
  const [currentView, setCurrentView] = useState<
    | "landing"
    | "login"
    | "register"
    | "dashboard"
    | "user-dashboard"
    | "role-info"
    | "forgot-password"
  >("landing");
  const [showRoleHelper, setShowRoleHelper] = useState(false);

  // Check authentication on mount and when view changes
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const user = getStoredUser();
        if (user) {
          // User is authenticated, redirect to appropriate dashboard
          if (
            currentView === "login" ||
            currentView === "register" ||
            currentView === "landing"
          ) {
            if (user.role === "admin") {
              setCurrentView("dashboard");
            } else {
              setCurrentView("user-dashboard");
            }
          }
        }
      } else {
        // User is not authenticated, protect dashboard routes
        if (currentView === "dashboard" || currentView === "user-dashboard") {
          setCurrentView("login");
        }
      }
    };

    checkAuth();
  }, [currentView]);

  return (
    <div className="min-h-screen relative">
      {/* Role Helper Button */}
      {(currentView === "landing" ||
        currentView === "login" ||
        currentView === "register" ||
        currentView === "forgot-password") && (
          <Button
            onClick={() => setShowRoleHelper(!showRoleHelper)}
            className="fixed bottom-6 right-6 z-50 bg-[#56743D] hover:bg-[#4C7C2E] text-white shadow-2xl rounded-full w-14 h-14 flex items-center justify-center"
            title="Lihat perbedaan Admin & User"
          >
            <span className="text-xl">i</span>
          </Button>
        )}

      {/* Role Info Modal */}
      {showRoleHelper && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <Button
              onClick={() => setShowRoleHelper(false)}
              className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 text-gray-700 rounded-full w-10 h-10"
            >
              ✕
            </Button>
            <RoleInfo />
          </div>
        </div>
      )}

      {currentView === "landing" && (
        <LandingPage onNavigateToLogin={() => setCurrentView("login")}
          onNavigateToRegister={() => setCurrentView("register")} />
      )}
      {currentView === "login" && (
        <Login
          onNavigateToRegister={() => setCurrentView("register")}
          onNavigateToUserDashboard={() => setCurrentView("user-dashboard")}
          onNavigateToAdminDashboard={() => setCurrentView("dashboard")}
          onNavigateToLanding={() => setCurrentView("landing")}
          onNavigateToForgotPassword={() => setCurrentView("forgot-password")}
        />
      )}
      {currentView === "forgot-password" && (
        <ForgotPassword onNavigateToLogin={() => setCurrentView("login")} />
      )}
      {currentView === "register" && (
        <Register
          onNavigateToLogin={() => setCurrentView("login")}
          onNavigateToUserDashboard={() => setCurrentView("user-dashboard")}
          onNavigateToAdminDashboard={() => setCurrentView("dashboard")}
          onNavigateToLanding={() => setCurrentView("landing")}
        />
      )}
      {currentView === "user-dashboard" && (
        <UserDashboard onNavigateToLanding={() => setCurrentView("landing")} />
      )}
      {currentView === "dashboard" && (
        <Dashboard onNavigateToLanding={() => setCurrentView("landing")} />
      )}
    </div>
  );
}
