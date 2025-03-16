@echo off
echo ^<!DOCTYPE html^> > index.html
echo ^<html lang="en"^> >> index.html
echo ^<head^> >> index.html
echo     ^<meta charset="UTF-8"^> >> index.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> index.html
echo     ^<title^>Music Player^</title^> >> index.html
echo     ^<style^> >> index.html
echo         body { >> index.html
echo             font-family: Arial, sans-serif; >> index.html
echo             background-color: #f5f5f5; >> index.html
echo             margin: 0; >> index.html
echo             padding: 0; >> index.html
echo             display: flex; >> index.html
echo             justify-content: center; >> index.html
echo             align-items: center; >> index.html
echo             height: 100vh; >> index.html
echo         } >> index.html
echo         .player-container { >> index.html
echo             background-color: white; >> index.html
echo             border-radius: 10px; >> index.html
echo             box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); >> index.html
echo             padding: 20px; >> index.html
echo             width: 350px; >> index.html
echo             text-align: center; >> index.html
echo         } >> index.html
echo         .album-art { >> index.html
echo             width: 250px; >> index.html
echo             height: 250px; >> index.html
echo             background-color: #ddd; >> index.html
echo             margin: 0 auto 20px auto; >> index.html
echo             border-radius: 5px; >> index.html
echo             display: flex; >> index.html
echo             justify-content: center; >> index.html
echo             align-items: center; >> index.html
echo             color: #888; >> index.html
echo         } >> index.html
echo     ^</style^> >> index.html
echo ^</head^> >> index.html
echo ^<body^> >> index.html
echo     ^<div class="player-container"^> >> index.html
echo         ^<div class="album-art"^>No album art^</div^> >> index.html
echo         ^<h1^>Music Player^</h1^> >> index.html
echo         ^<p^>Your music player is ready!^</p^> >> index.html
echo         ^<p^>Upload audio files using the button below:^</p^> >> index.html
echo         ^<input type="file" id="file-input" accept="audio/*" multiple^> >> index.html
echo     ^</div^> >> index.html
echo ^</body^> >> index.html
echo ^</html^> >> index.html 