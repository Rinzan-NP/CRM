from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model  = User
        fields = ("id", "email", "password", "role","company")

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["email"],  
            password=validated_data["password"],
             company=validated_data["company"],
            role=validated_data.get("role", "Salesperson"),
        )
        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    

class SalesPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "role", "company")

class UserSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source="date_joined", read_only=True, format="%d-%m-%Y %H:%M")
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = User
        fields = ("email", "role", "blocked", "date", "id", "company_name")