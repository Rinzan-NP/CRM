from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import LoginSerializer, RegisterSerializer, SalesPersonSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
# Create your views here.

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
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
    queryset = User.objects.filter(role='salesperson')
    serializer_class = SalesPersonSerializer
    permission_classes = [IsAuthenticated]