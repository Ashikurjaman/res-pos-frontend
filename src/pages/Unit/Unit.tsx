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
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { API_CONFIG } from "../../config/api";
import {
  Loader2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Package,
  ArrowLeft,
} from "lucide-react";

type OptionType = { value: string; label: string };

interface FormData {
  unit_name: string;
  status: OptionType;
}

export default function Unit() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    unit_name: "",
    status: { value: "1", label: "Active" }, // ✅ Integer as string
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  }, [errors]);

  // Handle Select changes
  const handleSelectChange = useCallback(
    (field: keyof Pick<FormData, "status">, value: OptionType) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  // Validate form
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.unit_name.trim()) {
      newErrors.unit_name = "Unit name is required";
    } else if (formData.unit_name.trim().length < 2) {
      newErrors.unit_name = "Unit name must be at least 2 characters";
    } else if (formData.unit_name.trim().length > 50) {
      newErrors.unit_name = "Unit name must be less than 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.unit_name]);

  // Save unit
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    // Check authentication
    if (!isAuthenticated) {
      Swal.fire({
        icon: "warning",
        title: "Not Authenticated",
        text: "Please login to save unit.",
        confirmButtonColor: "#3b82f6",
      }).then(() => {
        navigate("/signin");
      });
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();

      // ✅ Send status as integer
      const payload = {
        unit_name: formData.unit_name.trim(),
        status: parseInt(formData.status?.value) || 1, // Convert to integer
        validity: 1,
      };

      console.log("Sending payload:", payload);

      const response = await axios.post(
        `${API_CONFIG.baseURL}/unit`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Unit Saved!",
        text: response.data.message || "Unit created successfully!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });

      setFormData({
        unit_name: "",
        status: { value: "1", label: "Active" },
      });
      setErrors({});
      navigate("/unit-list");
    } catch (error: any) {
      console.error("Error saving unit:", error.response?.data || error);

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

      let errorMessage = "Failed to save unit!";
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
      formData.unit_name.trim() || formData.status.value !== "1";

    if (!hasData) {
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
          unit_name: "",
          status: { value: "1", label: "Active" },
        });
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
  }, [formData]);

  const handleBack = useCallback(() => {
    navigate("/unit-list");
  }, [navigate]);

  // ✅ Status options with integer values as strings
  const statusOptions: OptionType[] = [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta title="Unit Create Page | A&T" description="Unit Create Page" />
      <PageBreadcrumb pageTitle="Unit Create" />

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl">
          <ComponentCard title="Create New Unit">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              noValidate
            >
              <div className="space-y-4 sm:space-y-6">
                {/* Unit Name */}
                <div>
                  <Label
                    htmlFor="unit_name"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Unit Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="unit_name"
                    value={formData.unit_name}
                    onChange={handleChange}
                    placeholder="Enter unit name (e.g., Kg, Liter, Piece)"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.unit_name
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                    autoFocus
                  />
                  {errors.unit_name && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.unit_name}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    Unit name should be unique and descriptive (e.g., Kg, Liter, Piece)
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
                    Active units will be available for product selection
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
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
                        Save Unit
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
                <Package size={20} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Quick Tips
                </h4>
                <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Unit names should be short and clear (e.g., Kg, Liter)</li>
                  <li>Use standard unit abbreviations for consistency</li>
                  <li>Inactive units won't appear in product dropdowns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
