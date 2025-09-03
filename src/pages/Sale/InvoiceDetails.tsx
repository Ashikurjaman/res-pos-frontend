import { useState } from "react";

interface CartItem {
  id: number;
  product_name: string;
  price: number;
  quantity: number;
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

  const handleSubmit = () => {
    if (received < total) {
      alert(
        "⚠️ Received amount is less than the total! Please collect full payment."
      );
      return;
    }

    alert(`✅ Invoice Submitted!
    Total: ${total.toFixed(2)}
    Payment Mode: ${paymentMode}
    Received: ${received.toFixed(2)}
    Change: ${(received - total).toFixed(2)}
  `);
    setDiscount(0);
    setVat(0);
    setSd(0);
    setPaymentMode("Cash");
    setReceived(0);
    setCart([]);
  };

  const handlePrint = () => {
    window.print();
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
        <button
          onClick={handlePrint}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Print
        </button>
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
    </div>
  );
}
