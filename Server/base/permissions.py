from rest_framework.permissions import IsAuthenticated

class IsNotBlocked(IsAuthenticated):
    """
    Allows access only to authenticated users who are not blocked.
    """

    def has_permission(self, request, view):
        # First check the normal IsAuthenticated
        is_authenticated = super().has_permission(request, view)

        # Then check if the user is not blocked
        return is_authenticated and not getattr(request.user, "blocked", False)

class IsAdminUser(IsAuthenticated):
    """
    Allows access only to authenticated admin users who are not blocked.
    """
    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        user = request.user
        return (
            is_authenticated
            and getattr(user, "role", None) == "admin"
            and not getattr(user, "blocked", False)
        )
    
    
class IsAccountant(IsAuthenticated):
    """
    Allows access only to authenticated accountant users who are not blocked.
    """
    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        user = request.user
        return (
            is_authenticated
            and getattr(user, "role", None) in ["accountant", "admin"]
            and not getattr(user, "blocked", False)
        )
        
class IsSalesPerson(IsAuthenticated):
    """
    Allows access only to authenticated sales person users who are not blocked.
    """
    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        user = request.user
        return (
            is_authenticated
            and getattr(user, "role", None) in ["salesperson", "admin"]
            and not getattr(user, "blocked", False)
        )