# Push-to-GitHub helper for Windows PowerShell
# Usage: 
#   npm run push
#   Or directly: .\scripts\push-to-github.ps1 -Message "Your commit message"

param(
    [string]$Message = ""
)

# Your GitHub repo URL
$remoteUrl = "https://github.com/brandonbach44-sudo/Word-Game.git"

Write-Host "=== Git Push Script ===" -ForegroundColor Cyan

# Check if git is installed
$gitPath = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitPath) {
    Write-Host "ERROR: Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/download/win"
    exit 1
}
Write-Host "Git found!" -ForegroundColor Green

# Initialize repo if needed
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
} else {
    Write-Host "Git repo already exists" -ForegroundColor Green
}

# Set up remote
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Remote configured: $existingRemote" -ForegroundColor Green
} else {
    Write-Host "Adding remote: $remoteUrl" -ForegroundColor Yellow
    git remote add origin $remoteUrl
}

# Stage all files
Write-Host "Staging all files..." -ForegroundColor Yellow
git add -A

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    # Get commit message
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $Message = Read-Host "Enter commit message (or press Enter for 'Update code')"
        if ([string]::IsNullOrWhiteSpace($Message)) {
            $Message = "Update code"
        }
    }
    
    Write-Host "Committing changes: $Message" -ForegroundColor Yellow
    git commit -m $Message
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Commit failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Your code is on GitHub:" -ForegroundColor Green
    Write-Host $remoteUrl -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Push failed. Common fixes:" -ForegroundColor Red
    Write-Host "1. If remote has changes, pull first: git pull origin main --rebase" -ForegroundColor Yellow
    Write-Host "2. Then push again: git push -u origin main" -ForegroundColor Yellow
    Write-Host "3. If conflicts occur during rebase, resolve them and run: git rebase --continue" -ForegroundColor Yellow
    Write-Host "4. Or abort the rebase: git rebase --abort" -ForegroundColor Yellow
    exit 1
}