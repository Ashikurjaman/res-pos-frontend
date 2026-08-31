// src/pages/StockTransfer/StockReceiveForm.tsx
import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
  Truck,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import { OutletDespatch } from "../../type/stock-transfer";

interface ReceiveItem {
  id: number;
  despatch_detail_id: number;
  product_id: number;
  product_name: string;
  unit_id: number;
  unit_name: string;
  despatched_qty: number;
  received_qty: number;
  short_qty: number;
  damage_qty: number;
  remarks: string;
}

export default function StockReceiveForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const despatchId = searchParams.get("despatch_id");

  const [formData, setFormData] = useState({
    despatch_id: despatchId ? parseInt(despatchId) : 0,
    receive_date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const [despatch, setDespatch] = useState<OutletDespatch | null>(null);
  const [items, setItems] = useState<ReceiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (despatchId) {
      fetchDespatch();
    }
  }, [despatchId]);

  const fetchDespatch = useCallback(async () => {
    setFetching(true);
    try {
      const data = await StockTransferService.getDespatch(
        parseInt(despatchId!),
      );
      const despatchData = data.data || data;
      setDespatch(despatchData);

      if (despatchData.details) {
        const receiveItems = despatchData.details
          .filter((d: any) => Number(d.despatch_qty) > 0)
          .map((d: any) => {
            const receivedQty = Number(d.received_qty) || 0;
            const remainingQty = Number(d.despatch_qty) - receivedQty;
            return {
              id: Date.now() + Math.random(),
              despatch_detail_id: d.id,
              product_id: d.product_id,
              product_name: d.product?.product_name || "Unknown",
              unit_id: d.unit_id,
              unit_name: d.unit?.unit_name || "Unknown",
              despatched_qty: Number(d.despatch_qty),
              received_qty: remainingQty,
              short_qty: 0,
              damage_qty: 0,
              remarks: "",
            };
          });
        setItems(receiveItems);
      }
    } catch (error: any) {
      console.error("Error fetching despatch:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load despatch",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setFetching(false);
    }
  }, [despatchId]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const handleQtyChange = (
    id: number,
    field: "received_qty" | "short_qty" | "damage_qty",
    value: number,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newValue = Math.max(0, value);
          const updatedItem = { ...item, [field]: newValue };

          // Auto-calculate short_qty if received_qty < despatched_qty
          if (field === "received_qty") {
            const total = newValue + item.short_qty + item.damage_qty;
            if (total > item.despatched_qty) {
              return item;
            }
          }

          return updatedItem;
        }
        return item;
      }),
    );
  };

  const handleRemarksChange = (id: number, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, remarks: value } : item)),
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.despatch_id) {
      newErrors.despatch_id = "Despatch is required";
    }

    let hasValidItems = false;
    items.forEach((item, index) => {
      const total = item.received_qty + item.short_qty + item.damage_qty;
      if (total > item.despatched_qty) {
        newErrors[`item_${index}`] =
          `Total (Received + Short + Damage) cannot exceed Despatched Qty`;
      }
      if (item.received_qty > 0 || item.short_qty > 0 || item.damage_qty > 0) {
        hasValidItems = true;
      }
    });

    if (!hasValidItems) {
      newErrors.items = "At least one item must have received quantity";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const receiveItems = items.filter(
        (item) =>
          item.received_qty > 0 || item.short_qty > 0 || item.damage_qty > 0,
      );

      if (receiveItems.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "No Items",
          text: "Please receive at least one item",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      setLoading(true);
      try {
        const payload = {
          despatch_id: formData.despatch_id,
          receive_date: formData.receive_date,
          items: receiveItems.map((item) => ({
            despatch_detail_id: item.despatch_detail_id,
            received_qty: item.received_qty,
            short_qty: item.short_qty,
            damage_qty: item.damage_qty,
            remarks: item.remarks,
          })),
          remarks: formData.remarks,
        };

        await StockTransferService.receiveStock(payload);

        Swal.fire({
          icon: "success",
          title: "Stock Received!",
          text: "Stock received successfully",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });

        navigate("/stock-receives");
      } catch (error: any) {
        console.error("Error receiving stock:", error);
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: error.message || "Failed to receive stock",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setLoading(false);
      }
    },
    [formData, items, navigate],
  );

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

  if (!despatch && despatchId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Despatch Not Found" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Despatch Not Found
            </h3>
            <button
              onClick={() => navigate("/stock-despatches")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Despatches
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta title="Receive Stock | A&T" description="Receive Stock" />
      <PageBreadcrumb pageTitle="Receive Stock" />

      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <ComponentCard title="Receive Stock">
            <form onSubmit={handleSubmit} noValidate>
              {/* Despatch Info */}
              {despatch && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Despatch No
                      </p>
                      <p className="font-semibold text-green-800 dark:text-green-300">
                        {despatch.despatch_no}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Despatch Date
                      </p>
                      <p className="font-semibold text-green-800 dark:text-green-300">
                        {new Date(despatch.despatch_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        From
                      </p>
                      <p className="font-semibold text-green-800 dark:text-green-300">
                        {despatch.source_outlet?.outlet_name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        To
                      </p>
                      <p className="font-semibold text-green-800 dark:text-green-300">
                        {despatch.dest_outlet?.outlet_name || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Receive Info */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Receive Date
                </Label>
                <Input
                  type="date"
                  id="receive_date"
                  value={formData.receive_date}
                  onChange={handleChange}
                  className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  disabled={loading}
                />
              </div>

              {/* Items */}
              <div className="mt-6">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Items <span className="text-red-500">*</span>
                </Label>
                {errors.items && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.items}
                  </p>
                )}

                <div className="space-y-3 mt-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Product
                        </p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Unit: {item.unit_name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Despatched: {item.despatched_qty.toFixed(3)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Received Qty
                        </Label>
                        <Input
                          type="number"
                          value={item.received_qty || ""}
                          onChange={(e) =>
                            handleQtyChange(
                              item.id,
                              "received_qty",
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
                          Short Qty
                        </Label>
                        <Input
                          type="number"
                          value={item.short_qty || ""}
                          onChange={(e) =>
                            handleQtyChange(
                              item.id,
                              "short_qty",
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
                          Damage Qty
                        </Label>
                        <Input
                          type="number"
                          value={item.damage_qty || ""}
                          onChange={(e) =>
                            handleQtyChange(
                              item.id,
                              "damage_qty",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={loading}
                          step="0.001"
                          min="0"
                        />
                        {errors[`item_${items.indexOf(item)}`] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors[`item_${items.indexOf(item)}`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Remarks
                        </Label>
                        <Input
                          type="text"
                          value={item.remarks}
                          onChange={(e) =>
                            handleRemarksChange(item.id, e.target.value)
                          }
                          placeholder="Optional"
                          className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div className="mt-6">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Remarks
                </Label>
                <textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter any additional remarks..."
                  className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  rows={2}
                  disabled={loading}
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => navigate("/stock-receives")}
                  className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
                  disabled={loading}
                >
                  <ArrowLeft size={18} />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg transition-colors min-w-[140px] w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Receiving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Receive Stock
                    </>
                  )}
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
