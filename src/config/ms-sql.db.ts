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
    requestTimeout: 300000, // 5 minutes timeout for large database queries
    connectTimeout: 60000, // 60 seconds to establish connection
    enableArithAbort: true,
    // Azure SQL specific optimizations
    enableImplicitTransactions: false,
    isolationLevel: sql.ISOLATION_LEVEL.READ_COMMITTED,
  },
  pool: {
    max: 10,
    min: 2, // Keep minimum connections alive to avoid cold starts
    idleTimeoutMillis: 300000, // 5 minutes - keep connections alive longer
    acquireTimeoutMillis: 60000, // 60 seconds to acquire connection from pool
  }
});

// Connection state management
let isConnected = false;
let connectionPromise: Promise<void> | null = null;
let lastConnectionAttempt = 0;
let backgroundReconnectTask: NodeJS.Timeout | null = null;
let reconnectStartTime: number | null = null;
let isReconnecting = false;

const CONNECTION_RETRY_DELAY = 2000; // 2 seconds initial delay
const MAX_RETRIES = 3; // Maximum retries for immediate connection attempts
const MAX_RETRY_WINDOW = 10 * 60 * 1000; // 10 minutes maximum retry window
const MAX_RETRY_DELAY = 60000; // Maximum 60 seconds between retries (cap for exponential backoff)
const INITIAL_RETRY_DELAY = 2000; // Start with 2 seconds

// Handle connection errors and trigger automatic reconnection
pool.on('error', (err: Error) => {
  console.error('SQL Server pool error:', err.message);
  isConnected = false;
  connectionPromise = null;
  // Trigger automatic reconnection
  startBackgroundReconnection();
});

// Health check function to verify connection is actually working
async function healthCheck(): Promise<boolean> {
  try {
    const request = pool.request();
    // Use a quick query for health check - timeout is handled by pool's requestTimeout
    await request.query('SELECT 1 as health');
    return true;
  } catch (error) {
    console.warn('Connection health check failed:', (error as Error).message);
    return false;
  }
}

// Background reconnection task with exponential backoff and 10-minute max window
function startBackgroundReconnection(): void {
  // Don't start multiple reconnection tasks
  if (isReconnecting || backgroundReconnectTask) {
    return;
  }

  // If already connected, don't start reconnection
  if (isConnected && pool.connected) {
    return;
  }

  isReconnecting = true;
  reconnectStartTime = Date.now();
  let attempt = 0;
  let currentDelay = INITIAL_RETRY_DELAY;

  console.log('Starting automatic reconnection with exponential backoff (max 10 minutes)...');

  const reconnect = async (): Promise<void> => {
    // Check if we've exceeded the 10-minute window
    if (reconnectStartTime && Date.now() - reconnectStartTime > MAX_RETRY_WINDOW) {
      console.error('Automatic reconnection stopped: exceeded 10-minute retry window');
      isReconnecting = false;
      reconnectStartTime = null;
      backgroundReconnectTask = null;
      return;
    }

    // Check if already connected
    if (isConnected && pool.connected) {
      const healthy = await healthCheck();
      if (healthy) {
        console.log('Connection restored successfully via automatic reconnection');
        isReconnecting = false;
        reconnectStartTime = null;
        backgroundReconnectTask = null;
        return;
      }
    }

    try {
      attempt++;
      console.log(`Automatic reconnection attempt ${attempt}...`);
      
      // Reset connection state
      isConnected = false;
      connectionPromise = null;

      // Attempt to connect
      await pool.connect();
      
      // Verify with health check
      const healthy = await healthCheck();
      if (healthy) {
        isConnected = true;
        console.log(`Connection restored successfully after ${attempt} attempt(s)`);
        isReconnecting = false;
        reconnectStartTime = null;
        backgroundReconnectTask = null;
        return;
      } else {
        throw new Error('Health check failed after connection');
      }
    } catch (error) {
      const err = error as Error;
      console.warn(`Automatic reconnection attempt ${attempt} failed: ${err.message}`);

      // Calculate next delay with exponential backoff (capped at MAX_RETRY_DELAY)
      currentDelay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1),
        MAX_RETRY_DELAY
      );

      // Check if we still have time in the 10-minute window
      const elapsed = reconnectStartTime ? Date.now() - reconnectStartTime : 0;
      const remaining = MAX_RETRY_WINDOW - elapsed;

      if (remaining <= 0) {
        console.error('Automatic reconnection stopped: exceeded 10-minute retry window');
        isReconnecting = false;
        reconnectStartTime = null;
        backgroundReconnectTask = null;
        return;
      }

      // Use remaining time if it's less than calculated delay
      const nextDelay = Math.min(currentDelay, remaining);

      console.log(`Retrying automatic reconnection in ${Math.round(nextDelay / 1000)}s (${Math.round((MAX_RETRY_WINDOW - elapsed) / 1000)}s remaining in retry window)...`);

      // Schedule next reconnection attempt
      backgroundReconnectTask = setTimeout(() => {
        reconnect();
      }, nextDelay);
    }
  };

  // Start the reconnection process
  reconnect();
}

