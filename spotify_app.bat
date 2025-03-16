@echo off
echo ========================================
echo Node Application Restart Utility
echo ========================================
echo.
echo IMPORTANT: Please save all your files before continuing!
echo.
pause

echo.
echo Step 1: Killing all running Node.js processes...
taskkill /F /IM node.exe /T
echo Node processes terminated.
echo.

echo Step 2: Clearing cache folders...
echo.
echo Clearing server cache...
if exist "%~dp0spotify_downloads\server\node_modules\.cache" (
    rmdir /S /Q "%~dp0spotify_downloads\server\node_modules\.cache"
    echo Server cache cleared.
) else (
    echo No server cache found.
)

echo.
echo Clearing client cache...
if exist "%~dp0spotify_downloads\client\node_modules\.cache" (
    rmdir /S /Q "%~dp0spotify_downloads\client\node_modules\.cache"
    echo Client cache cleared.
) else (
    echo No client cache found.
)

echo.
echo Step 3: Starting server application...
start "Spotify Server" cmd /k "cd /d %~dp0spotify_downloads\server && npm start"

echo.
echo Waiting for server to initialize...
timeout /T 5 /NOBREAK > nul

echo.
echo Step 4: Starting client application...
start "Spotify Client" cmd /k "cd /d %~dp0spotify_downloads\client && npm start"

echo.
echo ========================================
echo All done! The applications should now be starting.
echo - Server will be available at http://localhost:5000
echo - Client will be available at http://localhost:3000
echo.
echo If you still encounter TypeScript errors, you may need to
echo manually edit your files to fix type issues.
echo ========================================
echo.
pause