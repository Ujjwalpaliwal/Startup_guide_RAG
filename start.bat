@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at .venv
    echo         Run: uv sync
    pause
    exit /b 1
)

if not exist "ui\node_modules" (
    echo [ERROR] ui\node_modules not found
    echo         Run: cd ui ^&^& npm install
    pause
    exit /b 1
)

if not exist ".env" (
    echo [WARN] .env not found - copy .env.example to .env and fill in the keys.
) else (
    set "QURL="
    for /f "usebackq delims=" %%u in (`powershell -NoProfile -Command "(Get-Content .env ^| Where-Object {$_ -match '^QDRANT_URL='}) -replace '^QDRANT_URL=',''"`) do set "QURL=%%u"
    if defined QURL (
        curl.exe -s -o NUL --max-time 6 "%QURL%/collections" >nul 2>&1
        if errorlevel 1 (
            echo Qdrant Cloud is unreachable. Preparing local fallback...
            call "%~dp0setup_local_qdrant.bat" --quiet
        )
    )
)

echo Starting RAG API on http://localhost:8000 ...
start "RAG API" /D "%~dp0" cmd /k ".venv\Scripts\python.exe -m uvicorn api:app --reload --port 8000"

echo Starting RAG UI on http://localhost:5173 ...
start "RAG UI" /D "%~dp0ui" cmd /k "npm run dev"

echo Both services launched in separate windows.
endlocal
