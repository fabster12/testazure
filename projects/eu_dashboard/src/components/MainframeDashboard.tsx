
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts';
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

    const allDivisions = useMemo(() => {
        const revenueData = allData[REVENUE_BY_CUSTOMER_CODE] || [];
        return Array.from(new Set(revenueData.map(d => d.value01 || 'N/A'))).sort();
    }, [allData]);

    useEffect(() => {
        setTrendFilters(f => ({ ...f, divisions: allDivisions }));
        setCustomerFilters(f => ({ ...f, divisions: allDivisions }));
    }, [allDivisions]);
    
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
    
    useEffect(() => {
        if (countrySearch) {
            const newExpanded: Record<string, boolean> = {};
            Object.entries(groupedCountries).forEach(([region, countries]) => {
                if (countries.some(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase()))) {
                    newExpanded[region] = true;
                }
            });
            setExpandedRegions(newExpanded);
        }
    }, [countrySearch, groupedCountries]);

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

    const toggleRegion = (region: string) => setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
    const handleCountryFilterChange = (country: string) => setSelectedCountries(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);
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
                if (item.queryName && item.queryName.toUpperCase() === 'TRACK & TRACE - GLCON') {
                    if ((item.value01 && countrySet.has(item.value01)) || (item.value02 && countrySet.has(item.value02)) || (item.value03 && countrySet.has(item.value03))) return true;
                }
                return false;
            });
        }
        return data;
    }, [allData, selectedQuery, dateRange, selectedCountries, allCountriesInData]);
    
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
        if (selectedQuery === REVENUE_BY_CUSTOMER_CODE) {
            const divisionSet = new Set(trendFilters.divisions);
            const divisionFiltered = filteredData.filter(item => item.value01 && divisionSet.has(item.value01));
            const customerTotals: { [name: string]: { revenue: number, consignments: number } } = {};
            divisionFiltered.forEach(d => {
                const customer = d.value02 || 'Unknown';
                if (!customerTotals[customer]) customerTotals[customer] = { revenue: 0, consignments: 0 };
                customerTotals[customer].revenue += parseFloat(String(d.value03)) || 0;
                customerTotals[customer].consignments += d.recordCount || 0;
            });
            const sortedCustomers = Object.keys(customerTotals).sort((a, b) => customerTotals[b][trendFilters.metric] - customerTotals[a][trendFilters.metric]);
            const topCustomers = new Set(trendFilters.topN === 9999 ? sortedCustomers : sortedCustomers.slice(0, trendFilters.topN));
            const topCustomersData = divisionFiltered.filter(item => item.value02 && topCustomers.has(item.value02));
            const trend: { [month: string]: any } = {};
            const activeDivisions = [...new Set(topCustomersData.map(d => d.value01 || 'Unknown'))].sort();
            topCustomersData.forEach(item => {
                const month = `${item.year}-${String(item.month).padStart(2, '0')}`;
                if (!trend[month]) {
                    trend[month] = { month };
                    activeDivisions.forEach(div => {
                        trend[month][`${div}_revenue`] = 0;
                        trend[month][`${div}_consignments`] = 0;
                    });
                }
                const division = item.value01 || 'Unknown';
                trend[month][`${division}_revenue`] += parseFloat(String(item.value03)) || 0;
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

                 const lastDateParts = finalData[finalData.length - 1].month.split('-');
                 let currentDate = new Date(parseInt(lastDateParts[0]), parseInt(lastDateParts[1]) - 1);
                 const migrationStartDate = new Date(2026, 0, 1);
                 const migrationEndDate = new Date(2028, 11, 1);

                 while (currentDate < migrationStartDate) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    if (currentDate >= migrationStartDate) break;
                    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                    if (!finalData.some(d => d.month === monthKey)) {
                         finalData.push({ 
                             month: monthKey, 
                             predicted_consignments: Math.round(avgCons), 
                             predicted_revenue: avgRev 
                         });
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

                        finalData.push({ 
                            month: monthKey, 
                            predicted_consignments: predCons, 
                            predicted_revenue: predRev 
                        });
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
                        finalData[existingIndex].wave_predicted_consignments = wavePredCons;
                        finalData[existingIndex].wave_predicted_revenue = wavePredRev;
                    } else {
                        finalData.push({
                            month: monthKey,
                            wave_predicted_consignments: wavePredCons,
                            wave_predicted_revenue: wavePredRev
                        });
                    }
                }
            }

            return { data: finalData, divisions: activeDivisions };
        }

        const isBillingQuery = currentQueryInfo?.name.toUpperCase().includes('INVOICED CONSIGNMENTS (YI)');
        const trend: { [key: string]: { records: number, revenue?: number } } = {};
        filteredData.forEach(item => {
            const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
            if (!trend[key]) {
                trend[key] = { records: 0 };
                if (isBillingQuery && isRevenueFormat) trend[key].revenue = 0;
            }
            trend[key].records += item.recordCount;
            if (isBillingQuery && isRevenueFormat && trend[key].revenue !== undefined && item.value02) (trend[key].revenue as number) += parseFloat(String(item.value02));
        });
        const actualTrendData = Object.entries(trend).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month));
        
        if (!predictTrend || actualTrendData.length === 0) {
            return { data: actualTrendData.map(d => ({ ...d, prediction: null })), divisions: [] };
        }
        
        const combinedData: { month: string, records: number | null, revenue?: number | null, prediction: number | null }[] = actualTrendData.map(d => ({ ...d, prediction: null }));
        
        const lastThreeMonths = actualTrendData.slice(-3);
        const averageRecords = lastThreeMonths.length > 0 ? lastThreeMonths.reduce((sum, item) => sum + item.records, 0) / lastThreeMonths.length : 0;
        
        const lastDateParts = actualTrendData[actualTrendData.length - 1].month.split('-');
        let currentDate = new Date(parseInt(lastDateParts[0]), parseInt(lastDateParts[1]) - 1);
        
        const migrationStartDate = new Date(2026, 0, 1);
        const migrationEndDate = new Date(2028, 11, 1);
        
        const lastPoint = combinedData[combinedData.length - 1];
        lastPoint.prediction = lastPoint.records;

        while (currentDate < migrationStartDate) {
            currentDate.setMonth(currentDate.getMonth() + 1);
            if (currentDate >= migrationStartDate) break;
            const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            combinedData.push({ month: monthKey, records: null, revenue: null, prediction: Math.round(averageRecords) });
        }

        const predictionStartValue = combinedData[combinedData.length - 1].prediction || averageRecords;
        let predictionCurrentDate = new Date(currentDate);
        if (predictionCurrentDate < migrationStartDate) {
            predictionCurrentDate = new Date(migrationStartDate);
            const startMonthKey = `${predictionCurrentDate.getFullYear()}-${String(predictionCurrentDate.getMonth() + 1).padStart(2, '0')}`;
            if (!combinedData.some(d => d.month === startMonthKey)) {
                 combinedData.push({ month: startMonthKey, records: null, revenue: null, prediction: predictionStartValue });
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
                let predictedValue = Math.round(idealPredictedValue + randomDeviation);

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

                combinedData.push({ month: monthKey, records: null, revenue: null, prediction: predictedValue });
            }
        }

        // Add wave-based prediction for general queries
        if (predictWaveTrend && actualTrendData.length > 0) {
            const lastThreeMonths = actualTrendData.slice(-3);
            const averageRecords = lastThreeMonths.length > 0 ? lastThreeMonths.reduce((sum, item) => sum + item.records, 0) / lastThreeMonths.length : 0;
            console.log(`[Wave Prediction] Baseline (avg of last 3 months): ${averageRecords.toFixed(2)}`);

            const lastDateParts = actualTrendData[actualTrendData.length - 1].month.split('-');
            let currentDate = new Date(parseInt(lastDateParts[0]), parseInt(lastDateParts[1]) - 1);
            const migrationEndDate = new Date(2028, 11, 1);

            // Fill in months until migration end with wave-based prediction
            while (currentDate < migrationEndDate) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

                // Auto-detect metric type: use CONS_PCT for consignment queries, REV_PCT for revenue queries
                const metricType = (isBillingQuery && isRevenueFormat) ? 'REV_PCT' : 'CONS_PCT';
                const waveImpact = calculateWaveImpact(monthKey, metricType);

                // Apply wave impact as reduction
                const reductionFactor = 1 - (waveImpact / 100);
                const wavePrediction = Math.max(0, Math.round(averageRecords * reductionFactor));

                if (waveImpact > 0) {
                    console.log(`[Wave Prediction] ${monthKey}: Impact=${waveImpact.toFixed(2)}%, ReductionFactor=${reductionFactor.toFixed(2)}, Baseline=${averageRecords.toFixed(2)}, Predicted=${wavePrediction}`);
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
        if (currentQueryInfo?.name.toUpperCase() !== 'BOOKINGS (JK)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => {
            const country = item.Country?.trim();
            if(country && countryCodeMap[country]) {
                byCountry[country] = (byCountry[country] || 0) + item.recordCount;
            }
        });
        return Object.entries(byCountry).map(([country, bookings]) => ({ country, bookings })).sort((a, b) => b.bookings - a.bookings).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo, countryCodeMap]);

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
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YL)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if (item.value02) byCountry[item.value02] = (byCountry[item.value02] || 0) + item.recordCount; });
        return Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a,b) => b.records - a.records).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);

    const topDestinationCountriesData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YL)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if (item.value03) byCountry[item.value03] = (byCountry[item.value03] || 0) + item.recordCount; });
        return Object.entries(byCountry).map(([country, records]) => ({ country, records })).sort((a,b) => b.records - a.records).slice(0, topNCount);
    }, [filteredData, topNCount, currentQueryInfo]);
    
    const transitCountryData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YL)') return [];
        const byCountry: { [key: string]: number } = {};
        filteredData.forEach(item => { if (item.value01) byCountry[item.value01] = (byCountry[item.value01] || 0) + item.recordCount; });
        const sortedData = Object.entries(byCountry).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        if (sortedData.length > 10) {
            const topData = sortedData.slice(0, 9);
            const otherValue = sortedData.slice(9).reduce((acc, curr) => acc + curr.value, 0);
            return [...topData, { name: 'Others', value: otherValue }];
        }
        return sortedData;
    }, [filteredData, currentQueryInfo]);

    const opsSourceCodeData = useMemo(() => {
        if (currentQueryInfo?.name.toUpperCase() !== 'TRACK & TRACE CONSIGNMENTS (YL)') return [];
        const byCode: { [key: string]: number } = {};
        filteredData.forEach(item => { byCode[item.value04 || 'N/A'] = (byCode[item.value04 || 'N/A'] || 0) + item.recordCount; });
        return Object.entries(byCode).map(([name, value]) => ({ name, value }));
    }, [filteredData, currentQueryInfo]);

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
        if (selectedQuery !== REVENUE_BY_CUSTOMER_CODE) return { data: [], divisions: [] };
        
        const customerDivisionSet = new Set(customerFilters.divisions);
        const dataForCustomers = filteredData.filter(item => item.value01 && customerDivisionSet.has(item.value01));

        const customerAggregates: { [customer: string]: { totalRevenue: number; totalConsignments: number; divisions: { [division: string]: { revenue: number; consignments: number } } } } = {};
        const activeDivisions = new Set<string>();
        dataForCustomers.forEach(item => {
            const customer = item.value02 || 'Unknown';
            const division = item.value01 || 'N/A';
            const revenue = parseFloat(String(item.value03)) || 0;
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
        if (selectedQuery !== REVENUE_BY_CUSTOMER_CODE) return [];
        const byDivision: { [key: string]: { revenue: number, consignments: number } } = {};
        filteredData.forEach(item => {
            const division = item.value01 || 'Unknown';
            if (!byDivision[division]) byDivision[division] = { revenue: 0, consignments: 0 };
            byDivision[division].consignments += item.recordCount;
            byDivision[division].revenue += parseFloat(String(item.value03)) || 0;
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
                        <h3 className="text-lg font-semibold mb-4">Bookings by Type</h3>
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
            case 'TRACK & TRACE CONSIGNMENTS (YL)': return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Top Origin Countries" />
                        <ResponsiveContainer width="100%" height={300}>
                             <BarChart data={topOriginCountriesData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="records" fill={`rgb(${theme.colors.info})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface p-4 rounded-lg shadow-md">
                        <TopNSelector title="Top Destination Countries" />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topDestinationCountriesData} layout="vertical" margin={{ left: 30, right: 40 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <YAxis type="category" dataKey="country" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} tick={({ x, y, payload }: any) => ( <text x={x} y={y} dy={4} textAnchor="end" fill={`rgb(${theme.colors['text-secondary']})`} fontSize={10}> {countryCodeMap[payload.value] || payload.value} </text> )}/>
                                <Tooltip content={<CustomCountryTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="records" fill={`rgb(${theme.colors.success})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Transit Countries</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={transitCountryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${countryCodeMap[name] || name} ${(percent * 100).toFixed(0)}%`}>
                                    {transitCountryData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} /> ))}
                                </Pie>
                                <Tooltip content={<CustomCountryTooltip />} />
                                <Legend />
                            </PieChart>
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
            case 'Invoiced Consignments (YI)': return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <h3 className="text-lg font-semibold mb-4">Exceptions by Type</h3>
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
        <div className="flex flex-col h-screen bg-background">
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
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar with Filters */}
                <div className="bg-surface border-b border-secondary/20 p-4">
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
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-60 overflow-y-auto">
                        {Object.entries(groupedCountries).map(([region, countries]) => {
                            const filteredCountries = countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase()));
                            if (countrySearch && filteredCountries.length === 0) return null;
                            const displayCountries = countrySearch ? filteredCountries : countries;
                            
                            const allSelected = displayCountries.every(c => selectedCountries.includes(c.code));
                            const someSelected = displayCountries.some(c => selectedCountries.includes(c.code));

                            return (
                                <div key={region} className="border border-secondary/20 rounded-md overflow-hidden">
                                     <div className="bg-secondary/10 px-3 py-2 flex justify-between items-center cursor-pointer" onClick={() => toggleRegion(region)}>
                                        <span className="font-medium text-sm">{region} ({displayCountries.length})</span>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={allSelected} ref={input => { if(input) input.indeterminate = someSelected && !allSelected }} onChange={(e) => { e.stopPropagation(); handleRegionToggle(displayCountries.map(c => c.code))}} className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent" />
                                            <IconChevronDown className={`w-4 h-4 transition-transform ${expandedRegions[region] ? 'rotate-180' : ''}`} />
                                        </div>
                                     </div>
                                     {expandedRegions[region] && (
                                        <div className="p-2 bg-background">
                                            {displayCountries.map(c => (
                                                <label key={c.code} className="flex items-center p-1 hover:bg-secondary/10 rounded cursor-pointer">
                                                    <input type="checkbox" checked={selectedCountries.includes(c.code)} onChange={() => handleCountryFilterChange(c.code)} className="h-3 w-3 rounded border-gray-500 text-accent focus:ring-accent" />
                                                    <span className="ml-2 text-xs text-text-secondary truncate" title={c.name}>{c.name} ({c.code})</span>
                                                </label>
                                            ))}
                                        </div>
                                     )}
                                </div>
                            );
                        })}
                     </div>
                </div>
             )}

            {selectedQuery !== REVENUE_BY_CUSTOMER_CODE && (
                <div className="bg-surface p-4 rounded-lg shadow-md mb-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">
                            Transaction Volume Trend
                        </h3>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center bg-background p-1 rounded-lg border border-secondary/20 text-xs">
                                <button onClick={() => setTrendChartType('bar')} className={`px-3 py-1 rounded ${trendChartType === 'bar' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Bar</button>
                                <button onClick={() => setTrendChartType('line')} className={`px-3 py-1 rounded ${trendChartType === 'line' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}>Line</button>
                            </div>
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
                    <ResponsiveContainer width="100%" height={300}>
                        {trendChartType === 'bar' ? (
                            <BarChart data={monthlyTrendData.data} margin={{ top: 5, right: 60, left: 80, bottom: 5 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="month" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                                <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Legend />
                                <Bar dataKey="records" name="Records" fill={`rgb(${theme.colors.accent})`} />
                                {monthlyTrendData.data.some(d => d.prediction !== null) && (
                                    <Bar dataKey="prediction" name="Predicted Records" fill={`rgb(${theme.colors.accent})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.accent})`} strokeDasharray="3 3" />
                                )}
                                {monthlyTrendData.data.some(d => d.wave_prediction !== null && d.wave_prediction !== undefined) && (
                                    <Bar dataKey="wave_prediction" name="Wave-Based Predicted Records" fill={`rgb(${theme.colors.warning})`} fillOpacity={0.3} stroke={`rgb(${theme.colors.warning})`} strokeDasharray="3 3" />
                                )}
                                {isRevenueFormat && <Bar dataKey="revenue" name="Revenue" fill={`rgb(${theme.colors.success})`} />}
                            </BarChart>
                        ) : (
                             <ComposedChart data={monthlyTrendData.data} margin={{ top: 5, right: 60, left: 80, bottom: 5 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="month" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                                <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="records" name="Records" stroke={`rgb(${theme.colors.accent})`} strokeWidth={2} dot={{ r: 3 }} />
                                 {monthlyTrendData.data.some(d => d.prediction !== null) && (
                                    <Line type="monotone" dataKey="prediction" name="Predicted Records" stroke={`rgb(${theme.colors.accent})`} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                )}
                                {monthlyTrendData.data.some(d => d.wave_prediction !== null && d.wave_prediction !== undefined) && (
                                    <Line type="monotone" dataKey="wave_prediction" name="Wave-Based Predicted Records" stroke={`rgb(${theme.colors.warning})`} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                )}
                                {isRevenueFormat && <Line type="monotone" dataKey="revenue" name="Revenue" stroke={`rgb(${theme.colors.success})`} strokeWidth={2} dot={{ r: 3 }} />}
                            </ComposedChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )}

                    {renderChartsForQuery()}
                </div>
            </div>
        </div>
    );
};

export default MigrationDashboard;
