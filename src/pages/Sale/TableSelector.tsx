import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Check, X, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { API_CONFIG } from "../../config/api";

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

type FilterType = "all" | "available" | "occupied" | "reserved";

export default function TableSelector({
  onTableSelect,
  selectedTable,
}: TableSelectorProps) {
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

      // Use the real endpoint directly
      const tablesUrl = `${API_CONFIG.baseURL}/api/tables/all`;
      const tablesResponse = await axios.get(tablesUrl);
      const tablesData = tablesResponse.data?.data || [];
      setTables(tablesData);
    } catch (error: any) {
      console.error("Failed to fetch tables:", error);

      // Better error message handling
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

  // Initial fetch
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

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
      occupied: <X size={14} className="text-red-600" aria-hidden="true" />,
      reserved: (
        <Clock size={14} className="text-yellow-600" aria-hidden="true" />
      ),
    };
    return icons[status] || null;
  }, []);

  const getStatusText = useCallback((status: Table["status"]): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }, []);

  const handleRetry = useCallback(() => {
    fetchTables(false);
  }, [fetchTables]);

  const handleRefresh = useCallback(() => {
    fetchTables(true);
  }, [fetchTables]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
        role="status"
        aria-label="Loading tables"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-gray-500">Loading tables...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-red-200 p-6"
        role="alert"
        aria-live="polite"
      >
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-red-600 mb-3">
            <AlertCircle size={24} aria-hidden="true" />
            <p className="font-medium">Error: {error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Retry loading tables"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (tables.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No tables available</p>
          <p className="text-sm text-gray-400 mb-4">
            There are currently no tables in the system
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Refresh tables"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200"
      role="region"
      aria-label="Table selector"
    >
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
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search tables"
            />
          </div>
        </div>
      </div>

      {/* Table Grid */}
      {filteredTables.length === 0 ? (
        <div className="p-8 text-center" role="status">
          <p className="text-gray-500">
            {searchTerm ? "No tables match your search" : "No tables available"}
          </p>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              aria-label="Clear search"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
            role="grid"
            aria-label="Table grid"
          >
            {filteredTables.map((table) => {
              const isSelected = selectedTable?.id === table.id;
              const isSelectable =
                table.status === "available" || table.status === "occupied";
              const statusText = getStatusText(table.status);

              return (
                <button
                  key={table.id}
                  onClick={() => isSelectable && onTableSelect(table)}
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
                  </div>

                  {/* Selected Indicator */}
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
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex flex-wrap justify-between items-center gap-2 text-sm text-gray-500">
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
          </div>
        </div>
      </div>
    </div>
  );
}
