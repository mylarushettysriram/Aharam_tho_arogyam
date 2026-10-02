import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import AddRice from "./pages/farmer/AddRice";
import MyRice from "./pages/farmer/MyRice";
import EditRice from "./pages/farmer/EditRice";
import FarmerOrders from "./pages/farmer/FarmerOrders";
import FarmerProfile from "./pages/farmer/FarmerProfile";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import RiceList from "./pages/customer/RiceList";
import RiceDetails from "./pages/customer/RiceDetails";
import Checkout from "./pages/customer/Checkout";
import MyOrders from "./pages/customer/MyOrders";
import OrderDetails from "./pages/customer/OrderDetails";
import CustomerProfile from "./pages/customer/CustomerProfile";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/customer/login" element={<Login customerOnly />} />
          <Route path="/farmer/login" element={<Login farmerOnly />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />

          <Route path="/farmer/dashboard" element={<ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>} />
          <Route path="/farmer/rice" element={<ProtectedRoute role="farmer"><MyRice /></ProtectedRoute>} />
          <Route path="/farmer/rice/add" element={<ProtectedRoute role="farmer"><AddRice /></ProtectedRoute>} />
          <Route path="/farmer/rice/edit/:id" element={<ProtectedRoute role="farmer"><EditRice /></ProtectedRoute>} />
          <Route path="/farmer/orders" element={<ProtectedRoute role="farmer"><FarmerOrders /></ProtectedRoute>} />
          <Route path="/farmer/profile" element={<ProtectedRoute role="farmer"><FarmerProfile /></ProtectedRoute>} />

          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/rice" element={<RiceList />} />
          <Route path="/customer/rice/:id" element={<RiceDetails />} />
          <Route path="/customer/checkout" element={<ProtectedRoute role="customer"><Checkout /></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute role="customer"><MyOrders /></ProtectedRoute>} />
          <Route path="/customer/orders/:id" element={<ProtectedRoute role="customer"><OrderDetails /></ProtectedRoute>} />
          <Route path="/customer/profile" element={<ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
