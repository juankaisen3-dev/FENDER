@echo off
:: Se placer dans le dossier du script
cd /d "%~dp0"
title FENDER - Setup and Start
echo ==========================================
echo    FENDER VIDEO DOWNLOADER - SETUP
echo ==========================================
echo.

:: Verification de Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installe ou n'est pas dans le PATH.
    pause
    exit /b
)

:: Verification de FFmpeg
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVERTISSEMENT] FFmpeg n'est pas detecte. 
    echo Le telechargement de hautes resolutions (1080p+) pourrait echouer.
    echo.
)

:: Installation des dependances Python
echo [1/3] Installation des dependances Python...
python -m pip install -U -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de l'installation Python.
    pause
    exit /b
)

:: Verification de Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe.
    pause
    exit /b
)

:: Installation des dependances Node
echo [2/3] Installation des dependances Node.js (Backend)...
call npm install
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de l'installation Node (Backend).
    pause
    exit /b
)

:: Build du frontend
echo [3/3] Preparation du frontend (Fender)...
cd fender
call npm install
call npm run build
cd ..

echo.
echo ==========================================
echo    SETUP TERMINE ! LANCEMENT DU SERVEUR
echo ==========================================
echo.
echo Serveur accessible sur http://localhost:3000
echo.
npm start
pause
