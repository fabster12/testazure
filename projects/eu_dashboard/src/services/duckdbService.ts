import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let tablesLoaded = false;
let initPromise: Promise<void> | null = null;

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: '/duckdb-wasm/duckdb-mvp.wasm',
    mainWorker: '/duckdb-wasm/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: '/duckdb-wasm/duckdb-eh.wasm',
    mainWorker: '/duckdb-wasm/duckdb-browser-eh.worker.js',
  },
};

const TABLE_NAMES = [
  'CUSTOMER_ACCOUNTS_YN',
  'conentry_billing',
  'invoice_corrections_ji',
  'country_list',
  'exceptions_yh',
  'FIN_CONSOLIDATION_CFC',
  'bookings_jk',
  'RATECHECKS_YQ',
  'revenue_by_customer',
  'track_trace_con_yl',
  'wave_customers'
];

// Tables that will be created from localStorage or schema
const CUSTOM_TABLES = ['WAVES', 'WAVE_ASSIGNMENTS'];

async function performInitialization(forceReload: boolean): Promise<void> {
  try {
    console.log('[1/2] Initializing DuckDB WASM...');

    // Initialize DuckDB
    if (!db || forceReload) {
      if (forceReload && db) {
        console.log('  - Force reload: closing existing connection...');
        await closeDatabase();
        tablesLoaded = false;
      }

      console.log('  - Selecting bundle...');
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

      console.log('  - Creating worker from:', bundle.mainWorker);
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();

      console.log('  - Instantiating DuckDB...');
      db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule);

      console.log('  - Connecting to database...');
      conn = await db.connect();
      console.log('[1/2] ✓ DuckDB WASM initialized');
    }

    // Load JSON files into DuckDB tables
    if (!tablesLoaded || forceReload) {
      console.log('[2/2] Loading JSON files...');
      let loadedCount = 0;

      for (const tableName of TABLE_NAMES) {
        try {
          let jsonData: any[] = [];

          // Special handling for bookings_jk - load from CSV
          if (tableName === 'bookings_jk') {
            // Always load from CSV file (skip localStorage for CSV-migrated tables)
            console.log(`  - Fetching 01_Bookings_JK.csv...`);
            const response = await fetch(`/data/01_Bookings_JK.csv`);
            if (!response.ok) {
              console.warn(`    ⚠ Skipping ${tableName}: ${response.statusText}`);
              continue;
            }
            const csvData = await response.text();

            console.log(`  - Registering ${tableName} from CSV...`);
            await db!.registerFileText(`${tableName}.csv`, csvData);

            console.log(`  - Creating table ${tableName}...`);
            await conn!.query(`DROP TABLE IF EXISTS ${tableName}`);
            await conn!.query(`CREATE TEMP TABLE ${tableName}_temp AS SELECT * FROM read_csv_auto('${tableName}.csv')`);

            // Get schema to identify VARCHAR columns and rename BookingType to value01
            const schema = await conn!.query(`
              SELECT column_name, data_type
              FROM information_schema.columns
              WHERE table_name='${tableName}_temp'
            `);

            const columns = schema.toArray().map(row => row.toJSON());
            const selectClauses = columns.map((col: any) => {
              let columnName = col.column_name;
              let outputName = columnName;

              // Map CSV column names to MainframeBooking interface
              if (columnName === 'QueryName') {
                outputName = 'queryName';
              } else if (columnName === 'YearVal') {
                outputName = 'year';
              } else if (columnName === 'MonthVal') {
                outputName = 'month';
              } else if (columnName === 'RecordCount') {
                outputName = 'recordCount';
              } else if (columnName === 'BookingType') {
                outputName = 'value01';
              }

              if (col.data_type === 'VARCHAR') {
                return `TRIM(${columnName}) AS ${outputName}`;
              }
              return `${columnName} AS ${outputName}`;
            });

            // Create final table with trimmed VARCHAR columns and renamed fields
            await conn!.query(`CREATE TABLE ${tableName} AS SELECT ${selectClauses.join(', ')} FROM ${tableName}_temp`);

            // Drop temp table
            await conn!.query(`DROP TABLE ${tableName}_temp`);

            loadedCount++;
            console.log(`  ✓ Loaded table: ${tableName} (from CSV with field mapping)`);
          } else if (tableName === 'track_trace_con_yl') {
            // Always load from CSV file (skip localStorage for CSV-migrated tables)
            console.log(`  - Fetching 02_TrackTraceConsignments_YL.csv...`);
            const response = await fetch(`/data/02_TrackTraceConsignments_YL.csv`);
            if (!response.ok) {
              console.warn(`    ⚠ Skipping ${tableName}: ${response.statusText}`);
              continue;
            }
            const csvData = await response.text();

            console.log(`  - Registering ${tableName} from CSV...`);
            await db!.registerFileText(`${tableName}.csv`, csvData);

            console.log(`  - Creating table ${tableName}...`);
            await conn!.query(`DROP TABLE IF EXISTS ${tableName}`);
            await conn!.query(`CREATE TEMP TABLE ${tableName}_temp AS SELECT * FROM read_csv_auto('${tableName}.csv')`);

            // Get schema to identify VARCHAR columns and rename fields
            const schema = await conn!.query(`
              SELECT column_name, data_type
              FROM information_schema.columns
              WHERE table_name='${tableName}_temp'
            `);

            const columns = schema.toArray().map(row => row.toJSON());
            const selectClauses = columns.map((col: any) => {
              let columnName = col.column_name;
              let outputName = columnName;

              // Map CSV column names to MainframeBooking interface
              if (columnName === 'QueryName') {
                outputName = 'queryName';
              } else if (columnName === 'YearVal') {
                outputName = 'year';
              } else if (columnName === 'MonthVal') {
                outputName = 'month';
              } else if (columnName === 'RecordCount') {
                outputName = 'recordCount';
              } else if (columnName === 'DataEntryCountry') {
                outputName = 'value01';
              } else if (columnName === 'OriginCountry') {
                outputName = 'value02';
              } else if (columnName === 'DestCountry') {
                outputName = 'value03';
              } else if (columnName === 'OpsSourceCode') {
                outputName = 'value04';
              }

              if (col.data_type === 'VARCHAR') {
                return `TRIM(${columnName}) AS ${outputName}`;
              }
              return `${columnName} AS ${outputName}`;
            });

            // Create final table with trimmed VARCHAR columns and renamed fields
            await conn!.query(`CREATE TABLE ${tableName} AS SELECT ${selectClauses.join(', ')} FROM ${tableName}_temp`);

            // Drop temp table
            await conn!.query(`DROP TABLE ${tableName}_temp`);

            loadedCount++;
            console.log(`  ✓ Loaded table: ${tableName} (from CSV with field mapping)`);
          } else {
            // Standard JSON loading for other tables
            // Check if there's updated data in localStorage first
            const localData = localStorage.getItem(`table_${tableName}`);
            if (localData) {
              console.log(`  - Loading ${tableName} from localStorage (uploaded data)...`);
              jsonData = JSON.parse(localData);
            } else {
              // Load from JSON file
              console.log(`  - Fetching ${tableName}.json...`);
              const response = await fetch(`/data/${tableName}.json`);
              if (!response.ok) {
                console.warn(`    ⚠ Skipping ${tableName}: ${response.statusText}`);
                continue;
              }
              jsonData = await response.json();
            }

            if (!Array.isArray(jsonData) || jsonData.length === 0) {
              console.warn(`    ⚠ Skipping ${tableName}: empty or invalid data`);
              continue;
            }

            console.log(`  - Registering ${tableName} (${jsonData.length} rows)...`);
            // Register JSON data as a table
            await db!.registerFileText(`${tableName}.json`, JSON.stringify(jsonData));

            console.log(`  - Creating table ${tableName}...`);
            // Drop if exists and recreate
            await conn!.query(`DROP TABLE IF EXISTS ${tableName}`);

            // Create temp table first
            await conn!.query(`CREATE TEMP TABLE ${tableName}_temp AS SELECT * FROM read_json_auto('${tableName}.json')`);

            // Get schema to identify VARCHAR columns
            const schema = await conn!.query(`
              SELECT column_name, data_type
              FROM information_schema.columns
              WHERE table_name='${tableName}_temp'
            `);

            const columns = schema.toArray().map(row => row.toJSON());
            const selectClauses = columns.map((col: any) => {
              if (col.data_type === 'VARCHAR') {
                return `TRIM(${col.column_name}) AS ${col.column_name}`;
              }
              return col.column_name;
            });

            // Create final table with trimmed VARCHAR columns
            await conn!.query(`CREATE TABLE ${tableName} AS SELECT ${selectClauses.join(', ')} FROM ${tableName}_temp`);

            // Drop temp table
            await conn!.query(`DROP TABLE ${tableName}_temp`);

            loadedCount++;
            console.log(`  ✓ Loaded table: ${tableName}`);
          }
        } catch (err) {
          console.error(`  ✗ Failed to load ${tableName}:`, err);
        }
      }

      // Create custom tables (WAVES and WAVE_ASSIGNMENTS)
      console.log('[3/3] Creating custom tables...');

      // Create WAVES table
      const wavesData = localStorage.getItem('table_WAVES');
      if (wavesData) {
        const waves = JSON.parse(wavesData);
        await db!.registerFileText('WAVES.json', JSON.stringify(waves));
        await conn!.query(`DROP TABLE IF EXISTS WAVES`);

        // Create with trimmed VARCHAR columns
        await conn!.query(`CREATE TABLE WAVES AS SELECT
          WAVE_ID,
          TRIM(WAVE_NAME) AS WAVE_NAME,
          YEAR,
          MONTH,
          CAST(COALESCE(TRY_CAST(CUSTOMERS_COUNT AS INTEGER), 0) AS INTEGER) AS CUSTOMERS_COUNT,
          CAST(COALESCE(TRY_CAST(CONSIGNMENTS_COUNT AS INTEGER), 0) AS INTEGER) AS CONSIGNMENTS_COUNT,
          CAST(COALESCE(TRY_CAST(CONSIGNMENTS_PCT AS DOUBLE), 0.0) AS DOUBLE) AS CONSIGNMENTS_PCT,
          CAST(COALESCE(TRY_CAST(REVENUE_TOTAL AS DOUBLE), 0.0) AS DOUBLE) AS REVENUE_TOTAL,
          CAST(COALESCE(TRY_CAST(REVENUE_PCT AS DOUBLE), 0.0) AS DOUBLE) AS REVENUE_PCT
        FROM read_json_auto('WAVES.json')`);
        console.log(`  ✓ Loaded WAVES table (${waves.length} waves)`);
      } else {
        await conn!.query(`DROP TABLE IF EXISTS WAVES`);
        await conn!.query(`CREATE TABLE WAVES (
          WAVE_ID INTEGER PRIMARY KEY,
          WAVE_NAME VARCHAR,
          YEAR INTEGER,
          MONTH INTEGER,
          CUSTOMERS_COUNT INTEGER DEFAULT 0,
          CONSIGNMENTS_COUNT INTEGER DEFAULT 0,
          CONSIGNMENTS_PCT DOUBLE DEFAULT 0.0,
          REVENUE_TOTAL DOUBLE DEFAULT 0.0,
          REVENUE_PCT DOUBLE DEFAULT 0.0
        )`);
        console.log(`  ✓ Created empty WAVES table`);
      }

      // Create WAVE_ASSIGNMENTS table
      const assignmentsData = localStorage.getItem('table_WAVE_ASSIGNMENTS');
      if (assignmentsData) {
        const assignments = JSON.parse(assignmentsData);
        await db!.registerFileText('WAVE_ASSIGNMENTS.json', JSON.stringify(assignments));
        await conn!.query(`DROP TABLE IF EXISTS WAVE_ASSIGNMENTS`);

        // Create with trimmed VARCHAR columns
        await conn!.query(`CREATE TABLE WAVE_ASSIGNMENTS AS SELECT TRIM(COU_ID_ACC) AS COU_ID_ACC, TRIM(ACC_ID) AS ACC_ID, WAVE_ID FROM read_json_auto('WAVE_ASSIGNMENTS.json')`);
        console.log(`  ✓ Loaded WAVE_ASSIGNMENTS table (${assignments.length} assignments)`);
      } else {
        await conn!.query(`DROP TABLE IF EXISTS WAVE_ASSIGNMENTS`);
        await conn!.query(`CREATE TABLE WAVE_ASSIGNMENTS (
          COU_ID_ACC VARCHAR,
          ACC_ID VARCHAR,
          WAVE_ID INTEGER,
          PRIMARY KEY (COU_ID_ACC, ACC_ID)
        )`);
        console.log(`  ✓ Created empty WAVE_ASSIGNMENTS table`);
      }

      tablesLoaded = true;
      console.log(`✓ DuckDB initialized with ${loadedCount}/${TABLE_NAMES.length} data tables + ${CUSTOM_TABLES.length} custom tables`);
    }
  } catch (error) {
    console.error('Failed to initialize DuckDB:', error);
    initPromise = null;
    throw error;
  }
}

