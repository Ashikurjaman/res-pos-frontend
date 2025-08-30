import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";

type ProductType = {
  id: number;
  product_name: string;
  category_id: string; // store id
  category_name: string; // optional for display
  product_type: string;
  unit: string;
  price: string;
  stock: string;
  vat: string;
  sd: string;
};
type CategoryType = { id: number; category_name: string };
type UnitType = { id: number; unit_name: string };

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [units, setUnits] = useState<UnitType[]>([]);
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/products/${id}`);
        setProduct(res.data.products); // your product object
        setCategories(res.data.categories); // array of categories
        setUnits(res.data.units); // array of units
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (product) setProduct({ ...product, [e.target.id]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/products/${id}`, product);
      Swal.fire({
        icon: "success",
        title: "Product Saved!",
        text: "✅ Product saved successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/products-list"); // Go back to product list
    } catch (err) {
      console.error("Error updating product:", err);
      Swal.fire({
        icon: "error",
        title: "Save Failed!",
        text: "❌ Error saving product! " + (err.response?.data?.message || ""),
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-xl font-bold mb-4">Edit Product</h1>
      <div className="space-y-4">
        <div>
          <label>Product Name</label>
          <Input
            type="text"
            id="product_name"
            value={product.product_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Category</label>
          <select
            id="category_id"
            value={product.category_id}
            onChange={(e) =>
              setProduct({ ...product, category_id: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Product Type</label>
          <Input
            type="text"
            id="product_type"
            value={product.product_type}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Unit</label>
          <select
            id="unit"
            value={product.unit}
            onChange={(e) => setProduct({ ...product, unit: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            {units.map((c) => (
              <option key={c.id} value={c.id}>
                {c.unit_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Price</label>
          <Input
            type="text"
            id="price"
            value={product.price}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Stock</label>
          <Input
            type="text"
            id="stock"
            value={product.stock}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Vat</label>
          <Input
            type="text"
            id="vat"
            value={product.vat}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>SD</label>
          <Input
            type="text"
            id="sd"
            value={product.sd}
            onChange={handleChange}
          />
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
