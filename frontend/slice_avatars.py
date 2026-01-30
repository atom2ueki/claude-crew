from PIL import Image
import os
import sys

# Source path from the artifact
source_path = '/Users/tonyli@sphnet.com.sg/.gemini/antigravity/brain/f71349b7-37e0-4062-a965-0681c9c1ee7e/pixel_art_avatar_set_1769688752696.png'
dest_dir = 'public/avatars'

try:
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)

    img = Image.open(source_path)
    width, height = img.size
    # Assuming 2x2 grid
    w, h = width // 2, height // 2

    avatars = [
        (0, 0, w, h, 'technical_architect.png'),
        (w, 0, width, h, 'researcher.png'),
        (0, h, w, height, 'cvpr_researcher.png'),
        (w, h, width, height, 'critical_reviewer.png')
    ]

    for x1, y1, x2, y2, name in avatars:
        crop = img.crop((x1, y1, x2, y2))
        crop.save(os.path.join(dest_dir, name))
        print(f"Saved {name}")

except ImportError:
    print("Pillow not found. Please install with: pip install Pillow")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
