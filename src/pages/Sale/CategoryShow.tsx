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
  stock: number;
}
interface CategoryShowProps {
  onAddToCart: (product: {
    id: number;
    product_name: string;
    price: number;
    quantity: number;
    stock: number;
  }) => void;
}

export default function CategoryShow({ onAddToCart }: CategoryShowProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // 👇 Track quantity by product id
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

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
    setLoadingProducts(true);

    axios
      .get(`http://localhost:8000/api/products-load?category_id=${categoryId}`)
      .then((response) => {
        setProducts(response.data);

        // initialize quantities to 0 for new products
        const initialQuantities: { [key: number]: number } = {};
        response.data.forEach((p: Product) => {
          initialQuantities[p.id] = 1;
        });
        setQuantities(initialQuantities);

        setLoadingProducts(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setProducts([]);
        setLoadingProducts(false);
      });
  };

  if (loading) {
    return <div className="p-4">Loading categories...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg text-center font-semibold mb-3">Categories</h2>
      <div className="flex flex-col gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() =>
              handleCategoryClick(category.id, category.category_name)
            }
            className="bg-blue-500 text-white py-1 px-1 rounded-lg shadow hover:bg-blue-600 transition text-center"
          >
            {category.category_name}
          </button>
        ))}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute mt-4 top-0 right-0 h-full max-w-auto bg-white dark:bg-gray-900 shadow-lg p-4 overflow-y-auto"
      >
        <h3 className="text-xl font-semibold mb-3">
          Products in {selectedCategory || ""}
        </h3>

        {loadingProducts ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between border p-1 rounded-md shadow-sm bg-gray-100 dark:bg-gray-800 gap-1"
              >
                {/* Product name button */}
                <button
                  onClick={() =>
                    onAddToCart({
                      id: product.id,
                      product_name: product.product_name,
                      price: product.price,
                      quantity: quantities[product.id] || 1,
                      stock: product.stock,
                    })
                  }
                  className="bg-blue-500 text-white w-40 h-20 px-1 py-3 rounded-md hover:bg-blue-600 transition"
                >
                  {product.product_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
