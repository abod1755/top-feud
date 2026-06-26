@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   Top Feud - رفع التغييرات إلى GitHub
echo ========================================
echo.
git add -A
set /p msg="اكتب وصف التغيير ثم Enter (أو Enter مباشرة): "
if "%msg%"=="" set msg=update
git commit -m "%msg%"
if errorlevel 1 (
  echo.
  echo لا توجد تغييرات جديدة للرفع.
) else (
  git push
  echo.
  echo تم الرفع. Vercel بينشر النسخة الجديدة تلقائياً.
)
echo.
pause
