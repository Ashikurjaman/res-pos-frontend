import axios from "axios";
import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
interface Category {
  id: number;
  category_name: string;
}

interface Product {
  id: number;
  product_name: string;
  price: number;
}

export default function CategoryShow() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/category")
      .then((response) => {
        setCategories(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        setLoading(false);
      });
  }, []);

  const handleCategoryClick = (categoryId: number, categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsOpen(true);

    // 🔹 Fetch products by category
    axios
      .get(`http://localhost:8000/api/products-load?category_id=${categoryId}`)
      .then((response) => {
        setProducts(response.data);
        setLoadingProducts(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setProducts([]);
      });
  };

  if (loading) {
    return <div className="p-4">Loading categories...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg text-center font-semibold mb-3 dark:border-white/[0.05] dark:bg-white/[0.03]">
        Categories
      </h2>
      <div className="flex flex-col gap-3">
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() =>
              handleCategoryClick(category.id, category.category_name)
            }
            className="bg-blue-500 text-white py-1 px-1 rounded-lg shadow hover:bg-blue-600 transition text-center dark:border-white/[0.05] dark:bg-white/[0.03]"
          >
            {category.category_name}
          </button>
        ))}
      </div>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute mt-4 top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 shadow-lg p-4 overflow-y-auto"
      >
        <h3 className="text-xl font-semibold mb-3">
          Products in {selectedCategory?.category_name || ""}
        </h3>

        {loadingProducts ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <ul className="space-y-5">
            {products.map((product) => (
              <li
                key={product.id}
                className="border p-2 rounded-md shadow-sm bg-gray-100 dark:bg-gray-800"
              >
                {product.product_name} – 💵 {product.price} Tk
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
