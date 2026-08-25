import ComponentCard from "../../components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { Plus, Minus, ShoppingCart, AlertTriangle, Printer } from "lucide-react";
import { useState } from "react";

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

interface Props {
  cart: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onDeleteProduct: (id: number) => void;
  onEditProduct: (id: number, newName: string) => void;
  editedProducts: any;
  totalAmount: any;
  setEditedProducts: any;
  printedItems?: number[];
}

export default function AddToCartProduct({
  cart,
  onUpdateQuantity,
  onDeleteProduct,
  onEditProduct,
  editedProducts,
  totalAmount,
  setEditedProducts,
  printedItems = [],
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleEdit = (item: CartItem) => {
    const appendText = prompt("Enter text to append to product name:", "");
    if (appendText === null) return;

    const newName = `${item.product_name} - [${appendText}]`;
    onEditProduct(item.id, newName);

    if (!editedProducts.includes(item.id)) {
      setEditedProducts([...editedProducts, item.id]);
    }
  };

  const handleQuantityChange = (id: number, newQty: number) => {
    if (newQty < 0) return;
    onUpdateQuantity(id, newQty);
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: "Out of Stock", color: "text-red-600" };
    if (stock <= 5) return { label: "Low Stock", color: "text-yellow-600" };
    return { label: "In Stock", color: "text-green-600" };
  };

  const isPrinted = (id: number) => {
    return printedItems.includes(id);
  };

  if (cart.length === 0) {
    return (
      <ComponentCard title="">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Your cart is empty</h3>
          <p className="text-sm text-gray-400 mt-1">
            Select a category and add products to get started
          </p>
        </div>
      </ComponentCard>
    );
  }

  return (
    <div>
      <ComponentCard title="">
        <div className="max-w-full overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SL
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-sm">
              {cart.map((product, index) => {
                const isEdited = editedProducts.includes(product.id);
                const isLowStock = product.stock <= 5 && product.stock > 0;
                const isOutOfStock = product.stock <= 0;
                const stockStatus = getStockStatus(product.stock);
                const total = product.quantity * product.price;
                const printed = isPrinted(product.id);

                return (
                  <TableRow
                    key={product.id}
                    className={`transition-colors ${
                      printed 
                        ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-500"
                        : isEdited 
                        ? "bg-green-50 hover:bg-green-100" 
                        : "hover:bg-gray-50"
                    } ${isOutOfStock ? "opacity-60" : ""}`}
                  >
                    <TableCell className="px-4 py-3 text-center font-medium text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${printed ? "text-red-700" : "text-gray-800"}`}>
                          {product.product_name}
                        </span>
                        {printed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Printer size={12} className="mr-1" />
                            Printed
                          </span>
                        )}
                        {isEdited && !printed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Edited
                          </span>
                        )}
                        {isLowStock && !isOutOfStock && !printed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Low Stock
                          </span>
                        )}
                        {isOutOfStock && !printed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-medium text-blue-600">
                      ৳{product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <span className={`font-medium ${stockStatus.color}`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleQuantityChange(product.id, product.quantity - 1)}
                          className="p-1 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={product.quantity <= 1 || isOutOfStock || printed}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          className={`w-14 text-center border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            printed ? "bg-red-50 border-red-300" : "border-gray-300"
                          }`}
                          value={product.quantity}
                          min={0}
                          max={product.stock}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value) || 0;
                            if (newQty > product.stock) {
                              alert(`Only ${product.stock} items available in stock!`);
                              return;
                            }
                            onUpdateQuantity(product.id, newQty);
                          }}
                          disabled={isOutOfStock || printed}
                        />
                        <button
                          onClick={() => handleQuantityChange(product.id, product.quantity + 1)}
                          className="p-1 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={product.quantity >= product.stock || isOutOfStock || printed}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-semibold text-gray-800">
                      ৳{total.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!printed && (
                          <>
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <TrashBinIcon />
                            </button>
                          </>
                        )}
                        {printed && (
                          <span className="text-xs text-red-500 font-medium">
                            Sent to Kitchen
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <TableCell colSpan={5} className="px-4 py-4 text-right font-bold text-gray-800 text-lg">
                  Total Amount
                </TableCell>
                <TableCell className="px-4 py-4 text-center font-bold text-blue-600 text-lg">
                  ৳{totalAmount.toFixed(2)}
                </TableCell>
                <TableCell className="px-4 py-4"></TableCell>
              </TableRow>

              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableCell colSpan={7} className="px-4 py-3">
                  <div className="flex flex-wrap justify-between items-center gap-2 text-sm text-gray-500">
                    <span>Total Items: <strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong></span>
                    <span>Unique Products: <strong>{cart.length}</strong></span>
                    <span>Edited: <strong className="text-green-600">{editedProducts.length}</strong></span>
                    <span>Printed: <strong className="text-red-600">{printedItems.length}</strong></span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </ComponentCard>
    </div>
  );
}