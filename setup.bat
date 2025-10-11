@echo off
chcp 65001 >nul
title 호스피스 챗봇 - 초기 설정

REM 현재 디렉토리로 이동 (더블클릭 시 경로 문제 해결)
cd /d "%~dp0"

cls

echo.
echo ============================================================
echo   호스피스 챗봇 v1.0 - 초기 설정
echo ============================================================
echo.

REM 1. Python 확인
echo [1/4] Python 확인 중...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Python이 설치되지 않았습니다.
    echo Python 3.9 이상을 설치해주세요: https://www.python.org
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo [OK] Python %%i 발견
echo.

REM 2. 가상환경 생성 (이미 있으면 스킵)
echo [2/4] 가상환경 확인 중...
if exist "venv\Scripts\activate.bat" (
    echo [OK] 가상환경이 이미 존재합니다.
) else (
    echo [설치] 가상환경 생성 중...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [오류] 가상환경 생성 실패
        pause
        exit /b 1
    )
    echo [OK] 가상환경 생성 완료
)
echo.

REM 3. 패키지 설치
echo [3/4] 패키지 설치 중... (수 분 소요)
call venv\Scripts\activate.bat
pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cu118 --quiet
if %errorlevel% neq 0 (
    echo [오류] 패키지 설치 실패
    pause
    exit /b 1
)
echo [OK] 패키지 설치 완료
echo.

REM 4. Ollama 및 모델 확인
echo [4/4] Ollama 확인 중...
ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo [경고] Ollama가 설치되지 않았습니다.
    echo.
    echo Ollama를 설치해주세요:
    echo 1. https://ollama.ai 방문
    echo 2. Windows용 Ollama 다운로드 및 설치
    echo 3. 이 스크립트를 다시 실행
    echo.
    pause
    exit /b 1
)
echo [OK] Ollama 발견
echo.

echo Qwen2.5 14B 모델 확인 중...
ollama list | findstr "qwen2.5:14b" >nul 2>&1
if %errorlevel% neq 0 (
    echo [다운로드] Qwen2.5 14B 모델 다운로드 중... (약 9GB, 수 분 소요)
    echo 잠시만 기다려주세요...
    ollama pull qwen2.5:14b
    if %errorlevel% neq 0 (
        echo [오류] 모델 다운로드 실패
        pause
        exit /b 1
    )
    echo [OK] 모델 다운로드 완료
) else (
    echo [OK] Qwen2.5 14B 모델 발견
)
echo.

REM 5. 벡터 DB 초기화 (선택사항)
if not exist "vector_db" (
    echo [초기화] 벡터 데이터베이스 생성 중... (수 분 소요)
    python init_vectordb.py
    if %errorlevel% neq 0 (
        echo [경고] 벡터 DB 생성 중 오류 발생
        echo 첫 실행 시 자동으로 생성됩니다.
    )
)

echo.
echo ============================================================
echo   초기 설정 완료!
echo ============================================================
echo.
echo 이제 start.bat을 실행하여 챗봇을 시작할 수 있습니다.
echo.
pause
