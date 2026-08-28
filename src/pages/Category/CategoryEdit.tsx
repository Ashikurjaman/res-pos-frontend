// src/pages/Category/CategoryEdit.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import { useAuth } from "../../hooks/useAuth";
import { API_CONFIG } from "../../config/api";
import {
  Loader2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

type OptionType = { value: string; label: string };

interface CategoryType {
  id: number;
  category_name: string;
  status: string | number;
  created_at?: string;
  updated_at?: string;
}

export default function CategoryEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [category, setCategory] = useState<CategoryType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<CategoryType | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  }, []);

  const fetchCategory = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await axios.get(`${API_CONFIG.baseURL}/category/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      let categoryData = response.data;
      if (response.data.data) {
        categoryData = response.data.data;
      }

      setCategory(categoryData);
      setOriginalData(categoryData);
    } catch (error: any) {
      console.error("Error fetching category:", error);

      if (error.response?.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
          navigate("/signin");
        });
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response?.data?.message || "Failed to load category data.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [id, getAuthToken, navigate]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchCategory();
    }
  }, [isAuthenticated, id, fetchCategory]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      if (category) {
        setCategory({ ...category, [id]: value });
        if (errors[id]) {
          setErrors((prev) => ({ ...prev, [id]: "" }));
        }
      }
    },
    [category, errors],
  );

  const handleSelectChange = useCallback(
    (value: OptionType) => {
      if (category) {
        setCategory({ ...category, status: value.value });
      }
      if (errors.status) {
        setErrors((prev) => ({ ...prev, status: "" }));
      }
    },
    [category, errors],
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!category?.category_name?.trim()) {
      newErrors.category_name = "Category name is required";
    } else if (category.category_name.trim().length < 2) {
      newErrors.category_name = "Category name must be at least 2 characters";
    } else if (category.category_name.trim().length > 50) {
      newErrors.category_name = "Category name must be less than 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [category]);

  const handleSave = useCallback(async () => {
    if (!validate() || !category) return;

    setSaving(true);
    try {
      const token = getAuthToken();

      const payload = {
        category_name: category.category_name.trim(),
        status: parseInt(category.status?.toString() || "1"),
        validity: 1,
      };

      await axios.put(`${API_CONFIG.baseURL}/category/${id}`, payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      Swal.fire({
        icon: "success",
        title: "Category Updated!",
        text: "Category updated successfully!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });

      navigate("/category-list");
    } catch (error: any) {
      console.error("Error updating category:", error);

      if (error.response?.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
          navigate("/signin");
        });
        return;
      }

      let errorMessage = "Failed to update category!";
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
  }, [category, validate, id, getAuthToken, navigate]);

  const handleDelete = useCallback(async () => {
    const result = await Swal.fire({
      title: "Delete Category?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const token = getAuthToken();

      await axios.delete(`${API_CONFIG.baseURL}/category/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Category deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
      navigate("/category-list");
    } catch (error: any) {
      if (error.response?.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
          navigate("/signin");
        });
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: error.response?.data?.message || "Failed to delete category.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [id, getAuthToken, navigate]);

  const handleBack = useCallback(() => {
    if (JSON.stringify(category) !== JSON.stringify(originalData)) {
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
          navigate("/category-list");
        }
      });
    } else {
      navigate("/category-list");
    }
  }, [category, originalData, navigate]);

  const statusOptions: OptionType[] = [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ];

  const getCurrentStatus = useCallback(() => {
    const statusValue = category?.status?.toString() || "1";
    return statusOptions.find((opt) => opt.value === statusValue) || statusOptions[0];
  }, [category, statusOptions]);

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

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Edit Category" />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading category data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Edit Category" />
        <div className="flex items-center justify-center h-64">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
              Category Not Found
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              The category you're looking for doesn't exist.
            </p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to Category List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title={`Edit Category - ${category.category_name} | A&T`}
        description="Edit Category Page"
      />
      <PageBreadcrumb pageTitle="Edit Category" />

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl">
          <ComponentCard title={`Edit Category: ${category.category_name}`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              noValidate
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Name */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="category_name"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="category_name"
                    value={category.category_name || ""}
                    onChange={handleChange}
                    placeholder="Enter category name"
                    className={`mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.category_name
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={saving}
                    autoFocus
                  />
                  {errors.category_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.category_name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Category name should be unique and descriptive
                  </p>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </Label>
                  <Select
                    options={statusOptions}
                    placeholder="Select status"
                    value={getCurrentStatus()}
                    onChange={handleSelectChange}
                    className="mt-1"
                    isDisabled={saving}
                  />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Active categories will be visible in the system
                  </p>
                </div>

                {/* Created At (Read-only) */}
                {category.created_at && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created At
                    </Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                      {new Date(category.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                <Button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  disabled={saving}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Back to List
                </Button>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} aria-hidden="true" />
                        Update Category
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </ComponentCard>

          {/* Quick Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Edit Tips
                </h4>
                <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Update category name to reflect changes</li>
                  <li>• Deactivating hides category from dropdowns</li>
                  <li>• Changes will be reflected immediately</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Delete Option */}
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Danger Zone
                </h4>
                <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
