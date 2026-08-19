import { useEffect, useState, useCallback } from "react";
import AddToCartProduct from "./AddToCartProduct";
import CategoryShow from "./CategoryShow";
import InvoiceDetails from "./InvoiceDetails";
import TableSelector from "./TableSelector";
import TableSelectionModal from "./TableSelectionModal";
import Alert from "../../components/ui/alert/Alert";
import axios from "axios";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Grid3x3,
} from "lucide-react";

interface CartItem {
  id: number;
  product_name: string;
  price: number;
  quantity: number;
  stock: number;
  category: number;
  vat: number;
  sd: number;
}

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
}

interface CreateSaleProps {
  preselectedTable?: Table | null;
}

export default function CreateSale({
  preselectedTable = null,
}: CreateSaleProps) {
  const [stockAlert, setStockAlert] = useState({
    show: false,
    message: "",
    type: "error" as "error" | "success" | "warning",
  });

  const [selectedTable, setSelectedTable] = useState<Table | null>(() => {
    if (preselectedTable) {
      return preselectedTable;
    }
    const stored = localStorage.getItem("selectedTable");
    return stored ? JSON.parse(stored) : null;
  });

  // ✅ Cart state - load based on selected table
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editedProducts, setEditedProducts] = useState<number[]>([]);
  const [currentSaleId, setCurrentSaleId] = useState<number | null>(() => {
    const stored = localStorage.getItem("currentSaleId");
    return stored ? JSON.parse(stored) : null;
  });

  const [saleStatus, setSaleStatus] = useState<string>(() => {
    const stored = localStorage.getItem("saleStatus");
    return stored || "active";
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // ✅ Load cart when selected table changes
  useEffect(() => {
    if (selectedTable) {
      loadCartForTable(selectedTable.id);
    } else {
      setCart([]);
      setEditedProducts([]);
    }
  }, [selectedTable]);

  // ✅ Save cart to localStorage when it changes
  useEffect(() => {
    if (selectedTable) {
      const key = `cartItems_${selectedTable.id}`;
      localStorage.setItem(key, JSON.stringify(cart));
    }
  }, [cart, selectedTable]);

  // ✅ Save edited products to localStorage when it changes
  useEffect(() => {
    if (selectedTable) {
      const key = `editedProducts_${selectedTable.id}`;
      localStorage.setItem(key, JSON.stringify(editedProducts));
    }
  }, [editedProducts, selectedTable]);

  // ✅ Save selected table to localStorage
  useEffect(() => {
    localStorage.setItem("selectedTable", JSON.stringify(selectedTable));
  }, [selectedTable]);

  useEffect(() => {
    localStorage.setItem("currentSaleId", JSON.stringify(currentSaleId));
  }, [currentSaleId]);

  useEffect(() => {
    localStorage.setItem("saleStatus", saleStatus);
  }, [saleStatus]);

  // ✅ Function to load cart for a specific table
  const loadCartForTable = (tableId: number) => {
    const cartKey = `cartItems_${tableId}`;
    const editedKey = `editedProducts_${tableId}`;

    const storedCart = localStorage.getItem(cartKey);
    const storedEdited = localStorage.getItem(editedKey);

    console.log(`Loading cart for table ${tableId}:`, storedCart);

    setCart(storedCart ? JSON.parse(storedCart) : []);
    setEditedProducts(storedEdited ? JSON.parse(storedEdited) : []);
  };

  const totalAmount = cart.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0,
  );

  const triggerAlert = (
    message: string,
    type: "error" | "success" | "warning" = "error",
  ) => {
    setStockAlert({ show: true, message, type });
    setTimeout(
      () => setStockAlert({ show: false, message: "", type: "error" }),
      4000,
    );
  };

  useEffect(() => {
    const validCart = cart.filter((item) => item.quantity <= item.stock);
    if (selectedTable) {
      const key = `cartItems_${selectedTable.id}`;
      localStorage.setItem(key, JSON.stringify(validCart));
    }
  }, [cart, selectedTable]);

  // Auto-save to database when cart changes
  useEffect(() => {
    if (
      cart.length > 0 &&
      selectedTable &&
      currentSaleId &&
      saleStatus !== "completed"
    ) {
      autoSaveSale();
    }
  }, [cart, selectedTable, currentSaleId]);

  const autoSaveSale = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await axios.put(
        `http://localhost:8000/api/sales/${currentSaleId}`,
        {
          table_id: selectedTable?.id,
          products: cart.map((item) => ({
            id: item.id,
            name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            stock: item.stock,
            vat: item.vat,
            sd: item.sd,
          })),
          total: totalAmount,
          status: saleStatus,
        },
      );
      setLastSaved(new Date());
      console.log("Auto-saved:", response.data);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [cart, currentSaleId, selectedTable, saleStatus, totalAmount, isSaving]);

  const handleTableSelect = async (table: Table) => {
    console.log("Selecting table:", table);
    setSelectedTable(table);
    setSaleStatus("active");

    // ✅ Load cart for this table
    loadCartForTable(table.id);

    // Check if there's an existing sale for this table
    try {
      const response = await axios.get(
        `http://localhost:8000/api/sales/table/${table.id}/active`,
      );
      if (response.data && response.data.data) {
        const existingSale = response.data.data;
        setCurrentSaleId(existingSale.id);
        setSaleStatus(existingSale.status || "active");
        triggerAlert(`Continuing with Table ${table.table_name}`, "success");
        return;
      }
    } catch (error) {
      console.log("No active sale found for this table, creating new one...");
    }

    // Create new sale record
    try {
      const response = await axios.post(
        "http://localhost:8000/api/sales/initialize",
        {
          table_id: table.id,
          status: "active",
        },
      );
      setCurrentSaleId(response.data.sale_id);
      localStorage.setItem(
        "currentSaleId",
        JSON.stringify(response.data.sale_id),
      );

      // Update table status to occupied if it was available
      if (table.status === "available") {
        await axios.put(`http://localhost:8000/api/tables/${table.id}/status`, {
          status: "occupied",
        });
      }

      triggerAlert(
        `Table ${table.table_name} selected successfully!`,
        "success",
      );
    } catch (error: any) {
      console.error("Failed to initialize sale:", error);
      triggerAlert(
        error.response?.data?.message ||
          "Failed to initialize sale for this table!",
        "error",
      );
    }
  };

  const handleViewTables = () => {
    setIsTableModalOpen(true);
  };

  const handleTableSelectFromModal = async (table: Table) => {
    await handleTableSelect(table);
    setIsTableModalOpen(false);
  };

  const handleAddToCart = (product: CartItem) => {
    if (!selectedTable) {
      triggerAlert("Please select a table first!", "warning");
      return;
    }

    if (saleStatus === "printed" || saleStatus === "completed") {
      triggerAlert(
        "This bill has been completed! Please start a new sale.",
        "warning",
      );
      return;
    }

    if (product.stock <= 0 || product.quantity > product.stock) {
      triggerAlert(`${product.product_name} is out of stock!`, "error");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity + product.quantity > product.stock) {
          triggerAlert(
            `${product.product_name} stock is insufficient!`,
            "error",
          );
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + product.quantity }
            : item,
        );
      } else {
        triggerAlert(`${product.product_name} added to cart!`, "success");
        return [...prev, product];
      }
    });
  };

  const handleQuantityChange = (id: number, value: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(value, 0) } : item,
      ),
    );
  };

  const handleDeleteProduct = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    setEditedProducts((prev) => prev.filter((pid) => pid !== id));
  };

  const handleEditProduct = (id: number, newName: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, product_name: newName } : item,
      ),
    );
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;

    if (window.confirm("Are you sure you want to clear the cart?")) {
      setCart([]);
      setEditedProducts([]);
      setSelectedTable(null);
      setCurrentSaleId(null);
      setSaleStatus("active");
      localStorage.removeItem("selectedTable");
      localStorage.removeItem("currentSaleId");
      localStorage.removeItem("saleStatus");
      // Remove table-specific cart data
      if (selectedTable) {
        localStorage.removeItem(`cartItems_${selectedTable.id}`);
        localStorage.removeItem(`editedProducts_${selectedTable.id}`);
      }
      triggerAlert("Cart cleared successfully!", "success");
    }
  };

  const handlePrintBill = async () => {
    setSaleStatus("printed");
    triggerAlert("Invoice printed successfully!", "success");
  };

  const getStatusIcon = () => {
    switch (saleStatus) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "printed":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "completed":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (saleStatus) {
      case "active":
        return "bg-green-100 text-green-700 border-green-300";
      case "printed":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 md:p-6">
      {/* Alert */}
      {stockAlert.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto sm:max-w-md md:max-w-lg animate-slideDown">
          <Alert
            title={
              stockAlert.type === "error"
                ? "Error"
                : stockAlert.type === "warning"
                  ? "Warning"
                  : "Success"
            }
            variant={stockAlert.type}
            message={stockAlert.message}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Sale</h1>
            <p className="text-sm text-gray-600 mt-1">
              {selectedTable
                ? `Table: ${selectedTable.table_name} (${selectedTable.table_number})`
                : "Select a table to start"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleViewTables}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Grid3x3 size={18} />
              Change Table
            </button>

            {lastSaved && (
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Auto-saved
              </div>
            )}
          </div>
        </div>

        {/* Table Selector */}
        {!selectedTable && (
          <div className="max-w-7xl mx-auto mb-4">
            <TableSelector
              onTableSelect={handleTableSelect}
              selectedTable={selectedTable}
            />
          </div>
        )}

        {/* Status Bar */}
        {selectedTable && (
          <div
            className={`max-w-7xl mx-auto mb-4 p-3 rounded-lg shadow-sm border ${getStatusColor()}`}
          >
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold flex items-center gap-2">
                  <span className="text-gray-600">Table:</span>
                  <span className="text-gray-900">
                    {selectedTable.table_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({selectedTable.table_number})
                  </span>
                </span>
                <span
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}
                >
                  {getStatusIcon()}
                  Status:{" "}
                  {saleStatus.charAt(0).toUpperCase() + saleStatus.slice(1)}
                </span>
                {currentSaleId && (
                  <span className="text-xs text-gray-500">
                    Sale ID: #{currentSaleId}
                  </span>
                )}
                {cart.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {cart.length} item{cart.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {saleStatus === "printed" && (
                <button
                  onClick={handleClearCart}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  New Sale
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Grid */}
        {selectedTable && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 md:p-4">
                <CategoryShow onAddToCart={handleAddToCart} />
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 md:p-4">
                <AddToCartProduct
                  cart={cart}
                  onUpdateQuantity={handleQuantityChange}
                  onDeleteProduct={handleDeleteProduct}
                  onEditProduct={handleEditProduct}
                  editedProducts={editedProducts}
                  totalAmount={totalAmount}
                  setEditedProducts={setEditedProducts}
                />
              </div>
            </div>

            <div className="lg:col-span-3 order-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 md:p-4 sticky lg:top-4">
                <InvoiceDetails
                  cart={cart}
                  setCart={setCart}
                  onClearCart={handleClearCart}
                  selectedTable={selectedTable}
                  saleStatus={saleStatus}
                  setSaleStatus={setSaleStatus}
                  onPrintBill={handlePrintBill}
                  currentSaleId={currentSaleId}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Selection Modal */}
      {isTableModalOpen && (
        <TableSelectionModal
          isOpen={isTableModalOpen}
          onClose={() => setIsTableModalOpen(false)}
          onSelectTable={handleTableSelectFromModal}
          selectedTableId={selectedTable?.id}
        />
      )}
    </div>
  );
}
