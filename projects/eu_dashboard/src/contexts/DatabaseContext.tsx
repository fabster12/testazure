import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MainframeBooking } from '../types';
import { initDatabase, getTableAsJSON } from '../services/duckdbService';

const QUERIES = [
  { nr: 1, name: 'Bookings (JK)', code: 'bookings_jk', icon: '📊' },
  { nr: 2, name: 'Track & Trace Consignments (YL)', code: 'track_trace_con_yl', icon: '📦' },
  { nr: 3, name: 'Invoiced Consignments (YI)', code: 'invoiced_consignments_yi', icon: '💰' },
  { nr: 4, name: 'Invoice Corrections (JI)', code: 'invoice_corrections_ji', icon: '🔧' },
  { nr: 5, name: 'Exceptions (YH)', code: 'exceptions_yh', icon: '⚠️' },
  { nr: 6, name: 'Ratechecks (YQ)', code: 'RATECHECKS_YQ', icon: '💵' },
  { nr: 7, name: 'Financial Consolidation CFC', code: 'FIN_CONSOLIDATION_CFC', icon: '📈' },
  // { nr: 8, name: 'Revenue by Customer', code: 'revenue_by_customer', icon: '👥' }, // Hidden - can be restored easily
  { nr: 8.1, name: 'Total Revenue', code: 'total_revenue', icon: '💎' },
  { nr: 8.2, name: 'Customer Revenue', code: 'customer_revenue', icon: '👤' },
  { nr: 9, name: 'Customer Accounts (YN)', code: 'CUSTOMER_ACCOUNTS_YN', icon: '🏢' },
];

interface LoadingState {
  phase: 'idle' | 'initializing_db' | 'loading_priority' | 'loading_background' | 'complete';
  progress: number;
  currentlyLoading: string | null;
  loadedQueries: string[];
  failedQueries: string[];
}

interface CountryInfo {
  COU_ID: string;
  COU_NM: string;
  WGZ_GRP_DS: string;
}

interface Wave {
  WAVE_ID: number;
  WAVE_NAME: string;
  YEAR: number;
  MONTH: number;
  CUSTOMERS_COUNT?: number;
  CONSIGNMENTS_COUNT?: number;
  CONSIGNMENTS_PCT?: number;
  REVENUE_TOTAL?: number;
  REVENUE_PCT?: number;
}

interface WaveAssignment {
  COU_ID_ACC: string;
  ACC_ID: string;
  WAVE_ID: number;
}

interface WaveCustomer {
  COU_ID_ACC: string;
  ACC_ID: string;
  CustomerName: string;
  CON_COUNT: number;
  TOTAL_REV_EUR: number;
  REV_PCT: number;
  CONS_PCT: number;
  RN: number;
}

interface WaveData {
  waves: Wave[];
  assignments: WaveAssignment[];
  customers: WaveCustomer[];
}

