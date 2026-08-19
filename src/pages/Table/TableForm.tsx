import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
}

interface TableFormProps {
  table: Table | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function TableForm({
  table,
  onClose,
  onSubmit,
}: TableFormProps) {
  const [formData, setFormData] = useState({
    table_number: "",
    table_name: "",
    status: "available" as "available" | "occupied" | "reserved",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when table changes (edit mode)
  useEffect(() => {
    if (table) {
      setFormData({
        table_number: table.table_number || "",
        table_name: table.table_name || "",
        status: table.status || "available",
      });
    } else {
      setFormData({
        table_number: "",
        table_name: "",
        status: "available",
      });
    }
    setErrors({});
  }, [table]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Table Number validation
    if (!formData.table_number.trim()) {
      newErrors.table_number = "Table number is required";
    } else if (!/^T-\d{2}$/.test(formData.table_number.trim())) {
      newErrors.table_number = "Format should be T-01, T-02, etc.";
    }

    // Table Name validation
    if (!formData.table_name.trim()) {
      newErrors.table_name = "Table name is required";
    } else if (formData.table_name.trim().length < 2) {
      newErrors.table_name = "Table name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        // Form will be closed by parent
      } catch (error) {
        console.error("Submit error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-600";
      case "occupied":
        return "text-red-600";
      case "reserved":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {table ? "Edit Table" : "Add New Table"}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {table
                ? "Update table information"
                : "Create a new table for your restaurant"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Table Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="table_number"
              value={formData.table_number}
              onChange={handleChange}
              placeholder="e.g., T-01"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.table_number
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
              disabled={isSubmitting}
              autoFocus={!table}
            />
            {errors.table_number && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.table_number}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Format: T-01, T-02, T-03, etc.
            </p>
          </div>

          {/* Table Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="table_name"
              value={formData.table_name}
              onChange={handleChange}
              placeholder="e.g., Table 1"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.table_name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
              disabled={isSubmitting}
            />
            {errors.table_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.table_name}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
            >
              <option value="available">🟢 Available</option>
              <option value="occupied">🔴 Occupied</option>
              <option value="reserved">🟡 Reserved</option>
            </select>
            {formData.status && (
              <p className={`mt-1 text-xs ${getStatusColor(formData.status)}`}>
                Current status:{" "}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(formData.status)}`}
                >
                  {formData.status.charAt(0).toUpperCase() +
                    formData.status.slice(1)}
                </span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  {table ? "Updating..." : "Creating..."}
                </span>
              ) : table ? (
                "Update Table"
              ) : (
                "Create Table"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
