import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Product from "./pages/Products/Product";
import ProductList from "./pages/Products/ProductList";
import ProductEdit from "./pages/Products/ProductEdit";
import Category from "./pages/Category/Category";
import CategoryList from "./pages/Category/CategoryList";
import CategoryEdit from "./pages/Category/CategoryEdit";
import Unit from "./pages/Unit/Unit";
import UnitList from "./pages/Unit/UnitList";
import UnitEdit from "./pages/Unit/UnitEdit";
import CreateSale from "./pages/Sale/CreateSale";
import SaleList from "./pages/Sale/SaleList";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/sale" element={<CreateSale />} />
            <Route path="/sale-list" element={<SaleList />} />
            <Route path="/products" element={<Product />} />
            <Route path="/products-list" element={<ProductList />} />
            <Route path="/products-edit/:id" element={<ProductEdit />} />
            <Route path="/category" element={<Category />} />
            <Route path="/category-list" element={<CategoryList />} />
            <Route path="/category-edit/:id" element={<CategoryEdit />} />
            <Route path="/unit" element={<Unit />} />
            <Route path="/unit-list" element={<UnitList />} />
            <Route path="/unit-edit/:id" element={<UnitEdit />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
