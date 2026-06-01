import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

import Landing from '../pages/Landing.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Products from '../pages/Products.jsx';
import Orders from '../pages/Orders.jsx';
import OrderCreate from '../pages/OrderCreate.jsx';
import OrderDetails from '../pages/OrderDetails.jsx';
import Customers from '../pages/Customers.jsx';
import Inventory from '../pages/Inventory.jsx';
import Analytics from '../pages/Analytics.jsx';
import Settings from '../pages/Settings.jsx';
import Users from '../pages/Users.jsx';
import NotFound from '../pages/NotFound.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/new" element={<OrderCreate />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Navigate to="/settings" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
