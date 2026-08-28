import os
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from pathlib import Path
from PIL import Image, ImageTk

# Default configuration
DEFAULT_FRAMES_DIR = Path(r"C:\var\log\screen-captures")
DEFAULT_DURATION = "0.25"  # 250 ms in seconds

class TimelapseEditor(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Timelapse Frame Editor")
        self.geometry("950x650")

        self.frames_dir = DEFAULT_FRAMES_DIR
        self.frame_data = []  # List of dicts: {"path": Path, "duration": str}
        self.current_index = None

        self._build_ui()
        self.load_frames()

    def _build_ui(self):
        # Top toolbar
        toolbar_container = tk.Frame(self)
        toolbar = tk.Frame(toolbar_container, padx=5, pady=5)
        toolbar.pack(fill=tk.X)
        toolbar_container.pack(side=tk.TOP, fill=tk.X)

        ttk.Button(toolbar, text="Select Folder", command=self.select_folder).pack(side=tk.LEFT, padx=5)
        
        ttk.Label(toolbar, text="Bulk Duration (s):").pack(side=tk.LEFT, padx=(15, 2))
        self.bulk_dur_entry = ttk.Entry(toolbar, width=8)
        self.bulk_dur_entry.insert(0, DEFAULT_DURATION)
        self.bulk_dur_entry.pack(side=tk.LEFT, padx=2)
        
        ttk.Button(toolbar, text="Apply to All", command=self.apply_bulk_duration).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(toolbar, text="Export Video (FFmpeg)", command=self.export_video).pack(side=tk.RIGHT, padx=5)

        # Main content area
        paned = ttk.PanedWindow(self, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Left panel: Listbox for frame files
        left_frame = tk.Frame(paned, width=350)
        paned.add(left_frame, weight=1)

        list_scroll = ttk.Scrollbar(left_frame)
        list_scroll.pack(side=tk.RIGHT, fill=tk.Y)

        self.file_listbox = tk.Listbox(left_frame, yscrollcommand=list_scroll.set, selectmode=tk.SINGLE)
        self.file_listbox.pack(fill=tk.BOTH, expand=True)
        list_scroll.config(command=self.file_listbox.yview)
        self.file_listbox.bind("<<ListboxSelect>>", self.on_select_frame)

        # Right panel: Preview & Controls
        right_frame = tk.Frame(paned)
        paned.add(right_frame, weight=2)

        # Image Canvas
        self.preview_label = ttk.Label(right_frame, text="Select a frame to preview", anchor=tk.CENTER)
        self.preview_label.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Bottom Frame Controls
        controls = tk.Frame(right_frame, padx=10, pady=10)
        controls.pack(fill=tk.X, side=tk.BOTTOM)

        ttk.Label(controls, text="Frame Duration (s):").grid(row=0, column=0, padx=5, sticky=tk.W)
        self.frame_dur_entry = ttk.Entry(controls, width=10)
        self.frame_dur_entry.grid(row=0, column=1, padx=5, sticky=tk.W)
        
        ttk.Button(controls, text="Save Duration", command=self.save_single_duration).grid(row=0, column=2, padx=5)
        ttk.Button(controls, text="Delete Frame", command=self.delete_frame).grid(row=0, column=3, padx=15)

    def load_frames(self):
        self.file_listbox.delete(0, tk.END)
        self.frame_data = []

        if not self.frames_dir.exists():
            messagebox.showwarning("Warning", f"Directory not found: {self.frames_dir}")
            return

        # Load PNG files sorted chronologically by timestamp in name
        png_files = sorted(list(self.frames_dir.glob("frame_*.png")))
        for p in png_files:
            self.frame_data.append({"path": p, "duration": DEFAULT_DURATION})

        self._refresh_listbox()

        if self.frame_data:
            self.file_listbox.select_set(0)
            self.on_select_frame(None)

    def _refresh_listbox(self):
        self.file_listbox.delete(0, tk.END)
        for item in self.frame_data:
            display_str = f"{item['path'].name}  [{item['duration']}s]"
            self.file_listbox.insert(tk.END, display_str)

    def select_folder(self):
        folder = filedialog.askdirectory(initialdir=str(self.frames_dir))
        if folder:
            self.frames_dir = Path(folder)
            self.load_frames()

    def on_select_frame(self, event):
        selection = self.file_listbox.curselection()
        if not selection:
            return

        self.current_index = selection[0]
        item = self.frame_data[self.current_index]

        # Update Duration Entry
        self.frame_dur_entry.delete(0, tk.END)
        self.frame_dur_entry.insert(0, item["duration"])

        # Display Preview Thumbnail
        try:
            img = Image.open(item["path"])
            img.thumbnail((500, 400))  # Scale down for preview
            self.photo = ImageTk.PhotoImage(img)
            self.preview_label.config(image=self.photo, text="")
        except Exception as e:
            self.preview_label.config(image="", text=f"Failed to load image:\n{e}")

    def save_single_duration(self):
        if self.current_index is None:
            return
        new_dur = self.frame_dur_entry.get().strip()
        self.frame_data[self.current_index]["duration"] = new_dur
        self._refresh_listbox()
        self.file_listbox.select_set(self.current_index)

    def apply_bulk_duration(self):
        new_dur = self.bulk_dur_entry.get().strip()
        for item in self.frame_data:
            item["duration"] = new_dur
        self._refresh_listbox()
        if self.current_index is not None:
            self.file_listbox.select_set(self.current_index)

    def delete_frame(self):
        if self.current_index is None:
            return

        item = self.frame_data[self.current_index]
        file_path = item["path"]

        # Remove from disk
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            messagebox.showerror("Error", f"Could not delete file:\n{e}")
            return

        # Remove from UI memory
        del self.frame_data[self.current_index]
        self._refresh_listbox()

        # Update selection focus
        if self.frame_data:
            next_idx = min(self.current_index, len(self.frame_data) - 1)
            self.file_listbox.select_set(next_idx)
            self.file_listbox.activate(next_idx)
            self.on_select_frame(None)
        else:
            self.preview_label.config(image="", text="No frames left.")
            self.current_index = None

    def export_video(self):
        if not self.frame_data:
            messagebox.showwarning("Warning", "No frames available to export.")
            return

        # 1. Generate FFmpeg concat list with variable per-frame durations
        concat_file = self.frames_dir / "files.txt"
        output_file = self.frames_dir / "output_timelapse.mp4"

        try:
            with open(concat_file, "w", encoding="utf-8") as f:
                for item in self.frame_data:
                    f.write(f"file '{item['path'].name}'\n")
                    f.write(f"duration {item['duration']}\n")
                # Anchor last frame
                f.write(f"file '{self.frame_data[-1]['path'].name}'\n")

            # 2. Execute FFmpeg
            cmd = [
                "ffmpeg",
                "-f", "concat",
                "-safe", "0",
                "-i", "files.txt",
                "-r", "30",
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-y",
                "output_timelapse.mp4"
            ]

            subprocess.run(cmd, cwd=str(self.frames_dir), check=True)

            messagebox.showinfo("Success", f"Video exported successfully!\n\nLocation:\n{output_file}")
        except subprocess.CalledProcessError as e:
            messagebox.showerror("Export Failed", f"FFmpeg error occurred:\n{e}")
        except Exception as e:
            messagebox.showerror("Export Failed", f"Error generating video:\n{e}")
        finally:
            if concat_file.exists():
                concat_file.unlink()

if __name__ == "__main__":
    app = TimelapseEditor()
    app.mainloop()
