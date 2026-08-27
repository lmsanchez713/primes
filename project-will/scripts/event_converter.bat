@echo off
setlocal enableextensions enabledelayedexpansion

cd /d "C:\var\log\screen-captures"

:: 1. Read first argument (%1) or default to 0.25 if omitted
set "FRAME_DURATION=%~1"
if "%FRAME_DURATION%"=="" set "FRAME_DURATION=0.25"

:: 2. Clear existing files.txt
if exist files.txt del files.txt

:: 3. Build the file list with duration entries
set "LAST_FILE="
(
  for /f "delims=" %%a in ('dir /b /o:n "frame_*.png"') do (
    echo file '%%a'
    echo duration !FRAME_DURATION!
    set "LAST_FILE=%%a"
  )
  :: Append last frame as required anchor for FFmpeg
  if defined LAST_FILE echo file '!LAST_FILE!'
) > files.txt

:: 4. Run FFmpeg
ffmpeg -f concat -safe 0 -i files.txt -r 30 -c:v libx264 -pix_fmt yuv420p -y "output_timelapse.mp4"

:: 5. Clean up
del files.txt