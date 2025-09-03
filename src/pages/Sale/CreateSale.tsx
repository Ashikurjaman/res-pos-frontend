import { useEffect, useState } from "react";
import AddToCartProduct from "./AddToCartProduct";
import CategoryShow from "./CategoryShow";
import InvoiceDetails from "./invoiceDetails";

interface CartItem {
  id: number;
  product_name: string;
  price: number;
  quantity: number;
}
export default function CreateSale() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const storedCart = localStorage.getItem("cartItems");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product: CartItem) => {
    setCart((prev) => {
      //   console.log(product);
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
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
    </div>
  );
}
