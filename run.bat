@echo off
echo Starting Spotify Local Application...
echo.

:: Set the paths to your project
set SERVER_PATH=%~dp0spotify_downloads\server
set CLIENT_PATH=%~dp0spotify_downloads\client

:: Create a new CMD window for the server
echo Starting server at http://localhost:5000
start "Spotify Local Server" cmd /k "cd /d %SERVER_PATH% && npm start"

:: Wait a moment for the server to initialize
timeout /t 5 /nobreak > nul

:: Create a new CMD window for the client
echo Starting client at http://localhost:3000
start "Spotify Local Client" cmd /k "cd /d %CLIENT_PATH% && npm start"

echo.
echo Both server and client are starting...
echo Server runs at: http://localhost:5000
echo Client runs at: http://localhost:3000
echo.
echo To stop both applications, close their command windows.
echo.
pause