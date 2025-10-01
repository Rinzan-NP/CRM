# CRM Frontend

A React-based CRM application built with Vite, featuring customer management, invoice processing, and route optimization.

## Features

- Customer Management with location mapping
- Invoice creation and editing with print functionality
- Sales order management
- Route optimization and tracking
- Real-time analytics and reporting

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```env
# Google Maps API Key (required for location features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:3000/api
```

3. Get a Google Maps API key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Create a new project or select an existing one
   - Enable the Maps JavaScript API
   - Create credentials (API key)
   - Add the API key to your `.env` file

4. Start the development server:
```bash
npm run dev
```

## Google Maps Configuration

The application uses Google Maps for location-based features. Make sure to:

1. Enable the following APIs in Google Cloud Console:
   - Maps JavaScript API
   - Places API (for location search)
   - Geocoding API (for address conversion)

2. Configure API key restrictions for security:
   - HTTP referrers (for web applications)
   - Specific domains/IPs for production

## Recent Updates

### Invoice Management
- ✅ Separate edit modal for invoice editing
- ✅ Print functionality for invoices
- ✅ Improved form validation and error handling

### Map Integration
- ✅ Fixed useEffect import error in MapLocationPicker
- ✅ Added inline mode support for embedded maps
- ✅ Enhanced loading states and error handling
- ✅ Improved location selection workflow
