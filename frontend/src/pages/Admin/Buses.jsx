import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  TruckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AdminBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/buses`);
      setBuses(response.data.buses);
    } catch (error) {
      console.error('Error fetching buses:', error);
      toast.error('Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/buses/${busId}`);
      toast.success('Bus deleted successfully');
      fetchBuses();
    } catch (error) {
      console.error('Error deleting bus:', error);
      toast.error('Failed to delete bus');
    }
  };

  const toggleBusStatus = async (busId, currentStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/buses/${busId}`, {
        isActive: !currentStatus
      });
      toast.success('Bus status updated successfully');
      fetchBuses();
    } catch (error) {
      console.error('Error updating bus status:', error);
      toast.error('Failed to update bus status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bus Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your fleet of buses
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Bus
        </button>
      </div>

      {/* Buses Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {buses.map((bus) => (
          <div key={bus.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <TruckIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {bus.busNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {bus.licensePlate}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleBusStatus(bus.id, bus.isActive)}
                  className={`p-1 rounded-full ${
                    bus.isActive 
                      ? 'text-green-600 hover:bg-green-100' 
                      : 'text-red-600 hover:bg-red-100'
                  }`}
                  title={bus.isActive ? 'Deactivate' : 'Activate'}
                >
                  {bus.isActive ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <XCircleIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingBus(bus);
                    setShowModal(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(bus.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Capacity:</span>
                <span className="font-medium">{bus.capacity} seats</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Model:</span>
                <span className="font-medium">{bus.model || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${
                  bus.isActive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {bus.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {bus.trips && bus.trips.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recent Trips:</span>
                  <span className="font-medium">{bus.trips.length}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {buses.length === 0 && (
        <div className="text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No buses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first bus.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Bus
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Bus Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingBus ? 'Edit Bus' : 'Add New Bus'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                toast.success('Bus form submission would be implemented here');
                setShowModal(false);
                setEditingBus(null);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bus Number
                    </label>
                    <input
                      type="text"
                      defaultValue={editingBus?.busNumber || ''}
                      className="input-field"
                      placeholder="e.g., KA-01-AB-1234"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      License Plate
                    </label>
                    <input
                      type="text"
                      defaultValue={editingBus?.licensePlate || ''}
                      className="input-field"
                      placeholder="e.g., KA-01-AB-1234"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Capacity
                    </label>
                    <input
                      type="number"
                      defaultValue={editingBus?.capacity || ''}
                      className="input-field"
                      placeholder="e.g., 50"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Model
                    </label>
                    <input
                      type="text"
                      defaultValue={editingBus?.model || ''}
                      className="input-field"
                      placeholder="e.g., Volvo B9R"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingBus(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingBus ? 'Update' : 'Add'} Bus
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBuses;
