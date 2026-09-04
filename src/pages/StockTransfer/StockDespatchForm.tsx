// src/pages/StockTransfer/StockDespatchForm.tsx
import { useState, useCallback, useEffect, useRef } from "react";
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
  ArrowLeft,
  AlertCircle,
  Truck,
  CheckCircle,
  Search,
  Package,
  RefreshCw,
  Eye,
  Trash2,
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import OutletService from "../../services/OutletService";
import ProductService from "../../services/ProductService";
import { OutletRequest } from "../../type/stock-transfer";
import { Outlet } from "../../type/outlet";

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
  current_stock: number;
  remarks: string;
  outlet_name?: string;
  invoice_no?: string;
  category_name?: string;
  date?: string;
}

export default function StockDespatchForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const requestId = searchParams.get("request_id");

  // ✅ Form State
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
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Request List States
  const [requestList, setRequestList] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    requestId ? parseInt(requestId) : null
  );
  const [requestsLoading, setRequestsLoading] = useState(false);
  // const [searchRequest, setSearchRequest] = useState("");

  // ✅ Selected Outlet for filtering
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");

  // ✅ Product Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [despatchQuantity, setDespatchQuantity] = useState<number>(0);
  const [despatchRemarks, setDespatchRemarks] = useState<string>("");

  // ✅ Data loaded flag
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  // ✅ Outlets loading flag
  const [outletsLoading, setOutletsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchOutlets();
  }, []);

  // ✅ Fetch Outlets (Fixed)
  const fetchOutlets = useCallback(async () => {
    setOutletsLoading(true);
    try {
      const response = await OutletService.getAll();
      console.log('Outlet response:', response);

      // ✅ Extract outlets from response
      let outletArray: any[] = [];

      if (response && typeof response === 'object') {
        // If response has data property with array
        if (response.data && Array.isArray(response.data)) {
          outletArray = response.data;
        }
        // If response itself is array
        else if (Array.isArray(response)) {
          outletArray = response;
        }
        // If response has data.data (nested)
        else if (response.data?.data && Array.isArray(response.data.data)) {
          outletArray = response.data.data;
        }
      }

      console.log('Outlet array:', outletArray);

      setOutlets(
        outletArray.map((o: any) => ({
          value: o.id.toString(),
          label: o.outlet_name || `Outlet ${o.id}`,
        }))
      );
    } catch (error) {
      console.error("Error fetching outlets:", error);
      setOutlets([]);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to load outlets. Please try again.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setOutletsLoading(false);
    }
  }, []);

  // ✅ Fetch Request Numbers by Outlet
  // ✅ Fetch Request Numbers by Outlet (accept optional override)
  const fetchRequestsByOutlet = useCallback(async (outletIdOverride?: string) => {
    const outletIdToUse = outletIdOverride ?? selectedOutlet;
    const parsedOutletId = parseInt(outletIdToUse);

    if (!outletIdToUse || isNaN(parsedOutletId)) {
      Swal.fire({
        icon: "warning",
        title: "Please Select Outlet",
        text: "Please select a valid outlet first.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setRequestsLoading(true);
    setIsDataLoaded(false);
    setRequestList([]);
    setSelectedRequestId(null);
    setRequest(null);
    setItems([]);

    try {
      const params: any = {
        outlet_id: parsedOutletId,
        pending_only: true,
      };

      console.log('📤 Fetching requests with params:', params);

      const response = await StockTransferService.getRequests(params);
      console.log('📥 Requests Response:', response);

      let requestData = response;
      if (response?.data) {
        requestData = response.data;
      }

      let requests: any[] = [];
      if (requestData?.data && Array.isArray(requestData.data)) {
        requests = requestData.data;
      } else if (Array.isArray(requestData)) {
        requests = requestData;
      }

      const formattedRequests = requests.map((req: any) => {
        const totalApproved = req.details?.reduce((sum: number, d: any) => sum + (Number(d.approved_qty) || 0), 0) || 0;
        const totalDespatched = req.details?.reduce((sum: number, d: any) => sum + (Number(d.despatched_qty) || 0), 0) || 0;
        const totalRemaining = totalApproved - totalDespatched;

        const categories = req.details
          ?.filter((d: any) => d.approved_qty > d.despatched_qty)
          ?.map((d: any) => d.product?.category?.category_name || 'General') || [];
        const uniqueCategories = [...new Set(categories)];

        return {
          id: req.id,
          request_no: req.request_no || `REQ-${req.id}`,
          request_date: req.request_date,
          requesting_outlet_id: req.requesting_outlet_id,
          requesting_outlet: req.requesting_outlet || req.requestingOutlet,
          status: req.status,
          details: req.details || [],
          total_approved: totalApproved,
          total_despatched: totalDespatched,
          total_remaining: totalRemaining,
          categories: uniqueCategories.join(', '),
          outlet_name: req.requesting_outlet?.outlet_name ||
                       req.requestingOutlet?.outlet_name ||
                       'Unknown',
        };
      });

      setRequestList(formattedRequests);
      setIsDataLoaded(true);

      if (formattedRequests.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Requests Found",
          text: "No pending requests found for this outlet.",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (error: any) {
      console.error("❌ Error fetching requests:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load requests",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setRequestsLoading(false);
    }
  }, [selectedOutlet]); // ✅ searchRequest dependency remove

  // ✅ Load Request Details
  const loadRequest = useCallback(async (reqId: number) => {
    setSelectedRequestId(reqId);
    setFetching(true);
    try {
      const response = await StockTransferService.getRequest(reqId);
      console.log('📥 Request Details:', response);

      let requestData = response;
      if (response?.data) {
        requestData = response.data;
      }

      console.log('✅ Request Data:', requestData);

      setRequest(requestData);

      setFormData(prev => ({
        ...prev,
        request_id: reqId,
        source_outlet_id: requestData.requesting_outlet_id || prev.source_outlet_id,
      }));

      if (requestData.details && Array.isArray(requestData.details)) {
        const despatchItems = requestData.details
          .filter((d: any) => {
            const remaining = Number(d.approved_qty) - Number(d.despatched_qty || 0);
            return remaining > 0;
          })
          .map((d: any, index: number) => {
            const remainingQty = Number(d.approved_qty) - Number(d.despatched_qty || 0);
            return {
              id: Date.now() + index + Math.random(),
              request_detail_id: d.id,
              product_id: d.product_id,
              product_name: d.product?.product_name || "Unknown",
              unit_id: d.unit_id,
              unit_name: d.unit?.unit_name || "Unknown",
              approved_qty: Number(d.approved_qty),
              despatched_qty: Number(d.despatched_qty || 0),
              remaining_qty: remainingQty,
              despatch_qty: remainingQty,
              purchase_price: d.product?.pur_price || 0,
              current_stock: 0,
              remarks: "",
              outlet_name: requestData.requesting_outlet?.outlet_name || "Unknown",
              invoice_no: requestData.request_no || `REQ-${reqId}`,
              category_name: d.product?.category?.category_name || "General",
              date: requestData.request_date,
            };
          });
        setItems(despatchItems);
        console.log('✅ Despatch Items:', despatchItems);
      }
    } catch (error: any) {
      console.error("❌ Error loading request:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load request details",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setFetching(false);
    }
  }, []);

  // ✅ Search Products
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await ProductService.search(query);
      let products: any[] = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          products = response;
        } else if (response.data && Array.isArray(response.data)) {
          products = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          products = response.data.data;
        }
      }
      setSearchResults(products);
      setShowSearchDropdown(products.length > 0);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchProducts(value), 500);
  }, [searchProducts]);

  const handleSelectProduct = useCallback((product: any) => {
    setSelectedProduct(product);
    setSearchTerm(product.product_name);
    setShowSearchDropdown(false);
    setDespatchQuantity(0);
    setDespatchRemarks("");
  }, []);

  const addDespatchItem = useCallback(() => {
    if (!selectedProduct) {
      Swal.fire({
        icon: "warning",
        title: "No Product Selected",
        text: "Please search and select a product first.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (despatchQuantity <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Quantity",
        text: "Despatch quantity must be greater than 0.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const existingItem = items.find(item => item.product_id === selectedProduct.id);
    if (existingItem) {
      Swal.fire({
        icon: "warning",
        title: "Product Already Added",
        text: `"${selectedProduct.product_name}" is already in the despatch list.`,
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const newItem: DespatchItem = {
      id: Date.now() + Math.random(),
      request_detail_id: 0,
      product_id: selectedProduct.id,
      product_name: selectedProduct.product_name,
      unit_id: selectedProduct.unit_id,
      unit_name: selectedProduct.unit_name || 'Pcs',
      approved_qty: 0,
      despatched_qty: 0,
      remaining_qty: 0,
      despatch_qty: despatchQuantity,
      purchase_price: selectedProduct.pur_price || 0,
      current_stock: selectedProduct.stock || 0,
      remarks: despatchRemarks,
      outlet_name: request?.requesting_outlet?.outlet_name || "Unknown",
      invoice_no: request?.request_no || "N/A",
      category_name: selectedProduct.category_name || "General",
      date: new Date().toISOString().split("T")[0],
    };

    setItems(prev => [...prev, newItem]);
    setSelectedProduct(null);
    setSearchTerm("");
    setDespatchQuantity(0);
    setDespatchRemarks("");
    setSearchResults([]);
    setShowSearchDropdown(false);
  }, [selectedProduct, despatchQuantity, despatchRemarks, items, request]);

  const handleQtyChange = (id: number, value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const maxQty = item.remaining_qty + item.despatch_qty;
          return {
            ...item,
            despatch_qty: Math.min(Math.max(0, value), maxQty),
          };
        }
        return item;
      }),
    );
  };

  const removeDespatchItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.request_id) {
      newErrors.request_id = "Please select a request";
    }
    if (!formData.source_outlet_id) {
      newErrors.source_outlet_id = "Source outlet is required";
    }
    let hasValidItems = false;
    items.forEach((item) => {
      if (item.despatch_qty > 0) hasValidItems = true;
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

  // ✅ Handle Outlet Selection
  // src/pages/StockTransfer/StockDespatchForm.tsx

  // ✅ Handle Outlet Selection - Auto fetch requests
  const handleOutletChange = useCallback((value: OptionType | null) => {
    if (value) {
      const outletId = value.value;
      setSelectedOutlet(outletId);
      setFormData(prev => ({ ...prev, source_outlet_id: parseInt(outletId) }));

      setRequestList([]);
      setSelectedRequestId(null);
      setRequest(null);
      setItems([]);
      setIsDataLoaded(false);

      fetchRequestsByOutlet(outletId); // ✅ direct value pass
    } else {
      setSelectedOutlet("");
      setFormData(prev => ({ ...prev, source_outlet_id: 0 }));
      setRequestList([]);
      setSelectedRequestId(null);
      setRequest(null);
      setItems([]);
      setIsDataLoaded(false);
    }
  }, [fetchRequestsByOutlet]);

  // ✅ Handle Request Selection
  const handleRequestSelect = useCallback((value: OptionType | null) => {
    if (value) {
      const reqId = parseInt(value.value);
      setSelectedRequestId(reqId);
      loadRequest(reqId);
    } else {
      setSelectedRequestId(null);
      setRequest(null);
      setItems([]);
    }
  }, [loadRequest]);

  const totalDespatchQty = items.reduce((sum, item) => sum + item.despatch_qty, 0);

  // ✅ Show loading while outlets are loading
  if (outletsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading outlets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta title="Production Dispatch | A&T" description="Create Stock Despatch" />
      <PageBreadcrumb pageTitle="Production Dispatch" />

      <div className="flex justify-center">
        <div className="w-full max-w-7xl">
          <ComponentCard title="Production Dispatch">
            <form onSubmit={handleSubmit} noValidate>
              {/* Filter Section */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</Label>
                    <Input
                      type="date"
                      value={formData.despatch_date}
                      onChange={handleChange}
                      id="despatch_date"
                      className="w-full mt-1"
                      disabled={loading}
                    />
                  </div>

                  {/* Outlet */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Outlet <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      options={outlets}
                      value={
                        outlets.find(
                          (o) => o.value === selectedOutlet,
                        ) || null
                      }
                      onChange={handleOutletChange}
                      className="w-full mt-1"
                      isDisabled={loading || outlets.length === 0}
                      placeholder={outlets.length === 0 ? "No outlets found" : "Select outlet"}
                    />
                    {outlets.length === 0 && !outletsLoading && (
                      <p className="mt-1 text-xs text-yellow-500">
                        No outlets available. Please contact administrator.
                      </p>
                    )}
                  </div>

                  {/* Request No */}
                  {/* Request No */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Request No.</Label>
                    <div className="flex gap-2 mt-1">
                      <Select
                        options={requestList.map((req) => ({
                          value: req.id.toString(),
                          label: req.request_no || `REQ-${req.id}`,
                        }))}
                        value={
                          selectedRequestId ? {
                            value: selectedRequestId.toString(),
                            label: requestList.find((req) => req.id === selectedRequestId)?.request_no || `REQ-${selectedRequestId}`,
                          } : null
                        }
                        onChange={handleRequestSelect}
                        className="flex-1"
                        isDisabled={requestsLoading || requestList.length === 0 || !isDataLoaded}
                        placeholder={!selectedOutlet ? "Select outlet first" : requestList.length === 0 ? "No requests" : "Select Request"}
                      />
                      <button
                        type="button"
                        onClick={() => fetchRequestsByOutlet(selectedOutlet)}
                        disabled={!selectedOutlet || requestsLoading}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {requestsLoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Search size={18} />
                        )}
                        Search
                      </button>
                    </div>
                  </div>
                </div>




                {/* Request List */}
                {isDataLoaded && requestList.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {requestList.map((req) => (
                        <div
                          key={req.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedRequestId === req.id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                          onClick={() => {
                            setSelectedRequestId(req.id);
                            loadRequest(req.id);
                          }}
                        >
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex-1 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {req.request_no || `REQ-${req.id}`}
                                </p>
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                  {req.status === 1 ? "Approved" : "Partial"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span>Date: {new Date(req.request_date).toLocaleDateString()}</span>
                                <span>Items: {req.details?.length || 0}</span>
                                <span>Categories: {req.categories || 'General'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">
                                <span className="text-blue-600 dark:text-blue-400">Approved: {req.total_approved?.toFixed(3) || '0.000'}</span>
                                <br />
                                <span className="text-purple-600 dark:text-purple-400">Remaining: {req.total_remaining?.toFixed(3) || '0.000'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequestId(req.id);
                                  loadRequest(req.id);
                                }}
                                className="mt-1 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs"
                              >
                                <Eye size={14} />
                                Select
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Requests Message */}
                {isDataLoaded && requestList.length === 0 && !requestsLoading && (
                  <div className="mt-4 text-center py-4 text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <Package className="mx-auto mb-2" size={32} strokeWidth={1} />
                    <p>No pending requests found for this outlet</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700/50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Sl
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Invoice
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Category
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Unit
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Req.Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Prev. Receive
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Pen. Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Des. Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Cur. Stock
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Outlet
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          <Package className="mx-auto mb-2" size={48} strokeWidth={1} />
                          <p>No items added for despatch</p>
                          <p className="text-sm">Select a request from above to load items</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {item.invoice_no || "-"}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {item.category_name || "General"}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700">
                            {item.product_name}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {item.unit_name}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {item.approved_qty.toFixed(3)}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {item.despatched_qty.toFixed(3)}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-yellow-600 dark:text-yellow-400 font-medium border border-gray-200 dark:border-gray-700">
                            {item.remaining_qty.toFixed(3)}
                          </td>
                          <td className="px-3 py-2 border border-gray-200 dark:border-gray-700">
                            <input
                              type="number"
                              value={item.despatch_qty || ""}
                              onChange={(e) =>
                                handleQtyChange(
                                  item.id,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-right"
                              step="0.001"
                              min="0"
                              max={item.remaining_qty + item.despatch_qty}
                              disabled={loading}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {item.current_stock.toFixed(3)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {item.outlet_name || "Unknown"}
                          </td>
                          <td className="px-3 py-2 text-center border border-gray-200 dark:border-gray-700">
                            <button
                              type="button"
                              onClick={() => removeDespatchItem(item.id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              disabled={loading}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Dispatch Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-lg font-medium min-w-[200px]"
                  disabled={loading || items.length === 0 || !formData.request_id}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Dispatch
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
