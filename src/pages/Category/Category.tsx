import { useState, useCallback, useEffect } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import axios from "axios";
import Swal from "sweetalert2";
import { Loader2, Save, X, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "../../config/app";

type OptionType = { value: string; label: string };

interface FormData {
  category_name: string;
  status: OptionType;
}

export default function Category() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    category_name: "",
    status: { value: "1", label: "Active" },
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Status options with integer values
  const statusOptions: OptionType[] = [
    { value: "1", label: "Active" },
    { value: "2", label: "Inactive" },
  ];

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
    (field: keyof Pick<FormData, "status">, value: OptionType) => {
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

    if (!formData.category_name.trim()) {
      newErrors.category_name = "Category name is required";
    } else if (formData.category_name.trim().length < 2) {
      newErrors.category_name = "Category name must be at least 2 characters";
    } else if (formData.category_name.trim().length > 50) {
      newErrors.category_name = "Category name must be less than 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.category_name]);

  // Get auth token for API requests
  const getAuthToken = useCallback(() => {
    return (
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    );
  }, []);

  // Save category
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    // Check authentication before making API call
    if (!isAuthenticated) {
      Swal.fire({
        icon: "warning",
        title: "Not Authenticated",
        text: "Please login to save category.",
        confirmButtonColor: "#3b82f6",
      }).then(() => {
        navigate("/signin");
      });
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();

      const payload = {
        category_name: formData.category_name.trim(),
        status: parseInt(formData.status?.value) || 1,
        validity: 1,
      };

      console.log("Sending payload:", payload);

      const response = await axios.post(
        `${API_CONFIG.baseURL}/category`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      Swal.fire({
        icon: "success",
        title: "Category Saved!",
        text: response.data.message || "Category created successfully!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });

      // Reset form
      setFormData({
        category_name: "",
        status: { value: "1", label: "Active" },
      });
      setErrors({});
    } catch (error: any) {
      console.error("Error saving category:", error.response?.data || error);

      // Handle authentication errors
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

      let errorMessage = "Failed to save category!";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errorList = Object.values(error.response.data.errors).flat();
        errorMessage = errorList.join(", ");
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
  }, [formData, validate, isAuthenticated, navigate, getAuthToken]);

  // Reset form
  const handleReset = useCallback(() => {
    const hasData =
      formData.category_name.trim() || formData.status.value !== "1";

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
          category_name: "",
          status: { value: "1", label: "Active" },
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

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      <PageMeta
        title="Category Create Page | A&T"
        description="Category Create Page"
      />
      <PageBreadcrumb pageTitle="Category Create" />

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl px-2 sm:px-0">
          <ComponentCard title="Create New Category">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              noValidate
            >
              <div className="space-y-4 sm:space-y-6">
                {/* Category Name */}
                <div>
                  <Label
                    htmlFor="category_name"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="category_name"
                    value={formData.category_name}
                    onChange={handleChange}
                    placeholder="Enter category name"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.category_name
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                    autoFocus
                  />
                  {errors.category_name && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.category_name}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    Category name should be unique and descriptive
                  </p>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Status
                  </Label>
                  <Select
                    options={statusOptions}
                    placeholder="Select status"
                    value={formData.status}
                    onChange={(val) => handleSelectChange("status", val)}
                    className="w-full"
                    isDisabled={loading}
                  />
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    Active categories will be visible in the system
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-4 sm:px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto order-2 sm:order-1"
                    disabled={loading}
                  >
                    <X size={18} aria-hidden="true" />
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 rounded-lg transition-colors min-w-[120px] w-full sm:w-auto order-1 sm:order-2"
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
                        Save Category
                      </>
                    )}
                  </Button>
                </div>
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
                  Quick Tips
                </h4>
                <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Category names should be unique</li>
                  <li>Use clear and descriptive names</li>
                  <li>Inactive categories won't appear in dropdowns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
