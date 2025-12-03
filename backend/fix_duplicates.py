import os

file_path = r"C:\Users\M RIzky Caesar\Documents\Semester 5\web\backend\app\routes\batch_routes.py"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to keep lines 1-231 (indices 0-230)
# Skip lines 232-424 (indices 231-423)
# Keep lines 425-end (indices 424-end)

# Adjusting for 0-based indexing:
# Line 1 is index 0.
# Line 231 is index 230.
# Line 232 is index 231.
# Line 424 is index 423.
# Line 425 is index 424.

# So we want lines[0:231] + lines[424:]

new_content = lines[:231] + lines[424:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print(f"✅ Successfully removed duplicate lines. New line count: {len(new_content)}")
