// src/pages/Outlet/OutletForm.tsx
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
import OutletService from "../../services/OutletService";
import { OutletFormData } from "../../types/outlet";
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
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

const validityOptions: OptionType[] = [
  { value: "1", label: "Valid" },
  { value: "0", label: "Invalid" },
];

export default function OutletForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState<OutletFormData>({
    entrydate: new Date().toISOString().split("T")[0],
    outlet_code: "",
    outlet_name: "",
    short_name: "",
    outlet_address: "",
    outlet_mgr: "",
    mgr_contact_no: "",
    ho_mobile_no: "",
    status: 1,
    vat_reg_no_old: "",
    vat_reg_no_new: "",
    validity: 1,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchOutlet = useCallback(async () => {
    if (!id) return;

    try {
      setFetching(true);
      const data = await OutletService.getById(parseInt(id));
      setFormData({
        entrydate: data.entrydate || new Date().toISOString().split("T")[0],
        outlet_code: data.outlet_code || "",
        outlet_name: data.outlet_name || "",
        short_name: data.short_name || "",
        outlet_address: data.outlet_address || "",
        outlet_mgr: data.outlet_mgr || "",
        mgr_contact_no: data.mgr_contact_no || "",
        ho_mobile_no: data.ho_mobile_no || "",
        status: data.status || 1,
        vat_reg_no_old: data.vat_reg_no_old || "",
        vat_reg_no_new: data.vat_reg_no_new || "",
        validity: data.validity || 1,
      });
    } catch (error: any) {
      console.error("Error fetching outlet:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load outlet data.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && isEdit) {
      fetchOutlet();
    }
  }, [isAuthenticated, isEdit, fetchOutlet]);

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

  const handleSelectChange = useCallback(
    (
      field: keyof Pick<OutletFormData, "status" | "validity">,
      value: OptionType,
    ) => {
      setFormData((prev) => ({ ...prev, [field]: parseInt(value.value) }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.outlet_code.trim()) {
      newErrors.outlet_code = "Outlet code is required";
    }
    if (!formData.outlet_name.trim()) {
      newErrors.outlet_name = "Outlet name is required";
    }
    if (!formData.outlet_address.trim()) {
      newErrors.outlet_address = "Address is required";
    }
    if (!formData.outlet_mgr.trim()) {
      newErrors.outlet_mgr = "Manager name is required";
    }
    if (!formData.mgr_contact_no.trim()) {
      newErrors.mgr_contact_no = "Manager contact number is required";
    }
    if (!formData.ho_mobile_no.trim()) {
      newErrors.ho_mobile_no = "HO mobile number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      try {
        if (isEdit) {
          await OutletService.update(parseInt(id!), formData);
          Swal.fire({
            icon: "success",
            title: "Outlet Updated!",
            text: "Outlet updated successfully!",
            timer: 2000,
            showConfirmButton: false,
            position: "top-end",
            toast: true,
          });
        } else {
          await OutletService.create(formData);
          Swal.fire({
            icon: "success",
            title: "Outlet Created!",
            text: "Outlet created successfully!",
            timer: 2000,
            showConfirmButton: false,
            position: "top-end",
            toast: true,
          });
        }
        navigate("/outlets");
      } catch (error: any) {
        console.error("Error saving outlet:", error);
        Swal.fire({
          icon: "error",
          title: isEdit ? "Update Failed!" : "Create Failed!",
          text: error.message || "Failed to save outlet.",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setLoading(false);
      }
    },
    [formData, isEdit, id, validate, navigate],
  );

  // Show loading
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
        title={isEdit ? "Edit Outlet" : "Create Outlet"}
        description="Outlet Management"
      />
      <PageBreadcrumb pageTitle={isEdit ? "Edit Outlet" : "Create Outlet"} />

      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <ComponentCard title={isEdit ? "Edit Outlet" : "Create New Outlet"}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {/* Entry Date */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Entry Date
                  </Label>
                  <Input
                    type="date"
                    id="entrydate"
                    value={formData.entrydate}
                    onChange={handleChange}
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                {/* Outlet Code */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Outlet Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="outlet_code"
                    value={formData.outlet_code}
                    onChange={handleChange}
                    placeholder="Enter outlet code"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.outlet_code ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.outlet_code && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.outlet_code}
                    </p>
                  )}
                </div>

                {/* Outlet Name */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Outlet Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="outlet_name"
                    value={formData.outlet_name}
                    onChange={handleChange}
                    placeholder="Enter outlet name"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.outlet_name ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.outlet_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.outlet_name}
                    </p>
                  )}
                </div>

                {/* Short Name */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Short Name
                  </Label>
                  <Input
                    type="text"
                    id="short_name"
                    value={formData.short_name}
                    onChange={handleChange}
                    placeholder="Enter short name"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                {/* Address */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="outlet_address"
                    value={formData.outlet_address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.outlet_address ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.outlet_address && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.outlet_address}
                    </p>
                  )}
                </div>

                {/* Manager */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Manager <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="outlet_mgr"
                    value={formData.outlet_mgr}
                    onChange={handleChange}
                    placeholder="Enter manager name"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.outlet_mgr ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.outlet_mgr && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.outlet_mgr}
                    </p>
                  )}
                </div>

                {/* Manager Contact */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Manager Contact <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="mgr_contact_no"
                    value={formData.mgr_contact_no}
                    onChange={handleChange}
                    placeholder="Enter manager contact number"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.mgr_contact_no ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.mgr_contact_no && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.mgr_contact_no}
                    </p>
                  )}
                </div>

                {/* HO Mobile */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    HO Mobile <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="ho_mobile_no"
                    value={formData.ho_mobile_no}
                    onChange={handleChange}
                    placeholder="Enter HO mobile number"
                    className={`w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.ho_mobile_no ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.ho_mobile_no && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.ho_mobile_no}
                    </p>
                  )}
                </div>

                {/* VAT Registration Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      VAT Reg No (Old)
                    </Label>
                    <Input
                      type="text"
                      id="vat_reg_no_old"
                      value={formData.vat_reg_no_old}
                      onChange={handleChange}
                      placeholder="Old VAT registration"
                      className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      VAT Reg No (New)
                    </Label>
                    <Input
                      type="text"
                      id="vat_reg_no_new"
                      value={formData.vat_reg_no_new}
                      onChange={handleChange}
                      placeholder="New VAT registration"
                      className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Status & Validity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </Label>
                    <Select
                      options={statusOptions}
                      value={
                        statusOptions.find(
                          (opt) => parseInt(opt.value) === formData.status,
                        ) || statusOptions[0]
                      }
                      onChange={(val) => handleSelectChange("status", val)}
                      className="w-full mt-1"
                      isDisabled={loading}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Validity
                    </Label>
                    <Select
                      options={validityOptions}
                      value={
                        validityOptions.find(
                          (opt) => parseInt(opt.value) === formData.validity,
                        ) || validityOptions[0]
                      }
                      onChange={(val) => handleSelectChange("validity", val)}
                      className="w-full mt-1"
                      isDisabled={loading}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    onClick={() => navigate("/outlets")}
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
                        {isEdit ? "Update Outlet" : "Save Outlet"}
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
              <CheckCircle
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Quick Tips
                </h4>
                <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Outlet code must be unique</li>
                  <li>• All fields marked with * are required</li>
                  <li>• Inactive outlets won't appear in dropdowns</li>
                  <li>• VAT registration numbers are optional</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
