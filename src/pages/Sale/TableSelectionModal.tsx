import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { X, Check, Clock, RefreshCw, AlertCircle, Search } from "lucide-react";
import { API_CONFIG } from "../../config/api";

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

type FilterType = "all" | "available" | "occupied" | "reserved";

export default function TableSelectionModal({
  isOpen,
  onClose,
  onSelectTable,
  selectedTableId,
}: TableSelectionModalProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch tables with proper error handling
  const fetchTables = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const url = `${API_CONFIG.baseURL}/api/tables/all`;
      const response = await axios.get(url);
      const tablesData = response.data?.data || [];
      setTables(tablesData);
    } catch (error: any) {
      console.error("Failed to fetch tables:", error);

      let errorMessage = "Failed to load tables";
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.statusText ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "Network error - please check your connection";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setTables([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch tables when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen, fetchTables]);

  // Memoized filtered tables
  const filteredTables = useMemo(() => {
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
  }, [tables, filter, searchTerm]);

  // Memoized counts
  const counts = useMemo(
    () => ({
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
      total: tables.length,
    }),
    [tables],
  );

  // Memoized filter options
  const filterOptions = useMemo(
    () => [
      { value: "all" as FilterType, label: "All", count: counts.total },
      {
        value: "available" as FilterType,
        label: "Available",
        count: counts.available,
        color: "text-green-600",
      },
      {
        value: "occupied" as FilterType,
        label: "Occupied",
        count: counts.occupied,
        color: "text-red-600",
      },
      {
        value: "reserved" as FilterType,
        label: "Reserved",
        count: counts.reserved,
        color: "text-yellow-600",
      },
    ],
    [counts],
  );

  // Helper functions with proper typing
  const getStatusColor = useCallback((status: Table["status"]): string => {
    const colors: Record<Table["status"], string> = {
      available: "bg-green-500",
      occupied: "bg-red-500",
      reserved: "bg-yellow-500",
    };
    return colors[status] || "bg-gray-500";
  }, []);

  const getStatusBgColor = useCallback((status: Table["status"]): string => {
    const colors: Record<Table["status"], string> = {
      available: "bg-green-100 text-green-700 border-green-300",
      occupied: "bg-red-100 text-red-700 border-red-300",
      reserved: "bg-yellow-100 text-yellow-700 border-yellow-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-300";
  }, []);

  const getStatusIcon = useCallback((status: Table["status"]) => {
    const icons: Record<Table["status"], JSX.Element> = {
      available: (
        <Check size={14} className="text-green-600" aria-hidden="true" />
      ),
      occupied: (
        <AlertCircle size={14} className="text-red-600" aria-hidden="true" />
      ),
      reserved: (
        <Clock size={14} className="text-yellow-600" aria-hidden="true" />
      ),
    };
    return icons[status] || null;
  }, []);

  const getStatusText = useCallback((status: Table["status"]): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }, []);

  const handleTableSelect = useCallback(
    (table: Table) => {
      // Allow selecting both available and occupied tables
      if (table.status === "available" || table.status === "occupied") {
        onSelectTable(table);
        onClose();
      }
    },
    [onSelectTable, onClose],
  );

  const handleRefresh = useCallback(() => {
    fetchTables(true);
  }, [fetchTables]);

  const handleRetry = useCallback(() => {
    fetchTables(false);
  }, [fetchTables]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3
              id="modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              Select Table
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Choose a table to start or continue a sale
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filter tables"
            >
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  role="tab"
                  aria-selected={filter === option.value}
                  aria-controls={`tabpanel-${option.value}`}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
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
                    aria-hidden="true"
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
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search tables"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Refresh tables"
            >
              <RefreshCw
                size={14}
                aria-hidden="true"
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Table Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div
              className="flex flex-col items-center justify-center h-40 gap-3"
              role="status"
              aria-label="Loading tables"
            >
              <div
                className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"
                aria-hidden="true"
              ></div>
              <p className="text-gray-500 text-sm">Loading tables...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8" role="alert" aria-live="polite">
              <AlertCircle
                className="w-12 h-12 text-red-500 mx-auto mb-3"
                aria-hidden="true"
              />
              <p className="text-red-600">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Retry loading tables"
              >
                Retry
              </button>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-12" role="status">
              <p className="text-gray-500">
                {searchTerm
                  ? "No tables match your search"
                  : "No tables available"}
              </p>
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              role="grid"
              aria-label="Table grid"
            >
              {filteredTables.map((table) => {
                const isSelected = selectedTableId === table.id;
                const isSelectable =
                  table.status === "available" || table.status === "occupied";
                const isDisabled = table.status === "reserved";
                const statusText = getStatusText(table.status);

                return (
                  <button
                    key={table.id}
                    onClick={() => isSelectable && handleTableSelect(table)}
                    disabled={!isSelectable}
                    role="gridcell"
                    aria-label={`Table ${table.table_number} - ${statusText}`}
                    aria-selected={isSelected}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
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
                      aria-hidden="true"
                    ></div>

                    {/* Status Badge */}
                    <div
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBgColor(table.status)}`}
                      aria-hidden="true"
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(table.status)}
                        {statusText}
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
                        <div className="mt-2 text-xs text-blue-600 font-medium">
                          ⚡ Continue Sale
                        </div>
                      )}
                      {table.status === "available" && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          ✨ Start Sale
                        </div>
                      )}
                    </div>

                    {/* Select Indicator */}
                    {isSelected && (
                      <div
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
                        aria-hidden="true"
                      >
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
                <span
                  className="w-2 h-2 bg-green-500 rounded-full"
                  aria-hidden="true"
                ></span>
                {counts.available} Available
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 bg-red-500 rounded-full"
                  aria-hidden="true"
                ></span>
                {counts.occupied} Occupied
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 bg-yellow-500 rounded-full"
                  aria-hidden="true"
                ></span>
                {counts.reserved} Reserved
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
