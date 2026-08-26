import { useState, useCallback } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user, signOut } = useAuth();

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      closeDropdown();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }, [signOut, closeDropdown]);

  // Get user initials for avatar fallback
  const getUserInitials = useCallback(() => {
    if (!user) return "U";
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  }, [user]);

  // Get user full name
  const getFullName = useCallback(() => {
    if (!user) return "User";
    return (
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.username ||
      "User"
    );
  }, [user]);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={getFullName()}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{getUserInitials()}</span>
          )}
        </span>

        <span className="block mr-1 font-medium text-theme-sm">
          {getFullName()}
        </span>
        <ChevronDown
          size={18}
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        {/* User Info */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="overflow-hidden rounded-full h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={getFullName()}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{getUserInitials()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400 truncate">
              {getFullName()}
            </span>
            <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email || "user@example.com"}
            </span>
            {user?.role && (
              <span className="mt-0.5 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {user.role}
              </span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <ul className="flex flex-col gap-1 pt-3 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <User
                size={20}
                className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                aria-hidden="true"
              />
              Edit Profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Settings
                size={20}
                className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                aria-hidden="true"
              />
              Account Settings
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/support"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <HelpCircle
                size={20}
                className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                aria-hidden="true"
              />
              Support
            </DropdownItem>
          </li>
        </ul>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-red-600 rounded-lg group text-theme-sm hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
        >
          <LogOut
            size={20}
            className="text-red-500 group-hover:text-red-600 dark:text-red-400 dark:group-hover:text-red-300"
            aria-hidden="true"
          />
          Sign Out
        </button>
      </Dropdown>
    </div>
  );
}
