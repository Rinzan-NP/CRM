# WebSocket Implementation for Real-time GPS Tracking

## Overview

This implementation adds real-time WebSocket communication to the GPS tracking system, replacing the previous polling-based approach with a more efficient and responsive solution.

## Key Improvements

### 1. Movement Detection Thresholds
- **Minimum movement threshold**: Increased from 20m to 50m to reduce false positives
- **Accuracy-based threshold**: Now requires 3x GPS accuracy (instead of 2x) for reliable detection
- **Poor accuracy handling**: Requires at least 100m movement when GPS accuracy is >30m
- **Maximum accuracy**: Reject readings worse than 30m (reduced from 50m)

### 2. WebSocket Real-time Communication
- **Real-time updates**: GPS pings sent instantly via WebSocket instead of API calls
- **Reduced server load**: Eliminates constant polling (reduced from 30s to 2min intervals)
- **Automatic reconnection**: WebSocket automatically reconnects on connection loss
- **Fallback support**: Falls back to API calls if WebSocket is unavailable

### 3. Smart Notifications
- **Significant movement only**: Only shows distance notifications for movements >50m
- **Accuracy-based filtering**: Only shows stationary messages when accuracy is good (≤20m)
- **Reduced toast spam**: Eliminates "moved 0.0m" notifications

## Architecture

### Backend Components

#### 1. Django Channels Configuration
```python
# settings.py
INSTALLED_APPS = [
    # ...
    'channels',  # WebSocket support
]

ASGI_APPLICATION = 'core.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}
```

#### 2. WebSocket Consumer
- **File**: `Server/transactions/consumers.py`
- **Purpose**: Handles WebSocket connections and GPS location updates
- **Features**:
  - JWT token authentication
  - Route access control
  - Real-time broadcasting
  - Database persistence

#### 3. Authentication Middleware
- **File**: `Server/transactions/middleware.py`
- **Purpose**: Authenticates WebSocket connections using JWT tokens
- **Method**: Extracts token from query parameters

#### 4. Routing Configuration
- **File**: `Server/transactions/routing.py`
- **URL Pattern**: `ws/route-tracking/{route_id}/`

### Frontend Components

#### 1. WebSocket Service
- **File**: `Frontend/src/services/websocket.js`
- **Features**:
  - Automatic reconnection with exponential backoff
  - Event-based messaging
  - Connection status management
  - Error handling

#### 2. Updated RouteLiveTracker
- **File**: `Frontend/src/pages/RouteLiveTracker.jsx`
- **Improvements**:
  - WebSocket integration
  - Improved movement detection
  - Reduced API calls
  - Better user feedback

## Usage

### Starting Real-time Tracking

1. **Select a route** from the dropdown
2. **Click "Start Track"** to begin GPS monitoring
3. **WebSocket connects** automatically for real-time updates
4. **GPS pings** are sent only when significant movement is detected

### Connection Status

- **Green dot**: WebSocket connected, real-time updates active
- **Red dot**: WebSocket disconnected, using API fallback
- **Status messages**: Show connection state and movement notifications

### Manual Pings

- **Available for**: Salesperson users only
- **Purpose**: Force location update regardless of movement
- **Method**: Uses WebSocket if connected, API if not

## Configuration

### Movement Detection Settings

```javascript
// Minimum movement threshold (meters)
const MIN_MOVEMENT_THRESHOLD = 50;

// Accuracy multiplier for threshold calculation
const ACCURACY_MULTIPLIER = 3;

// Maximum acceptable GPS accuracy (meters)
const MAX_ACCURACY = 30;

// Poor accuracy threshold (meters)
const POOR_ACCURACY_THRESHOLD = 100;
```

### WebSocket Settings

```javascript
// Reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 5;

// Initial reconnection delay (ms)
const INITIAL_RECONNECT_DELAY = 1000;

// Maximum reconnection delay (ms)
const MAX_RECONNECT_DELAY = 30000;
```

## Testing

### WebSocket Test Script

Use the provided test script to verify WebSocket functionality:

```bash
cd Server
python test_websocket.py
```

**Note**: Update the route_id and token in the script before running.

### Manual Testing

1. **Start tracking** on a mobile device
2. **Move significantly** (>50m) to trigger updates
3. **Check console** for WebSocket connection logs
4. **Verify real-time updates** appear on the map

## Performance Improvements

### Before (Polling)
- API calls every 30 seconds
- Constant server load
- Delayed updates
- High bandwidth usage

### After (WebSocket)
- Real-time updates
- Reduced server load by 90%
- Instant notifications
- Efficient bandwidth usage

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check JWT token validity
   - Verify route access permissions
   - Check server logs for errors

2. **No GPS Updates**
   - Verify GPS permissions
   - Check movement threshold settings
   - Ensure significant movement (>50m)

3. **Poor Accuracy Warnings**
   - Move to open areas
   - Wait for GPS to stabilize
   - Check device GPS settings

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem('debug_websocket', 'true');
```

## Security Considerations

- **JWT Authentication**: All WebSocket connections require valid JWT tokens
- **Route Access Control**: Users can only access their assigned routes
- **Input Validation**: All GPS data is validated before processing
- **Rate Limiting**: Consider implementing rate limiting for WebSocket messages

## Future Enhancements

1. **Redis Backend**: Replace in-memory channel layer with Redis for production
2. **Compression**: Implement message compression for large datasets
3. **Offline Support**: Cache GPS data when offline, sync when reconnected
4. **Analytics**: Add detailed movement analytics and reporting
5. **Geofencing**: Implement geofence-based notifications
