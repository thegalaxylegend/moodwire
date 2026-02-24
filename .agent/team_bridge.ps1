# Claude AI Team Bridge
# This script allows Antigravity and Claude to work together autonomously.

function Send-ClaudeDispatch {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Prompt
    )

    Write-Host "📡 Sending dispatch to Claude..." -ForegroundColor Cyan
    
    # Use the --print flag to get non-interactive output
    $fullPath = "C:\Users\Admin\.local\bin\claude.exe"
    $result = & $fullPath --print $Prompt
    
    return $result
}

# Execute the dispatch if arguments are passed
if ($args.Count -gt 0) {
    Send-ClaudeDispatch -Prompt $args[0]
}
