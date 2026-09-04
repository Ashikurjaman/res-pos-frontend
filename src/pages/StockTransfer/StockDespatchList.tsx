// src/pages/StockTransfer/StockDespatchList.tsx
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import {
  Loader2,
  Plus,
  Eye,
  Truck,
  Package,
  AlertCircle,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  Building,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import OutletService from "../../services/OutletService";

type OptionType = { value: string; label: string };

interface DespatchItem {
  id: number;
  request_id: number;
  despatch_no: string;
  despatch_date: string;
  source_outlet_id: number;
  vehicle_no: string;
  driver_name: string;
  status: number;
  remarks: string;
  created_at: string;
  source_outlet?: any;
  request?: any;
  details?: any[];
}

const STATUS_CONFIG: Record<number, { label: string; color: string; icon: any }> = {
  0: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  1: { label: "In Transit", color: "bg-blue-100 text-blue-800", icon: Truck },
  2: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  3: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function StockDespatchList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [despatches, setDespatches] = useState<DespatchItem[]>([]);
  const [outlets, setOutlets] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchOutlets();
    fetchDespatches();
  }, []);

  const fetchOutlets = useCallback(async () => {
    try {
      const response = await OutletService.getAll();
      console.log('Outlet response:', response);

      // ✅ Handle different response structures
      let outletArray: any[] = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          outletArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          outletArray = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          outletArray = response.data.data;
        }
      }

      console.log('Outlet array:', outletArray);

      setOutlets(
        outletArray.map((o: any) => ({
          value: o.id.toString(),
          label: o.outlet_name || o.name || `Outlet ${o.id}`,
        }))
      );
    } catch (error) {
      console.error("Error fetching outlets:", error);
      // Don't show error to user, just set empty outlets
      setOutlets([]);
    }
  }, []);

  const fetchDespatches = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current_page,
        per_page: pagination.per_page,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = parseInt(selectedStatus);
      if (selectedOutlet) params.outlet_id = parseInt(selectedOutlet);

      console.log('📤 Fetching despatches with params:', params);

      const response = await StockTransferService.getDespatches(params);
      console.log('📥 Despatch response:', response);

      // ✅ Extract data properly
      let despatchData = response;

      // If response has data property, use it
      if (response?.data) {
        despatchData = response.data;
      }

      // If despatchData has data property (paginated), use it
      if (despatchData?.data && Array.isArray(despatchData.data)) {
        setDespatches(despatchData.data);
        setPagination({
          current_page: despatchData.current_page || 1,
          last_page: despatchData.last_page || 1,
          per_page: despatchData.per_page || 20,
          total: despatchData.total || 0,
        });
      }
      // If despatchData is array directly
      else if (Array.isArray(despatchData)) {
        setDespatches(despatchData);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: despatchData.length,
          total: despatchData.length,
        });
      }
      // If response is array directly
      else if (Array.isArray(response)) {
        setDespatches(response);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: response.length,
          total: response.length,
        });
      } else {
        // ✅ If no data, set empty array
        setDespatches([]);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 0,
        });
      }
    } catch (error: any) {
      console.error("❌ Error fetching despatches:", error);
      // ✅ Set empty array on error
      setDespatches([]);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load despatches",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, pagination.per_page, searchTerm, selectedStatus, selectedOutlet]);

  const handleSearch = useCallback(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchDespatches();
  }, [fetchDespatches]);

  const handleReset = useCallback(() => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedOutlet("");
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchDespatches();
  }, [fetchDespatches]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const getStatusBadge = (status: number) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG[0];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  // ✅ Safe check for despatches
  const despatchList = Array.isArray(despatches) ? despatches : [];

  if (loading && despatchList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading despatches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title="Stock Despatches | A&T"
        description="Manage Stock Despatches"
      />
      <PageBreadcrumb pageTitle="Stock Despatches" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Stock Despatches
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage all stock despatches from head office
            </p>
          </div>
          <Button
            onClick={() => navigate("/stock-despatches/new")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            <Plus size={18} />
            New Despatch
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by despatch no or vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="">All Status</option>
              <option value="0">Pending</option>
              <option value="1">In Transit</option>
              <option value="2">Delivered</option>
              <option value="3">Cancelled</option>
            </select>
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-[150px]"
              disabled={loading}
            >
              <option value="">All Outlets</option>
              {outlets.map((outlet) => (
                <option key={outlet.value} value={outlet.value}>
                  {outlet.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              <Search size={18} />
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              <RefreshCw size={18} />
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Despatch No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source Outlet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : despatchList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Truck size={48} className="text-gray-300 dark:text-gray-600" />
                        <p>No despatches found</p>
                        <Button
                          onClick={() => navigate("/stock-despatches/new")}
                          className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          <Plus size={18} />
                          Create New Despatch
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  despatchList.map((despatch) => (
                    <tr
                      key={despatch.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {despatch.despatch_no || `DSP-${despatch.id}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(despatch.despatch_date || despatch.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 dark:text-white">
                          {despatch.source_outlet?.outlet_name ||
                           `Outlet ${despatch.source_outlet_id}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {despatch.vehicle_no || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {despatch.driver_name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {despatch.details?.length || 0} items
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(despatch.status || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/stock-despatches/${despatch.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {despatch.status === 1 && (
                            <button
                              onClick={() => navigate(`/stock-receives/new?despatch_id=${despatch.id}`)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Receive Stock"
                            >
                              <Package size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && despatchList.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
                {pagination.total} despatches
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                  {pagination.current_page}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
