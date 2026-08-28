// src/pages/Product/ProductForm.tsx
import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";

import { ProductFormData, CreateProductData } from "../../type/product";
import Swal from "sweetalert2";
import {
  Loader2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Upload,
} from "lucide-react";
import ProductService from "../../services/ProductService";

type OptionType = { value: string; label: string };

const productTypeOptions: OptionType[] = [
  { value: "1", label: "Sale Product" },
  { value: "2", label: "Raw Materials" },
  { value: "3", label: "Sub Recipe" },
];

const disStatusOptions: OptionType[] = [
  { value: "0", label: "No Discount" },
  { value: "1", label: "Discount Available" },
];

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState<ProductFormData>({
    category_id: 0,
    product_name: "",
    product_code: "",
    cost_price: 0,
    pur_price: 0,
    sale_price: 0,
    expire: "",
    unit_id: 0,
    dis_status: 0,
    vat_rate: 0,
    sd_rate: 0,
    scharge: 0,
    product_type: 1,
    product_image: null,
    opening_balance: 0,
    supplier_id: [],
    food_type: 0,
    outlet_id: 1,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [createData, setCreateData] = useState<CreateProductData | null>(null);

  // Fetch create data
  useEffect(() => {
    if (isAuthenticated) {
      fetchCreateData();
    }
  }, [isAuthenticated]);

  // src/pages/Products/ProductForm.tsx
  // ... imports

  const fetchCreateData = useCallback(async () => {
    try {
      const response = await ProductService.getCreateData();
      // ✅ Access data from response
      const data = response.data || response;
      setCreateData(data);
      setFormData(prev => ({
        ...prev,
        product_code: data.next_code || "",
      }));
    } catch (error: any) {
      console.error("Error fetching create data:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load product data.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchProduct = useCallback(async () => {
    if (!id) return;

    try {
      setFetching(true);
      const data = await ProductService.getById(parseInt(id));
      setFormData({
        category_id: data.category_id || 0,
        product_name: data.product_name || "",
        product_code: data.product_code || "",
        cost_price: data.cost_price || 0,
        pur_price: data.pur_price || 0,
        sale_price: data.sale_price || 0,
        expire: data.expire || "",
        unit_id: data.unit_id || 0,
        dis_status: data.dis_status || 0,
        vat_rate: data.vat_rate || 0,
        sd_rate: data.sd_rate || 0,
        scharge: data.scharge || 0,
        product_type: data.product_type || 1,
        product_image: null,
        opening_balance: data.opening_balance || 0,
        supplier_id: data.supplier_id ? data.supplier_id.split(',').map(Number) : [],
        food_type: data.food_type || 0,
        outlet_id: 1,
      });
      if (data.product_image) {
        setImagePreview(data.product_image);
      }
    } catch (error: any) {
      console.error("Error fetching product:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load product data.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && isEdit) {
      fetchProduct();
    }
  }, [isAuthenticated, isEdit, fetchProduct]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    const val = type === "number" ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, [id]: val }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  }, [errors]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, product_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSelectChange = useCallback(
    (field: keyof ProductFormData, value: OptionType | null) => {
      if (value) {
        setFormData((prev) => ({ ...prev, [field]: parseInt(value.value) }));
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: "" }));
        }
      }
    },
    [errors]
  );

  const handleMultiSelectChange = useCallback(
    (field: keyof ProductFormData, values: OptionType[]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: values.map((v) => parseInt(v.value)),
      }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_name.trim()) {
      newErrors.product_name = "Product name is required";
    }
    if (!formData.product_code.trim()) {
      newErrors.product_code = "Product code is required";
    }
    if (!formData.category_id) {
      newErrors.category_id = "Please select a category";
    }
    if (!formData.unit_id) {
      newErrors.unit_id = "Please select a unit";
    }
    if (formData.pur_price <= 0) {
      newErrors.pur_price = "Purchase price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const formDataObj = new FormData();

      // Append all fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'product_image' && value instanceof File) {
          formDataObj.append(key, value);
        } else if (key === 'supplier_id' && Array.isArray(value)) {
          value.forEach((id) => {
            formDataObj.append('supplier_id[]', id.toString());
          });
        } else if (value !== null && value !== undefined) {
          formDataObj.append(key, value.toString());
        }
      });

      let response;
      if (isEdit) {
        response = await ProductService.update(parseInt(id!), formDataObj);
      } else {
        response = await ProductService.create(formDataObj);
      }

      Swal.fire({
        icon: "success",
        title: isEdit ? "Product Updated!" : "Product Created!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
      navigate("/products-list");
    } catch (error: any) {
      console.error("Error saving product:", error);
      let errorMessage = error.message || "Failed to save product.";
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(", ");
      }
      Swal.fire({
        icon: "error",
        title: isEdit ? "Update Failed!" : "Create Failed!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, isEdit, id, validate, navigate]);

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title={isEdit ? "Edit Product" : "Create Product"}
        description="Product Management"
      />
      <PageBreadcrumb pageTitle={isEdit ? "Edit Product" : "Create Product"} />

      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <ComponentCard title={isEdit ? "Edit Product" : "Create New Product"}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.product_name ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.product_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.product_name}
                    </p>
                  )}
                </div>

                {/* Product Code */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="product_code"
                    value={formData.product_code}
                    onChange={handleChange}
                    placeholder="Enter product code"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.product_code ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.product_code && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.product_code}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={createData?.categories?.map((c) => ({
                      value: c.id.toString(),
                      label: c.category_name,
                    })) || []}
                    value={
                      createData?.categories?.find(
                        (c) => c.id === formData.category_id
                      ) || null
                    }
                    onChange={(val) => handleSelectChange("category_id", val)}
                    className="w-full mt-1"
                    isDisabled={loading}
                  />
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.category_id}
                    </p>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={createData?.units?.map((u) => ({
                      value: u.id.toString(),
                      label: u.unit_name,
                    })) || []}
                    value={
                      createData?.units?.find(
                        (u) => u.id === formData.unit_id
                      ) || null
                    }
                    onChange={(val) => handleSelectChange("unit_id", val)}
                    className="w-full mt-1"
                    isDisabled={loading}
                  />
                  {errors.unit_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.unit_id}
                    </p>
                  )}
                </div>

                {/* Purchase Price */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Purchase Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    id="pur_price"
                    value={formData.pur_price}
                    onChange={handleChange}
                    placeholder="Enter purchase price"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.pur_price ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                  {errors.pur_price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.pur_price}
                    </p>
                  )}
                </div>

                {/* Sale Price */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sale Price
                  </Label>
                  <Input
                    type="number"
                    id="sale_price"
                    value={formData.sale_price}
                    onChange={handleChange}
                    placeholder="Enter sale price"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cost Price
                  </Label>
                  <Input
                    type="number"
                    id="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    placeholder="Enter cost price"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Product Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Type
                  </Label>
                  <Select
                    options={productTypeOptions}
                    value={productTypeOptions.find(
                      (opt) => parseInt(opt.value) === formData.product_type
                    ) || productTypeOptions[0]}
                    onChange={(val) => handleSelectChange("product_type", val)}
                    className="w-full mt-1"
                    isDisabled={loading}
                  />
                </div>

                {/* VAT Rate */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    VAT Rate (%)
                  </Label>
                  <Input
                    type="number"
                    id="vat_rate"
                    value={formData.vat_rate}
                    onChange={handleChange}
                    placeholder="Enter VAT rate"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                    min="0"
                    max="100"
                  />
                </div>

                {/* SD Rate */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    SD Rate (%)
                  </Label>
                  <Input
                    type="number"
                    id="sd_rate"
                    value={formData.sd_rate}
                    onChange={handleChange}
                    placeholder="Enter SD rate"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                    min="0"
                    max="100"
                  />
                </div>

                {/* Service Charge */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Service Charge
                  </Label>
                  <Input
                    type="number"
                    id="scharge"
                    value={formData.scharge}
                    onChange={handleChange}
                    placeholder="Enter service charge"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Discount Status */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discount Status
                  </Label>
                  <Select
                    options={disStatusOptions}
                    value={disStatusOptions.find(
                      (opt) => parseInt(opt.value) === formData.dis_status
                    ) || disStatusOptions[0]}
                    onChange={(val) => handleSelectChange("dis_status", val)}
                    className="w-full mt-1"
                    isDisabled={loading}
                  />
                </div>

                {/* Expire Date */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expire Date
                  </Label>
                  <Input
                    type="date"
                    id="expire"
                    value={formData.expire}
                    onChange={handleChange}
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                {/* Food Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Food Type
                  </Label>
                  <Select
                    options={createData?.food_types?.map((f) => ({
                      value: f.id.toString(),
                      label: f.name,
                    })) || []}
                    value={
                      createData?.food_types?.find(
                        (f) => f.id === formData.food_type
                      ) || null
                    }
                    onChange={(val) => handleSelectChange("food_type", val)}
                    className="w-full mt-1"
                    isDisabled={loading}
                  />
                </div>

                {/* Opening Balance */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Opening Balance
                  </Label>
                  <Input
                    type="number"
                    id="opening_balance"
                    value={formData.opening_balance}
                    onChange={handleChange}
                    placeholder="Enter opening balance"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Suppliers (Multi-select) */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Suppliers
                  </Label>
                  <Select
                    options={createData?.suppliers?.map((s) => ({
                      value: s.id.toString(),
                      label: s.supplier_name,
                    })) || []}
                    value={
                      createData?.suppliers?.filter((s) =>
                        formData.supplier_id.includes(s.id)
                      ).map((s) => ({
                        value: s.id.toString(),
                        label: s.supplier_name,
                      })) || []
                    }
                    onChange={(val) => handleMultiSelectChange("supplier_id", val)}
                    className="w-full mt-1"
                    isDisabled={loading}
                    isMulti={true}
                  />
                </div>

                {/* Product Image */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Image
                  </Label>
                  <div className="mt-1 flex items-center gap-4">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Upload size={20} />
                        <span>Choose Image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                    {imagePreview && (
                      <div className="relative w-16 h-16">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData((prev) => ({ ...prev, product_image: null }));
                          }}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => navigate("/products-list")}
                  className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
                  disabled={loading}
                >
                  <ArrowLeft size={18} />
                  Back to List
                </Button>
                <Button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors min-w-[140px] w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {isEdit ? "Update Product" : "Save Product"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </ComponentCard>

          {/* Quick Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Product Creation Tips
                </h4>
                <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Product name should be unique and descriptive</li>
                  <li>• Product code must be unique</li>
                  <li>• Purchase price must be greater than 0</li>
                  <li>• Upload a clear product image for better identification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
