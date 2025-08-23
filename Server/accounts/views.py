from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import LoginSerializer, RegisterSerializer, SalesPersonSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from base.permissions import IsNotBlocked,IsAdminUser
from rest_framework.views import APIView
from rest_framework import status
# Create your views here.

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email    = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        if user.blocked:
            return Response({"detail": "User is blocked"}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access" : str(refresh.access_token),
            "user"   : {
                "email": user.email,
                "role": user.role
            }
        })


class SalesPersonListView(generics.ListAPIView):
    queryset = User.objects.filter(role__in=['salesperson', 'admin'])
    serializer_class = SalesPersonSerializer
    permission_classes = [IsAuthenticated]
    

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    

class UserBlockAndUnblock(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user_id = request.data.get("user_id")
        action = request.data.get("action")
        print(request.data)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if action == "block":
            user.blocked = True
        elif action == "unblock":
            user.blocked = False
        else:
            return Response({"detail": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        user.save()
        return Response({"detail": "User status updated"}, status=status.HTTP_200_OK)
    
    
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'email': user.email,
            'role': getattr(user, 'role', ''),
            'first_name': getattr(user, 'first_name', ''),
            'last_name': getattr(user, 'last_name', ''),
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })