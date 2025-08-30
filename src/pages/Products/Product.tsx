import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import axios from "axios";
import Swal from "sweetalert2";

type OptionType = { value: string; label: string };
interface FormData {
  product_name: string;
  category_id: OptionType | null;
  product_type: OptionType | null;
  price: string;
  product_code: string;
  unit: OptionType | null;
  vat: string;
  sd: string;
}

export default function Product() {
  const [formData, setFormData] = useState<FormData>({
    product_name: "",
    category_id: null,
    product_type: null,
    price: "",
    product_code: "",
    unit: null,
    vat: "",
    sd: "",
  });

  const [categories, setCategories] = useState<OptionType[]>([]);
  const [unit, setUnit] = useState<OptionType[]>([]);

  const productTypes: OptionType[] = [
    { value: "1", label: "Kitchen" },
    { value: "2", label: "Juice" },
    { value: "3", label: "Others" },
  ];

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Handle Select changes
  const handleSelectChange = (
    field: keyof Pick<FormData, "category_id" | "product_type" | "unit">,
    value: OptionType | null
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  // Save product
  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        product_type: formData.product_type?.value || "",
        unit: formData.unit?.value || "",
      };

      const res = await axios.post(
        "http://127.0.0.1:8000/api/products",
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Product Saved!",
        text: "✅ Product saved successfully!",
        timer: 2000,
        showConfirmButton: false,
      });

      // Reset form but keep updated product code
      setFormData({
        product_name: "",
        category_id: null,
        product_type: null,
        price: "",
        product_code: res.data.product_code || "",
        unit: null,
        vat: "",
        sd: "",
      });
      fetchNextCode();
    } catch (error: any) {
      console.error("Error saving product:", error.response?.data || error);
      Swal.fire({
        icon: "error",
        title: "Save Failed!",
        text:
          "❌ Error saving product! " + (error.response?.data?.message || ""),
      });
    }
  };

  // Fetch next product code

  const fetchNextCode = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/products/next-code"
      );
      setFormData((prev) => ({
        ...prev,
        product_code: String(res.data.next_code),
      }));
      const categoryOptions = res.data.category.map((cat: any) => ({
        value: cat.id.toString(),
        label: cat.category_name,
      }));
      const unitOption = res.data.units.map((unit: any) => ({
        value: unit.id.toString(),
        label: unit.unit_name,
      }));
      setCategories(categoryOptions);
      setUnit(unitOption);
    } catch (error) {
      console.error("Error fetching product code:", error);
    }
  };

  useEffect(() => {
    fetchNextCode();
  }, []);

  return (
    <div>
      <PageMeta
        title="Product Create Page | A&T"
        description="Product Create Page"
      />
      <PageBreadcrumb pageTitle="Product Create" />

      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-lg">
          <ComponentCard title="Product Create">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                  type="text"
                  id="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <Label>Select Category</Label>
                <Select
                  options={categories}
                  value={formData.category_id}
                  placeholder="Select a Category"
                  onChange={(val) => handleSelectChange("category_id", val)}
                />
              </div>

              <div>
                <Label>Product Type</Label>
                <Select
                  className="border-2"
                  options={productTypes}
                  placeholder="Select Product Type"
                  value={formData.product_type}
                  onChange={(val) => handleSelectChange("product_type", val)}
                />
              </div>

              <div>
                <Label htmlFor="vat">Vat</Label>
                <Input
                  type="text"
                  id="vat"
                  value={formData.vat}
                  onChange={handleChange}
                  placeholder="Enter vat"
                />
              </div>

              <div>
                <Label htmlFor="sd">SD</Label>
                <Input
                  type="text"
                  id="sd"
                  value={formData.sd}
                  onChange={handleChange}
                  placeholder="Enter sd"
                />
              </div>

              <div>
                <Label htmlFor="price">Product Price</Label>
                <Input
                  type="text"
                  id="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                />
              </div>

              <div>
                <Label htmlFor="product_code">Product Code</Label>
                <Input
                  type="text"
                  id="product_code"
                  value={formData.product_code}
                  disabled
                />
              </div>

              <div>
                <Label>Unit</Label>
                <Select
                  options={unit}
                  placeholder="Select Unit"
                  value={formData.unit}
                  onChange={(val) => handleSelectChange("unit", val)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
