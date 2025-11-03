#!/usr/bin/env python3
"""
Backend API Testing for Category Deletion Functionality
Tests all category CRUD operations with focus on deletion scenarios
"""

import requests
import json
import sys
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://bu-github-update.preview.emergentagent.com/api"

class CategoryTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.created_category_id = None
        
    def log_result(self, test_name: str, success: bool, details: str, response_data: Optional[Dict] = None):
        """Log test result with details"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data:
            print(f"   Response: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        print()

    def test_1_list_all_categories(self) -> List[Dict]:
        """Test 1: GET /api/categories/all - List all categories"""
        try:
            response = requests.get(f"{self.base_url}/categories/all", timeout=10)
            
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list):
                    self.log_result(
                        "List All Categories", 
                        True, 
                        f"Successfully retrieved {len(categories)} categories",
                        {"categories_count": len(categories), "sample": categories[:3] if categories else []}
                    )
                    return categories
                else:
                    self.log_result("List All Categories", False, "Response is not a list", response.json())
                    return []
            else:
                self.log_result("List All Categories", False, f"HTTP {response.status_code}", response.json())
                return []
                
        except Exception as e:
            self.log_result("List All Categories", False, f"Request failed: {str(e)}")
            return []

    def test_2_create_test_category(self) -> Optional[str]:
        """Test 2: POST /api/categories - Create a test category"""
        test_category_data = {"name": "Test Kateqoriya"}
        
        try:
            response = requests.post(
                f"{self.base_url}/categories",
                json=test_category_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if "category" in result and "id" in result["category"]:
                    category_id = result["category"]["id"]
                    self.created_category_id = category_id
                    self.log_result(
                        "Create Test Category", 
                        True, 
                        f"Successfully created category with ID: {category_id}",
                        result
                    )
                    return category_id
                else:
                    self.log_result("Create Test Category", False, "No category ID in response", result)
                    return None
            else:
                self.log_result("Create Test Category", False, f"HTTP {response.status_code}", response.json())
                return None
                
        except Exception as e:
            self.log_result("Create Test Category", False, f"Request failed: {str(e)}")
            return None

    def test_3_verify_category_in_list(self, category_id: str) -> bool:
        """Test 3: Verify the created category appears in the list"""
        try:
            response = requests.get(f"{self.base_url}/categories/all", timeout=10)
            
            if response.status_code == 200:
                categories = response.json()
                category_ids = [cat["id"] for cat in categories if isinstance(cat, dict) and "id" in cat]
                
                if category_id in category_ids:
                    self.log_result(
                        "Verify Category in List", 
                        True, 
                        f"Test category {category_id} found in list",
                        {"found": True, "total_categories": len(categories)}
                    )
                    return True
                else:
                    self.log_result(
                        "Verify Category in List", 
                        False, 
                        f"Test category {category_id} NOT found in list",
                        {"found": False, "available_ids": category_ids[:5]}
                    )
                    return False
            else:
                self.log_result("Verify Category in List", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Verify Category in List", False, f"Request failed: {str(e)}")
            return False

    def test_4_delete_test_category_success(self, category_id: str) -> bool:
        """Test 4: DELETE /api/categories/{id} - Successfully delete empty category"""
        try:
            response = requests.delete(f"{self.base_url}/categories/{category_id}", timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                expected_message = "Kateqoriya silindi"
                
                if "message" in result and result["message"] == expected_message:
                    self.log_result(
                        "Delete Test Category (Success)", 
                        True, 
                        f"Successfully deleted category {category_id}",
                        result
                    )
                    return True
                else:
                    self.log_result(
                        "Delete Test Category (Success)", 
                        False, 
                        f"Unexpected message: {result.get('message', 'No message')}",
                        result
                    )
                    return False
            else:
                self.log_result("Delete Test Category (Success)", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Delete Test Category (Success)", False, f"Request failed: {str(e)}")
            return False

    def test_5_verify_category_deleted(self, category_id: str) -> bool:
        """Test 5: Verify the deleted category no longer appears in the list"""
        try:
            response = requests.get(f"{self.base_url}/categories/all", timeout=10)
            
            if response.status_code == 200:
                categories = response.json()
                category_ids = [cat["id"] for cat in categories if isinstance(cat, dict) and "id" in cat]
                
                if category_id not in category_ids:
                    self.log_result(
                        "Verify Category Deleted", 
                        True, 
                        f"Category {category_id} successfully removed from list",
                        {"deleted": True, "remaining_categories": len(categories)}
                    )
                    return True
                else:
                    self.log_result(
                        "Verify Category Deleted", 
                        False, 
                        f"Category {category_id} still exists in list",
                        {"deleted": False, "found_ids": category_ids[:5]}
                    )
                    return False
            else:
                self.log_result("Verify Category Deleted", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Verify Category Deleted", False, f"Request failed: {str(e)}")
            return False

    def test_6_delete_nonexistent_category(self) -> bool:
        """Test 6: DELETE /api/categories/fake-id - Try to delete non-existent category (404 expected)"""
        fake_id = "fake-id-12345"
        
        try:
            response = requests.delete(f"{self.base_url}/categories/{fake_id}", timeout=10)
            
            if response.status_code == 404:
                result = response.json()
                expected_message = "Kateqoriya tapılmadı"
                
                if "detail" in result and result["detail"] == expected_message:
                    self.log_result(
                        "Delete Non-existent Category (404)", 
                        True, 
                        f"Correctly returned 404 for fake ID: {fake_id}",
                        result
                    )
                    return True
                else:
                    self.log_result(
                        "Delete Non-existent Category (404)", 
                        False, 
                        f"Wrong error message: {result.get('detail', 'No detail')}",
                        result
                    )
                    return False
            else:
                self.log_result(
                    "Delete Non-existent Category (404)", 
                    False, 
                    f"Expected 404, got {response.status_code}",
                    response.json()
                )
                return False
                
        except Exception as e:
            self.log_result("Delete Non-existent Category (404)", False, f"Request failed: {str(e)}")
            return False

    def test_7_find_category_with_products(self) -> Optional[str]:
        """Test 7: Find a category that has products (for blocked deletion test)"""
        try:
            # First get all categories
            categories_response = requests.get(f"{self.base_url}/categories/all", timeout=10)
            if categories_response.status_code != 200:
                self.log_result("Find Category with Products", False, "Could not fetch categories")
                return None
                
            categories = categories_response.json()
            
            # Then get all products to see which categories have products
            products_response = requests.get(f"{self.base_url}/products", timeout=10)
            if products_response.status_code != 200:
                self.log_result("Find Category with Products", False, "Could not fetch products")
                return None
                
            products = products_response.json()
            
            # Find categories that have products
            categories_with_products = {}
            for product in products:
                if "category" in product:
                    cat_name = product["category"]
                    categories_with_products[cat_name] = categories_with_products.get(cat_name, 0) + 1
            
            # Find a category ID that has products
            for category in categories:
                if category.get("name") in categories_with_products:
                    product_count = categories_with_products[category["name"]]
                    self.log_result(
                        "Find Category with Products", 
                        True, 
                        f"Found category '{category['name']}' with {product_count} products",
                        {"category_id": category["id"], "category_name": category["name"], "product_count": product_count}
                    )
                    return category["id"]
            
            self.log_result(
                "Find Category with Products", 
                False, 
                "No categories with products found",
                {"total_categories": len(categories), "total_products": len(products)}
            )
            return None
            
        except Exception as e:
            self.log_result("Find Category with Products", False, f"Request failed: {str(e)}")
            return None

    def test_8_delete_category_with_products(self, category_id: str) -> bool:
        """Test 8: DELETE category with products (400 expected - blocked)"""
        try:
            response = requests.delete(f"{self.base_url}/categories/{category_id}", timeout=10)
            
            if response.status_code == 400:
                result = response.json()
                detail = result.get("detail", "")
                
                # Check if the error message mentions products
                if "məhsul" in detail.lower():
                    self.log_result(
                        "Delete Category with Products (Blocked)", 
                        True, 
                        f"Correctly blocked deletion - category has products",
                        result
                    )
                    return True
                else:
                    self.log_result(
                        "Delete Category with Products (Blocked)", 
                        False, 
                        f"Wrong error message: {detail}",
                        result
                    )
                    return False
            else:
                self.log_result(
                    "Delete Category with Products (Blocked)", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    response.json()
                )
                return False
                
        except Exception as e:
            self.log_result("Delete Category with Products (Blocked)", False, f"Request failed: {str(e)}")
            return False

    def test_9_verify_category_still_exists(self, category_id: str) -> bool:
        """Test 9: Verify category with products was NOT deleted"""
        try:
            response = requests.get(f"{self.base_url}/categories/all", timeout=10)
            
            if response.status_code == 200:
                categories = response.json()
                category_ids = [cat["id"] for cat in categories if isinstance(cat, dict) and "id" in cat]
                
                if category_id in category_ids:
                    self.log_result(
                        "Verify Category Still Exists", 
                        True, 
                        f"Category {category_id} correctly preserved (not deleted)",
                        {"preserved": True}
                    )
                    return True
                else:
                    self.log_result(
                        "Verify Category Still Exists", 
                        False, 
                        f"Category {category_id} was incorrectly deleted",
                        {"preserved": False}
                    )
                    return False
            else:
                self.log_result("Verify Category Still Exists", False, f"HTTP {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Verify Category Still Exists", False, f"Request failed: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all category deletion tests in sequence"""
        print("🧪 Starting Category Deletion Functionality Tests")
        print("=" * 60)
        
        # Test 1: List all categories
        categories = self.test_1_list_all_categories()
        
        # Test 2: Create test category
        test_category_id = self.test_2_create_test_category()
        
        if test_category_id:
            # Test 3: Verify category appears in list
            self.test_3_verify_category_in_list(test_category_id)
            
            # Test 4: Delete the test category (success case)
            deletion_success = self.test_4_delete_test_category_success(test_category_id)
            
            if deletion_success:
                # Test 5: Verify category is removed from list
                self.test_5_verify_category_deleted(test_category_id)
        
        # Test 6: Try to delete non-existent category (404 case)
        self.test_6_delete_nonexistent_category()
        
        # Test 7 & 8 & 9: Find category with products and test blocked deletion
        category_with_products = self.test_7_find_category_with_products()
        if category_with_products:
            blocked_deletion = self.test_8_delete_category_with_products(category_with_products)
            if blocked_deletion:
                self.test_9_verify_category_still_exists(category_with_products)
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        return failed_tests == 0

if __name__ == "__main__":
    tester = CategoryTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)