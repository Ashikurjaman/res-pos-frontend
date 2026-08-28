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
import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Loader2,
  Package,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth";
import { API_CONFIG } from "../../config/api";
import UnitService from "../../services/UnitService";

type UnitType = {
  id: number;
  unit_name: string;
  status: string | number;
  created_at?: string;
  updated_at?: string;
};

export default function UnitList() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [units, setUnits] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredUnits, setFilteredUnits] = useState<UnitType[]>([]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Filter units when search term changes
  useEffect(() => {
    if (!Array.isArray(units)) {
      setFilteredUnits([]);
      return;
    }

    if (searchTerm.trim() === "") {
      setFilteredUnits(units);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = units.filter(
        (unit) =>
          unit.unit_name?.toLowerCase().includes(term) ||
          unit.id.toString().includes(term)
      );
      setFilteredUnits(filtered);
    }
  }, [searchTerm, units]);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await axios.get(
        `${API_CONFIG.baseURL}/unit/all`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      // Handle different response structures
      let unitsData: UnitType[] = [];

      if (Array.isArray(response.data)) {
        unitsData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        unitsData = response.data.data;
      } else if (response.data && response.data.units && Array.isArray(response.data.units)) {
        unitsData = response.data.units;
      } else if (response.data && response.data.status === "success" && response.data.data) {
        unitsData = response.data.data;
      } else {
        // Try to extract any array from the response
        const values = Object.values(response.data || {});
        const arrayValue = values.find(v => Array.isArray(v));
        if (arrayValue) {
          unitsData = arrayValue;
        }
      }

      setUnits(unitsData);
      setFilteredUnits(unitsData);
    } catch (error: any) {
      console.error("Error fetching units:", error);

      if (error.response?.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
          navigate("/signin");
        });
        return;
      }

      // Handle 404 - endpoint not found
      if (error.response?.status === 404) {
        // Try the regular endpoint
        try {
          const fallbackResponse = await axios.get(
            `${API_CONFIG.baseURL}/unit`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );

          let fallbackData: UnitType[] = [];
          if (Array.isArray(fallbackResponse.data)) {
            fallbackData = fallbackResponse.data;
          } else if (fallbackResponse.data && fallbackResponse.data.data && Array.isArray(fallbackResponse.data.data)) {
            fallbackData = fallbackResponse.data.data;
          }

          setUnits(fallbackData);
          setFilteredUnits(fallbackData);
          return;
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
        }
      }

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response?.data?.message || "Failed to load units.",
        confirmButtonColor: "#3b82f6",
      });
      setUnits([]);
      setFilteredUnits([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnits();
    }
  }, [isAuthenticated, fetchUnits]);

  const handleEdit = useCallback((id: number) => {
    navigate(`/unit-edit/${id}`);
  }, [navigate]);

  const handleView = useCallback((id: number) => {
    // Navigate to view page or show modal
    navigate(`/unit-view/${id}`);
  }, [navigate]);

  const handleDelete = useCallback(async (id: number, unitName: string) => {
    const result = await Swal.fire({
      title: "Delete Unit?",
      text: `Are you sure you want to delete "${unitName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const token = getAuthToken();

      await axios.delete(
        `${API_CONFIG.baseURL}/unit/${id}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      setUnits((prev) => prev.filter((u) => u.id !== id));
      setFilteredUnits((prev) => prev.filter((u) => u.id !== id));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Unit deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      console.error("Error deleting unit:", error);

      if (error.response?.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
          navigate("/signin");
        });
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: error.response?.data?.message || "Failed to delete unit.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [getAuthToken, navigate]);

  const handleRestore = useCallback(async (id: number, unitName: string) => {
    const result = await Swal.fire({
      title: "Restore Unit?",
      text: `Are you sure you want to restore "${unitName}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const token = getAuthToken();

      await axios.post(
        `${API_CONFIG.baseURL}/unit/${id}/restore`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      fetchUnits();

      Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Unit restored successfully.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      console.error("Error restoring unit:", error);

      if (error.response?.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
          navigate("/signin");
        });
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Restore Failed!",
        text: error.response?.data?.message || "Failed to restore unit.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [getAuthToken, navigate, fetchUnits]);

  const getStatusBadge = useCallback((status: string | number) => {
    const statusValue = status?.toString() || "1";
    if (statusValue === "1") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Active
        </span>
      );
    } else if (statusValue === "0") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Inactive
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
          {status}
        </span>
      );
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchUnits();
    setSearchTerm("");
  }, [fetchUnits]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Stats with proper array check
  const stats = useMemo(() => {
    const unitArray = Array.isArray(units) ? units : [];
    return {
      total: unitArray.length,
      active: unitArray.filter((u) => u.status?.toString() === "1").length,
      inactive: unitArray.filter((u) => u.status?.toString() === "0").length,
    };
  }, [units]);

  // Show loading while checking authentication
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

  // If not authenticated, return null
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <PageMeta title="Unit List | A&T" description="Unit List Page" />
      <PageBreadcrumb pageTitle="Unit List" />

      <div className="space-y-6">
        <ComponentCard title="Unit Management">
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
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                aria-label="Search units"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                disabled={loading}
                aria-label="Refresh units"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                Refresh
              </button>
              <button
                onClick={() => navigate("/unit")}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={16} aria-hidden="true" />
                Add New
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Units</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Active</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.active}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">Inactive</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.inactive}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-full overflow-x-auto">
              <Table>
                {/* Table Header */}
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      SL
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Unit Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Created At
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" aria-hidden="true" />
                          <span className="text-gray-500 dark:text-gray-400">
                            Loading units...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !Array.isArray(filteredUnits) || filteredUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm
                              ? "No units match your search"
                              : "No units found"}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={handleClearSearch}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Clear search
                            </button>
                          )}
                          {!searchTerm && (
                            <button
                              onClick={() => navigate("/unit")}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                            >
                              <Plus size={14} aria-hidden="true" />
                              Add your first unit
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnits.map((unit, index) => (
                      <TableRow
                        key={unit.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <TableCell className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {unit.unit_name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {getStatusBadge(unit.status)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          {unit.created_at
                            ? new Date(unit.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => handleView(unit.id)}
                              title="View Unit"
                              aria-label={`View ${unit.unit_name}`}
                            >
                              <Eye size={18} aria-hidden="true" />
                            </button>
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => handleEdit(unit.id)}
                              title="Edit Unit"
                              aria-label={`Edit ${unit.unit_name}`}
                            >
                              <Edit size={18} aria-hidden="true" />
                            </button>
                            {unit.status?.toString() === "0" ? (
                              <button
                                onClick={() => handleRestore(unit.id, unit.unit_name)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                                title="Restore Unit"
                                aria-label={`Restore ${unit.unit_name}`}
                              >
                                <RefreshCw size={18} aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDelete(unit.id, unit.unit_name)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                title="Delete Unit"
                                aria-label={`Delete ${unit.unit_name}`}
                              >
                                <Trash2 size={18} aria-hidden="true" />
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
          {Array.isArray(filteredUnits) && filteredUnits.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <span>
                Showing {filteredUnits.length} of {Array.isArray(units) ? units.length : 0} units
              </span>
              <div className="flex flex-wrap gap-4">
                <span>
                  Active:{" "}
                  <strong className="text-green-600 dark:text-green-400">
                    {stats.active}
                  </strong>
                </span>
                <span>
                  Inactive:{" "}
                  <strong className="text-red-600 dark:text-red-400">
                    {stats.inactive}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
