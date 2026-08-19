import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import {
  Menu,
  X,
  Search,
  Command,
  ChevronDown,
  Bell,
  User,
  Settings,
  HelpCircle,
} from "lucide-react";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const location = useLocation();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close search on route change
  useEffect(() => {
    setIsSearchOpen(false);
  }, [location]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path === "/sale") return "Create Sale";
    if (path === "/sale-list") return "Sale List";
    if (path === "/products") return "Add Product";
    if (path === "/products-list") return "Product List";
    if (path === "/category") return "Add Category";
    if (path === "/category-list") return "Category List";
    if (path === "/tables") return "Table Management";
    if (path === "/profile") return "User Profile";
    if (path === "/calendar") return "Calendar";
    if (path.includes("/products-edit")) return "Edit Product";
    if (path.includes("/category-edit")) return "Edit Category";
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-b border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-between w-full lg:flex-row lg:px-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* Left Side - Toggle & Logo */}
          <div className="flex items-center gap-2">
            <button
              className="items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors lg:flex lg:h-11 lg:w-11"
              onClick={handleToggle}
              aria-label="Toggle Sidebar"
            >
              {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link to="/" className="lg:hidden">
              <img
                className="dark:hidden h-8 w-auto"
                src="./images/logo/logo.svg"
                alt="Logo"
              />
              <img
                className="hidden dark:block h-8 w-auto"
                src="./images/logo/logo-dark.svg"
                alt="Logo"
              />
            </Link>

            {/* Page Title - Mobile */}
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 lg:hidden">
              {getPageTitle()}
            </span>
          </div>

          {/* Right Side - Mobile Actions */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={toggleSearch}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              <Search size={20} />
            </button>
            <button
              onClick={toggleApplicationMenu}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronDown
                size={20}
                className={`transition-transform duration-200 ${isApplicationMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:block flex-1 max-w-2xl mx-4">
            <div className="relative">
              <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                <Search size={18} className="text-gray-400" />
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search or type command..."
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
              />
              <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                <Command size={12} />
                <span>K</span>
              </button>
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-w-2xl mx-auto">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs text-gray-400">
                    Recent Searches
                  </div>
                  <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                    Search for products...
                  </div>
                  <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                    Search for categories...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggleButton />
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>

        {/* Mobile Application Menu */}
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800`}
        >
          <div className="flex items-center gap-3 w-full justify-between">
            <div className="flex items-center gap-3">
              <ThemeToggleButton />
              <NotificationDropdown />
            </div>
            <UserDropdown />
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="lg:hidden fixed inset-x-0 top-0 z-50 bg-white dark:bg-gray-900 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <button
                onClick={toggleSearch}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Search for products, categories, or sales...</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
