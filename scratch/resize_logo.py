import os
from PIL import Image

logo_path = r"c:\Users\Admin\Downloads\Desktop\public\logo.png"
output_path = r"c:\Users\Admin\Downloads\Desktop\public\logo-512.png"

try:
    if os.path.exists(logo_path):
        with Image.open(logo_path) as img:
            # Resize image to exactly 512x512
            resized_img = img.resize((512, 512), Image.Resampling.LANCZOS)
            resized_img.save(output_path, "PNG")
            print(f"SUCCESS: Resized logo saved to {output_path}")
    else:
        print(f"ERROR: {logo_path} does not exist.")
except Exception as e:
    print(f"EXCEPTION: {str(e)}")
