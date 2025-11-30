from datetime import datetime
import pytz

JAKARTA_TZ = pytz.timezone('Asia/Jakarta')

# Simulate what we do in the code
naive = datetime.now()
bad_way = naive.replace(tzinfo=JAKARTA_TZ)
good_way = JAKARTA_TZ.localize(naive)

print(f"Naive: {naive}")
print(f"Bad way (replace): {bad_way}")
print(f"Good way (localize): {good_way}")
print(f"Offset Bad: {bad_way.utcoffset()}")
print(f"Offset Good: {good_way.utcoffset()}")
