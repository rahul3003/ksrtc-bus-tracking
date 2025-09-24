# Google Maps API Setup Guide

## 🗺️ Google Maps API Key Setup

### Step 1: Get Google Cloud Console Access
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one

### Step 2: Enable Required APIs
1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search and enable the following APIs:
   - **Maps JavaScript API** (Required for map display)
   - **Geocoding API** (Optional, for address lookup)
   - **Places API** (Optional, for location search)

### Step 3: Create API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**
3. Copy the generated API key

### Step 4: Secure Your API Key (Recommended)
1. Click on your API key to edit it
2. Under **Application restrictions**, select **HTTP referrers**
3. Add your domain(s):
   - `http://localhost:5173/*` (for development)
   - `https://yourdomain.com/*` (for production)
4. Under **API restrictions**, select **Restrict key**
5. Choose the APIs you enabled (Maps JavaScript API, etc.)

### Step 5: Set Up Billing
⚠️ **Important**: Google Maps API requires billing to be enabled
1. Go to **Billing** in the Google Cloud Console
2. Link a payment method
3. You get $200 free credits per month
4. Set up billing alerts to monitor usage

## 🔧 Frontend Configuration

### Step 1: Create Frontend Environment File
In your `frontend` directory, create a file named `.env`:

```bash
cd frontend
cp env-config.txt .env
```

### Step 2: Add Your API Key
Edit the `.env` file and replace `your_google_maps_api_key_here` with your actual API key:

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Socket.IO Configuration
VITE_SOCKET_URL=http://localhost:5000

# Google Maps API Key (REQUIRED)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart Development Server
After adding the API key, restart your frontend development server:

```bash
npm run dev
```

## 🧪 Testing Google Maps Integration

### Test the Integration
1. **Start both servers**:
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

2. **Login to the system** with any role
3. **Navigate to tracking pages**:
   - Driver: `/driver/tracking`
   - Passenger: `/passenger/tracking`
4. **Verify Google Maps loads** correctly
5. **Check for bus markers** on the map

### Expected Behavior
- ✅ Google Maps loads without errors
- ✅ Bus markers appear on the map
- ✅ Map is interactive (zoom, pan, click)
- ✅ Info windows show bus details
- ✅ No console errors related to Google Maps

## 🚨 Troubleshooting

### Common Issues

#### 1. "Google Maps API Key Required" Message
**Problem**: The map shows a placeholder instead of Google Maps
**Solution**: 
- Check if API key is correctly set in `.env`
- Ensure the API key is valid
- Restart the development server

#### 2. "This page can't load Google Maps correctly"
**Problem**: Google Maps fails to load
**Solution**:
- Verify API key is correct
- Check if Maps JavaScript API is enabled
- Ensure billing is set up
- Check browser console for specific errors

#### 3. "RefererNotAllowedMapError"
**Problem**: API key restrictions are too strict
**Solution**:
- Add `http://localhost:5173/*` to HTTP referrers
- Or temporarily remove restrictions for testing

#### 4. "BillingNotEnabledMapError"
**Problem**: Billing is not enabled
**Solution**:
- Enable billing in Google Cloud Console
- Add a payment method
- Wait a few minutes for changes to take effect

### Debug Steps
1. **Check browser console** for error messages
2. **Verify API key** in Google Cloud Console
3. **Test API key** in a simple HTML file
4. **Check billing status** in Google Cloud Console
5. **Verify API restrictions** are correct

## 💰 Cost Management

### Free Tier Limits
- **$200 free credits** per month
- **Maps JavaScript API**: $7 per 1,000 loads
- **Geocoding API**: $5 per 1,000 requests

### Cost Optimization
1. **Set up billing alerts** to monitor usage
2. **Use API restrictions** to prevent unauthorized use
3. **Monitor usage** in Google Cloud Console
4. **Consider caching** for frequently accessed data

### Development vs Production
- **Development**: Use localhost restrictions
- **Production**: Use domain-specific restrictions
- **Testing**: Use separate API keys for different environments

## 🔒 Security Best Practices

### API Key Security
1. **Never commit API keys** to version control
2. **Use environment variables** for API keys
3. **Restrict API keys** to specific domains
4. **Rotate API keys** regularly
5. **Monitor API usage** for unusual activity

### Production Deployment
1. **Use domain restrictions** for production API keys
2. **Set up monitoring** and alerts
3. **Implement rate limiting** if needed
4. **Use HTTPS** for all production traffic

## 📱 Mobile Considerations

### Mobile Optimization
- **Responsive design** works on all devices
- **Touch interactions** are supported
- **GPS integration** works on mobile browsers
- **Offline capabilities** can be added later

### PWA Support
- **Service workers** can cache map tiles
- **Offline maps** can be implemented
- **Push notifications** work on mobile

## 🎯 Next Steps

After setting up Google Maps API:

1. **Test all map features**:
   - Bus tracking
   - Route visualization
   - Stop markers
   - Real-time updates

2. **Customize map styling** (optional):
   - Custom map themes
   - Brand colors
   - Custom markers

3. **Add advanced features** (optional):
   - Traffic layer
   - Street view
   - Directions
   - Places search

## 📞 Support

If you encounter issues:
1. **Check Google Cloud Console** for API status
2. **Review Google Maps documentation**
3. **Check browser console** for errors
4. **Verify billing and quotas**

Your KSRTC Bus Tracking System will now have full Google Maps integration with real-time bus tracking capabilities!
