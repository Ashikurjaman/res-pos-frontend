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

interface ProductStock {
  id: number;
  product_name: string;
  product_code: string;
  price: number;
  category_name: string;
  unit_name: string;
  stock: number;
  prv_stock: number;
  after_stock: number;
  vat: number;
  sd: number;
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
      const response = await axios.get(
        `${API_CONFIG.baseURL}/products/with-stock`,
      );

      const productsData = response.data.data || [];
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);

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
  }, []);

  const handleEditStock = useCallback((product: ProductStock) => {
    setEditingId(product.id);
    setEditValue(product.stock.toString());
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
        await axios.put(`${API_CONFIG.baseURL}/api/products/${id}/stock`, {
          stock: stockValue,
        });

        // Update local state
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  stock: stockValue,
                  prv_stock: p.stock,
                  after_stock: stockValue,
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
        });

        setEditingId(null);
        setEditValue("");
      } catch (error: any) {
        console.error("Error updating stock:", error);

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
    [editValue],
  );

  const getStockStatus = useCallback((stock: number): StockStatus => {
    if (stock <= 0)
      return {
        label: "Out of Stock",
        color: "text-red-600 bg-red-50",
        icon: (
          <AlertCircle size={14} className="text-red-600" aria-hidden="true" />
        ),
      };
    if (stock <= 5)
      return {
        label: "Low Stock",
        color: "text-yellow-600 bg-yellow-50",
        icon: (
          <AlertCircle
            size={14}
            className="text-yellow-600"
            aria-hidden="true"
          />
        ),
      };
    if (stock <= 20)
      return {
        label: "Medium Stock",
        color: "text-blue-600 bg-blue-50",
        icon: (
          <AlertCircle size={14} className="text-blue-600" aria-hidden="true" />
        ),
      };
    return {
      label: "High Stock",
      color: "text-green-600 bg-green-50",
      icon: (
        <AlertCircle size={14} className="text-green-600" aria-hidden="true" />
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

  // Memoized calculations
  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalProducts = products.length;
    const lowStockCount = products.filter(
      (p) => p.stock <= 5 && p.stock > 0,
    ).length;
    const outOfStockCount = products.filter((p) => p.stock <= 0).length;

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
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Stock Management" />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="w-10 h-10 animate-spin text-blue-500"
              aria-hidden="true"
            />
            <p className="text-gray-500 text-sm">Loading stock data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <PageMeta
        title="Stock Management | A&T"
        description="Stock Management Page"
      />
      <PageBreadcrumb pageTitle="Stock Management" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalProducts}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Package
                  size={24}
                  className="text-blue-600"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalStock}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <TrendingUp
                  size={24}
                  className="text-green-600"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {stats.lowStockCount}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <TrendingDown
                  size={24}
                  className="text-yellow-600"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.outOfStockCount}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertCircle
                  size={24}
                  className="text-red-600"
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
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                aria-label="Search products"
              />
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Code
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Category
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Unit
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Stock
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package
                            className="w-12 h-12 text-gray-300"
                            aria-hidden="true"
                          />
                          <p className="text-gray-500">
                            {searchTerm
                              ? "No products match your search"
                              : "No products found"}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={handleClearSearch}
                              className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock);
                      const isEditing = editingId === product.id;

                      return (
                        <TableRow
                          key={product.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="px-4 py-3">
                            <span className="font-medium text-gray-800">
                              {product.product_name}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {product.product_code}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-600">
                            {product.category_name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-600">
                            {product.unit_name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <span className="font-semibold text-blue-600">
                              ৳{product.price}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="0"
                                  autoFocus
                                  aria-label="Edit stock quantity"
                                />
                              </div>
                            ) : (
                              <span
                                className={`font-bold ${stockStatus.color}`}
                              >
                                {product.stock}
                              </span>
                            )}
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
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                  title="Cancel"
                                  aria-label="Cancel editing"
                                >
                                  <X size={18} aria-hidden="true" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditStock(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 mt-4">
              <span>
                Showing {filteredProducts.length} of {products.length} products
              </span>
              <div className="flex flex-wrap gap-4">
                <span>
                  Total Stock: <strong>{stats.totalStock}</strong>
                </span>
                <span>
                  Low Stock:{" "}
                  <strong className="text-yellow-600">
                    {stats.lowStockCount}
                  </strong>
                </span>
                <span>
                  Out of Stock:{" "}
                  <strong className="text-red-600">
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
