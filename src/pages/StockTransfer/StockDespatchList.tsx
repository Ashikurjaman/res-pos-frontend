// src/pages/StockTransfer/StockDespatchList.tsx
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
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import {
  Loader2,
  Eye,
  RefreshCw,
  Package,
  Search,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import { OutletDespatch, DESPATCH_STATUS } from "../../type/stock-transfer";

export default function StockDespatchList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [despatches, setDespatches] = useState<OutletDespatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [filterOutlet, setFilterOutlet] = useState<number | null>(null);
  const [outlets, setOutlets] = useState<{ id: number; name: string }[]>([]);
  const [filteredDespatches, setFilteredDespatches] = useState<
    OutletDespatch[]
  >([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchDespatches();
    fetchOutlets();
  }, []);

  useEffect(() => {
    let filtered = despatches;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.despatch_no.toLowerCase().includes(term) ||
          d.source_outlet?.outlet_name?.toLowerCase().includes(term) ||
          d.dest_outlet?.outlet_name?.toLowerCase().includes(term),
      );
    }

    if (filterStatus !== null) {
      filtered = filtered.filter((d) => d.status === filterStatus);
    }

    if (filterOutlet !== null) {
      filtered = filtered.filter(
        (d) =>
          d.source_outlet_id === filterOutlet ||
          d.dest_outlet_id === filterOutlet,
      );
    }

    setFilteredDespatches(filtered);
  }, [searchTerm, filterStatus, filterOutlet, despatches]);

  const fetchDespatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await StockTransferService.getDespatches();
      setDespatches(data.data || []);
      setFilteredDespatches(data.data || []);
    } catch (error: any) {
      console.error("Error fetching despatches:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load despatches",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOutlets = useCallback(async () => {
    try {
      // Assuming you have an OutletService
      const response = await fetch("/api/outlets");
      const data = await response.json();
      setOutlets(data.data || []);
    } catch (error) {
      console.error("Error fetching outlets:", error);
    }
  }, []);

  const getStatusBadge = (status: number) => {
    const configs: Record<
      number,
      { label: string; color: string; icon: JSX.Element }
    > = {
      [DESPATCH_STATUS.PENDING]: {
        label: "Pending",
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <Clock size={14} className="text-yellow-600" />,
      },
      [DESPATCH_STATUS.IN_TRANSIT]: {
        label: "In Transit",
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        icon: <Truck size={14} className="text-purple-600" />,
      },
      [DESPATCH_STATUS.RECEIVED]: {
        label: "Received",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle size={14} className="text-green-600" />,
      },
      [DESPATCH_STATUS.PARTIAL_RECEIVED]: {
        label: "Partial Received",
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: <Clock size={14} className="text-blue-600" />,
      },
      [DESPATCH_STATUS.CANCELLED]: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <XCircle size={14} className="text-red-600" />,
      },
    };
    const config = configs[status] || configs[DESPATCH_STATUS.PENDING];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getSourceTypeLabel = (type: number) => {
    return type === 1 ? "Head Office" : "Outlet";
  };

  const handleRefresh = () => {
    fetchDespatches();
    setSearchTerm("");
    setFilterStatus(null);
    setFilterOutlet(null);
  };

  const handleCreateDespatch = () => {
    navigate("/stock-despatch/new");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading despatches...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title="Stock Despatches | A&T"
        description="Stock Despatch List"
      />
      <PageBreadcrumb pageTitle="Stock Despatches" />

      <ComponentCard title="Stock Despatches">
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
                placeholder="Search despatches..."
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
              <option value="1">In Transit</option>
              <option value="2">Received</option>
              <option value="3">Partial Received</option>
              <option value="4">Cancelled</option>
            </select>
            <select
              value={filterOutlet ?? ""}
              onChange={(e) =>
                setFilterOutlet(
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">All Outlets</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleCreateDespatch}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Plus size={16} />
              New Despatch
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Pending
            </p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {
                despatches.filter((d) => d.status === DESPATCH_STATUS.PENDING)
                  .length
              }
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400">
              In Transit
            </p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {
                despatches.filter(
                  (d) => d.status === DESPATCH_STATUS.IN_TRANSIT,
                ).length
              }
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              Received
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {
                despatches.filter((d) => d.status === DESPATCH_STATUS.RECEIVED)
                  .length
              }
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">Partial</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {
                despatches.filter(
                  (d) => d.status === DESPATCH_STATUS.PARTIAL_RECEIVED,
                ).length
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
                    Despatch No
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
                    From
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    To
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Qty
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Amount
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
                {filteredDespatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No despatches found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDespatches.map((despatch) => (
                    <TableRow
                      key={despatch.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <TableCell className="px-4 py-3">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {despatch.despatch_no}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(despatch.despatch_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div>
                          <span className="text-gray-800 dark:text-white">
                            {despatch.source_outlet?.outlet_name || "Unknown"}
                          </span>
                          <span className="block text-xs text-gray-400 dark:text-gray-500">
                            {getSourceTypeLabel(despatch.source_type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {despatch.dest_outlet?.outlet_name || "Unknown"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                        {Number(despatch.total_qty).toFixed(3)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-white">
                        ৳{Number(despatch.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {getStatusBadge(despatch.status)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              navigate(`/stock-despatch/${despatch.id}`)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          {despatch.status === DESPATCH_STATUS.IN_TRANSIT && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/stock-receive/new?despatch_id=${despatch.id}`,
                                )
                              }
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              title="Receive"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        {filteredDespatches.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
            <span>
              Showing {filteredDespatches.length} of {despatches.length}{" "}
              despatches
            </span>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
