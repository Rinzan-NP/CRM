# CRM System
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/Rinzan-NP/CRM)

A comprehensive Customer Relationship Management (CRM) application built with a Django REST Framework backend and a React frontend. It provides tools for managing customers, suppliers, sales, and auditing.

## ✨ Features

*   **Authentication**: Secure user registration and login using JWT, with role-based access control (Admin, Salesperson, Accountant).
*   **Customer & Supplier Management**: Full CRUD (Create, Read, Update, Delete) functionality for both customers and suppliers.
*   **Transaction Management**:
    *   Create and manage Sales Orders and Purchase Orders.
    *   Generate Invoices from Sales Orders.
    *   Track Payments against invoices.
*   **Product & Inventory**: Manage products, including pricing and VAT categories.
*   **Route Planning**: Create and manage salesperson routes and track customer visits.
*   **Auditing**: Automatically logs all create, update, and delete actions on models for traceability.
*   **Modern Frontend**: A responsive and interactive user interface built with React, Redux for state management, and Tailwind CSS for styling.
*   **RESTful API**: A well-structured API built with Django REST Framework.

## 🛠 Tech Stack

*   **Backend**:
    *   Python, Django, Django REST Framework
    *   PostgreSQL
    *   Simple JWT for authentication
    *   Decouple for environment management
*   **Frontend**:
    *   React, Vite
    *   Redux Toolkit for state management
    *   React Router for navigation
    *   Axios for API requests
    *   Tailwind CSS for styling

## 📂 Project Structure

The repository is organized into two main parts: a Django backend and a React frontend.

```
crm/
├── Frontend/           # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom hooks (e.g., useAuth)
│   │   ├── pages/      # Page components (Dashboard, Customers, etc.)
│   │   ├── redux/      # Redux Toolkit slices and store
│   │   ├── router/     # Routing configuration
│   │   └── services/   # API service layer
│   ├── package.json
│   └── vite.config.js
│
├── Server/             # Django backend application
│   ├── accounts/       # User management and authentication
│   ├── audit/          # Auditing and logging
│   ├── main/           # Core models (Customer, Supplier, Product)
│   ├── transactions/   # Business transactions (Orders, Invoices)
│   ├── core/           # Django project settings and main urls
│   ├── manage.py
│   └── requirements.txt
│
└── README.md
```

## 🚀 Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

*   Python 3.8+ and Pip
*   Node.js and npm
*   PostgreSQL database

### 1. Backend Setup (Server)

First, set up the Django server.

```bash
# 1. Navigate to the server directory
cd Server

# 2. Create and activate a virtual environment
# On Windows:
python -m venv venv
venv\Scripts\activate

# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Set up environment variables
# Create a .env file in the Server/ directory with your database credentials:
# Server/.env
DB_NAME=crm
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

# 5. Apply database migrations
python manage.py makemigrations
python manage.py migrate

# 6. Start the backend server
python manage.py runserver
```

The Django server will be running at `http://localhost:8000`.

### 2. Frontend Setup

Next, set up the React client.

```bash
# 1. Open a new terminal and navigate to the frontend directory
cd Frontend

# 2. Install Node.js dependencies
npm install

# 3. Start the frontend development server
npm run dev
```

The React development server will start, and the application will be accessible at `http://localhost:5173`.

## 📜 License

This project is licensed under the MIT License.