interface DatabaseContextType {
  allData: Record<string, MainframeBooking[]>;
  loadingState: LoadingState;
  error: string | null;
  countryList: CountryInfo[];
  waveData: WaveData;
  retryAttempts: Record<string, number>;
  queries: typeof QUERIES;
  reloadDatabase: (forceReload?: boolean) => Promise<void>;
  setWaveData: React.Dispatch<React.SetStateAction<WaveData>>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [allData, setAllData] = useState<Record<string, MainframeBooking[]>>({});
  const [loadingState, setLoadingState] = useState<LoadingState>({
    phase: 'idle',
    progress: 0,
    currentlyLoading: null,
    loadedQueries: [],
    failedQueries: []
  });
  const [error, setError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});
  const [countryList, setCountryList] = useState<CountryInfo[]>([]);
  const [waveData, setWaveData] = useState<WaveData>({
    waves: [],
    assignments: [],
    customers: []
  });

  const loadData = async (forceReload: boolean = false) => {
    const loadStartTime = performance.now();
    console.log('[⏱️ Timing] Starting full data load...');

    try {
      // ===== PHASE 1: Initialize DuckDB =====
      setLoadingState(prev => ({
        ...prev,
        phase: 'initializing_db',
        progress: 10
      }));

      const dbInitStart = performance.now();
      await initDatabase(forceReload);
      const dbInitEnd = performance.now();
      console.log(`[⏱️ DB Init] Completed in ${(dbInitEnd - dbInitStart).toFixed(2)}ms`);

      setLoadingState(prev => ({ ...prev, progress: 20 }));

      // ===== PHASE 2: Load Priority Query (Query 1) =====
      setLoadingState(prev => ({
        ...prev,
        phase: 'loading_priority',
        currentlyLoading: 'bookings_jk',
        progress: 20
      }));

      const priorityQuery = QUERIES[0]; // bookings_jk
      let priorityData: MainframeBooking[] = [];
      let query1Time = 0;
      try {
        const query1Start = performance.now();
        priorityData = await getTableAsJSON(priorityQuery.code);
        const query1End = performance.now();
        query1Time = query1End - query1Start;
        console.log(`[⏱️ Query 1/${QUERIES.length}] ${priorityQuery.code} loaded in ${query1Time.toFixed(2)}ms (${priorityData.length.toLocaleString()} records)`);

        // Set Query 1 data immediately for rendering
        setAllData({ [priorityQuery.code]: priorityData });
        setLoadingState(prev => ({
          ...prev,
          loadedQueries: [priorityQuery.code],
          currentlyLoading: null,
          progress: 40
        }));
      } catch (err) {
        console.error(`Failed to load priority query ${priorityQuery.code}:`, err);

        // CRITICAL FAILURE - show error and stop
        setError(`Failed to load primary dataset (${priorityQuery.name}). Please refresh the page.`);
        setLoadingState(prev => ({
          ...prev,
          phase: 'idle',
          failedQueries: [priorityQuery.code]
        }));
        return; // Stop here - don't load remaining queries
      }

      // ===== PHASE 3: Load Remaining Queries in Parallel =====
      // Add 100ms delay to allow UI to render smoothly
      await new Promise(resolve => setTimeout(resolve, 100));

      setLoadingState(prev => ({ ...prev, phase: 'loading_background' }));

      const remainingQueries = QUERIES.slice(1); // Queries 2-9

      // Load all remaining queries in parallel with timing
      const bgQueriesStart = performance.now();
      const responses = await Promise.allSettled(
        remainingQueries.map(q => {
          const queryStartTime = performance.now();
          return getTableAsJSON(q.code).then(data => {
            const queryEndTime = performance.now();
            return { data, timing: queryEndTime - queryStartTime };
          });
        })
      );
      const bgQueriesEnd = performance.now();

      // Start with Query 1 data that was already loaded
      const newData: Record<string, MainframeBooking[]> = { [priorityQuery.code]: priorityData };
      const loadedList: string[] = [priorityQuery.code];
      const failedList: string[] = [];

      responses.forEach((result, index) => {
        const queryCode = remainingQueries[index].code;
        if (result.status === 'fulfilled') {
          const { data, timing } = result.value;
          newData[queryCode] = data;
          loadedList.push(queryCode);
          console.log(`[⏱️ Query ${index + 2}/${QUERIES.length}] ${queryCode} loaded in ${timing.toFixed(2)}ms (${data.length.toLocaleString()} records)`);

          // Update progress as each completes
          const progressPercent = 40 + Math.floor((loadedList.length / QUERIES.length) * 60);
          setLoadingState(prev => ({
            ...prev,
            loadedQueries: loadedList,
            progress: progressPercent
          }));
        } else {
          console.error(`[⏱️ Query ${index + 2}/${QUERIES.length}] ${queryCode} FAILED:`, result.reason);
          failedList.push(queryCode);
        }
      });

      console.log(`[⏱️ Background] All ${remainingQueries.length} queries completed in ${(bgQueriesEnd - bgQueriesStart).toFixed(2)}ms`);

      setAllData(newData);

      // ===== Auto-Retry Failed Queries (Once) =====
      let retryTime = 0;
      if (failedList.length > 0) {
        const retryStart = performance.now();
        console.log(`[⏱️ Retry] Starting retry for ${failedList.length} failed queries...`);

        // Wait 5 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 5000));

        for (const queryCode of failedList) {
          // Only retry once
          if ((retryAttempts[queryCode] || 0) < 1) {
            try {
              const retryQueryStart = performance.now();
              const retryData = await getTableAsJSON(queryCode);
              const retryQueryEnd = performance.now();
              console.log(`[⏱️ Retry] ${queryCode} succeeded in ${(retryQueryEnd - retryQueryStart).toFixed(2)}ms (${retryData.length.toLocaleString()} records)`);

              setAllData(prev => ({ ...prev, [queryCode]: retryData }));
              setLoadingState(prev => ({
                ...prev,
                loadedQueries: [...prev.loadedQueries, queryCode]
              }));
              setRetryAttempts(prev => ({ ...prev, [queryCode]: 1 }));

              // Remove from failed list
              const idx = failedList.indexOf(queryCode);
              if (idx > -1) failedList.splice(idx, 1);
            } catch (err) {
              console.error(`[⏱️ Retry] ${queryCode} failed again:`, err);
              setRetryAttempts(prev => ({ ...prev, [queryCode]: 1 }));
            }
          }
        }

        const retryEnd = performance.now();
        retryTime = retryEnd - retryStart;
        console.log(`[⏱️ Retry] Retry phase completed in ${retryTime.toFixed(2)}ms`);

        // Update failed queries after retry
        setLoadingState(prev => ({
          ...prev,
          failedQueries: failedList
        }));
      }

      // ===== COMPLETE =====
      const loadEndTime = performance.now();
      const totalTime = loadEndTime - loadStartTime;

      // Log performance summary
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[⏱️ SUMMARY] Query Loading Performance');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Total Time: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
      console.log(`DB Init: ${(dbInitEnd - dbInitStart).toFixed(2)}ms`);
      console.log(`Query 1 (Priority): ${query1Time.toFixed(2)}ms`);
      console.log(`Queries 2-9 (Parallel): ${(bgQueriesEnd - bgQueriesStart).toFixed(2)}ms`);
      if (retryTime > 0) {
        console.log(`Retry Phase: ${retryTime.toFixed(2)}ms`);
      }
      console.log(`Success: ${loadedList.length}/${QUERIES.length} queries`);
      if (failedList.length > 0) {
        console.log(`Failed: ${failedList.length} queries - ${failedList.join(', ')}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      setLoadingState(prev => ({
        ...prev,
        phase: 'complete',
        progress: 100
      }));

      // Show error only if some queries still failed after retry
      if (failedList.length > 0) {
        setError(`Could not load ${failedList.length} dataset(s): ${failedList.join(', ')}`);
      } else {
        setError(null);
      }

    } catch (err) {
      console.error("Failed to initialize database:", err);
      setError(`Failed to initialize database. Please refresh the page.`);
      setLoadingState(prev => ({ ...prev, phase: 'idle' }));
    }
  };

  const loadCountryList = async () => {
    try {
      await initDatabase();
      const data = await getTableAsJSON('country_list');
      setCountryList(data);
    } catch (err) {
      console.error("Failed to load country list:", err);
    }
  };

  const loadWaveData = async () => {
    try {
      await initDatabase();
      const waves = await getTableAsJSON('WAVES');
      const assignments = await getTableAsJSON('WAVE_ASSIGNMENTS');
      const customers = await getTableAsJSON('wave_customers');
      console.log(`[Wave Data] Loaded ${waves.length} waves, ${assignments.length} assignments, ${customers.length} customers`);
      setWaveData({ waves, assignments, customers });
    } catch (err) {
      console.error("Failed to load wave data:", err);
    }
  };

  useEffect(() => {
    // Only load data once when the provider mounts
    loadData();
    loadCountryList();
    loadWaveData();
  }, []);

  const contextValue: DatabaseContextType = {
    allData,
    loadingState,
    error,
    countryList,
    waveData,
    retryAttempts,
    queries: QUERIES,
    reloadDatabase: loadData,
    setWaveData
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};
