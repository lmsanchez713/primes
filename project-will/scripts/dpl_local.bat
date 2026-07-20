@echo off
set "SRC=C:\primes\project-will\web-client"
set "DEST=C:\code\httpd\Apache24\htdocs"

echo 1. Delete all files in the destination folder
del /q "%DEST%\*" 2>nul

echo 2. Delete all subfolders in the destination folder
for /d %%p in ("%DEST%\*") do rmdir /s /q "%%p"

echo 3. Copy all files and folders from source to destination
xcopy "%SRC%" "%DEST%" /E /Y

echo Deployment complete!
::pause
cmd /c start "" "http://127.0.0.1"
