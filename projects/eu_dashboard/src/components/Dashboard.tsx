
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { europeanDashboardData } from '../constants';
import { IconCalendar, IconChart, IconChevronDown, IconEuro, IconFilter, IconPackage, IconTrendingDown, IconTrendingUp, IconUsers } from './icons';
import { useTheme } from '../contexts/ThemeContext';
import { ShipmentData } from '../types';
import RevenueMapChart from './RevenueMapChart';

type ViewType = 'operational' | 'financial';

const KpiCard: React.FC<{ 
    title: string; 
    value: string; 
    change: number; 
    icon: React.ReactNode;
    formatAsCurrency?: boolean;
}> = ({ title, value, change, icon, formatAsCurrency = false }) => {
    const isPositive = change >= 0;
    const changeColor = isPositive ? 'text-success' : 'text-danger';
    
    return (
        <div className="bg-surface p-4 rounded-lg shadow-md flex items-start justify-between">
            <div>
                <p className="text-sm text-text-secondary">{title}</p>
                <p className="text-3xl font-bold text-text-primary">{formatAsCurrency && !value.startsWith('NaN') ? `€${value}` : value}</p>
                 <div className="flex items-center text-xs mt-1">
                    <span className={changeColor}>{isFinite(change) ? change.toFixed(1) : '0.0'}%</span>
                    {isPositive ? <IconTrendingUp className={`ml-1 ${changeColor}`} /> : <IconTrendingDown className={`ml-1 ${changeColor}`} />}
                    <span className="text-text-secondary ml-1">vs last month</span>
                </div>
            </div>
            <div className="bg-primary/10 p-3 rounded-full text-primary">
                {icon}
            </div>
        </div>
    );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-surface border border-secondary/20 rounded-md shadow-lg text-sm">
                <p className="font-bold text-text-primary">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color || p.fill }}>
                        {`${p.name}: ${formatter ? formatter(p.value) : p.value.toLocaleString()}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Dashboard: React.FC = () => {
    const { theme } = useTheme();
    
    const allCountries = useMemo(() => [...new Set(europeanDashboardData.map(d => d.country))], []);
    const allProducts = useMemo(() => [...new Set(europeanDashboardData.map(d => d.productCode))], []);

    const today = new Date('2025-01-31');
    const lastMonth = new Date('2025-01-01');

    const [view, setView] = useState<ViewType>('operational');
    const [filters, setFilters] = useState({
        countries: allCountries,
        productCodes: allProducts,
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
    });
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = (filterType: 'countries' | 'productCodes', value: string) => {
        setFilters(prev => {
            const currentValues = prev[filterType];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [filterType]: newValues };
        });
    };
    
    const resetFilters = () => {
        setFilters({
            countries: allCountries,
            productCodes: allProducts,
            startDate: lastMonth.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
        })
    }

    const { currentPeriodData, previousPeriodData } = useMemo(() => {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
        const prevStart = new Date(start);
        prevStart.setDate(start.getDate() - diffDays);

        const filterLogic = (d: ShipmentData, startDate: Date, endDate: Date) => {
            const itemDate = new Date(d.date);
            return itemDate >= startDate &&
                   itemDate <= endDate &&
                   filters.countries.includes(d.country) &&
                   filters.productCodes.includes(d.productCode);
        };
        
        return {
            currentPeriodData: europeanDashboardData.filter(d => filterLogic(d, start, end)),
            previousPeriodData: europeanDashboardData.filter(d => filterLogic(d, prevStart, start)),
        };
    }, [filters, allCountries, allProducts]);
    
    const kpiMetrics = useMemo(() => {
        const calcMetrics = (data: ShipmentData[]) => {
            const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
            const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
            const totalShipments = data.reduce((sum, item) => sum + item.shipments, 0);
            const profit = totalRevenue - totalCost;
            const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
            const days = new Set(data.map(d => d.date)).size || 1;
            const avgShipmentsPerDay = totalShipments / days;
            return { totalRevenue, totalShipments, profitMargin, avgShipmentsPerDay };
        };

        const current = calcMetrics(currentPeriodData);
        const previous = calcMetrics(previousPeriodData);
        
        const calcChange = (currentVal: number, previousVal: number) => {
            if (previousVal === 0) return currentVal > 0 ? 100 : 0;
            return ((currentVal - previousVal) / previousVal) * 100;
        };

        return {
            totalRevenue: { value: current.totalRevenue, change: calcChange(current.totalRevenue, previous.totalRevenue) },
            totalShipments: { value: current.totalShipments, change: calcChange(current.totalShipments, previous.totalShipments) },
            profitMargin: { value: current.profitMargin, change: current.profitMargin - previous.profitMargin },
            avgShipmentsPerDay: { value: current.avgShipmentsPerDay, change: calcChange(current.avgShipmentsPerDay, previous.avgShipmentsPerDay)},
        };
    }, [currentPeriodData, previousPeriodData]);

    const timeChartData = useMemo(() => {
        const aggregated: { [key: string]: { date: string; revenue: number; consignments: number } } = {};
        currentPeriodData.forEach(d => {
            if (!aggregated[d.date]) {
                aggregated[d.date] = { date: d.date, revenue: 0, consignments: 0 };
            }
            aggregated[d.date].revenue += d.revenue;
            aggregated[d.date].consignments += d.shipments;
        });
        return Object.values(aggregated).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [currentPeriodData]);

    const topCustomersData = useMemo(() => {
        const aggregated: { [name: string]: { revenue: number, consignments: number } } = {};
        currentPeriodData.forEach(d => {
            if (!aggregated[d.customerName]) aggregated[d.customerName] = { revenue: 0, consignments: 0 };
            aggregated[d.customerName].revenue += d.revenue;
            aggregated[d.customerName].consignments += d.shipments;
        });
        const allCustomers = Object.entries(aggregated).map(([customerName, data]) => ({ customerName, ...data }));
        const topByRevenue = [...allCustomers].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
        const topByConsignments = [...allCustomers].sort((a, b) => b.consignments - a.consignments).slice(0, 10);
        return { topByRevenue, topByConsignments };
    }, [currentPeriodData]);

    const countryData = useMemo(() => {
        const aggregated: { [country: string]: { revenue: number, consignments: number } } = {};
        currentPeriodData.forEach(d => {
            if (!aggregated[d.country]) aggregated[d.country] = { revenue: 0, consignments: 0 };
            aggregated[d.country].revenue += d.revenue;
            aggregated[d.country].consignments += d.shipments;
        });
        return Object.entries(aggregated).map(([name, data]) => ({ name, ...data }));
    }, [currentPeriodData]);

    const productData = useMemo(() => {
        const aggregated: { [product: string]: { shipments: number, revenue: number, cost: number } } = {};
        currentPeriodData.forEach(d => {
            if (!aggregated[d.productCode]) aggregated[d.productCode] = { shipments: 0, revenue: 0, cost: 0 };
            aggregated[d.productCode].shipments += d.shipments;
            aggregated[d.productCode].revenue += d.revenue;
            aggregated[d.productCode].cost += d.cost;
        });
        const mix = Object.entries(aggregated).map(([name, { shipments }]) => ({ name, value: shipments }));
        const profitability = Object.entries(aggregated).map(([name, { revenue, cost }]) => ({ name, profitMargin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0 }));
        return { mix, profitability };
    }, [currentPeriodData]);


    const renderTimeChartTooltip = (props: any) => {
        const { active, payload, label } = props;
        if (active && payload && payload.length) {
            return (
                 <div className="p-2 bg-surface border border-secondary/20 rounded-md shadow-lg text-sm">
                    <p className="font-bold text-text-primary">{label}</p>
                    {payload.map((p: any) => (
                        <p key={p.dataKey} style={{ color: p.stroke }}>{`${p.name}: ${p.dataKey === 'revenue' ? '€' : ''}${p.value.toLocaleString()}`}</p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto text-text-primary bg-background">
            <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                 <div>
                    <h1 className="text-2xl font-semibold text-text-primary">Shipment Dashboard</h1>
                    <p className="text-sm text-text-secondary">Europe - {view === 'operational' ? 'Operational Analysis' : 'Financial Analysis'}</p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex items-center bg-surface p-1 rounded-lg border border-secondary/20">
                        <button onClick={() => setView('operational')} className={`px-3 py-1 text-sm rounded-md ${view === 'operational' ? 'bg-primary text-white shadow' : 'text-text-secondary'}`}>Operational</button>
                        <button onClick={() => setView('financial')} className={`px-3 py-1 text-sm rounded-md ${view === 'financial' ? 'bg-primary text-white shadow' : 'text-text-secondary'}`}>Financial</button>
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-surface text-text-secondary hover:bg-secondary/20 border border-secondary/20">
                        <IconFilter /> Filters <IconChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {showFilters && (
                 <div className="bg-surface p-4 rounded-lg mb-6 shadow-md border border-secondary/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="text-sm font-medium text-text-secondary block mb-2">Countries</label>
                            <div className="max-h-32 overflow-y-auto bg-background p-2 rounded border border-secondary/20">
                                {allCountries.map(country => (
                                    <div key={country} className="flex items-center">
                                        <input type="checkbox" id={`country-${country}`} checked={filters.countries.includes(country)} onChange={() => handleFilterChange('countries', country)} className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent" />
                                        <label htmlFor={`country-${country}`} className="ml-2 text-sm text-text-primary">{country}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-text-secondary block mb-2">Product Codes</label>
                             <div className="max-h-32 overflow-y-auto bg-background p-2 rounded border border-secondary/20">
                                {allProducts.map(code => (
                                    <div key={code} className="flex items-center">
                                        <input type="checkbox" id={`prod-${code}`} checked={filters.productCodes.includes(code)} onChange={() => handleFilterChange('productCodes', code)} className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent" />
                                        <label htmlFor={`prod-${code}`} className="ml-2 text-sm text-text-primary">{code}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <label className="text-sm font-medium text-text-secondary block -mb-2">Date Range</label>
                            <div className="flex items-center gap-2">
                                <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} className="bg-background border border-secondary/20 rounded-md p-2 text-sm w-full"/>
                                <span className="text-text-secondary">-</span>
                                <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({...f, endDate: e.target.value}))} className="bg-background border border-secondary/20 rounded-md p-2 text-sm w-full"/>
                            </div>
                             <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-text-secondary bg-secondary/30 hover:bg-secondary/50 rounded-md">Reset Filters</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                {view === 'operational' ? (
                    <>
                        <KpiCard title="Total Consignments" value={kpiMetrics.totalShipments.value.toLocaleString()} change={kpiMetrics.totalShipments.change} icon={<IconPackage />} />
                        <KpiCard title="Avg Shipments/Day" value={kpiMetrics.avgShipmentsPerDay.value.toFixed(1)} change={kpiMetrics.avgShipmentsPerDay.change} icon={<IconCalendar />} />
                        <KpiCard title="Top Country (Volume)" value={[...countryData].sort((a,b) => b.consignments - a.consignments)[0]?.name || 'N/A'} change={0} icon={<IconChart />} />
                        <KpiCard title="Top Customer (Volume)" value={topCustomersData.topByConsignments[0]?.customerName || 'N/A'} change={0} icon={<IconUsers />} />
                    </>
                ) : (
                    <>
                        <KpiCard title="Total Revenue" value={kpiMetrics.totalRevenue.value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} change={kpiMetrics.totalRevenue.change} icon={<IconEuro />} formatAsCurrency />
                        <KpiCard title="Profit Margin" value={`${kpiMetrics.profitMargin.value.toFixed(1)}%`} change={kpiMetrics.profitMargin.change} icon={<IconEuro />} />
                        <KpiCard title="Top Country (Revenue)" value={[...countryData].sort((a,b) => b.revenue - a.revenue)[0]?.name || 'N/A'} change={0} icon={<IconChart />} />
                        <KpiCard title="Top Customer (Revenue)" value={topCustomersData.topByRevenue[0]?.customerName || 'N/A'} change={0} icon={<IconUsers />} />
                    </>
                )}
            </div>

            <div className="bg-surface p-4 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-4">{view === 'operational' ? 'Consignments' : 'Revenue'} Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={timeChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                        <XAxis dataKey="date" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                        <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => view === 'financial' ? `€${(value/1000)}k` : value.toLocaleString()}/>
                        <Tooltip content={renderTimeChartTooltip} />
                        {view === 'operational' ? (
                             <Area type="monotone" dataKey="consignments" name="Consignments" stroke={`rgb(${theme.colors.accent})`} fill={`rgb(${theme.colors.accent}/0.2)`} />
                        ) : (
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke={`rgb(${theme.colors.info})`} fill={`rgb(${theme.colors.info}/0.2)`} />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Top 10 Customers by {view === 'operational' ? 'Consignments' : 'Revenue'}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={view === 'operational' ? topCustomersData.topByConsignments : topCustomersData.topByRevenue} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                            <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => view === 'financial' ? `€${(value/1000)}k` : value.toLocaleString()} />
                            <YAxis type="category" dataKey="customerName" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} interval={0}/>
                            <Tooltip content={<CustomTooltip formatter={(value: number) => view === 'financial' ? `€${value.toLocaleString()}` : value.toLocaleString()}/>} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                            <Bar dataKey={view === 'operational' ? 'consignments' : 'revenue'} fill={view === 'operational' ? `rgb(${theme.colors.accent})` : `rgb(${theme.colors.info})`} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {view === 'operational' ? (
                     <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Consignments by Country</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={countryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="name" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                                <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} tickFormatter={(value) => value.toLocaleString()}/>
                                <Tooltip content={<CustomTooltip formatter={(value: number) => value.toLocaleString()} />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                                <Bar dataKey="consignments" fill={`rgb(${theme.colors.accent})`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                     <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Revenue by Country</h3>
                        <div style={{ height: '300px', width: '100%' }}>
                           <RevenueMapChart data={countryData} />
                        </div>
                    </div>
                )}
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-surface p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Product Mix (by Shipments)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                             <Pie data={productData.mix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {productData.mix.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={theme.colors['chart-product'][entry.name] || theme.colors['chart-pie'][index % theme.colors['chart-pie'].length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${value.toLocaleString()} shipments`} contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {view === 'financial' && (
                     <div className="bg-surface p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Profitability by Product</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={productData.profitability} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                                <XAxis dataKey="name" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                                <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} unit="%" />
                                <Tooltip content={<CustomTooltip formatter={(value: number) => `${value.toFixed(1)}%`}/>} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }}/>
                                <Bar dataKey="profitMargin" name="Profit Margin">
                                     {productData.profitability.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={theme.colors['chart-product'][entry.name] || theme.colors['chart-pie'][index % theme.colors['chart-pie'].length]} />
                                     ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
             </div>
        </div>
    );
};

export default Dashboard;
