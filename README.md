# TransitOps
# 🚛 Transport Management System (TMS)

An End-to-End Transport Operations Platform that digitizes vehicle, driver, dispatch, maintenance, and expense management while enforcing business rules and providing operational insights.

---

## 📌 Features

- 🚚 Vehicle Management
- 👨‍✈️ Driver Management
- 📦 Dispatch & Trip Management
- 🛠️ Vehicle Maintenance Tracking
- 💰 Expense Management
- 👥 Role-Based Access Control (RBAC)
- 🔐 Secure Authentication
- 📊 Dashboard & Operational Insights
- 🔍 REST APIs using Django Ninja
- 📱 Responsive UI with Next.js

---

# 🛠 Tech Stack

## Frontend

- Next.js 14+
- TypeScript
- Tailwind CSS
- Shadcn UI
- Axios

## Backend

- Django
- Django Ninja
- Django ORM

## Database

- PostgreSQL

## Authentication

- Django Authentication
- Role-Based Access Control (RBAC)

---

# 📂 Project Structure

```
transport-management-system/

│
├── backend/
│   ├── config/
│   ├── core/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env (ignored)
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.local
│
├── .gitignore
├── README.md
└── LICENSE (optional)
```

---

# ⚙️ Prerequisites

Install the following before running the project.

- Python 3.11+
- Node.js 20+
- npm
- PostgreSQL
- Git

---

# 🚀 Clone Repository

```bash
git clone https://github.com/Rijul1048/TransitOps.git

cd your-repository
```

---

# 🐍 Backend Setup

Navigate to backend

```bash
cd backend
```

## Create Virtual Environment

Windows

```bash
python -m venv venv
venv\Scripts\activate
```

Linux / Mac

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Create Environment File

Create a file named

```
.env
```

inside the backend folder.

Example:

```env
SECRET_KEY=your-secret-key

DB_NAME=your_database_name
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

---

## Create PostgreSQL Database

Create a PostgreSQL database using any name.

Example

```
transport_db
```

or

```
my_database
```

Update your `.env` file with the same database credentials.

---

## Apply Migrations

```bash
python manage.py migrate
```

---

## Create Superuser

```bash
python manage.py createsuperuser
```

---

## Run Backend

```bash
python manage.py runserver
```

Backend will start at

```
http://127.0.0.1:8000
```

---

# 💻 Frontend Setup

Open another terminal.

Navigate to frontend

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Create

```
.env.local
```

Example

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Run development server

```bash
npm run dev
```

Frontend runs at

```
http://localhost:3000
```

---

# 🔄 Running the Project

Start Backend

```bash
cd backend

venv\Scripts\activate

python manage.py runserver
```

Start Frontend

```bash
cd frontend

npm run dev
```

---

# 📦 Installing New Python Packages

Whenever a new package is installed

```bash
pip install package_name
```

Update

```bash
pip freeze > requirements.txt
```

Commit the updated requirements file.

---

# 📦 Installing New npm Packages

```bash
npm install package-name
```

Commit the updated

```
package.json
```

and

```
package-lock.json
```

---

# 👥 Working as a Team

## Pull latest changes

```bash
git pull origin main
```

---

## Create a new branch

```bash
git checkout -b feature/feature-name
```

---

## Push your branch

```bash
git add .

git commit -m "Added feature"

git push origin feature/feature-name
```

---

## Create Pull Request

Open a Pull Request on GitHub before merging into `main`.

---

# 🔐 Environment Variables

Backend

```
backend/.env
```

Frontend

```
frontend/.env.local
```

These files are intentionally ignored by Git and must **never** be committed.

---

