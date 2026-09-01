import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useAuth } from "../hooks/useAuth";
import {
  GridIcon,
  CalenderIcon,
  ChevronDownIcon,
  ListIcon,
  PageIcon,
  PencilIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  BoxCubeIcon,
  HorizontaLDots,
} from "../icons";
import {
  Building,
  PackageIcon,
  ShoppingCart,
  Settings,
  Users,
  LayoutDashboard,
  Store,
  FileText,
  ClipboardList,
  Truck,
  LogOut,
  Package,
  Boxes,
  ClipboardCheck,
  Utensils,
  Layers,
  GitBranch,
  GitPullRequest,
  CheckSquare,
  ArrowLeftRight,
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuth();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  // Check if any submenu item is active
  const isSubmenuActive = useCallback(
    (subItems?: { name: string; path: string }[]) => {
      if (!subItems) return false;
      return subItems.some((item) => isActive(item.path));
    },
    [isActive],
  );

  // Main Navigation Items
  const navItems: NavItem[] = [
    {
      icon: <LayoutDashboard size={20} />,
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: <ShoppingCart size={20} />,
      name: "Sale",
      subItems: [
        { name: "Create Sale", path: "/create-sale" },
        { name: "Sale List", path: "/sale-list" },
      ],
    },
    {
      icon: <Package size={20} />,
      name: "Products",
      subItems: [
        { name: "Product Create", path: "/products" },
        { name: "Product List", path: "/products-list" },
        { name: "Stock Management", path: "/stock-management" },
      ],
    },
    {
      icon: <ArrowLeftRight size={20} />,
      name: "Stock Transfer",
      subItems: [
        { name: "New Request", path: "/stock-request/new" },
        { name: "Requests", path: "/stock-requests" },
        { name: "Despatches", path: "/stock-despatches" },
        { name: "Receives", path: "/stock-receives" },
      ],
    },
    {
      icon: <Truck size={20} />,
      name: "Suppliers",
      path: "/suppliers",
    },
    {
      icon: <Layers size={20} />,
      name: "Category",
      subItems: [
        { name: "Category Create", path: "/category" },
        { name: "Category List", path: "/category-list" },
      ],
    },
    {
      icon: <ClipboardList size={20} />,
      name: "Unit",
      subItems: [
        { name: "Unit Create", path: "/unit" },
        { name: "Unit List", path: "/unit-list" },
      ],
    },
    {
      icon: <Store size={20} />,
      name: "Outlets",
      path: "/outlets",
    },
    {
      icon: <Building size={20} />,
      name: "Company",
      path: "/companies",
    },
    {
      icon: <Boxes size={20} />,
      name: "Tables",
      path: "/tables",
    },
    {
      icon: <Settings size={20} />,
      name: "Settings",
      subItems: [
        { name: "Profile", path: "/profile" },
        { name: "Calendar", path: "/calendar" },
        {
          name: "Food Types",
          path: "/food-types",
        },
      ],
    },
  ];

  // Others Navigation Items
  const othersItems: NavItem[] = [
    {
      icon: <Users size={20} />,
      name: "User Management",
      subItems: [
        { name: "Users", path: "/users" },
        { name: "Roles & Permissions", path: "/roles" },
      ],
    },
    {
      icon: <PieChartIcon />,
      name: "Charts",
      subItems: [
        { name: "Line Chart", path: "/line-chart" },
        { name: "Bar Chart", path: "/bar-chart" },
      ],
    },
    {
      icon: <BoxCubeIcon />,
      name: "UI Elements",
      subItems: [
        { name: "Alerts", path: "/alerts" },
        { name: "Avatar", path: "/avatars" },
        { name: "Badge", path: "/badge" },
        { name: "Buttons", path: "/buttons" },
        { name: "Images", path: "/images" },
        { name: "Videos", path: "/videos" },
      ],
    },
    {
      icon: <TableIcon />,
      name: "Tables",
      subItems: [{ name: "Basic Tables", path: "/basic-tables" }],
    },
    {
      icon: <PageIcon />,
      name: "Pages",
      subItems: [
        { name: "Blank Page", path: "/blank" },
        { name: "404 Error", path: "/error-404" },
        { name: "Unauthorized", path: "/unauthorized" },
      ],
    },
    {
      icon: <PlugInIcon />,
      name: "Authentication",
      subItems: [
        { name: "Sign In", path: "/signin" },
        { name: "Sign Up", path: "/signup" },
      ],
    },
  ];

  // Auto-open submenu based on active route
  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        } else if (nav.path && isActive(nav.path)) {
          setOpenSubmenu(null);
        }
      });
    });

    if (!submenuMatched && openSubmenu !== null) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  // Calculate submenu height for animation
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => {
        // Check if this menu or any submenu item is active
        const isMenuActive = nav.path ? isActive(nav.path) : false;
        const isSubMenuActive = nav.subItems
          ? isSubmenuActive(nav.subItems)
          : false;
        const isOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isOpen || isSubMenuActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span className="flex-shrink-0">{nav.icon}</span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="text-sm font-medium flex-1 text-left">
                    {nav.name}
                  </span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isMenuActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                >
                  <span className="flex-shrink-0">{nav.icon}</span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="text-sm font-medium">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: isOpen
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
                }}
              >
                <ul className="mt-1 space-y-1 ml-4">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isActive(subItem.path)
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                        {subItem.name}
                        {subItem.new && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            pro
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-3 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-[280px]"
            : isHovered
              ? "w-[280px]"
              : "w-[72px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/dashboard" className="flex items-center gap-3">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                My Store
              </span>
            </>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="flex-1">
          <div className="flex flex-col gap-2">
            {/* Main Menu Section */}
            <div>
              <h2
                className={`mb-2 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center flex"
                    : "justify-start flex px-3"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Main Menu"
                ) : (
                  <HorizontaLDots className="w-5 h-5" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {/* Others Section */}
            <div className="mt-2">
              <h2
                className={`mb-2 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center flex"
                    : "justify-start flex px-3"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots className="w-5 h-5" />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer / User Info */}
        {isAuthenticated && (isExpanded || isHovered || isMobileOpen) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.first_name?.charAt(0) || "U"}
                {user?.last_name?.charAt(0) || ""}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || "User"}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Widget */}
        {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default AppSidebar;
