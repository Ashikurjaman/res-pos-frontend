// src/pages/Table/TableManagement.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { Plus, Edit, Trash2, RefreshCw, Search, Loader2 } from "lucide-react";
import TableList from "./TableList";
import TableForm from "./TableForm";
import TableStats from "./TableStats";
import Alert from "../../components/ui/alert/Alert";
import { API_CONFIG } from "../../config/api";

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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
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

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return (
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    );
  }, []);

  const fetchTables = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const token = getAuthToken();

        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (statusFilter) params.append("status", statusFilter);
        params.append("page", page.toString());
        params.append("perPage", "100");

        const response = await axios.get(
          `${API_CONFIG.baseURL}/tables?${params}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          },
        );

        // Handle different response structures
        let tablesData = [];
        let paginationData = {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 10,
        };

        if (response.data) {
          // Check if it's paginated (has data.data)
          if (response.data.data && response.data.data.data) {
            tablesData = response.data.data.data;
            paginationData = {
              currentPage: response.data.data.current_page || 1,
              lastPage: response.data.data.last_page || 1,
              total: response.data.data.total || 0,
              perPage: response.data.data.per_page || 10,
            };
          } else if (response.data.data && Array.isArray(response.data.data)) {
            tablesData = response.data.data;
          } else if (Array.isArray(response.data)) {
            tablesData = response.data;
          }
        }

        setTables(tablesData);
        setPagination(paginationData);
      } catch (error: any) {
        console.error("Failed to fetch tables:", error);

        if (error.response?.status === 401) {
          navigate("/signin");
          return;
        }

        showAlert(
          error.response?.data?.message || "Failed to fetch tables",
          "error",
        );
        setTables([]);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, statusFilter, getAuthToken, navigate],
  );

  const fetchStats = useCallback(async () => {
    try {
      const token = getAuthToken();

      const response = await axios.get(
        `${API_CONFIG.baseURL}/tables/statistics`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      const statsData = response.data.data || response.data;
      setStats({
        total: statsData.total || 0,
        available: statsData.available || 0,
        occupied: statsData.occupied || 0,
        reserved: statsData.reserved || 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, [getAuthToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTables();
      fetchStats();
    }
  }, [isAuthenticated, fetchTables, fetchStats]);

  const showAlert = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setAlert({ show: true, message, type });
      setTimeout(
        () => setAlert({ show: false, message: "", type: "success" }),
        3000,
      );
    },
    [],
  );

  const handleCreate = useCallback(() => {
    setEditingTable(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((table: Table) => {
    setEditingTable(table);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      const result = await Swal.fire({
        title: "Delete Table?",
        text: "This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      try {
        const token = getAuthToken();

        await axios.delete(`${API_CONFIG.baseURL}/tables/${id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        showAlert("Table deleted successfully", "success");
        fetchTables();
        fetchStats();
      } catch (error: any) {
        console.error("Delete error:", error);

        if (error.response?.status === 401) {
          navigate("/signin");
          return;
        }

        showAlert(
          error.response?.data?.message || "Failed to delete table",
          "error",
        );
      }
    },
    [fetchTables, fetchStats, getAuthToken, navigate, showAlert],
  );

  const handleSubmit = useCallback(
    async (data: any) => {
      try {
        const token = getAuthToken();

        if (editingTable) {
          await axios.put(
            `${API_CONFIG.baseURL}/tables/${editingTable.id}`,
            data,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
              },
            },
          );
          showAlert("Table updated successfully", "success");
        } else {
          await axios.post(`${API_CONFIG.baseURL}/tables`, data, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          });
          showAlert("Table created successfully", "success");
        }
        setShowForm(false);
        fetchTables();
        fetchStats();
      } catch (error: any) {
        console.error("Submit error:", error);

        if (error.response?.status === 401) {
          navigate("/signin");
          return;
        }

        showAlert(error.response?.data?.message || "Operation failed", "error");
      }
    },
    [editingTable, fetchTables, fetchStats, getAuthToken, navigate, showAlert],
  );

  const handleStatusChange = useCallback(
    async (id: number, status: string) => {
      try {
        const token = getAuthToken();

        await axios.put(
          `${API_CONFIG.baseURL}/tables/${id}/status`,
          { status },
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          },
        );

        showAlert(`Table status updated to ${status}`, "success");
        fetchTables();
        fetchStats();
      } catch (error: any) {
        console.error("Status update error:", error);

        if (error.response?.status === 401) {
          navigate("/signin");
          return;
        }

        showAlert(
          error.response?.data?.message || "Failed to update status",
          "error",
        );
      }
    },
    [fetchTables, fetchStats, getAuthToken, navigate, showAlert],
  );

  const handleSearch = useCallback(() => {
    fetchTables();
  }, [fetchTables]);

  const handleRefresh = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("");
    fetchTables(1);
    fetchStats();
  }, [fetchTables, fetchStats]);

  const getStatusColor = useCallback((status: string) => {
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

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Alert */}
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 w-96 animate-slideDown">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Table Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage restaurant tables
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus size={20} aria-hidden="true" />
            Add Table
          </button>
        </div>

        {/* Statistics */}
        <TableStats stats={stats} />

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search by table number or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                aria-label="Search tables"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Search
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <RefreshCw size={20} aria-hidden="true" />
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
          onRefresh={fetchTables}
          getStatusColor={getStatusColor}
        />

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing {tables.length} of {pagination.total} tables
          </div>
        )}

        {/* Table Form Modal */}
        {showForm && (
          <TableForm
            table={editingTable}
            onClose={() => {
              setShowForm(false);
              setEditingTable(null);
            }}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
