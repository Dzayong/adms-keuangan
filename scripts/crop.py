from PIL import Image, ImageChops

def trim_white_bg(image_path, out_path):
    img = Image.open(image_path).convert("RGB")
    bg = Image.new("RGB", img.size, (255, 255, 255))
    diff = ImageChops.difference(img, bg)
    # Add diff to itself to increase contrast and avoid missing faint edges
    diff = ImageChops.add(diff, diff, 2.0, -100)
    
    bbox = diff.getbbox()
    if bbox:
        # crop the original image using the bounding box
        img = Image.open(image_path) # open original again to keep potential RGBA
        cropped = img.crop(bbox)
        
        # Add a tiny 4px padding so it doesn't touch the very edge
        padding = 4
        padded = Image.new(img.mode, (cropped.width + padding*2, cropped.height + padding*2), (255, 255, 255, 255))
        padded.paste(cropped, (padding, padding))
        padded.save(out_path, "PNG")
        print("Cropped successfully.")
    else:
        print("No bounding box found.")

trim_white_bg("f:/FOLDER AFIFAH/Antigravity Projects/adms-qris/public/logo_backup.png", "f:/FOLDER AFIFAH/Antigravity Projects/adms-qris/public/logo.png")
