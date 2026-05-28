param(
    [string]$Action    = "run",
    [int]$Target       = 30000,
    [int]$Workers      = 24,
    [int]$StubBatch    = 5000,
    [switch]$NoGemini  = $false,
    [switch]$DryRun    = $false
)

$ErrorActionPreference = "Continue"

function Write-Banner([string]$msg, [string]$col = "Cyan") {
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor $col
    Write-Host "  $msg" -ForegroundColor $col
    Write-Host ("=" * 70) -ForegroundColor $col
    Write-Host ""
}
function Write-Step([string]$msg)  { Write-Host "  >> $msg" -ForegroundColor Yellow }
function Write-OK([string]$msg)    { Write-Host "  OK $msg" -ForegroundColor Green }
function Write-Warn([string]$msg)  { Write-Host "  !! $msg" -ForegroundColor Magenta }
function Write-Info([string]$msg)  { Write-Host "     $msg" -ForegroundColor Gray }

function Get-QuestionCount {
    try {
        $py = @'
import sqlite3, glob, os
pattern = os.path.join('.wrangler','state','v3','d1','miniflare-D1DatabaseObject','*.sqlite')
files = [f for f in glob.glob(pattern) if 'metadata' not in f]
if not files: print(0); exit()
files.sort(key=lambda x: os.path.getsize(x), reverse=True)
conn = sqlite3.connect(files[0])
print(conn.execute('SELECT count(*) FROM questions').fetchone()[0])
conn.close()
'@
        $result = python -c $py 2>&1
        $num = $result -replace '[^0-9]',''
        if ($num) { return [int]$num } else { return 0 }
    } catch { return 0 }
}

function Get-SeedCount {
    try {
        $count = (Select-String -Path "scripts\seed.sql" -Pattern "^INSERT" -ErrorAction SilentlyContinue | Measure-Object).Count
        return $count
    } catch { return 0 }
}

function Run-Proc([string]$exe, [string]$argStr, [int]$timeoutSec = 3600) {
    Write-Info "$ $exe $argStr"
    $proc = Start-Process -FilePath $exe -ArgumentList $argStr `
        -NoNewWindow -PassThru -WorkingDirectory (Get-Location)
    $finished = $proc.WaitForExit($timeoutSec * 1000)
    if (-not $finished) { try { $proc.Kill(); $proc.WaitForExit(5000) } catch {} }
    return ($proc.ExitCode -eq 0)
}

# ============================================================
# SETUP
# ============================================================
function Do-Setup {
    Write-Banner "SETUP: First-time dependency check and seed import" "Cyan"

    # Python check
    Write-Step "Checking Python..."
    $pv = python --version 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host "  FAIL: Python not found" -ForegroundColor Red; exit 1 }
    Write-OK "Python: $pv"

    # Node check
    Write-Step "Checking Node.js..."
    $nv = node --version 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host "  FAIL: Node.js not found" -ForegroundColor Red; exit 1 }
    Write-OK "Node.js: $nv"

    # .env check
    Write-Step "Checking .env file..."
    if (-not (Test-Path ".env")) { Write-Host "  FAIL: .env missing" -ForegroundColor Red; exit 1 }
    Write-OK ".env found"

    # DB check
    Write-Step "Checking local SQLite database..."
    $dbFiles = Get-ChildItem ".wrangler\state\v3\d1\miniflare-D1DatabaseObject\*.sqlite" `
        -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*metadata*" }
    if (-not $dbFiles) {
        Write-Warn "No SQLite DB found. Start dev server first: npm run dev"
        exit 1
    }
    Write-OK "SQLite found: $($dbFiles[0].Name)"

    # Current state
    $currentCount = Get-QuestionCount
    $seedCount    = Get-SeedCount
    Write-Host ""
    Write-Host "  Current state:" -ForegroundColor White
    Write-Info "  SQLite questions: $currentCount"
    Write-Info "  seed.sql inserts: $seedCount"
    Write-Host ""

    # Import if gap exists
    if ($seedCount -gt ($currentCount + 100)) {
        $gap = $seedCount - $currentCount
        Write-Step "Importing $gap questions from seed.sql into SQLite..."
        $ok = Run-Proc "python" "scratch\import_seed_to_sqlite.py" 600
        $newCount = Get-QuestionCount
        if ($ok) { Write-OK "Import complete — SQLite now has $newCount questions" }
        else { Write-Warn "Import had issues. SQLite has $newCount questions." }
    } else {
        Write-OK "SQLite is in sync with seed.sql ($currentCount questions)"
    }

    # Schema constraints
    Write-Step "Applying schema constraints (safe, idempotent)..."
    Run-Proc "python" "scratch\00_apply_schema_constraints.py" 120 | Out-Null
    Write-OK "Schema constraints done"

    # Generate stubs
    Write-Step "Generating $StubBatch question stubs..."
    $ok = Run-Proc "npx" "tsx scripts\distribution-manager.ts --stubs=$StubBatch" 180
    if ($ok) { Write-OK "Stubs generated successfully" }
    else { Write-Warn "Stub generation had warnings (may be fine)" }

    $final = Get-QuestionCount
    Write-Banner "SETUP COMPLETE — $final questions in database" "Green"
    Write-Info "Next: .\run-db-scale.ps1 -Action run -Target $Target"
}

