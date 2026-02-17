# Quick Start Script for Resume Parser System

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Resume Parser System - Quick Start" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$workspaceRoot = "C:\Users\ashika\Desktop\Lakshya"

Write-Host "[1/4] Starting Python Parser Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$workspaceRoot\resume-parser-service'; .\venv\Scripts\Activate.ps1; python main.py"
) -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "[2/4] Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$workspaceRoot\lakshyabackend'; node index.js"
) -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "[3/4] Starting Frontend Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$workspaceRoot\lakshyafrontend'; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "`n[4/4] Running Health Check..." -ForegroundColor Yellow
cd "$workspaceRoot\lakshyabackend"
node verify-resume-parser.js

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nOpen your browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nPress any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
