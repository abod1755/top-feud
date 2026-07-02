@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   Top Feud - auto push to GitHub
echo ========================================
git add -A
git commit -m "Allow https images in CSP (photo games)"
git push
echo.
echo Done. Vercel will deploy automatically.
timeout /t 8
