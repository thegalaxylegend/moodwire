@echo off
echo Deploying Firestore Rules and Indexes...
echo This will fix the "Missing or insufficient permissions" error.
echo.
call firebase deploy --only firestore
if errorlevel 1 (
    echo.
    echo Deployment Failed. Please ensure you are logged in to Firebase.
    echo Run 'firebase login' if needed.
) else (
    echo.
    echo Deployment Successful! The application should now work correctly.
)
pause
