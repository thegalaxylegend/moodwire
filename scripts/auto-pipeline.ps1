<#
.SYNOPSIS
  ExamCompass Auto-Pipeline - Run 1hr, Break 10min, Repeat
.DESCRIPTION
  Maximizes question generation speed by resetting API rate limits
#>

param(
    [int]$RunMinutes = 60,
    [int]$BreakMinutes = 10,
    [int]$MaxCycles = 24,
    [int]$BatchSize = 50,
    [string]$Mode = "full_curation"
)

$ErrorActionPreference = "Continue"
$startTime = Get-Date
$totalGenerated = 0

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  EXAMCOMPASS AUTO-PIPELINE v1.0" -ForegroundColor Cyan
Write-Host "  Run: ${RunMinutes}min | Break: ${BreakMinutes}min | Cycles: $MaxCycles" -ForegroundColor Cyan
Write-Host "  Mode: $Mode | Batch: $BatchSize" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

for ($cycle = 1; $cycle -le $MaxCycles; $cycle++) {
    $cycleStart = Get-Date

    Write-Host ""
    Write-Host "------------------------------------------------" -ForegroundColor Yellow
    Write-Host "  CYCLE $cycle/$MaxCycles - GENERATING" -ForegroundColor Green
    Write-Host "  Started: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host "  Will run for: $RunMinutes minutes" -ForegroundColor Gray
    Write-Host "------------------------------------------------" -ForegroundColor Yellow

    # Count questions before this cycle
    $beforeCount = 0
    if (Test-Path "scripts/seed.sql") {
        try { $beforeCount = (Get-Content "scripts/seed.sql" | Select-String "^INSERT").Count } catch { $beforeCount = 0 }
    }

    # Run the pipeline with a timeout
    $proc = Start-Process -FilePath "npx.cmd" `
        -ArgumentList "tsx", "scripts/batch-pipeline.ts", "--mode=$Mode", "--batch-size=$BatchSize", "--limit=99999" `
        -NoNewWindow -PassThru -WorkingDirectory (Get-Location)

    # Wait for either: process ends OR timeout
    $timeoutMs = $RunMinutes * 60 * 1000
    $finished = $proc.WaitForExit($timeoutMs)

    if (-not $finished) {
        Write-Host ""
        Write-Host "  TIME UP! Stopping pipeline gracefully..." -ForegroundColor Yellow
        try {
            $proc.Kill()
            $proc.WaitForExit(5000)
        } catch {}
    }

    # Count questions after
    $afterCount = 0
    if (Test-Path "scripts/seed.sql") {
        try { $afterCount = (Get-Content "scripts/seed.sql" | Select-String "^INSERT").Count } catch { $afterCount = 0 }
    }
    $generated = $afterCount - $beforeCount
    if ($generated -lt 0) { $generated = 0 }
    $totalGenerated += $generated

    $elapsed = [math]::Round(((Get-Date) - $cycleStart).TotalMinutes, 1)
    $rate = if ($elapsed -gt 0) { [math]::Round($generated / $elapsed, 0) } else { 0 }

    Write-Host ""
    Write-Host "  [OK] Cycle $cycle complete!" -ForegroundColor Green
    Write-Host "     This cycle: $generated questions ($rate q/min)" -ForegroundColor White
    Write-Host "     Total so far: $totalGenerated questions" -ForegroundColor White

    # Upload to local D1 database
    Write-Host "  Uploading to Local D1 database..." -ForegroundColor Cyan
    try {
        $localproc = Start-Process -FilePath "npx.cmd" `
            -ArgumentList "tsx", "scripts/d1-upload.ts", "--local" `
            -NoNewWindow -PassThru -WorkingDirectory (Get-Location)
        $localproc.WaitForExit(600000)
        Write-Host "  [OK] Local D1 upload done" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Local D1 upload failed" -ForegroundColor Yellow
    }

    # Check if we hit max cycles
    if ($cycle -ge $MaxCycles) {
        Write-Host ""
        Write-Host "  Max cycles reached. Stopping." -ForegroundColor Cyan
        break
    }

    # BREAK TIME
    Write-Host ""
    Write-Host "------------------------------------------------" -ForegroundColor Yellow
    Write-Host "  BREAK - $BreakMinutes minutes" -ForegroundColor Magenta
    Write-Host "  Keys recovering... Resume at: $((Get-Date).AddMinutes($BreakMinutes).ToString('HH:mm:ss'))" -ForegroundColor Gray
    Write-Host "------------------------------------------------" -ForegroundColor Yellow

    for ($i = $BreakMinutes; $i -gt 0; $i--) {
        Write-Host "  $i min remaining..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 60
    }
    Write-Host "  [OK] Break over! Keys refreshed. Next cycle..." -ForegroundColor Green
}

# Final summary
$totalElapsed = [math]::Round(((Get-Date) - $startTime).TotalHours, 1)
$avgRate = if ($totalElapsed -gt 0) { [math]::Round($totalGenerated / ($totalElapsed * 60), 0) } else { 0 }

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  AUTO-PIPELINE COMPLETE" -ForegroundColor Green
Write-Host "  Total questions: $totalGenerated" -ForegroundColor White
Write-Host "  Total time: $totalElapsed hours" -ForegroundColor White
Write-Host "  Average speed: $avgRate q/min" -ForegroundColor White
Write-Host "  Cycles completed: $cycle" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
