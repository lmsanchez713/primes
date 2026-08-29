"""Record a 1-second mp4 clip whenever user input is received.

- Background thread grabs full-screen frames at CAPTURE_FPS into a rolling
  buffer (slightly longer than CLIP_SECONDS).
- On keyboard/mouse input, the last CLIP_SECONDS of frames are encoded to
  clip_{timestamp_ms}.mp4 via ffmpeg.
"""

import queue
import shutil
import subprocess
import threading
import time
from collections import deque
from pathlib import Path

import numpy as np
from mss import mss
from pynput import keyboard, mouse

# --- Configuration ---------------------------------------------------------
SAVE_DIR = Path(r"C:\var\log\screen-captures")
SAVE_DIR.mkdir(parents=True, exist_ok=True)

CLIP_SECONDS = 10.0        # length of each clip
CAPTURE_FPS  = 60         # screen-capture rate
BUFFER_SECONDS = CLIP_SECONDS * 2      # rolling buffer length (>= CLIP_SECONDS)
CLIP_COOLDOWN  = 0.0      # min seconds between clips (no burst spam)
FFMPEG = shutil.which("ffmpeg") or "ffmpeg"
# ---------------------------------------------------------------------------

FRAME_BUFFER = deque(maxlen=int(CAPTURE_FPS * BUFFER_SECONDS))
BUFFER_LOCK  = threading.Lock()
CLIP_QUEUE   = queue.Queue()
_last_clip_time = 0.0


def capture_loop():
    """Continuously grab frames into the rolling buffer."""
    interval = 1.0 / CAPTURE_FPS
    with mss() as sct:
        monitor = sct.monitors[1]  # primary monitor
        while True:
            frame = np.asarray(sct.grab(monitor))          # BGRA
            with BUFFER_LOCK:
                FRAME_BUFFER.append(frame)
            time.sleep(max(0.0, interval - (time.time() % interval)))


def clip_worker():
    """Encode queued clips to mp4."""
    global _last_clip_time
    while True:
        ts = CLIP_QUEUE.get()
        with BUFFER_LOCK:
            frames = list(FRAME_BUFFER)
        n = min(int(CAPTURE_FPS * CLIP_SECONDS), len(frames))
        if n == 0:
            continue
        frames = frames[-n:]
        h, w = frames[0].shape[:2]

        out = SAVE_DIR / f"clip_{ts}.mp4"
        cmd = [
            FFMPEG, "-y",
            "-f", "rawvideo", "-pix_fmt", "bgra",
            "-s", f"{w}x{h}", "-r", str(CAPTURE_FPS), "-i", "-",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            str(out),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for f in frames:
            proc.stdin.write(f.tobytes())
        proc.stdin.close()
        proc.wait()
        print(f"Saved {out} ({len(frames)} frames)")
        _last_clip_time = time.time()


def on_action(*args, **kwargs):
    global _last_clip_time
    now = time.time()
    if now - _last_clip_time < CLIP_COOLDOWN:
        return
    _last_clip_time = now
    CLIP_QUEUE.put(int(now * 1000))


def main():
    threading.Thread(target=capture_loop, daemon=True).start()
    threading.Thread(target=clip_worker, daemon=True).start()

    kb = keyboard.Listener(on_press=on_action)
    ms = mouse.Listener(on_click=on_action, on_scroll=on_action)
    kb.start(); ms.start()

    print(f"Recording {CLIP_SECONDS}s clips on input... Press Ctrl+C to stop.")
    try:
        kb.join(); ms.join()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
