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
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [units, setUnits] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const navigate = useNavigate();

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when search term or category changes
  useEffect(() => {
    let filtered = products;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.product_name.toLowerCase().includes(term) ||
          product.product_code.toLowerCase().includes(term),
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
      const res = await axios.get(`${API_CONFIG.baseURL}/api/products`);

      setProducts(res.data.products.data || res.data.products || []);
      setCategories(res.data.categories || []);
      setUnits(res.data.units || []);
      setFilteredProducts(res.data.products.data || res.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);

      let errorMessage = "Failed to load products.";
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
      await axios.delete(`${API_CONFIG.baseURL}/api/products/${id}`);

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setFilteredProducts((prev) => prev.filter((p) => p.id !== id));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Product deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Error deleting product:", error);

      let errorMessage = "Failed to delete product.";
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
        title: "Delete Failed!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
    }
  }, []);

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
    return Array.from(new Set(products.map((p) => p.category_id))).map(
      (id) => ({
        id,
        name: getCategoryName(id),
      }),
    );
  }, [products, getCategoryName]);

  // Stats
  const stats = useMemo(
    () => ({
      totalProducts: products.length,
      totalCategories: categories.length,
      totalUnits: units.length,
      filteredCount: filteredProducts.length,
    }),
    [products.length, categories.length, units.length, filteredProducts.length],
  );

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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  aria-label="Search products"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Add new product"
              >
                <Plus size={16} aria-hidden="true" />
                Add New
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                {/* Table Header */}
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product Name
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
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Unit
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      VAT
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      SD
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2
                            className="w-5 h-5 animate-spin text-blue-500"
                            aria-hidden="true"
                          />
                          <span className="text-gray-500">
                            Loading products...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package
                            className="w-12 h-12 text-gray-300"
                            aria-hidden="true"
                          />
                          <p className="text-gray-500">
                            {searchTerm || selectedCategory
                              ? "No products match your filters"
                              : "No products found"}
                          </p>
                          {(searchTerm || selectedCategory) && (
                            <button
                              onClick={handleClearFilters}
                              className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                            >
                              Clear filters
                            </button>
                          )}
                          {!searchTerm && !selectedCategory && (
                            <button
                              onClick={() => navigate("/products")}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
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
                        <TableCell className="px-4 py-3">
                          <span className="text-gray-600">
                            {getCategoryName(product.category_id)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-gray-600">
                            {getProductTypeLabel(product.product_type)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span className="text-gray-600">
                            {getUnitName(product.unit)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span className="font-semibold text-blue-600">
                            ৳{parseFloat(product.price).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span className="text-gray-600">{product.vat}%</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span className="text-gray-600">{product.sd}%</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => handleView(product.id)}
                              title="View Product"
                              aria-label={`View ${product.product_name}`}
                            >
                              <Eye size={18} aria-hidden="true" />
                            </button>
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => handleEdit(product.id)}
                              title="Edit Product"
                              aria-label={`Edit ${product.product_name}`}
                            >
                              <Edit size={18} aria-hidden="true" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
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
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 mt-4">
              <span>
                Showing {stats.filteredCount} of {stats.totalProducts} products
              </span>
              <div className="flex flex-wrap gap-4">
                <span>
                  Categories: <strong>{stats.totalCategories}</strong>
                </span>
                <span>
                  Units: <strong>{stats.totalUnits}</strong>
                </span>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
