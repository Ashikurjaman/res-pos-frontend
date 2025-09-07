import ComponentCard from "../../components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { PencilIcon, TrashBinIcon } from "../../icons";

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
}

export default function AddToCartProduct({
  cart,
  onUpdateQuantity,
  onDeleteProduct,
  onEditProduct,
  editedProducts,
  totalAmount,
  setEditedProducts,
}: Props) {
  const handleEdit = (item: CartItem) => {
    const appendText = prompt("Enter text to append", "");
    if (!appendText) return;

    // Append the new text to the existing product name
    const newName = `${item.product_name} - [${appendText}]`;

    onEditProduct(item.id, newName);

    if (!editedProducts.includes(item.id)) {
      setEditedProducts([...editedProducts, item.id]);
    }
  };

  return (
    <div>
      <ComponentCard title="">
        <div className="max-w-full overflow-x rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableCell isHeader>SL</TableCell>
                <TableCell isHeader>Product Name</TableCell>
                <TableCell isHeader>Price</TableCell>
                <TableCell isHeader>Stock</TableCell>
                <TableCell isHeader>Quantity</TableCell>
                <TableCell isHeader>Total</TableCell>
                <TableCell isHeader>Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-sm">
              {cart.map((product, index) => (
                <TableRow
                  key={product.id}
                  className={
                    editedProducts.includes(product.id) ? "bg-green-200" : ""
                  }
                >
                  <TableCell className="px-2 py-2 sm:px-2 text-center">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-1 py-1 text-center">
                    {product.product_name}
                  </TableCell>
                  <TableCell className="px-1 py-1 text-center">
                    {product.price}
                  </TableCell>
                  <TableCell className="px-1 py-1 text-center">
                    {product.stock}
                  </TableCell>
                  <TableCell className="px-1 py-1 text-center">
                    <input
                      type="number"
                      className="w-16 text-center border rounded"
                      value={product.quantity}
                      min={0}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || 0;
                        if (newQty > product.stock) {
                          alert("Not in stock");
                          return;
                        }
                        onUpdateQuantity(product.id, newQty);
                      }}
                    />
                    {product.quantity > product.stock && (
                      <div className="text-red-500 text-xs mt-1">
                        Not enough stock (max {product.stock})
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-1 py-1 text-center">
                    {product.quantity * product.price}
                  </TableCell>
                  <TableCell className="px-1 py-1 text-center space-x-1">
                    <button
                      onClick={() => handleEdit(product)}
                      className="px-2 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="px-2 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <TrashBinIcon />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {cart.length > 0 && (
                <TableRow className="font-extrabold bg-gray-100">
                  <TableCell colSpan={4} className="text-right px-4 py-2">
                    Total Amount
                  </TableCell>
                  <TableCell className="text-center px-4 py-2">
                    {totalAmount}
                  </TableCell>
                  <TableCell children={undefined} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>
    </div>
  );
}
