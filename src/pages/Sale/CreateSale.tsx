import AddToCartProduct from "./AddToCartProduct";
import CategoryShow from "./CategoryShow";
import InvoiceDetails from "./invoiceDetails";

export default function CreateSale() {


 
    return (
        <div className="grid grid-cols-3 border-2">
            <div className="w-50"> <CategoryShow /> </div>
            <div> <AddToCartProduct/>  </div>
            <div> <InvoiceDetails/> </div>
        </div>
    );



}
