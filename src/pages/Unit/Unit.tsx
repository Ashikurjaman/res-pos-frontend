import { useState } from "react";
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
import {
  Loader2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";

type OptionType = { value: string; label: string };
interface FormData {
  unit_name: string;
  status: OptionType | null;
}

export default function Unit() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    unit_name: "",
    status: { value: "1", label: "Active" },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    // Clear error for this field
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  // Handle Select changes
  const handleSelectChange = (
    field: keyof Pick<FormData, "status">,
    value: OptionType | null,
  ) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.unit_name.trim()) {
      newErrors.unit_name = "Unit name is required";
    } else if (formData.unit_name.trim().length < 2) {
      newErrors.unit_name = "Unit name must be at least 2 characters";
    } else if (formData.unit_name.trim().length > 50) {
      newErrors.unit_name = "Unit name must be less than 50 characters";
    }

    if (!formData.status) {
      newErrors.status = "Please select a status";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save unit
  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        unit_name: formData.unit_name.trim(),
        status: formData.status?.value || "1",
      };

      console.log("Sending payload:", payload);

      const response = await axios.post(
        "http://localhost:8000/api/unit",
        payload,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      Swal.fire({
        icon: "success",
        title: "Unit Saved!",
        text: response.data.message || "Unit created successfully!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });

      setFormData({
        unit_name: "",
        status: { value: "1", label: "Active" },
      });
      setErrors({});
      navigate("/unit-list");
    } catch (error: any) {
      console.error("Error saving unit:", error.response?.data || error);

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
  };

  // Reset form
  const handleReset = () => {
    if (formData.unit_name.trim() || formData.status?.value !== "1") {
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
          });
        }
      });
    }
  };

  const statusOptions: OptionType[] = [
    { value: "1", label: "Active" },
    { value: "2", label: "Inactive" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
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
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unit Name */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="unit_name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Unit Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="unit_name"
                    value={formData.unit_name}
                    onChange={handleChange}
                    placeholder="Enter unit name (e.g., Kg, Liter, Piece)"
                    className={`mt-1 ${errors.unit_name ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={loading}
                    autoFocus
                  />
                  {errors.unit_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.unit_name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Unit name should be unique and descriptive (e.g., Kg, Liter,
                    Piece)
                  </p>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={statusOptions}
                    placeholder="Select status"
                    value={formData.status}
                    onChange={(val) => handleSelectChange("status", val)}
                    className="mt-1"
                    isDisabled={loading}
                  />
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.status}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Active units will be available for product selection
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <X size={18} />
                  Reset
                </Button>
                <Button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors min-w-[120px]"
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
                      Save Unit
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
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  Quick Tips
                </h4>
                <ul className="mt-1 text-sm text-blue-700 space-y-1">
                  <li>
                    • Unit names should be short and clear (e.g., Kg, Liter)
                  </li>
                  <li>• Use standard unit abbreviations for consistency</li>
                  <li>• Inactive units won't appear in product dropdowns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
