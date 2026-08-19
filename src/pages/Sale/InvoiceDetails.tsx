import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import {
  Printer,
  Trash2,
  X,
  Check,
  CreditCard,
  Wallet,
  Smartphone,
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
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(0);
  const [sd, setSd] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [received, setReceived] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [invoice, setInvoice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discountAmount = (subTotal * discount) / 100;
  const vatAmount = (subTotal * vat) / 100;
  const sdAmount = (subTotal * sd) / 100;

  const total = subTotal - discountAmount + vatAmount + sdAmount;

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-BD", {
      style: "currency",
      currency: "BDT",
    });

  const cashOptions = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

  const handleCashClick = (value: number) => {
    setReceived((prev) => prev + value);
  };

  const handleConfirm = () => {
    setShowModal(false);
  };

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Dhaka",
  });

  const handleSubmit = async () => {
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
      const response = await axios.post(
        "http://localhost:8000/api/create-sale",
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

      // Update sale status
      if (setSaleStatus) {
        setSaleStatus("completed");
      }

      // Update table status to available
      await axios.put(
        `http://localhost:8000/api/tables/${selectedTable.id}/status`,
        {
          status: "available",
        },
      );

      Swal.fire({
        icon: "success",
        title: "Sale Completed!",
        text: `Invoice #${response.data.invoiceNo} created successfully!`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Print invoice
      handlePrint();

      // Reset form
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
    } catch (error: any) {
      console.error("Error submitting invoice:", error);
      Swal.fire({
        icon: "error",
        title: "Save Failed!",
        text: error.response?.data?.message || "Error saving invoice!",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (onPrintBill) {
      onPrintBill();
    }

    const printContent = document.getElementById("printableArea");
    if (!printContent) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Print content not found.",
      });
      return;
    }

    const newWindow = window.open("", "Print", "width=400,height=600");
    if (!newWindow) {
      Swal.fire({
        icon: "error",
        title: "Popup Blocked!",
        text: "Please allow popups for this site to print invoices.",
      });
      return;
    }

    newWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 0; }
            .status-printed { background-color: #fef3c7; }
            .status-completed { background-color: #d1fae5; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-dashed { border-top: 1px dashed #000; }
            .border-solid { border-top: 1px solid #000; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    newWindow.document.close();
    newWindow.focus();

    setTimeout(() => {
      newWindow.print();
      newWindow.close();
    }, 500);
  };

  const handleClear = () => {
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
  };

  const getPaymentIcon = (mode: string) => {
    switch (mode) {
      case "Cash":
        return <Wallet size={16} className="text-green-600" />;
      case "Card":
        return <CreditCard size={16} className="text-blue-600" />;
      case "Mobile":
        return <Smartphone size={16} className="text-purple-600" />;
      default:
        return null;
    }
  };

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
          disabled={saleStatus === "completed" || isSubmitting}
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
          disabled={saleStatus === "completed" || isSubmitting}
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
          disabled={saleStatus === "completed" || isSubmitting}
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
          disabled={saleStatus === "completed" || isSubmitting}
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
          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors text-sm flex items-center justify-center gap-1"
          disabled={saleStatus === "completed" || isSubmitting}
        >
          💰 Enter
        </button>
      </div>

      {/* Change */}
      <div className="grid grid-cols-3 gap-2 items-center bg-green-50 p-2 rounded-lg">
        <span className="col-span-2 font-medium text-green-700">Change:</span>
        <span className="text-right font-semibold text-green-700">
          {formatCurrency(Math.max(received - total, 0))}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          onClick={handleSubmit}
          className={`flex-1 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
            cart.length === 0 || saleStatus === "completed" || isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
          disabled={
            cart.length === 0 || saleStatus === "completed" || isSubmitting
          }
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Processing...
            </>
          ) : saleStatus === "completed" ? (
            <>
              <Check size={16} />
              Completed
            </>
          ) : (
            <>
              <Check size={16} />
              Submit
            </>
          )}
        </button>
        <button
          onClick={handleClear}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
          disabled={cart.length === 0 || isSubmitting}
        >
          <Trash2 size={16} />
          Clear
        </button>
      </div>

      {/* Print Button (when completed) */}
      {saleStatus === "completed" && (
        <button
          onClick={handlePrint}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Printer size={16} />
          Print Invoice
        </button>
      )}

      {/* Cash Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Cash Amount</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {cashOptions.map((value) => (
                <button
                  key={value}
                  onClick={() => handleCashClick(value)}
                  className="bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium text-lg"
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
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Area */}
      <div id="printableArea" className="hidden">
        <div
          style={{
            fontFamily: "monospace",
            width: "300px",
            padding: "10px",
            border: "1px solid #000",
          }}
          className={
            saleStatus === "printed" ? "status-printed" : "status-completed"
          }
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr>
                <th
                  colSpan={3}
                  style={{
                    textAlign: "center",
                    fontSize: "16px",
                    borderBottom: "1px dashed #000",
                    paddingBottom: "5px",
                  }}
                >
                  My Store
                </th>
              </tr>
              <tr>
                <th
                  colSpan={3}
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    paddingBottom: "5px",
                  }}
                >
                  Address / Phone
                </th>
              </tr>
              <tr>
                <td colSpan={2}>Date:</td>
                <td style={{ textAlign: "right" }}>
                  {new Date().toLocaleString()}
                </td>
              </tr>
              <tr>
                <td colSpan={2}>Invoice:</td>
                <td style={{ textAlign: "right" }}>{invoice}</td>
              </tr>
              {selectedTable && (
                <tr>
                  <td colSpan={2}>Table:</td>
                  <td style={{ textAlign: "right" }}>
                    {selectedTable.table_name}
                  </td>
                </tr>
              )}
              <tr>
                <td
                  colSpan={3}
                  style={{ borderBottom: "1px dashed #000" }}
                ></td>
              </tr>
              <tr>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #000" }}
                >
                  Item
                </th>
                <th
                  style={{
                    textAlign: "center",
                    borderBottom: "1px solid #000",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{ textAlign: "right", borderBottom: "1px solid #000" }}
                >
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    {(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ borderTop: "1px dashed #000" }}></td>
              </tr>
              <tr>
                <td>Subtotal</td>
                <td colSpan={2} style={{ textAlign: "right" }}>
                  {subTotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Discount</td>
                <td colSpan={2} style={{ textAlign: "right" }}>
                  {discountAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>VAT</td>
                <td colSpan={2} style={{ textAlign: "right" }}>
                  {vatAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>SD</td>
                <td colSpan={2} style={{ textAlign: "right" }}>
                  {sdAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold" }}>Total</td>
                <td
                  colSpan={2}
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  {total.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Received</td>
                <td colSpan={2} style={{ textAlign: "right" }}>
                  {received.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Change</td>
                <td colSpan={2} style={{ textAlign: "right" }}>
                  {(received - total).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} style={{ borderTop: "1px dashed #000" }}></td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  style={{ textAlign: "center", paddingTop: "5px" }}
                >
                  *** Thank You! ***
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
