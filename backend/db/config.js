// db/config.js
import dotenv from "dotenv";


const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: true,
  },
  port: 1433,
};

export default config;
// const config = {
//   user: "ulrich",
//   password: "root",
//   server: "MSI",
//   database: "TravelAgency",
//   options: {
//     encrypt: true,
//     trustServerCertificate: true,
//   },
//   port: 1433,
// };

// export default config;