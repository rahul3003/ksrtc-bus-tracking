import { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  BellIcon,
  BellSlashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const NotificationSettings = ({ isOpen, onClose }) => {
  const { 
    isEnabled, 
    preferences, 
    updatePreferences, 
    enableNotifications, 
    disableNotifications 
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handlePreferenceChange = (key, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    updatePreferences(localPreferences);
    onClose();
  };

  const handleCancel = () => {
    setLocalPreferences(preferences);
    onClose();
  };

  const handleEnableNotifications = async () => {
    const enabled = await enableNotifications();
    if (!enabled) {
      alert('Please allow notifications in your browser settings to receive real-time updates.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Notification Permission Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isEnabled ? (
                  <BellIcon className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <BellSlashIcon className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className="text-sm font-medium text-gray-900">
                  Browser Notifications
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isEnabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {!isEnabled && (
              <button
                onClick={handleEnableNotifications}
                className="mt-2 text-sm text-primary-600 hover:text-primary-500"
              >
                Enable Notifications
              </button>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Notification Types</h4>
            
            {Object.entries(localPreferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {getPreferenceLabel(key)}
                  </label>
                  <p className="text-xs text-gray-500">
                    {getPreferenceDescription(key)}
                  </p>
                </div>
                <button
                  onClick={() => handlePreferenceChange(key, !value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getPreferenceLabel = (key) => {
  const labels = {
    busArrivals: 'Bus Arrivals',
    delays: 'Delays & Delays',
    cancellations: 'Trip Cancellations',
    routeChanges: 'Route Changes',
    tripUpdates: 'Trip Status Updates',
    bookingUpdates: 'Booking Updates',
    systemUpdates: 'System Updates'
  };
  return labels[key] || key;
};

const getPreferenceDescription = (key) => {
  const descriptions = {
    busArrivals: 'Get notified when your bus is approaching',
    delays: 'Receive alerts about delays and disruptions',
    cancellations: 'Be informed about cancelled trips',
    routeChanges: 'Get updates about route modifications',
    tripUpdates: 'Notifications about trip start/completion',
    bookingUpdates: 'Updates about your bookings',
    systemUpdates: 'System maintenance and service updates'
  };
  return descriptions[key] || '';
};

export default NotificationSettings;
