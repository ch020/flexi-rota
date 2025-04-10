@echo off
echo 🔄 Generating API schema...

cd backend

: Run drf-spectacular to generate schema
python manage.py spectacular --file docs\schema.yaml

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Failed to generate schema.yaml
    exit /b 1
)

:: Optionally stage it for commit
git add docs\schema.yaml

echo ✅ schema.yaml updated and staged!