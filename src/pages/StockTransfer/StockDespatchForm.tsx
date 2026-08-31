// src/pages/StockTransfer/StockDespatchForm.tsx
import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import {
  Loader2,
  Save,
  ArrowLeft,
  Plus,
  X,
  AlertCircle,
  Truck,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import ProductService from "../../services/ProductService";
import { OutletRequest } from "../../type/stock-transfer";

type OptionType = { value: string; label: string };

interface DespatchItem {
  id: number;
  request_detail_id: number;
  product_id: number;
  product_name: string;
  unit_id: number;
  unit_name: string;
  approved_qty: number;
  despatched_qty: number;
  remaining_qty: number;
  despatch_qty: number;
  purchase_price: number;
  remarks: string;
}

export default function StockDespatchForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const requestId = searchParams.get("request_id");

  const [formData, setFormData] = useState({
    request_id: requestId ? parseInt(requestId) : 0,
    despatch_date: new Date().toISOString().split("T")[0],
    source_outlet_id: 1,
    vehicle_no: "",
    driver_name: "",
    remarks: "",
  });

  const [request, setRequest] = useState<OutletRequest | null>(null);
  const [items, setItems] = useState<DespatchItem[]>([]);
  const [outlets, setOutlets] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
    fetchOutlets();
  }, [requestId]);

  const fetchOutlets = useCallback(async () => {
    try {
      const response = await fetch("/api/outlets");
      const data = await response.json();
      setOutlets(
        (data.data || []).map((o: any) => ({
          value: o.id.toString(),
          label: o.outlet_name,
        })),
      );
    } catch (error) {
      console.error("Error fetching outlets:", error);
    }
  }, []);

  const fetchRequest = useCallback(async () => {
    setFetching(true);
    try {
      const data = await StockTransferService.getRequest(parseInt(requestId!));
      const requestData = data.data || data;
      setRequest(requestData);

      // Transform request details to despatch items
      if (requestData.details) {
        const despatchItems = requestData.details
          .filter((d: any) => Number(d.approved_qty) > 0)
          .map((d: any) => ({
            id: Date.now() + Math.random(),
            request_detail_id: d.id,
            product_id: d.product_id,
            product_name: d.product?.product_name || "Unknown",
            unit_id: d.unit_id,
            unit_name: d.unit?.unit_name || "Unknown",
            approved_qty: Number(d.approved_qty),
            despatched_qty: Number(d.despatched_qty),
            remaining_qty: Number(d.approved_qty) - Number(d.despatched_qty),
            despatch_qty: Number(d.approved_qty) - Number(d.despatched_qty),
            purchase_price: d.product?.pur_price || 0,
            remarks: "",
          }));
        setItems(despatchItems);
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
  }, [requestId]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const handleSelectChange = useCallback(
    (field: string, value: OptionType | null) => {
      if (value) {
        setFormData((prev) => ({ ...prev, [field]: parseInt(value.value) }));
      }
    },
    [],
  );

  const handleQtyChange = (id: number, value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const maxQty = item.remaining_qty;
          return {
            ...item,
            despatch_qty: Math.min(Math.max(0, value), maxQty),
          };
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

    if (!formData.request_id) {
      newErrors.request_id = "Request is required";
    }

    let hasValidItems = false;
    items.forEach((item, index) => {
      if (item.despatch_qty > 0) {
        hasValidItems = true;
      }
      if (item.despatch_qty < 0) {
        newErrors[`qty_${index}`] = "Quantity cannot be negative";
      }
    });

    if (!hasValidItems) {
      newErrors.items = "At least one item must have despatch quantity";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const despatchItems = items.filter((item) => item.despatch_qty > 0);
      if (despatchItems.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "No Items",
          text: "Please add at least one item with quantity",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      setLoading(true);
      try {
        const payload = {
          request_id: formData.request_id,
          despatch_date: formData.despatch_date,
          source_outlet_id: formData.source_outlet_id,
          vehicle_no: formData.vehicle_no,
          driver_name: formData.driver_name,
          items: despatchItems.map((item) => ({
            request_detail_id: item.request_detail_id,
            despatch_qty: item.despatch_qty,
            remarks: item.remarks,
          })),
          remarks: formData.remarks,
        };

        await StockTransferService.createDespatch(payload);

        Swal.fire({
          icon: "success",
          title: "Despatch Created!",
          text: "Stock despatch created successfully",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });

        navigate("/stock-despatches");
      } catch (error: any) {
        console.error("Error creating despatch:", error);
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: error.message || "Failed to create despatch",
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

  if (!request && requestId) {
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
              Back to Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title="New Despatch | A&T"
        description="Create Stock Despatch"
      />
      <PageBreadcrumb pageTitle="Create Stock Despatch" />

      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <ComponentCard title="Create Stock Despatch">
            <form onSubmit={handleSubmit} noValidate>
              {/* Request Info */}
              {request && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Request No
                      </p>
                      <p className="font-semibold text-blue-800 dark:text-blue-300">
                        {request.request_no}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Request Date
                      </p>
                      <p className="font-semibold text-blue-800 dark:text-blue-300">
                        {new Date(request.request_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Requesting Outlet
                      </p>
                      <p className="font-semibold text-blue-800 dark:text-blue-300">
                        {request.requesting_outlet?.outlet_name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Status
                      </p>
                      <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs font-medium text-blue-800 dark:text-blue-200">
                        Approved
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Despatch Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Despatch Date
                  </Label>
                  <Input
                    type="date"
                    id="despatch_date"
                    value={formData.despatch_date}
                    onChange={handleChange}
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Source Outlet
                  </Label>
                  <Select
                    options={outlets}
                    value={
                      outlets.find(
                        (o) => parseInt(o.value) === formData.source_outlet_id,
                      ) || null
                    }
                    onChange={(val) =>
                      handleSelectChange("source_outlet_id", val)
                    }
                    className="w-full mt-1"
                    isDisabled={loading}
                    placeholder="Select source outlet"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vehicle No
                  </Label>
                  <Input
                    type="text"
                    id="vehicle_no"
                    value={formData.vehicle_no}
                    onChange={handleChange}
                    placeholder="Enter vehicle number"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Driver Name
                  </Label>
                  <Input
                    type="text"
                    id="driver_name"
                    value={formData.driver_name}
                    onChange={handleChange}
                    placeholder="Enter driver name"
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
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
                      <div className="md:col-span-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Product
                        </p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Unit: {item.unit_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Approved
                        </p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.approved_qty.toFixed(3)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Already Despatched
                        </p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.despatched_qty.toFixed(3)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Despatch Qty <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={item.despatch_qty || ""}
                          onChange={(e) =>
                            handleQtyChange(
                              item.id,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={loading}
                          step="0.001"
                          min="0"
                          max={item.remaining_qty}
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Max: {item.remaining_qty.toFixed(3)}
                        </p>
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
                  onClick={() => navigate("/stock-despatches")}
                  className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
                  disabled={loading}
                >
                  <ArrowLeft size={18} />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors min-w-[140px] w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Truck size={18} />
                      Create Despatch
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
