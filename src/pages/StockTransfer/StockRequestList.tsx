// src/pages/StockTransfer/StockRequestList.tsx

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
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  AlertCircle,
  Search,
  RefreshCw,
  Filter,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import OutletService from "../../services/OutletService";
import { OutletRequest } from "../../type/stock-transfer";

type OptionType = { value: string; label: string };

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  1: { label: "Approved", color: "bg-green-100 text-green-800" },
  2: { label: "Partial Approved", color: "bg-blue-100 text-blue-800" },
  3: { label: "Rejected", color: "bg-red-100 text-red-800" },
  4: { label: "Despatched", color: "bg-purple-100 text-purple-800" },
  5: { label: "Received", color: "bg-indigo-100 text-indigo-800" },
  6: { label: "Closed", color: "bg-gray-100 text-gray-800" },
};

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "0", label: "Pending" },
  { value: "1", label: "Approved" },
  { value: "2", label: "Partial Approved" },
  { value: "3", label: "Rejected" },
  { value: "4", label: "Despatched" },
  { value: "5", label: "Received" },
  { value: "6", label: "Closed" },
];

export default function StockRequestList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [requests, setRequests] = useState<OutletRequest[]>([]);
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
    fetchRequests();
  }, []);

  const fetchOutlets = useCallback(async () => {
    try {
      const response = await OutletService.getAll();
      let outletArray: any[] = [];
      if (Array.isArray(response)) {
        outletArray = response;
      } else if (response.data && Array.isArray(response.data)) {
        outletArray = response.data;
      }
      setOutlets(
        outletArray.map((o: any) => ({
          value: o.id.toString(),
          label: o.outlet_name || `Outlet ${o.id}`,
        }))
      );
    } catch (error) {
      console.error("Error fetching outlets:", error);
    }
  }, []);

  // src/pages/StockTransfer/StockRequestList.tsx

  // ... imports ...

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current_page,
        per_page: pagination.per_page,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedStatus !== "") params.status = parseInt(selectedStatus);
      if (selectedOutlet) params.outlet_id = parseInt(selectedOutlet);

      console.log('📤 Fetching requests with params:', params);

      const response = await StockTransferService.getRequests(params);
      console.log('📥 Full response:', response);

      // ✅ Extract data properly
      let requestData = response;

      // If response has data property, use it
      if (response?.data) {
        requestData = response.data;
      }

      // If requestData has data property (paginated), use it
      if (requestData?.data && Array.isArray(requestData.data)) {
        setRequests(requestData.data);
        setPagination({
          current_page: requestData.current_page || 1,
          last_page: requestData.last_page || 1,
          per_page: requestData.per_page || 20,
          total: requestData.total || 0,
        });
      }
      // If requestData is array directly
      else if (Array.isArray(requestData)) {
        setRequests(requestData);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: requestData.length,
          total: requestData.length,
        });
      }
      // If response is array directly
      else if (Array.isArray(response)) {
        setRequests(response);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: response.length,
          total: response.length,
        });
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching requests:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load requests",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, pagination.per_page, searchTerm, selectedStatus, selectedOutlet]);

  const handleSearch = useCallback(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchRequests();
  }, [fetchRequests]);

  const handleReset = useCallback(() => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedOutlet("");
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchRequests();
  }, [fetchRequests]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const getStatusBadge = (status: number) => {
    const statusInfo = STATUS_LABELS[status] || { label: "Unknown", color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0:
        return <Clock size={16} className="text-yellow-500" />;
      case 1:
        return <CheckCircle size={16} className="text-green-500" />;
      case 2:
        return <CheckCircle size={16} className="text-blue-500" />;
      case 3:
        return <XCircle size={16} className="text-red-500" />;
      case 4:
        return <Truck size={16} className="text-purple-500" />;
      case 5:
        return <Package size={16} className="text-indigo-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getRequestTypeLabel = (type: number) => {
    return type === 1 ? "HO Request" : "Outlet Transfer";
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title="Stock Requests | A&T"
        description="Manage Stock Requests"
      />
      <PageBreadcrumb pageTitle="Stock Requests" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Stock Requests
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage all stock requests from outlets
            </p>
          </div>
          <Button
            onClick={() => navigate("/stock-requests/new")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus size={18} />
            New Request
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
                  placeholder="Search by request no or outlet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-[150px]"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Search size={18} />
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
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
                    Request No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Requesting Outlet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
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
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Package size={48} className="text-gray-300 dark:text-gray-600" />
                        <p>No requests found</p>
                        <Button
                          onClick={() => navigate("/stock-requests/new")}
                          className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          <Plus size={18} />
                          Create New Request
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {request.request_no}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(request.request_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 dark:text-white">
                          {request.requesting_outlet?.outlet_name ||
                           request.requestingOutlet?.outlet_name ||
                           `Outlet ID: ${request.requesting_outlet_id}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {getRequestTypeLabel(request.request_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {request.details?.length || 0} items
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          {getStatusBadge(request.status)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/stock-requests/${request.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {request.status === 0 && (
                            <button
                              onClick={() => navigate(`/stock-requests/${request.id}/approve`)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          {request.status === 1 && (
                            <button
                              onClick={() => navigate(`/stock-despatches/new?request_id=${request.id}`)}
                              className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                              title="Create Despatch"
                            >
                              <Truck size={18} />
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
          {!loading && requests.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
                {pagination.total} requests
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
