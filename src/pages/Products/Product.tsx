// src/pages/Products/Product.tsx
import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import ProductService from "../../services/ProductService";
import { CreateProductData } from "../../services/ProductService";
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

type OptionType = { value: string; label: string };

interface FormData {
  product_name: string;
  category_id: number;
  product_type: number;
  price: string;
  product_code: string;
  unit_id: number;
  vat: string;
  sd: string;
  cost_price: string;
  sale_price: string;
  expire: string;
  dis_status: number;
  scharge: string;
  opening_balance: string;
  supplier_id: number[];
  food_type: number;
  outlet_id: number;
  product_image: File | null;
}

export default function Product() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    product_name: "",
    category_id: 0,
    product_type: 1,
    price: "",
    product_code: "",
    unit_id: 0,
    vat: "0",
    sd: "0",
    cost_price: "",
    sale_price: "",
    expire: "",
    dis_status: 0,
    scharge: "0",
    opening_balance: "0",
    supplier_id: [],
    food_type: 0,
    outlet_id: 1,
    product_image: null,
  });

  const [createData, setCreateData] = useState<CreateProductData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Product types options
  const productTypes: OptionType[] = useMemo(
    () => [
      { value: "1", label: "Sale Product" },
      { value: "2", label: "Raw Materials" },
      { value: "3", label: "Sub Recipe" },
    ],
    [],
  );

  const disStatusOptions: OptionType[] = useMemo(
    () => [
      { value: "0", label: "No Discount" },
      { value: "1", label: "Discount Available" },
    ],
    [],
  );

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch create data
  useEffect(() => {
    if (isAuthenticated) {
      fetchCreateData();
    }
  }, [isAuthenticated]);

  const fetchCreateData = useCallback(async () => {
    try {
      setFetching(true);
      const response = await ProductService.getCreateData();
      const data = response.data || response;
      setCreateData(data);

      // Set product code
      if (data.next_code) {
        setFormData(prev => ({
          ...prev,
          product_code: data.next_code,
        }));
      }
    } catch (error: any) {
      console.error("Error fetching create data:", error);

      let errorMessage = "Failed to load product data.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
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

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value, type } = e.target;
      const val = type === "number" ? parseFloat(value) || 0 : value;
      setFormData((prev) => ({ ...prev, [id]: val }));
      if (errors[id]) {
        setErrors((prev) => ({ ...prev, [id]: "" }));
      }
    },
    [errors],
  );

  // Handle Select changes
  const handleSelectChange = useCallback(
    (field: keyof FormData, value: OptionType | null) => {
      if (value) {
        setFormData((prev) => ({ ...prev, [field]: parseInt(value.value) }));
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: "" }));
        }
      }
    },
    [errors],
  );

  // Handle Multi Select changes
  const handleMultiSelectChange = useCallback(
    (field: keyof FormData, values: OptionType[]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: values.map((v) => parseInt(v.value)),
      }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  // Handle file change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormData((prev) => ({ ...prev, product_image: file }));
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [],
  );

  // Validate form
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_name.trim()) {
      newErrors.product_name = "Product name is required";
    } else if (formData.product_name.trim().length < 2) {
      newErrors.product_name = "Product name must be at least 2 characters";
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

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Please enter a valid price greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Save product
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    if (!isAuthenticated) {
      Swal.fire({
        icon: "warning",
        title: "Not Authenticated",
        text: "Please login to save product.",
        confirmButtonColor: "#3b82f6",
      }).then(() => {
        navigate("/signin");
      });
      return;
    }

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
        } else if (value !== null && value !== undefined && value !== "") {
          formDataObj.append(key, value.toString());
        }
      });

      const response = await ProductService.create(formDataObj);

      Swal.fire({
        icon: "success",
        title: "Product Saved!",
        text: response.message || "Product created successfully!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });

      // Reset form
      setFormData({
        product_name: "",
        category_id: 0,
        product_type: 1,
        price: "",
        product_code: response.data?.product_code || formData.product_code,
        unit_id: 0,
        vat: "0",
        sd: "0",
        cost_price: "",
        sale_price: "",
        expire: "",
        dis_status: 0,
        scharge: "0",
        opening_balance: "0",
        supplier_id: [],
        food_type: 0,
        outlet_id: 1,
        product_image: null,
      });
      setImagePreview(null);
      setErrors({});

      // Fetch new code
      fetchCreateData();
    } catch (error: any) {
      console.error("Error saving product:", error);

      let errorMessage = "Failed to save product!";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errorList = Object.values(error.response.data.errors).flat();
        errorMessage = errorList.join(", ");
      } else if (error.message) {
        errorMessage = error.message;
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
  }, [formData, validate, isAuthenticated, navigate, fetchCreateData]);

  // Reset form
  const handleReset = useCallback(() => {
    const hasData = Object.values(formData).some(
      (val) => {
        if (Array.isArray(val)) return val.length > 0;
        if (val instanceof File) return true;
        return val !== "" && val !== 0 && val !== "0" && val !== null;
      }
    );

    if (!hasData && !imagePreview) {
      Swal.fire({
        icon: "info",
        title: "Form is Empty",
        text: "There is no data to reset.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
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
          category_id: 0,
          product_type: 1,
          price: "",
          product_code: formData.product_code,
          unit_id: 0,
          vat: "0",
          sd: "0",
          cost_price: "",
          sale_price: "",
          expire: "",
          dis_status: 0,
          scharge: "0",
          opening_balance: "0",
          supplier_id: [],
          food_type: 0,
          outlet_id: 1,
          product_image: null,
        });
        setImagePreview(null);
        setErrors({});
        Swal.fire({
          icon: "success",
          title: "Form Reset!",
          timer: 1500,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
      }
    });
  }, [formData, imagePreview]);

  const handleBack = useCallback(() => {
    navigate("/products-list");
  }, [navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, return null
  if (!isAuthenticated) {
    return null;
  }

  // Loading state
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Product Create" />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="w-10 h-10 animate-spin text-blue-500"
              aria-hidden="true"
            />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Loading product data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title="Product Create Page | A&T"
        description="Product Create Page"
      />
      <PageBreadcrumb pageTitle="Product Create" />

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-4xl px-2 sm:px-0">
          <ComponentCard title="Create New Product">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              noValidate
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="product_name"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.product_name
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                    autoFocus
                  />
                  {errors.product_name && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.product_name}
                    </p>
                  )}
                </div>

                {/* Product Code */}
                <div>
                  <Label
                    htmlFor="product_code"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Product Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="product_code"
                    value={formData.product_code}
                    onChange={handleChange}
                    placeholder="Enter product code"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.product_code
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                  />
                  {errors.product_code && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.product_code}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={createData?.data?.categories?.map((c) => ({
                      value: c.id.toString(),
                      label: c.category_name,
                    })) || []}
                    value={
                      createData?.data?.categories?.find(
                        (c) => c.id === formData.category_id
                      )
                        ? {
                            value: formData.category_id.toString(),
                            label:
                              createData.data.categories.find(
                                (c) => c.id === formData.category_id
                              )?.category_name || "",
                          }
                        : null
                    }
                    onChange={(val) => handleSelectChange("category_id", val)}
                    className="w-full"
                    isDisabled={loading}
                  />
                  {errors.category_id && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.category_id}
                    </p>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Unit <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={createData?.data?.units?.map((u) => ({
                      value: u.id.toString(),
                      label: u.unit_name,
                    })) || []}
                    value={
                      createData?.data?.units?.find(
                        (u) => u.id === formData.unit_id
                      )
                        ? {
                            value: formData.unit_id.toString(),
                            label:
                              createData.data.units.find(
                                (u) => u.id === formData.unit_id
                              )?.unit_name || "",
                          }
                        : null
                    }
                    onChange={(val) => handleSelectChange("unit_id", val)}
                    className="w-full"
                    isDisabled={loading}
                  />
                  {errors.unit_id && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.unit_id}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <Label
                    htmlFor="price"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter price"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.price
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                  {errors.price && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.price}
                    </p>
                  )}
                </div>

                {/* Product Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Product Type
                  </Label>
                  <Select
                    options={productTypes}
                    value={productTypes.find(
                      (opt) => parseInt(opt.value) === formData.product_type
                    ) || null}
                    onChange={(val) => handleSelectChange("product_type", val)}
                    className="w-full"
                    isDisabled={loading}
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <Label
                    htmlFor="cost_price"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Cost Price
                  </Label>
                  <Input
                    type="number"
                    id="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    placeholder="Enter cost price"
                    className="w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Sale Price */}
                <div>
                  <Label
                    htmlFor="sale_price"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Sale Price
                  </Label>
                  <Input
                    type="number"
                    id="sale_price"
                    value={formData.sale_price}
                    onChange={handleChange}
                    placeholder="Enter sale price"
                    className="w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* VAT Rate */}
                <div>
                  <Label
                    htmlFor="vat"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    VAT Rate (%)
                  </Label>
                  <Input
                    type="number"
                    id="vat"
                    value={formData.vat}
                    onChange={handleChange}
                    placeholder="Enter VAT rate"
                    className="w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                    disabled={loading}
                    min="0"
                    max="100"
                  />
                </div>

                {/* SD Rate */}
                <div>
                  <Label
                    htmlFor="sd"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    SD Rate (%)
                  </Label>
                  <Input
                    type="number"
                    id="sd"
                    value={formData.sd}
                    onChange={handleChange}
                    placeholder="Enter SD rate"
                    className="w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                    disabled={loading}
                    min="0"
                    max="100"
                  />
                </div>

                {/* Service Charge */}
                <div>
                  <Label
                    htmlFor="scharge"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Service Charge
                  </Label>
                  <Input
                    type="number"
                    id="scharge"
                    value={formData.scharge}
                    onChange={handleChange}
                    placeholder="Enter service charge"
                    className="w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                    disabled={loading}
                    step="0.001"
                    min="0"
                  />
                </div>

                {/* Discount Status */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Discount Status
                  </Label>
                  <Select
                    options={disStatusOptions}
                    value={disStatusOptions.find(
                      (opt) => parseInt(opt.value) === formData.dis_status
                    ) || null}
                    onChange={(val) => handleSelectChange("dis_status", val)}
                    className="w-full"
                    isDisabled={loading}
                  />
                </div>

                {/* Expire Date */}
                <div>
                  <Label
                    htmlFor="expire"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Expire Date
                  </Label>
                  <Input
                    type="date"
                    id="expire"
                    value={formData.expire}
                    onChange={handleChange}
                    className="w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                    disabled={loading}
                  />
                </div>

                {/* Opening Balance */}
                <div>
                  <Label
                    htmlFor="opening_balance"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Opening Balance
                  </Label>
                  <Input
                    type="number"
                    id="opening_balance"
                    value={formData.opening_balance}
                    onChange={handleChange}
                    placeholder="Enter opening balance"
                    className="w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Food Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Food Type
                  </Label>
                  <Select
                    options={createData?.data?.food_types?.map((f) => ({
                      value: f.id.toString(),
                      label: f.name,
                    })) || []}
                    value={
                      createData?.data?.food_types?.find(
                        (f) => f.id === formData.food_type
                      )
                        ? {
                            value: formData.food_type.toString(),
                            label:
                              createData.data.food_types.find(
                                (f) => f.id === formData.food_type
                              )?.name || "",
                          }
                        : null
                    }
                    onChange={(val) => handleSelectChange("food_type", val)}
                    className="w-full"
                    isDisabled={loading}
                  />
                </div>

                {/* Suppliers (Multi-select) */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Suppliers
                  </Label>
                  <Select
                    options={createData?.data?.suppliers?.map((s) => ({
                      value: s.id.toString(),
                      label: s.supplier_name,
                    })) || []}
                    value={
                      createData?.data?.suppliers
                        ?.filter((s) => formData.supplier_id.includes(s.id))
                        .map((s) => ({
                          value: s.id.toString(),
                          label: s.supplier_name,
                        })) || []
                    }
                    onChange={(val) => handleMultiSelectChange("supplier_id", val)}
                    className="w-full"
                    isDisabled={loading}
                    isMulti={true}
                    placeholder="Select suppliers"
                  />
                </div>

                {/* Product Image */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
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
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-4 sm:px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto order-2 sm:order-1"
                  disabled={loading}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Back to List
                </Button>
                <Button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-4 sm:px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto order-3 sm:order-2"
                  disabled={loading}
                >
                  <X size={18} aria-hidden="true" />
                  Reset
                </Button>
                <Button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 rounded-lg transition-colors min-w-[120px] w-full sm:w-auto order-1 sm:order-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
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
          <div className="mt-4 sm:mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle
                  size={20}
                  className="text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Product Creation Tips
                </h4>
                <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Product name should be unique and descriptive</li>
                  <li>Product code must be unique</li>
                  <li>Price must be a positive number</li>
                  <li>VAT and SD are optional (enter 0 if not applicable)</li>
                  <li>Upload a clear product image for better identification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