// Stop background reconnection if connection is restored
function stopBackgroundReconnection(): void {
  if (backgroundReconnectTask) {
    clearTimeout(backgroundReconnectTask);
    backgroundReconnectTask = null;
  }
  isReconnecting = false;
  reconnectStartTime = null;
}

// Enhanced connection function with retry logic
async function ensureConnected(retries = MAX_RETRIES): Promise<void> {
  // Check if already connected and healthy
  if (isConnected && pool.connected) {
    // Perform a quick health check
    const healthy = await healthCheck();
    if (healthy) {
      return;
    } else {
      // Connection is stale, reset and reconnect
      console.warn('Connection health check failed, reconnecting...');
      isConnected = false;
      connectionPromise = null;
    }
  }

  // Prevent too frequent reconnection attempts
  const now = Date.now();
  if (now - lastConnectionAttempt < CONNECTION_RETRY_DELAY && connectionPromise) {
    try {
      await connectionPromise;
      if (isConnected && pool.connected) {
        const healthy = await healthCheck();
        if (healthy) return;
      }
    } catch {
      // Connection failed, continue to retry below
      connectionPromise = null;
    }
  }

  // Attempt to connect with retry logic
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      lastConnectionAttempt = Date.now();
      
      // If connection is in progress, wait for it
      if (connectionPromise) {
        await connectionPromise;
        if (isConnected && pool.connected) {
          const healthy = await healthCheck();
          if (healthy) return;
        }
      }

      // Create new connection promise
      connectionPromise = pool
        .connect()
        .then(async () => {
      // Verify connection with health check
      const healthy = await healthCheck();
      if (healthy) {
        isConnected = true;
        console.log("Connected to SQL Server");
        // Stop background reconnection if it's running
        stopBackgroundReconnection();
        return;
      } else {
        throw new Error("Health check failed after connection");
      }
        })
        .catch((err) => {
          isConnected = false;
          connectionPromise = null;
          throw err;
        });

      await connectionPromise;
      return; // Successfully connected
    } catch (err) {
      const error = err as Error;
      console.error(`SQL Server connection attempt ${attempt + 1}/${retries} failed:`, error.message);
      
      if (attempt < retries - 1) {
        // Wait before retrying with exponential backoff
        const delay = CONNECTION_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Retrying connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        connectionPromise = null; // Reset for next attempt
      } else {
        // All retries exhausted - start background reconnection
        isConnected = false;
        connectionPromise = null;
        console.warn('Initial connection attempts exhausted, starting background reconnection...');
        startBackgroundReconnection();
        throw new Error(`Failed to connect to SQL Server after ${retries} attempts: ${error.message}`);
      }
    }
  }
}

// Wrapper function to execute queries with automatic retry on timeout/connection errors
async function executeQuery<T = any>(
  query: string,
  retries = 2
): Promise<sql.IResult<T>> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await ensureConnected();
      
      // Create a new request - timeout is handled by pool's requestTimeout option
      const request = pool.request();
      
      return await request.query<T>(query);
    } catch (error) {
      const err = error as Error & { code?: string };
      
      // Check if it's a timeout or connection error
      const isTimeout = err.code === 'ETIMEOUT' || err.message?.includes('Timeout');
      const isConnectionError = 
        err.code === 'ECONNRESET' || 
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('Connection') ||
        err.message?.includes('not connected');
      
      if ((isTimeout || isConnectionError) && attempt < retries) {
        console.warn(`Query attempt ${attempt + 1}/${retries + 1} failed (${err.message}), retrying...`);
        
        // Reset connection state on connection errors
        if (isConnectionError) {
          isConnected = false;
          connectionPromise = null;
          // Start background reconnection for persistent connection errors
          if (attempt === retries) {
            startBackgroundReconnection();
          }
        }
        
        // Wait before retrying with exponential backoff
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If not retryable or out of retries, throw the error
      throw error;
    }
  }
  
  throw new Error('Query execution failed after all retries');
}

// Attempt to connect on module load, but don't block if it fails
ensureConnected().catch(() => {
  // Start background reconnection if initial connection fails
  console.warn("SQL Server connection not available at startup. Starting automatic reconnection...");
  startBackgroundReconnection();
});

export { pool, ensureConnected, executeQuery };

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
