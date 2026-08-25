import { useEffect, useState, useCallback, useMemo } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import axios from "axios";
import Swal from "sweetalert2";
import { Loader2, Save, X, AlertCircle, Package } from "lucide-react";
import { API_CONFIG } from "../../config/api";

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
    vat: "0",
    sd: "0",
  });

  const [categories, setCategories] = useState<OptionType[]>([]);
  const [unit, setUnit] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Product types options
  const productTypes: OptionType[] = useMemo(
    () => [
      { value: "1", label: "Kitchen" },
      { value: "2", label: "Juice" },
      { value: "3", label: "Others" },
    ],
    [],
  );

  // Fetch next product code and dropdown data
  const fetchNextCode = useCallback(async () => {
    try {
      setFetching(true);

      // Fetch product code
      const codeRes = await axios.get(
        `${API_CONFIG.baseURL}/api/products/next-code`,
      );

      // Set product code
      setFormData((prev) => ({
        ...prev,
        product_code: String(codeRes.data.next_code || ""),
      }));

      // Fetch categories
      const categoryRes = await axios.get(`${API_CONFIG.baseURL}/api/category`);
      let categoryData = categoryRes.data;
      if (categoryRes.data && categoryRes.data.data) {
        categoryData = categoryRes.data.data;
      }
      if (!Array.isArray(categoryData)) {
        categoryData = [];
      }

      const categoryOptions = categoryData.map((cat: any) => ({
        value: cat.id?.toString() || "",
        label: cat.category_name || "",
      }));
      setCategories(categoryOptions);

      // Fetch units
      const unitRes = await axios.get(`${API_CONFIG.baseURL}/api/unit`);
      let unitData = unitRes.data;
      if (unitRes.data && unitRes.data.data) {
        unitData = unitRes.data.data;
      }
      if (!Array.isArray(unitData)) {
        unitData = [];
      }

      const unitOptions = unitData.map((u: any) => ({
        value: u.id?.toString() || "",
        label: u.unit_name || "",
      }));
      setUnit(unitOptions);
    } catch (error: any) {
      console.error("Error fetching data:", error);

      let errorMessage =
        "Failed to load product data. Please refresh the page.";
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage =
            error.response.data?.message ||
            error.response.statusText ||
            `Server error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = "Network error - please check your connection";
        }
      }

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchNextCode();
  }, [fetchNextCode]);

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
      if (errors[id]) {
        setErrors((prev) => ({ ...prev, [id]: "" }));
      }
    },
    [errors],
  );

  // Handle Select changes
  const handleSelectChange = useCallback(
    (
      field: keyof Pick<FormData, "category_id" | "product_type" | "unit">,
      value: OptionType | null,
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  // Validate form
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_name.trim()) {
      newErrors.product_name = "Product name is required";
    } else if (formData.product_name.trim().length < 2) {
      newErrors.product_name = "Product name must be at least 2 characters";
    } else if (formData.product_name.trim().length > 100) {
      newErrors.product_name = "Product name must be less than 100 characters";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Please select a category";
    }

    if (!formData.product_type) {
      newErrors.product_type = "Please select a product type";
    }

    if (!formData.price) {
      newErrors.price = "Price is required";
    } else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) <= 0
    ) {
      newErrors.price = "Please enter a valid price greater than 0";
    }

    if (!formData.unit) {
      newErrors.unit = "Please select a unit";
    }

    if (
      formData.vat &&
      (isNaN(parseFloat(formData.vat)) || parseFloat(formData.vat) < 0)
    ) {
      newErrors.vat = "Please enter a valid VAT percentage (0 or more)";
    }

    if (
      formData.sd &&
      (isNaN(parseFloat(formData.sd)) || parseFloat(formData.sd) < 0)
    ) {
      newErrors.sd = "Please enter a valid SD percentage (0 or more)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Save product
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        product_name: formData.product_name.trim(),
        category_id: formData.category_id?.value || "",
        product_type: formData.product_type?.value || "",
        price: parseFloat(formData.price) || 0,
        product_code: formData.product_code,
        unit: formData.unit?.value || "",
        vat: parseFloat(formData.vat) || 0,
        sd: parseFloat(formData.sd) || 0,
      };

      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/products`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      Swal.fire({
        icon: "success",
        title: "Product Saved!",
        text: response.data.message || "Product created successfully!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });

      // Reset form but keep product code
      setFormData({
        product_name: "",
        category_id: null,
        product_type: null,
        price: "",
        product_code: response.data.product_code || formData.product_code,
        unit: null,
        vat: "0",
        sd: "0",
      });
      setErrors({});

      // Fetch next code for new product
      fetchNextCode();
    } catch (error: any) {
      console.error("Error saving product:", error.response?.data || error);

      let errorMessage = "Failed to save product!";
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage =
            error.response.data?.message ||
            error.response.statusText ||
            `Server error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = "Network error - please check your connection";
        }
      }

      Swal.fire({
        icon: "error",
        title: "Save Failed!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, validate, fetchNextCode]);

  // Reset form
  const handleReset = useCallback(() => {
    const hasData =
      formData.product_name.trim() ||
      formData.category_id ||
      formData.product_type ||
      formData.price ||
      formData.unit;

    if (!hasData) {
      Swal.fire({
        icon: "info",
        title: "Form is Empty",
        text: "There is no data to reset.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: "Reset Form?",
      text: "All unsaved data will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reset",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData({
          product_name: "",
          category_id: null,
          product_type: null,
          price: "",
          product_code: formData.product_code,
          unit: null,
          vat: "0",
          sd: "0",
        });
        setErrors({});
        Swal.fire({
          icon: "success",
          title: "Form Reset!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }, [formData]);

  // Loading state
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Product Create" />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="w-10 h-10 animate-spin text-blue-500"
              aria-hidden="true"
            />
            <p className="text-gray-500 text-sm">Loading product data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <PageMeta
        title="Product Create Page | A&T"
        description="Product Create Page"
      />
      <PageBreadcrumb pageTitle="Product Create" />

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl">
          <ComponentCard title="Create New Product">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              noValidate
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="product_name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    className={`mt-1 ${errors.product_name ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={loading}
                    autoFocus
                    aria-describedby={
                      errors.product_name ? "product_name-error" : undefined
                    }
                  />
                  {errors.product_name && (
                    <p
                      id="product_name-error"
                      className="mt-1 text-sm text-red-600 flex items-center gap-1"
                    >
                      <AlertCircle size={14} aria-hidden="true" />
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
                    value={formData.category_id}
                    placeholder="Select a Category"
                    onChange={(val) => handleSelectChange("category_id", val)}
                    className="mt-1"
                    isDisabled={loading}
                  />
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
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
                    placeholder="Select Product Type"
                    value={formData.product_type}
                    onChange={(val) => handleSelectChange("product_type", val)}
                    className="mt-1"
                    isDisabled={loading}
                  />
                  {errors.product_type && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
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
                    Product Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter price"
                    className={`mt-1 ${errors.price ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={loading}
                    step="0.01"
                    min="0"
                    aria-describedby={errors.price ? "price-error" : undefined}
                  />
                  {errors.price && (
                    <p
                      id="price-error"
                      className="mt-1 text-sm text-red-600 flex items-center gap-1"
                    >
                      <AlertCircle size={14} aria-hidden="true" />
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
                    options={unit}
                    placeholder="Select Unit"
                    value={formData.unit}
                    onChange={(val) => handleSelectChange("unit", val)}
                    className="mt-1"
                    isDisabled={loading}
                  />
                  {errors.unit && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.unit}
                    </p>
                  )}
                </div>

                {/* Product Code (Read-only) */}
                <div>
                  <Label
                    htmlFor="product_code"
                    className="text-sm font-medium text-gray-700"
                  >
                    Product Code
                  </Label>
                  <Input
                    type="text"
                    id="product_code"
                    value={formData.product_code}
                    disabled
                    className="mt-1 bg-gray-100 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Auto-generated product code
                  </p>
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
                    value={formData.vat}
                    onChange={handleChange}
                    placeholder="Enter VAT percentage"
                    className={`mt-1 ${errors.vat ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={loading}
                    step="0.01"
                    min="0"
                    max="100"
                    aria-describedby={errors.vat ? "vat-error" : undefined}
                  />
                  {errors.vat && (
                    <p
                      id="vat-error"
                      className="mt-1 text-sm text-red-600 flex items-center gap-1"
                    >
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.vat}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">Default: 0%</p>
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
                    value={formData.sd}
                    onChange={handleChange}
                    placeholder="Enter SD percentage"
                    className={`mt-1 ${errors.sd ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={loading}
                    step="0.01"
                    min="0"
                    max="100"
                    aria-describedby={errors.sd ? "sd-error" : undefined}
                  />
                  {errors.sd && (
                    <p
                      id="sd-error"
                      className="mt-1 text-sm text-red-600 flex items-center gap-1"
                    >
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.sd}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">Default: 0%</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  disabled={loading}
                >
                  <X size={18} aria-hidden="true" />
                  Reset
                </Button>
                <Button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} aria-hidden="true" />
                      Save Product
                    </>
                  )}
                </Button>
              </div>
            </form>
          </ComponentCard>

          {/* Quick Tips */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Package
                  size={20}
                  className="text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  Product Creation Tips
                </h4>
                <ul className="mt-1 text-sm text-blue-700 space-y-1">
                  <li>• Product name should be unique and descriptive</li>
                  <li>• Price must be a positive number</li>
                  <li>• VAT and SD are optional (enter 0 if not applicable)</li>
                  <li>• Product code is auto-generated</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
