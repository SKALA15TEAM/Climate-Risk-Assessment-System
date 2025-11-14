## Backend (FastAPI)
### 1) 이동
```python
cd backend
```

### 2) 가상환경 생성 (최초 1회)
```python
python3 -m venv venv
```

### 3) 활성화
```
# mac / linux

source venv/bin/activate


# windows

venv\Scripts\activate
```


### 4) 패키지 설치
```
pip install -r requirements.txt
```

### 5) 환경변수(.env) 생성

📌 backend/.env

```
OPENAI_API_KEY=YOUR_KEY
```

### 6) 서버 실행
```
uvicorn app.main:app --reload
```