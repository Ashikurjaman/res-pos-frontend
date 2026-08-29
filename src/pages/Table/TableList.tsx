import {
  Edit,
  Trash2,
  Check,
  X,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
  validity: number;
  created_at: string;
  updated_at: string;
}

interface TableListProps {
  tables: Table[];
  loading: boolean;
  onEdit: (table: Table) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onRefresh?: () => void;
  getStatusColor: (status: string) => string;
}

export default function TableList({
  tables,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  onRefresh,
  getStatusColor,
}: TableListProps) {
  const statusOptions = ["available", "occupied", "reserved"];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Check
            size={14}
            className="text-green-600 dark:text-green-400"
            aria-hidden="true"
          />
        );
      case "occupied":
        return (
          <X
            size={14}
            className="text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
        );
      case "reserved":
        return (
          <Clock
            size={14}
            className="text-yellow-600 dark:text-yellow-400"
            aria-hidden="true"
          />
        );
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
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
  };

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500 dark:bg-green-400";
      case "occupied":
        return "bg-red-500 dark:bg-red-400";
      case "reserved":
        return "bg-yellow-500 dark:bg-yellow-400";
      default:
        return "bg-gray-500 dark:bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Calculate stats
  const stats = {
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <Loader2
            className="w-10 h-10 animate-spin text-blue-500"
            aria-hidden="true"
          />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading tables...
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!tables || tables.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Clock
                size={32}
                className="text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No tables found
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Add a new table to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header with Refresh */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tables ({tables.length})
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Refresh tables"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Table
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Number
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tables.map((table) => (
              <tr
                key={table.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${getStatusDotClass(table.status)}`}
                      aria-hidden="true"
                    ></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {table.table_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                    {table.table_number}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(table.status)}`}
                    >
                      {getStatusIcon(table.status)}
                      {getStatusLabel(table.status)}
                    </span>
                    <select
                      value={table.status}
                      onChange={(e) => onStatusChange(table.id, e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      aria-label={`Change status for ${table.table_name}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(table.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(table)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Edit Table"
                      aria-label={`Edit ${table.table_name}`}
                    >
                      <Edit size={18} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onDelete(table.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      title="Delete Table"
                      aria-label={`Delete ${table.table_name}`}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with table count and stats */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing {tables.length} table{tables.length !== 1 ? "s" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></span>
              Available:{" "}
              <strong className="text-green-600 dark:text-green-400">
                {stats.available}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"></span>
              Occupied:{" "}
              <strong className="text-red-600 dark:text-red-400">
                {stats.occupied}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400"></span>
              Reserved:{" "}
              <strong className="text-yellow-600 dark:text-yellow-400">
                {stats.reserved}
              </strong>
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              Total:{" "}
              <strong className="text-gray-700 dark:text-gray-300">
                {tables.length}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
