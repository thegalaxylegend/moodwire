import os
from PIL import Image

logo_path = r"c:\Users\Admin\Downloads\Desktop\public\logo.png"
output_path = r"c:\Users\Admin\Downloads\Desktop\public\feature-graphic.png"

try:
    if os.path.exists(logo_path):
        # 1. Create a solid pure black background of 1024x500
        bg_color = (0, 0, 0)
        canvas = Image.new("RGB", (1024, 500), bg_color)
        
        # 2. Open and resize the logo preserving aspect ratio (perfect square to perfect circle)
        with Image.open(logo_path) as logo_img:
            logo_resized = logo_img.resize((450, 450), Image.Resampling.LANCZOS)
            
            # 3. Calculate centering coordinates
            x_pos = (1024 - 450) // 2
            y_pos = (500 - 450) // 2
            
            # 4. Paste the logo in the center
            canvas.paste(logo_resized, (x_pos, y_pos))
            
            # 5. Save the final image
            canvas.save(output_path, "PNG")
            print(f"SUCCESS: Created centered pure black feature-graphic at {output_path}")
    else:
        print(f"ERROR: {logo_path} does not exist.")
except Exception as e:
    print(f"EXCEPTION: {str(e)}")
