# Vehicle Tracking Management System

A comprehensive web application for real-time vehicle tracking with machine learning capabilities.

## Features

- **User Roles**: Admin, Fleet Manager, Driver, Customer with role-based access control
- **Real-time GPS Tracking**: Live vehicle location monitoring with interactive maps
- **Machine Learning**:
  - Anomaly detection for unusual vehicle behavior
  - Predictive maintenance alerts
  - Route optimization
- **Dashboard & Analytics**: Fleet overview with KPIs and downloadable reports
- **Security**: JWT authentication, HTTPS encryption, GPS spoofing protection
- **Reliability**: Automatic reconnection and offline data storage

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: React with TailwindCSS and Leaflet.js
- **Database**: PostgreSQL
- **ML Service**: Python with FastAPI and scikit-learn
- **Real-time**: Socket.IO
- **Deployment**: Docker

## Quick Start

### Prerequisites

- **Docker and Docker Compose** (recommended for easy setup)
- **Node.js 18+** (for local backend/frontend development)
- **Python 3.11+** (for local ML service development)
- **PostgreSQL** (for local database, if not using Docker)

#### Installing Prerequisites

1. **Install Docker**: Download and install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop). This includes Docker Compose.

2. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/). Version 18 or higher.

3. **Install Python**: Download from [python.org](https://www.python.org/). Version 3.11 or higher.

4. **Install PostgreSQL** (optional, for local database):
   - Download from [postgresql.org](https://www.postgresql.org/download/).
   - Create a database named `vehicle_tracking`.
   - Run the SQL script in `backend/database/init.sql` to initialize the database.

### Using Docker (Recommended)

1. Ensure Docker Desktop is running.
2. Clone the repository
3. Run the application:
    ```bash
    docker compose up --build
    ```

3. Access the application:
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:5000
    - ML Service: http://localhost:8000
    - pgAdmin (Database Admin): http://localhost:5050 (login: admin@admin.com / admin)

### Local Development

1. **Configure Environment Variables**:
    - Copy `backend/.env` and update the placeholders (e.g., set a secure `JWT_SECRET`).

2. **Backend**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **ML Service**:
   ```bash
   cd ml-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app:app --reload
   ```

4. **Database**:
    - For Docker: Included in docker-compose.
    - For local PostgreSQL: Start PostgreSQL server (pg_ctl start), set PGPASSWORD=yourpassword, create database: psql -U postgres -c "CREATE DATABASE vehicle_tracking;", run init.sql: psql -U postgres -d vehicle_tracking -f backend/database/init.sql. Update .env DB_HOST=localhost, DB_PASSWORD=yourpassword.

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Tracking
- `GET /api/tracking/latest` - Get latest positions
- `GET /api/tracking/vehicle/:id` - Get vehicle GPS history
- `POST /api/tracking/gps` - Submit GPS data
- `GET /api/tracking/route/:id` - Get route history

### ML Service
- `POST /anomaly-detection` - Detect anomalies
- `POST /predictive-maintenance` - Predict maintenance
- `POST /route-optimization` - Optimize routes

## Default Users

- **Admin**: username: `admin`, password: `admin123`
- **Manager**: username: `manager1`, password: `manager123`
- **Driver**: username: `driver1`, password: `driver123`

## Project Structure

```
vehicle-tracking-management-system/
├── backend/                 # Node.js Express API
├── frontend/               # React application
├── ml-service/            # Python ML microservice
├── docs/                  # Documentation
├── docker-compose.yml     # Docker orchestration
└── README.md
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Helmet.js security headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Deployment to Cloud

### AWS Deployment

1. **EC2 Instance**:
   - Launch EC2 instance with Ubuntu
   - Install Docker and Docker Compose
   - Clone repository and run `docker compose up -d`

2. **RDS PostgreSQL**:
   - Create RDS instance
   - Update environment variables in docker-compose.yml

3. **S3** (optional for file storage)

### Google Cloud Platform

1. **GCE VM**:
   - Create VM instance
   - Install Docker
   - Deploy with docker-compose

2. **Cloud SQL**:
   - PostgreSQL instance
   - Update connection strings

### Azure

1. **VM or AKS**:
   - Deploy containers using Azure Container Instances or AKS

2. **Azure Database for PostgreSQL**

## Environment Variables

Create `.env` files in backend/ and ml-service/:

```env
# Backend .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vehicle_tracking
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_secure_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ML_SERVICE_URL=http://localhost:8000

# ML Service .env (if needed)
```

## License

This project is licensed under the MIT License.