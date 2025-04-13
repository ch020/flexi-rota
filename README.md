# 🚀 FlexiRota

[![Netlify Status](https://api.netlify.com/api/v1/badges/646db211-4c8b-4e5f-9d6f-2c8a411ef641/deploy-status)](https://app.netlify.com/sites/flexirota/deploys)

**FlexiRota** is a smart shift and availability management app designed for teams. It enables employees to set their unavailability and allows managers to view and manage team rotas efficiently.

---

## 🌐 Live Frontend

🔗 [https://flexirota.netlify.app](https://flexirota.netlify.app)

---

## 🧱 Tech Stack

- **Frontend:** React + Vite (hosted on Netlify)
- **Backend:** Django + Django REST Framework
- **Auth:** JWT (via `djangorestframework-simplejwt`)
- **Docs:** Swagger UI at `/api/docs/swagger/`
- **Database:** SQLite (development only)

---

## 📦 Features

### For Employees
- Submit availability/unavailability with start and end times
- View personal availability calendar
- Secure authentication with JWT

### For Managers
- Generate invite links to onboard employees
- View team availability within the organisation
- Admin access to manage all users and schedules

---

## 🛠️ Local Development

### 🔹 Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/ch020/flexi-rota.git
cd flexi-rota/backend
```

2. Set up and activate a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the backend server:
```bash
python manage.py runserver
```

- Swagger UI available at: `http://localhost:8000/api/docs/swagger/`

5. Create a superuser for admin dashboard:
```bash
python manage.py createsuperuser
```

---

### 🔹 Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

- Local frontend will typically run at: `http://localhost:5173`

> Make sure the frontend is configured to send API requests to the backend at `http://localhost:8000`.

---

## 🔐 Authentication Endpoints

- `POST /api/token/` – Login (returns access + refresh tokens)
- `POST /api/token/refresh/` – Get new access token
- `POST /api/logout/` – Blacklist refresh token

---

## 📁 Backend Directory Structure

```
backend/
├── backend/            # Django settings
├── rota/               # App: models, views, serializers
├── docs/               # Optional: Swagger static UI
├── manage.py
└── requirements.txt
```

---

## ✨ Credits

Developed by:
- Matthew Chapman
- Matthew Harris
- Aaran Saluja
- Milo Lombardo

---

## 📬 Contact / Issues

If you find a bug or want to contribute, feel free to open an issue or PR. For questions, reach out to Matt or any team member directly.

---

> FlexiRota – Designed for simplicity. Built for flexibility. 💼
