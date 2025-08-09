CRM System
A Customer Relationship Management (CRM) application built with Django (backend) and React (frontend).

🚀 Development Setup
1️⃣ Backend Setup
bash
Copy code
# Navigate to the server folder
cd Server

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py makemigrations
python manage.py migrate
2️⃣ Environment Variables
Create a .env file inside the Server folder and add:

env
Copy code
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=2134
DB_NAME=crm
3️⃣ Frontend Setup
bash
Copy code
# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
📂 Project Structure
bash
Copy code
CRM/
│
├── Server/            # Django backend
│   ├── manage.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/          # React frontend
│   ├── package.json
│   └── ...
│
└── README.md
🛠 Tech Stack
Backend: Django, Django REST Framework

Frontend: React, Vite

Database: PostgreSQL

🏃 Running the App
After following the steps above:

Start Backend

bash
Copy code
cd Server
venv\Scripts\activate  # or source venv/bin/activate
python manage.py runserver
Start Frontend

bash
Copy code
cd frontend
npm run dev
📜 License
This project is licensed under the MIT License.
