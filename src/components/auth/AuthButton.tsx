import { LogOut, User, Settings, LogIn, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function AuthButton() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setIsDropdownOpen(false);
  }, [signOut]);

  if (!isAuthenticated) {
    return (
      <Link
        to="/signin"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <LogIn size={16} aria-hidden="true" />
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {user?.first_name?.charAt(0) || "U"}
          {user?.last_name?.charAt(0)}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {user?.first_name} {user?.last_name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {user?.role}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform duration-200 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="font-medium text-gray-900 dark:text-white">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email || "No email"}
            </div>
            <div className="mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user?.role === "admin"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                {user?.role === "admin" ? "Administrator" : "User"}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <User size={16} aria-hidden="true" />
              Profile
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Settings size={16} aria-hidden="true" />
              Settings
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
