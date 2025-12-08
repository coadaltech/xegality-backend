import sql from "mssql";
import { Parser } from "json2csv";
import fs from "fs";

const pool = new sql.ConnectionPool({
  user: "xegality",
  password: "xegality",
  server: "172.24.132.187", // LAN IP of Windows machine
  port: 1433, // ensure same as configured
  database: "Data_AC",
  options: {
    encrypt: false, // set true if using SSL
    trustServerCertificate: true,
  },
});

pool
  .connect()
  .then(() => console.log("Connected to SQL Server"))
  .catch((err) => console.error("Connection failed:", err));

// export { pool };

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
