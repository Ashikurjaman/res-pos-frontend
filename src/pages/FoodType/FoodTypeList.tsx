// src/pages/FoodType/FoodTypeList.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import FoodTypeService from "../../services/FoodTypeService";
import { FoodType } from "../../type/foodType";
import Swal from "sweetalert2";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Loader2,
  Utensils,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function FoodTypeList() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredFoodTypes, setFilteredFoodTypes] = useState<FoodType[]>([]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Filter food types
  useEffect(() => {
    if (!Array.isArray(foodTypes)) {
      setFilteredFoodTypes([]);
      return;
    }

    if (searchTerm.trim() === "") {
      setFilteredFoodTypes(foodTypes);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = foodTypes.filter(
        (item) =>
          item.type_name.toLowerCase().includes(term) ||
          (item.printer_ip && item.printer_ip.toLowerCase().includes(term))
      );
      setFilteredFoodTypes(filtered);
    }
  }, [searchTerm, foodTypes]);

  const fetchFoodTypes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await FoodTypeService.getAll();
      setFoodTypes(data);
      setFilteredFoodTypes(data);
    } catch (error: any) {
      console.error("Error fetching food types:", error);
      if (error.status === 401) {
        navigate("/signin");
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load food types.",
        confirmButtonColor: "#3b82f6",
      });
      setFoodTypes([]);
      setFilteredFoodTypes([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFoodTypes();
    }
  }, [isAuthenticated, fetchFoodTypes]);

  const handleDelete = useCallback(async (foodType: FoodType) => {
    const result = await Swal.fire({
      title: "Delete Food Type?",
      text: `Are you sure you want to delete "${foodType.type_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await FoodTypeService.delete(foodType.id);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
      fetchFoodTypes();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: error.message || "Failed to delete food type.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [fetchFoodTypes]);

  const handleRestore = useCallback(async (foodType: FoodType) => {
    const result = await Swal.fire({
      title: "Restore Food Type?",
      text: `Are you sure you want to restore "${foodType.type_name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await FoodTypeService.restore(foodType.id);
      Swal.fire({
        icon: "success",
        title: "Restored!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
      fetchFoodTypes();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Restore Failed!",
        text: error.message || "Failed to restore food type.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [fetchFoodTypes]);

  const handleToggleOnline = useCallback(async (foodType: FoodType) => {
    try {
      await FoodTypeService.toggleOnline(foodType.id);
      Swal.fire({
        icon: "success",
        title: foodType.onlinestatus === 1 ? "Offline" : "Online",
        text: `Food type is now ${foodType.onlinestatus === 1 ? "offline" : "online"}`,
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
      fetchFoodTypes();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Action Failed!",
        text: error.message || "Failed to toggle status.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [fetchFoodTypes]);

  const getStatusBadge = useCallback((foodType: FoodType) => {
    if (foodType.validity === 0) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Deleted
        </span>
      );
    }
    if (foodType.onlinestatus === 1) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <Wifi size={12} className="inline mr-1" />
          Online
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <WifiOff size={12} className="inline mr-1" />
          Offline
        </span>
      );
    }
  }, []);

  const stats = useMemo(() => {
    const array = Array.isArray(foodTypes) ? foodTypes : [];
    return {
      total: array.length,
      online: array.filter((f) => f.onlinestatus === 1 && f.validity === 1).length,
      offline: array.filter((f) => f.onlinestatus === 0 && f.validity === 1).length,
      deleted: array.filter((f) => f.validity === 0).length,
    };
  }, [foodTypes]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <PageMeta title="Food Type List | A&T" description="Food Type Management" />
      <PageBreadcrumb pageTitle="Food Type List" />

      <div className="space-y-6">
        <ComponentCard title="Food Type Management">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search food types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                aria-label="Search food types"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={fetchFoodTypes}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
                Refresh
              </button>
              <button
                onClick={() => navigate("/food-types/create")}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={16} aria-hidden="true" />
                Add New
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">Total</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Online</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.online}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Offline</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.offline}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">Deleted</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.deleted}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      SL
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type Name
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Printer IP
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Products
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" aria-hidden="true" />
                          <span className="text-gray-500 dark:text-gray-400">Loading food types...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !Array.isArray(filteredFoodTypes) || filteredFoodTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Utensils className="w-12 h-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm ? "No food types match your search" : "No food types found"}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm("")}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFoodTypes.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.type_name}
                            </div>
                            {item.printer_ip && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                IP: {item.printer_ip}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {item.printer_ip || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {getStatusBadge(item)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {item.products_count || 0}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              onClick={() => navigate(`/food-types/${item.id}`)}
                              title="View"
                              aria-label={`View ${item.type_name}`}
                            >
                              <Eye size={18} aria-hidden="true" />
                            </button>
                            {item.validity === 1 && (
                              <>
                                <button
                                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                  onClick={() => navigate(`/food-types/edit/${item.id}`)}
                                  title="Edit"
                                  aria-label={`Edit ${item.type_name}`}
                                >
                                  <Edit size={18} aria-hidden="true" />
                                </button>
                                <button
                                  className={`p-2 rounded-lg transition-colors ${
                                    item.onlinestatus === 1
                                      ? "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                                      : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                                  }`}
                                  onClick={() => handleToggleOnline(item)}
                                  title={item.onlinestatus === 1 ? "Set Offline" : "Set Online"}
                                  aria-label={item.onlinestatus === 1 ? "Set Offline" : "Set Online"}
                                >
                                  {item.onlinestatus === 1 ? (
                                    <WifiOff size={18} aria-hidden="true" />
                                  ) : (
                                    <Wifi size={18} aria-hidden="true" />
                                  )}
                                </button>
                                <button
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  onClick={() => handleDelete(item)}
                                  title="Delete"
                                  aria-label={`Delete ${item.type_name}`}
                                >
                                  <Trash2 size={18} aria-hidden="true" />
                                </button>
                              </>
                            )}
                            {item.validity === 0 && (
                              <button
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                onClick={() => handleRestore(item)}
                                title="Restore"
                                aria-label={`Restore ${item.type_name}`}
                              >
                                <RefreshCw size={18} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer */}
          {Array.isArray(filteredFoodTypes) && filteredFoodTypes.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <span>
                Showing {filteredFoodTypes.length} of {Array.isArray(foodTypes) ? foodTypes.length : 0} food types
              </span>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
