import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Swal from "sweetalert2";
import {
  Loader2,
  Save,
  ArrowLeft,
  AlertCircle,
  Package,
  Trash2,
} from "lucide-react";

type OptionType = { value: string; label: string };

interface ProductType {
  id: number;
  product_name: string;
  category_id: string;
  category_name?: string;
  product_type: string;
  unit: string;
  price: string;
  stock: string;
  vat: string;
  sd: string;
}

interface CategoryType {
  id: number;
  category_name: string;
}

interface UnitType {
  id: number;
  unit_name: string;
}

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<OptionType[]>([]);
  const [units, setUnits] = useState<OptionType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<ProductType | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/products/${id}`);
      console.log("Product data:", res.data);

      const productData = res.data.products || res.data;
      setProduct(productData);
      setOriginalData(productData);

      // Convert categories to OptionType format
      const categoryOptions = (res.data.categories || []).map(
        (cat: CategoryType) => ({
          value: cat.id.toString(),
          label: cat.category_name,
        }),
      );
      setCategories(categoryOptions);

      // Convert units to OptionType format
      const unitOptions = (res.data.units || []).map((unit: UnitType) => ({
        value: unit.id.toString(),
        label: unit.unit_name,
      }));
      setUnits(unitOptions);
    } catch (error) {
      console.error("Error fetching product:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to load product data.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (product) {
      setProduct({ ...product, [id]: value });
      if (errors[id]) {
        setErrors((prev) => ({ ...prev, [id]: "" }));
      }
    }
  };

  const handleSelectChange = (
    field: keyof ProductType,
    value: OptionType | null,
  ) => {
    if (product && value) {
      setProduct({ ...product, [field]: value.value });
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!product?.product_name?.trim()) {
      newErrors.product_name = "Product name is required";
    } else if (product.product_name.trim().length < 2) {
      newErrors.product_name = "Product name must be at least 2 characters";
    }

    if (!product?.category_id) {
      newErrors.category_id = "Please select a category";
    }

    if (!product?.product_type?.trim()) {
      newErrors.product_type = "Product type is required";
    }

    if (!product?.unit) {
      newErrors.unit = "Please select a unit";
    }

    if (!product?.price) {
      newErrors.price = "Price is required";
    } else if (
      isNaN(parseFloat(product.price)) ||
      parseFloat(product.price) <= 0
    ) {
      newErrors.price = "Please enter a valid price";
    }

    if (
      product?.stock &&
      (isNaN(parseFloat(product.stock)) || parseFloat(product.stock) < 0)
    ) {
      newErrors.stock = "Please enter a valid stock quantity";
    }

    if (
      product?.vat &&
      (isNaN(parseFloat(product.vat)) || parseFloat(product.vat) < 0)
    ) {
      newErrors.vat = "Please enter a valid VAT percentage";
    }

    if (
      product?.sd &&
      (isNaN(parseFloat(product.sd)) || parseFloat(product.sd) < 0)
    ) {
      newErrors.sd = "Please enter a valid SD percentage";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !product) return;

    setSaving(true);
    try {
      const payload = {
        product_name: product.product_name.trim(),
        category_id: parseInt(product.category_id),
        product_type: product.product_type.trim(),
        unit: parseInt(product.unit),
        price: parseFloat(product.price) || 0,
        stock: parseFloat(product.stock) || 0,
        vat: parseFloat(product.vat) || 0,
        sd: parseFloat(product.sd) || 0,
      };

      console.log("Updating product:", payload);

      await axios.put(`http://localhost:8000/api/products/${id}`, payload);

      Swal.fire({
        icon: "success",
        title: "Product Updated!",
        text: "Product updated successfully!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });

      navigate("/products-list");
    } catch (error: any) {
      console.error("Error updating product:", error);

      let errorMessage = "Failed to update product!";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errorList = Object.values(error.response.data.errors).flat();
        errorMessage = errorList.join(", ");
      }

      Swal.fire({
        icon: "error",
        title: "Update Failed!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (JSON.stringify(product) !== JSON.stringify(originalData)) {
      Swal.fire({
        title: "Unsaved Changes",
        text: "You have unsaved changes. Are you sure you want to leave?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, leave",
        cancelButtonText: "Stay",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/products-list");
        }
      });
    } else {
      navigate("/products-list");
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Product?",
      text: `Are you sure you want to delete "${product?.product_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:8000/api/products/${id}`);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Product deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/products-list");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: error.response?.data?.message || "Failed to delete product.",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const productTypes: OptionType[] = [
    { value: "1", label: "Kitchen" },
    { value: "2", label: "Juice" },
    { value: "3", label: "Others" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Edit Product" />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-gray-500 text-sm">Loading product data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Edit Product" />
        <div className="flex items-center justify-center h-64">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-700">
              Product Not Found
            </h3>
            <p className="text-sm text-red-600 mt-1">
              The product you're looking for doesn't exist.
            </p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Product List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getCurrentCategory = () => {
    return (
      categories.find((c) => c.value === product.category_id?.toString()) ||
      null
    );
  };

  const getCurrentUnit = () => {
    return units.find((u) => u.value === product.unit?.toString()) || null;
  };

  const getCurrentProductType = () => {
    return (
      productTypes.find((t) => t.value === product.product_type?.toString()) ||
      null
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <PageMeta
        title={`Edit Product - ${product.product_name} | A&T`}
        description="Edit Product Page"
      />
      <PageBreadcrumb pageTitle="Edit Product" />

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl">
          <ComponentCard title={`Edit Product: ${product.product_name}`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <Label
                    htmlFor="product_name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="product_name"
                    value={product.product_name || ""}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    className={`mt-1 ${errors.product_name ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={saving}
                    autoFocus
                  />
                  {errors.product_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.product_name}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={categories}
                    value={getCurrentCategory()}
                    placeholder="Select a Category"
                    onChange={(val) => handleSelectChange("category_id", val)}
                    className="mt-1"
                    isDisabled={saving}
                  />
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.category_id}
                    </p>
                  )}
                </div>

                {/* Product Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Product Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={productTypes}
                    value={getCurrentProductType()}
                    placeholder="Select Product Type"
                    onChange={(val) => handleSelectChange("product_type", val)}
                    className="mt-1"
                    isDisabled={saving}
                  />
                  {errors.product_type && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.product_type}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <Label
                    htmlFor="price"
                    className="text-sm font-medium text-gray-700"
                  >
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    id="price"
                    value={product.price || ""}
                    onChange={handleChange}
                    placeholder="Enter price"
                    className={`mt-1 ${errors.price ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={saving}
                    step="0.01"
                    min="0"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.price}
                    </p>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Unit <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={units}
                    value={getCurrentUnit()}
                    placeholder="Select Unit"
                    onChange={(val) => handleSelectChange("unit", val)}
                    className="mt-1"
                    isDisabled={saving}
                  />
                  {errors.unit && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.unit}
                    </p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <Label
                    htmlFor="stock"
                    className="text-sm font-medium text-gray-700"
                  >
                    Stock Quantity
                  </Label>
                  <Input
                    type="number"
                    id="stock"
                    value={product.stock || ""}
                    onChange={handleChange}
                    placeholder="Enter stock quantity"
                    className={`mt-1 ${errors.stock ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={saving}
                    min="0"
                    step="1"
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.stock}
                    </p>
                  )}
                </div>

                {/* VAT */}
                <div>
                  <Label
                    htmlFor="vat"
                    className="text-sm font-medium text-gray-700"
                  >
                    VAT (%)
                  </Label>
                  <Input
                    type="number"
                    id="vat"
                    value={product.vat || ""}
                    onChange={handleChange}
                    placeholder="Enter VAT percentage"
                    className={`mt-1 ${errors.vat ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={saving}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  {errors.vat && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.vat}
                    </p>
                  )}
                </div>

                {/* SD */}
                <div>
                  <Label
                    htmlFor="sd"
                    className="text-sm font-medium text-gray-700"
                  >
                    SD (%)
                  </Label>
                  <Input
                    type="number"
                    id="sd"
                    value={product.sd || ""}
                    onChange={handleChange}
                    placeholder="Enter SD percentage"
                    className={`mt-1 ${errors.sd ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={saving}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  {errors.sd && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.sd}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <Button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
                  disabled={saving}
                >
                  <ArrowLeft size={18} />
                  Back to List
                </Button>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto min-w-[140px]"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Update Product
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </ComponentCard>

          {/* Delete Option */}
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Danger Zone
                </h4>
                <p className="text-xs text-red-600 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Product
              </button>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Edit Tips</h4>
                <ul className="mt-1 text-sm text-blue-700 space-y-1">
                  <li>• Update product information as needed</li>
                  <li>• Price and stock changes affect inventory</li>
                  <li>• VAT and SD percentages are applied to sales</li>
                  <li>• Changes will be reflected immediately</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
