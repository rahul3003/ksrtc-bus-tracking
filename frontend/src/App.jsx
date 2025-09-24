import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layout Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import DashboardRedirect from './components/DashboardRedirect';

// Auth Components
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Admin Components
import AdminDashboard from './pages/Admin/Dashboard';
import AdminBuses from './pages/Admin/Buses';
import AdminRoutes from './pages/Admin/Routes';
import AdminTrips from './pages/Admin/Trips';
import AdminUsers from './pages/Admin/Users';
import AdminBookings from './pages/Admin/Bookings';
import AdminLiveTracking from './pages/Admin/LiveTracking';

// Driver Components
import DriverDashboard from './pages/Driver/Dashboard';
import DriverTrips from './pages/Driver/Trips';
import DriverTracking from './pages/Driver/Tracking';

// Passenger Components
import PassengerDashboard from './pages/Passenger/Dashboard';
import PassengerRoutes from './pages/Passenger/Routes';
import PassengerBookings from './pages/Passenger/Bookings';
import PassengerTracking from './pages/Passenger/Tracking';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                {/* Admin Routes */}
                <Route path="admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="admin/buses" element={
                  <AdminRoute>
                    <AdminBuses />
                  </AdminRoute>
                } />
                <Route path="admin/routes" element={
                  <AdminRoute>
                    <AdminRoutes />
                  </AdminRoute>
                } />
                <Route path="admin/trips" element={
                  <AdminRoute>
                    <AdminTrips />
                  </AdminRoute>
                } />
                <Route path="admin/users" element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } />
                <Route path="admin/bookings" element={
                  <AdminRoute>
                    <AdminBookings />
                  </AdminRoute>
                } />
                <Route path="admin/live-tracking" element={
                  <AdminRoute>
                    <AdminLiveTracking />
                  </AdminRoute>
                } />
                
                {/* Driver Routes */}
                <Route path="driver" element={
                  <ProtectedRoute allowedRoles={['DRIVER']}>
                    <DriverDashboard />
                  </ProtectedRoute>
                } />
                <Route path="driver/trips" element={
                  <ProtectedRoute allowedRoles={['DRIVER']}>
                    <DriverTrips />
                  </ProtectedRoute>
                } />
                <Route path="driver/tracking" element={
                  <ProtectedRoute allowedRoles={['DRIVER']}>
                    <DriverTracking />
                  </ProtectedRoute>
                } />
                
                {/* Passenger Routes */}
                <Route path="passenger" element={
                  <ProtectedRoute allowedRoles={['PASSENGER']}>
                    <PassengerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="passenger/routes" element={
                  <ProtectedRoute allowedRoles={['PASSENGER']}>
                    <PassengerRoutes />
                  </ProtectedRoute>
                } />
                <Route path="passenger/bookings" element={
                  <ProtectedRoute allowedRoles={['PASSENGER']}>
                    <PassengerBookings />
                  </ProtectedRoute>
                } />
                <Route path="passenger/tracking" element={
                  <ProtectedRoute allowedRoles={['PASSENGER']}>
                    <PassengerTracking />
                  </ProtectedRoute>
                } />
                
                {/* Default redirect based on user role */}
                <Route index element={<DashboardRedirect />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
