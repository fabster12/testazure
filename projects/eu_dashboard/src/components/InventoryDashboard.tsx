import React, { useMemo, useState } from 'react';
import { Application, Criticality, Complexity, ApplicationType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { IconCheck, IconChevronDown, IconClipboardList, IconClock, IconFilter, IconInventory, IconPackage } from './icons';

interface InventoryDashboardProps {
    applications: Application[];
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => {
    return (
        <div className="bg-surface p-4 rounded-lg shadow-md flex items-start justify-between">
            <div>
                <p className="text-sm text-text-secondary">{title}</p>
                <p className="text-3xl font-bold text-text-primary">{value}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full text-primary">
                {icon}
            </div>
        </div>
    );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-surface border border-secondary/20 rounded-md shadow-lg text-sm">
                <p className="font-bold text-text-primary">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color || p.fill }}>
                        {`${p.name}: ${p.value.toLocaleString()}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const DECOMMISSIONING_STAGES: (keyof Application['decommissioning'])[] = [
    'userCommsSent',
    'finalBackup',
    'archiveCompleted',
    'accessRevoked',
    'vendorNotified',
    'licensesCancelled',
    'infraDecommissioned',
    'signOff',
];

const STAGE_LABELS: Record<keyof Application['decommissioning'], string> = {
    userCommsSent: 'User Comms Sent',
    finalBackup: 'Final Backup Taken',
    archiveCompleted: 'Archive Completed',
    accessRevoked: 'Access Revoked',
    vendorNotified: 'Vendor Notified',
    licensesCancelled: 'Licenses Cancelled',
    infraDecommissioned: 'Infra Decommissioned',
    signOff: 'Signed Off',
};


const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ applications }) => {
    const { theme } = useTheme();

    const allTypes = useMemo(() => [...new Set(applications.map(a => a.identification.type))].sort(), [applications]);
    const allCriticalities = useMemo(() => [...new Set(applications.map(a => a.businessContext.criticality))].sort(), [applications]);
    const allComplexities = useMemo(() => [...new Set(applications.map(a => a.riskAssessment.archiveComplexity))].sort(), [applications]);
    const allOwners = useMemo(() => [...new Set(applications.map(a => a.identification.businessOwner))].sort(), [applications]);

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        types: allTypes,
        criticalities: allCriticalities,
        complexities: allComplexities,
        owners: allOwners,
    });
    
    const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
        setFilters(prev => {
            // FIX: Cast to any[] to allow operations on a union of array types (ApplicationType[], Criticality[], etc.)
            // TypeScript cannot infer a common type for `includes` across the union, resulting in an error.
            const currentValues = prev[filterType] as any[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [filterType]: newValues };
        });
    };

    const resetFilters = () => {
        setFilters({
            types: allTypes,
            criticalities: allCriticalities,
            complexities: allComplexities,
            owners: allOwners,
        })
    }

    const filteredApplications = useMemo(() => {
        return applications.filter(app => 
            filters.types.includes(app.identification.type) &&
            filters.criticalities.includes(app.businessContext.criticality) &&
            filters.complexities.includes(app.riskAssessment.archiveComplexity) &&
            filters.owners.includes(app.identification.businessOwner)
        );
    }, [applications, filters]);

    const kpiData = useMemo(() => {
        const completedApps = filteredApplications.filter(a => a.decommissioning.signOff).length;
        const inProgressApps = filteredApplications.filter(a => !a.decommissioning.signOff && Object.values(a.decommissioning).some(val => val === true)).length;
        const totalDataVolume = filteredApplications.reduce((sum, app) => sum + app.dataClassification.totalVolumeGB, 0);
        return {
            totalApps: filteredApplications.length,
            completedApps,
            inProgressApps,
            totalDataVolume: totalDataVolume.toFixed(2),
        }
    }, [filteredApplications]);

    const funnelData = useMemo(() => {
        return DECOMMISSIONING_STAGES.map(stage => ({
            name: STAGE_LABELS[stage],
            Completed: filteredApplications.filter(app => app.decommissioning[stage]).length,
        })).reverse();
    }, [filteredApplications]);

    const criticalityData = useMemo(() => {
        const counts = filteredApplications.reduce((acc, app) => {
            acc[app.businessContext.criticality] = (acc[app.businessContext.criticality] || 0) + 1;
            return acc;
        }, {} as Record<Criticality, number>);
        return Object.values(Criticality).map(c => ({ name: c, Count: counts[c] || 0 }));
    }, [filteredApplications]);

    const complexityData = useMemo(() => {
        const counts = filteredApplications.reduce((acc, app) => {
            acc[app.riskAssessment.archiveComplexity] = (acc[app.riskAssessment.archiveComplexity] || 0) + 1;
            return acc;
        }, {} as Record<Complexity, number>);
        return Object.values(Complexity).map(c => ({ name: c, value: counts[c] || 0 }));
    }, [filteredApplications]);

    const typeData = useMemo(() => {
        const counts = filteredApplications.reduce((acc, app) => {
            acc[app.identification.type] = (acc[app.identification.type] || 0) + 1;
            return acc;
        }, {} as Record<ApplicationType, number>);
        return Object.values(ApplicationType).map(t => ({ name: t, value: counts[t] || 0 })).filter(t => t.value > 0);
    }, [filteredApplications]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto text-text-primary bg-background">
            <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                 <div>
                    <h1 className="text-2xl font-semibold text-text-primary">Progress Dashboard</h1>
                    <p className="text-sm text-text-secondary">Application Archiving Initiative Overview</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-surface text-text-secondary hover:bg-secondary/20 border border-secondary/20">
                        <IconFilter /> Filters <IconChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
             {showFilters && (
                 <div className="bg-surface p-4 rounded-lg mb-6 shadow-md border border-secondary/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        { [
                            { title: 'Application Types', key: 'types', options: allTypes },
                            { title: 'Business Criticality', key: 'criticalities', options: allCriticalities },
                            { title: 'Archive Complexity', key: 'complexities', options: allComplexities },
                            { title: 'Business Owners', key: 'owners', options: allOwners }
                        ].map(filterGroup => (
                            <div key={filterGroup.title}>
                                <label className="text-sm font-medium text-text-secondary block mb-2">{filterGroup.title}</label>
                                <div className="max-h-32 overflow-y-auto bg-background p-2 rounded border border-secondary/20">
                                    {filterGroup.options.map(option => (
                                        <div key={option} className="flex items-center">
                                            {/* FIX: Cast to any[] to allow `includes` on a union of array types. */}
                                            <input type="checkbox" id={`${filterGroup.key}-${option}`} checked={(filters[filterGroup.key as keyof typeof filters] as any[]).includes(option)} onChange={() => handleFilterChange(filterGroup.key as keyof typeof filters, option)} className="h-4 w-4 rounded border-gray-500 text-accent focus:ring-accent" />
                                            <label htmlFor={`${filterGroup.key}-${option}`} className="ml-2 text-sm text-text-primary truncate" title={option}>{option}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="mt-4 text-right">
                        <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-text-secondary bg-secondary/30 hover:bg-secondary/50 rounded-md">Reset Filters</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <KpiCard title="Total Applications" value={kpiData.totalApps} icon={<IconInventory />} />
                <KpiCard title="Completed Archives" value={kpiData.completedApps} icon={<IconCheck />} />
                <KpiCard title="Archives In Progress" value={kpiData.inProgressApps} icon={<IconClock />} />
                <KpiCard title="Total Data Volume (GB)" value={kpiData.totalDataVolume} icon={<IconPackage />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface p-4 rounded-lg shadow-md min-h-[350px]">
                    <h3 className="text-lg font-semibold mb-4">Decommissioning Funnel</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                            <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                            <XAxis type="number" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} allowDecimals={false}/>
                            <YAxis type="category" dataKey="name" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={10} width={100} interval={0} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                            <Bar dataKey="Completed" fill={`rgb(${theme.colors.accent})`} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-surface p-4 rounded-lg shadow-md min-h-[350px]">
                    <h3 className="text-lg font-semibold mb-4">Applications by Business Criticality</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={criticalityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid stroke={`rgb(${theme.colors['text-secondary']}/0.1)`} />
                            <XAxis dataKey="name" stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} />
                            <YAxis stroke={`rgb(${theme.colors['text-secondary']})`} fontSize={12} allowDecimals={false}/>
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgb(${theme.colors.secondary}/0.1)` }} />
                            <Bar dataKey="Count">
                                {criticalityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-surface p-4 rounded-lg shadow-md min-h-[350px]">
                    <h3 className="text-lg font-semibold mb-4">Archive Complexity</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                             <Pie data={complexityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {complexityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-surface p-4 rounded-lg shadow-md min-h-[350px]">
                    <h3 className="text-lg font-semibold mb-4">Application Type Distribution</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                             <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {typeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={theme.colors['chart-categorical'][index % theme.colors['chart-categorical'].length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: `rgb(${theme.colors.surface})`, borderColor: `rgb(${theme.colors.secondary}/0.2)`}} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default InventoryDashboard;
