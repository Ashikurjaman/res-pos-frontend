// src/pages/StockTransfer/StockRequestDetails.tsx
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
  XCircle,
  Clock,
  Truck,
  Package,
  Edit,
  Check,
  AlertCircle,
  Printer,
  Download,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import {
  OutletRequest,
  REQUEST_STATUS,
  REQUEST_TYPE,
} from "../../type/stock-transfer";

export default function StockRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [request, setRequest] = useState<OutletRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "details" | "despatches" | "ledger"
  >("details");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    try {
      const data = await StockTransferService.getRequest(parseInt(id!));
      const requestData = data.data || data;
      setRequest(requestData);
    } catch (error: any) {
      console.error("Error fetching request:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load request details",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const getStatusBadge = (status: number) => {
    const configs: Record<
      number,
      { label: string; color: string; icon: JSX.Element }
    > = {
      [REQUEST_STATUS.PENDING]: {
        label: "Pending",
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: (
          <Clock size={14} className="text-yellow-600 dark:text-yellow-400" />
        ),
      },
      [REQUEST_STATUS.APPROVED]: {
        label: "Approved",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: (
          <Check size={14} className="text-green-600 dark:text-green-400" />
        ),
      },
      [REQUEST_STATUS.PARTIAL_APPROVED]: {
        label: "Partial Approved",
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: (
          <AlertCircle size={14} className="text-blue-600 dark:text-blue-400" />
        ),
      },
      [REQUEST_STATUS.REJECTED]: {
        label: "Rejected",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <XCircle size={14} className="text-red-600 dark:text-red-400" />,
      },
      [REQUEST_STATUS.DESPATCHED]: {
        label: "Despatched",
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        icon: (
          <Truck size={14} className="text-purple-600 dark:text-purple-400" />
        ),
      },
      [REQUEST_STATUS.RECEIVED]: {
        label: "Received",
        color:
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
        icon: (
          <CheckCircle
            size={14}
            className="text-indigo-600 dark:text-indigo-400"
          />
        ),
      },
      [REQUEST_STATUS.CLOSED]: {
        label: "Closed",
        color:
          "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400",
        icon: (
          <CheckCircle size={14} className="text-gray-600 dark:text-gray-400" />
        ),
      },
    };
    const config = configs[status] || configs[REQUEST_STATUS.PENDING];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getTypeLabel = (type: number) => {
    return type === REQUEST_TYPE.HO_REQUEST ? "HO Request" : "Outlet Transfer";
  };

  const getProgress = () => {
    if (!request?.details) return 0;
    const total = request.details.reduce(
      (sum, d) => sum + Number(d.requested_qty),
      0,
    );
    const received = request.details.reduce(
      (sum, d) => sum + Number(d.received_qty),
      0,
    );
    return total > 0 ? Math.round((received / total) * 100) : 0;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading request details...
          </p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Request Not Found" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Request Not Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              The request you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate("/stock-requests")}
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
        title={`Request ${request.request_no} | A&T`}
        description="Stock Request Details"
      />
      <PageBreadcrumb pageTitle={`Request: ${request.request_no}`} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/stock-requests")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Request #{request.request_no}
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
          {request.status === REQUEST_STATUS.PENDING && (
            <button
              onClick={() => navigate(`/stock-request/${id}/approve`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Edit size={16} />
              Approve
            </button>
          )}
          {request.status === REQUEST_STATUS.APPROVED && (
            <button
              onClick={() => navigate(`/stock-despatch/new?request_id=${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
            >
              <Truck size={16} />
              Create Despatch
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Progress
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-1 space-y-6">
          <ComponentCard title="Request Information">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Request No
                </p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {request.request_no}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {new Date(request.request_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  {getTypeLabel(request.request_type)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Status
                </p>
                {getStatusBadge(request.status)}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Requesting Outlet
                </p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {request.requesting_outlet?.outlet_name || "Unknown"}
                </p>
              </div>
              {request.source_outlet && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Source Outlet
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {request.source_outlet?.outlet_name || "Unknown"}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Requested By
                </p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {request.requested_by_user?.name || "Unknown"}
                </p>
              </div>
              {request.approved_by && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Approved By
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {request.approved_by_user?.name || "Unknown"}
                  </p>
                </div>
              )}
              {request.remarks && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Remarks
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {request.remarks}
                  </p>
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Right Column - Items & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Package size={16} className="inline mr-2" />
                Items
              </button>
              <button
                onClick={() => setActiveTab("despatches")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "despatches"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Truck size={16} className="inline mr-2" />
                Despatches
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "details" && (
            <ComponentCard title="Request Items">
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
                        Requested
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                        Approved
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                        Despatched
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
                    {request.details?.map((detail, index) => {
                      const isFullyReceived =
                        Number(detail.received_qty) >=
                        Number(detail.despatched_qty);
                      const isFullyDespatched =
                        Number(detail.despatched_qty) >=
                        Number(detail.approved_qty);
                      const isApproved = Number(detail.approved_qty) > 0;

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
                            {detail.unit?.unit_name || "Unknown"}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                            {Number(detail.requested_qty).toFixed(3)}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                            {Number(detail.approved_qty).toFixed(3)}
                            {!isApproved && detail.approved_qty === 0 && (
                              <span className="block text-xs text-red-500">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                            {Number(detail.despatched_qty).toFixed(3)}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                            {Number(detail.received_qty).toFixed(3)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isFullyReceived &&
                            Number(detail.received_qty) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                                <CheckCircle size={14} />
                                Complete
                              </span>
                            ) : isFullyDespatched &&
                              Number(detail.despatched_qty) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs">
                                <Truck size={14} />
                                In Transit
                              </span>
                            ) : isApproved &&
                              Number(detail.approved_qty) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs">
                                <Clock size={14} />
                                Pending Despatch
                              </span>
                            ) : detail.approved_qty === 0 ? (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                                <XCircle size={14} />
                                Rejected
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
                        {request.details
                          ?.reduce((sum, d) => sum + Number(d.requested_qty), 0)
                          .toFixed(3)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-800 dark:text-white">
                        {request.details
                          ?.reduce((sum, d) => sum + Number(d.approved_qty), 0)
                          .toFixed(3)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-800 dark:text-white">
                        {request.details
                          ?.reduce(
                            (sum, d) => sum + Number(d.despatched_qty),
                            0,
                          )
                          .toFixed(3)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-800 dark:text-white">
                        {request.details
                          ?.reduce((sum, d) => sum + Number(d.received_qty), 0)
                          .toFixed(3)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </ComponentCard>
          )}

          {activeTab === "despatches" && (
            <ComponentCard title="Despatches">
              {request.despatches && request.despatches.length > 0 ? (
                <div className="space-y-4">
                  {request.despatches.map((despatch) => (
                    <div
                      key={despatch.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => navigate(`/stock-despatch/${despatch.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            {despatch.despatch_no}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(
                              despatch.despatch_date,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            despatch.status === 2
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : despatch.status === 1
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {despatch.status === 2
                            ? "Received"
                            : despatch.status === 1
                              ? "In Transit"
                              : "Pending"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <span>
                          Qty: {Number(despatch.total_qty).toFixed(3)}
                        </span>
                        <span className="mx-2">|</span>
                        <span>
                          Amount: ৳{Number(despatch.total_amount).toFixed(2)}
                        </span>
                      </div>
                      {despatch.vehicle_no && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Vehicle: {despatch.vehicle_no}{" "}
                          {despatch.driver_name &&
                            `| Driver: ${despatch.driver_name}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No despatches found
                  </p>
                </div>
              )}
            </ComponentCard>
          )}
        </div>
      </div>
    </div>
  );
}
