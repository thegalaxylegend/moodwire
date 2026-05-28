@echo off
:: ================================================================
:: EXAMCOMPASS LIVE MONITOR
:: Open this in a SECOND terminal while turbo-pipeline.ts is running
:: Shows: questions/min, total count, seed file growth, API usage
::
:: Usage: monitor.cmd
:: ================================================================

:LOOP
cls
echo.
echo ================================================================
echo   EXAMCOMPASS LIVE MONITOR  [%time%]
echo ================================================================
echo.

:: Count questions in seed.sql
for /f %%i in ('findstr /c:"INSERT OR IGNORE" scripts\seed.sql 2^>nul ^| find /c "INSERT"') do set SEED_Q=%%i
if "%SEED_Q%"=="" set SEED_Q=0

:: Count questions in SQLite
for /f %%i in ('python -c "import sqlite3,glob,os; f=[x for x in glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite') if 'metadata' not in x]; f.sort(key=lambda x: os.path.getsize(x),reverse=True); c=sqlite3.connect(f[0]); print(c.execute('SELECT count(*) FROM questions').fetchone()[0]) if f else print(0)" 2^>nul') do set DB_Q=%%i
if "%DB_Q%"=="" set DB_Q=0

:: Read daily limits
for /f %%i in ('python -c "import json; d=json.load(open(\"scratch/daily_limits.json\")); print(d[\"cerebras\"])" 2^>nul') do set CB_CALLS=%%i
for /f %%i in ('python -c "import json; d=json.load(open(\"scratch/daily_limits.json\")); print(d[\"gemini\"])" 2^>nul') do set GM_CALLS=%%i
for /f %%i in ('python -c "import json; d=json.load(open(\"scratch/daily_limits.json\")); print(d[\"groq\"])" 2^>nul') do set GQ_CALLS=%%i

if "%CB_CALLS%"=="" set CB_CALLS=0
if "%GM_CALLS%"=="" set GM_CALLS=0
if "%GQ_CALLS%"=="" set GQ_CALLS=0

echo   DATABASE STATUS:
echo   SQLite questions : %DB_Q%
echo   seed.sql inserts : %SEED_Q%
echo   Target           : 30000
echo.

:: Progress bar (rough)
set /a PCT=DB_Q*100/30000
echo   Progress to 30k  : %PCT%%%
echo.

echo   API CALLS TODAY:
echo   Cerebras  : %CB_CALLS% / 50000
echo   Gemini    : %GM_CALLS% / 10000
echo   Groq      : %GQ_CALLS% / 15000
echo.

:: Show turbo pipeline report if it exists
if exist turbo_pipeline_report.md (
    echo   LAST PIPELINE RUN:
    findstr /n "Generated\|Speed\|Skipped\|Time" turbo_pipeline_report.md 2>nul | findstr /v "##"
    echo.
)

echo   [Refreshes every 5 seconds. Press Ctrl+C to stop]
echo ================================================================

timeout /t 5 /nobreak >nul
goto :LOOP
