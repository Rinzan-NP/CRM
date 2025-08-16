
import threading

_current_request = threading.local()

def get_current_user():
    """Get current user from the stored request object"""
    request = getattr(_current_request, 'request', None)
    if request and hasattr(request, 'user'):
        user = request.user
        print(f"🔍 get_current_user() returning: {user} (authenticated: {getattr(user, 'is_authenticated', False)})")
        return user
    print("🔍 get_current_user() returning: None (no request or user)")
    return None

class CurrentUserMiddleware:
    """Store the current request in thread-local storage"""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Store the entire request object
        _current_request.request = request
        print(f"🔧 Middleware storing request with user: {request.user} (authenticated: {getattr(request.user, 'is_authenticated', False)})")
        
        response = self.get_response(request)
        
        # Clean up after request
        if hasattr(_current_request, 'request'):
            delattr(_current_request, 'request')
            
        return response
