@echo off
:: Repository cleanup script to improve performance for Windows
echo Starting repository cleanup...

:: Remove node_modules (can be reinstalled with npm install)
if exist "node_modules" (
  echo Removing node_modules folder...
  rmdir /s /q node_modules
  echo You'll need to run 'npm install' again before running the project
)

:: Remove build artifacts
echo Removing build artifacts...
if exist "build" rmdir /s /q build
if exist "dist" rmdir /s /q dist
if exist ".cache" rmdir /s /q .cache
if exist ".next" rmdir /s /q .next
if exist "out" rmdir /s /q out

:: Remove log files
echo Removing log files...
del /s /q *.log

:: Remove temporary files
echo Removing temporary files...
del /s /q .DS_Store
del /s /q Thumbs.db
del /s /q *.bak
del /s /q *~
del /s /q *.swp

:: Remove coverage reports
echo Removing test coverage reports...
if exist "coverage" rmdir /s /q coverage
if exist ".nyc_output" rmdir /s /q .nyc_output

:: Clean git history (optional)
set /p clean_git=Would you like to clean Git history to reduce repository size? (y/n): 
if /i "%clean_git%"=="y" (
  echo Cleaning Git history...
  git gc --aggressive --prune=now
)

:: Remove TypeScript cache
if exist ".tsbuildinfo" (
  echo Removing TypeScript build cache...
  rmdir /s /q .tsbuildinfo
)

:: Clean npm cache
echo Cleaning npm cache...
call npm cache clean --force

:: Update the README with Stage 1.4 marker
if exist "README.md" (
  echo Marking project as Stage 1.4 in README.md...
  echo. >> README.md
  echo ## Stage 1.4: Performance Optimizations >> README.md
  echo. >> README.md
  echo In this stage, we focused on performance optimizations for smoother animations and transitions, ensuring a better user experience with higher frame rates. >> README.md
)

echo.
echo Cleanup complete! Your repository should now be lighter and perform better.
echo Note: Media files have been preserved as requested.
pause
