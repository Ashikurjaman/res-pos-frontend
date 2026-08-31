// src/pages/StockTransfer/StockReceiveList.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Swal from "sweetalert2";
import {
  Loader2,
  Eye,
  RefreshCw,
  Package,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import { OutletReceive, RECEIVE_STATUS } from "../../type/stock-transfer";

export default function StockReceiveList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [receives, setReceives] = useState<OutletReceive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [filteredReceives, setFilteredReceives] = useState<OutletReceive[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchReceives();
  }, []);

  useEffect(() => {
    let filtered = receives;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.receive_no.toLowerCase().includes(term) ||
          r.receiving_outlet?.outlet_name?.toLowerCase().includes(term),
      );
    }

    if (filterStatus !== null) {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    setFilteredReceives(filtered);
  }, [searchTerm, filterStatus, receives]);

  const fetchReceives = useCallback(async () => {
    setLoading(true);
    try {
      const data = await StockTransferService.getReceives();
      setReceives(data.data || []);
      setFilteredReceives(data.data || []);
    } catch (error: any) {
      console.error("Error fetching receives:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load receives",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusBadge = (status: number) => {
    const configs: Record<
      number,
      { label: string; color: string; icon: JSX.Element }
    > = {
      [RECEIVE_STATUS.PENDING]: {
        label: "Pending",
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <Clock size={14} className="text-yellow-600" />,
      },
      [RECEIVE_STATUS.COMPLETE]: {
        label: "Complete",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle size={14} className="text-green-600" />,
      },
      [RECEIVE_STATUS.PARTIAL]: {
        label: "Partial",
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: <AlertCircle size={14} className="text-blue-600" />,
      },
      [RECEIVE_STATUS.DISCREPANCY]: {
        label: "Discrepancy",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <AlertCircle size={14} className="text-red-600" />,
      },
    };
    const config = configs[status] || configs[RECEIVE_STATUS.PENDING];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const handleRefresh = () => {
    fetchReceives();
    setSearchTerm("");
    setFilterStatus(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading receives...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta title="Stock Receives | A&T" description="Stock Receive List" />
      <PageBreadcrumb pageTitle="Stock Receives" />

      <ComponentCard title="Stock Receives">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search receives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <select
              value={filterStatus ?? ""}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="0">Pending</option>
              <option value="1">Complete</option>
              <option value="2">Partial</option>
              <option value="3">Discrepancy</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Pending
            </p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {
                receives.filter((r) => r.status === RECEIVE_STATUS.PENDING)
                  .length
              }
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              Complete
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {
                receives.filter((r) => r.status === RECEIVE_STATUS.COMPLETE)
                  .length
              }
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">Partial</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {
                receives.filter((r) => r.status === RECEIVE_STATUS.PARTIAL)
                  .length
              }
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              Discrepancy
            </p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {
                receives.filter((r) => r.status === RECEIVE_STATUS.DISCREPANCY)
                  .length
              }
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-700">
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Receive No
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Despatch
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Receiving Outlet
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceives.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No receives found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceives.map((receive) => (
                    <TableRow
                      key={receive.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <TableCell className="px-4 py-3">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {receive.receive_no}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(receive.receive_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-blue-600 dark:text-blue-400">
                          {receive.despatch?.despatch_no || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {receive.receiving_outlet?.outlet_name || "Unknown"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {getStatusBadge(receive.status)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            navigate(`/stock-receive/${receive.id}`)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        {filteredReceives.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
            <span>
              Showing {filteredReceives.length} of {receives.length} receives
            </span>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
