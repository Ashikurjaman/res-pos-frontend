// src/pages/StockTransfer/StockReceiveDetails.tsx
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
  Printer,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import { OutletReceive, RECEIVE_STATUS } from "../../type/stock-transfer";

export default function StockReceiveDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [receive, setReceive] = useState<OutletReceive | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (id) {
      fetchReceive();
    }
  }, [id]);

  const fetchReceive = useCallback(async () => {
    setLoading(true);
    try {
      const data = await StockTransferService.getReceive(parseInt(id!));
      const receiveData = data.data || data;
      setReceive(receiveData);
    } catch (error: any) {
      console.error("Error fetching receive:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load receive details",
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!receive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Receive Not Found" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Receive Not Found
            </h3>
            <button
              onClick={() => navigate("/stock-receives")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title={`Receive ${receive.receive_no} | A&T`}
        description="Stock Receive Details"
      />
      <PageBreadcrumb pageTitle={`Receive: ${receive.receive_no}`} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/stock-receives")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Receive #{receive.receive_no}
          </h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          <Printer size={16} />
          Print
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Receive Date
          </p>
          <p className="font-semibold text-gray-800 dark:text-white">
            {new Date(receive.receive_date).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Despatch</p>
          <p className="font-semibold text-blue-600 dark:text-blue-400">
            {receive.despatch?.despatch_no || "N/A"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
          {getStatusBadge(receive.status)}
        </div>
      </div>

      {/* Items Table */}
      <ComponentCard title="Receive Items">
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
                  Despatched
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Received
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Short
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Damage
                </th>
              </tr>
            </thead>
            <tbody>
              {receive.details?.map((detail, index) => (
                <tr
                  key={detail.id}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="py-2 px-3 text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3 font-medium text-gray-800 dark:text-white">
                    {detail.product?.product_name || "Unknown"}
                  </td>
                  <td className="py-2 px-3 text-gray-600 dark:text-gray-300">
                    {detail.product?.unit?.unit_name || "N/A"}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                    {Number(detail.despatched_qty).toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {Number(detail.received_qty).toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right text-orange-600 dark:text-orange-400">
                    {Number(detail.short_qty).toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right text-red-600 dark:text-red-400">
                    {Number(detail.damage_qty).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-semibold">
                <td colSpan={3} className="py-2 px-3 text-right">
                  Total:
                </td>
                <td className="py-2 px-3 text-right">
                  {receive.details
                    ?.reduce((sum, d) => sum + Number(d.despatched_qty), 0)
                    .toFixed(3)}
                </td>
                <td className="py-2 px-3 text-right text-green-600">
                  {receive.details
                    ?.reduce((sum, d) => sum + Number(d.received_qty), 0)
                    .toFixed(3)}
                </td>
                <td className="py-2 px-3 text-right text-orange-600">
                  {receive.details
                    ?.reduce((sum, d) => sum + Number(d.short_qty), 0)
                    .toFixed(3)}
                </td>
                <td className="py-2 px-3 text-right text-red-600">
                  {receive.details
                    ?.reduce((sum, d) => sum + Number(d.damage_qty), 0)
                    .toFixed(3)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {receive.remarks && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Remarks:</span> {receive.remarks}
            </p>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
