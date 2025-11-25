import pkg from 'duckdb';
const { Database } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
const DB_PATH = path.join(DATA_DIR, 'dashboard.duckdb');

// Delete existing database
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Deleted existing database');
}

const db = new Database(DB_PATH);

// Get all JSON files
const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

console.log(`Found ${jsonFiles.length} JSON files to import`);

jsonFiles.forEach(file => {
  const tableName = path.basename(file, '.json');
  const filePath = path.join(DATA_DIR, file);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Skip empty files
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.log(`Skipping empty file: ${file}`);
      return;
    }

    // For array data
    if (Array.isArray(data)) {
      console.log(`Creating table ${tableName} with ${data.length} rows...`);

      // Create a temporary JSON file for DuckDB to read
      const tempFile = path.join(DATA_DIR, `temp_${file}`);
      fs.writeFileSync(tempFile, JSON.stringify(data));

      // Use DuckDB's JSON reading capability
      db.exec(`CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${tempFile.replace(/\\/g, '/')}')`);

      // Clean up temp file
      fs.unlinkSync(tempFile);

      console.log(`✓ Created table ${tableName}`);
    } else {
      // For object data, we need to convert it to a single-row table
      console.log(`Creating table ${tableName} from object...`);

      const tempFile = path.join(DATA_DIR, `temp_${file}`);
      fs.writeFileSync(tempFile, JSON.stringify([data]));

      db.exec(`CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${tempFile.replace(/\\/g, '/')}')`);

      fs.unlinkSync(tempFile);

      console.log(`✓ Created table ${tableName}`);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
});

// Get table info
db.all("SELECT table_name FROM information_schema.tables WHERE table_schema='main'", (err, tables) => {
  if (err) {
    console.error('Error listing tables:', err);
  } else {
    console.log('\n=== Database Summary ===');
    console.log(`Total tables created: ${tables.length}`);
    tables.forEach(table => {
      db.all(`SELECT COUNT(*) as count FROM ${table.table_name}`, (err, result) => {
        if (!err && result) {
          console.log(`  - ${table.table_name}: ${result[0].count} rows`);
        }
      });
    });
  }

  db.close();
  console.log('\n✓ Database build complete!');
  console.log(`Database saved to: ${DB_PATH}`);
});