export async function initDatabase(forceReload: boolean = false): Promise<void> {
  // If there's already an initialization in progress and we're not forcing reload,
  // wait for that to complete instead of starting a new one
  if (initPromise && !forceReload) {
    console.log('DuckDB initialization already in progress, waiting...');
    return initPromise;
  }

  // If already fully initialized and not forcing reload, return immediately
  if (db && conn && tablesLoaded && !forceReload) {
    console.log('DuckDB already initialized, skipping...');
    return;
  }

  // Start new initialization and store the promise
  console.log('Starting DuckDB initialization...');
  initPromise = performInitialization(forceReload);

  try {
    await initPromise;
  } finally {
    // Clear the promise once initialization is complete (success or failure)
    initPromise = null;
  }
}

// Helper function to convert BigInt to Number recursively
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }

  return obj;
}

export async function query<T = any>(sql: string): Promise<T[]> {
  if (!conn) {
    await initDatabase();
  }

  try {
    const result = await conn!.query(sql);
    const rows = result.toArray().map(row => row.toJSON());
    // Convert BigInt values to regular numbers
    return rows.map(row => convertBigIntToNumber(row) as T);
  } catch (error) {
    console.error('Query failed:', error, 'SQL:', sql);
    throw error;
  }
}

export async function getTableNames(): Promise<string[]> {
  const result = await query<{ table_name: string }>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='main' ORDER BY table_name"
  );
  return result.map(r => r.table_name);
}

