# Run Automated Tests and Save Results
# This script runs different types of tests (Lint, Integration, Coverage)
# and saves the results of each one into separate text files.

$backendDir = "d:\My data\Programming\Projects\Cortex Task Manager\Cortex-Task-Manager\backend"
$reportsDir = Join-Path $backendDir "test_reports"

# Create reports directory if it doesn't exist
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir
} else {
    # Clear previous results
    Remove-Item (Join-Path $reportsDir "*") -Force
}

Write-Host "Starting automated test run..."
$startTime = Get-Date

# 1. Run Linting
Write-Host "[1/3] Running Lint..."
Push-Location $backendDir
npm run lint 2>&1 | Out-File -FilePath (Join-Path $reportsDir "01_lint_results.txt") -Encoding utf8
Pop-Location
if ($LASTEXITCODE -eq 0) { Write-Host "  - Lint passed." } else { Write-Host "  - Lint found issues (check 01_lint_results.txt)." }

# 2. Run Integration Tests one by one
Write-Host "[2/3] Running Integration Tests one by one..."
$integrationDir = Join-Path $backendDir "tests\integration"
$testFiles = Get-ChildItem -Path $integrationDir -Filter "*.test.ts"

foreach ($file in $testFiles) {
    $moduleName = $file.BaseName.Replace(".test", "")
    Write-Host "  - Running module: ${moduleName}..."
    
    # Run individual test file with jest
    Push-Location $backendDir
    npx jest $file.FullName --verbose --no-cache 2>&1 | Out-File -FilePath (Join-Path $reportsDir "02_integration_${moduleName}_results.txt") -Encoding utf8
    Pop-Location
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    - ${moduleName}: SUCCESS"
    } else {
        Write-Host "    - ${moduleName}: FAILED (check 02_integration_${moduleName}_results.txt)"
    }
}

# 3. Run Coverage
Write-Host "[3/3] Running Test Coverage..."
Push-Location $backendDir
npm run test:coverage 2>&1 | Out-File -FilePath (Join-Path $reportsDir "03_coverage_results.txt") -Encoding utf8
Pop-Location
if ($LASTEXITCODE -eq 0) { Write-Host "  - Coverage generated." } else { Write-Host "  - Coverage run encountered errors." }

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`nTest run completed in $($duration.TotalSeconds) seconds."
Write-Host "Results are available in: $reportsDir"
