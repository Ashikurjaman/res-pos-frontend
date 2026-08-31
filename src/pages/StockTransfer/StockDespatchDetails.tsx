// src/pages/StockTransfer/StockDespatchDetails.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Truck,
  Printer,
  Package,
  User,
  MapPin,
  Calendar,
  FileText,
  CheckSquare,
  XCircle,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import { OutletDespatch, DESPATCH_STATUS } from "../../type/stock-transfer";

export default function StockDespatchDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [despatch, setDespatch] = useState<OutletDespatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "items" | "receives">(
    "items",
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (id) {
      fetchDespatch();
    }
  }, [id]);

  const fetchDespatch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await StockTransferService.getDespatch(parseInt(id!));
      const despatchData = data.data || data;
      setDespatch(despatchData);
    } catch (error: any) {
      console.error("Error fetching despatch:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load despatch details",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const getStatusBadge = (status: number) => {
    const configs: Record<
      number,
      { label: string; color: string; icon: JSX.Element; bgColor: string }
    > = {
      [DESPATCH_STATUS.PENDING]: {
        label: "Pending",
        color: "text-yellow-800 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        icon: (
          <Clock size={14} className="text-yellow-600 dark:text-yellow-400" />
        ),
      },
      [DESPATCH_STATUS.IN_TRANSIT]: {
        label: "In Transit",
        color: "text-purple-800 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        icon: (
          <Truck size={14} className="text-purple-600 dark:text-purple-400" />
        ),
      },
      [DESPATCH_STATUS.RECEIVED]: {
        label: "Received",
        color: "text-green-800 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        icon: (
          <CheckCircle
            size={14}
            className="text-green-600 dark:text-green-400"
          />
        ),
      },
      [DESPATCH_STATUS.PARTIAL_RECEIVED]: {
        label: "Partial Received",
        color: "text-blue-800 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        icon: (
          <AlertCircle size={14} className="text-blue-600 dark:text-blue-400" />
        ),
      },
      [DESPATCH_STATUS.CANCELLED]: {
        label: "Cancelled",
        color: "text-red-800 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        icon: <XCircle size={14} className="text-red-600 dark:text-red-400" />,
      },
    };
    const config = configs[status] || configs[DESPATCH_STATUS.PENDING];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getSourceTypeLabel = (type: number) => {
    return type === 1 ? "Head Office" : "Outlet";
  };

  const getProgress = () => {
    if (!despatch?.details) return 0;
    const total = despatch.details.reduce(
      (sum, d) => sum + Number(d.despatch_qty),
      0,
    );
    const received = despatch.details.reduce(
      (sum, d) => sum + Number(d.received_qty || 0),
      0,
    );
    return total > 0 ? Math.round((received / total) * 100) : 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReceive = () => {
    if (despatch) {
      navigate(`/stock-receive/new?despatch_id=${despatch.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading despatch details...
          </p>
        </div>
      </div>
    );
  }

  if (!despatch) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Despatch Not Found" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Despatch Not Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              The despatch you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/stock-despatches")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title={`Despatch ${despatch.despatch_no} | A&T`}
        description="Stock Despatch Details"
      />
      <PageBreadcrumb pageTitle={`Despatch: ${despatch.despatch_no}`} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/stock-despatches")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Despatch #{despatch.despatch_no}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            <Printer size={16} />
            Print
          </button>
          {despatch.status === DESPATCH_STATUS.IN_TRANSIT && (
            <button
              onClick={handleReceive}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <CheckCircle size={16} />
              Receive Stock
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Delivery Progress
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progress === 100 ? "bg-green-600" : "bg-blue-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <Calendar size={18} className="text-blue-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Despatch Date
              </p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {new Date(despatch.despatch_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <Package size={18} className="text-green-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Quantity
              </p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {Number(despatch.total_qty).toFixed(3)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <FileText size={18} className="text-purple-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Amount
              </p>
              <p className="font-semibold text-gray-800 dark:text-white">
                ৳{Number(despatch.total_amount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <CheckSquare size={18} className="text-orange-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              {getStatusBadge(despatch.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-red-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Source</p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {despatch.source_outlet?.outlet_name || "Unknown"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Type: {getSourceTypeLabel(despatch.source_type)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-green-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Destination
              </p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {despatch.dest_outlet?.outlet_name || "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transport Info */}
      {(despatch.vehicle_no || despatch.driver_name) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Truck size={18} className="text-blue-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Transport Details
              </p>
              <div className="flex flex-wrap gap-4 mt-1">
                {despatch.vehicle_no && (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Vehicle:{" "}
                    <span className="font-medium">{despatch.vehicle_no}</span>
                  </span>
                )}
                {despatch.driver_name && (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Driver:{" "}
                    <span className="font-medium">{despatch.driver_name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 print:hidden">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("items")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "items"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Package size={16} className="inline mr-2" />
            Items
          </button>
          <button
            onClick={() => setActiveTab("receives")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "receives"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <CheckCircle size={16} className="inline mr-2" />
            Receives
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Details
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "items" && (
        <ComponentCard title="Despatch Items">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    #
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Product
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Unit
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Despatch Qty
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Price
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Total
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Received
                  </th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {despatch.details?.map((detail, index) => {
                  const receivedQty = Number(detail.received_qty || 0);
                  const despatchQty = Number(detail.despatch_qty);
                  const isFullyReceived = receivedQty >= despatchQty;
                  const isPartialReceived =
                    receivedQty > 0 && receivedQty < despatchQty;

                  return (
                    <tr
                      key={detail.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-300">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-800 dark:text-white">
                        {detail.product?.product_name || "Unknown"}
                        <span className="block text-xs text-gray-400 dark:text-gray-500">
                          {detail.product?.product_code}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-300">
                        {detail.unit?.unit_name || "N/A"}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                        {despatchQty.toFixed(3)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                        ৳{Number(detail.purchase_price).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-800 dark:text-white">
                        ৳{Number(detail.total_amount).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">
                        {receivedQty.toFixed(3)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isFullyReceived && receivedQty > 0 ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                            <CheckCircle size={14} />
                            Received
                          </span>
                        ) : isPartialReceived ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs">
                            <AlertCircle size={14} />
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs">
                            <Clock size={14} />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-semibold">
                  <td
                    colSpan={3}
                    className="py-2 px-3 text-right text-gray-700 dark:text-gray-300"
                  >
                    Total:
                  </td>
                  <td className="py-2 px-3 text-right text-gray-800 dark:text-white">
                    {despatch.details
                      ?.reduce((sum, d) => sum + Number(d.despatch_qty), 0)
                      .toFixed(3)}
                  </td>
                  <td></td>
                  <td className="py-2 px-3 text-right text-gray-800 dark:text-white">
                    ৳
                    {despatch.details
                      ?.reduce((sum, d) => sum + Number(d.total_amount), 0)
                      .toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">
                    {despatch.details
                      ?.reduce((sum, d) => sum + Number(d.received_qty || 0), 0)
                      .toFixed(3)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ComponentCard>
      )}

      {activeTab === "receives" && (
        <ComponentCard title="Receive History">
          {despatch.receives && despatch.receives.length > 0 ? (
            <div className="space-y-4">
              {despatch.receives.map((receive) => (
                <div
                  key={receive.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => navigate(`/stock-receive/${receive.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {receive.receive_no}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(receive.receive_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        receive.status === 1
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : receive.status === 2
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : receive.status === 3
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {receive.status === 1
                        ? "Complete"
                        : receive.status === 2
                          ? "Partial"
                          : receive.status === 3
                            ? "Discrepancy"
                            : "Pending"}
                    </span>
                  </div>
                  {receive.remarks && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {receive.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No receives recorded yet
              </p>
              {despatch.status === DESPATCH_STATUS.IN_TRANSIT && (
                <button
                  onClick={handleReceive}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                >
                  Receive Stock
                </button>
              )}
            </div>
          )}
        </ComponentCard>
      )}

      {activeTab === "details" && (
        <ComponentCard title="Additional Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Despatch No
              </p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {despatch.despatch_no}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Request No
              </p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">
                {despatch.request?.request_no || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Despatched By
              </p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {despatch.despatched_by_user?.name || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created At
              </p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {new Date(despatch.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last Updated
              </p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {new Date(despatch.updated_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Source Type
              </p>
              <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {getSourceTypeLabel(despatch.source_type)}
              </span>
            </div>
          </div>

          {despatch.remarks && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Remarks
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {despatch.remarks}
              </p>
            </div>
          )}
        </ComponentCard>
      )}
    </div>
  );
}
