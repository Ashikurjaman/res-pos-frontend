// src/pages/Company/CompanyForm.tsx
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
import { API_CONFIG } from "../../config/api";
import { useNavigate, useParams } from "react-router";

type OptionType = { value: string; label: string };

interface CompanyFormData {
  company_name: string;
  outlet_name: string;
  address: string;
  contact_no: string;
  email: string;
  slogan: string;
  pay_type: OptionType;
  validity: OptionType;
}

export default function CompanyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CompanyFormData>({
    company_name: "",
    outlet_name: "",
    address: "",
    contact_no: "",
    email: "",
    slogan: "",
    pay_type: { value: "1", label: "Paid" },
    validity: { value: "1", label: "Active" },
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Options
  const payTypeOptions: OptionType[] = [
    { value: "1", label: "Paid" },
    { value: "2", label: "Due" },
  ];

  const validityOptions: OptionType[] = [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ];

  // Fetch company data if editing
  useEffect(() => {
    if (isEdit && id) {
      fetchCompany(id);
    }
  }, [isEdit, id]);

  const fetchCompany = useCallback(
    async (companyId: string) => {
      try {
        setFetching(true);
        const response = await axios.get(
          `${API_CONFIG.baseURL}/api/companies/${companyId}`,
        );
        const data = response.data.data;

        setFormData({
          company_name: data.company_name || "",
          outlet_name: data.outlet_name || "",
          address: data.address || "",
          contact_no: data.contact_no || "",
          email: data.email || "",
          slogan: data.slogan || "",
          pay_type:
            payTypeOptions.find((p) => p.value === String(data.pay_type)) ||
            payTypeOptions[0],
          validity:
            validityOptions.find(
              (v) => v.value === String(data.validity ? 1 : 0),
            ) || validityOptions[0],
        });
      } catch (error) {
        console.error("Error fetching company:", error);
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to load company data.",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setFetching(false);
      }
    },
    [id],
  );

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
      field: keyof Pick<CompanyFormData, "pay_type" | "validity">,
      value: OptionType,
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

    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company name is required";
    }
    if (!formData.outlet_name.trim()) {
      newErrors.outlet_name = "Outlet name is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.contact_no.trim()) {
      newErrors.contact_no = "Contact number is required";
    }
    if (!formData.slogan.trim()) {
      newErrors.slogan = "Slogan is required";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Save company
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        company_name: formData.company_name.trim(),
        outlet_name: formData.outlet_name.trim(),
        address: formData.address.trim(),
        contact_no: formData.contact_no.trim(),
        email: formData.email.trim() || null,
        slogan: formData.slogan.trim(),
        pay_type: parseInt(formData.pay_type.value),
        validity: parseInt(formData.validity.value),
      };

      let response;
      if (isEdit) {
        response = await axios.put(
          `${API_CONFIG.baseURL}/api/companies/${id}`,
          payload,
        );
      } else {
        response = await axios.post(
          `${API_CONFIG.baseURL}/api/companies`,
          payload,
        );
      }

      Swal.fire({
        icon: "success",
        title: isEdit ? "Company Updated!" : "Company Created!",
        text: response.data.message || "Operation successful!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });

      navigate("/companies");
    } catch (error: any) {
      console.error("Error saving company:", error);

      let errorMessage = "Failed to save company!";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errorList = Object.values(error.response.data.errors).flat();
        errorMessage = errorList.join(", ");
      }

      Swal.fire({
        icon: "error",
        title: isEdit ? "Update Failed!" : "Save Failed!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, validate, isEdit, id, navigate]);

  // Reset form
  const handleReset = useCallback(() => {
    const hasData = Object.values(formData).some((val) =>
      typeof val === "string" ? val.trim() : val.value !== "1",
    );

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
          company_name: "",
          outlet_name: "",
          address: "",
          contact_no: "",
          email: "",
          slogan: "",
          pay_type: { value: "1", label: "Paid" },
          validity: { value: "1", label: "Active" },
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

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
        <PageBreadcrumb
          pageTitle={isEdit ? "Edit Company" : "Create Company"}
        />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-gray-500 text-sm">Loading company data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      <PageMeta
        title={`${isEdit ? "Edit" : "Create"} Company | A&T`}
        description="Company Management"
      />
      <PageBreadcrumb pageTitle={isEdit ? "Edit Company" : "Create Company"} />

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl px-2 sm:px-0">
          <ComponentCard title={isEdit ? "Edit Company" : "Create New Company"}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              noValidate
            >
              <div className="space-y-4 sm:space-y-6">
                {/* Company Name */}
                <div>
                  <Label
                    htmlFor="company_name"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.company_name
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                    autoFocus
                  />
                  {errors.company_name && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.company_name}
                    </p>
                  )}
                </div>

                {/* Outlet Name */}
                <div>
                  <Label
                    htmlFor="outlet_name"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Outlet Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="outlet_name"
                    value={formData.outlet_name}
                    onChange={handleChange}
                    placeholder="Enter outlet name"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.outlet_name
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                  />
                  {errors.outlet_name && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.outlet_name}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.address
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                  />
                  {errors.address && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Contact No */}
                <div>
                  <Label
                    htmlFor="contact_no"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="contact_no"
                    value={formData.contact_no}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.contact_no
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                  />
                  {errors.contact_no && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.contact_no}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Email{" "}
                    <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.email
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Slogan */}
                <div>
                  <Label
                    htmlFor="slogan"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5"
                  >
                    Slogan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="slogan"
                    value={formData.slogan}
                    onChange={handleChange}
                    placeholder="Enter slogan"
                    className={`w-full mt-0 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 ${
                      errors.slogan
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={loading}
                  />
                  {errors.slogan && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={14} aria-hidden="true" />
                      {errors.slogan}
                    </p>
                  )}
                </div>

                {/* Pay Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Pay Type
                  </Label>
                  <Select
                    options={payTypeOptions}
                    placeholder="Select pay type"
                    value={formData.pay_type}
                    onChange={(val) => handleSelectChange("pay_type", val)}
                    className="w-full"
                    isDisabled={loading}
                  />
                </div>

                {/* Validity */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Status
                  </Label>
                  <Select
                    options={validityOptions}
                    placeholder="Select status"
                    value={formData.validity}
                    onChange={(val) => handleSelectChange("validity", val)}
                    className="w-full"
                    isDisabled={loading}
                  />
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
                        {isEdit ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Save size={18} aria-hidden="true" />
                        {isEdit ? "Update Company" : "Save Company"}
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
                  <li>Company name should be unique</li>
                  <li>Fill all required fields marked with *</li>
                  <li>Email is optional but must be valid if provided</li>
                  <li>Set validity to "Active" for company to be visible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
