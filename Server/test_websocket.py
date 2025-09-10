#!/usr/bin/env python3
"""
Simple WebSocket test script for route tracking
"""

import asyncio
import websockets
import json
import sys

# Test configuration
ROUTE_ID = "14e6f270-ac1e-4878-a806-aa3a9ab3edf7"  # Use the route ID from the logs
TOKEN = "your_jwt_token_here"  # You'll need to get this from login

async def test_websocket():
    """Test WebSocket connection to the route tracking endpoint"""
    
    # WebSocket URL
    ws_url = f"ws://localhost:8000/ws/route-tracking/{ROUTE_ID}/?token={TOKEN}"
    
    print(f"Attempting to connect to: {ws_url}")
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✅ WebSocket connection established!")
            
            # Send a test message
            test_message = {
                "type": "ping",
                "timestamp": "2025-08-23T21:30:00Z"
            }
            
            await websocket.send(json.dumps(test_message))
            print(f"📤 Sent message: {test_message}")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📥 Received response: {response}")
            except asyncio.TimeoutError:
                print("⏰ No response received within 5 seconds")
            
            # Send a location update
            location_message = {
                "type": "location_update",
                "lat": 25.2048,
                "lon": 55.2708,
                "accuracy_meters": 10.0,
                "speed_mps": 0.0,
                "heading_degrees": 0.0
            }
            
            await websocket.send(json.dumps(location_message))
            print(f"📤 Sent location update: {location_message}")
            
            # Wait for broadcast
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📥 Received broadcast: {response}")
            except asyncio.TimeoutError:
                print("⏰ No broadcast received within 5 seconds")
                
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ Connection failed with status code: {e.status_code}")
        if e.status_code == 401:
            print("🔐 Authentication failed - check your JWT token")
        elif e.status_code == 403:
            print("🚫 Access denied - check route permissions")
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ Connection closed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if TOKEN == "your_jwt_token_here":
        print("⚠️  Please update the TOKEN variable with a valid JWT token")
        print("   You can get this by logging in through the frontend")
        sys.exit(1)
    
    asyncio.run(test_websocket())
