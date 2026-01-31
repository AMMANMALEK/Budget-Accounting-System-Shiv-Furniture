@echo off
echo ==========================================
echo   FIXING GIT REPOSITORY & PUSHING
echo ==========================================
echo.

echo 1. Initializing new repository...
git init

echo.
echo 2. Configuring user...
git config user.email "auto@bot.com"
git config user.name "Auto Bot"

echo.
echo 3. Adding files...
git add .

echo.
echo 4. Committing files...
git commit -m "Force fix commit: Frontend ERP System"

echo.
echo 5. Renaming branch to main...
git branch -M main

echo.
echo 6. Adding remote...
git remote add origin https://github.com/AMMANMALEK/Budget-Accounting-System-Shiv-Furniture.git

echo.
echo 7. Pushing to GitHub...
echo    (You may be asked for credentials login)
echo.
git push -u origin main --force

echo.
echo ==========================================
echo   DONE! Check for errors above.
echo ==========================================
pause
