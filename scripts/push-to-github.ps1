# Push-to-GitHub helper for Windows PowerShell
# Usage: Open PowerShell in the project root and run:
#   .\scripts\push-to-github.ps1
# The script will:
# - check for git
# - init repo if needed
# - stage .gitignore then all files
# - commit if there are changes
# - add or update remote origin
# - push to main branch

$ErrorActionPreference = 'Stop'

$remoteUrl = 'https://github.com/brandonbach44-sudo/Word-Game.git'
$projectRoot = (Get-Location).Path

function Ensure-Git {
    try {
        $g = git --version 2>&1
        Write-Host "Found: $g"
        return $true
    } catch {
        Write-Error "Git not found. Install Git for Windows and ensure it's on PATH: https://git-scm.com/download/win"
        return $false
    }
}

if (-not (Ensure-Git)) { exit 1 }

# initialize repo if needed
if (-not (Test-Path -Path (Join-Path $projectRoot '.git'))) {
    Write-Host "Initializing git repository..."
    git init
} else {
    Write-Host ".git already exists - using existing repository."
}

# optional: set name/email if not set (uncomment and edit if you want)
# git config user.name "Your Name"
# git config user.email "you@example.com"

# stage .gitignore first (safe) then everything
if (Test-Path -Path (Join-Path $projectRoot '.gitignore')) {
    git add .gitignore
}

git add .

# commit if there are staged changes
$porcelain = git status --porcelain
if ($porcelain) {
    git commit -m "Initial commit"
} else {
    Write-Host "No changes to commit."
}

# add or update origin remote
try {
    $existing = git remote get-url origin 2>$null
    if ($existing) {
        Write-Host ("Remote 'origin' exists (URL: " + $existing + "). Updating to " + $remoteUrl)
        git remote set-url origin $remoteUrl
    } else {
        Write-Host ("Adding remote origin " + $remoteUrl)
        git remote add origin $remoteUrl
    }
} catch {
    Write-Host "Adding remote origin $remoteUrl"
    git remote add origin $remoteUrl
}

# ensure branch name 'main'
try {
    git branch -M main
} catch {
    Write-Warning "Could not rename branch to main (it may already be named main)."
}

# push to origin
Write-Host "About to push to origin/main. If prompted, use your GitHub credentials or a Personal Access Token (PAT) for HTTPS."
try {
    git push -u origin main
    Write-Host ("Push completed successfully. Open your repo: " + $remoteUrl)
} catch {
    Write-Error 'Push failed. See output above. If the remote already has commits you may need to pull first or force push.'
    exit 1
}
