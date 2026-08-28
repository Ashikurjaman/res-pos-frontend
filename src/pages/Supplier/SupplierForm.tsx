// src/pages/Supplier/SupplierForm.tsx
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
import SupplierService from "../../services/SupplierService";
import { SupplierFormData } from "../../types/supplier";
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

const validityOptions: OptionType[] = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

export default function SupplierForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState<SupplierFormData>({
    entrydate: new Date().toISOString().split('T')[0],
    supplier_name: "",
    address: "",
    contact_no: "",
    username: "",
    bin_nid: "",
    ope_balance: 0,
    adv_balance: 0,
    due_balance: 0,
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

  const fetchSupplier = useCallback(async () => {
    if (!id) return;

    try {
      setFetching(true);
      const data = await SupplierService.getById(parseInt(id));
      setFormData({
        entrydate: data.entrydate || new Date().toISOString().split('T')[0],
        supplier_name: data.supplier_name || "",
        address: data.address || "",
        contact_no: data.contact_no || "",
        username: data.username || "",
        bin_nid: data.bin_nid || "",
        ope_balance: data.ope_balance || 0,
        adv_balance: data.adv_balance || 0,
        due_balance: data.due_balance || 0,
        validity: data.validity || 1,
      });
    } catch (error: any) {
      console.error("Error fetching supplier:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load supplier data.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && isEdit) {
      fetchSupplier();
    }
  }, [isAuthenticated, isEdit, fetchSupplier]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  }, [errors]);

  const handleSelectChange = useCallback(
    (field: keyof Pick<SupplierFormData, "validity">, value: OptionType) => {
      setFormData((prev) => ({ ...prev, [field]: parseInt(value.value) }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_name.trim()) {
      newErrors.supplier_name = "Supplier name is required";
    }
    if (!formData.contact_no.trim()) {
      newErrors.contact_no = "Contact number is required";
    }
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
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
        await SupplierService.update(parseInt(id!), formData);
        Swal.fire({
          icon: "success",
          title: "Supplier Updated!",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
      } else {
        await SupplierService.create(formData);
        Swal.fire({
          icon: "success",
          title: "Supplier Created!",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
      }
      navigate("/suppliers");
    } catch (error: any) {
      console.error("Error saving supplier:", error);
      Swal.fire({
        icon: "error",
        title: isEdit ? "Update Failed!" : "Create Failed!",
        text: error.message || "Failed to save supplier.",
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
        title={isEdit ? "Edit Supplier" : "Create Supplier"}
        description="Supplier Management"
      />
      <PageBreadcrumb pageTitle={isEdit ? "Edit Supplier" : "Create Supplier"} />

      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <ComponentCard title={isEdit ? "Edit Supplier" : "Create New Supplier"}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {/* Supplier Name */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Supplier Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleChange}
                    placeholder="Enter supplier name"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.supplier_name ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.supplier_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.supplier_name}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.username ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="contact_no"
                    value={formData.contact_no}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.contact_no ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.contact_no && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.contact_no}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </Label>
                  <Input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                {/* BIN/NID */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    BIN/NID
                  </Label>
                  <Input
                    type="text"
                    id="bin_nid"
                    value={formData.bin_nid}
                    onChange={handleChange}
                    placeholder="Enter BIN or NID"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                {/* Opening Balance */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Opening Balance
                  </Label>
                  <Input
                    type="number"
                    id="ope_balance"
                    value={formData.ope_balance}
                    onChange={handleChange}
                    placeholder="Enter opening balance"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                    step="0.01"
                  />
                </div>

                {/* Advance Balance */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Advance Balance
                  </Label>
                  <Input
                    type="number"
                    id="adv_balance"
                    value={formData.adv_balance}
                    onChange={handleChange}
                    placeholder="Enter advance balance"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                    step="0.01"
                  />
                </div>

                {/* Due Balance */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Due Balance
                  </Label>
                  <Input
                    type="number"
                    id="due_balance"
                    value={formData.due_balance}
                    onChange={handleChange}
                    placeholder="Enter due balance"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                    step="0.01"
                  />
                </div>

                {/* Validity */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
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
                    onClick={() => navigate("/suppliers")}
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
                        {isEdit ? "Update Supplier" : "Save Supplier"}
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
                  <li>• Supplier name must be unique</li>
                  <li>• Contact number should be valid</li>
                  <li>• Inactive suppliers won't appear in dropdowns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
