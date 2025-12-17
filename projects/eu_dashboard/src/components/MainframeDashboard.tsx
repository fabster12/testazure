
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, AreaChart, Area, LineChart, Treemap } from 'recharts';
import { MainframeBooking } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import { IconChevronDown, IconFilter, IconCalendar } from './icons';

const REVENUE_BY_CUSTOMER_CODE = 'revenue_by_customer';

const formatNumber = (num: number, isCurrency = false) => {
  if (typeof num !== 'number' || isNaN(num)) {
    return isCurrency ? '€0' : '0';
  }
  return (isCurrency ? '€' : '') + num.toLocaleString(undefined, { maximumFractionDigits: 0 });
};


const CustomTooltip: React.FC<any> = ({ active, payload, label, context, theme, divisionColorMap }) => {
    if (active && payload && payload.length) {
        if (context === 'topCustomer' && payload[0]?.payload) {
            const data = payload[0].payload;
            return (
                 <div className="p-2 bg-surface border border-secondary/20 rounded-md shadow-lg text-sm">
                    <p className="font-bold text-text-primary">{data.customerName}</p>
                    <p style={{ color: `rgb(${theme.colors.success})` }}>
                        Revenue: €{data.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </p>
                     <p style={{ color: `rgb(${theme.colors.info})` }}>
                        Consignments: {data.consignments.toLocaleString()}
                    </p>
                </div>
            )
        }

        return (
            <div className="p-2 bg-surface border border-secondary/20 rounded-md shadow-lg text-sm">
                <p className="font-bold text-text-primary">{label}</p>
                {payload.map((p: any, index: number) => {
                    let value: string | number = p.value;
                    let name = p.name;
                    let color = p.color || p.fill || p.stroke;
                    
                    if (context === 'customerTrend') {
                        if (p.dataKey === 'predicted_consignments') {
                            name = 'Predicted Consignments';
                            value = typeof value === 'number' ? value.toLocaleString() : value;
                        } else if (p.dataKey === 'predicted_revenue') {
                            name = 'Predicted Revenue';
                             value = `€${typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}`;
                        } else {
                            const divisionName = p.name.replace(/_revenue|_consignments/, '');
                            color = divisionColorMap[divisionName] || color;
                            if (p.dataKey.includes('_consignments')) {
                                name = `${divisionName} Consignments`;
                                value = typeof value === 'number' ? value.toLocaleString() : value;
                            } else if (p.dataKey.includes('_revenue')) {
                                name = `${divisionName} Revenue`;
                                value = `€${typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}`;
                            }
                        }
                    } else if (p.dataKey === 'revenue' || name === 'Revenue') {
                        value = `€${typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}`;
                    } else {
                         value = typeof value === 'number' ? value.toLocaleString() : value;
                    }

                    return (
                        <p key={`item-${index}`} style={{ color }}>
                            {`${name}: ${value}`}
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
};

const MigrationDashboard: React.FC = () => {
    const { theme } = useTheme();
    // Get data from context
    const { allData, loadingState, error, countryList, waveData, setWaveData, queries: QUERIES } = useDatabaseContext();

    // UI-specific state
    const [selectedQuery, setSelectedQuery] = useState<string>('bookings_jk');
    const [predictTrend, setPredictTrend] = useState<boolean>(false);
    const [predictWaveTrend, setPredictWaveTrend] = useState<boolean>(false);
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '2025-01-01', end: '' });
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [countrySearch, setCountrySearch] = useState('');
    const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
    const [trendChartType, setTrendChartType] = useState<'bar' | 'line'>('bar');
    const [swapAxes, setSwapAxes] = useState<boolean>(false); // Swap left/right axes
    const [showDivisionColors, setShowDivisionColors] = useState<boolean>(false); // Show separate division colors
    const [includeOpsSourceFX, setIncludeOpsSourceFX] = useState<boolean>(false); // Filter two: include/exclude FX ops source code
    const [selectedOpsSourceCodes, setSelectedOpsSourceCodes] = useState<string[]>([]); // Filter for all ops source codes
    const [isOpsSourceDropdownOpen, setIsOpsSourceDropdownOpen] = useState(false);
    const [selectedBookingTypes, setSelectedBookingTypes] = useState<string[]>([]); // Filter for booking types
    const [isBookingTypeDropdownOpen, setIsBookingTypeDropdownOpen] = useState(false);

    // Query 2a specific filters
    const [customerSearchText, setCustomerSearchText] = useState('');
    const [selectedCustomerNames, setSelectedCustomerNames] = useState<string[]>([]);
    const [selectedSourceDescriptions, setSelectedSourceDescriptions] = useState<string[]>([]);
    const [isSourceDescDropdownOpen, setIsSourceDescDropdownOpen] = useState(false);
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [modalCustomerSearch, setModalCustomerSearch] = useState('');
    const [modalSelectedCustomers, setModalSelectedCustomers] = useState<string[]>([]);
    const [modalAvailableSelected, setModalAvailableSelected] = useState<string[]>([]);
    const [modalRightSelected, setModalRightSelected] = useState<string[]>([]);
    const [opsSourceTopN, setOpsSourceTopN] = useState<number>(10);

    // Track whether success banner should be shown
    const [showSuccessBanner, setShowSuccessBanner] = useState(true);

    // State for Revenue by Customer filters
    const [trendFilters, setTrendFilters] = useState({ topN: 10, metric: 'revenue' as 'revenue' | 'consignments', divisions: [] as string[] });
    const [customerFilters, setCustomerFilters] = useState({ topN: 10, metric: 'revenue' as 'revenue' | 'consignments', divisions: [] as string[] });
    const [divisionFilters, setDivisionFilters] = useState({ metric: 'revenue' as 'revenue' | 'consignments' });
    const [isTrendDivisionDropdownOpen, setTrendDivisionDropdownOpen] = useState(false);
    const [isCustomerDivisionDropdownOpen, setCustomerDivisionDropdownOpen] = useState(false);
    const trendDivisionDropdownRef = useRef<HTMLDivElement>(null);
    const customerDivisionDropdownRef = useRef<HTMLDivElement>(null);
    const opsSourceDropdownRef = useRef<HTMLDivElement>(null);
    const sourceDescDropdownRef = useRef<HTMLDivElement>(null);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    // Generic TopN for other queries
    const [topNCount, setTopNCount] = useState<number>(10);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (trendDivisionDropdownRef.current && !trendDivisionDropdownRef.current.contains(event.target as Node)) {
                setTrendDivisionDropdownOpen(false);
            }
            if (customerDivisionDropdownRef.current && !customerDivisionDropdownRef.current.contains(event.target as Node)) {
                setCustomerDivisionDropdownOpen(false);
            }
            if (opsSourceDropdownRef.current && !opsSourceDropdownRef.current.contains(event.target as Node)) {
                setIsOpsSourceDropdownOpen(false);
            }
            if (sourceDescDropdownRef.current && !sourceDescDropdownRef.current.contains(event.target as Node)) {
                setIsSourceDescDropdownOpen(false);
            }
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setIsCustomerDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Auto-hide success banner after 2 seconds
    useEffect(() => {
        if (loadingState.phase === 'complete' && loadingState.failedQueries.length === 0) {
            setShowSuccessBanner(true);

            const timer = setTimeout(() => {
                setShowSuccessBanner(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [loadingState.phase, loadingState.failedQueries.length]);

    // Initialize modal with current selections when opening
    useEffect(() => {
        if (isCustomerModalOpen) {
            setModalSelectedCustomers(selectedCustomerNames);
        }
    }, [isCustomerModalOpen, selectedCustomerNames]);

    const allDivisions = useMemo(() => {
        // Combine divisions from all revenue queries
        const revenueData = allData[REVENUE_BY_CUSTOMER_CODE] || [];
        const totalRevenueData = allData['total_revenue'] || [];
        const customerRevenueData = allData['customer_revenue'] || [];

        const divisions = new Set<string>();
        revenueData.forEach(d => d.value01 && divisions.add(d.value01));
        totalRevenueData.forEach(d => d.value02 && divisions.add(d.value02));
        customerRevenueData.forEach(d => d.value02 && divisions.add(d.value02));

        return Array.from(divisions).sort();
    }, [allData]);

    // Extract all available ops source codes from track_trace_con_yla and track_trace_con_ylb data
    const allOpsSourceCodes = useMemo(() => {
        const trackTraceDataA = allData['track_trace_con_yla'] || [];
        const trackTraceDataB = allData['track_trace_con_ylb'] || [];
        const combinedData = [...trackTraceDataA, ...trackTraceDataB];
        return Array.from(new Set(combinedData.map(d => d.value04 || 'N/A').filter(code => code))).sort();
    }, [allData]);

    useEffect(() => {
        setTrendFilters(f => ({ ...f, divisions: allDivisions }));
        setCustomerFilters(f => ({ ...f, divisions: allDivisions }));
    }, [allDivisions]);

    useEffect(() => {
        setIsBookingTypeDropdownOpen(false);
    }, [selectedQuery]);
    
    const divisionColorMap = useMemo(() => {
        const colors = theme.colors['chart-categorical'];
        const map: { [key: string]: string } = {};
        allDivisions.forEach((division, index) => {
            map[division] = colors[index % colors.length];
        });
        return map;
    }, [allDivisions, theme]);

    const countryCodeMap = useMemo(() => {
        const newMap: Record<string, string> = {};
        countryList.forEach(c => { newMap[c.COU_ID] = c.COU_NM; });
        return newMap;
    }, [countryList]);
    
    const allCountriesInData = useMemo<string[]>(() => {
        const countries = new Set<string>();
        Object.values(allData).flat().forEach((d: MainframeBooking) => {
            if (d.Country) countries.add(d.Country);
            if (d.queryName && d.queryName.toUpperCase() === 'TRACK & TRACE - GLCON') {
                if (d.value01) countries.add(d.value01);
                if (d.value02) countries.add(d.value02);
                if (d.value03) countries.add(d.value03);
            }
        });
        return Array.from(countries);
    }, [allData]);

    const groupedCountries = useMemo(() => {
        const groups: Record<string, { code: string, name: string }[]> = {};
        if (!countryList.length) return {};
        const countriesInData = new Set(allCountriesInData);
        countryList.forEach(country => {
            if (countriesInData.has(country.COU_ID)) {
                const groupName = country.WGZ_GRP_DS || 'Uncategorized';
                if (!groups[groupName]) groups[groupName] = [];
                groups[groupName].push({ code: country.COU_ID, name: country.COU_NM });
            }
        });
        Object.values(groups).forEach(countries => countries.sort((a, b) => a.name.localeCompare(b.name)));
        return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))) as Record<string, { code: string, name: string }[]>;
    }, [countryList, allCountriesInData]);

    // Calculate selection status for each region (none/partial/all)
    const regionSelectionStatus = useMemo(() => {
        const status: Record<string, 'none' | 'partial' | 'all'> = {};

        Object.entries(groupedCountries).forEach(([region, countries]) => {
            const selectedCount = countries.filter(c => selectedCountries.includes(c.code)).length;
            const totalCount = countries.length;

            if (selectedCount === 0) {
                status[region] = 'none';
            } else if (selectedCount === totalCount) {
                status[region] = 'all';
            } else {
                status[region] = 'partial';
            }
        });

        return status;
    }, [groupedCountries, selectedCountries]);

    // Auto-expand regions with partial selections only
    const autoExpandedRegions = useMemo(() => {
        const expanded: Record<string, boolean> = {};

        Object.keys(groupedCountries).forEach(region => {
            const status = regionSelectionStatus[region];
            expanded[region] = status === 'partial'; // Only partial
        });

        return expanded;
    }, [groupedCountries, regionSelectionStatus]);

    // Combine auto-expand with manual user overrides
    const effectiveExpandedRegions = useMemo(() => {
        const effective: Record<string, boolean> = { ...autoExpandedRegions };

        // Manual overrides from expandedRegions take precedence
        Object.entries(expandedRegions).forEach(([region, isExpanded]) => {
            effective[region] = isExpanded;
        });

        return effective;
    }, [autoExpandedRegions, expandedRegions]);

    // Check if country matches search (for highlighting)
    const getHighlightedCountryText = (countryName: string, countryCode: string, searchTerm: string) => {
        if (!searchTerm) return { name: countryName, code: countryCode, isMatch: true };

        const lowerSearch = searchTerm.toLowerCase();
        const nameMatches = countryName.toLowerCase().includes(lowerSearch);
        const codeMatches = countryCode.toLowerCase().includes(lowerSearch);

        return {
            name: countryName,
            code: countryCode,
            isMatch: nameMatches || codeMatches,
            highlightName: nameMatches,
            highlightCode: codeMatches
        };
    };

    const countryCounts = useMemo(() => {
        const counts: { [key: string]: number } = {};
        Object.values(allData).flat().forEach((d: MainframeBooking) => {
            const recordCount = d.recordCount || 0;
            const countriesInRecord = new Set<string>();
            if (d.queryName && d.queryName.toUpperCase() === 'TRACK & TRACE - GLCON') {
                if (d.value01) countriesInRecord.add(d.value01);
                if (d.value02) countriesInRecord.add(d.value02);
                if (d.value03) countriesInRecord.add(d.value03);
            } else if (d.Country) countriesInRecord.add(d.Country);
            countriesInRecord.forEach(country => { counts[country] = (counts[country] || 0) + recordCount; });
        });
        return counts;
    }, [allData]);
    
    // Clear manual expand overrides when search cleared
    useEffect(() => {
        if (!countrySearch) {
            setExpandedRegions({});
        }
    }, [countrySearch]);

    const maxDate = useMemo(() => {
        const allRecords = Object.values(allData).flat();
        if (allRecords.length === 0) return null;

        let max: Date | null = null;
        allRecords.forEach(d => {
            const year = (d as any).year;
            const month = (d as any).month;
            // Only create date if year and month are valid numbers
            if (typeof year === 'number' && typeof month === 'number' && !isNaN(year) && !isNaN(month)) {
                const date = new Date(year, month - 1);
                // Check if the date is valid
                if (!isNaN(date.getTime())) {
                    if (!max || date > max) max = date;
                }
            }
        });
        return max;
    }, [allData]);

    useEffect(() => {
        if (maxDate && !isNaN(maxDate.getTime())) {
            setDateRange(prev => ({ ...prev, end: maxDate.toISOString().split('T')[0] }));
        }
    }, [maxDate]);

    useEffect(() => { setSelectedCountries(allCountriesInData); }, [allCountriesInData]);

    // Modified to respect effective expanded state
    const toggleRegion = (region: string) => {
        setExpandedRegions(prev => ({
            ...prev,
            [region]: !effectiveExpandedRegions[region]
        }));
    };

    const handleCountryFilterChange = (country: string) => setSelectedCountries(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);

    // Select all countries in region
    const handleSelectRegion = (regionCountryCodes: string[], e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCountries(prev => Array.from(new Set([...prev, ...regionCountryCodes])));
    };

    // Clear all countries in region
    const handleClearRegion = (regionCountryCodes: string[], e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCountries(prev => prev.filter(code => !regionCountryCodes.includes(code)));
    };
    const handleTrendDivisionFilterChange = (division: string) => setTrendFilters(f => ({...f, divisions: f.divisions.includes(division) ? f.divisions.filter(d => d !== division) : [...f.divisions, division]}));
    const handleCustomerDivisionFilterChange = (division: string) => setCustomerFilters(f => ({...f, divisions: f.divisions.includes(division) ? f.divisions.filter(d => d !== division) : [...f.divisions, division]}));
    
    const handleRegionToggle = (regionCountryCodes: string[]) => {
        const allCurrentlySelected = regionCountryCodes.every(code => selectedCountries.includes(code));
        if (allCurrentlySelected) setSelectedCountries(prev => prev.filter(code => !regionCountryCodes.includes(code)));
        else setSelectedCountries(prev => Array.from(new Set([...prev, ...regionCountryCodes])));
    };
    
    const handleSelectDisplayed = () => {
        const displayedCodes = (Object.values(groupedCountries).flat() as any[]).filter((c: any) => c.code.toLowerCase().includes(countrySearch.toLowerCase()) || c.name.toLowerCase().includes(countrySearch.toLowerCase())).map((c: any) => c.code);
        setSelectedCountries(displayedCodes);
    };

    const resetFilters = () => {
        if (maxDate) setDateRange({ start: '2025-01-01', end: maxDate.toISOString().split('T')[0] });
        setSelectedCountries(allCountriesInData);
        setTrendFilters(f => ({ ...f, divisions: allDivisions }));
        setCustomerFilters(f => ({ ...f, divisions: allDivisions }));
        setCountrySearch('');
        setIncludeOpsSourceFX(false); // Reset to default (exclude FX)
        setSelectedOpsSourceCodes([]); // Reset ops source code filter
        setSelectedBookingTypes([]); // Reset booking type filter
    }

    const availableQueries = useMemo<{ nr: number; name: string; code: string; icon: string }[]>(() => {
        // Show all queries, even if data hasn't loaded yet (for progressive loading)
        return QUERIES;
    }, []);

    useEffect(() => {
        if ((availableQueries as any[]).length > 0 && !(availableQueries as any[]).find((q: any) => q.code === selectedQuery)) {
             if ((availableQueries as any[]).find((q: any) => q.code === 'bookings_jk')) {
                 setSelectedQuery('bookings_jk');
             } else {
                 setSelectedQuery((availableQueries[0] as any).code);
             }
        }
    }, [availableQueries, selectedQuery]);

    const currentQueryInfo = useMemo(() => QUERIES.find(q => q.code === selectedQuery), [selectedQuery]);

    const filteredData = useMemo(() => {
        let data = allData[selectedQuery] || [];
        if (dateRange.start && dateRange.end) {
            const startDate = new Date(`${dateRange.start}T00:00:00Z`);
            const endDate = new Date(`${dateRange.end}T00:00:00Z`);
            endDate.setUTCMonth(endDate.getUTCMonth() + 1, 0);
            data = data.filter(item => {
                const itemDate = new Date(Date.UTC(item.year, item.month - 1));
                return itemDate >= startDate && itemDate <= endDate;
            });
        }
        if (selectedCountries.length < allCountriesInData.length) {
            const countrySet = new Set(selectedCountries);
            data = data.filter(item => {
                if (item.Country && countrySet.has(item.Country)) return true;
                if (selectedQuery === 'track_trace_con_yla' || selectedQuery === 'track_trace_con_ylb') {
                    if (item.value01 && countrySet.has(item.value01)) return true;
                }
                if (item.queryName && item.queryName.toUpperCase() === 'TRACK & TRACE - GLCON') {
                    if ((item.value01 && countrySet.has(item.value01)) || (item.value02 && countrySet.has(item.value02)) || (item.value03 && countrySet.has(item.value03))) return true;
                }
                return false;
            });
        }
        // Filter two: Ops Source Code FX filter (default: exclude FX)
        if (!includeOpsSourceFX) {
            data = data.filter(item => {
                // For track_trace_con_yla and track_trace_con_ylb: OpsSourceCode is in value04
                if ((selectedQuery === 'track_trace_con_yla' || selectedQuery === 'track_trace_con_ylb') && item.value04) {
                    return String(item.value04).toUpperCase() !== 'FX';
                }
                // For exceptions_yh: OpsSourceCode is in value01
                if (selectedQuery === 'exceptions_yh' && item.value01) {
                    return String(item.value01).toUpperCase() !== 'FX';
                }
                return true;
            });
        }

        // Filter three: Specific Ops Source Code filter
        if (selectedOpsSourceCodes.length > 0) {
            const codeSet = new Set(selectedOpsSourceCodes);
            data = data.filter(item => {
                // For track_trace_con_yla and track_trace_con_ylb: OpsSourceCode is in value04
                if ((selectedQuery === 'track_trace_con_yla' || selectedQuery === 'track_trace_con_ylb') && item.value04) {
                    return codeSet.has(String(item.value04).trim());
                }
                // For exceptions_yh: OpsSourceCode is in value01
                if (selectedQuery === 'exceptions_yh' && item.value01) {
                    return codeSet.has(String(item.value01).trim());
                }
                return true;
            });
        }

        // Filter four: Booking Type filter (for bookings_jk)
        if (selectedBookingTypes.length > 0 && selectedQuery === 'bookings_jk') {
            const typeSet = new Set(selectedBookingTypes);
            data = data.filter(item => {
                if (item.value01) {
                    return typeSet.has(String(item.value01).trim());
                }
                return false;
            });
        }

        // Query 2a specific filters
        // Customer names filter (multi-select)
        if (selectedCustomerNames.length > 0 && selectedQuery === 'track_trace_con_yla') {
            const customerSet = new Set(selectedCustomerNames);
            data = data.filter(item =>
                item.value06 && customerSet.has(String(item.value06).trim())
            );
        }

        // Source description filter (by OpsSourceCode)
        if (selectedSourceDescriptions.length > 0 && selectedQuery === 'track_trace_con_yla') {
            const codeSet = new Set(selectedSourceDescriptions);
            data = data.filter(item =>
                item.value04 && codeSet.has(String(item.value04).trim())
            );
        }

        return data;
    }, [allData, selectedQuery, dateRange, selectedCountries, allCountriesInData, includeOpsSourceFX, selectedOpsSourceCodes, selectedBookingTypes, selectedCustomerNames, selectedSourceDescriptions]);
    
    const isRevenueFormat = useMemo(() => {
        if (!currentQueryInfo || !currentQueryInfo.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)')) return false;
        const relevantRecords = (allData[selectedQuery] || []).filter(d => d.value02 && String(d.value02).trim() !== '');
        if (relevantRecords.length === 0) return false;
        return relevantRecords.every(d => !isNaN(parseFloat(String(d.value02!))));
    }, [selectedQuery, allData, currentQueryInfo]);

    // Calculate wave impact by month
    const calculateWaveImpact = useCallback((targetMonth: string, metricType: 'CONS_PCT' | 'REV_PCT'): number => {
        if (!waveData.waves.length || !waveData.assignments.length || !waveData.customers.length) {
            console.log(`[Wave Impact] No wave data available for ${targetMonth}`);
            return 0;
        }

        // Parse target month (format: YYYY-MM)
        const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number);

        let totalImpact = 0;

        // For each wave
        waveData.waves.forEach((wave: any) => {
            const waveYear = wave.YEAR;
            const waveMonth = wave.MONTH;

            // Check if this wave affects the target month
            // If target month is same as wave month: 50% reduction
            // If target month is after wave month: 100% reduction
            const isWaveMonth = targetYear === waveYear && targetMonthNum === waveMonth;
            const isAfterWave = targetYear > waveYear || (targetYear === waveYear && targetMonthNum > waveMonth);

            if (isWaveMonth || isAfterWave) {
                // Get all customer assignments for this wave
                const waveAssignments = waveData.assignments.filter((a: any) => a.WAVE_ID === wave.WAVE_ID);

                // Sum up the percentage impact for customers in this wave
                let wavePercentage = 0;
                waveAssignments.forEach((assignment: any) => {
                    const customer = waveData.customers.find((c: any) =>
                        c.COU_ID_ACC === assignment.COU_ID_ACC && c.ACC_ID === assignment.ACC_ID
                    );
                    if (customer) {
                        const pct = metricType === 'CONS_PCT' ? (customer.CONS_PCT || 0) : (customer.REV_PCT || 0);
                        wavePercentage += pct;
                    }
                });

                // Apply gradual reduction
                if (isWaveMonth) {
                    totalImpact += wavePercentage * 0.5; // 50% in wave month
                    console.log(`[Wave Impact] ${targetMonth}: Wave ${wave.WAVE_NAME} (${wave.YEAR}-${wave.MONTH}) - Wave Month - 50% of ${wavePercentage.toFixed(2)}% = ${(wavePercentage * 0.5).toFixed(2)}%`);
                } else {
                    totalImpact += wavePercentage; // 100% after wave month
                    console.log(`[Wave Impact] ${targetMonth}: Wave ${wave.WAVE_NAME} (${wave.YEAR}-${wave.MONTH}) - After Wave - 100% of ${wavePercentage.toFixed(2)}% = ${wavePercentage.toFixed(2)}%`);
                }
            }
        });

        const finalImpact = Math.min(totalImpact, 100);
        if (finalImpact > 0) {
            console.log(`[Wave Impact] ${targetMonth}: Total Impact = ${finalImpact.toFixed(2)}%`);
        }
        return finalImpact;
    }, [waveData]);

    const monthlyTrendData = useMemo(() => {
        if (selectedQuery === REVENUE_BY_CUSTOMER_CODE || selectedQuery === 'customer_revenue') {
            // Field mapping:
            // REVENUE_BY_CUSTOMER_CODE: division=value01, customer=value02, revenue=value03
            // customer_revenue: division=value02, customer=value03, revenue=value04
            const divisionField = selectedQuery === REVENUE_BY_CUSTOMER_CODE ? 'value01' : 'value02';
            const customerField = selectedQuery === REVENUE_BY_CUSTOMER_CODE ? 'value02' : 'value03';
            const revenueField = selectedQuery === REVENUE_BY_CUSTOMER_CODE ? 'value03' : 'value04';

            const divisionSet = new Set(trendFilters.divisions);
            const divisionFiltered = filteredData.filter(item => item[divisionField] && divisionSet.has(item[divisionField]));
            const customerTotals: { [name: string]: { revenue: number, consignments: number } } = {};
            divisionFiltered.forEach(d => {
                const customer = d[customerField] || 'Unknown';
                if (!customerTotals[customer]) customerTotals[customer] = { revenue: 0, consignments: 0 };
                customerTotals[customer].revenue += parseFloat(String(d[revenueField])) || 0;
                customerTotals[customer].consignments += d.recordCount || 0;
            });
            const sortedCustomers = Object.keys(customerTotals).sort((a, b) => customerTotals[b][trendFilters.metric] - customerTotals[a][trendFilters.metric]);
            const topCustomers = new Set(trendFilters.topN === 9999 ? sortedCustomers : sortedCustomers.slice(0, trendFilters.topN));
            const topCustomersData = divisionFiltered.filter(item => item[customerField] && topCustomers.has(item[customerField]));
            const trend: { [month: string]: any } = {};
            const activeDivisions = [...new Set(topCustomersData.map(d => d[divisionField] || 'Unknown'))].sort();
            topCustomersData.forEach(item => {
                const month = `${item.year}-${String(item.month).padStart(2, '0')}`;
                if (!trend[month]) {
                    trend[month] = { month };
                    activeDivisions.forEach(div => {
                        trend[month][`${div}_revenue`] = 0;
                        trend[month][`${div}_consignments`] = 0;
                    });
                }
                const division = item[divisionField] || 'Unknown';
                trend[month][`${division}_revenue`] += parseFloat(String(item[revenueField])) || 0;
                trend[month][`${division}_consignments`] += item.recordCount;
            });
            
            let finalData = Object.values(trend).sort((a: any, b: any) => a.month.localeCompare(b.month));

            if (predictTrend && finalData.length > 0) {
                 const last3 = finalData.slice(-3);
                 let avgRev = 0;
                 let avgCons = 0;
                 
                 if (last3.length > 0) {
                     const sums = last3.reduce((acc, item) => {
                         let mRev = 0;
                         let mCons = 0;
                         activeDivisions.forEach(d => {
                             mRev += item[`${d}_revenue`] || 0;
                             mCons += item[`${d}_consignments`] || 0;
                         });
                         return { rev: acc.rev + mRev, cons: acc.cons + mCons };
                     }, { rev: 0, cons: 0 });
                     avgRev = sums.rev / last3.length;
                     avgCons = sums.cons / last3.length;
                 }

                 // Get last actual values for the non-predicted metric
                 const lastActualItem = finalData[finalData.length - 1];
                 let lastActualRevenue = 0;
                 let lastActualConsignments = 0;
                 activeDivisions.forEach(d => {
                     lastActualRevenue += lastActualItem[`${d}_revenue`] || 0;
                     lastActualConsignments += lastActualItem[`${d}_consignments`] || 0;
                 });

                 const lastDateParts = finalData[finalData.length - 1].month.split('-');
                 let currentDate = new Date(parseInt(lastDateParts[0]), parseInt(lastDateParts[1]) - 1);
                 const migrationStartDate = new Date(2026, 0, 1);
                 const migrationEndDate = new Date(2028, 11, 1);

                 // Determine what to predict based on left axis (revenue by default, consignments when swapped)
                 const predictRevenue = !swapAxes;

                 while (currentDate < migrationStartDate) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    if (currentDate >= migrationStartDate) break;
                    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                    if (!finalData.some(d => d.month === monthKey)) {
                         const predictionData: any = { month: monthKey };
                         if (predictRevenue) {
                             predictionData.predicted_revenue = avgRev;
                         } else {
                             predictionData.predicted_consignments = Math.round(avgCons);
                         }
                         finalData.push(predictionData);
                    }
                }

                let predictionCurrentDate = new Date(currentDate);
                if (predictionCurrentDate < migrationStartDate) predictionCurrentDate = new Date(migrationStartDate);

                const monthsToMigrate = (migrationEndDate.getFullYear() - predictionCurrentDate.getFullYear()) * 12 + (migrationEndDate.getMonth() - predictionCurrentDate.getMonth());

                if (monthsToMigrate > 0) {
                    const startCons = avgCons;
                    const startRev = avgRev;

                    for (let i = 1; i <= monthsToMigrate; i++) {
                        predictionCurrentDate.setMonth(predictionCurrentDate.getMonth() + 1);
                        const monthKey = `${predictionCurrentDate.getFullYear()}-${String(predictionCurrentDate.getMonth() + 1).padStart(2, '0')}`;

                        const progress = i / monthsToMigrate;
                        const cosineFactor = (Math.cos(Math.PI * progress) + 1) / 2;
                        const randomDeviation = 1 + (Math.random() - 0.5) * 0.1;

                        const predCons = Math.max(0, Math.round(startCons * cosineFactor * randomDeviation));
                        const predRev = Math.max(0, startRev * cosineFactor * randomDeviation);

                        const predictionData: any = { month: monthKey };
                        if (predictRevenue) {
                            predictionData.predicted_revenue = predRev;
                        } else {
                            predictionData.predicted_consignments = predCons;
                        }
                        finalData.push(predictionData);
                    }
                }
            }

            // Add wave-based prediction
            if (predictWaveTrend && finalData.length > 0) {
                const last3 = finalData.slice(-3);
                let avgRev = 0;
                let avgCons = 0;

                if (last3.length > 0) {
                    const sums = last3.reduce((acc, item) => {
                        let mRev = 0;
                        let mCons = 0;
                        activeDivisions.forEach(d => {
                            mRev += item[`${d}_revenue`] || 0;
                            mCons += item[`${d}_consignments`] || 0;
                        });
                        return { rev: acc.rev + mRev, cons: acc.cons + mCons };
                    }, { rev: 0, cons: 0 });
                    avgRev = sums.rev / last3.length;
                    avgCons = sums.cons / last3.length;
                }

                // Get last actual values for wave prediction
                const lastActualItem = finalData[finalData.length - 1];
                let lastActualRevenue = 0;
                let lastActualConsignments = 0;
                activeDivisions.forEach(d => {
                    lastActualRevenue += lastActualItem[`${d}_revenue`] || 0;
                    lastActualConsignments += lastActualItem[`${d}_consignments`] || 0;
                });
                const predictRevenue = !swapAxes;

                const lastDateParts = finalData[finalData.length - 1].month.split('-');
                let currentDate = new Date(parseInt(lastDateParts[0]), parseInt(lastDateParts[1]) - 1);
                const migrationEndDate = new Date(2028, 11, 1);

                // Fill in months until migration end with wave-based prediction
                while (currentDate < migrationEndDate) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

                    // Auto-detect metric type: use REV_PCT for revenue queries
                    const metricType = 'REV_PCT';
                    const waveImpact = calculateWaveImpact(monthKey, metricType);

                    // Apply wave impact as reduction
                    const reductionFactor = 1 - (waveImpact / 100);
                    const wavePredCons = Math.max(0, Math.round(avgCons * reductionFactor));
                    const wavePredRev = Math.max(0, avgRev * reductionFactor);

                    // Find existing data point or add new one
                    const existingIndex = finalData.findIndex(d => d.month === monthKey);
                    if (existingIndex >= 0) {
                        if (predictRevenue) {
                            finalData[existingIndex].wave_predicted_revenue = wavePredRev;
                        } else {
                            finalData[existingIndex].wave_predicted_consignments = wavePredCons;
                        }
                    } else {
                        const waveData: any = { month: monthKey };
                        if (predictRevenue) {
                            waveData.wave_predicted_revenue = wavePredRev;
                        } else {
                            waveData.wave_predicted_consignments = wavePredCons;
                        }
                        finalData.push(waveData);
                    }
                }
            }

            // Add total_revenue and total_consignments to each data point
            finalData = finalData.map(item => {
                // If this is a prediction data point, don't recalculate totals
                if (item.predicted_revenue !== undefined || item.predicted_consignments !== undefined ||
                    item.wave_predicted_revenue !== undefined || item.wave_predicted_consignments !== undefined) {
                    // For prediction points, ensure missing totals stay undefined
                    return {
                        ...item,
                        total_revenue: item.total_revenue,
                        total_consignments: item.total_consignments
                    };
                }

                let totalRevenue = 0;
                let totalConsignments = 0;
                activeDivisions.forEach(div => {
                    totalRevenue += item[`${div}_revenue`] || 0;
                    totalConsignments += item[`${div}_consignments`] || 0;
                });
                return {
                    ...item,
                    total_revenue: totalRevenue,
                    total_consignments: totalConsignments
                };
            });

            return { data: finalData, divisions: activeDivisions };
        }

        const isBillingQuery = currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)');
        const isTotalRevenueQuery = currentQueryInfo?.name.toUpperCase() === 'TOTAL REVENUE';
        const trend: { [key: string]: { records: number, revenue?: number } } = {};
        filteredData.forEach(item => {
            const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
            if (!trend[key]) {
                trend[key] = { records: 0 };
                if ((isBillingQuery && isRevenueFormat) || isTotalRevenueQuery) trend[key].revenue = 0;
            }
            trend[key].records += item.recordCount;
            if (isBillingQuery && isRevenueFormat && trend[key].revenue !== undefined && item.value02) {
                (trend[key].revenue as number) += parseFloat(String(item.value02));
            }
            if (isTotalRevenueQuery && trend[key].revenue !== undefined && item.value03) {
                (trend[key].revenue as number) += parseFloat(String(item.value03));
            }
        });
        const actualTrendData = Object.entries(trend).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month));

        if (!predictTrend || actualTrendData.length === 0) {
            return { data: actualTrendData.map(d => ({ ...d, prediction: null })), divisions: [] };
        }

        const combinedData: { month: string, records: number | null, revenue?: number | null, prediction: number | null }[] = actualTrendData.map(d => ({ ...d, prediction: null }));

        const lastThreeMonths = actualTrendData.slice(-3);
        const averageRecords = lastThreeMonths.length > 0 ? lastThreeMonths.reduce((sum, item) => sum + item.records, 0) / lastThreeMonths.length : 0;
        const averageRevenue = (isTotalRevenueQuery && lastThreeMonths.length > 0)
            ? lastThreeMonths.reduce((sum, item) => sum + (item.revenue || 0), 0) / lastThreeMonths.length
            : 0;

        const lastDateParts = actualTrendData[actualTrendData.length - 1].month.split('-');
        let currentDate = new Date(parseInt(lastDateParts[0]), parseInt(lastDateParts[1]) - 1);

        const migrationStartDate = new Date(2026, 0, 1);
        const migrationEndDate = new Date(2028, 11, 1);

        const lastPoint = combinedData[combinedData.length - 1];
        // Determine what to predict based on left axis (revenue by default, consignments when swapped)
        const predictRevenue = isTotalRevenueQuery && !swapAxes;
        if (predictRevenue) {
            lastPoint.prediction = lastPoint.revenue || 0;
        } else {
            lastPoint.prediction = lastPoint.records;
        }

        while (currentDate < migrationStartDate) {
            currentDate.setMonth(currentDate.getMonth() + 1);
            if (currentDate >= migrationStartDate) break;
            const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            combinedData.push({
                month: monthKey,
                records: null,
                revenue: null,
                prediction: predictRevenue ? averageRevenue : Math.round(averageRecords)
            });
        }

        const predictionStartValue = combinedData[combinedData.length - 1].prediction || (predictRevenue ? averageRevenue : averageRecords);
        let predictionCurrentDate = new Date(currentDate);
        if (predictionCurrentDate < migrationStartDate) {
            predictionCurrentDate = new Date(migrationStartDate);
            const startMonthKey = `${predictionCurrentDate.getFullYear()}-${String(predictionCurrentDate.getMonth() + 1).padStart(2, '0')}`;
            if (!combinedData.some(d => d.month === startMonthKey)) {
                 combinedData.push({
                    month: startMonthKey,
                    records: null,
                    revenue: null,
                    prediction: predictionStartValue
                });
            }
        }

        const monthsToMigrate = (migrationEndDate.getFullYear() - predictionCurrentDate.getFullYear()) * 12 + (migrationEndDate.getMonth() - predictionCurrentDate.getMonth());

        if (monthsToMigrate > 0) {
            for (let i = 1; i <= monthsToMigrate; i++) {
                predictionCurrentDate.setMonth(predictionCurrentDate.getMonth() + 1);
                const monthKey = `${predictionCurrentDate.getFullYear()}-${String(predictionCurrentDate.getMonth() + 1).padStart(2, '0')}`;

                const progress = i / monthsToMigrate;
                const cosineFactor = (Math.cos(Math.PI * progress) + 1) / 2;
                const idealPredictedValue = predictionStartValue * cosineFactor;
                const randomnessFactor = 0.3;
                const randomDeviation = idealPredictedValue * randomnessFactor * (Math.random() - 0.5) * 2;
                let predictedValue = predictRevenue
                    ? (idealPredictedValue + randomDeviation)
                    : Math.round(idealPredictedValue + randomDeviation);

                const previousPrediction = combinedData[combinedData.length - 1].prediction;
                if (previousPrediction !== null && predictedValue > previousPrediction) {
                    predictedValue = previousPrediction;
                }
                if (predictedValue < 0) {
                    predictedValue = 0;
                }
                if (i === monthsToMigrate) {
                    predictedValue = 0;
                }

                combinedData.push({
                    month: monthKey,
                    records: null,
                    revenue: null,
                    prediction: predictedValue
                });
            }
        }

        // Add wave-based prediction for general queries
        if (predictWaveTrend && actualTrendData.length > 0) {
            const lastThreeMonths = actualTrendData.slice(-3);
            const averageRecords = lastThreeMonths.length > 0 ? lastThreeMonths.reduce((sum, item) => sum + item.records, 0) / lastThreeMonths.length : 0;
            const averageRevenue = (isTotalRevenueQuery && lastThreeMonths.length > 0)
                ? lastThreeMonths.reduce((sum, item) => sum + (item.revenue || 0), 0) / lastThreeMonths.length
                : 0;

            // Use predictRevenue to determine what to predict for wave-based prediction
            if (predictRevenue) {
                console.log(`[Wave Prediction] Baseline (avg of last 3 months): Revenue=${averageRevenue.toFixed(2)}`);
            } else {
                console.log(`[Wave Prediction] Baseline (avg of last 3 months): ${averageRecords.toFixed(2)}`);
            }

            const lastDateParts = actualTrendData[actualTrendData.length - 1].month.split('-');
            let currentDate = new Date(parseInt(lastDateParts[0]), parseInt(lastDateParts[1]) - 1);
            const migrationEndDate = new Date(2028, 11, 1);

            // Fill in months until migration end with wave-based prediction
            while (currentDate < migrationEndDate) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

                // Auto-detect metric type: use REV_PCT for revenue predictions, CONS_PCT for consignment predictions
                const metricType = (predictRevenue || (isBillingQuery && isRevenueFormat)) ? 'REV_PCT' : 'CONS_PCT';
                const waveImpact = calculateWaveImpact(monthKey, metricType);

                // Apply wave impact as reduction
                const reductionFactor = 1 - (waveImpact / 100);
                const wavePrediction = predictRevenue
                    ? Math.max(0, averageRevenue * reductionFactor)
                    : Math.max(0, Math.round(averageRecords * reductionFactor));

                if (waveImpact > 0) {
                    if (predictRevenue) {
                        console.log(`[Wave Prediction] ${monthKey}: Impact=${waveImpact.toFixed(2)}%, ReductionFactor=${reductionFactor.toFixed(2)}, Baseline Revenue=${averageRevenue.toFixed(2)}, Predicted=${wavePrediction.toFixed(2)}`);
                    } else {
                        console.log(`[Wave Prediction] ${monthKey}: Impact=${waveImpact.toFixed(2)}%, ReductionFactor=${reductionFactor.toFixed(2)}, Baseline=${averageRecords.toFixed(2)}, Predicted=${wavePrediction}`);
                    }
                }

                // Find existing data point or add new one
                const existingIndex = combinedData.findIndex(d => d.month === monthKey);
                if (existingIndex >= 0) {
                    combinedData[existingIndex].wave_prediction = wavePrediction;
                } else {
                    combinedData.push({
                        month: monthKey,
                        records: null,
                        revenue: null,
                        prediction: null,
                        wave_prediction: wavePrediction
                    });
                }
            }
        }

        return { data: combinedData, divisions: [] };
    }, [filteredData, predictTrend, predictWaveTrend, selectedQuery, isRevenueFormat, trendFilters, currentQueryInfo, calculateWaveImpact]);

    const topCountriesData = useMemo(() => {
        const queryName = currentQueryInfo?.name.toUpperCase();
        if (queryName === 'BOOKINGS (JK)') {
            const byCountry: { [key: string]: number } = {};
            filteredData.forEach(item => {
                const country = item.Country?.trim();
                if(country && countryCodeMap[country]) {
                    byCountry[country] = (byCountry[country] || 0) + item.recordCount;
                }
            });
            return Object.entries(byCountry).map(([country, bookings]) => ({ country, bookings })).sort((a, b) => b.bookings - a.bookings).slice(0, topNCount);
        } else if (queryName === 'TOTAL REVENUE') {
            // For total_revenue: country=value01, revenue=value03
            const byCountry: { [key: string]: { revenue: number, bookings: number } } = {};
            filteredData.forEach(item => {
                const country = item.value01?.trim();
                if(country && countryCodeMap[country]) {
                    if (!byCountry[country]) byCountry[country] = { revenue: 0, bookings: 0 };
                    byCountry[country].revenue += parseFloat(String(item.value03)) || 0;
                    byCountry[country].bookings += item.recordCount || 0;
                }
            });
            return Object.entries(byCountry).map(([country, data]) => ({ country, ...data })).sort((a, b) => b.revenue - a.revenue).slice(0, topNCount);
        } else if (queryName === 'TRACK & TRACE CONSIGNMENTS (YLA)') {
            // For YLA: country=value01 (Country field)
            const byCountry: { [key: string]: number } = {};
            filteredData.forEach(item => {
                const country = item.value01?.trim();
                if(country && countryCodeMap[country]) {
                    byCountry[country] = (byCountry[country] || 0) + item.recordCount;
                }
            });
            return Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a, b) => b.records - a.records).slice(0, topNCount);
        }
        return [];
    }, [filteredData, topNCount, currentQueryInfo, countryCodeMap]);

    const totalRevenueTrendData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TOTAL REVENUE') return [];
        const trend: { [month: string]: { month: string, revenue: number, consignments: number } } = {};
        filteredData.forEach(item => {
            const month = `${item.year}-${String(item.month).padStart(2, '0')}`;
            if (!trend[month]) {
                trend[month] = { month, revenue: 0, consignments: 0 };
            }
            trend[month].revenue += parseFloat(String(item.value03)) || 0; // value03 is Revenue_EUR
            trend[month].consignments += item.recordCount || 0;
        });
        return Object.values(trend).sort((a, b) => a.month.localeCompare(b.month));
    }, [filteredData, currentQueryInfo]);

    const bookingTypeData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'BOOKINGS (JK)') return [];
        const byType: { [key: string]: number } = {};
        filteredData.forEach(item => { byType[item.value01 || 'N/A'] = (byType[item.value01 || 'N/A'] || 0) + item.recordCount; });
        return Object.entries(byType).map(([name, value]) => ({ name, value }));
    }, [filteredData, currentQueryInfo]);

    const invoicedByCountryData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'INVOICED CONSIGNMENTS (YI)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => {
            const country = item.Country?.trim();
            if(country && countryCodeMap[country]) {
                byCountry[country] = (byCountry[country] || 0) + item.recordCount;
            }
        });
        return Object.entries(byCountry).map(([country, consignments]) => ({ country, consignments })).sort((a, b) => b.consignments - a.consignments).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo, countryCodeMap]);

    const invoicedByDivisionData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'INVOICED CONSIGNMENTS (YI)') return [];
        const byDivision: { [key: string]: number } = {};
        filteredData.forEach(item => { byDivision[item.value01 || 'N/A'] = (byDivision[item.value01 || 'N/A'] || 0) + item.recordCount; });
        return Object.entries(byDivision).map(([name, value]) => ({ name, value }));
    }, [filteredData, currentQueryInfo]);

    const topOriginCountriesData = useMemo(() => {
        const queryName = currentQueryInfo?.name.toUpperCase();
        if (queryName !== 'TRACK & TRACE CONSIGNMENTS (YLA)' && queryName !== 'TRACK & TRACE CONSIGNMENTS (YLB)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if (item.value02) byCountry[item.value02] = (byCountry[item.value02] || 0) + item.recordCount; });
        return Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a,b) => b.records - a.records).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);

    const topDestinationCountriesData = useMemo(() => {
        const queryName = currentQueryInfo?.name.toUpperCase();
        if (queryName !== 'TRACK & TRACE CONSIGNMENTS (YLA)' && queryName !== 'TRACK & TRACE CONSIGNMENTS (YLB)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if (item.value03) byCountry[item.value03] = (byCountry[item.value03] || 0) + item.recordCount; });
        return Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a,b) => b.records - a.records).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);
    
    const transitCountryData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YLB)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if (item.value01) byCountry[item.value01] = (byCountry[item.value01] || 0) + item.recordCount; });
        const sortedData = Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a, b) => b.records - a.records);
        // Use topNCount for filtering
        return sortedData.slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);

    // Get all available ops source codes from the current data (before filtering)
    const availableOpsSourceCodes = useMemo(() => {
        let data = allData[selectedQuery] || [];
        const codes = new Set<string>();

        // For track_trace_con_yla and track_trace_con_ylb: OpsSourceCode is in value04
        if (selectedQuery === 'track_trace_con_yla' || selectedQuery === 'track_trace_con_ylb') {
            data.forEach(item => {
                if (item.value04) codes.add(String(item.value04).trim());
            });
        }
        // For exceptions_yh: OpsSourceCode is in value01
        else if (selectedQuery === 'exceptions_yh') {
            data.forEach(item => {
                if (item.value01) codes.add(String(item.value01).trim());
            });
        }

        return Array.from(codes).sort();
    }, [allData, selectedQuery]);

    // Get all available booking types from the current data (before filtering)
    const availableBookingTypes = useMemo(() => {
        if (selectedQuery !== 'bookings_jk') return [];
        let data = allData[selectedQuery] || [];
        const types = new Set<string>();

        data.forEach(item => {
            if (item.value01) types.add(String(item.value01).trim());
        });

        return Array.from(types).sort();
    }, [allData, selectedQuery]);

    // Query 2a specific data processing
    const availableSourceDescriptions = useMemo(() => {
        if (selectedQuery !== 'track_trace_con_yla') return [];
        let data = allData[selectedQuery] || [];
        const descriptionsMap = new Map<string, string>();

        data.forEach(item => {
            const code = item.value04 ? String(item.value04).trim() : '';
            const desc = item.value05 ? String(item.value05).trim() : '';
            if (code && !descriptionsMap.has(code)) {
                descriptionsMap.set(code, desc);
            }
        });

        return Array.from(descriptionsMap.entries())
            .map(([code, description]) => ({ code, description }))
            .sort((a, b) => a.code.localeCompare(b.code));
    }, [allData, selectedQuery]);

    const availableMonths = useMemo(() => {
        if (selectedQuery !== 'track_trace_con_yla') return [];
        let data = allData[selectedQuery] || [];
        const months = new Set<number>();
        data.forEach(item => months.add(item.month));
        return Array.from(months).sort((a, b) => a - b);
    }, [allData, selectedQuery]);

    const availableYears = useMemo(() => {
        if (selectedQuery !== 'track_trace_con_yla') return [];
        let data = allData[selectedQuery] || [];
        const years = new Set<number>();
        data.forEach(item => years.add(item.year));
        return Array.from(years).sort((a, b) => a - b);
    }, [allData, selectedQuery]);

    const customerSearchResults = useMemo(() => {
        if (selectedQuery !== 'track_trace_con_yla' || customerSearchText.length < 3) return [];
        let data = allData[selectedQuery] || [];
        const customers = new Set<string>();

        const searchLower = customerSearchText.toLowerCase();
        data.forEach(item => {
            const customerName = item.value06 ? String(item.value06).trim() : '';
            if (customerName && customerName.toUpperCase() !== 'NULL' && customerName.toLowerCase().includes(searchLower)) {
                customers.add(customerName);
            }
        });

        return Array.from(customers).sort().slice(0, 20);
    }, [allData, selectedQuery, customerSearchText]);

    const allAvailableCustomers = useMemo(() => {
        if (selectedQuery !== 'track_trace_con_yla') return [];
        // Apply all filters except customer name filters to show available customers in current context
        let data = allData[selectedQuery] || [];

        // Apply date range filter
        if (dateRange.start && dateRange.end) {
            const startDate = new Date(`${dateRange.start}T00:00:00Z`);
            const endDate = new Date(`${dateRange.end}T00:00:00Z`);
            endDate.setUTCMonth(endDate.getUTCMonth() + 1, 0);
            data = data.filter(item => {
                const itemDate = new Date(Date.UTC(item.year, item.month - 1));
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        // Apply country filter
        if (selectedCountries.length < allCountriesInData.length) {
            const countrySet = new Set(selectedCountries);
            data = data.filter(item => {
                if (item.value01 && countrySet.has(item.value01)) return true;
                return false;
            });
        }

        // Apply FX filter
        if (!includeOpsSourceFX) {
            data = data.filter(item => {
                if (item.value04) {
                    return String(item.value04).toUpperCase() !== 'FX';
                }
                return true;
            });
        }

        // Apply Ops Source Code filter
        if (selectedOpsSourceCodes.length > 0) {
            const codeSet = new Set(selectedOpsSourceCodes);
            data = data.filter(item => {
                if (item.value04) {
                    return codeSet.has(String(item.value04).trim());
                }
                return true;
            });
        }

        // Apply Source Description filter (Query 2a specific)
        if (selectedSourceDescriptions.length > 0) {
            const codeSet = new Set(selectedSourceDescriptions);
            data = data.filter(item => {
                if (item.value04) {
                    return codeSet.has(String(item.value04).trim());
                }
                return false;
            });
        }

        // Extract unique customer names
        const customers = new Set<string>();
        data.forEach(item => {
            const customerName = item.value06 ? String(item.value06).trim() : '';
            if (customerName && customerName.toUpperCase() !== 'NULL') {
                customers.add(customerName);
            }
        });

        return Array.from(customers).sort();
    }, [allData, selectedQuery, dateRange, selectedCountries, allCountriesInData, includeOpsSourceFX, selectedOpsSourceCodes, selectedSourceDescriptions]);

    const topCustomersData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YLA)') return [];
        const byCustomer: { [key: string]: number } = {};
        filteredData.forEach(item => {
            // Filter out NULL, empty, or undefined customers
            if (item.value06 && String(item.value06).trim() && String(item.value06).toUpperCase() !== 'NULL') {
                byCustomer[item.value06] = (byCustomer[item.value06] || 0) + item.recordCount;
            }
        });
        return Object.entries(byCustomer)
            .map(([customer, records]) => ({ customer, records }))
            .sort((a, b) => b.records - a.records)
            .slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);

    // Visualization 1: Monthly Trend - Stacked Area Chart
    const monthlyTrendStackedData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YLA)') return [];

        // Aggregate by month and OpsSource
        const byMonthAndSource: { [key: string]: { [source: string]: number } } = {};
        filteredData.forEach(item => {
            const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
            const source = item.value04 || 'Unknown';
            if (!byMonthAndSource[monthKey]) byMonthAndSource[monthKey] = {};
            byMonthAndSource[monthKey][source] = (byMonthAndSource[monthKey][source] || 0) + item.recordCount;
        });

        // Get top 6 sources, group rest as "Other"
        const allSources = new Set<string>();
        Object.values(byMonthAndSource).forEach(monthData => {
            Object.keys(monthData).forEach(source => allSources.add(source));
        });
        const sourceTotals = Array.from(allSources).map(source => ({
            source,
            total: Object.values(byMonthAndSource).reduce((sum, monthData) => sum + (monthData[source] || 0), 0)
        })).sort((a, b) => b.total - a.total);

        const topSources = sourceTotals.slice(0, 6).map(s => s.source);

        // Build final array
        return Object.keys(byMonthAndSource).sort().map(monthKey => {
            const result: any = { month: monthKey };
            topSources.forEach(source => {
                result[source] = byMonthAndSource[monthKey][source] || 0;
            });
            result['Other'] = Object.keys(byMonthAndSource[monthKey])
                .filter(s => !topSources.includes(s))
                .reduce((sum, s) => sum + byMonthAndSource[monthKey][s], 0);
            return result;
        });
    }, [filteredData, currentQueryInfo]);

    // Visualization 2: Volume + Customers - Combo Chart
    const volumeCustomersComboData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YLA)') return [];

        const byMonth: { [key: string]: { records: number, customers: Set<string> } } = {};
        filteredData.forEach(item => {
            const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
            if (!byMonth[monthKey]) byMonth[monthKey] = { records: 0, customers: new Set() };
            byMonth[monthKey].records += item.recordCount;
            if (item.value06 && item.value06.toUpperCase() !== 'NULL') {
                byMonth[monthKey].customers.add(item.value06);
            }
        });

        return Object.keys(byMonth).sort().map(month => ({
            month,
            records: byMonth[month].records,
            customers: byMonth[month].customers.size
        }));
    }, [filteredData, currentQueryInfo]);

    // Visualization 3: Country-Month Heatmap
    const countryMonthHeatmapData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YLA)') return [];

        // Aggregate by country and month
        const byCountryMonth: { [country: string]: { [month: number]: number } } = {};
        filteredData.forEach(item => {
            const country = item.value01 || 'Unknown';
            if (!byCountryMonth[country]) byCountryMonth[country] = {};
            byCountryMonth[country][item.month] = (byCountryMonth[country][item.month] || 0) + item.recordCount;
        });

        // Get top 12 countries by total volume
        const countryTotals = Object.keys(byCountryMonth).map(country => ({
            country,
            total: Object.values(byCountryMonth[country]).reduce((sum, val) => sum + val, 0)
        })).sort((a, b) => b.total - a.total).slice(0, 12);

        // Build data for heatmap
        return countryTotals.map(({ country }) => {
            const row: any = { country };
            for (let month = 1; month <= 12; month++) {
                row[`m${month}`] = byCountryMonth[country][month] || 0;
            }
            return row;
        });
    }, [filteredData, currentQueryInfo]);

    // Visualization 4: OpsSource Treemap
    const opsSourceTreemapData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YLA)') return [];

        // Aggregate by OpsSource and Customer
        const bySourceCustomer: { [source: string]: { [customer: string]: number } } = {};
        filteredData.forEach(item => {
            const source = item.value04 || 'Unknown';
            const customer = item.value06 || 'Unknown';
            if (!bySourceCustomer[source]) bySourceCustomer[source] = {};
            bySourceCustomer[source][customer] = (bySourceCustomer[source][customer] || 0) + item.recordCount;
        });

        // Build treemap structure
        return Object.keys(bySourceCustomer).map(source => {
            const customers = Object.keys(bySourceCustomer[source])
                .map(customer => ({
                    name: customer,
                    value: bySourceCustomer[source][customer]
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 3); // Top 3 customers per source

            return {
                name: source,
                children: customers
            };
        });
    }, [filteredData, currentQueryInfo]);

    const kpiData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YLA)') {
            return { totalRecords: 0, uniqueCountries: 0, dateRange: '', uniqueCustomers: 0 };
        }

        if (!filteredData || filteredData.length === 0) {
            return { totalRecords: 0, uniqueCountries: 0, dateRange: 'N/A', uniqueCustomers: 0 };
        }

        const totalRecords = filteredData.reduce((sum, item) => sum + item.recordCount, 0);
        const uniqueCountries = new Set(filteredData.map(item => item.value01).filter(Boolean)).size;
        const uniqueCustomers = new Set(
            filteredData
                .map(item => item.value06 ? String(item.value06).trim() : '')
                .filter(name => name && name.toUpperCase() !== 'NULL')
        ).size;

        const years = filteredData.map(item => item.year).filter(y => y != null);
        const months = filteredData.map(item => item.month).filter(m => m != null);

        if (years.length === 0 || months.length === 0) {
            return { totalRecords, uniqueCountries, dateRange: 'N/A', uniqueCustomers };
        }

        // Use reduce to avoid stack overflow with large arrays
        const minYear = years.reduce((min, y) => y < min ? y : min, years[0]);
        const maxYear = years.reduce((max, y) => y > max ? y : max, years[0]);

        // Get months for min and max years
        const minYearMonths = filteredData.filter(item => item.year === minYear).map(item => item.month).filter(m => m != null);
        const maxYearMonths = filteredData.filter(item => item.year === maxYear).map(item => item.month).filter(m => m != null);

        const minMonth = minYearMonths.length > 0 ? minYearMonths.reduce((min, m) => m < min ? m : min, minYearMonths[0]) : 1;
        const maxMonth = maxYearMonths.length > 0 ? maxYearMonths.reduce((max, m) => m > max ? m : max, maxYearMonths[0]) : 12;

        const dateRange = `${minYear}-${String(minMonth).padStart(2, '0')} to ${maxYear}-${String(maxMonth).padStart(2, '0')}`;

        return { totalRecords, uniqueCountries, dateRange, uniqueCustomers };
    }, [filteredData, currentQueryInfo]);

    const opsSourceCodeData = useMemo(() => {
        const queryName = currentQueryInfo?.name.toUpperCase();
        if (queryName !== 'TRACK & TRACE CONSIGNMENTS (YLA)' && queryName !== 'TRACK & TRACE CONSIGNMENTS (YLB)') return [];

        const byCode: { [key: string]: { value: number, description: string } } = {};
        filteredData.forEach(item => {
            const code = item.value04 || 'N/A';
            const desc = item.value05 || '';
            if (!byCode[code]) {
                byCode[code] = { value: 0, description: desc };
            }
            byCode[code].value += item.recordCount;
        });

        // For YLA query, apply Top N logic with Others grouping
        if (queryName === 'TRACK & TRACE CONSIGNMENTS (YLA)') {
            const sorted = Object.entries(byCode)
                .map(([code, data]) => ({
                    name: desc => code + (data.description ? ` - ${data.description}` : ''),
                    displayName: code + (data.description ? ` - ${data.description}` : ''),
                    value: data.value
                }))
                .sort((a, b) => b.value - a.value);

            if (sorted.length > opsSourceTopN) {
                const topItems = sorted.slice(0, opsSourceTopN);
                const othersValue = sorted.slice(opsSourceTopN).reduce((sum, item) => sum + item.value, 0);
                return [
                    ...topItems.map(item => ({ name: item.displayName, value: item.value })),
                    { name: 'Others', value: othersValue }
                ];
            }
            return sorted.map(item => ({ name: item.displayName, value: item.value }));
        }

        // For YL query, show all with Code - Description
        return Object.entries(byCode).map(([code, data]) => ({
            name: code + (data.description ? ` - ${data.description}` : ''),
            value: data.value
        }));
    }, [filteredData, currentQueryInfo, opsSourceTopN]);

    const billingByProductData = useMemo(() => {
        if (!currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)')) return [];
        const byProduct: { [key: string]: number } = {};
        filteredData.forEach(item => { byProduct[item.value02 || 'N/A'] = (byProduct[item.value02 || 'N/A'] || 0) + item.recordCount; });
        const sortedData = Object.entries(byProduct).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        if (topNCount < 9999 && sortedData.length > topNCount) {
            const topData = sortedData.slice(0, topNCount);
            const otherValue = sortedData.slice(topNCount).reduce((acc, curr) => acc + curr.value, 0);
            return [...topData, { name: 'Others', value: otherValue }];
        }
        return sortedData;
    }, [filteredData, currentQueryInfo, topNCount]);

    const billingByBillingTypeData = useMemo(() => {
        if (!currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)')) return [];
        const byType: { [key: string]: number } = {};
        filteredData.forEach(item => { byType[item.value03 || 'N/A'] = (byType[item.value03 || 'N/A'] || 0) + item.recordCount; });
        return Object.entries(byType).map(([name, records]) => ({ name, records })).sort((a, b) => b.records - a.records).slice(0, topNCount);
    }, [filteredData, currentQueryInfo, topNCount]);

    const divisionByBillingTypeData = useMemo(() => {
        if (!currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)')) return { data: [], billingTypes: [] };
        const data: { [division: string]: { [billingType: string]: number } } = {};
        const billingTypes = new Set<string>();

        filteredData.forEach(item => {
            const division = item.value01 || 'N/A';
            const billingType = item.value03 || 'N/A';
            billingTypes.add(billingType);

            if (!data[division]) data[division] = {};
            data[division][billingType] = (data[division][billingType] || 0) + item.recordCount;
        });

        return {
            data: Object.entries(data).map(([division, types]) => ({
                division,
                ...types
            })),
            billingTypes: Array.from(billingTypes)
        };
    }, [filteredData, currentQueryInfo]);

    const invoicedMonthlyTrendData = useMemo(() => {
        if (!currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)')) return [];
        const byMonth: { [key: string]: number } = {};

        filteredData.forEach(item => {
            const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
            byMonth[monthKey] = (byMonth[monthKey] || 0) + item.recordCount;
        });

        return Object.entries(byMonth)
            .map(([month, records]) => ({ month, records }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [filteredData, currentQueryInfo]);

    const productByBillingTypeData = useMemo(() => {
        if (!currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)')) return { data: [], products: [] };
        const data: { [product: string]: { [billingType: string]: number } } = {};
        const billingTypes = new Set<string>();

        filteredData.forEach(item => {
            const product = item.value02 || 'N/A';
            const billingType = item.value03 || 'N/A';
            billingTypes.add(billingType);

            if (!data[product]) data[product] = {};
            data[product][billingType] = (data[product][billingType] || 0) + item.recordCount;
        });

        // Sort by total records and take top 10
        const sortedProducts = Object.entries(data)
            .map(([product, types]) => ({
                product,
                total: Object.values(types).reduce((sum, val) => sum + val, 0),
                ...types
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        return {
            data: sortedProducts,
            billingTypes: Array.from(billingTypes)
        };
    }, [filteredData, currentQueryInfo]);

    const countryByBillingTypeData = useMemo(() => {
        if (!currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)')) return [];
        const byCountryType: { [key: string]: { country: string; billingType: string; records: number } } = {};

        filteredData.forEach(item => {
            const country = item.Country?.trim();
            const billingType = item.value03 || 'N/A';
            const key = `${country}_${billingType}`;

            if (country && countryCodeMap[country]) {
                if (!byCountryType[key]) {
                    byCountryType[key] = { country, billingType, records: 0 };
                }
                byCountryType[key].records += item.recordCount;
            }
        });

        return Object.values(byCountryType)
            .sort((a, b) => b.records - a.records)
            .slice(0, 15);
    }, [filteredData, currentQueryInfo, countryCodeMap]);

    const divisionMonthlyTrendData = useMemo(() => {
        if (!currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)')) return { data: [], divisions: [] };
        const byMonthDivision: { [month: string]: { [division: string]: number } } = {};
        const divisions = new Set<string>();

        filteredData.forEach(item => {
            const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
            const division = item.value01 || 'N/A';
            divisions.add(division);

            if (!byMonthDivision[monthKey]) byMonthDivision[monthKey] = {};
            byMonthDivision[monthKey][division] = (byMonthDivision[monthKey][division] || 0) + item.recordCount;
        });

        const data = Object.entries(byMonthDivision)
            .map(([month, divs]) => ({
                month,
                ...divs
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return {
            data,
            divisions: Array.from(divisions)
        };
    }, [filteredData, currentQueryInfo]);

    const billingByCountryRevenue = useMemo(() => {
        if (!currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)') || !isRevenueFormat) return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if(item.Country && item.value02) byCountry[item.Country] = (byCountry[item.Country] || 0) + parseFloat(String(item.value02)); });
        return Object.entries(byCountry).map(([country, revenue]) => ({ country, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, topNCount);
    }, [filteredData, currentQueryInfo, isRevenueFormat, topNCount]);
    
    const billingByServiceTypeRevenue = useMemo(() => {
        if (!currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)') || !isRevenueFormat) return [];
        const byService: { [key: string]: number } = {};
        filteredData.forEach(item => { if(item.value02) byService[item.value01 || 'N/A'] = (byService[item.value01 || 'N/A'] || 0) + parseFloat(String(item.value02)); });
        return Object.entries(byService).map(([name, value]) => ({ name, value }));
    }, [filteredData, currentQueryInfo, isRevenueFormat]);
    
    const topCustomerStackedData = useMemo(() => {
        if (selectedQuery !== REVENUE_BY_CUSTOMER_CODE && selectedQuery !== 'customer_revenue') return { data: [], divisions: [] };

        // Field mapping:
        // REVENUE_BY_CUSTOMER_CODE: division=value01, customer=value02, revenue=value03
        // customer_revenue: division=value02, customer=value03, revenue=value04
        const divisionField = selectedQuery === REVENUE_BY_CUSTOMER_CODE ? 'value01' : 'value02';
        const customerField = selectedQuery === REVENUE_BY_CUSTOMER_CODE ? 'value02' : 'value03';
        const revenueField = selectedQuery === REVENUE_BY_CUSTOMER_CODE ? 'value03' : 'value04';

        const customerDivisionSet = new Set(customerFilters.divisions);
        const dataForCustomers = filteredData.filter(item => item[divisionField] && customerDivisionSet.has(item[divisionField]));

        const customerAggregates: { [customer: string]: { totalRevenue: number; totalConsignments: number; divisions: { [division: string]: { revenue: number; consignments: number } } } } = {};
        const activeDivisions = new Set<string>();
        dataForCustomers.forEach(item => {
            const customer = item[customerField] || 'Unknown';
            const division = item[divisionField] || 'N/A';
            const revenue = parseFloat(String(item[revenueField])) || 0;
            const consignments = item.recordCount || 0;
            activeDivisions.add(division);
            if (!customerAggregates[customer]) customerAggregates[customer] = { totalRevenue: 0, totalConsignments: 0, divisions: {} };
            if (!customerAggregates[customer].divisions[division]) customerAggregates[customer].divisions[division] = { revenue: 0, consignments: 0 };
            customerAggregates[customer].totalRevenue += revenue;
            customerAggregates[customer].totalConsignments += consignments;
            customerAggregates[customer].divisions[division].revenue += revenue;
            customerAggregates[customer].divisions[division].consignments += consignments;
        });
        const divisionsArray = Array.from(activeDivisions).sort();
        let transformedData = Object.entries(customerAggregates).map(([customerName, data]) => {
            const customerEntry: any = { customerName, revenue: data.totalRevenue, consignments: data.totalConsignments };
            divisionsArray.forEach(div => {
                customerEntry[`${div}_revenue`] = data.divisions[div]?.revenue || 0;
                customerEntry[`${div}_consignments`] = data.divisions[div]?.consignments || 0;
            });
            return customerEntry;
        });
        transformedData.sort((a, b) => b[customerFilters.metric] - a[customerFilters.metric]);
        if (customerFilters.topN !== 9999) transformedData = transformedData.slice(0, customerFilters.topN);
        return { data: transformedData, divisions: divisionsArray };
    }, [filteredData, selectedQuery, customerFilters]);

    const divisionData = useMemo(() => {
        if (selectedQuery !== REVENUE_BY_CUSTOMER_CODE && selectedQuery !== 'total_revenue' && selectedQuery !== 'customer_revenue') return [];
        const byDivision: { [key: string]: { revenue: number, consignments: number } } = {};
        filteredData.forEach(item => {
            // Field mapping varies by query:
            // REVENUE_BY_CUSTOMER_CODE: division=value01, revenue=value03
            // total_revenue: division=value02, revenue=value03
            // customer_revenue: division=value02, revenue=value04
            const division = (selectedQuery === REVENUE_BY_CUSTOMER_CODE ? item.value01 : item.value02) || 'Unknown';
            const revenue = selectedQuery === 'customer_revenue' ? item.value04 : item.value03;

            if (!byDivision[division]) byDivision[division] = { revenue: 0, consignments: 0 };
            byDivision[division].consignments += item.recordCount;
            byDivision[division].revenue += parseFloat(String(revenue)) || 0;
        });
        return Object.entries(byDivision).map(([name, data]) => ({ name, ...data }));
    }, [filteredData, selectedQuery]);

    const correctionsByTypeData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'INVOICE CORRECTIONS (JI)') return [];
        const byType: { [key: string]: number } = {};
        filteredData.forEach(item => { byType[item.value01 || 'N/A'] = (byType[item.value01 || 'N/A'] || 0) + item.recordCount; });
        return Object.entries(byType).map(([name, value]) => ({ name, value }));
    }, [filteredData, currentQueryInfo]);

    const correctionsByCountryData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'INVOICE CORRECTIONS (JI)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if(item.Country) byCountry[item.Country] = (byCountry[item.Country] || 0) + item.recordCount; });
        return Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a, b) => b.records - a.records).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);

    const exceptionsByTypeData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'EXCEPTIONS (YH)') return [];
        const byType: { [key: string]: number } = {};
        filteredData.forEach(item => { byType[item.value01 || 'N/A'] = (byType[item.value01 || 'N/A'] || 0) + item.recordCount; });
        return Object.entries(byType).map(([name, value]) => ({ name, value }));
    }, [filteredData, currentQueryInfo]);

    const exceptionsByCountryData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'EXCEPTIONS (YH)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if(item.Country) byCountry[item.Country] = (byCountry[item.Country] || 0) + item.recordCount; });
        return Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a, b) => b.records - a.records).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);

    const ratecheckByCountryData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'RATECHECKS (YQ)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if(item.Country) byCountry[item.Country] = (byCountry[item.Country] || 0) + item.recordCount; });
        return Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a, b) => b.records - a.records).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);
    
    const finConsolidationByCountryData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'FINANCIAL CONSOLIDATION CFC') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if(item.Country) byCountry[item.Country] = (byCountry[item.Country] || 0) + item.recordCount; });
        return Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a, b) => b.records - a.records).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);

    const accountsCountData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'CUSTOMER ACCOUNTS (YN)') return null;

        const accountsByDivision: { [key: string]: number } = {};
        filteredData.forEach(item => {
            const division = item.value01 || 'N/A';
            accountsByDivision[division] = (accountsByDivision[division] || 0) + item.recordCount;
        });
        const divisionData = Object.entries(accountsByDivision).map(([name, value]) => ({ name, value }));

        const accountsByCountry: { [key: string]: number } = {};
        filteredData.forEach(item => {
            if (item.Country) {
                accountsByCountry[item.Country] = (accountsByCountry[item.Country] || 0) + item.recordCount;
            }
        });
        const topCountriesByAccounts = Object.entries(accountsByCountry)
            .map(([country, records]) => ({ country, records }))
            .sort((a, b) => b.records - a.records)
            .slice(0, topNCount);

        return { divisionData, topCountriesByAccounts };
    }, [filteredData, topNCount, currentQueryInfo]);

    const CustomCountryTooltip: React.FC<any> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const countryName = countryCodeMap[label] || label;
            return (
                <div className="p-2 bg-surface border border-secondary/20 rounded-md shadow-lg text-sm">
                    <p className="font-bold text-text-primary">{countryName}</p>
                    {payload.map((p: any) => ( <p key={p.dataKey} style={{ color: p.fill }}>{`${p.name}: ${p.value.toLocaleString()}`}</p> ))}
                </div>
            );
        }
        return null;
    };
    
    const FilterControls: React.FC<{
        topN?: number; onTopNChange?: (n: number) => void;
        metric?: 'revenue' | 'consignments'; onMetricChange?: (m: 'revenue' | 'consignments') => void;
        children?: React.ReactNode;
    }> = ({ topN, onTopNChange, metric, onMetricChange, children }) => (
        <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-secondary/20 text-xs">
            {onTopNChange && topN !== undefined && (
                 <div className="flex items-center bg-surface p-0.5 rounded-md">
                    <button onClick={() => onTopNChange(10)} className={`px-2 py-0.5 rounded ${topN === 10 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Top 10</button>
                    <button onClick={() => onTopNChange(20)} className={`px-2 py-0.5 rounded ${topN === 20 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Top 20</button>
                    <button onClick={() => onTopNChange(9999)} className={`px-2 py-0.5 rounded ${topN === 9999 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>All</button>
                </div>
            )}
            {onMetricChange && metric && (
                <>
                    {onTopNChange && <div className="h-4 border-l border-secondary/20"></div>}
                    <div className="flex items-center bg-surface p-0.5 rounded-md">
                        <button onClick={() => onMetricChange('revenue')} className={`px-2 py-0.5 rounded ${metric === 'revenue' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Revenue</button>
                        <button onClick={() => onMetricChange('consignments')} className={`px-2 py-0.5 rounded ${metric === 'consignments' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Consignments</button>
                    </div>
                </>
            )}
            {children}
        </div>
    );

    const renderChartsForQuery = () => {
        if (!currentQueryInfo) return null;
        const queryUpper = currentQueryInfo.name.toUpperCase();
        
        const TopNSelector = ({ title }: { title: string }) => (
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                 <div className="relative">
                    <select value={topNCount} onChange={(e) => setTopNCount(Number(e.target.value))} className="appearance-none bg-background border border-secondary/20 text-text-primary text-xs rounded-md focus:ring-accent focus:border-accent block py-1 pl-2 pr-7">
                        <option value={10}>Top 10</option> <option value={20}>Top 20</option> <option value={9999}>All</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary"><IconChevronDown className="w-3 h-3" /></div>
                </div>
            </div>
        );

        if (queryUpper === 'REVENUE BY CUSTOMER') {
            return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md lg:col-span-2">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">Monthly Trend of Top Customers</h3>
                             <FilterControls
                                topN={trendFilters.topN} onTopNChange={n => setTrendFilters(f => ({ ...f, topN: n }))}
                                metric={trendFilters.metric} onMetricChange={m => setTrendFilters(f => ({ ...f, metric: m }))}
                            >
                                <label className="flex items-center cursor-pointer text-text-secondary hover:text-text-primary px-2">
                                    <input type="checkbox" checked={predictTrend} onChange={e => setPredictTrend(e.target.checked)} className="mr-2 h-3 w-3 rounded text-accent focus:ring-accent" />
                                    Predict Trend
                                </label>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <label className="flex items-center cursor-pointer text-text-secondary hover:text-text-primary px-2">
                                    <input type="checkbox" checked={predictWaveTrend} onChange={e => setPredictWaveTrend(e.target.checked)} className="mr-2 h-3 w-3 rounded text-accent focus:ring-accent" />
                                    Wave-Based Prediction
                                </label>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <div className="relative" ref={trendDivisionDropdownRef}>
                                    <button onClick={() => setTrendDivisionDropdownOpen(o => !o)} className="flex items-center gap-1 p-1 text-text-secondary hover:text-text-primary">Divisions ({trendFilters.divisions.length}/{allDivisions.length}) <IconChevronDown className="w-3 h-3" /></button>
                                    {isTrendDivisionDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10 border border-secondary/20 max-h-60 overflow-y-auto">
                                            <div className='p-2'><button onClick={() => setTrendFilters(f=>({...f, divisions: allDivisions}))} className='text-xs hover:underline'>Select All</button> / <button onClick={() => setTrendFilters(f=>({...f, divisions: []}))} className='text-xs hover:underline'>Select None</button></div>
                                            {allDivisions.map(div => (
                                                <label key={div} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-secondary/30 flex items-center justify-between cursor-pointer">
                                                    <span>{div}</span>
                                                    <input type="checkbox" checked={trendFilters.divisions.includes(div)} onChange={() => handleTrendDivisionFilterChange(div)} className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent" />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </FilterControls>
                        </div>
                         <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={monthlyTrendData.data} margin={{ top: 5, right: 60, left: 60, bottom: 5 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="month" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                                <YAxis yAxisId="left" label={{ value: 'Consignments', angle: -90, position: 'insideLeft', fill: `rgb(${theme.colors['text-secondary']})` }} stroke={`rgb(${theme.colors['text-secondary']})`} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'Revenue', angle: 90, position: 'insideRight', fill: `rgb(${theme.colors['text-secondary']})` }} stroke={`rgb(${theme.colors['text-secondary']})`} tickFormatter={val => formatNumber(val, true)} />
                                <Tooltip content={<CustomTooltip context="customerTrend" divisionColorMap={divisionColorMap} />} />
                                <Legend />
                                {monthlyTrendData.divisions.map((div) => (
                                    <Bar key={div} yAxisId="left" dataKey={`${div}_consignments`} name={`${div}`} stackId="consignments" fill={divisionColorMap[div]} />
                                ))}
                                <Bar yAxisId="left" dataKey="predicted_consignments" name="Predicted Consignments" stackId="consignments" fill={`rgb(${theme.colors.accent})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.accent})`} strokeDasharray="3 3" />
                                <Bar yAxisId="left" dataKey="wave_predicted_consignments" name="Wave-Based Predicted Consignments" stackId="consignments" fill={`rgb(${theme.colors.warning})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.warning})`} strokeDasharray="3 3" />
                                 {monthlyTrendData.divisions.map((div) => (
                                    <Line key={div} yAxisId="right" type="monotone" dataKey={`${div}_revenue`} name={`${div} Revenue`} stroke={divisionColorMap[div]} />
                                ))}
                                <Line yAxisId="right" type="monotone" dataKey="predicted_revenue" name="Predicted Revenue" stroke={`rgb(${theme.colors.success})`} strokeDasharray="5 5" dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="wave_predicted_revenue" name="Wave-Based Predicted Revenue" stroke={`rgb(${theme.colors.warning})`} strokeDasharray="5 5" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                             <h3 className="text-lg font-semibold text-text-primary">Top Customers</h3>
                            <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-secondary/20 text-xs">
                                <div className="relative" ref={customerDivisionDropdownRef}>
                                    <button onClick={() => setCustomerDivisionDropdownOpen(o => !o)} className="flex items-center gap-1 p-1 text-text-secondary hover:text-text-primary">Divisions ({customerFilters.divisions.length}/{allDivisions.length}) <IconChevronDown className="w-3 h-3" /></button>
                                    {isCustomerDivisionDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10 border border-secondary/20 max-h-60 overflow-y-auto">
                                            <div className='p-2'><button onClick={() => setCustomerFilters(f=>({...f, divisions: allDivisions}))} className='text-xs hover:underline'>Select All</button> / <button onClick={() => setCustomerFilters(f=>({...f, divisions: []}))} className='text-xs hover:underline'>Select None</button></div>
                                            {allDivisions.map(div => (
                                                <label key={div} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-secondary/30 flex items-center justify-between cursor-pointer">
                                                    <span>{div}</span>
                                                    <input type="checkbox" checked={customerFilters.divisions.includes(div)} onChange={() => handleCustomerDivisionFilterChange(div)} className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent" />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <div className="flex items-center bg-surface p-0.5 rounded-md">
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, topN: 10 }))} className={`px-2 py-0.5 rounded ${customerFilters.topN === 10 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Top 10</button>
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, topN: 20 }))} className={`px-2 py-0.5 rounded ${customerFilters.topN === 20 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Top 20</button>
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, topN: 9999 }))} className={`px-2 py-0.5 rounded ${customerFilters.topN === 9999 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>All</button>
                                </div>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <div className="flex items-center bg-surface p-0.5 rounded-md">
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, metric: 'revenue' }))} className={`px-2 py-0.5 rounded ${customerFilters.metric === 'revenue' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Revenue</button>
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, metric: 'consignments' }))} className={`px-2 py-0.5 rounded ${customerFilters.metric === 'consignments' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Consignments</button>
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topCustomerStackedData.data} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={val => formatNumber(val, customerFilters.metric === 'revenue')} />
                                <YAxis type="category" dataKey="customerName" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} interval={0}/>
                                <Tooltip content={<CustomTooltip context="topCustomer" theme={theme} />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Legend />
                                {topCustomerStackedData.divisions.map((division) => ( <Bar key={division} dataKey={`${division}_${customerFilters.metric}`} stackId="a" name={division} fill={divisionColorMap[division]} /> ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">Split by Division</h3>
                             <FilterControls metric={divisionFilters.metric} onMetricChange={m => setDivisionFilters(f => ({...f, metric: m}))} />
                        </div>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={divisionData} dataKey={divisionFilters.metric} nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value.toLocaleString()}`}>
                                    {divisionData.map((entry) => ( <Cell key={`cell-${entry.name}`} fill={divisionColorMap[entry.name]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => divisionFilters.metric === 'revenue' ? `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (queryUpper === 'TOTAL REVENUE') {
            return (
                <>
                    <div className="bg-surface p-4 rounded-lg shadow-md mb-6">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">Total Revenue & Consignments Overview</h3>
                            <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-secondary/20 text-xs">
                                <label className="flex items-center cursor-pointer text-text-secondary hover:text-text-primary px-2">
                                    <input type="checkbox" checked={predictTrend} onChange={e => setPredictTrend(e.target.checked)} className="mr-2 h-3 w-3 rounded text-accent focus:ring-accent" />
                                    Predict Trend
                                </label>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <label className="flex items-center cursor-pointer text-text-secondary hover:text-text-primary px-2">
                                    <input type="checkbox" checked={predictWaveTrend} onChange={e => setPredictWaveTrend(e.target.checked)} className="mr-2 h-3 w-3 rounded text-accent focus:ring-accent" />
                                    Wave-Based Prediction
                                </label>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <label className="flex items-center cursor-pointer text-text-secondary hover:text-text-primary px-2">
                                    <input type="checkbox" checked={trendChartType === 'line'} onChange={e => setTrendChartType(e.target.checked ? 'line' : 'bar')} className="mr-2 h-3 w-3 rounded text-accent focus:ring-accent" />
                                    Line Chart
                                </label>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <button onClick={() => setSwapAxes(!swapAxes)} className="px-3 py-1 text-text-secondary hover:text-text-primary hover:bg-secondary/10 rounded transition-colors">
                                    Swap Axes
                                </button>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={monthlyTrendData.data} margin={{ top: 5, right: 80, left: 90, bottom: 5 }} barGap={0} barCategoryGap="10%">
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="month" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                                <YAxis yAxisId="left" label={{ value: swapAxes ? 'Consignments' : 'Revenue (€)', angle: -90, position: 'left', offset: 10, fill: `rgb(${theme.colors['text-secondary']})` }} stroke={swapAxes ? `rgb(${theme.colors['text-secondary']})` : `rgb(${theme.colors.success})`} tickFormatter={(value) => swapAxes ? formatNumber(value) : formatNumber(value, true)} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: swapAxes ? 'Revenue (€)' : 'Consignments', angle: 90, position: 'right', offset: 10, fill: `rgb(${theme.colors['text-secondary']})` }} stroke={swapAxes ? `rgb(${theme.colors.success})` : `rgb(${theme.colors['text-secondary']})`} tickFormatter={val => swapAxes ? formatNumber(val, true) : formatNumber(val)} />
                                <Tooltip formatter={(value: number, name: string) => {
                                    if (name.includes('Revenue') || name.includes('revenue') || name.includes('Predicted Revenue')) {
                                        return `€${typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}`;
                                    }
                                    return typeof value === 'number' ? value.toLocaleString() : value;
                                }} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} payload={swapAxes ? [
                                    { value: 'Consignments', type: trendChartType === 'bar' ? 'rect' : 'line', id: 'records', color: `rgb(${theme.colors.accent})` },
                                    { value: 'Revenue (€)', type: 'line', id: 'revenue', color: `rgb(${theme.colors.success})` }
                                ] : [
                                    { value: 'Revenue (€)', type: trendChartType === 'bar' ? 'rect' : 'line', id: 'revenue', color: `rgb(${theme.colors.success})` },
                                    { value: 'Consignments', type: 'line', id: 'records', color: `rgb(${theme.colors.accent})` }
                                ]} />
                                {swapAxes ? (
                                    <>
                                        {trendChartType === 'bar' ? (
                                            <Bar yAxisId="left" dataKey="records" name="Consignments" fill={`rgb(${theme.colors.accent})`} />
                                        ) : (
                                            <Line yAxisId="left" type="monotone" dataKey="records" name="Consignments" stroke={`rgb(${theme.colors.accent})`} strokeWidth={3} dot={{ r: 5 }} connectNulls={false} />
                                        )}
                                        <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (€)" stroke={`rgb(${theme.colors.success})`} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                                    </>
                                ) : (
                                    <>
                                        {trendChartType === 'bar' ? (
                                            <Bar yAxisId="left" dataKey="revenue" name="Revenue (€)" fill={`rgb(${theme.colors.success})`} />
                                        ) : (
                                            <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (€)" stroke={`rgb(${theme.colors.success})`} strokeWidth={3} dot={{ r: 5 }} connectNulls={false} />
                                        )}
                                        <Line yAxisId="right" type="monotone" dataKey="records" name="Consignments" stroke={`rgb(${theme.colors.accent})`} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                                    </>
                                )}
                                {predictTrend && (trendChartType === 'bar' ? (
                                    <Bar yAxisId="left" dataKey="prediction" name={swapAxes ? "Predicted Consignments" : "Predicted Revenue"} stackId="a" fill={`rgb(${theme.colors.accent})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.accent})`} strokeDasharray="3 3" />
                                ) : (
                                    <Line yAxisId="left" type="monotone" dataKey="prediction" name={swapAxes ? "Predicted Consignments" : "Predicted Revenue"} stroke={`rgb(${theme.colors.accent})`} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                                ))}
                                {predictWaveTrend && (trendChartType === 'bar' ? (
                                    <Bar yAxisId="left" dataKey="wave_prediction" name={swapAxes ? "Wave-Based Predicted Consignments" : "Wave-Based Predicted Revenue"} stackId="a" fill={`rgb(${theme.colors.warning})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.warning})`} strokeDasharray="3 3" />
                                ) : (
                                    <Line yAxisId="left" type="monotone" dataKey="wave_prediction" name={swapAxes ? "Wave-Based Predicted Consignments" : "Wave-Based Predicted Revenue"} stroke={`rgb(${theme.colors.warning})`} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                                ))}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Top Countries by Revenue & Consignments" />
                        <ResponsiveContainer width="100%" height={400}>
                            <ComposedChart data={topCountriesData} margin={{ left: 60, right: 60, bottom: 20, top: 5 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={16} textAnchor="middle" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <YAxis yAxisId="left" stroke={`rgb(${theme.colors.success})`} fontSize={12} tickFormatter={(value) => formatNumber(value, true)} label={{ value: 'Revenue (€)', angle: -90, position: 'insideLeft', style: { fill: `rgb(${theme.colors['text-secondary']})` } }} />
                                <YAxis yAxisId="right" orientation="right" stroke={`rgb(${theme.colors.info})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} label={{ value: 'Consignments', angle: 90, position: 'insideRight', style: { fill: `rgb(${theme.colors['text-secondary']})` } }} />
                                <Tooltip formatter={(value: number, name: string) => {
                                    if (name.includes('Revenue') || name.includes('€')) {
                                        return `€${typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}`;
                                    }
                                    return typeof value === 'number' ? value.toLocaleString() : value;
                                }} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="revenue" name="Revenue (€)" fill={`rgb(${theme.colors.success})`} />
                                <Bar yAxisId="right" dataKey="bookings" name="Consignments" fill={`rgb(${theme.colors.info})`} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">Split by Division</h3>
                            <FilterControls metric={divisionFilters.metric} onMetricChange={m => setDivisionFilters(f => ({...f, metric: m}))} />
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie data={divisionData} dataKey={divisionFilters.metric} nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name}: ${value.toLocaleString()}`}>
                                    {divisionData.map((entry) => ( <Cell key={`cell-${entry.name}`} fill={divisionColorMap[entry.name]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => divisionFilters.metric === 'revenue' ? `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                </>
            );
        }

        if (queryUpper === 'CUSTOMER REVENUE') {
            return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md lg:col-span-2">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">Monthly Trend of Top {trendFilters.topN === 9999 ? 'All' : trendFilters.topN} Customers</h3>
                            <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-secondary/20 text-xs">
                                <div className="flex items-center bg-surface p-0.5 rounded-md">
                                    <button onClick={() => setTrendFilters(f => ({ ...f, topN: 10 }))} className={`px-2 py-0.5 rounded text-xs ${trendFilters.topN === 10 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Top 10</button>
                                    <button onClick={() => setTrendFilters(f => ({ ...f, topN: 20 }))} className={`px-2 py-0.5 rounded text-xs ${trendFilters.topN === 20 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Top 20</button>
                                </div>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <label className="flex items-center cursor-pointer text-text-secondary hover:text-text-primary px-2">
                                    <input type="checkbox" checked={predictTrend} onChange={e => setPredictTrend(e.target.checked)} className="mr-2 h-3 w-3 rounded text-accent focus:ring-accent" />
                                    Predict Trend
                                </label>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <label className="flex items-center cursor-pointer text-text-secondary hover:text-text-primary px-2">
                                    <input type="checkbox" checked={predictWaveTrend} onChange={e => setPredictWaveTrend(e.target.checked)} className="mr-2 h-3 w-3 rounded text-accent focus:ring-accent" />
                                    Wave-Based Prediction
                                </label>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <button onClick={() => setSwapAxes(!swapAxes)} className="px-3 py-1 text-text-secondary hover:text-text-primary hover:bg-secondary/10 rounded transition-colors">
                                    Swap Axes
                                </button>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <label className="flex items-center cursor-pointer text-text-secondary hover:text-text-primary px-2">
                                    <input type="checkbox" checked={showDivisionColors} onChange={e => setShowDivisionColors(e.target.checked)} className="mr-2 h-3 w-3 rounded text-accent focus:ring-accent" />
                                    Division Colors
                                </label>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <div className="relative" ref={trendDivisionDropdownRef}>
                                    <button onClick={() => setTrendDivisionDropdownOpen(o => !o)} className="flex items-center gap-1 p-1 text-text-secondary hover:text-text-primary">Divisions ({trendFilters.divisions.length}/{allDivisions.length}) <IconChevronDown className="w-3 h-3" /></button>
                                    {isTrendDivisionDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10 border border-secondary/20 max-h-60 overflow-y-auto">
                                            <div className='p-2'><button onClick={() => setTrendFilters(f=>({...f, divisions: allDivisions}))} className='text-xs hover:underline'>Select All</button> / <button onClick={() => setTrendFilters(f=>({...f, divisions: []}))} className='text-xs hover:underline'>Select None</button></div>
                                            {allDivisions.map(div => (
                                                <label key={div} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-secondary/30 flex items-center justify-between cursor-pointer">
                                                    <span>{div}</span>
                                                    <input type="checkbox" checked={trendFilters.divisions.includes(div)} onChange={() => handleTrendDivisionFilterChange(div)} className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent" />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                         <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={monthlyTrendData.data} margin={{ top: 5, right: 80, left: 90, bottom: 5 }} barGap={0} barCategoryGap="10%">
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="month" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                                <YAxis yAxisId="left" label={{ value: swapAxes ? 'Consignments' : 'Revenue (€)', angle: -90, position: 'left', offset: 10, fill: `rgb(${theme.colors['text-secondary']})` }} stroke={swapAxes ? `rgb(${theme.colors['text-secondary']})` : `rgb(${theme.colors.success})`} tickFormatter={(value) => swapAxes ? formatNumber(value) : formatNumber(value, true)} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: swapAxes ? 'Revenue (€)' : 'Consignments', angle: 90, position: 'right', offset: 10, fill: `rgb(${theme.colors['text-secondary']})` }} stroke={swapAxes ? `rgb(${theme.colors.success})` : `rgb(${theme.colors['text-secondary']})`} tickFormatter={val => swapAxes ? formatNumber(val, true) : formatNumber(val)} />
                                <Tooltip content={<CustomTooltip context="customerTrend" divisionColorMap={divisionColorMap} />} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} payload={(() => {
                                    const legendItems = [];
                                    if (!showDivisionColors) {
                                        if (swapAxes) {
                                            legendItems.push({ value: 'Consignments', type: 'rect', id: 'consignments', color: `rgb(${theme.colors.accent})` });
                                            legendItems.push({ value: 'Revenue (€)', type: 'line', id: 'revenue', color: `rgb(${theme.colors.success})` });
                                        } else {
                                            legendItems.push({ value: 'Revenue (€)', type: 'rect', id: 'revenue', color: `rgb(${theme.colors.success})` });
                                            legendItems.push({ value: 'Consignments', type: 'line', id: 'consignments', color: `rgb(${theme.colors.accent})` });
                                        }
                                    }
                                    if (predictTrend) {
                                        legendItems.push({ value: swapAxes ? 'Predicted Consignments' : 'Predicted Revenue', type: 'rect', id: 'prediction', color: swapAxes ? `rgb(${theme.colors.accent})` : `rgb(${theme.colors.success})` });
                                    }
                                    if (predictWaveTrend) {
                                        legendItems.push({ value: swapAxes ? 'Wave-Based Predicted Consignments' : 'Wave-Based Predicted Revenue', type: 'rect', id: 'wave_prediction', color: `rgb(${theme.colors.warning})` });
                                    }
                                    return legendItems;
                                })()} />
                                {swapAxes ? (
                                    <>
                                        {showDivisionColors ? (
                                            monthlyTrendData.divisions.map((div) => (
                                                <Bar key={div} yAxisId="left" dataKey={`${div}_consignments`} name={`${div}`} stackId="consignments" fill={divisionColorMap[div]} />
                                            ))
                                        ) : (
                                            <Bar yAxisId="left" dataKey="total_consignments" name="Consignments" fill={`rgb(${theme.colors.accent})`} />
                                        )}
                                        {predictTrend && swapAxes && <Bar yAxisId="left" dataKey="predicted_consignments" name="Predicted Consignments" stackId="consignments" fill={`rgb(${theme.colors.accent})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.accent})`} strokeDasharray="3 3" />}
                                        {predictWaveTrend && swapAxes && <Bar yAxisId="left" dataKey="wave_predicted_consignments" name="Wave-Based Predicted Consignments" stackId="consignments" fill={`rgb(${theme.colors.warning})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.warning})`} strokeDasharray="3 3" />}
                                        {showDivisionColors ? (
                                            monthlyTrendData.divisions.map((div) => (
                                                <Line key={div} yAxisId="right" type="monotone" dataKey={`${div}_revenue`} name={`${div} Revenue`} stroke={divisionColorMap[div]} connectNulls={false} />
                                            ))
                                        ) : (
                                            <Line yAxisId="right" type="monotone" dataKey="total_revenue" name="Revenue (€)" stroke={`rgb(${theme.colors.success})`} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {showDivisionColors ? (
                                            monthlyTrendData.divisions.map((div) => (
                                                <Bar key={div} yAxisId="left" dataKey={`${div}_revenue`} name={`${div}`} stackId="revenue" fill={divisionColorMap[div]} />
                                            ))
                                        ) : (
                                            <Bar yAxisId="left" dataKey="total_revenue" name="Revenue (€)" fill={`rgb(${theme.colors.success})`} />
                                        )}
                                        {predictTrend && !swapAxes && <Bar yAxisId="left" dataKey="predicted_revenue" name="Predicted Revenue" stackId="revenue" fill={`rgb(${theme.colors.success})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.success})`} strokeDasharray="3 3" />}
                                        {predictWaveTrend && !swapAxes && <Bar yAxisId="left" dataKey="wave_predicted_revenue" name="Wave-Based Predicted Revenue" stackId="revenue" fill={`rgb(${theme.colors.warning})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.warning})`} strokeDasharray="3 3" />}
                                        {showDivisionColors ? (
                                            monthlyTrendData.divisions.map((div) => (
                                                <Line key={div} yAxisId="right" type="monotone" dataKey={`${div}_consignments`} name={`${div} Consignments`} stroke={divisionColorMap[div]} connectNulls={false} />
                                            ))
                                        ) : (
                                            <Line yAxisId="right" type="monotone" dataKey="total_consignments" name="Consignments" stroke={`rgb(${theme.colors.accent})`} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                                        )}
                                    </>
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                             <h3 className="text-lg font-semibold text-text-primary">Top Customers</h3>
                            <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-secondary/20 text-xs">
                                <div className="relative" ref={customerDivisionDropdownRef}>
                                    <button onClick={() => setCustomerDivisionDropdownOpen(o => !o)} className="flex items-center gap-1 p-1 text-text-secondary hover:text-text-primary">Divisions ({customerFilters.divisions.length}/{allDivisions.length}) <IconChevronDown className="w-3 h-3" /></button>
                                    {isCustomerDivisionDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10 border border-secondary/20 max-h-60 overflow-y-auto">
                                            <div className='p-2'><button onClick={() => setCustomerFilters(f=>({...f, divisions: allDivisions}))} className='text-xs hover:underline'>Select All</button> / <button onClick={() => setCustomerFilters(f=>({...f, divisions: []}))} className='text-xs hover:underline'>Select None</button></div>
                                            {allDivisions.map(div => (
                                                <label key={div} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-secondary/30 flex items-center justify-between cursor-pointer">
                                                    <span>{div}</span>
                                                    <input type="checkbox" checked={customerFilters.divisions.includes(div)} onChange={() => handleCustomerDivisionFilterChange(div)} className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent" />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <div className="flex items-center bg-surface p-0.5 rounded-md">
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, topN: 10 }))} className={`px-2 py-0.5 rounded ${customerFilters.topN === 10 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Top 10</button>
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, topN: 20 }))} className={`px-2 py-0.5 rounded ${customerFilters.topN === 20 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Top 20</button>
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, topN: 9999 }))} className={`px-2 py-0.5 rounded ${customerFilters.topN === 9999 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>All</button>
                                </div>
                                <div className="h-4 border-l border-secondary/20"></div>
                                <div className="flex items-center bg-surface p-0.5 rounded-md">
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, metric: 'revenue' }))} className={`px-2 py-0.5 rounded ${customerFilters.metric === 'revenue' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Revenue</button>
                                    <button onClick={() => setCustomerFilters(f => ({ ...f, metric: 'consignments' }))} className={`px-2 py-0.5 rounded ${customerFilters.metric === 'consignments' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Consignments</button>
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topCustomerStackedData.data} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={val => formatNumber(val, customerFilters.metric === 'revenue')} />
                                <YAxis type="category" dataKey="customerName" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} interval={0}/>
                                <Tooltip content={<CustomTooltip context="topCustomer" theme={theme} />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Legend />
                                {topCustomerStackedData.divisions.map((division) => ( <Bar key={division} dataKey={`${division}_${customerFilters.metric}`} stackId="a" name={division} fill={divisionColorMap[division]} /> ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">Split by Division</h3>
                             <FilterControls metric={divisionFilters.metric} onMetricChange={m => setDivisionFilters(f => ({...f, metric: m}))} />
                        </div>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={divisionData} dataKey={divisionFilters.metric} nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value.toLocaleString()}`}>
                                    {divisionData.map((entry) => ( <Cell key={`cell-${entry.name}`} fill={divisionColorMap[entry.name]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => divisionFilters.metric === 'revenue' ? `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        switch (queryUpper) {
            case 'BOOKINGS (JK)': return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Top Countries by Bookings" />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topCountriesData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} interval={0} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="bookings" fill={`rgb(${theme.colors.accent})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h3 className="text-lg font-semibold">Bookings by Type</h3>
                            {availableBookingTypes.length > 0 && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsBookingTypeDropdownOpen(!isBookingTypeDropdownOpen)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-background text-text-secondary border border-secondary/20 rounded-md hover:bg-secondary/10 text-xs"
                                    >
                                        <IconFilter className="w-3 h-3" />
                                        <span>{selectedBookingTypes.length === 0 ? 'All Types' : `${selectedBookingTypes.length} Selected`}</span>
                                        <IconChevronDown className={`w-3 h-3 transition-transform ${isBookingTypeDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isBookingTypeDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-surface border border-secondary/20 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                                            <div className="p-2 border-b border-secondary/20 flex gap-2">
                                                <button
                                                    onClick={() => setSelectedBookingTypes(availableBookingTypes)}
                                                    className="flex-1 text-xs px-2 py-1 bg-background hover:bg-secondary/10 rounded"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    onClick={() => setSelectedBookingTypes([])}
                                                    className="flex-1 text-xs px-2 py-1 bg-background hover:bg-secondary/10 rounded"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            <div className="p-2">
                                                {availableBookingTypes.map(type => (
                                                    <label
                                                        key={type}
                                                        className="flex items-center p-2 hover:bg-secondary/10 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedBookingTypes.includes(type)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedBookingTypes([...selectedBookingTypes, type]);
                                                                } else {
                                                                    setSelectedBookingTypes(selectedBookingTypes.filter(t => t !== type));
                                                                }
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent"
                                                        />
                                                        <span className="ml-2 text-sm text-text-primary">{type}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={bookingTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => value.toLocaleString()}>
                                    {bookingTypeData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
            case 'TRACK & TRACE CONSIGNMENTS (YLA)': return (
                <>
                    {/* Loading Indicator */}
                    {(loadingState.phase !== 'complete' || loadingState.currentlyLoading === 'track_trace_con_yla') && (
                        <div className="bg-surface p-8 rounded-lg shadow-md mb-6 border border-secondary/20">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
                                <p className="text-text-secondary">Loading data... This may take a moment for large datasets (1.5M+ rows)</p>
                                {loadingState.currentlyLoading && (
                                    <p className="text-sm text-text-secondary">Currently loading: {loadingState.currentlyLoading}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Charts Grid */}
                    {/* First Row: Ops Source Distribution + placeholder for new viz */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Ops Source Code Distribution (Code - Description) */}
                        <div className="bg-surface p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h3 className="text-lg font-semibold">Ops Source Code Distribution</h3>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={opsSourceTopN}
                                        onChange={(e) => setOpsSourceTopN(Number(e.target.value))}
                                        className="px-2 py-1 text-sm bg-background border border-secondary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
                                    >
                                        <option value={10}>Top 10</option>
                                        <option value={20}>Top 20</option>
                                        <option value={9999}>Show All</option>
                                    </select>
                                    <label className="flex items-center gap-2 cursor-pointer bg-background px-3 py-2 rounded-md border border-secondary/20">
                                        <span className="text-xs text-text-secondary">Exclude FX</span>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={includeOpsSourceFX}
                                                onChange={(e) => setIncludeOpsSourceFX(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-secondary/30 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                                        </div>
                                        <span className="text-xs text-text-secondary">Include FX</span>
                                    </label>
                                    {availableOpsSourceCodes.length > 0 && (
                                        <div className="relative" ref={opsSourceDropdownRef}>
                                            <button
                                                onClick={() => setIsOpsSourceDropdownOpen(!isOpsSourceDropdownOpen)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-background border border-secondary/20 hover:bg-secondary/30"
                                            >
                                                <IconFilter />
                                                Ops Codes {selectedOpsSourceCodes.length > 0 && `(${selectedOpsSourceCodes.length})`}
                                                <IconChevronDown className={`transform transition-transform ${isOpsSourceDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpsSourceDropdownOpen && (
                                                <div className="absolute right-0 mt-2 w-64 bg-surface border border-secondary/20 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                                                    <div className="p-2 border-b border-secondary/20">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setSelectedOpsSourceCodes(availableOpsSourceCodes)}
                                                                className="flex-1 px-2 py-1 text-xs bg-accent/20 hover:bg-accent/30 rounded"
                                                            >
                                                                Select All
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedOpsSourceCodes([])}
                                                                className="flex-1 px-2 py-1 text-xs bg-secondary/20 hover:bg-secondary/30 rounded"
                                                            >
                                                                Clear
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-2">
                                                        {availableOpsSourceCodes.map(code => (
                                                            <label key={code} className="flex items-center gap-2 px-2 py-1 hover:bg-secondary/20 rounded cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedOpsSourceCodes.includes(code)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedOpsSourceCodes([...selectedOpsSourceCodes, code]);
                                                                        } else {
                                                                            setSelectedOpsSourceCodes(selectedOpsSourceCodes.filter(c => c !== code));
                                                                        }
                                                                    }}
                                                                    className="rounded"
                                                                />
                                                                <span className="text-sm">{code}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie data={opsSourceCodeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ value }) => value.toLocaleString()}>
                                        {opsSourceCodeData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} /> ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Visualization 1: Monthly Trend - Stacked Area Chart */}
                        <div className="bg-surface p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4">Volume Trend by OpsSource</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={monthlyTrendStackedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                    <XAxis
                                        dataKey="month"
                                        stroke={`rgb(${theme.colors['text-secondary']})`}
                                        fontSize={10}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis
                                        stroke={`rgb(${theme.colors['text-secondary']})`}
                                        fontSize={12}
                                        tickFormatter={(value) => formatNumber(value)}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => value.toLocaleString()}
                                        contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    {monthlyTrendStackedData.length > 0 && Object.keys(monthlyTrendStackedData[0])
                                        .filter(key => key !== 'month')
                                        .map((source, index) => (
                                            <Area
                                                key={source}
                                                type="monotone"
                                                dataKey={source}
                                                stackId="1"
                                                stroke={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]}
                                                fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]}
                                                fillOpacity={0.6}
                                            />
                                        ))
                                    }
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Second Row: Top Customers and Top Countries */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Customers */}
                        <div className="bg-surface p-4 rounded-lg shadow-md">
                            <TopNSelector title="Top Customers" />
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={topCustomersData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                    <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                    <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                    <YAxis
                                        type="category"
                                        dataKey="customer"
                                        stroke={`rgb(${theme.colors['text-secondary']})`}
                                        fontSize={9}
                                        width={120}
                                        tick={({ x, y, payload }: any) => {
                                            const maxLength = 18;
                                            const text = payload.value;
                                            const truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
                                            return (
                                                <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={9}>
                                                    {truncated}
                                                </text>
                                            );
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => value.toLocaleString()}
                                        cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }}
                                        contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}
                                    />
                                    <Bar dataKey="records" fill={`rgb(${theme.colors.warning})`} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Countries */}
                        <div className="bg-surface p-4 rounded-lg shadow-md">
                            <TopNSelector title="Top Countries" />
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={topCountriesData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                    <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                    <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                    <YAxis
                                        type="category"
                                        dataKey="country"
                                        stroke={`rgb(${theme.colors['text-secondary']})`}
                                        fontSize={10}
                                        width={100}
                                        interval={0}
                                        tick={({ x, y, payload }: any) => (
                                            <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}>
                                                {countryCodeMap[payload.value] || payload.value}
                                            </text>
                                        )}
                                    />
                                    <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                    <Bar dataKey="records" fill={`rgb(${theme.colors.info})`} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Additional Visualizations Row 1: Combo Chart and Heatmap */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Visualization 2: Volume + Customers - Combo Chart */}
                        <div className="bg-surface p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4">Volume & Customer Growth</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <ComposedChart data={volumeCustomersComboData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                    <XAxis
                                        dataKey="month"
                                        stroke={`rgb(${theme.colors['text-secondary']})`}
                                        fontSize={10}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        stroke={`rgb(${theme.colors['text-secondary']})`}
                                        fontSize={12}
                                        tickFormatter={(value) => formatNumber(value)}
                                        label={{ value: 'Records', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke={`rgb(${theme.colors['text-secondary']})`}
                                        fontSize={12}
                                        label={{ value: 'Customers', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => value.toLocaleString()}
                                        contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar yAxisId="left" dataKey="records" fill={`rgb(${theme.colors.accent})`} name="Records" />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="customers"
                                        stroke={`rgb(${theme.colors.success})`}
                                        strokeWidth={2}
                                        name="Unique Customers"
                                        dot={{ r: 4 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Visualization 3: Country-Month Heatmap */}
                        <div className="bg-surface p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4">Country Activity Heatmap</h3>
                            <div className="overflow-x-auto">
                                <div style={{ minWidth: '600px', height: '350px', overflowY: 'auto' }}>
                                    {countryMonthHeatmapData.length > 0 && (
                                        <table className="w-full text-xs border-collapse">
                                            <thead className="sticky top-0 bg-surface">
                                                <tr>
                                                    <th className="border border-secondary/20 p-1 text-left bg-surface/95">Country</th>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                                                        <th key={month} className="border border-secondary/20 p-1 text-center bg-surface/95">
                                                            {new Date(2000, month - 1).toLocaleString('default', { month: 'short' })}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {countryMonthHeatmapData.map((row, rowIndex) => {
                                                    const maxVal = Math.max(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => row[`m${m}`] || 0));
                                                    return (
                                                        <tr key={rowIndex}>
                                                            <td className="border border-secondary/20 p-1 font-semibold">
                                                                {countryCodeMap[row.country] || row.country}
                                                            </td>
                                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                                                const value = row[`m${month}`] || 0;
                                                                const intensity = maxVal > 0 ? value / maxVal : 0;
                                                                const bgColor = `rgba(${theme.colors.info}, ${intensity * 0.8 + 0.1})`;
                                                                return (
                                                                    <td
                                                                        key={month}
                                                                        className="border border-secondary/20 p-1 text-center"
                                                                        style={{ backgroundColor: bgColor }}
                                                                        title={`${countryCodeMap[row.country] || row.country} - ${new Date(2000, month - 1).toLocaleString('default', { month: 'short' })}: ${value.toLocaleString()}`}
                                                                    >
                                                                        {value > 0 ? formatNumber(value) : '—'}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Visualizations Row 2: Treemap */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Visualization 4: OpsSource Treemap */}
                        <div className="bg-surface p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4">OpsSource Distribution (Top 3 Customers per Source)</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <Treemap
                                    data={opsSourceTreemapData}
                                    dataKey="value"
                                    stroke="#fff"
                                    fill={`rgb(${theme.colors.info})`}
                                    content={({ x, y, width, height, index, name, value, depth }: any) => {
                                        if (!name) return null;
                                        const colors = theme.colors['chart-categorical'];
                                        const color = depth === 1 ? colors[index % colors.length] : colors[(index + 3) % colors.length];
                                        const textColor = depth === 1 ? '#fff' : '#000';
                                        const fontSize = depth === 1 ? 14 : 11;
                                        const padding = 4;

                                        return (
                                            <g>
                                                <rect
                                                    x={x}
                                                    y={y}
                                                    width={width}
                                                    height={height}
                                                    style={{
                                                        fill: color,
                                                        stroke: '#fff',
                                                        strokeWidth: 2,
                                                        opacity: depth === 1 ? 0.9 : 0.7
                                                    }}
                                                />
                                                {width > 50 && height > 30 && (
                                                    <>
                                                        <text
                                                            x={x + width / 2}
                                                            y={y + height / 2 - (value ? 8 : 0)}
                                                            textAnchor="middle"
                                                            fill={textColor}
                                                            fontSize={fontSize}
                                                            fontWeight={depth === 1 ? 'bold' : 'normal'}
                                                        >
                                                            {name.length > 20 ? name.substring(0, 18) + '...' : name}
                                                        </text>
                                                        {value && (
                                                            <text
                                                                x={x + width / 2}
                                                                y={y + height / 2 + 12}
                                                                textAnchor="middle"
                                                                fill={textColor}
                                                                fontSize={fontSize - 2}
                                                            >
                                                                {value.toLocaleString()}
                                                            </text>
                                                        )}
                                                    </>
                                                )}
                                            </g>
                                        );
                                    }}
                                >
                                    <Tooltip
                                        formatter={(value: number) => value.toLocaleString()}
                                        contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}
                                    />
                                </Treemap>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            );
            case 'TRACK & TRACE CONSIGNMENTS (YLB)': return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Top Origin Countries" />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={transitCountryData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} interval={0} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="records" fill={`rgb(${theme.colors.info})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Ops Source Code Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={opsSourceCodeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => value.toLocaleString()}>
                                    {opsSourceCodeData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
            case 'INVOICED CONSIGNMENTS (YI)': return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md lg:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Monthly Trend by Division</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={divisionMonthlyTrendData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="month" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                                <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}} />
                                <Legend />
                                {divisionMonthlyTrendData.divisions.map((division, index) => (
                                    <Area key={division} type="monotone" dataKey={division} stackId="1" stroke={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} fillOpacity={0.6} />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Top Countries by Invoiced Consignments" />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={invoicedByCountryData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} interval={0} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="consignments" fill={`rgb(${theme.colors.accent})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Division by Billing Type</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={divisionByBillingTypeData.data} margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="division" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                                <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}} />
                                <Legend />
                                {divisionByBillingTypeData.billingTypes.map((billingType, index) => (
                                    <Bar key={billingType} dataKey={billingType} stackId="a" fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Top 10 Products by Billing Type</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={productByBillingTypeData.data} layout="horizontal" margin={{ left: 20, right: 30, top: 5, bottom: 20 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="product" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} angle={-45} textAnchor="end" height={80} />
                                <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}} />
                                <Legend />
                                {productByBillingTypeData.billingTypes.map((billingType, index) => (
                                    <Bar key={billingType} dataKey={billingType} stackId="a" fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Consignments by Division</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={invoicedByDivisionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => value.toLocaleString()}>
                                    {invoicedByDivisionData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Top 15 Country-Billing Type Combinations</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={countryByBillingTypeData} layout="vertical" margin={{ left: 80, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey={(item: any) => `${countryCodeMap[item.country] || item.country} - ${item.billingType}`} stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={9} width={150} />
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}} />
                                <Bar dataKey="records" fill={`rgb(${theme.colors.info})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Top Products" />
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={billingByProductData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => value.toLocaleString()}>
                                    {billingByProductData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Top Billing Types" />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={billingByBillingTypeData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="name" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} />
                                <Tooltip formatter={(value: number) => value.toLocaleString()} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Bar dataKey="records" fill={`rgb(${theme.colors.accent})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
            case 'INVOICE CORRECTIONS (JI)': return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Corrections by Type</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={correctionsByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => value.toLocaleString()}>
                                    {correctionsByTypeData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Corrections by Country" />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={correctionsByCountryData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="records" fill={`rgb(${theme.colors.danger})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            );
            case 'EXCEPTIONS (YH)': return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Exceptions by Type (Ops Source Code)</h3>
                            <label className="flex items-center gap-2 cursor-pointer bg-background px-3 py-2 rounded-md border border-secondary/20">
                                <span className="text-xs text-text-secondary">Exclude FX</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={includeOpsSourceFX}
                                        onChange={(e) => setIncludeOpsSourceFX(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-secondary/30 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                                </div>
                                <span className="text-xs text-text-secondary">Include FX</span>
                            </label>
                        </div>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={exceptionsByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => value.toLocaleString()}>
                                    {exceptionsByTypeData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Exceptions by Country" />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={exceptionsByCountryData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="records" fill={`rgb(${theme.colors.warning})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            );
            case 'RATECHECKS (YQ)': return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Ratechecks by Country" />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={ratecheckByCountryData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="records" fill={`rgb(${theme.colors.info})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            );
            case 'FINANCIAL CONSOLIDATION CFC': return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Financial Consolidation by Country" />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={finConsolidationByCountryData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="records" fill={`rgb(${theme.colors.success})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            );
            case 'CUSTOMER ACCOUNTS (YN)': return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                         <h3 className="text-lg font-semibold mb-4">Accounts by Division</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={accountsCountData?.divisionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => value.toLocaleString()}>
                                    {accountsCountData?.divisionData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                         <TopNSelector title="Accounts by Country" />
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={accountsCountData?.topCountriesByAccounts} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="records" fill={`rgb(${theme.colors.accent})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    // Skeleton screen for loading states
    const LoadingSkeleton = ({ phase, progress }: { phase: string, progress: number }) => (
        <div className="flex flex-col h-screen bg-background">
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-2xl px-6">
                    {/* Animated skeleton boxes */}
                    <div className="mb-8 space-y-4">
                        <div className="h-8 bg-surface animate-pulse rounded-md w-3/4 mx-auto"></div>
                        <div className="h-4 bg-surface animate-pulse rounded-md w-1/2 mx-auto"></div>
                    </div>

                    {/* Loading message */}
                    {phase === 'initializing_db' && (
                        <div className="mb-6">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                            <p className="text-xl font-semibold text-text-primary mb-2">
                                Initializing Database...
                            </p>
                            <p className="text-text-secondary">
                                Loading DuckDB and preparing data files
                            </p>
                        </div>
                    )}

                    {phase === 'loading_priority' && (
                        <div className="mb-6">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                            <p className="text-xl font-semibold text-text-primary mb-2">
                                Loading Primary Dataset...
                            </p>
                            <p className="text-text-secondary">
                                Bookings (JK) - Preparing your dashboard
                            </p>
                        </div>
                    )}

                    {/* Chart skeleton placeholders */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="h-32 bg-surface animate-pulse rounded-lg"></div>
                        <div className="h-32 bg-surface animate-pulse rounded-lg"></div>
                    </div>
                    <div className="h-64 bg-surface animate-pulse rounded-lg mb-6"></div>

                    {/* Progress bar */}
                    <div className="w-full bg-secondary/20 rounded-full h-3 mb-2">
                        <div
                            className="bg-primary h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-text-secondary">{progress}% complete</p>
                </div>
            </div>
        </div>
    );

    // Show skeleton during initial loading phases (until Query 1 loads)
    if ((loadingState.phase === 'initializing_db' || loadingState.phase === 'loading_priority')
        && loadingState.loadedQueries.length === 0) {
        return <LoadingSkeleton phase={loadingState.phase} progress={loadingState.progress} />;
    }

    // Show error screen only if Query 1 failed
    if (error && loadingState.loadedQueries.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Failed to Load</h1>
                    <p className="text-text-secondary mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Background Loading Banner */}
            {loadingState.phase === 'loading_background' && (
                <div className="bg-info/10 border-b border-info/20 px-4 py-3">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-info"></div>
                            <span className="text-sm text-text-primary">
                                Loading additional datasets ({loadingState.loadedQueries.length}/{QUERIES.length})...
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-32 bg-secondary/20 rounded-full h-2">
                                <div
                                    className="bg-info h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${loadingState.progress}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-text-secondary">{loadingState.progress}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Banner */}
            {loadingState.phase === 'complete' && loadingState.failedQueries.length === 0 && showSuccessBanner && (
                <div className="bg-success/10 border-b border-success/20 px-4 py-2 transition-opacity duration-500">
                    <p className="text-sm text-center text-text-primary">
                        All {QUERIES.length} datasets loaded successfully
                    </p>
                </div>
            )}

            {/* Warning Banner for Failed Queries */}
            {loadingState.failedQueries.length > 0 && (
                <div className="bg-warning/10 border-b border-warning/20 px-4 py-3">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-sm text-text-primary">
                            {loadingState.failedQueries.length} dataset(s) failed to load: {loadingState.failedQueries.join(', ')}
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar with Filters */}
                <div className="bg-surface border-b border-secondary/20 p-4 sticky top-0 z-10">
                    <div className="mb-4">
                        <h1 className="text-xl font-semibold text-text-primary">Migration Dashboard</h1>
                        <p className="text-xs text-text-secondary">Mainframe Data Analysis</p>
                    </div>

                    {/* Filter Panel Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Query Selector - Select Dropdown */}
                        <div className="md:col-span-5">
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                Select Query
                            </label>
                            <select
                                value={selectedQuery}
                                onChange={e => setSelectedQuery(e.target.value)}
                                className="w-full bg-background border-2 border-primary/50 focus:border-accent rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none transition-colors cursor-pointer"
                            >
                                {availableQueries.map(q => {
                                    const recordCount = allData[q.code]?.length || 0;
                                    return (
                                        <option key={q.code} value={q.code}>
                                            {q.icon} {q.nr}. {q.name} ({recordCount.toLocaleString()} records)
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                Date Range
                            </label>
                            <div className="flex items-center gap-2 bg-background border border-secondary/20 rounded-md p-2">
                                <IconCalendar className="w-4 h-4 text-text-secondary" />
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={e => setDateRange(r => ({...r, start: e.target.value}))}
                                    className="bg-transparent text-xs text-text-primary focus:outline-none border-none flex-1"
                                />
                                <span className="text-text-secondary">-</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={e => setDateRange(r => ({...r, end: e.target.value}))}
                                    className="bg-transparent text-xs text-text-primary focus:outline-none border-none flex-1"
                                />
                            </div>
                        </div>

                        {/* Filters Button */}
                        <div className="md:col-span-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                style={{ backgroundColor: showFilters ? `rgb(${theme.colors.accent})` : undefined }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    showFilters
                                        ? 'text-white shadow-lg'
                                        : 'bg-background text-text-secondary hover:bg-secondary/20 border border-secondary/20'
                                }`}
                            >
                                <IconFilter className="w-4 h-4" />
                                Country Filters ({selectedCountries.length !== allCountriesInData.length ? `${selectedCountries.length} active` : 'All'})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 p-4 sm:p-6">
                    {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>}

             {showFilters && (
                <div className="bg-surface p-4 rounded-lg mb-6 shadow-md border border-secondary/20">
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4 flex-1">
                             <h3 className="font-medium">Country Filter</h3>
                             <input type="text" placeholder="Search countries..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} className="bg-background border border-secondary/20 rounded-md px-3 py-1 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-accent"/>
                             {countrySearch && <button onClick={handleSelectDisplayed} className="text-xs text-accent hover:underline">Select Displayed</button>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedCountries(allCountriesInData)} className="text-xs text-text-secondary hover:text-text-primary hover:underline">Select All</button>
                            <button onClick={() => setSelectedCountries([])} className="text-xs text-text-secondary hover:text-text-primary hover:underline">Deselect All</button>
                             <button onClick={resetFilters} className="text-xs text-text-secondary hover:text-text-primary hover:underline ml-4">Reset All Filters</button>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {Object.entries(groupedCountries).map(([region, countries]) => {
                            const filteredCountries = countrySearch
                                ? countries.filter(c =>
                                    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                    c.code.toLowerCase().includes(countrySearch.toLowerCase())
                                  )
                                : countries;

                            if (countrySearch && filteredCountries.length === 0) return null;

                            const displayCountries = filteredCountries;
                            const regionStatus = regionSelectionStatus[region];
                            const isExpanded = effectiveExpandedRegions[region];
                            const regionCountryCodes = displayCountries.map(c => c.code);
                            const selectedInRegion = displayCountries.filter(c => selectedCountries.includes(c.code)).length;
                            const totalInRegion = displayCountries.length;

                            return (
                                <div key={region} className="border border-secondary/20 rounded-md overflow-hidden">
                                    <div
                                        className="bg-secondary/10 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/20 transition-colors"
                                        onClick={() => toggleRegion(region)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={regionStatus === 'all'}
                                            ref={input => { if (input) input.indeterminate = regionStatus === 'partial' }}
                                            onChange={(e) => { e.stopPropagation(); handleRegionToggle(regionCountryCodes); }}
                                            className="h-5 w-5 rounded border-gray-500 text-accent focus:ring-accent flex-shrink-0"
                                        />
                                        <div className="flex-1 flex items-center gap-2">
                                            <span className="font-semibold text-base text-text-primary">{region}</span>
                                            <span className="text-sm text-text-secondary">
                                                ({totalInRegion} {totalInRegion === 1 ? 'country' : 'countries'})
                                            </span>
                                            {selectedInRegion > 0 && (
                                                <span className="text-sm font-medium" style={{ color: `rgb(${theme.colors.accent})` }}>
                                                    — {selectedInRegion} selected
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                if (regionStatus === 'all') {
                                                    handleClearRegion(regionCountryCodes, e);
                                                } else {
                                                    handleSelectRegion(regionCountryCodes, e);
                                                }
                                            }}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                                                regionStatus === 'all'
                                                    ? 'bg-secondary/30 hover:bg-secondary/40 text-text-primary border border-secondary/40'
                                                    : 'text-white hover:opacity-90 border border-transparent'
                                            }`}
                                            style={
                                                regionStatus === 'all'
                                                    ? {}
                                                    : { backgroundColor: `rgb(${theme.colors.accent})` }
                                            }
                                        >
                                            {regionStatus === 'all' ? 'Clear Region' : 'Select Region'}
                                        </button>
                                        <IconChevronDown
                                            className={`w-5 h-5 transition-transform flex-shrink-0 text-text-secondary ${
                                                isExpanded ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </div>
                                    {isExpanded && (
                                        <div className="p-4 bg-background">
                                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                {displayCountries.map(c => {
                                                    const highlight = getHighlightedCountryText(c.name, c.code, countrySearch);

                                                    return (
                                                        <label
                                                            key={c.code}
                                                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                                            style={{ minWidth: '200px', maxWidth: '280px' }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCountries.includes(c.code)}
                                                                onChange={() => handleCountryFilterChange(c.code)}
                                                                className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent flex-shrink-0"
                                                            />
                                                            <span
                                                                className={`text-sm truncate ${
                                                                    highlight.isMatch && countrySearch ? 'font-semibold' : ''
                                                                }`}
                                                                style={{
                                                                    color: highlight.isMatch && countrySearch
                                                                        ? `rgb(${theme.colors.accent})`
                                                                        : `rgb(${theme.colors['text-secondary']})`
                                                                }}
                                                                title={`${c.name} (${c.code})`}
                                                            >
                                                                {c.name} ({c.code})
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                     </div>
                </div>
             )}

            {/* Query 2a (YLA) Filters - Above the trend */}
            {selectedQuery === 'track_trace_con_yla' && (
                <div className="bg-surface p-4 rounded-lg mb-6 shadow-md border border-secondary/20">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h3 className="font-medium">Filters</h3>

                        {/* Country Filter - Inline */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium whitespace-nowrap">Country:</label>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-background border border-secondary/20 hover:bg-secondary/30 whitespace-nowrap"
                            >
                                <IconFilter className="w-3 h-3" />
                                <span>{selectedCountries.length !== allCountriesInData.length ? `${selectedCountries.length} selected` : 'All'}</span>
                                <IconChevronDown className={`w-3 h-3 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Source Description Filter - Inline */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium whitespace-nowrap">Source:</label>
                            {availableSourceDescriptions.length > 0 && (
                                <div className="relative" ref={sourceDescDropdownRef}>
                                    <button
                                        onClick={() => setIsSourceDescDropdownOpen(!isSourceDescDropdownOpen)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-background border border-secondary/20 hover:bg-secondary/30 whitespace-nowrap"
                                    >
                                        <IconFilter className="w-3 h-3" />
                                        <span>{selectedSourceDescriptions.length > 0 ? `${selectedSourceDescriptions.length} selected` : 'All'}</span>
                                        <IconChevronDown className={`w-3 h-3 transform transition-transform ${isSourceDescDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isSourceDescDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-surface border border-secondary/20 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                            <div className="p-2 border-b border-secondary/20">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSelectedSourceDescriptions(availableSourceDescriptions.map(item => item.code))}
                                                        className="flex-1 px-2 py-1 text-xs bg-accent/20 hover:bg-accent/30 rounded"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedSourceDescriptions([])}
                                                        className="flex-1 px-2 py-1 text-xs bg-secondary/20 hover:bg-secondary/30 rounded"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                {availableSourceDescriptions.map(item => (
                                                    <label key={item.code} className="flex items-center gap-2 px-2 py-1 hover:bg-secondary/20 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSourceDescriptions.includes(item.code)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedSourceDescriptions([...selectedSourceDescriptions, item.code]);
                                                                } else {
                                                                    setSelectedSourceDescriptions(selectedSourceDescriptions.filter(d => d !== item.code));
                                                                }
                                                            }}
                                                            className="rounded"
                                                        />
                                                        <span className="text-sm">{item.code} - {item.description}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Customer Name Filter - Inline */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium whitespace-nowrap">Customer:</label>
                            <div className="relative" ref={customerDropdownRef}>
                                <input
                                    type="text"
                                    placeholder="Type min 3 chars..."
                                    value={customerSearchText}
                                    onChange={(e) => {
                                        setCustomerSearchText(e.target.value);
                                        if (e.target.value.length >= 3) {
                                            setIsCustomerDropdownOpen(true);
                                        } else {
                                            setIsCustomerDropdownOpen(false);
                                        }
                                    }}
                                    onFocus={() => customerSearchText.length >= 3 && setIsCustomerDropdownOpen(true)}
                                    className="w-48 bg-background border border-secondary/20 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                                />
                                {isCustomerDropdownOpen && customerSearchResults.length > 0 && customerSearchText.length >= 3 && (
                                    <div className="absolute z-50 mt-1 w-64 bg-surface border border-secondary/20 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        <div className="p-2 border-b border-secondary/20 flex gap-2 sticky top-0 bg-surface">
                                            <button
                                                onClick={() => {
                                                    setSelectedCustomerNames([...new Set([...selectedCustomerNames, ...customerSearchResults])]);
                                                }}
                                                className="flex-1 px-2 py-1 text-xs bg-accent/20 hover:bg-accent/30 rounded"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedCustomerNames(selectedCustomerNames.filter(c => !customerSearchResults.includes(c)));
                                                }}
                                                className="flex-1 px-2 py-1 text-xs bg-secondary/20 hover:bg-secondary/30 rounded"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        {customerSearchResults.map(customer => (
                                            <label key={customer} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/20 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCustomerNames.includes(customer)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCustomerNames([...selectedCustomerNames, customer]);
                                                        } else {
                                                            setSelectedCustomerNames(selectedCustomerNames.filter(c => c !== customer));
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="text-sm">{customer}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedCustomerNames.length > 0 && (
                                <span className="text-xs text-text-secondary">({selectedCustomerNames.length})</span>
                            )}
                            {selectedCustomerNames.length > 0 && (
                                <button
                                    onClick={() => setSelectedCustomerNames([])}
                                    className="text-xs text-accent hover:underline"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                onClick={() => setIsCustomerModalOpen(true)}
                                className="px-3 py-1.5 text-sm bg-background border border-secondary/20 rounded-md hover:bg-secondary/30 font-bold"
                                title="Advanced customer selection"
                            >
                                ...
                            </button>
                        </div>

                        {/* KPI Metrics - Inline on right */}
                        <div className="flex items-center gap-4 text-sm ml-auto">
                            <div className="flex items-center gap-2">
                                <span className="text-text-secondary">Records:</span>
                                <span className="font-semibold" style={{ color: `rgb(${theme.colors.accent})` }}>
                                    {kpiData.totalRecords.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-text-secondary">Countries:</span>
                                <span className="font-semibold" style={{ color: `rgb(${theme.colors.info})` }}>
                                    {kpiData.uniqueCountries}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-text-secondary">Customers:</span>
                                <span className="font-semibold" style={{ color: `rgb(${theme.colors.success})` }}>
                                    {kpiData.uniqueCustomers.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedQuery !== REVENUE_BY_CUSTOMER_CODE && selectedQuery !== 'total_revenue' && selectedQuery !== 'customer_revenue' && (
                <div className="bg-surface p-4 rounded-lg shadow-md mb-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">
                            Transaction Volume Trend
                        </h3>
                        <div className="flex items-center gap-4">
                            {!isRevenueFormat && (
                                <div className="flex items-center bg-background p-1 rounded-lg border border-secondary/20 text-xs">
                                    <button onClick={() => setTrendChartType('bar')} className={`px-3 py-1 rounded ${trendChartType === 'bar' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Bar</button>
                                    <button onClick={() => setTrendChartType('line')} className={`px-3 py-1 rounded ${trendChartType === 'line' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Line</button>
                                </div>
                            )}
                            <label className="flex items-center cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                                <input type="checkbox" checked={predictTrend} onChange={e => setPredictTrend(e.target.checked)} className="mr-2 rounded text-accent focus:ring-accent" />
                                Predict Trend
                            </label>
                            <label className="flex items-center cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                                <input type="checkbox" checked={predictWaveTrend} onChange={e => setPredictWaveTrend(e.target.checked)} className="mr-2 rounded text-accent focus:ring-accent" />
                                Wave-Based Prediction
                            </label>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={450}>
                        <ComposedChart data={monthlyTrendData.data} margin={{ top: 5, right: 60, left: 80, bottom: 5 }}>
                            <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                            <XAxis dataKey="month" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                            {isRevenueFormat ? (
                                <>
                                    <YAxis yAxisId="left" stroke={`rgb(${theme.colors.success})`} fontSize={12} tickFormatter={(value) => formatNumber(value, true)} label={{ value: 'Revenue (€)', angle: -90, position: 'insideLeft', style: { fill: `rgb(${theme.colors['text-secondary']})` } }} />
                                    <YAxis yAxisId="right" orientation="right" stroke={`rgb(${theme.colors.accent})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} label={{ value: 'Consignments', angle: 90, position: 'insideRight', style: { fill: `rgb(${theme.colors['text-secondary']})` } }} />
                                </>
                            ) : (
                                <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                            )}
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                            <Legend />
                            {isRevenueFormat ? (
                                <>
                                    <Bar yAxisId="left" dataKey="revenue" name="Revenue (€)" fill={`rgb(${theme.colors.success})`} />
                                    <Line yAxisId="right" type="monotone" dataKey="records" name="Consignments" stroke={`rgb(${theme.colors.accent})`} strokeWidth={2} dot={{ r: 4 }} />
                                    {monthlyTrendData.data.some(d => d.prediction !== null) && (
                                        <Line yAxisId="right" type="monotone" dataKey="prediction" name="Predicted Consignments" stroke={`rgb(${theme.colors.accent})`} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                    )}
                                    {monthlyTrendData.data.some(d => d.wave_prediction !== null && d.wave_prediction !== undefined) && (
                                        <Line yAxisId="right" type="monotone" dataKey="wave_prediction" name="Wave-Based Predicted Consignments" stroke={`rgb(${theme.colors.warning})`} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                    )}
                                </>
                            ) : (
                                <>
                                    {trendChartType === 'bar' ? (
                                        <>
                                            <Bar dataKey="records" name="Records" fill={`rgb(${theme.colors.accent})`} />
                                            {monthlyTrendData.data.some(d => d.prediction !== null) && (
                                                <Bar dataKey="prediction" name="Predicted Records" fill={`rgb(${theme.colors.accent})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.accent})`} strokeDasharray="3 3" />
                                            )}
                                            {monthlyTrendData.data.some(d => d.wave_prediction !== null && d.wave_prediction !== undefined) && (
                                                <Bar dataKey="wave_prediction" name="Wave-Based Predicted Records" fill={`rgb(${theme.colors.warning})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.warning})`} strokeDasharray="3 3" />
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Line type="monotone" dataKey="records" name="Records" stroke={`rgb(${theme.colors.accent})`} strokeWidth={2} dot={{ r: 3 }} />
                                            {monthlyTrendData.data.some(d => d.prediction !== null) && (
                                                <Line type="monotone" dataKey="prediction" name="Predicted Records" stroke={`rgb(${theme.colors.accent})`} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                            )}
                                            {monthlyTrendData.data.some(d => d.wave_prediction !== null && d.wave_prediction !== undefined) && (
                                                <Line type="monotone" dataKey="wave_prediction" name="Wave-Based Predicted Records" stroke={`rgb(${theme.colors.warning})`} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

                    {renderChartsForQuery()}
                </div>
            </div>

            {/* Customer Selection Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setIsCustomerModalOpen(false)}>
                    <div className="bg-surface p-4 sm:p-6 rounded-lg shadow-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col border border-secondary/20" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 className="text-lg font-semibold">Select Customers</h3>
                            <button onClick={() => setIsCustomerModalOpen(false)} className="text-text-secondary hover:text-text-primary text-2xl leading-none">✕</button>
                        </div>

                        {/* Loading indicator for customer list */}
                        {allAvailableCustomers.length === 0 && loadingState.phase !== 'complete' ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-20">
                                <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
                                <p className="text-text-secondary">Loading customer list... (150k+ customers)</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 flex-1 overflow-hidden" style={{minHeight: 0}}>
                                {/* Available Customers - Left Side */}
                                <div className="flex flex-col border border-secondary/20 rounded-md overflow-hidden">
                                    <div className="p-3 border-b border-secondary/20 bg-background flex-shrink-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-medium">Available Customers</h4>
                                            <span className="text-xs text-text-secondary">
                                                ({allAvailableCustomers.filter(c => !modalSelectedCustomers.includes(c) && (modalCustomerSearch ? c.toLowerCase().includes(modalCustomerSearch.toLowerCase()) : true)).length})
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search customers..."
                                            value={modalCustomerSearch}
                                            onChange={(e) => setModalCustomerSearch(e.target.value)}
                                            className="w-full bg-surface border border-secondary/20 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        {allAvailableCustomers.filter(c => !modalSelectedCustomers.includes(c)).filter(c => modalCustomerSearch ? c.toLowerCase().includes(modalCustomerSearch.toLowerCase()) : true).length > 1000 && (
                                            <div className="absolute top-0 left-0 right-0 bg-warning/10 border-b border-warning/30 p-2 z-10">
                                                <p className="text-xs text-warning">Large list ({allAvailableCustomers.filter(c => !modalSelectedCustomers.includes(c)).length.toLocaleString()} customers) - use search to filter</p>
                                            </div>
                                        )}
                                        <select
                                            multiple
                                            value={modalAvailableSelected}
                                            onChange={(e) => {
                                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                setModalAvailableSelected(selected);
                                            }}
                                            className="w-full h-full bg-background border-0 text-sm focus:outline-none p-2 overflow-y-auto"
                                            style={{minHeight: 0}}
                                        >
                                            {allAvailableCustomers
                                                .filter(c => !modalSelectedCustomers.includes(c))
                                                .filter(c => modalCustomerSearch ? c.toLowerCase().includes(modalCustomerSearch.toLowerCase()) : true)
                                                .map(customer => (
                                                    <option key={customer} value={customer} className="py-1 px-2">
                                                        {customer}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                            {/* Move Buttons - Center */}
                            <div className="flex flex-col justify-center gap-2">
                                <button
                                    onClick={() => {
                                        const filtered = allAvailableCustomers.filter(c =>
                                            !modalSelectedCustomers.includes(c) &&
                                            (modalCustomerSearch ? c.toLowerCase().includes(modalCustomerSearch.toLowerCase()) : true)
                                        );
                                        setModalSelectedCustomers([...modalSelectedCustomers, ...filtered]);
                                        setModalAvailableSelected([]);
                                    }}
                                    className="px-3 py-2 bg-accent text-white rounded hover:bg-accent/80 text-sm"
                                    title="Move all to selected"
                                >
                                    &gt;&gt;
                                </button>
                                <button
                                    onClick={() => {
                                        setModalSelectedCustomers([...modalSelectedCustomers, ...modalAvailableSelected]);
                                        setModalAvailableSelected([]);
                                    }}
                                    disabled={modalAvailableSelected.length === 0}
                                    className="px-3 py-2 bg-accent/70 text-white rounded hover:bg-accent/80 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move selected to right"
                                >
                                    &gt;
                                </button>
                                <button
                                    onClick={() => {
                                        setModalSelectedCustomers(modalSelectedCustomers.filter(c => !modalRightSelected.includes(c)));
                                        setModalRightSelected([]);
                                    }}
                                    disabled={modalRightSelected.length === 0}
                                    className="px-3 py-2 bg-secondary/50 rounded hover:bg-secondary/70 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move selected to left"
                                >
                                    &lt;
                                </button>
                                <button
                                    onClick={() => {
                                        setModalSelectedCustomers([]);
                                        setModalRightSelected([]);
                                    }}
                                    className="px-3 py-2 bg-secondary/30 rounded hover:bg-secondary/50 text-sm"
                                    title="Move all to available"
                                >
                                    &lt;&lt;
                                </button>
                            </div>

                            {/* Selected Customers - Right Side */}
                            <div className="flex flex-col border border-secondary/20 rounded-md overflow-hidden">
                                <div className="p-3 border-b border-secondary/20 bg-background flex-shrink-0">
                                    <h4 className="text-sm font-medium">Selected Customers ({modalSelectedCustomers.length})</h4>
                                </div>
                                <select
                                    multiple
                                    value={modalRightSelected}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                        setModalRightSelected(selected);
                                    }}
                                    className="flex-1 w-full bg-background border-0 text-sm focus:outline-none p-2 overflow-y-auto"
                                    style={{minHeight: 0}}
                                >
                                    {modalSelectedCustomers.map(customer => (
                                        <option key={customer} value={customer} className="py-1 px-2">
                                            {customer}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        )}

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-3 mt-4 flex-shrink-0 border-t border-secondary/20 pt-4">
                            <button
                                onClick={() => {
                                    setIsCustomerModalOpen(false);
                                    setModalCustomerSearch('');
                                }}
                                className="px-4 py-2 bg-secondary/30 rounded hover:bg-secondary/50 text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedCustomerNames(modalSelectedCustomers);
                                    setIsCustomerModalOpen(false);
                                    setModalCustomerSearch('');
                                }}
                                className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 text-sm sm:text-base"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MigrationDashboard;
