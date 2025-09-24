# KSRTC Bus Tracking System - MySQL Setup Guide

## 🗄️ Database Configuration

### MySQL Database Details
- **Host**: localhost
- **Port**: 3306
- **Username**: root
- **Password**: admin
- **Database**: bustrack

## 🚀 Quick Setup Instructions

### 1. Prerequisites
Make sure you have the following installed:
- **Node.js** (v18 or higher)
- **MySQL Server** (v8.0 or higher)
- **npm** or **yarn**

### 2. MySQL Server Setup

#### Install MySQL (if not already installed)

**Windows:**
```bash
# Download MySQL Installer from https://dev.mysql.com/downloads/installer/
# Or use Chocolatey
choco install mysql
```

**macOS:**
```bash
# Using Homebrew
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Configure MySQL
1. **Start MySQL service**
2. **Set root password to 'admin'** (if not already set):
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'admin';
   FLUSH PRIVILEGES;
   ```

### 3. Backend Setup

#### Step 1: Install Dependencies
```bash
cd backend
npm install
```

#### Step 2: Create Environment File
Create a `.env` file in the backend directory:
```bash
# MySQL Database Configuration
DATABASE_URL="mysql://root:admin@localhost:3306/bustrack"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=5000
NODE_ENV="development"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

#### Step 3: Setup Database
```bash
# Setup MySQL database
npm run setup:mysql

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed
```

#### Step 4: Start Backend Server
```bash
npm run dev
```

### 4. Frontend Setup

#### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

#### Step 2: Create Environment File
Create a `.env` file in the frontend directory:
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Socket.IO Configuration
VITE_SOCKET_URL=http://localhost:5000

# Google Maps API Key (REQUIRED)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### Step 3: Start Frontend Server
```bash
npm run dev
```

## 🔧 Database Schema

The system will create the following tables in the `bustrack` database:

### Tables Created
- **users** - User accounts (Admin, Driver, Passenger)
- **buses** - Bus fleet information
- **routes** - Bus routes and destinations
- **trips** - Scheduled trips
- **locations** - Real-time GPS locations
- **bookings** - Passenger bookings

### Sample Data
The seed script will create:
- 1 Admin user
- 2 Driver users
- 1 Passenger user
- 2 Sample buses
- 2 Sample routes
- 2 Sample trips
- 1 Sample booking

## 🧪 Demo Credentials

### Admin
- **Email**: admin@ksrtc.com
- **Password**: admin123

### Driver 1
- **Email**: driver1@ksrtc.com
- **Password**: driver123

### Driver 2
- **Email**: driver2@ksrtc.com
- **Password**: driver123

### Passenger
- **Email**: passenger@example.com
- **Password**: passenger123

## 🛠️ Troubleshooting

### MySQL Connection Issues

#### Error: "Access denied for user 'root'@'localhost'"
```bash
# Reset MySQL root password
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'admin';
FLUSH PRIVILEGES;
EXIT;
```

#### Error: "Can't connect to MySQL server"
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL service
sudo systemctl start mysql

# On Windows
net start mysql
```

#### Error: "Database 'bustrack' doesn't exist"
```bash
# Run the setup script
npm run setup:mysql
```

### Prisma Issues

#### Error: "Prisma Client not generated"
```bash
npm run db:generate
```

#### Error: "Schema not pushed to database"
```bash
npm run db:push
```

#### Reset Database (if needed)
```bash
npm run db:reset
npm run db:seed
```

## 📊 Database Management

### View Database
```bash
# Connect to MySQL
mysql -u root -p
# Enter password: admin

# Use the database
USE bustrack;

# View tables
SHOW TABLES;

# View users
SELECT * FROM users;

# View buses
SELECT * FROM buses;
```

### Backup Database
```bash
# Create backup
mysqldump -u root -p bustrack > bustrack_backup.sql

# Restore backup
mysql -u root -p bustrack < bustrack_backup.sql
```

## 🚀 Production Deployment

### Environment Variables for Production
```bash
# Production Database URL
DATABASE_URL="mysql://username:password@your-mysql-host:3306/bustrack"

# Production JWT Secret (use a strong secret)
JWT_SECRET="your-production-jwt-secret"

# Production Server Configuration
PORT=5000
NODE_ENV="production"

# Production Frontend URL
FRONTEND_URL="https://your-domain.com"
```

### Production Database Setup
1. **Create production MySQL database**
2. **Set up proper user permissions**
3. **Configure SSL connections**
4. **Set up database backups**
5. **Monitor database performance**

## 📈 Performance Optimization

### MySQL Configuration
```sql
-- Optimize MySQL for the application
SET GLOBAL innodb_buffer_pool_size = 1G;
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 64M;
```

### Indexing
The Prisma schema includes proper indexing for:
- User email (unique)
- Bus number (unique)
- License plate (unique)
- Trip status and scheduled time
- Location timestamps

## 🔒 Security Considerations

### Database Security
- **Use strong passwords** for production
- **Limit database user permissions**
- **Enable SSL connections**
- **Regular security updates**
- **Monitor database access logs**

### Application Security
- **Use environment variables** for sensitive data
- **Implement proper JWT secrets**
- **Validate all user inputs**
- **Use HTTPS in production**
- **Regular security audits**

## 📝 Additional Commands

### Useful npm Scripts
```bash
# Setup MySQL database
npm run setup:mysql

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Start development server
npm run dev

# Start production server
npm start
```

## 🎉 You're Ready!

After following these steps, your KSRTC Bus Tracking System will be running with:
- ✅ **MySQL database** with proper schema
- ✅ **Sample data** for testing
- ✅ **Real-time tracking** capabilities
- ✅ **Google Maps integration**
- ✅ **Notification system**
- ✅ **All user roles** (Admin, Driver, Passenger)

The system is now ready for demonstration and further development!
