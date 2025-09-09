import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";

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
interface InvoiceDetailsProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onClearCart?: () => void;
}
export default function InvoiceDetails({ cart, setCart }: InvoiceDetailsProps) {
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(0);
  const [sd, setSd] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [received, setReceived] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [invoice, setInvoice] = useState("");

  const subTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
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
  console.log(today);

  const handleSubmit = async () => {
    if (received < total) {
      alert(
        "⚠️ Received amount is less than the total! Please collect full payment."
      );
      return;
    }

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
          products: cart.map((item) => ({
            id: item.id,
            name: item.product_name,
            category: item.category, // ✅ include category
            price: item.price,
            quantity: item.quantity,
            stock: item.stock,
            vat: item.vat,
            sd: item.sd,
          })),
        }
      );
      console.log("✅ Server Response:", response.data);
      setInvoice(response.data.invoiceNo);
      Swal.fire({
        icon: "success",
        title: "Sale Created!",
        text: "✅ Product saved successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      // Reset form after successful submit
      handlePrint();
      setDiscount(0);
      setVat(0);
      setSd(0);
      setPaymentMode("Cash");
      setReceived(0);
      setCart([]);
    } catch (error) {
      console.error("❌ Error submitting invoice:", error);
      Swal.fire({
        icon: "error",
        title: "Save Failed!",
        text:
          "❌ Error saving product! " + (error.response?.data?.message || ""),
      });
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printableArea");
    if (!printContent) return;

    const newWindow = window.open("", "Print", "width=400,height=600");
    newWindow?.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        <style>
          body { font-family: monospace; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 2px 0; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `);
    newWindow?.document.close();
    newWindow?.focus();
    newWindow?.print();
    newWindow?.close();
  };

  const handleClear = () => {
    setDiscount(0);
    setVat(0);
    setSd(0);
    setPaymentMode("Cash");
    setReceived(0);
    setCart([]);
  };

  return (
    <div className="p-4 border-l border-gray-300 dark:border-gray-700 h-full flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Invoice Details</h2>

      <div className="flex justify-between">
        <span>Sub Total:</span>
        <span>{subTotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-between">
        <label>Discount %:</label>
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          className="w-20 border rounded px-2 py-1 text-right"
        />
        <span>- {discountAmount.toFixed(2)}</span>
      </div>

      <div className="flex justify-between">
        <label>VAT %:</label>
        <input
          type="number"
          value={vat}
          onChange={(e) => setVat(parseFloat(e.target.value) || 0)}
          className="w-20 border rounded px-2 py-1 text-right"
        />
        <span>+ {vatAmount.toFixed(2)}</span>
      </div>

      <div className="flex justify-between">
        <label>SD %:</label>
        <input
          type="number"
          value={sd}
          onChange={(e) => setSd(parseFloat(e.target.value) || 0)}
          className="w-20 border rounded px-2 py-1 text-right"
        />
        <span>+ {sdAmount.toFixed(2)}</span>
      </div>

      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>{total.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center">
        <label>Payment Mode:</label>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Mobile">Mobile</option>
        </select>
      </div>

      <div className="flex justify-between items-center">
        <label>Received:</label>
        <div className="flex items-center gap-2">
          <span className="font-bold">{formatCurrency(received)}</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
        >
          Enter
        </button>
      </div>
      <div className="flex justify-between mt-2 font-semibold">
        <span>Change:</span>
        <span>{formatCurrency(Math.max(received - total, 0))}</span>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Submit
        </button>
        {/* <button
          onClick={handlePrint}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Print
        </button> */}
        <button
          onClick={handleClear}
          className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear
        </button>
      </div>

      {showModal && (
        <div className="absolute right-80 top-40 bg-white rounded-lg shadow-lg p-4 w-96 z-50">
          <div className="bg-white rounded-lg p-6 w-auto">
            <h3 className="text-lg font-semibold mb-4">Select Cash</h3>
            <div className="grid grid-cols-3 gap-2">
              {cashOptions.map((value) => (
                <button
                  key={value}
                  onClick={() => handleCashClick(value)}
                  className="bg-green-500 text-white py-2 rounded hover:bg-green-600"
                >
                  ৳{value}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div>
                <span className="font-bold">
                  Received: {formatCurrency(received)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  OK
                </button>
                <button
                  onClick={() => setReceived(0)} // clear received cash
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div id="printableArea" className="hidden">
        <div
          style={{
            fontFamily: "monospace",
            width: "300px",
            padding: "10px",
            border: "1px solid #000",
          }}
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
