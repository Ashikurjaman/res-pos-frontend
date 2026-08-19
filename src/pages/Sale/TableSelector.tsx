import { useEffect, useState } from "react";
import axios from "axios";
import { Check, X, Clock, RefreshCw, AlertCircle } from "lucide-react";

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
}

interface TableSelectorProps {
  onTableSelect: (table: Table) => void;
  selectedTable: Table | null;
}

export default function TableSelector({
  onTableSelect,
  selectedTable,
}: TableSelectorProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "available" | "occupied" | "reserved"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTables();
  }, []);

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
        return <X size={14} className="text-red-600" />;
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading tables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-red-600 mb-3">
            <AlertCircle size={24} />
            <p className="font-medium">Error: {error}</p>
          </div>
          <button
            onClick={fetchTables}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Select Table
            </h3>
            <p className="text-sm text-gray-500">
              {tables.length} tables available
            </p>
          </div>
          <button
            onClick={fetchTables}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
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
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table Grid */}
      {filteredTables.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">
            {searchTerm ? "No tables match your search" : "No tables available"}
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
        <div className="p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filteredTables.map((table) => {
              const isSelected = selectedTable?.id === table.id;
              // ✅ Allow both available and occupied tables to be selected
              const isSelectable =
                table.status === "available" || table.status === "occupied";

              return (
                <button
                  key={table.id}
                  onClick={() => isSelectable && onTableSelect(table)}
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
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>
            Showing {filteredTables.length} of {tables.length} tables
          </span>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}
