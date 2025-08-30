import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";

type ProductType = {
  id: number;
  unit_name: string;
  status: string;
};

export default function UnitEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/unit/${id}`);
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
      await axios.put(`http://127.0.0.1:8000/api/unit/${id}`, product);
      Swal.fire({
        icon: "success",
        title: "Unit Saved!",
        text: "✅ Unit saved successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/unit-list"); // Go back to product list
    } catch (err) {
      console.error("Error updating Unit:", err);
      Swal.fire({
        icon: "error",
        title: "Save Failed!",
        text: "❌ Error saving Unit! " + (err.response?.data?.message || ""),
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Unit not found</div>;

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-xl font-bold mb-4">Edit Unit</h1>
      <div className="space-y-4">
        <div>
          <label>Unit Name</label>
          <Input
            type="text"
            id="unit_name"
            value={product.unit_name}
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
