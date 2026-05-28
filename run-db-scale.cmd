@echo off
setlocal enabledelayedexpansion

:: ExamCompass DB Scale System
:: Usage:
::   run-db-scale.cmd setup       <- first time only
::   run-db-scale.cmd run         <- scale to 30000
::   run-db-scale.cmd verify      <- integrity check
::   run-db-scale.cmd push        <- sync + git push
::   run-db-scale.cmd all         <- everything in sequence

set ACTION=%~1
if "%ACTION%"=="" set ACTION=help

set TARGET=%~2
if "%TARGET%"=="" set TARGET=30000

set WORKERS=%~3
if "%WORKERS%"=="" set WORKERS=24

echo.
echo ======================================================================
echo   EXAMCOMPASS DB SCALE SYSTEM v2.0
echo   Action: %ACTION%  ^|  Target: %TARGET%  ^|  Workers: %WORKERS%
echo ======================================================================
echo.

if /I "%ACTION%"=="setup"  goto :SETUP
if /I "%ACTION%"=="run"    goto :RUN
if /I "%ACTION%"=="verify" goto :VERIFY
if /I "%ACTION%"=="push"   goto :PUSH
if /I "%ACTION%"=="all"    goto :ALL
goto :HELP

:: ============================================================
:SETUP
echo [STEP 1/4] Checking dependencies...
python --version >nul 2>&1
if errorlevel 1 ( echo FAIL: Python not found. Install Python 3.8+ & exit /b 1 )
echo   OK: Python found

node --version >nul 2>&1
if errorlevel 1 ( echo FAIL: Node.js not found. Install Node.js 18+ & exit /b 1 )
echo   OK: Node.js found

if not exist ".env" ( echo FAIL: .env missing & exit /b 1 )
echo   OK: .env found

echo.
echo [STEP 2/4] Checking database state...
for /f %%i in ('python -c "import sqlite3,glob,os; f=[x for x in glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite') if 'metadata' not in x]; f.sort(key=lambda x:os.path.getsize(x),reverse=True); c=sqlite3.connect(f[0]); print(c.execute('SELECT count(*) FROM questions').fetchone()[0])"') do set CURRENT=%%i
for /f %%i in ('python -c "f=open(\"scripts/seed.sql\"); print(sum(1 for l in f if l.startswith(\"INSERT\")))"') do set SEEDCOUNT=%%i

echo   SQLite questions : %CURRENT%
echo   seed.sql inserts : %SEEDCOUNT%

echo.
echo [STEP 3/4] Importing seed.sql if needed...
python scratch\import_seed_to_sqlite.py
echo   OK: Import complete

echo.
echo [STEP 4/4] Generating question stubs for gap analysis...
call npx tsx scripts\distribution-manager.ts --stubs=5000
echo   OK: Stubs generated

for /f %%i in ('python -c "import sqlite3,glob,os; f=[x for x in glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite') if 'metadata' not in x]; f.sort(key=lambda x:os.path.getsize(x),reverse=True); c=sqlite3.connect(f[0]); print(c.execute('SELECT count(*) FROM questions').fetchone()[0])"') do set FINAL=%%i

echo.
echo ======================================================================
echo   SETUP COMPLETE -- Database has %FINAL% questions
echo   Next: run-db-scale.cmd run %TARGET% %WORKERS%
echo ======================================================================
goto :EOF

:: ============================================================
:RUN
echo Starting Turbo Pipeline...
echo Target: %TARGET% questions, %WORKERS% parallel workers
echo.

:RUN_LOOP
for /f %%i in ('python -c "import sqlite3,glob,os; f=[x for x in glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite') if 'metadata' not in x]; f.sort(key=lambda x:os.path.getsize(x),reverse=True); c=sqlite3.connect(f[0]); print(c.execute('SELECT count(*) FROM questions').fetchone()[0])"') do set CURRENT=%%i

if %CURRENT% GEQ %TARGET% (
    echo.
    echo ======================================================================
    echo   TARGET REACHED: %CURRENT% / %TARGET% questions
    echo   Next: run-db-scale.cmd verify
    echo ======================================================================
    goto :EOF
)

set /a NEEDED=%TARGET%-%CURRENT%
set /a LIMIT=%NEEDED%+500
if %LIMIT% GTR 5000 set LIMIT=5000

echo   Current: %CURRENT% / %TARGET%  -- Need: %NEEDED% more
echo.
echo   [Refreshing stubs...]
call npx tsx scripts\distribution-manager.ts --stubs=5000

echo.
echo   [Running Turbo Pipeline: %WORKERS% workers, limit=%LIMIT%]
call npx tsx scripts\turbo-pipeline.ts --workers=%WORKERS% --limit=%LIMIT%

echo.
echo   [Importing newly generated questions to SQLite...]
python scratch\import_seed_to_sqlite.py

echo.
echo   Cycle complete. Checking count...
goto :RUN_LOOP

:: ============================================================
:VERIFY
echo Running integrity verification...
python scratch\05_verify_integrity.py
echo.
echo   Applying integrity heals...
python scratch\05_apply_integrity_heals.py
echo.
echo ======================================================================
echo   VERIFY COMPLETE -- Check scratch\integrity_verification_report.md
echo   Next: run-db-scale.cmd push
echo ======================================================================
goto :EOF

:: ============================================================
:PUSH
echo Syncing database to seed.sql and d1-chunks...
python scratch\06_sync_seed.py

echo.
echo Committing to git...
git add scripts\seed.sql
git add scratch\d1-chunks\
git add scratch\processed_hashes.json
git add scripts\turbo-pipeline.ts
git add run-db-scale.cmd
git commit -m "db: scale database [automated]"

echo.
echo Pushing to GitHub...
git push

echo.
echo ======================================================================
echo   PUSH COMPLETE
echo ======================================================================
goto :EOF

:: ============================================================
:ALL
call :SETUP
call :RUN
call :VERIFY
call :PUSH
goto :EOF

:: ============================================================
:HELP
echo.
echo   COMMANDS:
echo     run-db-scale.cmd setup         First-time: import seeds + create stubs
echo     run-db-scale.cmd run           Scale DB until target is hit
echo     run-db-scale.cmd verify        Integrity check all questions
echo     run-db-scale.cmd push          Sync seed.sql + git push
echo     run-db-scale.cmd all           Do everything in sequence
echo.
echo   ARGUMENTS (positional):
echo     run-db-scale.cmd [action] [target] [workers]
echo     run-db-scale.cmd run 30000 24
echo.
goto :EOF
