import requests
from django.conf import settings
from typing import Optional, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class LocationService:
    """Service for handling location-related operations"""
    
    @staticmethod
    def geocode_address(address: str) -> Optional[Dict[str, float]]:
        """
        Convert address to GPS coordinates using OpenStreetMap Nominatim API
        Returns: {'lat': float, 'lon': float} or None if failed
        """
        try:
            # Use OpenStreetMap Nominatim API (free, no API key required)
            base_url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': address,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }
            
            response = requests.get(base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data and len(data) > 0:
                result = data[0]
                return {
                    'lat': float(result['lat']),
                    'lon': float(result['lon']),
                    'display_name': result.get('display_name', ''),
                    'address': result.get('address', {})
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Geocoding failed for address '{address}': {str(e)}")
            return None
    
    @staticmethod
    def reverse_geocode(lat: float, lon: float) -> Optional[Dict]:
        """
        Convert GPS coordinates to address using OpenStreetMap Nominatim API
        Returns: Address details or None if failed
        """
        try:
            base_url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                'lat': lat,
                'lon': lon,
                'format': 'json',
                'addressdetails': 1
            }
            
            response = requests.get(base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data and 'address' in data:
                return {
                    'display_name': data.get('display_name', ''),
                    'address': data.get('address', {}),
                    'lat': lat,
                    'lon': lon
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Reverse geocoding failed for coordinates ({lat}, {lon}): {str(e)}")
            return None
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two GPS coordinates using Haversine formula
        Returns: Distance in kilometers
        """
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
    
    @staticmethod
    def find_nearby_customers(customer_lat: float, customer_lon: float, 
                             all_customers, radius_km: float = 10.0) -> list:
        """
        Find customers within a specified radius of given coordinates
        Returns: List of customers within radius
        """
        nearby = []
        
        for customer in all_customers:
            if customer.has_coordinates:
                distance = LocationService.calculate_distance(
                    customer_lat, customer_lon,
                    float(customer.lat), float(customer.lon)
                )
                
                if distance <= radius_km:
                    customer.distance_km = round(distance, 2)
                    nearby.append(customer)
        
        # Sort by distance
        nearby.sort(key=lambda x: x.distance_km)
        return nearby
    
    @staticmethod
    def validate_coordinates(lat: float, lon: float) -> bool:
        """Validate if coordinates are within valid ranges"""
        return -90 <= lat <= 90 and -180 <= lon <= 180
