import json

from django.test import TestCase

from .models import User
from .auth import create_access_token


class AuthAndRbacTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="fleet@example.com",
            password="StrongPassword123!",
            role=User.Role.FLEET_MANAGER,
        )

    def test_login_and_protected_vehicle_endpoint_accept_bearer_token(self):
        login_response = self.client.post(
            "/api/v1/auth/login",
            data=json.dumps({"email": "fleet@example.com", "password": "StrongPassword123!"}),
            content_type="application/json",
        )
        self.assertEqual(login_response.status_code, 200)
        token = login_response.json()["access_token"]

        vehicles_response = self.client.get(
            "/api/v1/vehicles",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(vehicles_response.status_code, 200)