export async function getTableSchema(tableName: string): Promise<{ column_name: string; data_type: string }[]> {
  return await query<{ column_name: string; data_type: string }>(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${tableName}' ORDER BY ordinal_position`
  );
}

export async function getTableData(tableName: string, limit: number = 5): Promise<any[]> {
  return await query(`SELECT * FROM ${tableName} LIMIT ${limit}`);
}

export async function getTableCount(tableName: string): Promise<number> {
  const result = await query<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`);
  return result[0]?.count || 0;
}

// Specific query functions for dashboard components
export async function getTableAsJSON(tableName: string): Promise<any[]> {
  return await query(`SELECT * FROM ${tableName}`);
}

export async function closeDatabase(): Promise<void> {
  if (conn) {
    await conn.close();
    conn = null;
  }
  if (db) {
    await db.terminate();
    db = null;
  }
}

// Upload CSV data to a table
export async function uploadCSVToTable(tableName: string, csvData: string): Promise<void> {
  if (!conn || !db) {
    await initDatabase();
  }

  try {
    // Register CSV as a file
    await db!.registerFileText(`${tableName}_upload.csv`, csvData);

    // Replace table with CSV data
    await conn!.query(`DROP TABLE IF EXISTS ${tableName}`);

    // Create temp table first
    await conn!.query(`CREATE TEMP TABLE ${tableName}_temp AS SELECT * FROM read_csv_auto('${tableName}_upload.csv')`);

    // Get schema to identify VARCHAR columns
    const schema = await conn!.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name='${tableName}_temp'
    `);

    const columns = schema.toArray().map(row => row.toJSON());
    const selectClauses = columns.map((col: any) => {
      if (col.data_type === 'VARCHAR') {
        return `TRIM(${col.column_name}) AS ${col.column_name}`;
      }
      return col.column_name;
    });

    // Create final table with trimmed VARCHAR columns
    await conn!.query(`CREATE TABLE ${tableName} AS SELECT ${selectClauses.join(', ')} FROM ${tableName}_temp`);

    // Drop temp table
    await conn!.query(`DROP TABLE ${tableName}_temp`);

    // Save to localStorage for persistence
    const data = await query(`SELECT * FROM ${tableName}`);
    localStorage.setItem(`table_${tableName}`, JSON.stringify(data));

    console.log(`✓ Uploaded CSV to table: ${tableName} (${data.length} rows)`);
  } catch (error) {
    console.error(`Failed to upload CSV to ${tableName}:`, error);
    throw error;
  }
}

