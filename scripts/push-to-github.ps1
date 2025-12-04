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

function Add-Git-To-PathIfFound {
    # Common Git install locations on Windows
    $candidates = @(
        'C:\Program Files\Git\cmd\git.exe',
        'C:\Program Files\Git\bin\git.exe',
        'C:\Program Files (x86)\Git\cmd\git.exe',
        "$env:ProgramFiles\Git\cmd\git.exe",
        "$env:ProgramFiles(x86)\Git\cmd\git.exe"
    )

    foreach ($p in $candidates) {
        if (Test-Path $p) {
            $dir = Split-Path $p -Parent
            if ($env:Path -notlike "*${dir}*") {
                $env:Path = "$env:Path;$dir"
                Write-Host "Added Git to session PATH: $dir"
            } else {
                Write-Host "Git directory already in session PATH: $dir"
            }
            return $true
        }
    }
    return $false
}

function Ensure-Git {
    # Try where.exe first
    try {
        $where = & where.exe git 2>$null
        if ($where) {
            Write-Host "git found at: $where"
            return $true
        }
    } catch { }

    # Try adding common locations to PATH for this session
    if (Add-Git-To-PathIfFound) {
        try {
            $v = & git --version 2>$null
            if ($v) { Write-Host "Found: $v"; return $true }
        } catch { }
    }

    Write-Error "Git not found. Install Git for Windows and ensure it's on PATH: https://git-scm.com/download/win"
    return $false
}

function Ensure-GitEditor {
    # If no core.editor is configured, choose a sensible default for the user
    try {
        $editor = git config --global --get core.editor 2>$null
    } catch {
        $editor = $null
    }
    if (-not $editor) {
        # prefer 'code --wait' if available, otherwise fallback to notepad
        $cmd = Get-Command code -ErrorAction SilentlyContinue
        $codePath = $null
        if ($cmd) { $codePath = $cmd.Source }
        if ($codePath) {
            git config --global core.editor "code --wait"
            Write-Host "Set git core.editor to 'code --wait'"
        } else {
            git config --global core.editor "notepad.exe"
            Write-Host "Set git core.editor to 'notepad.exe'"
        }
    }
}

if (-not (Ensure-Git)) { exit 1 }
Ensure-GitEditor

# initialize repo if needed
if (-not (Test-Path -Path (Join-Path $projectRoot '.git'))) {
    Write-Host "Initializing git repository..."
    git init
} else {
    Write-Host ".git already exists - using existing repository."
}

# check for user.name/email and warn (don't auto-set)
try {
    $name = git config --global user.name 2>$null
    $email = git config --global user.email 2>$null
} catch {
    $name = $null; $email = $null
}
if (-not $name -or -not $email) {
    Write-Warning "Git user.name or user.email not set globally. If you see 'unable to auto-detect email' errors, run:`n  git config --global user.name \"Your Name\"`n  git config --global user.email \"you@example.com\""
}

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

function Try-Push {
    Write-Host "About to push to origin/main. If prompted, authenticate using GitHub credentials or a Personal Access Token (PAT) for HTTPS."
    & git push -u origin main
    return $LASTEXITCODE
}

$rc = Try-Push
if ($rc -eq 0) {
    Write-Host ("Push completed successfully. Open your repo: " + $remoteUrl)
    exit 0
} else {
    Write-Warning "Push failed with exit code $rc. Attempting to help resolve common issues."
    Write-Host "If the remote already has commits, you can run:`n  git pull --rebase origin main`nthen resolve any conflicts and run `git push -u origin main` again."
    Write-Host "If you'd rather abort and merge instead:`n  git rebase --abort`n  git pull origin main`nresolve conflicts, then `git push -u origin main`"
    exit $rc
}
