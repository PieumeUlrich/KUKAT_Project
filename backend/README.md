# ⚙️ Backend Setup

## 1. Navigate to the backend folder
```bash
cd backend

## 2. Install dependencies
`npm install`

## 3. Configure SQL Server connection
Edit the file: `db/config.js`

`export default {
  user: "YOUR_USERNAME",
  password: "YOUR_PASSWORD",
  server: "YOUR_SERVER_NAME",
  database: "TravelAgency",
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  port: 1433
};`

## 4. Start the backend server
`npm start`
## 5. Backend will run at:
`http://localhost:3001`