from PIL import Image
import os

src = r"C:\Users\Rolo\.cursor\projects\c-Users-Rolo-Downloads-Crowy-main\assets\c__Users_Rolo_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Gemini_Generated_Image___1_-e87614f4-088f-4a4e-bebc-608b40836e61.png"
out_dir = os.path.dirname(os.path.abspath(__file__))

img = Image.open(src).convert("RGBA")
print("source:", img.size)

pixels = img.load()
w, h = img.size
bg = pixels[0, 0]


def is_bg(p, tol=18):
    return all(abs(p[i] - bg[i]) <= tol for i in range(3)) and p[3] > 200


min_x, min_y, max_x, max_y = w, h, 0, 0
found = False
for y in range(h):
    for x in range(w):
        if not is_bg(pixels[x, y]):
            found = True
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

if not found:
    raise SystemExit("Could not find icon content")

pad = 4
min_x = max(0, min_x - pad)
min_y = max(0, min_y - pad)
max_x = min(w - 1, max_x + pad)
max_y = min(h - 1, max_y + pad)

cropped = img.crop((min_x, min_y, max_x + 1, max_y + 1))
print("cropped:", cropped.size)

cw, ch = cropped.size
side = max(cw, ch)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(cropped, ((side - cw) // 2, (side - ch) // 2), cropped)

# Upscale to a clean master, then downscale (sharper for Chrome icons)
master = square.resize((512, 512), Image.Resampling.LANCZOS)
master_path = os.path.join(out_dir, "icon-master-512.png")
master.save(master_path, optimize=True)
print("saved", master_path)

for size in (16, 48, 128):
    out = master.resize((size, size), Image.Resampling.LANCZOS)
    path = os.path.join(out_dir, f"icon{size}.png")
    out.save(path, optimize=True)
    print("saved", path, out.size)
