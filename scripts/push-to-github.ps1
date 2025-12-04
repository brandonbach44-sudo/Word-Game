# Push-to-GitHub helper for Windows PowerShell
# Usage: Open PowerShell in your WordGame folder and run:
#   .\push-to-github.ps1

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
    Write-Host "Updating remote to: $remoteUrl" -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
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
    # Ask for commit message
    $commitMsg = Read-Host "Enter commit message (or press Enter for 'Update code')"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $commitMsg = "Update code"
    }
    
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m $commitMsg
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
    Write-Host "Push failed. Try these fixes:" -ForegroundColor Red
    Write-Host "1. If this is your first push, make sure the GitHub repo exists"
    Write-Host "2. If remote has changes, run: git pull origin main --rebase"
    Write-Host "3. Then try: git push -u origin main"
}