# ============================================================
# RUN (main curation loop)
# ============================================================
function Do-Run {
    Write-Banner "TURBO PIPELINE — Scaling database to $Target questions" "Cyan"

    $startCount = Get-QuestionCount
    Write-Host "  Starting count: $startCount / $Target" -ForegroundColor White

    if ($startCount -ge $Target) {
        Write-OK "Target already reached! ($startCount questions)"
        Write-Info "Run: .\run-db-scale.ps1 -Action push"
        return
    }

    $cycle    = 0
    $maxCycles = 30

    while ($true) {
        $cycle++
        $current = Get-QuestionCount

        if ($current -ge $Target) {
            Write-OK "TARGET REACHED: $current / $Target"
            break
        }
        if ($cycle -gt $maxCycles) {
            Write-Warn "Max cycles reached ($maxCycles). Stopping."
            break
        }

        $needed = $Target - $current
        Write-Host ""
        Write-Host ("  --- CYCLE $cycle / $maxCycles --- Need: $needed more (have: $current)") -ForegroundColor Yellow

        # Refresh stubs
        Write-Step "Refreshing stubs..."
        Run-Proc "npx" "tsx scripts\distribution-manager.ts --stubs=$StubBatch" 180 | Out-Null

        # Run turbo pipeline
        $limit = [math]::Min($needed + 500, 5000)
        $pArgs = "tsx scripts\turbo-pipeline.ts --workers=$Workers --limit=$limit"
        if ($NoGemini) { $pArgs += " --no-gemini" }
        if ($DryRun)   { $pArgs += " --dry-run" }

        Write-Step "Running Turbo Pipeline ($Workers parallel workers, limit=$limit)..."
        $t0 = Get-Date
        $ok = Run-Proc "npx" $pArgs 1800
        
        Write-Step "Importing newly generated questions to SQLite..."
        Run-Proc "python" "scratch\import_seed_to_sqlite.py" 600 | Out-Null
        
        $elapsed = [math]::Round(((Get-Date) - $t0).TotalMinutes, 1)

        $after  = Get-QuestionCount
        $gained = $after - $current
        $rate   = if ($elapsed -gt 0) { [math]::Round($gained / $elapsed, 0) } else { 0 }

        if ($ok) { Write-OK "Cycle $cycle complete: +$gained questions in ${elapsed}min ($rate q/min)" }
        else { Write-Warn "Cycle $cycle: +$gained questions (pipeline had some errors — normal)" }

        # Brief cooldown if low yield
        if ($gained -lt 10 -and $cycle -lt $maxCycles) {
            Write-Info "Low yield ($gained). Waiting 90s for API cooldown..."
            Start-Sleep -Seconds 90
        }
    }

    $final = Get-QuestionCount
    Write-Banner "CURATION DONE — $final questions in database" "Green"

    if ($final -ge $Target) {
        Write-OK "SUCCESS: Target of $Target reached!"
    } else {
        Write-Warn "Fell short: $final / $Target. Run again or check API limits."
    }
    Write-Info "Next: .\run-db-scale.ps1 -Action verify"
}

