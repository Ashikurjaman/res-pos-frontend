import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Search,
  RefreshCw,
  Loader2,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Edit2,
  Check,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { API_CONFIG } from "../../config/api";

// ✅ Updated interface to match your backend response EXACTLY
interface ProductStock {
  id: number;
  product_name: string;
  product_code: string;
  price: number;
  pur_price: number;
  sale_price: number;
  branch_stock: number; // ✅ Matches backend 'branch_stock'
  head_office_stock: number; // ✅ Matches backend 'head_office_stock'
  total_stock: number; // ✅ Matches backend 'total_stock'
  category_name: string;
  unit_name: string;
  food_type_name: string | null;
  product_image: string | null;
  vat_rate: number; // ✅ Matches backend 'vat_rate'
  sd_rate: number; // ✅ Matches backend 'sd_rate'
}

interface StockStatus {
  label: string;
  color: string;
  icon: JSX.Element;
}

export default function StockManagement() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredProducts, setFilteredProducts] = useState<ProductStock[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return (
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    );
  }, []);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = products.filter(
        (p) =>
          p.product_name.toLowerCase().includes(term) ||
          p.product_code.toLowerCase().includes(term) ||
          p.category_name.toLowerCase().includes(term),
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await axios.get(
        `${API_CONFIG.baseURL}/products/with-stock`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      // Handle your response structure: { status: 'success', data: [...] }
      let productsData = [];
      if (
        response.data?.status === "success" &&
        Array.isArray(response.data?.data)
      ) {
        productsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      }

      setProducts(productsData);
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
        });
        return;
      }

      let errorMessage = "Failed to load products with stock.";
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage =
            error.response.data?.message ||
            error.response.statusText ||
            `Server error: ${error.response.status}`;
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
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  const handleEditStock = useCallback((product: ProductStock) => {
    setEditingId(product.id);
    // ✅ Use branch_stock
    setEditValue(product.branch_stock?.toString() || "0");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  const handleUpdateStock = useCallback(
    async (id: number) => {
      const stockValue = parseInt(editValue);

      if (isNaN(stockValue) || stockValue < 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Stock",
          text: "Please enter a valid stock quantity (0 or more).",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      setUpdating(true);
      try {
        const token = getAuthToken();

        // ✅ Match your controller's expected payload
        await axios.put(
          `${API_CONFIG.baseURL}/products/${id}/stock`,
          {
            stock: stockValue,
            outlet_id: 1, // Default outlet
          },
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          },
        );

        // Update local state
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  branch_stock: stockValue,
                  total_stock: stockValue + (p.head_office_stock || 0),
                }
              : p,
          ),
        );

        Swal.fire({
          icon: "success",
          title: "Stock Updated!",
          text: "Product stock updated successfully!",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });

        setEditingId(null);
        setEditValue("");
      } catch (error: any) {
        console.error("Error updating stock:", error);

        if (error.response?.status === 401) {
          Swal.fire({
            icon: "error",
            title: "Session Expired",
            text: "Your session has expired. Please login again.",
            confirmButtonColor: "#3b82f6",
          }).then(() => {
            localStorage.removeItem("authToken");
            sessionStorage.removeItem("authToken");
          });
          return;
        }

        let errorMessage = "Failed to update stock.";
        if (axios.isAxiosError(error)) {
          if (error.response) {
            errorMessage =
              error.response.data?.message ||
              error.response.statusText ||
              `Server error: ${error.response.status}`;
          } else if (error.request) {
            errorMessage = "Network error - please check your connection";
          }
        }

        Swal.fire({
          icon: "error",
          title: "Update Failed!",
          text: errorMessage,
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setUpdating(false);
      }
    },
    [editValue, getAuthToken],
  );

  const getStockStatus = useCallback((stock: number): StockStatus => {
    if (stock <= 0)
      return {
        label: "Out of Stock",
        color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
        icon: (
          <AlertCircle
            size={14}
            className="text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
        ),
      };
    if (stock <= 5)
      return {
        label: "Low Stock",
        color:
          "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
        icon: (
          <AlertCircle
            size={14}
            className="text-yellow-600 dark:text-yellow-400"
            aria-hidden="true"
          />
        ),
      };
    if (stock <= 20)
      return {
        label: "Medium Stock",
        color:
          "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
        icon: (
          <AlertCircle
            size={14}
            className="text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
        ),
      };
    return {
      label: "High Stock",
      color:
        "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
      icon: (
        <AlertCircle
          size={14}
          className="text-green-600 dark:text-green-400"
          aria-hidden="true"
        />
      ),
    };
  }, []);

  const handleRefresh = useCallback(() => {
    fetchProducts();
    setSearchTerm("");
  }, [fetchProducts]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // ✅ Updated stats to use total_stock
  const stats = useMemo(() => {
    const totalStock = products.reduce(
      (sum, p) => sum + (p.total_stock || 0),
      0,
    );
    const totalProducts = products.length;
    const lowStockCount = products.filter(
      (p) => (p.branch_stock || 0) <= 5 && (p.branch_stock || 0) > 0,
    ).length;
    const outOfStockCount = products.filter(
      (p) => (p.branch_stock || 0) <= 0,
    ).length;

    return {
      totalStock,
      totalProducts,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Stock Management" />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="w-10 h-10 animate-spin text-blue-500"
              aria-hidden="true"
            />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Loading stock data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title="Stock Management | A&T"
        description="Stock Management Page"
      />
      <PageBreadcrumb pageTitle="Stock Management" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalProducts}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <Package
                  size={24}
                  className="text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Stock
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalStock}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <TrendingUp
                  size={24}
                  className="text-green-600 dark:text-green-400"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Low Stock
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {stats.lowStockCount}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <TrendingDown
                  size={24}
                  className="text-yellow-600 dark:text-yellow-400"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {stats.outOfStockCount}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle
                  size={24}
                  className="text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Component */}
        <ComponentCard title="Stock Management">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={18}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                aria-label="Search products"
              />
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Product
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
                      Unit
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Price
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Branch Stock
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Head Office
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Total Stock
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
                      Action
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package
                            className="w-12 h-12 text-gray-300 dark:text-gray-600"
                            aria-hidden="true"
                          />
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm
                              ? "No products match your search"
                              : "No products found"}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={handleClearSearch}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(
                        product.branch_stock || 0,
                      );
                      const isEditing = editingId === product.id;

                      return (
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
                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                              {product.product_code}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {product.category_name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {product.unit_name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              ৳{product.price?.toFixed(2) || "0.00"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-20 text-center border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                  min="0"
                                  autoFocus
                                  aria-label="Edit stock quantity"
                                />
                              </div>
                            ) : (
                              <span
                                className={`font-bold ${stockStatus.color}`}
                              >
                                {product.branch_stock || 0}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <span className="text-gray-600 dark:text-gray-300">
                              {product.head_office_stock || 0}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              {product.total_stock || 0}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                            >
                              {stockStatus.icon}
                              {stockStatus.label}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleUpdateStock(product.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                                  disabled={updating}
                                  title="Save"
                                  aria-label="Save stock update"
                                >
                                  {updating ? (
                                    <Loader2
                                      size={18}
                                      className="animate-spin"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Check size={18} aria-hidden="true" />
                                  )}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                  title="Cancel"
                                  aria-label="Cancel editing"
                                >
                                  <X size={18} aria-hidden="true" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditStock(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Edit Stock"
                                aria-label={`Edit stock for ${product.product_name}`}
                              >
                                <Edit2 size={18} aria-hidden="true" />
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <span>
                Showing {filteredProducts.length} of {products.length} products
              </span>
              <div className="flex flex-wrap gap-4">
                <span>
                  Total Stock:{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {stats.totalStock}
                  </strong>
                </span>
                <span>
                  Low Stock:{" "}
                  <strong className="text-yellow-600 dark:text-yellow-400">
                    {stats.lowStockCount}
                  </strong>
                </span>
                <span>
                  Out of Stock:{" "}
                  <strong className="text-red-600 dark:text-red-400">
                    {stats.outOfStockCount}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
