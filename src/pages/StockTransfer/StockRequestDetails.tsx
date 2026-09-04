// src/pages/StockTransfer/StockRequestDetails.tsx
import { useState, useCallback, useEffect } from "react";
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
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  Building,
  FileText,
  User,
  Calendar,
  Edit2,
  Printer,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import { OutletRequest, REQUEST_STATUS } from "../../type/stock-transfer";

const STATUS_CONFIG: Record<number, { label: string; color: string; icon: any }> = {
  [REQUEST_STATUS.PENDING]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  [REQUEST_STATUS.APPROVED]: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  [REQUEST_STATUS.PARTIAL_APPROVED]: {
    label: "Partial Approved",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle,
  },
  [REQUEST_STATUS.REJECTED]: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  [REQUEST_STATUS.DESPATCHED]: {
    label: "Despatched",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Truck,
  },
  [REQUEST_STATUS.RECEIVED]: {
    label: "Received",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Package,
  },
  [REQUEST_STATUS.CLOSED]: {
    label: "Closed",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: FileText,
  },
};

export default function StockRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [request, setRequest] = useState<OutletRequest | null>(null);
  const [loading, setLoading] = useState(true);

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
      const response = await StockTransferService.getRequest(parseInt(id!));
      console.log('📥 Request details response:', response);

      // Extract data properly
      const requestData = response.data || response;
      setRequest(requestData);
    } catch (error: any) {
      console.error("❌ Error fetching request:", error);
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
    const config = STATUS_CONFIG[status] || STATUS_CONFIG[REQUEST_STATUS.PENDING];
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}
      >
        <Icon size={16} />
        {config.label}
      </span>
    );
  };

  const getRequestTypeLabel = (type: number) => {
    return type === 1 ? "HO Request" : "Outlet Transfer";
  };

  const canApprove = request?.status === REQUEST_STATUS.PENDING;
  const canDespatch = request?.status === REQUEST_STATUS.APPROVED ||
                      request?.status === REQUEST_STATUS.PARTIAL_APPROVED;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading request details...</p>
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

  const totalRequested = request.details?.reduce((sum, d) => sum + (Number(d.requested_qty) || 0), 0) || 0;
  const totalApproved = request.details?.reduce((sum, d) => sum + (Number(d.approved_qty) || 0), 0) || 0;
  const totalDespatched = request.details?.reduce((sum, d) => sum + (Number(d.despatched_qty) || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title={`Request ${request.request_no} | A&T`}
        description="View Stock Request Details"
      />
      <PageBreadcrumb pageTitle={`Request: ${request.request_no}`} />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/stock-requests")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to List"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {request.request_no}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created on {new Date(request.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canApprove && (
              <Button
                onClick={() => navigate(`/stock-requests/${id}/approve`)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                <CheckCircle size={18} />
                Approve
              </Button>
            )}
            {canDespatch && (
              <Button
                onClick={() => navigate(`/stock-despatches/new?request_id=${id}`)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                <Truck size={18} />
                Create Despatch
              </Button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Printer size={18} />
              Print
            </button>
          </div>
        </div>

        {/* Request Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FileText size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                {getStatusBadge(request.status)}
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Building size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Requesting Outlet</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {request.requesting_outlet?.outlet_name ||
                   request.requestingOutlet?.outlet_name ||
                   `Outlet ID: ${request.requesting_outlet_id}`}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <FileText size={20} className="text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Request Type</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {getRequestTypeLabel(request.request_type)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <User size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Requested By</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {request.requested_by_user?.full_name ||
                   request.requestedBy?.full_name ||
                   `User ID: ${request.requested_by}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Requested</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalRequested.toFixed(3)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Approved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalApproved.toFixed(3)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Despatched</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalDespatched.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <ComponentCard title="Request Items">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Approved
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Despatched
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {request.details?.map((detail, index) => {
                  const isApproved = Number(detail.approved_qty) > 0;
                  const isPartial = Number(detail.approved_qty) > 0 &&
                                   Number(detail.approved_qty) < Number(detail.requested_qty);
                  const isFullyApproved = Number(detail.approved_qty) >= Number(detail.requested_qty);

                  let statusText = "Pending";
                  let statusColor = "text-yellow-600 dark:text-yellow-400";
                  if (isFullyApproved && Number(detail.despatched_qty) >= Number(detail.approved_qty)) {
                    statusText = "Completed";
                    statusColor = "text-green-600 dark:text-green-400";
                  } else if (isFullyApproved) {
                    statusText = "Approved";
                    statusColor = "text-green-600 dark:text-green-400";
                  } else if (isPartial) {
                    statusText = "Partial";
                    statusColor = "text-blue-600 dark:text-blue-400";
                  } else if (isApproved) {
                    statusText = "Approved";
                    statusColor = "text-green-600 dark:text-green-400";
                  }

                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {detail.product?.product_name || `Product ${detail.product_id}`}
                        </div>
                        {detail.product?.product_code && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Code: {detail.product.product_code}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {detail.unit?.unit_name || `Unit ${detail.unit_id}`}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {Number(detail.requested_qty).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                        {Number(detail.approved_qty || 0).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-purple-600 dark:text-purple-400">
                        {Number(detail.despatched_qty || 0).toFixed(3)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!request.details || request.details.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ComponentCard>

        {/* Remarks */}
        {request.remarks && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FileText size={16} />
              Remarks
            </h4>
            <p className="text-gray-600 dark:text-gray-400">{request.remarks}</p>
          </div>
        )}

        {/* Approval Info */}
        {request.approved_by && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <CheckCircle size={16} />
              <span>
                Approved by {request.approved_by_user?.full_name || `User ${request.approved_by}`}
                {request.approved_at && ` on ${new Date(request.approved_at).toLocaleString()}`}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            onClick={() => navigate("/stock-requests")}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg"
          >
            <ArrowLeft size={18} />
            Back to List
          </Button>
        </div>
      </div>
    </div>
  );
}
