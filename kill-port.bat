@echo off
echo Recherche du processus sur le port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Processus trouve : PID %%a
    taskkill /F /PID %%a
    echo Processus termine.
)