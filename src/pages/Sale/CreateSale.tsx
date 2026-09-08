import { useEffect, useState, useCallback, useMemo } from "react";
import AddToCartProduct from "./AddToCartProduct";
import CategoryShow from "./CategoryShow";
import InvoiceDetails from "./InvoiceDetails";
import TableSelector from "./TableSelector";
import TableSelectionModal from "./TableSelectionModal";
import Alert from "../../components/ui/alert/Alert";
import api from "../../services/api";
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
  const [stockAlert, setStockAlert] = useState<{
    show: boolean;
    message: string;
    type: "error" | "success" | "warning";
  }>({
    show: false,
    message: "",
    type: "error",
  });

  const [selectedTable, setSelectedTable] = useState<Table | null>(() => {
    if (preselectedTable) {
      return preselectedTable;
    }
    const stored = localStorage.getItem("selectedTable");
    return stored ? JSON.parse(stored) : null;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [editedProducts, setEditedProducts] = useState<number[]>([]);
  const [printedItems, setPrintedItems] = useState<number[]>(() => {
    const stored = localStorage.getItem("printedItems");
    return stored ? JSON.parse(stored) : [];
  });
  const [currentSaleId, setCurrentSaleId] = useState<number | null>(() => {
    const stored = localStorage.getItem("currentSaleId");
    return stored ? JSON.parse(stored) : null;
  });

  const [saleStatus, setSaleStatus] = useState<string>(() => {
    const stored = localStorage.getItem("saleStatus");
    return stored || "active";
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);

  const totalAmount = useMemo(
    () =>
      cart.reduce((sum, product) => sum + product.price * product.quantity, 0),
    [cart],
  );

  useEffect(() => {
    if (selectedTable) {
      loadCartForTable(selectedTable.id);
    } else {
      setCart([]);
      setEditedProducts([]);
      setPrintedItems([]);
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      localStorage.setItem(
        `cartItems_${selectedTable.id}`,
        JSON.stringify(cart),
      );
    }
  }, [cart, selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      localStorage.setItem(
        `editedProducts_${selectedTable.id}`,
        JSON.stringify(editedProducts),
      );
    }
  }, [editedProducts, selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      localStorage.setItem(
        `printedItems_${selectedTable.id}`,
        JSON.stringify(printedItems),
      );
    }
  }, [printedItems, selectedTable]);

  useEffect(() => {
    localStorage.setItem("selectedTable", JSON.stringify(selectedTable));
  }, [selectedTable]);

  useEffect(() => {
    localStorage.setItem("currentSaleId", JSON.stringify(currentSaleId));
  }, [currentSaleId]);

  useEffect(() => {
    localStorage.setItem("saleStatus", saleStatus);
  }, [saleStatus]);

  const loadCartForTable = useCallback((tableId: number) => {
    const storedCart = localStorage.getItem(`cartItems_${tableId}`);
    const storedEdited = localStorage.getItem(`editedProducts_${tableId}`);
    const storedPrinted = localStorage.getItem(`printedItems_${tableId}`);

    setCart(storedCart ? JSON.parse(storedCart) : []);
    setEditedProducts(storedEdited ? JSON.parse(storedEdited) : []);
    setPrintedItems(storedPrinted ? JSON.parse(storedPrinted) : []);
  }, []);

  const triggerAlert = useCallback(
    (message: string, type: "error" | "success" | "warning" = "error") => {
      setStockAlert({ show: true, message, type });
      setTimeout(
        () => setStockAlert({ show: false, message: "", type: "error" }),
        4000,
      );
    },
    [],
  );

  // Auto-save to database
  const autoSaveSale = useCallback(async () => {
    if (isSaving) return;
    if (!currentSaleId || !selectedTable) return;
    if (saleStatus === "completed") return;

    setIsSaving(true);
    try {
      // "api" already unwraps response.data — no need to read response.data here
      await api.put(`/sales/${currentSaleId}`, {
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
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [cart, currentSaleId, selectedTable, saleStatus, totalAmount, isSaving]);

  useEffect(() => {
    if (
      cart.length > 0 &&
      selectedTable &&
      currentSaleId &&
      saleStatus !== "completed"
    ) {
      const timer = setTimeout(() => {
        autoSaveSale();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [cart, selectedTable, currentSaleId, saleStatus, autoSaveSale]);

  const handleTableSelect = useCallback(
    async (table: Table) => {
      setSelectedTable(table);
      setSaleStatus("active");
      loadCartForTable(table.id);

      try {
        // ✅ fixed: was missing a leading "/" before "sales" — malformed URL
        const response = await api.get(`/sales/table/${table.id}/active`);
        if (response?.data) {
          const existingSale = response.data;
          setCurrentSaleId(existingSale.id);
          setSaleStatus(existingSale.status || "active");
          triggerAlert(`Continuing with Table ${table.table_name}`, "success");
          return;
        }
      } catch (error) {
        console.log("No active sale found, creating new one...");
      }

      try {
        const response = await api.post(`/sales/initialize`, {
          table_id: table.id,
          status: "active",
        });
        setCurrentSaleId(response?.sale_id);
        localStorage.setItem(
          "currentSaleId",
          JSON.stringify(response?.sale_id),
        );

        triggerAlert(
          `Table ${table.table_name} selected successfully!`,
          "success",
        );
      } catch (error: any) {
        console.error("Failed to initialize sale:", error);
        triggerAlert(
          error?.message || "Failed to initialize sale for this table!",
          "error",
        );
      }
    },
    [loadCartForTable, triggerAlert],
  );

  const handleAddToCart = useCallback(
    async (product: CartItem) => {
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

      if (selectedTable.status === "available" && cart.length === 0) {
        try {
          await api.put(`/tables/${selectedTable.id}/status`, {
            status: "occupied",
          });
          setSelectedTable({
            ...selectedTable,
            status: "occupied",
          });
        } catch (error) {
          console.error("Failed to update table status:", error);
        }
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
    },
    [selectedTable, saleStatus, cart.length, triggerAlert],
  );

  const handleQuantityChange = useCallback((id: number, value: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(value, 0) } : item,
      ),
    );
  }, []);

  const handleDeleteProduct = useCallback((id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    setEditedProducts((prev) => prev.filter((pid) => pid !== id));
  }, []);

  const handleEditProduct = useCallback((id: number, newName: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, product_name: newName } : item,
      ),
    );
  }, []);

  const handleClearCart = useCallback(async () => {
    if (cart.length === 0) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear the cart?",
    );
    if (!confirmed) return;

    if (selectedTable) {
      try {
        await api.put(`/tables/${selectedTable.id}/status`, {
          status: "available",
        });
        setSelectedTable({
          ...selectedTable,
          status: "available",
        });
      } catch (error) {
        console.error("Failed to update table status:", error);
      }
    }

    const tableId = selectedTable?.id;

    setCart([]);
    setEditedProducts([]);
    setPrintedItems([]);
    setSelectedTable(null);
    setCurrentSaleId(null);
    setSaleStatus("active");
    localStorage.removeItem("selectedTable");
    localStorage.removeItem("currentSaleId");
    localStorage.removeItem("saleStatus");
    if (tableId) {
      localStorage.removeItem(`cartItems_${tableId}`);
      localStorage.removeItem(`editedProducts_${tableId}`);
      localStorage.removeItem(`printedItems_${tableId}`);
    }
    triggerAlert("Cart cleared successfully!", "success");
  }, [cart.length, selectedTable, triggerAlert]);

  const handleViewTables = useCallback(() => {
    setIsTableModalOpen(true);
  }, []);

  const handleTableSelectFromModal = useCallback(
    async (table: Table) => {
      await handleTableSelect(table);
      setIsTableModalOpen(false);
    },
    [handleTableSelect],
  );

  const handlePrintBill = useCallback(() => {
    setSaleStatus("printed");
    triggerAlert("Invoice printed successfully!", "success");
  }, [triggerAlert]);

  const getStatusIcon = useCallback(() => {
    switch (saleStatus) {
      case "active":
        return (
          <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
        );
      case "printed":
        return (
          <AlertTriangle
            className="w-4 h-4 text-yellow-600"
            aria-hidden="true"
          />
        );
      case "completed":
        return <XCircle className="w-4 h-4 text-gray-600" aria-hidden="true" />;
      default:
        return null;
    }
  }, [saleStatus]);

  const getStatusColor = useCallback(() => {
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
  }, [saleStatus]);

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 md:p-4">
      {stockAlert.show && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto sm:max-w-md md:max-w-lg"
          role="alert"
          aria-live="polite"
        >
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
        {/* Header — stacks on mobile, row on larger screens */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Create Sale
            </h1>
            <p className="text-sm text-gray-600 mt-0.5 truncate">
              {selectedTable
                ? `Table: ${selectedTable.table_name} (${selectedTable.table_number})`
                : "Select a table to start"}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleViewTables}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Grid3x3 size={18} aria-hidden="true" />
              Change table
            </button>

            {lastSaved && (
              <div className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                Saved
              </div>
            )}
          </div>
        </div>

        {/* Table Selector (shown until a table is picked) */}
        {!selectedTable && (
          <div className="mb-4">
            <TableSelector
              onTableSelect={handleTableSelect}
              selectedTable={selectedTable}
            />
          </div>
        )}

        {/* Status bar */}
        {selectedTable && (
          <div className={`mb-4 p-3 rounded-lg border ${getStatusColor()}`}>
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className="font-semibold flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-600">Table:</span>
                  <span className="text-gray-900">
                    {selectedTable.table_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({selectedTable.table_number})
                  </span>
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full font-medium bg-white/60">
                  {getStatusIcon()}
                  {saleStatus.charAt(0).toUpperCase() + saleStatus.slice(1)}
                </span>
                {currentSaleId && (
                  <span className="text-xs text-gray-500">
                    #{currentSaleId}
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
                  className="min-h-[40px] bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  New sale
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main layout:
            - mobile/tablet: single column, natural reading order
              (pick a category → see the cart → check the invoice)
            - lg+: 3-column workspace with the category rail slightly
              wider (3/12) so it isn't cramped, cart in the middle (6/12),
              invoice fixed on the right (3/12) */}
        {selectedTable && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4">
                <CategoryShow onAddToCart={handleAddToCart} />
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4">
                <AddToCartProduct
                  cart={cart}
                  onUpdateQuantity={handleQuantityChange}
                  onDeleteProduct={handleDeleteProduct}
                  onEditProduct={handleEditProduct}
                  editedProducts={editedProducts}
                  totalAmount={totalAmount}
                  setEditedProducts={setEditedProducts}
                  printedItems={printedItems}
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4 lg:sticky lg:top-4">
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