// Update a specific row in a table
export async function updateTableRow(tableName: string, whereClause: string, updates: Record<string, any>): Promise<void> {
  if (!conn) {
    await initDatabase();
  }

  const setClauses = Object.entries(updates)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key} = '${value.replace(/'/g, "''")}'`;
      } else if (value === null) {
        return `${key} = NULL`;
      } else {
        return `${key} = ${value}`;
      }
    })
    .join(', ');

  const sql = `UPDATE ${tableName} SET ${setClauses} WHERE ${whereClause}`;

  try {
    await conn!.query(sql);
    console.log(`✓ Updated ${tableName}`);
  } catch (error) {
    console.error(`Failed to update ${tableName}:`, error);
    throw error;
  }
}


// Helper function to calculate wave metrics
async function calculateWaveMetrics(waveId: number): Promise<{
  customersCount: number;
  consignmentsCount: number;
  consignmentsPct: number;
  revenueTotal: number;
  revenuePct: number;
}> {
  console.log(`[calculateWaveMetrics] Starting calculation for wave ${waveId}`);
  const result = await query<{
    CUSTOMERS_COUNT: number;
    CONSIGNMENTS_COUNT: number;
    CONSIGNMENTS_PCT: number;
    REVENUE_TOTAL: number;
    REVENUE_PCT: number;
}>(`
    SELECT
      CAST(COUNT(wa.WAVE_ID) AS INTEGER) AS CUSTOMERS_COUNT,
      CAST(COALESCE(SUM(TRY_CAST(wc.CON_COUNT AS INTEGER)), 0) AS INTEGER) AS CONSIGNMENTS_COUNT,
      CAST(COALESCE(SUM(TRY_CAST(wc.CONS_PCT AS DOUBLE)), 0.0) AS DOUBLE) AS CONSIGNMENTS_PCT,
      CAST(COALESCE(SUM(TRY_CAST(wc.TOTAL_REV_EUR AS DOUBLE)), 0.0) AS DOUBLE) AS REVENUE_TOTAL,
      CAST(COALESCE(SUM(TRY_CAST(wc.REV_PCT AS DOUBLE)), 0.0) AS DOUBLE) AS REVENUE_PCT
    FROM WAVE_ASSIGNMENTS wa
    LEFT JOIN wave_customers wc
      ON wa.COU_ID_ACC = wc.COU_ID_ACC AND wa.ACC_ID = wc.ACC_ID
    WHERE wa.WAVE_ID = ${waveId}
  `);

  if (result.length === 0 || result[0].CUSTOMERS_COUNT === 0) {
    return {
      customersCount: 0,
      consignmentsCount: 0,
      consignmentsPct: 0.0,
      revenueTotal: 0.0,
      revenuePct: 0.0
    };
  }

  return {
    customersCount: Number(result[0].CUSTOMERS_COUNT) || 0,
    consignmentsCount: Number(result[0].CONSIGNMENTS_COUNT) || 0,
    consignmentsPct: Number(result[0].CONSIGNMENTS_PCT) || 0.0,
    revenueTotal: Number(result[0].REVENUE_TOTAL) || 0.0,
    revenuePct: Number(result[0].REVENUE_PCT) || 0.0
  };
}

