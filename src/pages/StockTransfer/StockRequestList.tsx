// src/pages/StockTransfer/StockRequestForm.tsx
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import { Loader2, Save, ArrowLeft, Plus, X, AlertCircle } from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import ProductService from "../../services/ProductService";
import OutletService from "../../services/OutletService";
import { REQUEST_TYPE } from "../../type/stock-transfer";

type OptionType = { value: string; label: string };

interface RequestItem {
  id: number;
  product_id: number;
  unit_id: number;
  requested_qty: number;
  remarks: string;
}

export default function StockRequestForm() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    request_date: new Date().toISOString().split("T")[0],
    requesting_outlet_id: 0,
    source_outlet_id: 1,
    request_type: REQUEST_TYPE.HO_REQUEST,
    remarks: "",
  });

  const [items, setItems] = useState<RequestItem[]>([
    {
      id: Date.now(),
      product_id: 0,
      unit_id: 0,
      requested_qty: 0,
      remarks: "",
    },
  ]);

  const [outlets, setOutlets] = useState<OptionType[]>([]);
  const [products, setProducts] = useState<OptionType[]>([]);
  const [units, setUnits] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      // Fetch outlets
      const outletService = new OutletService();
      const outletsData = await outletService.getAll();
      setOutlets(
        outletsData.map((o: any) => ({
          value: o.id.toString(),
          label: o.outlet_name,
        })),
      );

      // Fetch products
      const productsData = await ProductService.getAll();
      setProducts(
        productsData.map((p: any) => ({
          value: p.id.toString(),
          label: `${p.product_code} - ${p.product_name}`,
        })),
      );

      // Fetch units
      const unitsData = await ProductService.getCreateData();
      const unitsList = unitsData?.units || [];
      setUnits(
        unitsList.map((u: any) => ({
          value: u.id.toString(),
          label: u.unit_name,
        })),
      );
    } catch (error: any) {
      console.error("Error fetching data:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load data",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setFetching(false);
    }
  }, []);

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

  const handleItemChange = useCallback(
    (id: number, field: keyof RequestItem, value: any) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      );
    },
    [],
  );

  const handleItemSelectChange = useCallback(
    (id: number, field: keyof RequestItem, value: OptionType | null) => {
      if (value) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, [field]: parseInt(value.value) } : item,
          ),
        );
      }
    },
    [],
  );

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        product_id: 0,
        unit_id: 0,
        requested_qty: 0,
        remarks: "",
      },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) {
      Swal.fire({
        icon: "warning",
        title: "Cannot Remove",
        text: "You need at least one item",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.requesting_outlet_id) {
      newErrors.requesting_outlet_id = "Please select requesting outlet";
    }

    // Validate items
    let hasError = false;
    items.forEach((item, index) => {
      if (!item.product_id) {
        newErrors[`item_${index}_product`] = "Product is required";
        hasError = true;
      }
      if (!item.unit_id) {
        newErrors[`item_${index}_unit`] = "Unit is required";
        hasError = true;
      }
      if (item.requested_qty <= 0) {
        newErrors[`item_${index}_qty`] = "Quantity must be greater than 0";
        hasError = true;
      }
    });

    if (hasError) {
      newErrors.items = "Please fix all item errors";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      try {
        const payload = {
          request_date: formData.request_date,
          requesting_outlet_id: formData.requesting_outlet_id,
          source_outlet_id: formData.source_outlet_id,
          request_type: formData.request_type,
          items: items.map((item) => ({
            product_id: item.product_id,
            unit_id: item.unit_id,
            requested_qty: item.requested_qty,
            remarks: item.remarks,
          })),
          remarks: formData.remarks,
        };

        await StockTransferService.createRequest(payload);

        Swal.fire({
          icon: "success",
          title: "Request Created!",
          text: "Stock request created successfully",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });

        navigate("/stock-requests");
      } catch (error: any) {
        console.error("Error creating request:", error);
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: error.message || "Failed to create request",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setLoading(false);
      }
    },
    [formData, items],
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta
        title="New Stock Request | A&T"
        description="Create Stock Request"
      />
      <PageBreadcrumb pageTitle="New Stock Request" />

      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <ComponentCard title="Create Stock Request">
            <form onSubmit={handleSubmit} noValidate>
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Request Date
                  </Label>
                  <Input
                    type="date"
                    id="request_date"
                    value={formData.request_date}
                    onChange={handleChange}
                    className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Request Type
                  </Label>
                  <Select
                    options={[
                      { value: "1", label: "HO Request" },
                      { value: "2", label: "Outlet Transfer" },
                    ]}
                    value={{
                      value: formData.request_type.toString(),
                      label:
                        formData.request_type === 1
                          ? "HO Request"
                          : "Outlet Transfer",
                    }}
                    onChange={(val) => handleSelectChange("request_type", val)}
                    className="w-full mt-1"
                    isDisabled={loading}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Requesting Outlet <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={outlets}
                    value={
                      outlets.find(
                        (o) =>
                          parseInt(o.value) === formData.requesting_outlet_id,
                      ) || null
                    }
                    onChange={(val) =>
                      handleSelectChange("requesting_outlet_id", val)
                    }
                    className="w-full mt-1"
                    isDisabled={loading}
                    placeholder="Select outlet"
                  />
                  {errors.requesting_outlet_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.requesting_outlet_id}
                    </p>
                  )}
                </div>

                {formData.request_type === 2 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Source Outlet
                    </Label>
                    <Select
                      options={outlets}
                      value={
                        outlets.find(
                          (o) =>
                            parseInt(o.value) === formData.source_outlet_id,
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
                )}
              </div>

              {/* Items Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Items <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
                    disabled={loading}
                  >
                    <Plus size={16} />
                    Add Item
                  </Button>
                </div>

                {errors.items && (
                  <p className="mb-3 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.items}
                  </p>
                )}

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Product <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          options={products}
                          value={
                            products.find(
                              (p) => parseInt(p.value) === item.product_id,
                            ) || null
                          }
                          onChange={(val) =>
                            handleItemSelectChange(item.id, "product_id", val)
                          }
                          className="w-full mt-1"
                          isDisabled={loading}
                          placeholder="Select product"
                        />
                        {errors[`item_${index}_product`] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors[`item_${index}_product`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Unit <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          options={units}
                          value={
                            units.find(
                              (u) => parseInt(u.value) === item.unit_id,
                            ) || null
                          }
                          onChange={(val) =>
                            handleItemSelectChange(item.id, "unit_id", val)
                          }
                          className="w-full mt-1"
                          isDisabled={loading}
                          placeholder="Select unit"
                        />
                        {errors[`item_${index}_unit`] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors[`item_${index}_unit`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={item.requested_qty || ""}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "requested_qty",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={loading}
                          min="0"
                          step="0.001"
                        />
                        {errors[`item_${index}_qty`] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors[`item_${index}_qty`]}
                          </p>
                        )}
                      </div>

                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Remarks
                          </Label>
                          <Input
                            type="text"
                            value={item.remarks}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "remarks",
                                e.target.value,
                              )
                            }
                            placeholder="Optional"
                            className="w-full mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            disabled={loading}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                          disabled={loading}
                        >
                          <X size={16} />
                        </Button>
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
                  onClick={() => navigate("/stock-requests")}
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
                      <Save size={18} />
                      Create Request
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
