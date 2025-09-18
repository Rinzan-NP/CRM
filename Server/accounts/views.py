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
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

    def post(self, request, *args, **kwargs):
        print("Request data:", request.data)  # Debugging output
        response = super().post(request, *args, **kwargs)
        print("Response status code:", response.status_code)  # Debugging output
        print("Response data:", response.data)  # Debugging output
        return response

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if user is None:
            print("Authentication failed for email:", email)  # Debugging output
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        if user.blocked:
            print("User is blocked:", email)  # Debugging output
            return Response({"detail": "User is blocked"}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "email": user.email,
                "role": user.role,
                "company": user.company.name
            }
        })

class SalesPersonListView(generics.ListAPIView):
    serializer_class = SalesPersonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(role__in=['salesperson'], company=user.company)

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(company=user.company)

class UserBlockAndUnblock(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user_id = request.data.get("user_id")
        action = request.data.get("action")

        try:
            user = User.objects.get(id=user_id, company=request.user.company)
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