// Helper functions for wave management

export async function assignCustomerToWave(couId: string, accId: string, waveId: number | null): Promise<void> {
  if (!conn) {
    await initDatabase();
  }

  // Trim the input values
  const trimmedCouId = couId.trim();
  const trimmedAccId = accId.trim();

  try {
    // Get the old wave ID to recalculate its metrics after removal
    const oldAssignment = await query<{ WAVE_ID: number }>(`SELECT WAVE_ID FROM WAVE_ASSIGNMENTS WHERE COU_ID_ACC = '${trimmedCouId}' AND ACC_ID = '${trimmedAccId}'`);
    const oldWaveId = oldAssignment.length > 0 ? oldAssignment[0].WAVE_ID : null;

    if (waveId === null) {
      // Remove assignment
      await conn!.query(`DELETE FROM WAVE_ASSIGNMENTS WHERE COU_ID_ACC = '${trimmedCouId}' AND ACC_ID = '${trimmedAccId}'`);
    } else {
      // Upsert assignment
      await conn!.query(`DELETE FROM WAVE_ASSIGNMENTS WHERE COU_ID_ACC = '${trimmedCouId}' AND ACC_ID = '${trimmedAccId}'`);
      await conn!.query(`INSERT INTO WAVE_ASSIGNMENTS (COU_ID_ACC, ACC_ID, WAVE_ID) VALUES ('${trimmedCouId}', '${trimmedAccId}', ${waveId})`);
    }

    // Recalculate metrics for the old wave (if exists)
    if (oldWaveId !== null) {
      const oldMetrics = await calculateWaveMetrics(oldWaveId);
      console.log(`Recalculating old wave ${oldWaveId} metrics:`, oldMetrics);
      await conn!.query(`UPDATE WAVES SET
        CUSTOMERS_COUNT = ${Number(oldMetrics.customersCount)},
        CONSIGNMENTS_COUNT = ${Number(oldMetrics.consignmentsCount)},
        CONSIGNMENTS_PCT = ${Number(oldMetrics.consignmentsPct)},
        REVENUE_TOTAL = ${Number(oldMetrics.revenueTotal)},
        REVENUE_PCT = ${Number(oldMetrics.revenuePct)}
      WHERE WAVE_ID = ${oldWaveId}`);
    }

    // Recalculate metrics for the new wave (if not null)
    if (waveId !== null) {
      const newMetrics = await calculateWaveMetrics(waveId);
      console.log(`Recalculating new wave ${waveId} metrics:`, newMetrics);
      await conn!.query(`UPDATE WAVES SET
        CUSTOMERS_COUNT = ${Number(newMetrics.customersCount)},
        CONSIGNMENTS_COUNT = ${Number(newMetrics.consignmentsCount)},
        CONSIGNMENTS_PCT = ${Number(newMetrics.consignmentsPct)},
        REVENUE_TOTAL = ${Number(newMetrics.revenueTotal)},
        REVENUE_PCT = ${Number(newMetrics.revenuePct)}
      WHERE WAVE_ID = ${waveId}`);
    }

    // Save to localStorage
    const assignments = await query('SELECT * FROM WAVE_ASSIGNMENTS');
    const waves = await query('SELECT * FROM WAVES');
    localStorage.setItem('table_WAVE_ASSIGNMENTS', JSON.stringify(assignments));
    localStorage.setItem('table_WAVES', JSON.stringify(waves));

    console.log(`✓ ${waveId === null ? 'Removed' : 'Assigned'} customer ${accId} ${waveId === null ? 'from wave' : 'to wave ' + waveId}`);
  } catch (error) {
    console.error(`Failed to assign customer:`, error);
    throw error;
  }
}

