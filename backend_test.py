import requests
import sys
import json
from datetime import datetime

class GearGuardAPITester:
    def __init__(self, base_url="https://gear-guard.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.team_id = None
        self.equipment_id = None
        self.request_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "name": f"Test Manager {timestamp}",
            "email": f"manager{timestamp}@test.com",
            "password": "password123",
            "role": "manager"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing test user"""
        login_data = {
            "email": "manager@test.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_dashboard_analytics(self):
        """Test dashboard analytics endpoint"""
        success, response = self.run_test(
            "Dashboard Analytics",
            "GET",
            "analytics/dashboard",
            200
        )
        
        if success:
            required_fields = ['stage_counts', 'total_requests', 'total_equipment']
            for field in required_fields:
                if field not in response:
                    print(f"   Missing field: {field}")
                    return False
            print(f"   Analytics data: {json.dumps(response, indent=2)[:200]}...")
        return success

    def test_create_team(self):
        """Test team creation"""
        team_data = {
            "name": "Test Electricians",
            "description": "Test electrical maintenance team",
            "member_ids": []
        }
        
        success, response = self.run_test(
            "Create Team",
            "POST",
            "teams",
            200,
            data=team_data
        )
        
        if success and 'id' in response:
            self.team_id = response['id']
            print(f"   Team created with ID: {self.team_id}")
            return True
        return False

    def test_get_teams(self):
        """Test getting all teams"""
        success, response = self.run_test(
            "Get Teams",
            "GET",
            "teams",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} teams")
            return True
        return False

    def test_create_equipment(self):
        """Test equipment creation"""
        equipment_data = {
            "name": "Test Generator",
            "serial_number": f"GEN-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "location": "Building A, Floor 1",
            "department": "Production",
            "category": "Machinery",
            "assigned_team_id": self.team_id,
            "employee_owner": "John Doe"
        }
        
        success, response = self.run_test(
            "Create Equipment",
            "POST",
            "equipment",
            200,
            data=equipment_data
        )
        
        if success and 'id' in response:
            self.equipment_id = response['id']
            print(f"   Equipment created with ID: {self.equipment_id}")
            return True
        return False

    def test_get_equipment(self):
        """Test getting all equipment"""
        success, response = self.run_test(
            "Get Equipment",
            "GET",
            "equipment",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} equipment items")
            # Check if equipment has team and open_request_count
            if response:
                eq = response[0]
                if 'open_request_count' in eq:
                    print(f"   Smart maintenance count working: {eq['open_request_count']}")
            return True
        return False

    def test_create_maintenance_request(self):
        """Test maintenance request creation"""
        if not self.equipment_id:
            print("   Skipping - No equipment ID available")
            return False
            
        request_data = {
            "subject": "Test Corrective Maintenance",
            "description": "Testing equipment breakdown repair",
            "equipment_id": self.equipment_id,
            "request_type": "corrective",
            "priority": "high"
        }
        
        success, response = self.run_test(
            "Create Maintenance Request",
            "POST",
            "requests",
            200,
            data=request_data
        )
        
        if success and 'id' in response:
            self.request_id = response['id']
            print(f"   Request created with ID: {self.request_id}")
            # Check auto-fill functionality
            if response.get('team_name'):
                print(f"   Auto-filled team: {response['team_name']}")
            if response.get('equipment_name'):
                print(f"   Auto-filled equipment: {response['equipment_name']}")
            return True
        return False

    def test_kanban_stage_update(self):
        """Test Kanban drag-drop stage update"""
        if not self.request_id:
            print("   Skipping - No request ID available")
            return False
            
        # Use query parameter for stage
        success, response = self.run_test(
            "Update Request Stage (Kanban)",
            "PATCH",
            f"requests/{self.request_id}/stage?stage=in_progress",
            200
        )
        
        if success and response.get('stage') == 'in_progress':
            print(f"   Stage updated to: {response['stage']}")
            return True
        return False

    def test_calendar_requests(self):
        """Test calendar requests endpoint"""
        success, response = self.run_test(
            "Get Calendar Requests",
            "GET",
            "requests/calendar",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} calendar requests")
            return True
        return False

    def test_create_preventive_maintenance(self):
        """Test creating preventive maintenance request"""
        if not self.equipment_id:
            print("   Skipping - No equipment ID available")
            return False
            
        request_data = {
            "subject": "Monthly Inspection",
            "description": "Routine preventive maintenance check",
            "equipment_id": self.equipment_id,
            "request_type": "preventive",
            "scheduled_date": "2025-02-15",
            "priority": "medium"
        }
        
        success, response = self.run_test(
            "Create Preventive Maintenance",
            "POST",
            "requests",
            200,
            data=request_data
        )
        
        if success and 'id' in response:
            print(f"   Preventive request created with ID: {response['id']}")
            return True
        return False

    def test_analytics_reports(self):
        """Test analytics reports endpoints"""
        endpoints = [
            ("Requests by Category", "analytics/requests-by-category"),
            ("Requests by Team", "analytics/requests-by-team")
        ]
        
        all_passed = True
        for name, endpoint in endpoints:
            success, response = self.run_test(
                name,
                "GET",
                endpoint,
                200
            )
            if success and isinstance(response, list):
                print(f"   {name}: {len(response)} items")
            else:
                all_passed = False
        
        return all_passed

def main():
    print("🚀 Starting GearGuard API Testing...")
    tester = GearGuardAPITester()
    
    # Test sequence
    tests = [
        ("User Registration", tester.test_user_registration),
        ("User Login", tester.test_user_login),
        ("Dashboard Analytics", tester.test_dashboard_analytics),
        ("Create Team", tester.test_create_team),
        ("Get Teams", tester.test_get_teams),
        ("Create Equipment", tester.test_create_equipment),
        ("Get Equipment", tester.test_get_equipment),
        ("Create Maintenance Request", tester.test_create_maintenance_request),
        ("Kanban Stage Update", tester.test_kanban_stage_update),
        ("Calendar Requests", tester.test_calendar_requests),
        ("Create Preventive Maintenance", tester.test_create_preventive_maintenance),
        ("Analytics Reports", tester.test_analytics_reports)
    ]
    
    print(f"\n📋 Running {len(tests)} test scenarios...")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print(f"\n📊 Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())