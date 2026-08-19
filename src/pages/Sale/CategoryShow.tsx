import axios from "axios";
import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Track quantity by product id
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:8000/api/category");
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: number, categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedCategoryId(categoryId);
    setIsOpen(true);
    setLoadingProducts(true);
    setProductError(null);

    axios
      .get(`http://localhost:8000/api/products-load?category_id=${categoryId}`)
      .then((response) => {
        console.log("Products response:", response.data);

        // ✅ Ensure products is an array
        let productsData = response.data;
        if (!Array.isArray(productsData)) {
          productsData = [];
        }

        // ✅ Ensure price is a number
        productsData = productsData.map((p: any) => ({
          ...p,
          price: parseFloat(p.price) || 0,
          stock: parseInt(p.stock) || 0,
          vat: parseFloat(p.vat) || 0,
          sd: parseFloat(p.sd) || 0,
        }));

        setProducts(productsData);

        // Initialize quantities to 1 for new products
        const initialQuantities: { [key: number]: number } = {};
        productsData.forEach((p: Product) => {
          initialQuantities[p.id] = 1;
        });
        setQuantities(initialQuantities);

        setLoadingProducts(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setProductError("Failed to load products. Please try again.");
        setProducts([]);
        setLoadingProducts(false);
      });
  };

  const handleQuantityChange = (productId: number, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta),
    }));
  };

  const handleAddToCart = (product: Product) => {
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

    // Reset quantity to 1 after adding to cart
    setQuantities((prev) => ({
      ...prev,
      [product.id]: 1,
    }));
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0)
      return { label: "Out of Stock", color: "text-red-600 bg-red-50" };
    if (stock <= 5)
      return { label: "Low Stock", color: "text-yellow-600 bg-yellow-50" };
    return { label: "In Stock", color: "text-green-600 bg-green-50" };
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-500 text-sm">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchCategories}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
        <span className="text-xs text-gray-400">
          {categories.length} categories
        </span>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[70vh] overflow-y-auto pr-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() =>
              handleCategoryClick(category.id, category.category_name)
            }
            className="group relative bg-gradient-to-br from-blue-500 to-blue-600 text-white py-3 px-2 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 text-center"
          >
            <span className="text-sm font-medium">
              {category.category_name}
            </span>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        ))}
      </div>

      {/* Products Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute inset-0 md:inset-auto md:mt-4 md:top-0 md:right-0 md:h-full md:w-[600px] bg-white dark:bg-gray-900 shadow-xl p-4 overflow-y-auto"
      >
        <div className="flex flex-col h-full">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedCategory}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {products.length} products available
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Products Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {loadingProducts ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-gray-500 text-sm">Loading products...</p>
              </div>
            ) : productError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 text-sm">{productError}</p>
                <button
                  onClick={() =>
                    selectedCategoryId &&
                    handleCategoryClick(
                      selectedCategoryId,
                      selectedCategory || "",
                    )
                  }
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <ShoppingCart className="w-12 h-12 text-gray-300" />
                <p className="text-gray-500">
                  No products found in this category
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
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
                      className={`border rounded-lg p-3 transition-all hover:shadow-md ${
                        viewMode === "grid"
                          ? "flex flex-col"
                          : "flex items-center gap-4"
                      } ${isOutOfStock ? "opacity-60 bg-gray-50" : "bg-white"}`}
                    >
                      {/* Product Info */}
                      <div
                        className={`flex-1 ${viewMode === "grid" ? "mb-2" : ""}`}
                      >
                        <h4 className="font-medium text-gray-800 text-sm">
                          {product.product_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-lg font-bold text-blue-600">
                            ৳{product.price.toFixed(2)}{" "}
                            {/* ✅ Now price is a number */}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${stockStatus.color}`}
                          >
                            {stockStatus.label}
                          </span>
                          {product.stock > 0 && (
                            <span className="text-xs text-gray-400">
                              Stock: {product.stock}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!isOutOfStock && (
                        <div
                          className={`flex items-center gap-2 ${viewMode === "grid" ? "justify-between" : ""}`}
                        >
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button
                              onClick={() =>
                                handleQuantityChange(product.id, -1)
                              }
                              className="p-1.5 hover:bg-gray-100 transition-colors"
                              disabled={quantity <= 1}
                            >
                              <Minus
                                size={14}
                                className={
                                  quantity <= 1
                                    ? "text-gray-300"
                                    : "text-gray-600"
                                }
                              />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(product.id, 1)
                              }
                              className="p-1.5 hover:bg-gray-100 transition-colors"
                              disabled={quantity >= product.stock}
                            >
                              <Plus
                                size={14}
                                className={
                                  quantity >= product.stock
                                    ? "text-gray-300"
                                    : "text-gray-600"
                                }
                              />
                            </button>
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                          >
                            <ShoppingCart size={14} />
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

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {products.filter((p) => p.stock > 0).length} products available
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
