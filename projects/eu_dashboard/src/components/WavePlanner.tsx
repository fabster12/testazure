import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { initDatabase, query, assignCustomerToWave, createWave, updateWave, deleteWave } from '../services/duckdbService';
import { IconChevronDown } from './icons';

interface WaveCustomer {
  COU_ID_ACC: string;
  ACC_ID: string;
  CustomerName: string;
  CON_COUNT: number;
  TOTAL_REV_EUR: number;
  REV_PCT: number;
  CONS_PCT: number;
  RN: number;
  WAVE_ID: number | null;
  COU_NM?: string;
  WGZ_GRP_DS?: string;
}

interface Wave {
  WAVE_ID: number;
  WAVE_NAME: string;
  YEAR: number;
  MONTH: number;
}

interface CountryInfo {
  COU_ID: string;
  COU_NM: string;
  WGZ_GRP_DS: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2025, 2026, 2027, 2028];

const WavePlanner: React.FC = () => {
  const { theme } = useTheme();
  const [customers, setCustomers] = useState<WaveCustomer[]>([]);
  const [countryList, setCountryList] = useState<CountryInfo[]>([]);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedCustomer, setDraggedCustomer] = useState<WaveCustomer | null>(null);
  const [showCreateWave, setShowCreateWave] = useState(false);
  const [editingWave, setEditingWave] = useState<Wave | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<{ [key: string]: boolean }>({});
  const [newWave, setNewWave] = useState({ year: 2025, month: 1, name: '' });
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkWaveId, setBulkWaveId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await initDatabase();

      // Load all data with JOIN
      const sql = `
        SELECT
          wc.*,
          wa.WAVE_ID,
          cl.COU_NM,
          cl.WGZ_GRP_DS
        FROM wave_customers wc
        LEFT JOIN WAVE_ASSIGNMENTS wa ON wc.COU_ID_ACC = wa.COU_ID_ACC AND wc.ACC_ID = wa.ACC_ID
        LEFT JOIN country_list cl ON wc.COU_ID_ACC = cl.COU_ID
        ORDER BY wc.RN
      `;

      const customersData = await query<WaveCustomer>(sql);
      setCustomers(customersData);

      // Load waves
      const wavesData = await query<Wave>('SELECT * FROM WAVES ORDER BY YEAR, MONTH');
      setWaves(wavesData);

      // Load country list
      const countries = await query<CountryInfo>('SELECT * FROM country_list');
      setCountryList(countries);

      // Start regions as collapsed and select all countries by default
      const regions = Array.from(new Set(customersData.map(c => c.WGZ_GRP_DS || 'OTHER')));
      const expanded: { [key: string]: boolean } = {};
      regions.forEach(r => expanded[r] = false);
      setExpandedRegions(expanded);
      setSelectedCountries(customersData.map(c => c.COU_ID_ACC));
    } catch (err) {
      console.error('Error loading wave customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (customer: WaveCustomer) => {
    setDraggedCustomer(customer);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (waveId: number | null) => {
    if (!draggedCustomer) return;

    try {
      await assignCustomerToWave(draggedCustomer.COU_ID_ACC, draggedCustomer.ACC_ID, waveId);

      // Update state locally to avoid black screen
      setCustomers(prev => prev.map(c =>
        (c.COU_ID_ACC === draggedCustomer.COU_ID_ACC && c.ACC_ID === draggedCustomer.ACC_ID)
          ? { ...c, WAVE_ID: waveId }
          : c
      ));

      setDraggedCustomer(null);
    } catch (err) {
      console.error('Error updating customer wave:', err);
      alert('Failed to update customer wave');
    }
  };

  const handleCreateWave = async () => {
    const nextId = waves.length > 0 ? Math.max(...waves.map(w => w.WAVE_ID)) + 1 : 1;
    const monthName = MONTHS[newWave.month - 1];
    const waveName = newWave.name || `${monthName} ${newWave.year}`;

    try {
      await createWave(nextId, waveName, newWave.year, newWave.month);
      await loadData();
      setShowCreateWave(false);
      setNewWave({ year: 2025, month: 1, name: '' });
    } catch (err) {
      console.error('Error creating wave:', err);
      alert('Failed to create wave');
    }
  };

  const handleUpdateWave = async () => {
    if (!editingWave) return;

    try {
      await updateWave(editingWave.WAVE_ID, editingWave.WAVE_NAME, editingWave.YEAR, editingWave.MONTH);
      await loadData();
      setEditingWave(null);
    } catch (err) {
      console.error('Error updating wave:', err);
      alert('Failed to update wave');
    }
  };

  const handleDeleteWave = async (waveId: number) => {
    if (!confirm(`Delete this wave? Customers will be moved to unassigned.`)) return;

    try {
      await deleteWave(waveId);
      await loadData();
    } catch (err) {
      console.error('Error deleting wave:', err);
      alert('Failed to delete wave');
    }
  };

  const getWaveStats = (waveId: number | null) => {
    const waveCustomers = customers.filter(c => c.WAVE_ID === waveId);
    return {
      count: waveCustomers.length,
      consignments: waveCustomers.reduce((sum, c) => sum + c.CON_COUNT, 0),
      revenue: waveCustomers.reduce((sum, c) => sum + c.TOTAL_REV_EUR, 0),
      revPct: waveCustomers.reduce((sum, c) => sum + c.REV_PCT, 0),
      consPct: waveCustomers.reduce((sum, c) => sum + c.CONS_PCT, 0)
    };
  };

  // Get totals across all waves
  const getAllWavesTotals = () => {
    const assignedCustomers = customers.filter(c => c.WAVE_ID !== null);
    return {
      count: assignedCustomers.length,
      consignments: assignedCustomers.reduce((sum, c) => sum + c.CON_COUNT, 0),
      revenue: assignedCustomers.reduce((sum, c) => sum + c.TOTAL_REV_EUR, 0),
      revPct: assignedCustomers.reduce((sum, c) => sum + c.REV_PCT, 0),
      consPct: assignedCustomers.reduce((sum, c) => sum + c.CONS_PCT, 0)
    };
  };

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  const handleCountryToggle = (countryCode: string) => {
    setSelectedCountries(prev =>
      prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  const handleRegionToggle = (regionCountryCodes: string[]) => {
    const allCurrentlySelected = regionCountryCodes.every(code => selectedCountries.includes(code));
    if (allCurrentlySelected) {
      setSelectedCountries(prev => prev.filter(code => !regionCountryCodes.includes(code)));
    } else {
      setSelectedCountries(prev => Array.from(new Set([...prev, ...regionCountryCodes])));
    }
  };

  const handleCustomerSelect = (customer: WaveCustomer, index: number, event: React.MouseEvent) => {
    const customerId = `${customer.COU_ID_ACC}-${customer.ACC_ID}`;

    if (event.shiftKey && lastSelectedIndex !== null) {
      // Shift+Click: Select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelected = new Set(selectedCustomers);

      for (let i = start; i <= end; i++) {
        if (i < filteredCustomers.length) {
          const c = filteredCustomers[i];
          newSelected.add(`${c.COU_ID_ACC}-${c.ACC_ID}`);
        }
      }

      setSelectedCustomers(newSelected);
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click: Toggle individual
      const newSelected = new Set(selectedCustomers);
      if (newSelected.has(customerId)) {
        newSelected.delete(customerId);
      } else {
        newSelected.add(customerId);
      }
      setSelectedCustomers(newSelected);
      setLastSelectedIndex(index);
    } else {
      // Normal click: Select only this one
      setSelectedCustomers(new Set([customerId]));
      setLastSelectedIndex(index);
    }
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredCustomers.map(c => `${c.COU_ID_ACC}-${c.ACC_ID}`));
    setSelectedCustomers(allIds);
  };

  const handleSelectNone = () => {
    setSelectedCustomers(new Set());
    setLastSelectedIndex(null);
  };

  const handleBulkAssign = async () => {
    if (selectedCustomers.size === 0) {
      alert('No customers selected');
      return;
    }

    if (bulkWaveId === null) {
      alert('Please select a wave');
      return;
    }

    try {
      // Assign all selected customers
      for (const customerId of selectedCustomers) {
        const [couId, accId] = customerId.split('-');
        await assignCustomerToWave(couId, accId, bulkWaveId);
      }

      // Update state locally
      setCustomers(prev => prev.map(c => {
        const id = `${c.COU_ID_ACC}-${c.ACC_ID}`;
        return selectedCustomers.has(id) ? { ...c, WAVE_ID: bulkWaveId } : c;
      }));

      // Clear selection
      setSelectedCustomers(new Set());
      setLastSelectedIndex(null);
    } catch (err) {
      console.error('Error bulk assigning customers:', err);
      alert('Failed to bulk assign customers');
    }
  };

  const groupedCountries = useMemo(() => {
    const groups: { [key: string]: WaveCustomer[] } = {};
    customers.forEach(c => {
      const region = c.WGZ_GRP_DS || 'OTHER';
      if (!groups[region]) groups[region] = [];
      groups[region].push(c);
    });
    return groups;
  }, [customers]);

  const filteredCustomers = customers.filter(c => {
    // Filter by wave assignment
    if (c.WAVE_ID !== null) return false;

    // Filter by country selection
    if (!selectedCountries.includes(c.COU_ID_ACC)) return false;

    // Filter by search term
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.CustomerName.toLowerCase().includes(search) ||
      c.COU_ID_ACC.toLowerCase().includes(search) ||
      c.ACC_ID.toLowerCase().includes(search) ||
      (c.COU_NM && c.COU_NM.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-primary">Loading wave planner...</p>
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
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totals = getAllWavesTotals();

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-background">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Wave Migration Planner</h1>
            <p className="text-text-secondary">Drag and drop customers to assign them to migration waves</p>
          </div>
          <button
            onClick={() => setShowCreateWave(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 font-medium"
          >
            + Create Wave
          </button>
        </div>

        {/* Totals Row */}
        <div className="bg-surface p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">All Waves Totals</h2>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-text-secondary">Customers: </span>
                <span className="text-text-primary font-semibold">{totals.count}</span>
              </div>
              <div>
                <span className="text-text-secondary">Consignments: </span>
                <span className="text-text-primary font-semibold">{totals.consignments.toLocaleString()} ({(totals.consPct * 100).toFixed(1)}%)</span>
              </div>
              <div>
                <span className="text-text-secondary">Revenue: </span>
                <span className="text-success font-semibold">€{totals.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({(totals.revPct * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Wave Modal */}
      {showCreateWave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <h2 className="text-xl font-bold text-text-primary mb-4">Create New Wave</h2>
            <div className="space-y-4">
              {/* Wave Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Wave Name (optional)</label>
                <input
                  type="text"
                  value={newWave.name}
                  onChange={(e) => setNewWave({ ...newWave, name: e.target.value })}
                  placeholder="e.g., Q1 Migration, Phase 1, etc."
                  className="w-full bg-background border border-secondary/20 rounded-md px-3 py-2 text-text-primary"
                />
                <p className="text-xs text-text-secondary mt-1">Leave empty to auto-generate from month/year</p>
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">Select Calendar Year</label>
                <div className="grid grid-cols-4 gap-3">
                  {YEARS.map(year => (
                    <button
                      key={year}
                      onClick={() => setNewWave({ ...newWave, year })}
                      className={`px-4 py-3 rounded-md font-medium transition-colors ${
                        newWave.year === year
                          ? 'bg-primary text-white'
                          : 'bg-background text-text-primary border border-secondary/20 hover:bg-secondary/20'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">Select Calendar Month</label>
                <div className="grid grid-cols-4 gap-2">
                  {MONTHS.map((month, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNewWave({ ...newWave, month: idx + 1 })}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        newWave.month === idx + 1
                          ? 'bg-primary text-white'
                          : 'bg-background text-text-primary border border-secondary/20 hover:bg-secondary/20'
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateWave}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateWave(false);
                    setNewWave({ year: 2025, month: 1, name: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-secondary/30 text-text-primary rounded-md hover:bg-secondary/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Wave Modal */}
      {editingWave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <h2 className="text-xl font-bold text-text-primary mb-4">Edit Wave</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Wave Name</label>
                <input
                  type="text"
                  value={editingWave.WAVE_NAME}
                  onChange={(e) => setEditingWave({ ...editingWave, WAVE_NAME: e.target.value })}
                  className="w-full bg-background border border-secondary/20 rounded-md px-3 py-2 text-text-primary"
                />
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">Select Calendar Year</label>
                <div className="grid grid-cols-4 gap-3">
                  {YEARS.map(year => (
                    <button
                      key={year}
                      onClick={() => setEditingWave({ ...editingWave, YEAR: year })}
                      className={`px-4 py-3 rounded-md font-medium transition-colors ${
                        editingWave.YEAR === year
                          ? 'bg-primary text-white'
                          : 'bg-background text-text-primary border border-secondary/20 hover:bg-secondary/20'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">Select Calendar Month</label>
                <div className="grid grid-cols-4 gap-2">
                  {MONTHS.map((month, idx) => (
                    <button
                      key={idx}
                      onClick={() => setEditingWave({ ...editingWave, MONTH: idx + 1 })}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        editingWave.MONTH === idx + 1
                          ? 'bg-primary text-white'
                          : 'bg-background text-text-primary border border-secondary/20 hover:bg-secondary/20'
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateWave}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingWave(null)}
                  className="flex-1 px-4 py-2 bg-secondary/30 text-text-primary rounded-md hover:bg-secondary/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Unassigned Customers with Filters */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-surface rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Unassigned Customers</h2>
            <p className="text-sm text-text-secondary mb-4">
              {filteredCustomers.length} customers
            </p>

            {/* Search Box */}
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mb-4 bg-background border border-secondary/20 rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-secondary"
            />

            {/* Region/Country Filter */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-text-secondary">Country Filter</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const allCountryCodes = customers.map(c => c.COU_ID_ACC);
                      setSelectedCountries(allCountryCodes);
                    }}
                    className="px-2 py-1 bg-secondary/30 text-text-primary rounded text-xs hover:bg-secondary/50"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedCountries([])}
                    className="px-2 py-1 bg-secondary/30 text-text-primary rounded text-xs hover:bg-secondary/50"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto border border-secondary/20 rounded-md">
                {Object.entries(groupedCountries).map(([region, regionCustomers]) => {
                const uniqueCountries = Array.from(new Set(regionCustomers.map(c => c.COU_ID_ACC)));
                const regionCountryCodes = uniqueCountries;
                const allSelected = regionCountryCodes.every(code => selectedCountries.includes(code));

                return (
                  <div key={region} className="border-b border-secondary/20 last:border-b-0">
                    <div className="bg-secondary/10 px-3 py-2 flex justify-between items-center cursor-pointer" onClick={() => toggleRegion(region)}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => handleRegionToggle(regionCountryCodes)}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-pointer"
                        />
                        <span className="font-medium text-sm">{region} ({uniqueCountries.length})</span>
                      </div>
                      <IconChevronDown className={`w-4 h-4 transition-transform ${expandedRegions[region] ? 'rotate-180' : ''}`} />
                    </div>
                    {expandedRegions[region] && (
                      <div className="p-2">
                        {uniqueCountries.map(countryCode => {
                          const customer = regionCustomers.find(c => c.COU_ID_ACC === countryCode);
                          return (
                            <label key={countryCode} className="flex items-center gap-2 px-2 py-1 hover:bg-secondary/10 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={selectedCountries.includes(countryCode)}
                                onChange={() => handleCountryToggle(countryCode)}
                                className="cursor-pointer"
                              />
                              <span className="font-mono">{countryCode}</span>
                              <span className="text-text-secondary truncate">{customer?.COU_NM}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>

            {/* Customer Selection Controls */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-secondary">Customer Selection</h3>
                <div className="flex gap-1">
                  <button
                    onClick={handleSelectAll}
                    className="px-2 py-1 bg-secondary/30 text-text-primary rounded text-xs hover:bg-secondary/50"
                  >
                    All
                  </button>
                  <button
                    onClick={handleSelectNone}
                    className="px-2 py-1 bg-secondary/30 text-text-primary rounded text-xs hover:bg-secondary/50"
                  >
                    None
                  </button>
                </div>
              </div>
              {selectedCustomers.size > 0 && (
                <div className="flex gap-2 items-center">
                  <select
                    value={bulkWaveId ?? ''}
                    onChange={(e) => setBulkWaveId(e.target.value ? Number(e.target.value) : null)}
                    className="flex-1 bg-background border border-secondary/20 rounded-md px-2 py-1.5 text-xs text-text-primary"
                  >
                    <option value="">Select Wave...</option>
                    {waves.map(wave => (
                      <option key={wave.WAVE_ID} value={wave.WAVE_ID}>
                        {wave.WAVE_NAME}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkAssign}
                    disabled={bulkWaveId === null}
                    className="px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/80 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                </div>
              )}
              {selectedCustomers.size > 0 && (
                <p className="text-xs text-text-secondary">
                  {selectedCustomers.size} customer{selectedCustomers.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Customer List */}
            <div
              className="space-y-1 min-h-[200px] max-h-[400px] overflow-y-auto border-2 border-dashed border-secondary/30 rounded-md p-2"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(null)}
            >
              {filteredCustomers.map((customer, index) => {
                const customerId = `${customer.COU_ID_ACC}-${customer.ACC_ID}`;
                const isSelected = selectedCustomers.has(customerId);

                return (
                  <div
                    key={customer.ACC_ID}
                    draggable
                    onDragStart={() => handleDragStart(customer)}
                    onClick={(e) => handleCustomerSelect(customer, index, e)}
                    className={`bg-background p-2 rounded cursor-move hover:bg-secondary/20 border ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-secondary/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer"
                      />
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-text-primary truncate block">{customer.CustomerName}</span>
                          <span className="text-text-secondary">{customer.COU_ID_ACC} ({customer.COU_NM})</span>
                        </div>
                        <span className="text-info ml-2">{(customer.REV_PCT * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredCustomers.length === 0 && (
                <div className="flex items-center justify-center h-32 text-text-secondary text-sm">
                  {searchTerm || selectedCountries.length === 0 ? 'No matching customers' : 'All customers assigned'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Waves */}
        <div className="col-span-12 lg:col-span-9">
          <div className="space-y-4">
            {waves.map(wave => {
              const stats = getWaveStats(wave.WAVE_ID);
              const waveCustomers = customers.filter(c => c.WAVE_ID === wave.WAVE_ID);

              return (
                <div key={wave.WAVE_ID} className="bg-surface rounded-lg shadow-md">
                  <div className="p-4 border-b border-secondary/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="text-lg font-semibold text-text-primary cursor-pointer hover:text-primary"
                        onClick={() => setEditingWave(wave)}
                        title="Click to edit"
                      >
                        {wave.WAVE_NAME} ✎
                      </h3>
                      <button
                        onClick={() => handleDeleteWave(wave.WAVE_ID)}
                        className="text-danger hover:text-danger/80 text-sm px-2 py-1"
                        title="Delete wave"
                      >
                        ✕ Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-background p-2 rounded">
                        <span className="text-text-secondary block">Customers</span>
                        <span className="text-text-primary font-semibold text-sm">{stats.count}</span>
                      </div>
                      <div className="bg-background p-2 rounded">
                        <span className="text-text-secondary block">Consignments</span>
                        <span className="text-text-primary font-semibold text-sm">{stats.consignments.toLocaleString()} ({(stats.consPct * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="bg-background p-2 rounded">
                        <span className="text-text-secondary block">Revenue</span>
                        <span className="text-success font-semibold text-sm">€{stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="bg-background p-2 rounded">
                        <span className="text-text-secondary block">Revenue %</span>
                        <span className="text-info font-semibold text-sm">{(stats.revPct * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Table */}
                  <div
                    className="p-2 min-h-[200px] max-h-[500px] overflow-auto bg-secondary/5"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(wave.WAVE_ID)}
                  >
                    {waveCustomers.length > 0 ? (
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-surface border-b border-secondary/20">
                          <tr>
                            <th className="text-left p-2 text-text-secondary font-semibold">Country</th>
                            <th className="text-left p-2 text-text-secondary font-semibold">Account</th>
                            <th className="text-left p-2 text-text-secondary font-semibold">Customer Name</th>
                            <th className="text-right p-2 text-text-secondary font-semibold">Cons</th>
                            <th className="text-right p-2 text-text-secondary font-semibold">Revenue €</th>
                            <th className="text-right p-2 text-text-secondary font-semibold">Cons %</th>
                            <th className="text-right p-2 text-text-secondary font-semibold">Rev %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {waveCustomers.map(customer => (
                            <tr
                              key={customer.ACC_ID}
                              draggable
                              onDragStart={() => handleDragStart(customer)}
                              className="cursor-move hover:bg-background border-b border-secondary/10"
                            >
                              <td className="p-2 text-text-primary">{customer.COU_ID_ACC} ({customer.COU_NM})</td>
                              <td className="p-2 text-text-primary">{customer.ACC_ID}</td>
                              <td className="p-2 text-text-primary">{customer.CustomerName}</td>
                              <td className="p-2 text-right text-text-primary font-medium">{customer.CON_COUNT.toLocaleString()}</td>
                              <td className="p-2 text-right text-success font-medium">€{customer.TOTAL_REV_EUR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="p-2 text-right text-text-primary">{(customer.CONS_PCT * 100).toFixed(2)}%</td>
                              <td className="p-2 text-right text-info font-medium">{(customer.REV_PCT * 100).toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-32 text-text-secondary text-sm border-2 border-dashed border-secondary/30 rounded-md">
                        Drop customers here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {waves.length === 0 && (
              <div className="flex items-center justify-center h-64 bg-surface rounded-lg shadow-md">
                <div className="text-center text-text-secondary">
                  <p className="text-lg mb-2">No waves created yet</p>
                  <p className="text-sm">Click "Create Wave" to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WavePlanner;
