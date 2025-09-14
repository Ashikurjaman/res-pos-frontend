import { useEffect, useState } from "react";
import AddToCartProduct from "./AddToCartProduct";
import CategoryShow from "./CategoryShow";
import InvoiceDetails from "./InvoiceDetails";
import Alert from "../../components/ui/alert/Alert";

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
export default function CreateSale() {
  const [stockAlert, setStockAlert] = useState({
    open: false,
    message: "",
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const storedCart = localStorage.getItem("cartItems");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const [editedProducts, setEditedProducts] = useState<number[]>(() => {
    const stored = localStorage.getItem("editedProducts");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("editedProducts", JSON.stringify(editedProducts));
  }, [editedProducts]);
  const totalAmount = cart.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  const triggerAlert = (message: string) => {
    setStockAlert({ show: true, message });
    setTimeout(() => setStockAlert({ show: false, message: "" }), 3000); // hide after 3 sec
  };

  useEffect(() => {
    const validCart = cart.filter((item) => item.quantity <= item.stock);
    localStorage.setItem("cartItems", JSON.stringify(validCart));
  }, [cart]);

  const handleAddToCart = (product: CartItem) => {
    if (product.stock <= 0 || product.quantity > product.stock) {
      triggerAlert(`${product.product_name} is out of stock!`);
      return;
    }

    setCart((prev) => {
      //   console.log(product);
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity + product.quantity > product.stock) {
          triggerAlert(`${product.product_name} stock is insufficient!`);
          return prev;
        }
        // update quantity

        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      } else {
        // add new product
        return [...prev, product];
      }
    });
  };

  const handleQuantityChange = (id: number, value: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(value, 0) } : item
      )
    );
  };

  const handleDeleteProduct = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    setEditedProducts((prev) => prev.filter((pid) => pid !== id));
  };

  const handleEditProduct = (id: number, newName: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, product_name: newName } : item
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setEditedProducts([]);
  };
  return (
    <div className="grid grid-cols-12 border-2 gap-2">
      <div className="col-span-2 border-2">
        {" "}
        <CategoryShow onAddToCart={handleAddToCart} />{" "}
      </div>
      <div className="col-span-7">
        {" "}
        <AddToCartProduct
          cart={cart}
          onUpdateQuantity={handleQuantityChange}
          onDeleteProduct={handleDeleteProduct}
          onEditProduct={handleEditProduct}
          editedProducts={editedProducts}
          totalAmount={totalAmount}
          setEditedProducts={setEditedProducts}
        />{" "}
      </div>
      <div className="col-span-3">
        {" "}
        <InvoiceDetails
          cart={cart}
          setCart={setCart}
          onClearCart={handleClearCart}
        />{" "}
      </div>
      {stockAlert.show && (
        <div className="absolute top-60 right-90 z-100">
          <Alert
            title="Stock Alert"
            variant="error"
            message={stockAlert.message}
          />
        </div>
      )}
    </div>
  );
}
