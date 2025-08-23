class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.listeners = new Map();
  }

  connect(routeId, token) {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/route-tracking/${routeId}/?token=${token}`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        this.socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect(this.currentRouteId, this.currentToken)
          .catch(error => {
            console.error('WebSocket reconnect failed:', error);
          });
      }
    }, delay);
  }

  sendLocationUpdate(locationData) {
    if (this.socket && this.isConnected) {
      const message = {
        type: 'location_update',
        ...locationData
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send location update');
    }
  }

  sendPing() {
    if (this.socket && this.isConnected) {
      const message = {
        type: 'ping',
        timestamp: new Date().toISOString()
      };
      this.socket.send(JSON.stringify(message));
    }
  }

  handleMessage(data) {
    const { type } = data;
    
    switch (type) {
      case 'connection_established':
        console.log('WebSocket connection established:', data.message);
        break;
        
      case 'location_update':
        this.notifyListeners('location_update', data.data);
        break;
        
      case 'pong':
        console.log('Received pong from server');
        break;
        
      case 'error':
        console.error('WebSocket error from server:', data.message);
        this.notifyListeners('error', data.message);
        break;
        
      default:
        console.log('Unknown WebSocket message type:', type);
    }
  }

  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  // Keep track of current connection details for reconnection
  setConnectionDetails(routeId, token) {
    this.currentRouteId = routeId;
    this.currentToken = token;
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
