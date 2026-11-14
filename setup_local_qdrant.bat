@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "QUIET=0"
if /i "%~1"=="--quiet" set "QUIET=1"

where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker CLI not found. Install Docker Desktop first.
    if "%QUIET%"=="0" pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Starting Docker Desktop...
    set "DOCKER_DESKTOP=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    if not exist "!DOCKER_DESKTOP!" set "DOCKER_DESKTOP=%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
    if exist "!DOCKER_DESKTOP!" (
        start "" "!DOCKER_DESKTOP!"
    ) else (
        echo [ERROR] Docker Desktop was not found.
        if "%QUIET%"=="0" pause
        exit /b 1
    )
    powershell -NoProfile -Command "for($i=0;$i -lt 90;$i++){ docker info *> $null; if($LASTEXITCODE -eq 0){exit 0}; Start-Sleep -Seconds 2 }; exit 1"
    if errorlevel 1 (
        echo [ERROR] Docker did not start in time.
        if "%QUIET%"=="0" pause
        exit /b 1
    )
)

docker inspect rag-qdrant >nul 2>&1
if errorlevel 1 (
    echo Creating local Qdrant container...
    docker run -d --name rag-qdrant -p 6333:6333 -p 6334:6334 -v "%~dp0qdrant_storage:/qdrant/storage" qdrant/qdrant
    if errorlevel 1 (
        echo [ERROR] Could not create the rag-qdrant container.
        if "%QUIET%"=="0" pause
        exit /b 1
    )
) else (
    docker start rag-qdrant >nul 2>&1
)

echo Waiting for local Qdrant on http://localhost:6333 ...
powershell -NoProfile -Command "for($i=0;$i -lt 60;$i++){ try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:6333/collections' -TimeoutSec 2; if($r.StatusCode -eq 200){exit 0} } catch {}; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
    echo [ERROR] Local Qdrant is not responding. Check: docker logs rag-qdrant
    if "%QUIET%"=="0" pause
    exit /b 1
)

echo Seeding local Qdrant from embeddings\ ...
.venv\Scripts\python.exe phase3_qdrant_store.py --local
if errorlevel 1 (
    echo [ERROR] Seeding failed.
    if "%QUIET%"=="0" pause
    exit /b 1
)

echo Local Qdrant is ready at http://localhost:6333
if "%QUIET%"=="0" pause
endlocal
