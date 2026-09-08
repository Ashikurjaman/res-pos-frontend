import { useEffect, useState, useCallback, useMemo } from "react";
import { Modal } from "../../components/ui/modal";
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  Grid,
  List,
} from "lucide-react";
import api from "../../services/api";

interface Category {
  id: number;
  category_name: string;
}

interface Product {
  id: number;
  product_name: string;
  price: number;
  stock: number;
  vat?: number;
  sd?: number;
}

interface CategoryShowProps {
  onAddToCart: (product: {
    id: number;
    product_name: string;
    price: number;
    quantity: number;
    stock: number;
    category: number;
    vat: number;
    sd: number;
  }) => void;
}

export default function CategoryShow({ onAddToCart }: CategoryShowProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [productError, setProductError] = useState<string | null>(null);

  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/category`);
      setCategories(response.data);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      setError(
        error?.message || "Failed to load categories. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCategoryClick = useCallback(
    (categoryId: number, categoryName: string) => {
      setSelectedCategory(categoryName);
      setSelectedCategoryId(categoryId);
      setIsOpen(true);
      setLoadingProducts(true);
      setProductError(null);

      api
        .get(`/products/by-category?category_id=${categoryId}`)
        .then((response) => {
          let productsData = Array.isArray(response)
            ? response
            : response?.data;
          if (!Array.isArray(productsData)) {
            productsData = [];
          }

          productsData = productsData.map((p: any) => ({
            ...p,
            price: parseFloat(p.price) || 0,
            stock: parseInt(p.stock) || 0,
            vat: parseFloat(p.vat) || 0,
            sd: parseFloat(p.sd) || 0,
          }));

          setProducts(productsData);

          const initialQuantities: { [key: number]: number } = {};
          productsData.forEach((p: Product) => {
            initialQuantities[p.id] = 1;
          });
          setQuantities(initialQuantities);
          setLoadingProducts(false);
        })
        .catch((error: any) => {
          console.error("Error fetching products:", error);
          setProductError(
            error?.message || "Failed to load products. Please try again.",
          );
          setProducts([]);
          setLoadingProducts(false);
        });
    },
    [],
  );

  const handleQuantityChange = useCallback(
    (productId: number, delta: number) => {
      setQuantities((prev) => ({
        ...prev,
        [productId]: Math.max(1, (prev[productId] || 1) + delta),
      }));
    },
    [],
  );

  const handleAddToCart = useCallback(
    (product: Product) => {
      const quantity = quantities[product.id] || 1;

      if (quantity > product.stock) {
        alert(`Only ${product.stock} items available in stock!`);
        return;
      }

      onAddToCart({
        id: product.id,
        product_name: product.product_name,
        price: product.price,
        quantity: quantity,
        stock: product.stock,
        category: selectedCategoryId || 0,
        vat: product.vat || 0,
        sd: product.sd || 0,
      });

      setQuantities((prev) => ({
        ...prev,
        [product.id]: 1,
      }));
    },
    [quantities, onAddToCart, selectedCategoryId],
  );

  const getStockStatus = useCallback((stock: number) => {
    if (stock <= 0)
      return {
        label: "Out of stock",
        color: "text-red-700 bg-red-50 border-red-200",
      };
    if (stock <= 5)
      return {
        label: "Low stock",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    return {
      label: "In stock",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  }, []);

  const availableProductsCount = useMemo(
    () => products.filter((p) => p.stock > 0).length,
    [products],
  );

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64 p-4"
        role="status"
        aria-label="Loading categories"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="w-7 h-7 animate-spin text-blue-500"
            aria-hidden="true"
          />
          <p className="text-gray-500 text-sm">Loading categories…</p>
        </div>
      </div>
    );
  }

  // ---------- Error state ----------
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 text-sm font-medium">{error}</p>
          <button
            onClick={fetchCategories}
            className="mt-3 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Categories
        </h2>
        <span className="text-xs text-gray-400">{categories.length} total</span>
      </div>

      {/* Category grid — auto-fill based on the CONTAINER's actual width,
          not the viewport. This makes it adapt correctly whether CategoryShow
          is embedded in a narrow sidebar or shown full-width. */}
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2 max-h-[70vh] overflow-y-auto pr-1"
        role="list"
        aria-label="Product categories"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() =>
              handleCategoryClick(category.id, category.category_name)
            }
            className="min-h-[64px] sm:min-h-[72px] flex items-center justify-center text-center px-3 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 font-medium text-sm hover:bg-blue-100 active:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {category.category_name}
          </button>
        ))}
      </div>

      {/* Product panel — full-screen sheet on mobile, side panel from sm up */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 sm:inset-auto sm:top-0 sm:right-0 sm:h-full sm:w-[420px] md:w-[520px] bg-white shadow-xl flex flex-col"
      >
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {selectedCategory}
            </h3>
            <p className="text-xs text-gray-500">
              {products.length} products · {availableProductsCount} available
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <Grid size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <List size={16} aria-hidden="true" />
              </button>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable product list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loadingProducts ? (
            <div
              className="flex flex-col items-center justify-center h-40 gap-3"
              role="status"
            >
              <Loader2
                className="w-7 h-7 animate-spin text-blue-500"
                aria-hidden="true"
              />
              <p className="text-gray-500 text-sm">Loading products…</p>
            </div>
          ) : productError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 text-sm font-medium">{productError}</p>
              <button
                onClick={() =>
                  selectedCategoryId &&
                  handleCategoryClick(
                    selectedCategoryId,
                    selectedCategory || "",
                  )
                }
                className="mt-3 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
              <ShoppingCart
                className="w-10 h-10 text-gray-300"
                aria-hidden="true"
              />
              <p className="text-gray-500 text-sm">
                No products in this category yet
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-3"
                  : "flex flex-col gap-2"
              }
            >
              {products.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                const quantity = quantities[product.id] || 1;
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className={`border rounded-xl p-3 transition-colors ${
                      viewMode === "grid"
                        ? "flex flex-col gap-2"
                        : "flex items-center gap-3"
                    } ${isOutOfStock ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200"}`}
                  >
                    <div
                      className={viewMode === "grid" ? "" : "flex-1 min-w-0"}
                    >
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {product.product_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-base font-bold text-blue-700">
                          ৳{product.price.toFixed(2)}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${stockStatus.color}`}
                        >
                          {stockStatus.label}
                        </span>
                        {product.stock > 0 && (
                          <span className="text-[11px] text-gray-400">
                            {product.stock} left
                          </span>
                        )}
                      </div>
                    </div>

                    {!isOutOfStock && (
                      <div
                        className={`flex items-center gap-2 ${
                          viewMode === "grid"
                            ? "justify-between mt-1"
                            : "flex-shrink-0"
                        }`}
                      >
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(product.id, -1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
                            disabled={quantity <= 1}
                            aria-label={`Decrease quantity of ${product.product_name}`}
                          >
                            <Minus size={14} aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(product.id, 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
                            disabled={quantity >= product.stock}
                            aria-label={`Increase quantity of ${product.product_name}`}
                          >
                            <Plus size={14} aria-hidden="true" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="min-h-[36px] px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <ShoppingCart size={14} aria-hidden="true" />
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky footer, safe-area aware for mobile home-bar */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50 pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full min-h-[44px] px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
