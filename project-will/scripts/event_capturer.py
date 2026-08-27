import time
from pathlib import Path
from mss import mss
from pynput import keyboard, mouse

# Configuration
SAVE_DIR = Path("./timelapse_frames")
SAVE_DIR.mkdir(exist_ok=True)
MIN_INTERVAL = 1.0  # Minimum seconds between snapshots (prevents spamming during fast typing)

last_capture_time = 0
frame_count = 0

def capture_frame():
    global last_capture_time, frame_count
    current_time = time.time()
    
    # Throttle captures to MIN_INTERVAL
    if current_time - last_capture_time >= MIN_INTERVAL:
        last_capture_time = current_time
        frame_count += 1
        with mss() as sct:
            sct.shot(mon=-1, output=str(SAVE_DIR / f"frame_{frame_count:06d}.png"))

def on_action(*args, **kwargs):
    capture_frame()

# Listen for keyboard and mouse activity
keyboard_listener = keyboard.Listener(on_press=on_action)
mouse_listener = mouse.Listener(on_click=on_action, on_scroll=on_action)

keyboard_listener.start()
mouse_listener.start()

print("Capturing frames on user input... Press Ctrl+C in terminal to stop.")
try:
    keyboard_listener.join()
    mouse_listener.join()
except KeyboardInterrupt:
    print(f"\nStopped. Captured {frame_count} frames in {SAVE_DIR.resolve()}")