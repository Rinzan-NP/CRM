import threading

_thread_locals = threading.local()

def get_current_user():
    user = getattr(_thread_locals, 'user', None)
    print(f"Middleware get_current_user() returning: {user}")
    return user

class CurrentUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = request.user
        print(f"Middleware setting user: {request.user}")
        response = self.get_response(request)
        return response