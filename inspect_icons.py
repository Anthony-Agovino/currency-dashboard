from PIL import Image
import sys

def inspect(filename):
    try:
        img = Image.open(filename)
        img = img.convert("RGBA")
        width, height = img.size
        print(f"File: {filename}, Size: {width}x{height}")
        # Get corner pixels
        corners = [
            img.getpixel((0, 0)),
            img.getpixel((width-1, 0)),
            img.getpixel((0, height-1)),
            img.getpixel((width-1, height-1))
        ]
        print(f"Corners: {corners}")
        
        # Get center pixel of edges
        edges = [
            img.getpixel((width//2, 0)),
            img.getpixel((width-1, height//2)),
            img.getpixel((width//2, height-1)),
            img.getpixel((0, height//2))
        ]
        print(f"Edges: {edges}")
    except Exception as e:
        print(f"Error inspecting {filename}: {e}")

inspect('icons/icon-192.png')
inspect('icons/icon-512.png')
