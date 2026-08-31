// src/pages/StockTransfer/StockRequestApproval.tsx
import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import {
  Loader2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import { OutletRequest, REQUEST_STATUS } from "../../type/stock-transfer";

interface ApprovalItem {
  detail_id: number;
  product_name: string;
  unit_name: string;
  requested_qty: number;
  approved_qty: number;
  remarks: string;
}

export default function StockRequestApproval() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [request, setRequest] = useState<OutletRequest | null>(null);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setFetching(true);
    try {
      const data = await StockTransferService.getRequest(parseInt(id!));
      const requestData = data.data || data;
      setRequest(requestData);

      if (requestData.details) {
        setItems(
          requestData.details.map((d: any) => ({
            detail_id: d.id,
            product_name: d.product?.product_name || "Unknown",
            unit_name: d.unit?.unit_name || "Unknown",
            requested_qty: parseFloat(d.requested_qty),
            approved_qty: parseFloat(d.approved_qty) || 0,
            remarks: d.remarks || "",
          })),
        );
      }
    } catch (error: any) {
      console.error("Error fetching request:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load request",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setFetching(false);
    }
  }, [id]);

  const handleQtyChange = (index: number, value: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, approved_qty: Math.max(0, value) } : item,
      ),
    );
  };

  const handleRemarksChange = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, remarks: value } : item)),
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    let hasError = false;

    items.forEach((item, index) => {
      if (item.approved_qty < 0) {
        newErrors[`qty_${index}`] = "Approved quantity cannot be negative";
        hasError = true;
      }
    });

    if (hasError) {
      newErrors.general = "Please fix all errors";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = useCallback(async () => {
    if (!validate()) return;

    const hasAnyApproved = items.some((item) => item.approved_qty > 0);
    if (!hasAnyApproved) {
      const result = await Swal.fire({
        title: "Reject Request?",
        text: "No items have approved quantities. This will reject the request.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Reject",
        cancelButtonText: "Cancel",
      });
      if (!result.isConfirmed) return;
    }

    setLoading(true);
    try {
      const payload = {
        items: items.map((item) => ({
          detail_id: item.detail_id,
          approved_qty: item.approved_qty,
          remarks: item.remarks,
        })),
        remarks: remarks,
      };

      await StockTransferService.approveRequest(parseInt(id!), payload);

      Swal.fire({
        icon: "success",
        title: "Approved!",
        text: "Request processed successfully",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });

      navigate("/stock-requests");
    } catch (error: any) {
      console.error("Error approving request:", error);
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: error.message || "Failed to approve request",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [items, remarks, id, navigate]);

  const getStatusBadge = (status: number) => {
    const configs = {
      [REQUEST_STATUS.PENDING]: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock size={14} />,
      },
      [REQUEST_STATUS.APPROVED]: {
        label: "Approved",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle size={14} />,
      },
      [REQUEST_STATUS.PARTIAL_APPROVED]: {
        label: "Partial Approved",
        color: "bg-blue-100 text-blue-800",
        icon: <AlertCircle size={14} />,
      },
      [REQUEST_STATUS.REJECTED]: {
        label: "Rejected",
        color: "bg-red-100 text-red-800",
        icon: <XCircle size={14} />,
      },
    };
    const config =
      configs[status as keyof typeof configs] ||
      configs[REQUEST_STATUS.PENDING];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
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

  if (request.status !== REQUEST_STATUS.PENDING) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Request Already Processed" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Request Already Processed
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Status: {getStatusBadge(request.status)}
            </p>
            <button
              onClick={() => navigate(`/stock-request/${id}`)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title="Approve Request | A&T"
        description="Approve Stock Request"
      />
      <PageBreadcrumb pageTitle={`Approve: ${request.request_no}`} />

      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <ComponentCard title="Approve Stock Request">
            {/* Request Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Outlet
                </p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {request.requesting_outlet?.outlet_name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Status
                </p>
                {getStatusBadge(request.status)}
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Items <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3 mt-2">
                {items.map((item, index) => (
                  <div
                    key={item.detail_id}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Product
                      </p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {item.product_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Requested Qty
                      </p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {item.requested_qty}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Approved Qty <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={item.approved_qty || ""}
                        onChange={(e) =>
                          handleQtyChange(
                            index,
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="0"
                        className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        disabled={loading}
                        step="0.001"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Remarks
                      </Label>
                      <Input
                        type="text"
                        value={item.remarks}
                        onChange={(e) =>
                          handleRemarksChange(index, e.target.value)
                        }
                        placeholder="Optional"
                        className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        disabled={loading}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {errors.general && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.general}
                </p>
              )}
            </div>

            {/* Remarks */}
            <div className="mt-6">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Approval Remarks
              </Label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter approval remarks..."
                className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                rows={2}
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                onClick={() => navigate(`/stock-request/${id}`)}
                className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
                disabled={loading}
              >
                <ArrowLeft size={18} />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleApprove}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors min-w-[140px] w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Process
                  </>
                )}
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
