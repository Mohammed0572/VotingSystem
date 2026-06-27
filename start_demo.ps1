Set-Location server/face-recognition
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