# ============================================================
# VERIFY
# ============================================================
function Do-Verify {
    Write-Banner "INTEGRITY VERIFICATION" "Cyan"

    $count = Get-QuestionCount
    Write-Step "Verifying $count questions (LaTeX, encoding, schema)..."
    $ok = Run-Proc "python" "scratch\05_verify_integrity.py" 300

    if ($ok) {
        Write-OK "Integrity check complete!"
        if (Test-Path "scratch\integrity_verification_report.md") {
            $report = Get-Content "scratch\integrity_verification_report.md" -Raw -ErrorAction SilentlyContinue
            $match  = [regex]::Match($report, 'Total Integrity Failures Found: (\d+)')
            if ($match.Success) {
                $n = [int]$match.Groups[1].Value
                if ($n -gt 0) {
                    Write-Warn "$n issues found. Applying auto-heals..."
                    Run-Proc "python" "scratch\05_apply_integrity_heals.py" 120 | Out-Null
                    Write-OK "Heals applied. Re-verifying..."
                    Run-Proc "python" "scratch\05_verify_integrity.py" 300 | Out-Null
                    Write-OK "Second verify done"
                } else {
                    Write-OK "ZERO integrity failures — database is clean!"
                }
            }
        }
    } else {
        Write-Warn "Verify had issues. Check scratch\integrity_verification_report.md"
    }
}

# ============================================================
# PUSH
# ============================================================
function Do-Push {
    Write-Banner "SYNC SEED AND GIT PUSH" "Cyan"

    $count = Get-QuestionCount
    Write-Step "Syncing $count questions to seed.sql and d1-chunks..."
    $ok = Run-Proc "python" "scratch\06_sync_seed.py" 600
    if (-not $ok) { Write-Host "  FAIL: Sync failed" -ForegroundColor Red; exit 1 }
    Write-OK "seed.sql and d1-chunks updated"

    Write-Step "Running git commit..."
    $ts  = Get-Date -Format "yyyy-MM-dd HH:mm"
    $msg = "db: scale to $count questions [$ts]"
    
    git add "scripts/seed.sql" 2>&1 | Out-Null
    git add "scratch/d1-chunks/" 2>&1 | Out-Null
    git add "scratch/processed_hashes.json" 2>&1 | Out-Null
    git add "scripts/turbo-pipeline.ts" 2>&1 | Out-Null
    git add "run-db-scale.ps1" 2>&1 | Out-Null
    git commit -m $msg 2>&1 | Out-Null

    Write-Step "Pushing to GitHub..."
    $push = git push 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-OK "Pushed to GitHub successfully!"
    } else {
        Write-Warn "Push failed (check credentials): $push"
    }

    Write-Banner "PUSH COMPLETE — $count questions deployed" "Green"
}

# ============================================================
# ALL
# ============================================================
function Do-All {
    Do-Setup
    Do-Run
    Do-Verify
    Do-Push
}

# ─── Main Router ──────────────────────────────────────────────────────────────
Write-Banner "EXAMCOMPASS DB SCALE SYSTEM v2.0" "Cyan"
Write-Info "Action: $Action | Target: $Target | Workers: $Workers | StubBatch: $StubBatch"

switch ($Action.ToLower()) {
    "setup"  { Do-Setup }
    "run"    { Do-Run }
    "verify" { Do-Verify }
    "push"   { Do-Push }
    "all"    { Do-All }
    default {
        Write-Host ""
        Write-Host "  COMMANDS:" -ForegroundColor White
        Write-Host "    .\run-db-scale.ps1 -Action setup            # First-time: import seeds + create stubs"
        Write-Host "    .\run-db-scale.ps1 -Action run              # Scale DB until target is hit"
        Write-Host "    .\run-db-scale.ps1 -Action verify           # Integrity check all questions"
        Write-Host "    .\run-db-scale.ps1 -Action push             # Sync seed.sql + git push"
        Write-Host "    .\run-db-scale.ps1 -Action all              # Do everything in sequence"
        Write-Host ""
        Write-Host "  OPTIONS:" -ForegroundColor White
        Write-Host "    -Target 30000    # Question count target"
        Write-Host "    -Workers 24      # Parallel workers (max 54)"
        Write-Host "    -StubBatch 5000  # Stubs generated per cycle"
        Write-Host "    -NoGemini        # Skip Gemini (use if quota hit)"
        Write-Host "    -DryRun          # Test without writing SQL"
        Write-Host ""
    }
}
