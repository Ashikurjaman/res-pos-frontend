// src/pages/FoodType/FoodTypeForm.tsx
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
import FoodTypeService from "../../services/FoodTypeService";
import { FoodTypeFormData } from "../../type/foodType";
import Swal from "sweetalert2";
import {
  Loader2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

type OptionType = { value: string; label: string };

const statusOptions: OptionType[] = [
  { value: "1", label: "Online" },
  { value: "0", label: "Offline" },
];

const validityOptions: OptionType[] = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

export default function FoodTypeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState<FoodTypeFormData>({
    type_name: "",
    printer_ip: "",
    onlinestatus: 1,
    validity: 1,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchFoodType = useCallback(async () => {
    if (!id) return;

    try {
      setFetching(true);
      const data = await FoodTypeService.getById(parseInt(id));
      setFormData({
        type_name: data.type_name || "",
        printer_ip: data.printer_ip || "",
        onlinestatus: data.onlinestatus || 1,
        validity: data.validity || 1,
      });
    } catch (error: any) {
      console.error("Error fetching food type:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load food type data.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && isEdit) {
      fetchFoodType();
    }
  }, [isAuthenticated, isEdit, fetchFoodType]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  }, [errors]);

  const handleSelectChange = useCallback(
    (field: keyof Pick<FoodTypeFormData, "onlinestatus" | "validity">, value: OptionType) => {
      setFormData((prev) => ({ ...prev, [field]: parseInt(value.value) }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.type_name.trim()) {
      newErrors.type_name = "Food type name is required";
    } else if (formData.type_name.trim().length < 2) {
      newErrors.type_name = "Food type name must be at least 2 characters";
    } else if (formData.type_name.trim().length > 100) {
      newErrors.type_name = "Food type name must be less than 100 characters";
    }

    if (formData.printer_ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.printer_ip)) {
      newErrors.printer_ip = "Please enter a valid IP address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await FoodTypeService.update(parseInt(id!), formData);
        Swal.fire({
          icon: "success",
          title: "Food Type Updated!",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
      } else {
        await FoodTypeService.create(formData);
        Swal.fire({
          icon: "success",
          title: "Food Type Created!",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
      }
      navigate("/food-types");
    } catch (error: any) {
      console.error("Error saving food type:", error);
      let errorMessage = error.message || "Failed to save food type.";
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
        title={isEdit ? "Edit Food Type" : "Create Food Type"}
        description="Food Type Management"
      />
      <PageBreadcrumb pageTitle={isEdit ? "Edit Food Type" : "Create Food Type"} />

      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <ComponentCard title={isEdit ? "Edit Food Type" : "Create New Food Type"}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {/* Type Name */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Food Type Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="type_name"
                    value={formData.type_name}
                    onChange={handleChange}
                    placeholder="Enter food type name"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.type_name ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                    autoFocus
                  />
                  {errors.type_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.type_name}
                    </p>
                  )}
                </div>

                {/* Printer IP */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Printer IP
                  </Label>
                  <Input
                    type="text"
                    id="printer_ip"
                    value={formData.printer_ip}
                    onChange={handleChange}
                    placeholder="Enter printer IP (e.g., 192.168.1.100)"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.printer_ip ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.printer_ip && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.printer_ip}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Optional: IP address for kitchen printer
                  </p>
                </div>

                {/* Online Status */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </Label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find(
                      (opt) => parseInt(opt.value) === formData.onlinestatus
                    ) || statusOptions[0]}
                    onChange={(val) => handleSelectChange("onlinestatus", val)}
                    className="w-full mt-1"
                    isDisabled={loading}
                  />
                </div>

                {/* Validity */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Validity
                  </Label>
                  <Select
                    options={validityOptions}
                    value={validityOptions.find(
                      (opt) => parseInt(opt.value) === formData.validity
                    ) || validityOptions[0]}
                    onChange={(val) => handleSelectChange("validity", val)}
                    className="w-full mt-1"
                    isDisabled={loading}
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    onClick={() => navigate("/food-types")}
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
                        {isEdit ? "Update Food Type" : "Save Food Type"}
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
              <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Quick Tips
                </h4>
                <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Food type name should be unique</li>
                  <li>• Printer IP is optional for kitchen printing</li>
                  <li>• Set status to "Online" for active food types</li>
                  <li>• Inactive food types won't appear in dropdowns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
