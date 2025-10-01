from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    date = serializers.DateTimeField(source="date_joined", read_only=True, format="%d-%m-%Y %H:%M")
    
    
    class Meta:
        model  = User
        fields = ("id", "email", "password", "role","company","date")
        
        read_only_fields = ("id","company","date")

    def create(self, validated_data):
        try:
            user = User.objects.create_user(
                email=validated_data["email"],
                username=validated_data["email"],  
                password=validated_data["password"],  # Default password
                company=self.context['request'].user.company,  # Assign company from request.user
                role=validated_data.get("role", "Salesperson"),
            )
            return user
        except Exception as e:
            raise serializers.ValidationError({"detail": str(e)})


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