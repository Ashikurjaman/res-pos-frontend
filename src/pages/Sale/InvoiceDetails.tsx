import axios from "axios";
import { useState, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Printer,
  Trash2,
  X,
  Check,
  CreditCard,
  Wallet,
  Smartphone,
  Utensils,
} from "lucide-react";
import PrintInvoice from "../../pages/Sale/PrintInvoice";
import KitchenPrint from "../../pages/Sale/KitchenPrint";
import { API_CONFIG } from "../../config/api";

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
  status: string;
}

interface InvoiceDetailsProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onClearCart?: () => void;
  selectedTable?: Table | null;
  saleStatus?: string;
  setSaleStatus?: (status: string) => void;
  onPrintBill?: () => void;
  currentSaleId?: number | null;
}

export default function InvoiceDetails({
  cart,
  setCart,
  onClearCart,
  selectedTable,
  saleStatus,
  setSaleStatus,
  onPrintBill,
  currentSaleId,
}: InvoiceDetailsProps) {
  const [discount, setDiscount] = useState<number>(0);
  const [vat, setVat] = useState<number>(0);
  const [sd, setSd] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [received, setReceived] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [invoice, setInvoice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showKitchenPrintModal, setShowKitchenPrintModal] =
    useState<boolean>(false);

  // Memoized calculations
  const subTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const discountAmount = useMemo(
    () => (subTotal * discount) / 100,
    [subTotal, discount],
  );
  const vatAmount = useMemo(() => (subTotal * vat) / 100, [subTotal, vat]);
  const sdAmount = useMemo(() => (subTotal * sd) / 100, [subTotal, sd]);

  const total = useMemo(
    () => subTotal - discountAmount + vatAmount + sdAmount,
    [subTotal, discountAmount, vatAmount, sdAmount],
  );

  const change = useMemo(
    () => Math.max(received - total, 0),
    [received, total],
  );

  const formatCurrency = useCallback(
    (amount: number) =>
      amount.toLocaleString("en-BD", {
        style: "currency",
        currency: "BDT",
      }),
    [],
  );

  const cashOptions = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

  const handleCashClick = useCallback((value: number) => {
    setReceived((prev) => prev + value);
  }, []);

  const handleConfirm = useCallback(() => {
    setShowModal(false);
  }, []);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Dhaka",
  });

  const handleSubmit = useCallback(async () => {
    if (!selectedTable) {
      Swal.fire({
        icon: "warning",
        title: "No Table Selected",
        text: "Please select a table first!",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (received < total) {
      Swal.fire({
        icon: "warning",
        title: "Insufficient Payment",
        text: "Received amount is less than the total! Please collect full payment.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (cart.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Empty Cart",
        text: "Please add products to the cart first!",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create sale
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/create-sale`,
        {
          entryDate: today,
          total,
          discount,
          vat,
          sd,
          paymentMode,
          received,
          change: received - total,
          table_id: selectedTable.id,
          status: "completed",
          products: cart.map((item) => ({
            id: item.id,
            name: item.product_name,
            category: item.category,
            price: item.price,
            quantity: item.quantity,
            stock: item.stock,
            vat: item.vat,
            sd: item.sd,
          })),
        },
      );

      setInvoice(response.data.invoiceNo);

      if (setSaleStatus) {
        setSaleStatus("completed");
      }

      // Update table status
      await axios.put(
        `${API_CONFIG.baseURL}/api/tables/${selectedTable.id}/status`,
        {
          status: "available",
        },
      );

      // Show print modal
      setShowPrintModal(true);

      // Reset form
      setDiscount(0);
      setVat(0);
      setSd(0);
      setPaymentMode("Cash");
      setReceived(0);

      Swal.fire({
        icon: "success",
        title: "Sale Completed!",
        text: `Invoice #${response.data.invoiceNo} created successfully!`,
        timer: 2000,
        showConfirmButton: false,
      });

      if (onClearCart) {
        onClearCart();
      } else {
        setCart([]);
      }
    } catch (error: any) {
      console.error("Error submitting invoice:", error);

      let errorMessage = "Error saving invoice!";
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.statusText ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "Network error - please check your connection";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Save Failed!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedTable,
    received,
    total,
    cart,
    today,
    discount,
    vat,
    sd,
    paymentMode,
    setSaleStatus,
    onClearCart,
    setCart,
  ]);

  const handlePrint = useCallback(() => {
    setShowPrintModal(true);
  }, []);

  const handleKitchenPrint = useCallback(() => {
    if (cart.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Empty Cart",
        text: "No items to print for kitchen.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    setShowKitchenPrintModal(true);
  }, [cart.length]);

  const handleClear = useCallback(() => {
    if (cart.length === 0) return;

    Swal.fire({
      title: "Clear Cart?",
      text: "This will remove all items from the cart.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, clear all",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setDiscount(0);
        setVat(0);
        setSd(0);
        setPaymentMode("Cash");
        setReceived(0);
        if (onClearCart) {
          onClearCart();
        } else {
          setCart([]);
        }
        Swal.fire({
          icon: "success",
          title: "Cart Cleared!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }, [cart.length, onClearCart, setCart]);

  const getPaymentIcon = useCallback((mode: string) => {
    switch (mode) {
      case "Cash":
        return (
          <Wallet size={16} className="text-green-600" aria-hidden="true" />
        );
      case "Card":
        return (
          <CreditCard size={16} className="text-blue-600" aria-hidden="true" />
        );
      case "Mobile":
        return (
          <Smartphone
            size={16}
            className="text-purple-600"
            aria-hidden="true"
          />
        );
      default:
        return null;
    }
  }, []);

  const isDisabled = saleStatus === "completed" || isSubmitting;
  const cartEmpty = cart.length === 0;

  return (
    <div className="p-4 border-l border-gray-300 dark:border-gray-700 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invoice Details</h2>
        {cart.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {cart.length} items
          </span>
        )}
      </div>

      {/* Table Info */}
      {selectedTable && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Table:</span>
            <span className="font-bold text-blue-700">
              {selectedTable.table_name}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="font-medium text-gray-700">Status:</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                saleStatus === "active"
                  ? "bg-green-100 text-green-700"
                  : saleStatus === "printed"
                    ? "bg-yellow-100 text-yellow-700"
                    : saleStatus === "completed"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-gray-100 text-gray-700"
              }`}
            >
              {saleStatus?.toUpperCase() || "ACTIVE"}
            </span>
          </div>
          {currentSaleId && (
            <div className="text-xs text-gray-500 mt-1">
              Sale ID: #{currentSaleId}
            </div>
          )}
        </div>
      )}

      {/* Sub Total */}
      <div className="grid grid-cols-3 gap-2 items-center">
        <span className="col-span-2 font-medium">Sub Total:</span>
        <span className="text-right font-semibold">{subTotal.toFixed(2)}</span>
      </div>

      {/* Discount */}
      <div className="grid grid-cols-3 gap-2 items-center">
        <label className="font-medium">Discount %:</label>
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          className="w-full border rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          max="100"
          disabled={isDisabled}
        />
        <span className="text-right text-red-600">
          - {discountAmount.toFixed(2)}
        </span>
      </div>

      {/* VAT */}
      <div className="grid grid-cols-3 gap-2 items-center">
        <label className="font-medium">VAT %:</label>
        <input
          type="number"
          value={vat}
          onChange={(e) => setVat(parseFloat(e.target.value) || 0)}
          className="w-full border rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          max="100"
          disabled={isDisabled}
        />
        <span className="text-right text-blue-600">
          + {vatAmount.toFixed(2)}
        </span>
      </div>

      {/* SD */}
      <div className="grid grid-cols-3 gap-2 items-center">
        <label className="font-medium">SD %:</label>
        <input
          type="number"
          value={sd}
          onChange={(e) => setSd(parseFloat(e.target.value) || 0)}
          className="w-full border rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          max="100"
          disabled={isDisabled}
        />
        <span className="text-right text-purple-600">
          + {sdAmount.toFixed(2)}
        </span>
      </div>

      <div className="border-t border-gray-300 dark:border-gray-600 my-2"></div>

      {/* Total */}
      <div className="grid grid-cols-3 gap-2 items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg">
        <span className="col-span-2 font-bold text-lg">Total:</span>
        <span className="text-right font-bold text-lg text-green-600">
          {total.toFixed(2)}
        </span>
      </div>

      <div className="border-t border-gray-300 dark:border-gray-600 my-2"></div>

      {/* Payment Mode */}
      <div className="grid grid-cols-3 gap-2 items-center">
        <label className="font-medium">Payment Mode:</label>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          className="col-span-2 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isDisabled}
        >
          <option value="Cash">💵 Cash</option>
          <option value="Card">💳 Card</option>
          <option value="Mobile">📱 Mobile</option>
        </select>
      </div>

      {/* Received */}
      <div className="grid grid-cols-3 gap-2 items-center">
        <label className="font-medium">Received:</label>
        <span className="text-right font-bold text-green-600">
          {formatCurrency(received)}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isDisabled}
        >
          💰 Enter
        </button>
      </div>

      {/* Change */}
      <div className="grid grid-cols-3 gap-2 items-center bg-green-50 p-2 rounded-lg">
        <span className="col-span-2 font-medium text-green-700">Change:</span>
        <span className="text-right font-semibold text-green-700">
          {formatCurrency(change)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          onClick={handleSubmit}
          className={`flex-1 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              cartEmpty || isDisabled
                ? "bg-gray-400"
                : "bg-green-600 hover:bg-green-700"
            }`}
          disabled={cartEmpty || isDisabled}
        >
          {isSubmitting ? (
            <>
              <span
                className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                aria-hidden="true"
              ></span>
              Processing...
            </>
          ) : saleStatus === "completed" ? (
            <>
              <Check size={16} aria-hidden="true" />
              Completed
            </>
          ) : (
            <>
              <Check size={16} aria-hidden="true" />
              Submit
            </>
          )}
        </button>
        <button
          onClick={handleClear}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={cartEmpty || isSubmitting}
        >
          <Trash2 size={16} aria-hidden="true" />
          Clear
        </button>
      </div>

      {/* Print Buttons */}
      {cart.length > 0 && saleStatus !== "completed" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleKitchenPrint}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Utensils size={16} aria-hidden="true" />
            Kitchen Print
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Printer size={16} aria-hidden="true" />
            Preview Bill
          </button>
        </div>
      )}

      {/* Print Buttons (when completed) */}
      {saleStatus === "completed" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleKitchenPrint}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Utensils size={16} aria-hidden="true" />
            Kitchen Print
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Printer size={16} aria-hidden="true" />
            Print Invoice
          </button>
        </div>
      )}

      {/* Cash Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cash-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 id="cash-modal-title" className="text-lg font-semibold">
                Select Cash Amount
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {cashOptions.map((value) => (
                <button
                  key={value}
                  onClick={() => handleCashClick(value)}
                  className="bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  ৳{value}
                </button>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">Received:</span>
                  <span className="ml-2 font-bold text-lg text-green-600">
                    {formatCurrency(received)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReceived(0)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kitchen Print Modal */}
      {showKitchenPrintModal && selectedTable && (
        <KitchenPrint
          tableName={selectedTable.table_name}
          tableNumber={selectedTable.table_number}
          cart={cart}
          invoiceNo={invoice || `ORDER-${Date.now()}`}
          onClose={() => setShowKitchenPrintModal(false)}
        />
      )}

      {/* Print Invoice Modal */}
      {showPrintModal && selectedTable && (
        <PrintInvoice
          invoiceNo={invoice || `INV-${Date.now()}`}
          tableName={selectedTable.table_name}
          cart={cart}
          total={total}
          discount={discountAmount}
          vat={vatAmount}
          sd={sdAmount}
          received={received}
          change={change}
          paymentMode={paymentMode}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
