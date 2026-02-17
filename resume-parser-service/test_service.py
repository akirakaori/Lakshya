"""
Quick test script to verify the resume parser service is working.
Run this AFTER starting the FastAPI service with: python main.py
"""
import requests
import json

# Test configuration
PARSER_URL = "http://localhost:8000"
TEST_RESUME_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"  # Replace with actual resume URL

def test_health_check():
    """Test if the service is running and healthy"""
    print("=" * 60)
    print("TEST 1: Health Check")
    print("=" * 60)
    
    try:
        response = requests.get(f"{PARSER_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        data = response.json()
        assert data.get("status") == "healthy", "Service is not healthy"
        assert data.get("spacy_loaded") == True, "spaCy model not loaded"
        
        print("✅ Health check PASSED\n")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to parser service")
        print("   Make sure to start the service first:")
        print("   cd resume-parser-service")
        print("   python main.py\n")
        return False
    except Exception as e:
        print(f"❌ Health check FAILED: {e}\n")
        return False

def test_parse_resume():
    """Test resume parsing with a sample URL"""
    print("=" * 60)
    print("TEST 2: Parse Resume")
    print("=" * 60)
    print(f"Resume URL: {TEST_RESUME_URL}")
    print()
    
    try:
        response = requests.post(
            f"{PARSER_URL}/parse-resume",
            json={"resumeUrl": TEST_RESUME_URL},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n📄 Parsed Resume Data:")
            print("-" * 60)
            print(f"Title: {data.get('title', '(not found)')}")
            print(f"Skills: {', '.join(data.get('skills', [])) or '(none found)'}")
            print(f"Experience Years: {data.get('experienceYears', 0)}")
            print(f"\nEducation:\n{data.get('education', '(not found)')[:200]}")
            print(f"\nExperience:\n{data.get('experience', '(not found)')[:200]}")
            print(f"\nSummary:\n{data.get('summary', '(not found)')[:200]}")
            print("-" * 60)
            print("✅ Parse resume PASSED\n")
            return True
        else:
            print(f"❌ Parse resume FAILED: {response.text}\n")
            return False
            
    except Exception as e:
        print(f"❌ Parse resume FAILED: {e}\n")
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("RESUME PARSER SERVICE - TEST SUITE")
    print("=" * 60)
    print()
    
    # Test 1: Health check
    if not test_health_check():
        print("⚠️  Service is not running. Tests aborted.")
        print("\nTo start the service:")
        print("  cd resume-parser-service")
        print("  venv\\Scripts\\activate (Windows) or source venv/bin/activate (Mac/Linux)")
        print("  python main.py")
        return
    
    # Test 2: Parse resume (only if you have a test resume URL)
    print("📝 To test with a real resume:")
    print("   1. Upload a resume to Cloudinary")
    print("   2. Edit this file and set TEST_RESUME_URL variable")
    print("   3. Run this script again")
    print()
    
    # Uncomment to test parsing
    # test_parse_resume()
    
    print("=" * 60)
    print("✅ ALL TESTS COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
