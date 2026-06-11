import os
from dotenv import load_dotenv
load_dotenv(r'c:\Users\Admin\OneDrive\Desktop\lofi-automation\.env')
key = os.getenv('GEMINI_API_KEY_1')

print("Using API Key starting with:", key[:10] + "...")

try:
    from google import genai
    from PIL import Image

    client = genai.Client(api_key=key)

    print("Requesting image from gemini-2.5-flash-image...")
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=["a cute lo-fi cat studying at a desk"],
    )

    print("Response received! Parsing...")
    for part in response.parts:
        if part.inline_data is not None:
            image = part.as_image()
            image.save("test_gemini_output.jpg")
            print("SUCCESS! Saved as test_gemini_output.jpg")
            break
except Exception as e:
    print("\n--- ERROR OCCURRED ---")
    print(type(e).__name__)
    print(str(e))
