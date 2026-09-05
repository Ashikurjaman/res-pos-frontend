// src/pages/StockTransfer/StockReceiveList.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Badge from "../../components/ui/badge/Badge";
import Swal from "sweetalert2";
import {
  Loader2,
  Eye,
  Search,
  RefreshCw,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Printer,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";

interface ReceiveItem {
  id: number;
  despatch_id: number;
  despatch_no?: string;
  receive_date: string;
  receiving_outlet_id: number;
  receiving_outlet_name?: string;
  received_by_id: number;
  received_by_name?: string;
  status: number;
  remarks?: string;
  created_at: string;
  items_count?: number;
  total_received?: number;
}

interface ApiResponse {
  status: string;
  data: {
    current_page: number;
    data: ReceiveItem[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
  };
}

export default function StockReceiveList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [receives, setReceives] = useState<ReceiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
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
    fetchReceives();
  }, [pagination.current_page, statusFilter]);

  const fetchReceives = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current_page,
        per_page: pagination.per_page,
      };

      if (statusFilter) {
        params.status = parseInt(statusFilter);
      }

      const response = await StockTransferService.getReceives(params);
      console.log("📦 API Response:", response);

      // Extract data safely - handle both {data: {data: []}} and {data: []}
      let receivesData: ReceiveItem[] = [];
      let paginationData = {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
      };

      // Check if response exists
      if (response) {
        // Case 1: response.data.data (Laravel pagination format)
        if (response.data && Array.isArray(response.data.data)) {
          receivesData = response.data.data;
          paginationData = {
            current_page: response.data.current_page || 1,
            last_page: response.data.last_page || 1,
            per_page: response.data.per_page || 20,
            total: response.data.total || 0,
          };
        }
        // Case 2: response.data is an array
        else if (response.data && Array.isArray(response.data)) {
          receivesData = response.data;
          paginationData = {
            current_page: 1,
            last_page: 1,
            per_page: receivesData.length,
            total: receivesData.length,
          };
        }
        // Case 3: response itself is an array
        else if (Array.isArray(response)) {
          receivesData = response;
          paginationData = {
            current_page: 1,
            last_page: 1,
            per_page: receivesData.length,
            total: receivesData.length,
          };
        }
        // Case 4: response is an object with data property that's an array
        else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Try to find array in response.data
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              receivesData = response.data[key];
              break;
            }
          }
        }
      }

      console.log("📋 Processed receives data:", receivesData);
      setReceives(receivesData);
      setPagination(paginationData);

      // Show warning if no data
      if (receivesData.length === 0 && !loading) {
        console.log("ℹ️ No receives found");
      }
    } catch (error: any) {
      console.error("❌ Error fetching receives:", error);

      let errorMessage = "Failed to load receives";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });

      setReceives([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, pagination.per_page, statusFilter]);

  const handleSearch = useCallback(() => {
    // Implement search logic
    fetchReceives();
  }, [fetchReceives]);

  const handleReset = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("");
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchReceives();
  }, [fetchReceives]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      case 2:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
      case 3:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Cancelled</Badge>;
      case 4:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Partial</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleViewReceive = (id: number) => {
    navigate(`/stock-receives/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading receives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta title="Stock Receives | A&T" description="Stock Receives" />
      <PageBreadcrumb pageTitle="Stock Receives" />

      <div className="flex justify-center">
        <div className="w-full max-w-6xl">
          <ComponentCard title="Stock Receives">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by receive no, despatch no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full pr-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="w-full md:w-48">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </Label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination(prev => ({ ...prev, current_page: 1 }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="1">Pending</option>
                  <option value="2">Completed</option>
                  <option value="3">Cancelled</option>
                  <option value="4">Partial</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={handleSearch}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  <Search size={18} />
                  Search
                </Button>
                <Button
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <RefreshCw size={18} />
                  Reset
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Receives</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {pagination.total}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {receives.filter(r => r.status === 2).length}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {receives.filter(r => r.status === 1).length}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">Cancelled</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {receives.filter(r => r.status === 3).length}
                </p>
              </div>
            </div>

            {/* Table */}
            {receives.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No Receives Found
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Start receiving stock from despatches.
                </p>
                <Button
                  onClick={() => navigate("/stock-despatches")}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  View Despatches
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Receive No
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Despatch No
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Receive Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Receiving Outlet
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {receives.map((receive) => (
                      <tr
                        key={receive.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-800 dark:text-white">
                            RCV-{String(receive.id).padStart(4, '0')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {receive.despatch_no || `DESP-${String(receive.despatch_id).padStart(4, '0')}`}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {formatDate(receive.receive_date)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {receive.receiving_outlet_name || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(receive.status)}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                          {receive.items_count || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => handleViewReceive(receive.id)}
                              className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"
                              size="sm"
                            >
                              <Eye size={16} />
                              View
                            </Button>
                            <Button
                              onClick={() => {
                                // TODO: Implement print functionality
                                console.log("Print receive:", receive.id);
                              }}
                              className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm"
                              size="sm"
                            >
                              <Printer size={16} />
                              Print
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {receives.length} of {pagination.total} receives
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                        disabled={pagination.current_page === 1}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Previous
                      </Button>
                      <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                        {pagination.current_page} / {pagination.last_page}
                      </span>
                      <Button
                        onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.last_page, prev.current_page + 1) }))}
                        disabled={pagination.current_page === pagination.last_page}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