export async function createWave(waveId: number, waveName: string, year: number, month: number): Promise<void> {
  if (!conn) {
    await initDatabase();
  }

  // Trim the wave name
  const trimmedWaveName = waveName.trim();

  try {
    // Calculate initial metrics (will be 0 since no customers assigned yet)
    const metrics = await calculateWaveMetrics(waveId);
    console.log(`Creating wave ${waveId} with metrics:`, metrics);

    await conn!.query(`INSERT INTO WAVES (WAVE_ID, WAVE_NAME, YEAR, MONTH, CUSTOMERS_COUNT, CONSIGNMENTS_COUNT, CONSIGNMENTS_PCT, REVENUE_TOTAL, REVENUE_PCT)
      VALUES (${waveId}, '${trimmedWaveName.replace(/'/g, "''")}', ${year}, ${month},
        ${Number(metrics.customersCount)},
        ${Number(metrics.consignmentsCount)},
        ${Number(metrics.consignmentsPct)},
        ${Number(metrics.revenueTotal)},
        ${Number(metrics.revenuePct)})`);

    // Save to localStorage
    const waves = await query('SELECT * FROM WAVES');
    localStorage.setItem('table_WAVES', JSON.stringify(waves));

    console.log(`✓ Created wave: ${waveName}`);
  } catch (error) {
    console.error(`Failed to create wave:`, error);
    throw error;
  }
}

