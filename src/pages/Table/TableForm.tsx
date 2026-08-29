import { useState, useEffect, useCallback } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
}

interface TableFormProps {
  table: Table | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export default function TableForm({
  table,
  onClose,
  onSubmit,
  isLoading = false,
}: TableFormProps) {
  const [formData, setFormData] = useState({
    table_number: "",
    table_name: "",
    status: "available" as "available" | "occupied" | "reserved",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitError(null);
  }, [table]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
      if (submitError) {
        setSubmitError(null);
      }
    },
    [errors, submitError],
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Table Number validation
    const tableNumber = formData.table_number.trim();
    if (!tableNumber) {
      newErrors.table_number = "Table number is required";
    } else if (!/^T-\d{2}$/.test(tableNumber)) {
      newErrors.table_number = "Format should be T-01, T-02, etc.";
    }

    // Table Name validation
    const tableName = formData.table_name.trim();
    if (!tableName) {
      newErrors.table_name = "Table name is required";
    } else if (tableName.length < 2) {
      newErrors.table_name = "Table name must be at least 2 characters";
    } else if (tableName.length > 50) {
      newErrors.table_name = "Table name must be less than 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!validate()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        // Form will be closed by parent
      } catch (error: any) {
        console.error("Submit error:", error);
        setSubmitError(
          error.message || "Failed to save table. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validate, onSubmit],
  );

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "available":
        return "text-green-600 dark:text-green-400";
      case "occupied":
        return "text-red-600 dark:text-red-400";
      case "reserved":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  }, []);

  const getStatusBadgeColor = useCallback((status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "occupied":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "reserved":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  }, []);

  const getStatusEmoji = useCallback((status: string) => {
    switch (status) {
      case "available":
        return "🟢";
      case "occupied":
        return "🔴";
      case "reserved":
        return "🟡";
      default:
        return "";
    }
  }, []);

  const loading = isLoading || isSubmitting;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-xl">
          <div>
            <h3
              id="modal-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {table ? "Edit Table" : "Add New Table"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {table
                ? "Update table information"
                : "Create a new table for your restaurant"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {/* Submit Error */}
          {submitError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Table Number */}
          <div>
            <label
              htmlFor="table_number"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Table Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="table_number"
              name="table_number"
              value={formData.table_number}
              onChange={handleChange}
              placeholder="e.g., T-01"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
                errors.table_number
                  ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
              }`}
              disabled={loading}
              autoFocus={!table}
              aria-describedby={
                errors.table_number ? "table_number-error" : undefined
              }
            />
            {errors.table_number && (
              <p
                id="table_number-error"
                className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <AlertCircle size={14} aria-hidden="true" />
                {errors.table_number}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Format: T-01, T-02, T-03, etc.
            </p>
          </div>

          {/* Table Name */}
          <div>
            <label
              htmlFor="table_name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Table Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="table_name"
              name="table_name"
              value={formData.table_name}
              onChange={handleChange}
              placeholder="e.g., Table 1"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
                errors.table_name
                  ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
              }`}
              disabled={loading}
              aria-describedby={
                errors.table_name ? "table_name-error" : undefined
              }
            />
            {errors.table_name && (
              <p
                id="table_name-error"
                className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <AlertCircle size={14} aria-hidden="true" />
                {errors.table_name}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="available">🟢 Available</option>
              <option value="occupied">🔴 Occupied</option>
              <option value="reserved">🟡 Reserved</option>
            </select>
            {formData.status && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`text-xs ${getStatusColor(formData.status)}`}>
                  Current status:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(formData.status)}`}
                >
                  {getStatusEmoji(formData.status)}{" "}
                  {formData.status.charAt(0).toUpperCase() +
                    formData.status.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />
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
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
