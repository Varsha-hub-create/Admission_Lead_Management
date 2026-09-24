@echo off
echo Installing backend dependencies...
cd server
call npm install
copy /Y .env.example .env
echo.
echo Installing frontend dependencies...
cd ..\client
call npm install
echo.
echo Setup complete.
echo Start MongoDB, then run "cd server && npm run seed && npm run dev"
echo In another terminal run "cd client && npm run dev"
pause