export async function updateWave(waveId: number, waveName: string, year: number, month: number): Promise<void> {
  if (!conn) {
    await initDatabase();
  }

  // Trim the wave name
  const trimmedWaveName = waveName.trim();

  try {
    // Recalculate metrics
    const metrics = await calculateWaveMetrics(waveId);
    console.log(`Updating wave ${waveId} with metrics:`, metrics);

    await conn!.query(`UPDATE WAVES SET
      WAVE_NAME = '${trimmedWaveName.replace(/'/g, "''")}',
      YEAR = ${year},
      MONTH = ${month},
      CUSTOMERS_COUNT = ${Number(metrics.customersCount)},
      CONSIGNMENTS_COUNT = ${Number(metrics.consignmentsCount)},
      CONSIGNMENTS_PCT = ${Number(metrics.consignmentsPct)},
      REVENUE_TOTAL = ${Number(metrics.revenueTotal)},
      REVENUE_PCT = ${Number(metrics.revenuePct)}
    WHERE WAVE_ID = ${waveId}`);

    // Save to localStorage
    const waves = await query('SELECT * FROM WAVES');
    localStorage.setItem('table_WAVES', JSON.stringify(waves));

    console.log(`✓ Updated wave: ${waveName}`);
  } catch (error) {
    console.error(`Failed to update wave:`, error);
    throw error;
  }
}

export async function deleteWave(waveId: number): Promise<void> {
  if (!conn) {
    await initDatabase();
  }

  try {
    // Remove all assignments for this wave
    await conn!.query(`DELETE FROM WAVE_ASSIGNMENTS WHERE WAVE_ID = ${waveId}`);

    // Delete the wave
    await conn!.query(`DELETE FROM WAVES WHERE WAVE_ID = ${waveId}`);

    // Save to localStorage
    const waves = await query('SELECT * FROM WAVES');
    const assignments = await query('SELECT * FROM WAVE_ASSIGNMENTS');
    localStorage.setItem('table_WAVES', JSON.stringify(waves));
    localStorage.setItem('table_WAVE_ASSIGNMENTS', JSON.stringify(assignments));

    console.log(`✓ Deleted wave ID: ${waveId}`);
  } catch (error) {
    console.error(`Failed to delete wave:`, error);
    throw error;
  }
}
