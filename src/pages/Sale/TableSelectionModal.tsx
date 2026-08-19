import { useEffect, useState } from "react";
import axios from "axios";
import { X, Check, Clock, RefreshCw, AlertCircle, Search } from "lucide-react";

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
}

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (table: Table) => void;
  selectedTableId?: number | null;
}

export default function TableSelectionModal({
  isOpen,
  onClose,
  onSelectTable,
  selectedTableId,
}: TableSelectionModalProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "available" | "occupied" | "reserved"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:8000/api/tables/all");
      const tablesData = response.data?.data || [];
      setTables(tablesData);
    } catch (error: any) {
      console.error("Failed to fetch tables:", error);
      setError(error.response?.data?.message || "Failed to load tables");
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "occupied":
        return "bg-red-500";
      case "reserved":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700 border-green-300";
      case "occupied":
        return "bg-red-100 text-red-700 border-red-300";
      case "reserved":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Check size={14} className="text-green-600" />;
      case "occupied":
        return <AlertCircle size={14} className="text-red-600" />;
      case "reserved":
        return <Clock size={14} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getFilteredTables = () => {
    let filtered = tables;
    if (filter !== "all") {
      filtered = filtered.filter((table) => table.status === filter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (table) =>
          table.table_number.toLowerCase().includes(term) ||
          table.table_name.toLowerCase().includes(term),
      );
    }
    return filtered;
  };

  const filteredTables = getFilteredTables();
  const availableCount = tables.filter((t) => t.status === "available").length;
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const reservedCount = tables.filter((t) => t.status === "reserved").length;

  const filterOptions = [
    { value: "all", label: "All", count: tables.length },
    {
      value: "available",
      label: "Available",
      count: availableCount,
      color: "text-green-600",
    },
    {
      value: "occupied",
      label: "Occupied",
      count: occupiedCount,
      color: "text-red-600",
    },
    {
      value: "reserved",
      label: "Reserved",
      count: reservedCount,
      color: "text-yellow-600",
    },
  ];

  const handleTableSelect = (table: Table) => {
    // Allow selecting both available and occupied tables
    if (table.status === "available" || table.status === "occupied") {
      onSelectTable(table);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Select Table
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Choose a table to start or continue a sale
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as any)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${
                      filter === option.value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }
                  `}
                >
                  {option.label}
                  <span
                    className={`ml-1 text-xs ${
                      filter === option.value
                        ? "text-blue-100"
                        : option.color || "text-gray-400"
                    }`}
                  >
                    ({option.count})
                  </span>
                </button>
              ))}
            </div>
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={fetchTables}
              className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1 text-sm"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 text-sm">Loading tables...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchTables}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm
                  ? "No tables match your search"
                  : "No tables available"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredTables.map((table) => {
                const isSelected = selectedTableId === table.id;
                // ✅ Allow selecting both available and occupied tables
                const isSelectable =
                  table.status === "available" || table.status === "occupied";
                const isDisabled = table.status === "reserved";

                return (
                  <button
                    key={table.id}
                    onClick={() => isSelectable && handleTableSelect(table)}
                    disabled={!isSelectable}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-200
                      ${
                        isSelectable
                          ? "hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                          : "opacity-60 cursor-not-allowed"
                      }
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                          : isSelectable
                            ? "border-gray-200 bg-white"
                            : "border-gray-200 bg-gray-50"
                      }
                    `}
                  >
                    {/* Status Dot */}
                    <div
                      className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(table.status)} ring-2 ring-white shadow-sm`}
                    ></div>

                    {/* Status Badge */}
                    <div
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBgColor(table.status)}`}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(table.status)}
                        {getStatusText(table.status)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="text-center mt-4">
                      <div className="font-bold text-lg text-gray-900">
                        {table.table_number}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {table.table_name}
                      </div>
                      {isDisabled && (
                        <div className="mt-2 text-xs text-gray-400">
                          🔒 Reserved
                        </div>
                      )}
                      {table.status === "occupied" && (
                        <div className="mt-2 text-xs text-blue-600">
                          ⚡ Continue Sale
                        </div>
                      )}
                      {table.status === "available" && (
                        <div className="mt-2 text-xs text-green-600">
                          ✨ Start Sale
                        </div>
                      )}
                    </div>

                    {/* Select Indicator */}
                    {isSelected && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
            <span>
              Showing {filteredTables.length} of {tables.length} tables
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {availableCount} Available
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {occupiedCount} Occupied
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                {reservedCount} Reserved
              </span>
              <span className="text-xs text-gray-400">
                * Click on Available or Occupied tables to proceed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
