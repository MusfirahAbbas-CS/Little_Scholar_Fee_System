python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
python seed.py
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
