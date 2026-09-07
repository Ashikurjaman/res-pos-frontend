// src/pages/StockTransfer/StockReceivePending.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import { Loader2, PackageCheck, RefreshCw, Truck, Eye } from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import OutletService from "../../services/OutletService"; // adjust path/name if different
import api from "../../services/api";

interface PendingDespatchDetail {
  id: number;
  product?: { product_name?: string };
  unit?: { unit_name?: string };
  despatch_qty: number;
  received_qty: number;
  remaining_to_receive: number;
}

interface PendingDespatch {
  id: number;
  despatch_no: string;
  despatch_date: string;
  status: number;
  status_label: string;
  source_type_label: string;
  source_outlet?: { id: number; outlet_name: string };
  dest_outlet?: { id: number; outlet_name: string };
  despatched_by?: { name: string };
  details: PendingDespatchDetail[];
}

interface Outlet {
  id: number;
  outlet_name: string;
}

export default function StockReceivePending() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const isSuperadmin = (user?.role || "").trim().toLowerCase() === "superadmin";

  const [despatches, setDespatches] = useState<PendingDespatch[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletFilter, setOutletFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [receivingId, setReceivingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  const fetchOutlets = useCallback(async () => {
    if (!isSuperadmin) return;
    try {
      const response = await api.get("/outlets/all");
      const list = response?.data?.data || response?.data || response || [];
      setOutlets(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching outlets:", error);
    }
  }, [isSuperadmin]);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (isSuperadmin && outletFilter) {
        params.outlet_id = outletFilter;
      }
      const response = await StockTransferService.getPendingDespatches(params);
      const list = response?.data?.data || response?.data || response || [];
      setDespatches(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.error("Error fetching pending despatches:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          error?.response?.data?.message || "Failed to load pending despatches",
        confirmButtonColor: "#3b82f6",
      });
      setDespatches([]);
    } finally {
      setLoading(false);
    }
  }, [isSuperadmin, outletFilter]);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleReceiveAll = async (despatch: PendingDespatch) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Receive all items?",
      text: `Despatch ${despatch.despatch_no} - all pending quantities will be marked as received.`,
      showCancelButton: true,
      confirmButtonText: "Yes, receive all",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    setReceivingId(despatch.id);
    try {
      await StockTransferService.receiveAllDespatch(despatch.id);
      Swal.fire({
        icon: "success",
        title: "Received!",
        text: `Despatch ${despatch.despatch_no} has been received.`,
        confirmButtonColor: "#16a34a",
      });
      fetchPending();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: error?.response?.data?.message || "Failed to receive stock",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setReceivingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading pending despatches...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title="Pending Receives | A&T"
        description="Pending Stock Despatches"
      />
      <PageBreadcrumb pageTitle="Pending Receives" />

      <ComponentCard title="Pending Despatches">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {isSuperadmin ? (
            <select
              value={outletFilter}
              onChange={(e) => setOutletFilter(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Outlets</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.outlet_name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing pending despatches for your outlet
            </span>
          )}

          <button
            onClick={fetchPending}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* List */}
        {despatches.length === 0 ? (
          <div className="text-center py-12">
            <PackageCheck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Nothing Pending
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              All despatches for this outlet have been received.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {despatches.map((despatch) => (
              <div
                key={despatch.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Truck className="text-blue-500" size={20} />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {despatch.despatch_no}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(despatch.despatch_date).toLocaleDateString()}{" "}
                        &middot; {despatch.source_type_label}:{" "}
                        {despatch.source_outlet?.outlet_name || "Head Office"}
                        {" -> "}
                        {despatch.dest_outlet?.outlet_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {despatch.status_label}
                    </span>
                    <Button
                      onClick={() =>
                        navigate(`/stock-despatches/${despatch.id}`)
                      }
                      className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm"
                    >
                      <Eye size={14} />
                      Details
                    </Button>
                    <Button
                      onClick={() => handleReceiveAll(despatch)}
                      disabled={receivingId === despatch.id}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60"
                    >
                      {receivingId === despatch.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <PackageCheck size={14} />
                      )}
                      Receive All
                    </Button>
                  </div>
                </div>

                {/* Items preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left py-1.5 px-2">Product</th>
                        <th className="text-left py-1.5 px-2">Unit</th>
                        <th className="text-right py-1.5 px-2">Despatched</th>
                        <th className="text-right py-1.5 px-2">Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despatch.details.map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-gray-50 dark:border-gray-800"
                        >
                          <td className="py-1.5 px-2 text-gray-700 dark:text-gray-300">
                            {d.product?.product_name || "Unknown"}
                          </td>
                          <td className="py-1.5 px-2 text-gray-500 dark:text-gray-400">
                            {d.unit?.unit_name || "N/A"}
                          </td>
                          <td className="py-1.5 px-2 text-right text-gray-700 dark:text-gray-300">
                            {Number(d.despatch_qty).toFixed(3)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-medium text-orange-600 dark:text-orange-400">
                            {Number(d.remaining_to_receive).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
