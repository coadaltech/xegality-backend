import sql from "mssql";
import { Parser } from "json2csv";
import fs from "fs";

// const pool = new sql.ConnectionPool({
//   user: "xegality",
//   password: "xegality",
//   server: "172.24.132.187", // LAN IP of Windows machine
//   port: 1433, // ensure same as configured
//   database: "Data_AC",
//   options: {
//     encrypt: false, // set true if using SSL
//     trustServerCertificate: true,
//   },
// });

const pool = new sql.ConnectionPool({
  user: "coadal",
  password: "Aman5105",
  server: "xegalitydbserver.database.windows.net",
  database: "xegality_cases",
  options: {
    encrypt: true,
    trustServerCertificate: false,
    requestTimeout: 60000, // 1 minutes timeout for large database queries
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  }
});

// Lazy connection - only connect when actually needed
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
  // Check if already connected
  if (isConnected && pool.connected) {
    return;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    try {
      await connectionPromise;
      if (isConnected && pool.connected) {
        return;
      }
    } catch {
      // Connection failed, reset and try again below
      connectionPromise = null;
    }
  }

  // Attempt to connect
  connectionPromise = pool
    .connect()
    .then(() => {
      isConnected = true;
      console.log("Connected to SQL Server");
    })
    .catch((err) => {
      isConnected = false;
      connectionPromise = null;
      console.error("SQL Server connection failed:", err.message);
      throw new Error(`Failed to connect to SQL Server: ${err.message}`);
    });

  return connectionPromise;
}

// Attempt to connect on module load, but don't block if it fails
ensureConnected().catch(() => {
  // Silently handle - connection will be retried when actually needed
  console.warn("SQL Server connection not available at startup. Will retry when needed.");
});

export { pool, ensureConnected };

async function exportToCSV() {
  try {
    await pool.connect();
    console.log("Exporting to CSV...");

    const result = await pool
      .request()
      .query("SELECT TOP 6000 * FROM citation");

    const parser = new Parser();
    const csv = parser.parse(result.recordset);

    fs.writeFileSync("output2.csv", csv);
    console.log("CSV saved as output.csv");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.close();
  }
}

// exportToCSV();
