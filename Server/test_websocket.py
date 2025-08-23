#!/usr/bin/env python3
"""
Simple WebSocket test script for route tracking
"""

import asyncio
import websockets
import json
import sys

async def test_websocket():
    """Test WebSocket connection and messaging"""
    
    # Replace with your actual route ID and token
    route_id = "your-route-id-here"
    token = "your-jwt-token-here"
    
    uri = f"ws://localhost:8000/ws/route-tracking/{route_id}/?token={token}"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            
            # Listen for messages
            async def receive_messages():
                while True:
                    try:
                        message = await websocket.recv()
                        data = json.loads(message)
                        print(f"Received: {data}")
                    except websockets.exceptions.ConnectionClosed:
                        print("Connection closed")
                        break
                    except Exception as e:
                        print(f"Error receiving message: {e}")
                        break
            
            # Send test location update
            async def send_test_location():
                await asyncio.sleep(1)  # Wait for connection to establish
                
                test_location = {
                    "type": "location_update",
                    "lat": 25.2048,
                    "lon": 55.2708,
                    "accuracy_meters": 10.0,
                    "speed_mps": 5.0,
                    "heading_degrees": 90.0
                }
                
                await websocket.send(json.dumps(test_location))
                print(f"Sent test location: {test_location}")
            
            # Run both tasks
            await asyncio.gather(
                receive_messages(),
                send_test_location()
            )
            
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    print("WebSocket Test Script")
    print("Make sure to update route_id and token in the script")
    print("Starting test...")
    
    asyncio.run(test_websocket())
