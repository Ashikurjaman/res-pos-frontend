import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";

type ProductType = {
  id: number;
  category_name: string;
  status: string;
};

export default function CategoryEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/category/${id}`);
        setProduct(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (product) setProduct({ ...product, [e.target.id]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/category/${id}`, product);
      Swal.fire({
        icon: "success",
        title: "Category Saved!",
        text: "✅ Category saved successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/category-list"); // Go back to product list
    } catch (err) {
      console.error("Error updating category:", err);
      Swal.fire({
        icon: "error",
        title: "Save Failed!",
        text: "❌ Error saving product! " + (err.response?.data?.message || ""),
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Category not found</div>;

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-xl font-bold mb-4">Edit Category</h1>
      <div className="space-y-4">
        <div>
          <label>Category Name</label>
          <Input
            type="text"
            id="category_name"
            value={product.category_name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Unit</label>
          <Input
            type="text"
            id="status"
            value={product.status}
            onChange={handleChange}
          />
        </div>

        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
