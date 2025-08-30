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

type OptionType = { value: string; label: string };
interface FormData {
  unit_name: string;
  status: OptionType | null;
}

export default function Unit() {
  const router = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    unit_name: "",
    status: null,
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Handle Select changes
  const handleSelectChange = (
    field: keyof Pick<FormData, "status">,
    value: OptionType | null
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  // Save product
  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        status: formData.status?.value || "",
      };

      const res = await axios.post("http://127.0.0.1:8000/api/unit", payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      Swal.fire({
        icon: "success",
        title: "Unit Saved!",
        text: "✅ Unit saved successfully!",
        timer: 2000,
        showConfirmButton: false,
      });

      setFormData({
        unit_name: "",
        status: null,
      });
      router("/unit-list");
    } catch (error: any) {
      console.error("Error saving product:", error.response?.data || error);
      Swal.fire({
        icon: "error",
        title: "Save Failed!",
        text:
          "❌ Error saving product! " + (error.response?.data?.message || ""),
      });
    }
  };

  const status: OptionType[] = [
    { value: "1", label: "Yes" },
    { value: "2", label: "No" },
  ];

  return (
    <div>
      <PageMeta title="Unit Create Page | A&T" description="Unit Create Page" />
      <PageBreadcrumb pageTitle="Unit Create" />

      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-lg">
          <ComponentCard title="Unit Create">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="unit_name">Unit Name</Label>
                <Input
                  type="text"
                  id="unit_name"
                  value={formData.unit_name}
                  onChange={handleChange}
                  placeholder="Enter Category name"
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  options={status}
                  placeholder="Select Status"
                  value={formData.status}
                  onChange={(val) => handleSelectChange("status", val)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
