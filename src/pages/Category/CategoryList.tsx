// src/pages/Category/CategoryList.tsx
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
import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth";
import { API_CONFIG } from "../../config/api";

type CategoryType = {
  id: number;
  category_name: string;
  status: string | number;
  created_at?: string;
  updated_at?: string;
};

export default function CategoryList() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredCategories, setFilteredCategories] = useState<CategoryType[]>([]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Filter categories when search term changes
  useEffect(() => {
    if (!Array.isArray(categories)) {
      setFilteredCategories([]);
      return;
    }

    if (searchTerm.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = categories.filter(
        (category) =>
          category.category_name?.toLowerCase().includes(term) ||
          category.id.toString().includes(term),
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await axios.get(`${API_CONFIG.baseURL}/category`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      let categoriesData = [];

      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      } else if (response.data && response.data.categories && Array.isArray(response.data.categories)) {
        categoriesData = response.data.categories;
      } else if (response.data && response.data.status === "success" && response.data.data) {
        categoriesData = response.data.data;
      } else {
        const values = Object.values(response.data || {});
        const arrayValue = values.find((v) => Array.isArray(v));
        if (arrayValue) {
          categoriesData = arrayValue;
        }
      }

      setCategories(categoriesData);
      setFilteredCategories(categoriesData);
    } catch (error: any) {
      console.error("Error fetching categories:", error);

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
        title: "Error!",
        text: error.response?.data?.message || "Failed to load categories.",
        confirmButtonColor: "#3b82f6",
      });
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

  const handleEdit = useCallback((id: number) => {
    navigate(`/category-edit/${id}`);
  }, [navigate]);

  const handleView = useCallback((id: number) => {
    navigate(`/category/${id}`);
  }, [navigate]);

  const handleDelete = useCallback(async (id: number, categoryName: string) => {
    const result = await Swal.fire({
      title: "Delete Category?",
      text: `Are you sure you want to delete "${categoryName}"?`,
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

      await axios.delete(`${API_CONFIG.baseURL}/category/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setFilteredCategories((prev) => prev.filter((c) => c.id !== id));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Category deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      console.error("Error deleting category:", error);

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
        text: error.response?.data?.message || "Failed to delete category.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [getAuthToken, navigate]);

  const handleRestore = useCallback(async (id: number, categoryName: string) => {
    const result = await Swal.fire({
      title: "Restore Category?",
      text: `Are you sure you want to restore "${categoryName}"?`,
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
        `${API_CONFIG.baseURL}/category/${id}/restore`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      fetchCategories();

      Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Category restored successfully.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      console.error("Error restoring category:", error);

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
        text: error.response?.data?.message || "Failed to restore category.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [getAuthToken, navigate, fetchCategories]);

  const getStatusBadge = useCallback((status: string | number) => {
    const statusValue = status?.toString() || "1";
    if (statusValue === "1" || statusValue === "active") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Inactive
        </span>
      );
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchCategories();
    setSearchTerm("");
  }, [fetchCategories]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

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

  if (!isAuthenticated) {
    return null;
  }

  // Count active/inactive categories
  const activeCount = categories.filter(
    (c) => c.status?.toString() === "1" || c.status === "active",
  ).length;

  const inactiveCount = categories.filter(
    (c) => c.status?.toString() === "0" || c.status === "inactive",
  ).length;

  return (
    <>
      <PageMeta title="Category List | A&T" description="Category List Page" />
      <PageBreadcrumb pageTitle="Category List" />

      <div className="space-y-6">
        <ComponentCard title="Category Management">
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
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                aria-label="Search categories"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                disabled={loading}
                aria-label="Refresh categories"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
                Refresh
              </button>
              <button
                onClick={() => navigate("/category")}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={16} aria-hidden="true" />
                Add New
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      SL
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category Name
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created At
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" aria-hidden="true" />
                          <span className="text-gray-500 dark:text-gray-400">Loading categories...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !Array.isArray(filteredCategories) || filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm ? "No categories match your search" : "No categories found"}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={handleClearSearch}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                            >
                              Clear search
                            </button>
                          )}
                          {!searchTerm && (
                            <button
                              onClick={() => navigate("/category")}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                            >
                              <Plus size={14} aria-hidden="true" />
                              Add your first category
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category, index) => (
                      <TableRow key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <TableCell className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {category.category_name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {getStatusBadge(category.status)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          {category.created_at
                            ? new Date(category.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => handleView(category.id)}
                              title="View Category"
                              aria-label={`View ${category.category_name}`}
                            >
                              <Eye size={18} aria-hidden="true" />
                            </button>
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => handleEdit(category.id)}
                              title="Edit Category"
                              aria-label={`Edit ${category.category_name}`}
                            >
                              <Edit size={18} aria-hidden="true" />
                            </button>
                            {category.status?.toString() === "0" || category.status === "inactive" ? (
                              <button
                                onClick={() => handleRestore(category.id, category.category_name)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                                title="Restore Category"
                                aria-label={`Restore ${category.category_name}`}
                              >
                                <RefreshCw size={18} aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                onClick={() => handleDelete(category.id, category.category_name)}
                                title="Delete Category"
                                aria-label={`Delete ${category.category_name}`}
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
          {Array.isArray(filteredCategories) && filteredCategories.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <span>
                Showing {filteredCategories.length} of {categories.length} categories
              </span>
              <div className="flex gap-4">
                <span>
                  Active: <strong className="text-green-600 dark:text-green-400">{activeCount}</strong>
                </span>
                <span>
                  Inactive: <strong className="text-red-600 dark:text-red-400">{inactiveCount}</strong>
                </span>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
