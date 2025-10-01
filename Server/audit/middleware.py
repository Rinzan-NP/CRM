from threading import local

# Thread-local storage for current user
_thread_locals = local()


def get_current_user():
    """Get the current user from thread-local storage"""
    return getattr(_thread_locals, 'user', None)


def set_current_user(user):
    """Set the current user in thread-local storage"""
    _thread_locals.user = user


def clear_current_user():
    """Clear the current user from thread-local storage"""
    if hasattr(_thread_locals, 'user'):
        delattr(_thread_locals, 'user')


class CurrentUserMiddleware:
    """
    Middleware to track the current user in thread-local storage.
    This allows the audit system to access the current user even in signals.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Set the current user if authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            set_current_user(request.user)
        else:
            clear_current_user()
        
        response = self.get_response(request)
        
        # Clear the user after the request
        clear_current_user()
        
        return response

