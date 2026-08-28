import time
from pathlib import Path
from mss import mss
from pynput import keyboard, mouse

# Configuration
SAVE_DIR = Path(r"C:\var\log\screen-captures")
SAVE_DIR.mkdir(parents=True, exist_ok=True)
MIN_INTERVAL = 0.1  # Minimum seconds between captures (e.g., 0.1 = max 10 frames/sec)

last_capture_time = 0
frame_count = 0

def capture_frame():
    global last_capture_time, frame_count
    current_time = time.time()
    
    if current_time - last_capture_time >= MIN_INTERVAL:
        last_capture_time = current_time
        frame_count += 1
        
        # Unix timestamp in milliseconds
        ms_timestamp = int(current_time * 1000)
        filename = SAVE_DIR / f"frame_{ms_timestamp}.png"
        
        with mss() as sct:
            sct.shot(mon=-1, output=str(filename))

def on_action(*args, **kwargs):
    capture_frame()

keyboard_listener = keyboard.Listener(on_press=on_action)
mouse_listener = mouse.Listener(on_click=on_action, on_scroll=on_action)

keyboard_listener.start()
mouse_listener.start()

print("Capturing frames on user input... Press Ctrl+C to stop.")
try:
    keyboard_listener.join()
    mouse_listener.join()
except KeyboardInterrupt:
    print(f"\nStopped. Captured {frame_count} frames.")