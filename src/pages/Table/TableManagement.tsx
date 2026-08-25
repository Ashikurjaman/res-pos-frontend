import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, RefreshCw, Search } from "lucide-react";
import TableList from "./TableList";
import TableForm from "./TableForm";
import TableStats from "./TableStats";
import Alert from "../../components/ui/alert/Alert";

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
  validity: number;
  created_at: string;
  updated_at: string;
}

export default function TableManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });

  useEffect(() => {
    fetchTables();
    fetchStats();
  }, []);

  const fetchTables = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("perPage", "100"); // Show more tables

      const response = await axios.get(
        `http://localhost:8000/api/tables?${params}`,
      );

      console.log("Tables Response:", response.data);

      // Handle paginated response
      let tablesData = [];
      let paginationData = {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 10,
      };

      if (response.data && response.data.data) {
        // Check if it's paginated (has data.data)
        if (response.data.data.data) {
          tablesData = response.data.data.data;
          paginationData = {
            currentPage: response.data.data.current_page || 1,
            lastPage: response.data.data.last_page || 1,
            total: response.data.data.total || 0,
            perPage: response.data.data.per_page || 10,
          };
        } else {
          // Direct data array
          tablesData = response.data.data;
        }
      } else if (Array.isArray(response.data)) {
        tablesData = response.data;
      }

      setTables(tablesData);
      setPagination(paginationData);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      showAlert("Failed to fetch tables", "error");
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/tables/statistics",
      );
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const showAlert = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setAlert({ show: true, message, type });
    setTimeout(
      () => setAlert({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const handleCreate = () => {
    setEditingTable(null);
    setShowForm(true);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/tables/${id}`);
      showAlert("Table deleted successfully", "success");
      fetchTables();
      fetchStats();
    } catch (error: any) {
      showAlert(
        error.response?.data?.message || "Failed to delete table",
        "error",
      );
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingTable) {
        await axios.put(
          `http://localhost:8000/api/tables/${editingTable.id}`,
          data,
        );
        showAlert("Table updated successfully", "success");
      } else {
        await axios.post("http://localhost:8000/api/tables", data);
        showAlert("Table created successfully", "success");
      }
      setShowForm(false);
      fetchTables();
      fetchStats();
    } catch (error: any) {
      showAlert(error.response?.data?.message || "Operation failed", "error");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await axios.put(`http://localhost:8000/api/tables/${id}/status`, {
        status,
      });
      showAlert(`Table status updated to ${status}`, "success");
      fetchTables();
      fetchStats();
    } catch (error: any) {
      showAlert(
        error.response?.data?.message || "Failed to update status",
        "error",
      );
    }
  };

  const handleSearch = () => {
    fetchTables();
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("");
    fetchTables();
    fetchStats();
  };

  const getStatusColor = (status: string) => {
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Alert */}
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 w-96">
          <Alert
            title={alert.type === "success" ? "Success" : "Error"}
            variant={alert.type === "success" ? "success" : "error"}
            message={alert.message}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Table Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage restaurant tables
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Table
          </button>
        </div>

        {/* Statistics */}
        <TableStats stats={stats} />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by table number or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Reset
            </button>
          </div>
        </div>

        {/* Table List */}
        <TableList
          tables={tables}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          getStatusColor={getStatusColor}
        />

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {tables.length} of {pagination.total} tables
          </div>
        )}

        {/* Table Form Modal */}
        {showForm && (
          <TableForm
            table={editingTable}
            onClose={() => setShowForm(false)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
