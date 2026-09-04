// src/pages/StockTransfer/StockRequestForm.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
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
  Plus,
  X,
  AlertCircle,
  Search,
  ShoppingCart,
  Trash2,
  Edit2,
  CheckCircle
} from "lucide-react";
import StockTransferService from "../../services/StockTransferService";
import ProductService from "../../services/ProductService";
import OutletService from "../../services/OutletService";
import { REQUEST_TYPE } from "../../type/stock-transfer";

type OptionType = { value: string; label: string };

interface ProductSearchResult {
  id: number;
  product_code: string;
  product_name: string;
  unit_id: number;
  unit_name: string;
  pur_price: number;
  sale_price: number;
  stock?: number;
}

interface RequestItem {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  unit_id: number;
  unit_name: string;
  requested_qty: number;
  pur_price: number;
  remarks: string;
}

export default function StockRequestForm() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const dataLoaded = useRef(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    request_date: new Date().toISOString().split("T")[0],
    requesting_outlet_id: 0,
    source_outlet_id: 1,
    request_type: REQUEST_TYPE.HO_REQUEST,
    remarks: "",
  });

  // Product Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Request Items
  const [items, setItems] = useState<RequestItem[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [itemRemarks, setItemRemarks] = useState<string>("");

  // Other States
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
    if (!dataLoaded.current) {
      dataLoaded.current = true;
      fetchData();
    }
  }, []);

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      // Fetch outlets
      try {
        const outletResponse = await OutletService.getAll();
        let outletArray: any[] = [];
        if (outletResponse && typeof outletResponse === 'object') {
          if (Array.isArray(outletResponse)) {
            outletArray = outletResponse;
          } else if (outletResponse.data && Array.isArray(outletResponse.data)) {
            outletArray = outletResponse.data;
          } else if (outletResponse.data?.data && Array.isArray(outletResponse.data.data)) {
            outletArray = outletResponse.data.data;
          }
        }
        setOutlets(
          outletArray.map((o: any) => ({
            value: o.id.toString(),
            label: o.outlet_name || o.name || `Outlet ${o.id}`,
          }))
        );
      } catch (error) {
        console.error("Error fetching outlets:", error);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
    } finally {
      setFetching(false);
    }
  }, []);

  // ✅ Product Search Function
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      // Assuming you have a search endpoint
      const response = await ProductService.search(query);
      console.log('Search results:', response);

      let products: ProductSearchResult[] = [];
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

  // ✅ Handle Search Input Change with Debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchProducts(value);
    }, 500);
  }, [searchProducts]);

  // ✅ Select Product from Search
  const handleSelectProduct = useCallback((product: ProductSearchResult) => {
    setSelectedProduct(product);
    setSearchTerm(product.product_name);
    setShowSearchDropdown(false);
    setQuantity(1);
    setItemRemarks("");

    // Focus on quantity input
    setTimeout(() => {
      const qtyInput = document.getElementById('quantity-input');
      if (qtyInput) qtyInput.focus();
    }, 100);
  }, []);

  // ✅ Add Item to List
  const addItemToList = useCallback(() => {
    if (!selectedProduct) {
      Swal.fire({
        icon: "warning",
        title: "No Product Selected",
        text: "Please search and select a product first.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (quantity <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Quantity",
        text: "Quantity must be greater than 0.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    // Check if product already exists in list
    const existingItem = items.find(item => item.product_id === selectedProduct.id);
    if (existingItem) {
      Swal.fire({
        icon: "warning",
        title: "Product Already Added",
        text: `"${selectedProduct.product_name}" is already in the list. You can update the quantity directly.`,
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const newItem: RequestItem = {
      id: Date.now() + Math.random(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.product_name,
      product_code: selectedProduct.product_code || '',
      unit_id: selectedProduct.unit_id,
      unit_name: selectedProduct.unit_name || 'Pcs',
      requested_qty: quantity,
      pur_price: selectedProduct.pur_price || 0,
      remarks: itemRemarks,
    };

    setItems(prev => [...prev, newItem]);

    // Reset form
    setSelectedProduct(null);
    setSearchTerm("");
    setQuantity(1);
    setItemRemarks("");
    setSearchResults([]);
    setShowSearchDropdown(false);

    // Focus on search input
    setTimeout(() => {
      const searchInput = document.getElementById('product-search');
      if (searchInput) searchInput.focus();
    }, 100);
  }, [selectedProduct, quantity, itemRemarks, items]);

  // ✅ Handle Enter Key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedProduct) {
        addItemToList();
      } else if (searchResults.length > 0) {
        handleSelectProduct(searchResults[0]);
      }
    }
  }, [selectedProduct, searchResults, addItemToList, handleSelectProduct]);

  // ✅ Remove Item from List
  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // ✅ Update Item Quantity
  const updateItemQuantity = useCallback((id: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, requested_qty: newQty } : item
      )
    );
  }, [removeItem]);

  // ✅ Update Item Remarks
  const updateItemRemarks = useCallback((id: number, remarks: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, remarks } : item
      )
    );
  }, []);

  // ✅ Clear All Items
  const clearAllItems = useCallback(() => {
    if (items.length === 0) return;
    Swal.fire({
      title: "Clear All Items?",
      text: "This will remove all items from the list.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, clear all",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setItems([]);
      }
    });
  }, [items]);

  const handleSelectChange = useCallback(
    (field: string, value: OptionType | null) => {
      if (value) {
        setFormData((prev) => ({ ...prev, [field]: parseInt(value.value) }));
      }
    },
    [],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.requesting_outlet_id) {
      newErrors.requesting_outlet_id = "Please select requesting outlet";
    }

    if (items.length === 0) {
      newErrors.items = "Please add at least one item";
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

        console.log('Submitting payload:', payload);

        await StockTransferService.createRequest(payload);

        Swal.fire({
          icon: "success",
          title: "Request Created!",
          text: `Stock request with ${items.length} item(s) created successfully`,
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
    [formData, items, navigate],
  );

  // Calculate total items and quantities
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.requested_qty, 0);

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
        <div className="w-full max-w-6xl">
          <ComponentCard title="Create Stock Request">
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN - Form & Product Search */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Request Information
                    </h3>

                    <div className="space-y-4">
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
                        <select
                          value={formData.request_type}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              request_type: parseInt(e.target.value)
                            }));
                          }}
                          className="w-full mt-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          disabled={loading}
                        >
                          <option value={1}>HO Request</option>
                          <option value={2}>Outlet Transfer</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Requesting Outlet <span className="text-red-500">*</span>
                        </Label>
                        <select
                          value={formData.requesting_outlet_id}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              requesting_outlet_id: parseInt(e.target.value)
                            }));
                          }}
                          className={`w-full mt-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                            errors.requesting_outlet_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                          }`}
                          disabled={loading}
                        >
                          <option value={0}>Select outlet...</option>
                          {outlets.map((outlet) => (
                            <option key={outlet.value} value={outlet.value}>
                              {outlet.label}
                            </option>
                          ))}
                        </select>
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
                          <select
                            value={formData.source_outlet_id}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                source_outlet_id: parseInt(e.target.value)
                              }));
                            }}
                            className="w-full mt-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            disabled={loading}
                          >
                            <option value={0}>Select outlet...</option>
                            {outlets.map((outlet) => (
                              <option key={outlet.value} value={outlet.value}>
                                {outlet.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Search */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      <Search className="inline mr-2" size={20} />
                      Search Product
                    </h3>

                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            id="product-search"
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Type product name or code..."
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            disabled={loading}
                            autoComplete="off"
                          />
                          {searchLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Loader2 size={18} className="animate-spin text-blue-500" />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={addItemToList}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 whitespace-nowrap"
                          disabled={!selectedProduct || loading}
                        >
                          <Plus size={18} />
                          Add
                        </Button>
                      </div>

                      {/* Search Results Dropdown */}
                      {showSearchDropdown && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((product) => (
                            <div
                              key={product.id}
                              onClick={() => handleSelectProduct(product)}
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {product.product_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Code: {product.product_code} | Unit: {product.unit_name}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  Price: {product.pur_price || 0}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Product Info */}
                    {selectedProduct && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedProduct.product_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Code: {selectedProduct.product_code} | Unit: {selectedProduct.unit_name}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(null);
                              setSearchTerm("");
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quantity & Remarks */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Quantity <span className="text-red-500">*</span>
                        </Label>
                        <input
                          id="quantity-input"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                          min="0.001"
                          step="0.001"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          disabled={!selectedProduct || loading}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Remarks
                        </Label>
                        <input
                          type="text"
                          value={itemRemarks}
                          onChange={(e) => setItemRemarks(e.target.value)}
                          placeholder="Optional"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          disabled={!selectedProduct || loading}
                        />
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        onClick={addItemToList}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                        disabled={!selectedProduct || loading}
                      >
                        <Plus size={18} />
                        Add to List
                      </Button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Items List */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        <ShoppingCart className="inline mr-2" size={20} />
                        Request Items
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Items: <strong>{totalItems}</strong></span>
                        <span>|</span>
                        <span>Qty: <strong>{totalQuantity.toFixed(3)}</strong></span>
                      </div>
                    </div>

                    {errors.items && (
                      <p className="mb-3 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.items}
                      </p>
                    )}

                    {/* Items List */}
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <ShoppingCart className="mx-auto mb-2" size={48} strokeWidth={1} />
                        <p>No items added yet</p>
                        <p className="text-sm">Search and add products from the left panel</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {item.product_name}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>Code: {item.product_code}</span>
                                  <span>Unit: {item.unit_name}</span>
                                  <span>Price: {item.pur_price}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={item.requested_qty}
                                  onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                                  min="0.001"
                                  step="0.001"
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {item.remarks && (
                              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                Remark: {item.remarks}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                        <Button
                          type="button"
                          onClick={clearAllItems}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                          Clear All
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => navigate("/stock-requests")}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            disabled={loading}
                          >
                            <ArrowLeft size={16} />
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                            disabled={loading || items.length === 0}
                          >
                            {loading ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={18} />
                                Submit Request
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overall Remarks */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
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
                </div>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
