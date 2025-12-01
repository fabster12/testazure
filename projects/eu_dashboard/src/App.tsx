import React, { useState, useCallback, useMemo } from 'react';
import { Application } from './types';
import { sampleApplications } from './constants';
import Dashboard from './components/Dashboard';
import InventoryDashboard from './components/InventoryDashboard';
import ApplicationForm from './components/ApplicationForm';
import InitialQuestionnaire from './components/FirstOrder';
import { IconClipboardCheck, IconClipboardList, IconDashboard, IconDownload, IconInventory, IconPlus, IconServer, IconUpload, IconUsers } from './components/icons';
import ThemeSwitcher from './components/ThemeSwitcher';
import MigrationDashboard from './components/MainframeDashboard';
import DatabaseMaintenance from './components/DatabaseMaintenance';
import WavePlanner from './components/WavePlanner';
import { DatabaseProvider } from './contexts/DatabaseContext';

type View = 'inventory' | 'shipmentDashboard' | 'progressDashboard' | 'initialQuestionnaire' | 'migrationDashboard' | 'dbMaintenance' | 'wavePlanner';

const App: React.FC = () => {
    const [view, setView] = useState<View>('migrationDashboard');
    const [applications, setApplications] = useState<Application[]>(sampleApplications);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(sampleApplications[0]?.id || null);

    const selectedApplication = useMemo(() => {
        return applications.find(app => app.id === selectedAppId) || null;
    }, [applications, selectedAppId]);

    const handleUpdateApplication = useCallback((updatedApp: Application) => {
        setApplications(prevApps => prevApps.map(app => app.id === updatedApp.id ? updatedApp : app));
    }, []);

    const handleAddNewApplication = () => {
        const newId = `app-${Date.now()}`;
        const newApp: Application = JSON.parse(JSON.stringify({
            ...sampleApplications[0], // using first sample as a template
            id: newId,
            identification: {
                ...sampleApplications[0].identification,
                name: "New Application",
                appId: `NEW-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
            }
        }));
        setApplications(prev => [newApp, ...prev]);
        setSelectedAppId(newId);
    };

    const handleDeleteApplication = (appId: string) => {
        if (window.confirm("Are you sure you want to delete this application?")) {
            const newApps = applications.filter(app => app.id !== appId);
            setApplications(newApps);
            if (selectedAppId === appId) {
                setSelectedAppId(newApps[0]?.id || null);
            }
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(applications, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "applications_inventory.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target?.result as string;
                    const parsedData = JSON.parse(content);
                    // Basic validation
                    if (Array.isArray(parsedData) && parsedData.every(item => item.id && item.identification)) {
                        setApplications(parsedData);
                        setSelectedAppId(parsedData[0]?.id || null);
                        alert('Successfully imported applications.');
                    } else {
                        throw new Error('Invalid JSON format for applications.');
                    }
                } catch (error) {
                    alert('Error parsing or validating JSON file.');
                    console.error(error);
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    };


    const Header: React.FC = () => (
        <header className="bg-surface shadow-md p-4 flex justify-between items-center border-b border-secondary/20">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-text-primary">EU Dashboard</h1>
                <nav className="flex gap-2">
                    <button
                        onClick={() => setView('migrationDashboard')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${view === 'migrationDashboard' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-secondary/50'}`}
                    >
                        <IconServer /> Migration Dashboard
                    </button>
                    <button
                        onClick={() => setView('wavePlanner')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${view === 'wavePlanner' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-secondary/50'}`}
                    >
                        <IconUsers /> Wave Planner
                    </button>
                     <button
                        onClick={() => setView('initialQuestionnaire')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${view === 'initialQuestionnaire' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-secondary/50'}`}
                    >
                        <IconClipboardCheck /> Initial Questionnaire
                    </button>
                    <button
                        onClick={() => setView('inventory')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${view === 'inventory' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-secondary/50'}`}
                    >
                        <IconInventory /> Inventory
                    </button>
                    <button
                        onClick={() => setView('progressDashboard')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${view === 'progressDashboard' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-secondary/50'}`}
                    >
                        <IconClipboardList /> Progress Dashboard
                    </button>
                    <button
                        onClick={() => setView('shipmentDashboard')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${view === 'shipmentDashboard' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-secondary/50'}`}
                    >
                        <IconDashboard /> Shipment Dashboard
                    </button>
                    <button
                        onClick={() => setView('dbMaintenance')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${view === 'dbMaintenance' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-secondary/50'}`}
                    >
                        <IconServer /> DB Maintenance
                    </button>
                </nav>
            </div>
            <div className="flex items-center gap-2">
                 <ThemeSwitcher />
                <button onClick={handleImport} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-secondary/30 text-text-secondary hover:bg-primary hover:text-white">
                    <IconUpload /> Import
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-secondary/30 text-text-secondary hover:bg-primary hover:text-white">
                    <IconDownload /> Export
                </button>
            </div>
        </header>
    );

    const InventoryView: React.FC = () => (
        <div className="flex flex-col md:flex-row h-[calc(100vh-73px)]">
            <aside className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 bg-surface border-r border-secondary/20 flex flex-col">
                <div className="p-4 border-b border-secondary/20 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Applications ({applications.length})</h2>
                    <button onClick={handleAddNewApplication} className="p-2 rounded-md hover:bg-secondary/50">
                        <IconPlus />
                    </button>
                </div>
                <ul className="overflow-y-auto flex-grow">
                    {applications.map(app => (
                        <li key={app.id}>
                            <button
                                onClick={() => setSelectedAppId(app.id)}
                                className={`w-full text-left p-4 border-l-4 ${selectedAppId === app.id ? 'bg-secondary/30 border-accent' : 'border-transparent hover:bg-secondary/20'}`}
                            >
                                <p className="font-semibold truncate text-text-primary">{app.identification.name}</p>
                                <p className="text-sm text-text-secondary">{app.identification.appId}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="w-full md:w-2/3 lg:w-3/4 xl:w-4/5">
                {selectedApplication ? (
                    <ApplicationForm 
                        key={selectedApplication.id}
                        application={selectedApplication}
                        onUpdate={handleUpdateApplication}
                        onDelete={handleDeleteApplication}
                    />
                ) : (
                    <div className="flex justify-center items-center h-full">
                        <div className="text-center text-text-secondary">
                            <IconInventory className="mx-auto h-12 w-12" />
                            <h2 className="mt-2 text-xl font-medium">No Application Selected</h2>
                            <p>Select an application from the list or add a new one.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );

    const renderView = () => {
        switch(view) {
            case 'inventory':
                return <InventoryView />;
            case 'initialQuestionnaire':
                return <InitialQuestionnaire />;
            case 'progressDashboard':
                return <InventoryDashboard applications={applications} />;
            case 'migrationDashboard':
                return <MigrationDashboard />;
            case 'shipmentDashboard':
                return <Dashboard />;
            case 'dbMaintenance':
                return <DatabaseMaintenance />;
            case 'wavePlanner':
                return <WavePlanner />;
            default:
                return <InitialQuestionnaire />;
        }
    }

    return (
        <DatabaseProvider>
            <div className="h-screen w-screen text-text-primary flex flex-col">
                <Header />
                {renderView()}
            </div>
        </DatabaseProvider>
    );
};

export default App;