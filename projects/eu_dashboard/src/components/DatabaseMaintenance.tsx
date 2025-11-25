import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  initDatabase,
  getTableNames,
  getTableSchema,
  getTableData,
  getTableCount,
  uploadCSVToTable,
  query
} from '../services/duckdbService';
import { IconChevronDown, IconUpload, IconDownload } from './icons';

interface TableInfo {
  name: string;
  count: number;
  schema: { column_name: string; data_type: string }[];
  sampleData: any[];
  expanded: boolean;
}

const DatabaseMaintenance: React.FC = () => {
  const { theme } = useTheme();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [uploadingTable, setUploadingTable] = useState<string | null>(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM wave_customers LIMIT 10');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Initializing database...');

      // Add timeout to initialization
      const initPromise = initDatabase();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database initialization timeout after 30 seconds')), 30000)
      );

      await Promise.race([initPromise, timeoutPromise]);
      setInitializing(false);

      console.log('Loading table names...');
      const tableNames = await getTableNames();

      console.log('Loading table info for', tableNames.length, 'tables...');
      const tableInfoPromises = tableNames.map(async (name) => {
        const [count, schema, sampleData] = await Promise.all([
          getTableCount(name),
          getTableSchema(name),
          getTableData(name, 5)
        ]);

        return {
          name,
          count,
          schema,
          sampleData,
          expanded: false
        };
      });

      const tableInfo = await Promise.all(tableInfoPromises);
      setTables(tableInfo);
    } catch (err) {
      console.error('Error loading database info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load database');
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (index: number) => {
    setTables(prev => prev.map((t, i) =>
      i === index ? { ...t, expanded: !t.expanded } : t
    ));
  };

  const handleUploadCSV = (tableName: string) => {
    setUploadingTable(tableName);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingTable) return;

    try {
      const csvContent = await file.text();
      await uploadCSVToTable(uploadingTable, csvContent);

      // Reload the table data
      await loadDatabaseInfo();

      alert(`Successfully uploaded CSV to ${uploadingTable}`);
    } catch (err) {
      console.error('Error uploading CSV:', err);
      alert(`Failed to upload CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingTable(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadCSV = async (tableName: string) => {
    try {
      // Get all data from table
      const data = await query(`SELECT * FROM ${tableName}`);

      if (!data || data.length === 0) {
        alert(`Table ${tableName} is empty`);
        return;
      }

      // Get column names
      const columns = Object.keys(data[0]);

      // Create CSV content
      const csvRows = [];

      // Add header row
      csvRows.push(columns.join(','));

      // Add data rows
      for (const row of data) {
        const values = columns.map(col => {
          const val = row[col];
          // Escape values containing commas or quotes
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        csvRows.push(values.join(','));
      }

      const csvContent = csvRows.join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${tableName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert(`Failed to download CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const executeQuery = async () => {
    try {
      setQueryError(null);
      setQueryResult(null);
      setQueryColumns([]);

      const result = await query(sqlQuery);

      if (result && result.length > 0) {
        // Extract column names from first row
        const cols = Object.keys(result[0]);
        setQueryColumns(cols);
        setQueryResult(result);
      } else {
        setQueryResult([]);
        setQueryColumns([]);
      }
    } catch (err) {
      console.error('Query error:', err);
      setQueryError(err instanceof Error ? err.message : 'Query failed');
      setQueryResult(null);
    }
  };

  if (loading || initializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-primary">
            {initializing ? 'Initializing DuckDB...' : 'Loading database information...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="bg-surface p-6 rounded-lg shadow-lg border border-danger">
          <h2 className="text-xl font-bold text-danger mb-2">Error</h2>
          <p className="text-text-primary">{error}</p>
          <button
            onClick={loadDatabaseInfo}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Database Maintenance</h1>
          <p className="text-text-secondary">
            DuckDB Dashboard - {tables.length} tables loaded
          </p>
        </div>
        <button
          onClick={async () => {
            if (confirm('Reload all tables from JSON files? This will reset any in-memory changes.')) {
              await loadDatabaseInfo();
            }
          }}
          className="px-4 py-2 bg-secondary/30 text-text-primary rounded-md hover:bg-secondary/50 text-sm font-medium"
        >
          🔄 Reload from JSON
        </button>
      </div>

      <div className="bg-surface p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Database Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background p-4 rounded">
            <p className="text-text-secondary text-sm">Total Tables</p>
            <p className="text-2xl font-bold text-primary">{tables.length}</p>
          </div>
          <div className="bg-background p-4 rounded">
            <p className="text-text-secondary text-sm">Total Rows</p>
            <p className="text-2xl font-bold text-primary">
              {tables.reduce((sum, t) => sum + t.count, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-background p-4 rounded">
            <p className="text-text-secondary text-sm">Database Type</p>
            <p className="text-2xl font-bold text-primary">DuckDB</p>
          </div>
        </div>
      </div>

      {/* SQL Query Box */}
      <div className="bg-surface p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">SQL Query</h2>
        <div className="space-y-3">
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Enter SQL query... (e.g., SELECT * FROM wave_customers WHERE COU_ID_ACC = 'TH')"
            className="w-full bg-background border border-secondary/20 rounded-md px-3 py-2 text-text-primary font-mono text-sm h-24"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                executeQuery();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">Press Ctrl+Enter to execute</p>
            <button
              onClick={executeQuery}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 font-medium"
            >
              Execute Query
            </button>
          </div>
        </div>

        {/* Query Error */}
        {queryError && (
          <div className="mt-4 p-3 bg-danger/10 border border-danger rounded-md">
            <p className="text-danger text-sm font-mono">{queryError}</p>
          </div>
        )}

        {/* Query Results */}
        {queryResult !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-text-primary">
                Results ({queryResult.length} rows)
              </h3>
            </div>
            {queryResult.length > 0 ? (
              <div className="overflow-auto max-h-96 border border-secondary/20 rounded-md">
                <table className="min-w-full bg-background text-xs">
                  <thead className="sticky top-0 bg-surface border-b border-secondary/20">
                    <tr>
                      {queryColumns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-secondary/10 hover:bg-secondary/5">
                        {queryColumns.map((col) => (
                          <td key={col} className="px-3 py-2 text-xs text-text-primary">
                            {row[col] !== null && row[col] !== undefined
                              ? typeof row[col] === 'object'
                                ? JSON.stringify(row[col])
                                : String(row[col])
                              : <span className="text-text-secondary italic">null</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-background rounded-md text-center text-text-secondary text-sm">
                Query returned no results
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {tables.map((table, index) => (
          <div key={table.name} className="bg-surface rounded-lg shadow-md overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 flex-1"
                onClick={() => toggleTable(index)}
              >
                <IconChevronDown
                  className={`w-4 h-4 transition-transform ${table.expanded ? 'rotate-180' : ''}`}
                />
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{table.name}</h3>
                  <p className="text-sm text-text-secondary">
                    {table.count.toLocaleString()} rows · {table.schema.length} columns
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadCSV(table.name)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-secondary/30 text-text-primary hover:bg-secondary/50"
                  title="Download table data as CSV"
                >
                  <IconDownload className="w-4 h-4" /> Download CSV
                </button>
                <button
                  onClick={() => handleUploadCSV(table.name)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/80"
                  title="Upload CSV to replace table data"
                >
                  <IconUpload className="w-4 h-4" /> Upload CSV
                </button>
              </div>
            </div>

            {table.expanded && (
              <div className="border-t border-secondary/20 p-4">
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-text-primary mb-3">Schema</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-background rounded">
                      <thead>
                        <tr className="border-b border-secondary/20">
                          <th className="px-4 py-2 text-left text-sm font-semibold text-text-secondary">Column Name</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-text-secondary">Data Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.schema.map((col, idx) => (
                          <tr key={idx} className="border-b border-secondary/10">
                            <td className="px-4 py-2 text-sm text-text-primary font-mono">{col.column_name}</td>
                            <td className="px-4 py-2 text-sm text-info">{col.data_type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-text-primary mb-3">
                    Sample Data (First 5 Rows)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-background rounded text-sm">
                      <thead>
                        <tr className="border-b border-secondary/20">
                          {table.schema.map((col) => (
                            <th key={col.column_name} className="px-3 py-2 text-left text-xs font-semibold text-text-secondary">
                              {col.column_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.sampleData.length > 0 ? (
                          table.sampleData.map((row, rowIdx) => (
                            <tr key={rowIdx} className="border-b border-secondary/10 hover:bg-secondary/5">
                              {table.schema.map((col) => (
                                <td key={col.column_name} className="px-3 py-2 text-xs text-text-primary">
                                  {row[col.column_name] !== null && row[col.column_name] !== undefined
                                    ? typeof row[col.column_name] === 'object'
                                      ? JSON.stringify(row[col.column_name])
                                      : String(row[col.column_name])
                                    : <span className="text-text-secondary italic">null</span>
                                  }
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={table.schema.length}
                              className="px-3 py-4 text-center text-text-secondary italic"
                            >
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="bg-surface p-8 rounded-lg shadow-md text-center">
          <p className="text-text-secondary">No tables found in the database.</p>
        </div>
      )}
    </div>
  );
};

export default DatabaseMaintenance;
