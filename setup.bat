@echo off
cd /d "%~dp0"
title FENDER - Setup and Start

echo ==========================================
echo    FENDER VIDEO DOWNLOADER - SETUP
echo ==========================================

echo [1/3] Installation des dependances Python...
python -m pip install -U -r requirements.txt

echo [2/3] Installation des dependances Node.js...
call npm install

echo [3/3] Preparation du frontend (Fender)...
cd frontend
call npm install
call npm run build
cd ..

echo ==========================================
echo    LANCEMENT DU SERVEUR
echo ==========================================
echo Serveur sur http://localhost:3000
call npm start
pause
