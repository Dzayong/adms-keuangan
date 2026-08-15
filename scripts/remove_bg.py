from PIL import Image

def remove_white(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b, a = item
        
        # Calculate how white it is (manhattan distance)
        diff_from_white = (255 - r) + (255 - g) + (255 - b)
        
        if diff_from_white < 30: 
            # Make it fully transparent
            new_data.append((255, 255, 255, 0))
        elif diff_from_white < 120: 
            # Smooth transition for anti-aliased edges
            new_alpha = int(255 * (diff_from_white - 30) / 90)
            # Blend the edge color towards the original color, but keep it transparent
            new_data.append((r, g, b, new_alpha))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(out_path, "PNG")

remove_white("f:/FOLDER AFIFAH/Antigravity Projects/adms-qris/public/logo.png", "f:/FOLDER AFIFAH/Antigravity Projects/adms-qris/public/logo.png")
print("Done")
