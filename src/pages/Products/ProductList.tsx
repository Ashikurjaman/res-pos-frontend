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

type ProductType = {
  id: number;
  product_name: string;
  category_id: string;
  product_type: string;
  price: string;
  product_code: string;
  unit: string;
  vat: string;
  sd: string;
  status?: number;
  validity?: number;
  created_at?: string;
  updated_at?: string;
};

type CategoryType = {
  id: number;
  category_name: string;
};

type UnitType = {
  id: number;
  unit_name: string;
};

export default function ProductList() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [units, setUnits] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  }, []);

  // Fetch products on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  // Filter products when search term or category changes
  useEffect(() => {
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let filtered = products;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.product_name?.toLowerCase().includes(term) ||
          product.product_code?.toLowerCase().includes(term),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category_id === selectedCategory,
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const res = await axios.get(
        `${API_CONFIG.baseURL}/api/products`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      // Handle different response structures
      let productsData = [];
      let categoriesData = [];
      let unitsData = [];

      if (res.data && res.data.products) {
        productsData = res.data.products.data || res.data.products || [];
        categoriesData = res.data.categories || [];
        unitsData = res.data.units || [];
      } else if (res.data && res.data.data) {
        productsData = res.data.data.products || res.data.data || [];
        categoriesData = res.data.data.categories || [];
        unitsData = res.data.data.units || [];
      } else if (Array.isArray(res.data)) {
        productsData = res.data;
      } else {
        // Try to extract from response
        const values = Object.values(res.data || {});
        const arrayValue = values.find(v => Array.isArray(v));
        if (arrayValue) {
          productsData = arrayValue;
        }
      }

      setProducts(productsData);
      setCategories(categoriesData);
      setUnits(unitsData);
      setFilteredProducts(productsData);
    } catch (error: any) {
      console.error("Error fetching products:", error);

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

      let errorMessage = "Failed to load products.";
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.message || error.response.statusText || `Server error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = "Network error - please check your connection";
        }
      }

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, navigate]);

  const handleEdit = useCallback(
    (id: number) => {
      navigate(`/products-edit/${id}`);
    },
    [navigate],
  );

  const handleView = useCallback(
    (id: number) => {
      navigate(`/products/${id}`);
    },
    [navigate],
  );

  const handleDelete = useCallback(async (id: number, productName: string) => {
    const result = await Swal.fire({
      title: "Delete Product?",
      text: `Are you sure you want to delete "${productName}"?`,
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
        `${API_CONFIG.baseURL}/api/products/${id}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setFilteredProducts((prev) => prev.filter((p) => p.id !== id));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Product deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      console.error("Error deleting product:", error);

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

      let errorMessage = "Failed to delete product.";
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.message || error.response.statusText || `Server error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = "Network error - please check your connection";
        }
      }

      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [getAuthToken, navigate]);

  const handleRestore = useCallback(async (id: number, productName: string) => {
    const result = await Swal.fire({
      title: "Restore Product?",
      text: `Are you sure you want to restore "${productName}"?`,
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
        `${API_CONFIG.baseURL}/api/products/${id}/restore`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      fetchProducts();

      Swal.fire({
        icon: "success",
        title: "Restored!",
        text: "Product restored successfully.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      console.error("Error restoring product:", error);

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
        text: error.response?.data?.message || "Failed to restore product.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [getAuthToken, navigate, fetchProducts]);

  const getCategoryName = useCallback(
    (categoryId: string) => {
      const category = categories.find((c) => c.id.toString() === categoryId);
      return category?.category_name || "-";
    },
    [categories],
  );

  const getUnitName = useCallback(
    (unitId: string | number) => {
      const unit = units.find((u) => u.id.toString() === unitId.toString());
      return unit?.unit_name || "-";
    },
    [units],
  );

  const getProductTypeLabel = useCallback((type: string) => {
    const types: Record<string, string> = {
      "1": "Kitchen",
      "2": "Juice",
      "3": "Others",
    };
    return types[type] || type || "-";
  }, []);

  const handleRefresh = useCallback(() => {
    fetchProducts();
    setSearchTerm("");
    setSelectedCategory("");
  }, [fetchProducts]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("");
  }, []);

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    if (!Array.isArray(products)) return [];

    const categoryIds = new Set(products.map((p) => p.category_id));
    return Array.from(categoryIds).map((id) => ({
      id,
      name: getCategoryName(id),
    }));
  }, [products, getCategoryName]);

  // Stats
  const stats = useMemo(() => {
    const productArray = Array.isArray(products) ? products : [];
    return {
      totalProducts: productArray.length,
      totalCategories: categories.length,
      totalUnits: units.length,
      filteredCount: filteredProducts.length,
    };
  }, [products, categories, units, filteredProducts]);

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

  return (
    <>
      <PageMeta title="Product List | A&T" description="Product List Page" />
      <PageBreadcrumb pageTitle="Product List" />

      <div className="space-y-6">
        <ComponentCard title="Product Management">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                  aria-label="Search products"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-label="Refresh products"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                Refresh
              </button>
              <button
                onClick={() => navigate("/products")}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Add new product"
              >
                <Plus size={16} aria-hidden="true" />
                Add New
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Products</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalProducts}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Categories</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalCategories}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm text-purple-600 dark:text-purple-400">Units</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalUnits}</p>
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
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Product Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Code
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Category
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Unit
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Price
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      VAT
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      SD
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
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2
                            className="w-5 h-5 animate-spin text-blue-500"
                            aria-hidden="true"
                          />
                          <span className="text-gray-500 dark:text-gray-400">
                            Loading products...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package
                            className="w-12 h-12 text-gray-300 dark:text-gray-600"
                            aria-hidden="true"
                          />
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm || selectedCategory
                              ? "No products match your filters"
                              : "No products found"}
                          </p>
                          {(searchTerm || selectedCategory) && (
                            <button
                              onClick={handleClearFilters}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                            >
                              Clear filters
                            </button>
                          )}
                          {!searchTerm && !selectedCategory && (
                            <button
                              onClick={() => navigate("/products")}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                            >
                              <Plus size={14} aria-hidden="true" />
                              Add your first product
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <TableCell className="px-4 py-3">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {product.product_name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {product.product_code}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-gray-600 dark:text-gray-300">
                            {getCategoryName(product.category_id)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-gray-600 dark:text-gray-300">
                            {getProductTypeLabel(product.product_type)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span className="text-gray-600 dark:text-gray-300">
                            {getUnitName(product.unit)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            ৳{parseFloat(product.price).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span className="text-gray-600 dark:text-gray-300">{product.vat}%</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span className="text-gray-600 dark:text-gray-300">{product.sd}%</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => handleView(product.id)}
                              title="View Product"
                              aria-label={`View ${product.product_name}`}
                            >
                              <Eye size={18} aria-hidden="true" />
                            </button>
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => handleEdit(product.id)}
                              title="Edit Product"
                              aria-label={`Edit ${product.product_name}`}
                            >
                              <Edit size={18} aria-hidden="true" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                              onClick={() =>
                                handleDelete(product.id, product.product_name)
                              }
                              title="Delete Product"
                              aria-label={`Delete ${product.product_name}`}
                            >
                              <Trash2 size={18} aria-hidden="true" />
                            </button>
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
          {Array.isArray(filteredProducts) && filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <span>
                Showing {stats.filteredCount} of {stats.totalProducts} products
              </span>
              <div className="flex flex-wrap gap-4">
                <span>
                  Categories: <strong className="text-blue-600 dark:text-blue-400">{stats.totalCategories}</strong>
                </span>
                <span>
                  Units: <strong className="text-purple-600 dark:text-purple-400">{stats.totalUnits}</strong>
                </span>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
