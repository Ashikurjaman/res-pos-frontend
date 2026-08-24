import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
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

type UnitType = {
  id: number;
  unit_name: string;
  status: string;
};

export default function UnitEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<UnitType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<UnitType | null>(null);

  useEffect(() => {
    if (id) {
      fetchUnit();
    }
  }, [id]);

  const fetchUnit = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/unit/${id}`);
      console.log("Unit data:", res.data);

      const unitData = res.data.data || res.data;
      setUnit(unitData);
      setOriginalData(unitData);
    } catch (error) {
      console.error("Error fetching unit:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to load unit data.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (unit) {
      setUnit({ ...unit, [id]: value });
      if (errors[id]) {
        setErrors((prev) => ({ ...prev, [id]: "" }));
      }
    }
  };

  const handleSelectChange = (value: OptionType | null) => {
    if (unit && value) {
      setUnit({ ...unit, status: value.value });
      if (errors.status) {
        setErrors((prev) => ({ ...prev, status: "" }));
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!unit?.unit_name?.trim()) {
      newErrors.unit_name = "Unit name is required";
    } else if (unit.unit_name.trim().length < 2) {
      newErrors.unit_name = "Unit name must be at least 2 characters";
    } else if (unit.unit_name.trim().length > 50) {
      newErrors.unit_name = "Unit name must be less than 50 characters";
    }

    if (!unit?.status) {
      newErrors.status = "Please select a status";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !unit) return;

    setSaving(true);
    try {
      const payload = {
        unit_name: unit.unit_name.trim(),
        status: unit.status || "1",
      };

      console.log("Updating unit:", payload);

      await axios.put(`http://localhost:8000/api/unit/${id}`, payload);

      Swal.fire({
        icon: "success",
        title: "Unit Updated!",
        text: "Unit updated successfully!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });

      navigate("/unit-list");
    } catch (error: any) {
      console.error("Error updating unit:", error);

      let errorMessage = "Failed to update unit!";
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
    if (JSON.stringify(unit) !== JSON.stringify(originalData)) {
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
          navigate("/unit-list");
        }
      });
    } else {
      navigate("/unit-list");
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Unit?",
      text: `Are you sure you want to delete "${unit?.unit_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:8000/api/unit/${id}`);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Unit deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/unit-list");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: error.response?.data?.message || "Failed to delete unit.",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const statusOptions: OptionType[] = [
    { value: "1", label: "Active" },
    { value: "2", label: "Inactive" },
  ];

  const getCurrentStatus = () => {
    const statusValue = unit?.status?.toString() || "1";
    return (
      statusOptions.find((opt) => opt.value === statusValue) || statusOptions[0]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Edit Unit" />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-gray-500 text-sm">Loading unit data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Edit Unit" />
        <div className="flex items-center justify-center h-64">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-700">
              Unit Not Found
            </h3>
            <p className="text-sm text-red-600 mt-1">
              The unit you're looking for doesn't exist.
            </p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Unit List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <PageMeta
        title={`Edit Unit - ${unit.unit_name} | A&T`}
        description="Edit Unit Page"
      />
      <PageBreadcrumb pageTitle="Edit Unit" />

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl">
          <ComponentCard title={`Edit Unit: ${unit.unit_name}`}>
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
                    value={unit.unit_name || ""}
                    onChange={handleChange}
                    placeholder="Enter unit name"
                    className={`mt-1 ${errors.unit_name ? "border-red-500 focus:ring-red-500" : ""}`}
                    disabled={saving}
                    autoFocus
                  />
                  {errors.unit_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.unit_name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Unit name should be unique and descriptive
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
                    value={getCurrentStatus()}
                    onChange={handleSelectChange}
                    className="mt-1"
                    isDisabled={saving}
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
                        Update Unit
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
                Delete Unit
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
                  <li>• Update unit name if needed</li>
                  <li>• Inactive units won't appear in dropdowns</li>
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
