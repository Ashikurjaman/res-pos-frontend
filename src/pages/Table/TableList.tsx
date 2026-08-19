import { Edit, Trash2, Check, X, Clock } from "lucide-react";

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
  getStatusColor: (status: string) => string;
}

export default function TableList({
  tables,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  getStatusColor,
}: TableListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tables found</p>
          <p className="text-gray-400 text-sm mt-2">
            Add a new table to get started
          </p>
        </div>
      </div>
    );
  }

  const statusOptions = ["available", "occupied", "reserved"];

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Table
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Table Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tables.map((table) => (
              <tr key={table.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        table.status === "available"
                          ? "bg-green-500"
                          : table.status === "occupied"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    ></div>
                    <span className="font-medium text-gray-900">
                      {table.table_name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {table.table_number}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        table.status === "available"
                          ? "bg-green-100 text-green-800"
                          : table.status === "occupied"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {getStatusIcon(table.status)}
                      {table.status.charAt(0).toUpperCase() +
                        table.status.slice(1)}
                    </span>
                    <select
                      value={table.status}
                      onChange={(e) => onStatusChange(table.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(table.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(table)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Table"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(table.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Table"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with table count */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {tables.length} table{tables.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
