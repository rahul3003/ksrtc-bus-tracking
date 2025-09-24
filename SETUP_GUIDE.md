# KSRTC Bus Tracking System - Enhanced Setup Guide

## 🚀 Enhanced Features Added

### ✅ Google Maps Integration
- **Real-time bus tracking** with live markers on Google Maps
- **Interactive map visualization** showing bus locations, routes, and stops
- **Custom bus and stop markers** with detailed information windows
- **Automatic map centering** and bounds fitting for optimal viewing

### ✅ Real-time Notifications System
- **Browser push notifications** for bus arrivals, delays, and updates
- **Toast notifications** as fallback for unsupported browsers
- **User notification preferences** with granular control
- **Real-time notification delivery** via Socket.IO
- **Notification history** and management

### ✅ Enhanced User Experience
- **Live location updates** with GPS coordinates display
- **Speed and heading information** for tracked buses
- **Notification settings panel** accessible from the main layout
- **Real-time connection status** indicators

## 🛠️ Setup Instructions

### 1. Environment Configuration

#### Backend Environment (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ksrtc_bus_tracking"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=5000
NODE_ENV="development"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

#### Frontend Environment (.env)
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Socket.IO Configuration
VITE_SOCKET_URL=http://localhost:5000

# Google Maps API Key (REQUIRED)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 2. Google Maps API Setup

#### Step 1: Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Geocoding API** (optional, for address lookup)
   - **Places API** (optional, for location search)

#### Step 2: Configure API Key
1. Go to "Credentials" in the Google Cloud Console
2. Create a new API Key
3. Restrict the API key to your domain (recommended for production)
4. Copy the API key and add it to your frontend `.env` file

#### Step 3: Set up Billing (Required)
- Google Maps API requires billing to be enabled
- You get $200 free credits per month
- For development, this should be sufficient

### 3. Installation & Setup

#### Backend Setup
```bash
cd backend
npm install

# Create .env file with your configuration
cp .env.example .env
# Edit .env with your database and other settings

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install

# Create .env file with your configuration
# Add your Google Maps API key to .env
echo "VITE_GOOGLE_MAPS_API_KEY=your_api_key_here" >> .env
echo "VITE_API_URL=http://localhost:5000/api" >> .env
echo "VITE_SOCKET_URL=http://localhost:5000" >> .env

# Start development server
npm run dev
```

### 4. Testing the Enhanced Features

#### Google Maps Integration
1. **Login** to the system with any role
2. **Navigate** to tracking pages:
   - Driver: `/driver/tracking`
   - Passenger: `/passenger/tracking`
3. **Verify** that Google Maps loads correctly
4. **Check** that bus markers appear on the map
5. **Test** map interactions (zoom, pan, marker clicks)

#### Real-time Notifications
1. **Enable notifications** in your browser when prompted
2. **Open notification settings** by clicking the bell icon in the layout
3. **Configure preferences** for different notification types
4. **Test notifications** by:
   - Starting a trip (Driver)
   - Tracking a bus (Passenger)
   - Sending test notifications (Admin)

### 5. Demo Scenarios

#### Scenario 1: Driver Tracking
1. **Login** as driver (`driver1@ksrtc.com` / `driver123`)
2. **Go to** Driver Dashboard
3. **Start a trip** if available
4. **Navigate to** Live Tracking page
5. **Enable location tracking** (requires browser permission)
6. **Observe** real-time location updates on Google Maps

#### Scenario 2: Passenger Tracking
1. **Login** as passenger (`passenger@example.com` / `passenger123`)
2. **Go to** Passenger Dashboard
3. **Navigate to** Track Bus page
4. **Select a trip** to track
5. **View** real-time bus location on Google Maps
6. **Receive notifications** for location updates

#### Scenario 3: Admin Notifications
1. **Login** as admin (`admin@ksrtc.com` / `admin123`)
2. **Send notifications** via API endpoints:
   ```bash
   # Send delay notification
   curl -X POST http://localhost:5000/api/notifications/delay \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "tripId": "trip_id_here",
       "delayMinutes": 15,
       "reason": "Traffic congestion"
     }'
   ```

### 6. Troubleshooting

#### Google Maps Not Loading
- **Check** if API key is correctly set in `.env`
- **Verify** that Maps JavaScript API is enabled
- **Ensure** billing is set up in Google Cloud Console
- **Check** browser console for API errors

#### Notifications Not Working
- **Verify** browser notification permission is granted
- **Check** if Socket.IO connection is established
- **Ensure** notification preferences are enabled
- **Test** with different browsers (Chrome, Firefox, Safari)

#### Real-time Updates Not Working
- **Check** Socket.IO connection status
- **Verify** backend server is running
- **Ensure** CORS is properly configured
- **Check** network connectivity

### 7. Production Deployment

#### Backend Deployment
1. **Set up** PostgreSQL database
2. **Configure** environment variables
3. **Run** database migrations
4. **Deploy** to your preferred platform (Heroku, AWS, etc.)

#### Frontend Deployment
1. **Build** production bundle: `npm run build`
2. **Configure** production environment variables
3. **Deploy** to static hosting (Netlify, Vercel, etc.)
4. **Update** Google Maps API key restrictions for production domain

#### Google Maps API Configuration
1. **Restrict** API key to your production domain
2. **Set up** usage quotas and alerts
3. **Monitor** API usage in Google Cloud Console
4. **Configure** billing alerts

### 8. Additional Features to Implement

#### Future Enhancements
- **Route visualization** with polylines on Google Maps
- **Bus stop markers** with ETA information
- **Traffic layer** integration for real-time traffic data
- **Offline support** for drivers
- **Push notifications** for mobile devices
- **Geofencing** for automatic trip status updates

#### Advanced Notifications
- **SMS notifications** for critical updates
- **Email notifications** for booking confirmations
- **WhatsApp integration** for notifications
- **Custom notification sounds** and vibrations

## 🎯 Key Benefits

### For Passengers
- **Real-time bus tracking** with accurate location data
- **Instant notifications** for delays and updates
- **Interactive maps** for better route understanding
- **Improved journey planning** with live ETAs

### For Drivers
- **Live location broadcasting** to passengers
- **Real-time trip management** with status updates
- **GPS integration** for accurate tracking
- **Notification system** for trip updates

### For Administrators
- **Fleet monitoring** with real-time visibility
- **Notification management** for service updates
- **Performance analytics** with location data
- **Improved service reliability** through better communication

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome** 80+ (Full support)
- **Firefox** 75+ (Full support)
- **Safari** 13+ (Full support)
- **Edge** 80+ (Full support)

### Mobile Support
- **iOS Safari** 13+ (Full support)
- **Android Chrome** 80+ (Full support)
- **Responsive design** for all screen sizes

## 🔒 Security Considerations

### API Key Security
- **Restrict** Google Maps API key to specific domains
- **Use** environment variables for sensitive data
- **Monitor** API usage for unusual activity
- **Rotate** API keys regularly

### Notification Security
- **Validate** user permissions before sending notifications
- **Rate limit** notification sending
- **Sanitize** notification content
- **Log** all notification activities

---

## 🎉 You're All Set!

Your enhanced KSRTC Bus Tracking System now includes:
- ✅ **Google Maps integration** for real-time visualization
- ✅ **Real-time notifications** for better user experience
- ✅ **Live location tracking** with GPS coordinates
- ✅ **Interactive map features** with custom markers
- ✅ **Notification preferences** and settings
- ✅ **Real-time communication** via Socket.IO

The system is now ready for demonstration and can be further enhanced based on your specific requirements!
