import React from 'react';

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

interface KitchenPrintProps {
  tableName: string;
  tableNumber: string;
  cart: CartItem[];
  invoiceNo: string;
  onClose: () => void;
}

export default function KitchenPrint({
  tableName,
  tableNumber,
  cart,
  invoiceNo,
  onClose,
}: KitchenPrintProps) {
  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=280,height=400');
    if (!printWindow) {
      alert('Please allow popups for this site to print.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Kitchen Order #${invoiceNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              padding: 10px;
              width: 280px;
              margin: 0 auto;
              background: white;
              color: black;
            }
            .header { 
              text-align: center; 
              margin-bottom: 10px;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
            }
            .header h1 { font-size: 20px; }
            .header .sub { font-size: 14px; color: #666; }
            .order-info {
              margin: 8px 0;
              padding: 4px 0;
              border-bottom: 1px dashed #333;
            }
            .order-info .row {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
            }
            .order-info .row .label { font-weight: bold; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 8px 0;
            }
            table th { 
              text-align: left; 
              font-size: 14px;
              border-bottom: 1px solid #333;
              padding-bottom: 4px;
            }
            table td { 
              padding: 4px 0; 
              font-size: 15px;
            }
            table td .qty-badge {
              display: inline-block;
              background: #333;
              color: white;
              padding: 0 8px;
              border-radius: 4px;
              font-weight: bold;
              margin-right: 6px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .divider { border-top: 1px dashed #333; margin: 6px 0; }
            .footer { 
              text-align: center; 
              margin-top: 10px;
              padding-top: 8px;
              border-top: 2px solid #333;
            }
            .footer .thankyou { font-size: 18px; font-weight: bold; }
            .footer .time { font-size: 12px; color: #666; }
            .bold { font-weight: bold; }
            .item-name { font-size: 16px; }
            @media print {
              body { width: 100%; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            };
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Group items by category
  const groupedItems = cart.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<number, CartItem[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Kitchen Order</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div ref={printRef} style={{ width: '280px', margin: '0 auto' }}>
            <div className="header">
              <h1>🍽️ KITCHEN</h1>
              <div className="sub">Order #: {invoiceNo}</div>
            </div>

            <div className="order-info">
              <div className="row">
                <span className="label">Table:</span>
                <span className="bold">{tableName} ({tableNumber})</span>
              </div>
              <div className="row">
                <span className="label">Time:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="row">
                <span className="label">Items:</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '65%' }}>Item</th>
                  <th className="text-center" style={{ width: '35%' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedItems).map((category) => (
                  <React.Fragment key={category}>
                    <tr>
                      <td colSpan={2} style={{ 
                        fontWeight: 'bold', 
                        fontSize: '13px', 
                        color: '#666',
                        borderTop: '1px solid #ddd',
                        paddingTop: '6px',
                        paddingBottom: '2px'
                      }}>
                        ─── {typeof category === 'string' ? category : `Category ${category}`} ───
                      </td>
                    </tr>
                    {groupedItems[Number(category)].map((item) => (
                      <tr key={item.id}>
                        <td className="item-name">
                          <span className="qty-badge">{item.quantity}</span>
                          {item.product_name}
                        </td>
                        <td className="text-center bold" style={{ fontSize: '18px' }}>
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="divider"></div>

            <div style={{ fontSize: '12px', color: '#666', padding: '4px 0' }}>
              * Please prepare as per order
            </div>

            <div className="footer">
              <div className="thankyou">🔥 Order Up!</div>
              <div className="time">{new Date().toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              🖨️ Print Kitchen
            </button>
            <button
              onClick={() => {
                handlePrint();
                onClose();
              }}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              ✅ Print & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}