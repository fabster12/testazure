


import React, { useState, useCallback } from 'react';
import { Application, ApplicationType, Criticality, Frequency, DataClassification, Complexity } from '../types';
import { generateApplicationSummary } from '../services/geminiService';
import { IconChevronDown, IconSparkles } from './icons';

interface ApplicationFormProps {
    application: Application;
    onUpdate: (app: Application) => void;
    onDelete: (appId: string) => void;
}

const formSections = [
    { title: 'Identification', key: 'identification' },
    { title: 'Business Context & Usage', key: 'businessContext' },
    { title: 'Technical Architecture', key: 'technicalArchitecture' },
    { title: 'Data Classification & Storage', key: 'dataClassification' },
    { title: 'Legal & Compliance', key: 'legalCompliance' },
    { title: 'Dependencies & Integrations', key: 'dependencies' },
    { title: 'Security & Access Control', key: 'security' },
    { title: 'Documentation & Knowledge', key: 'documentation' },
    { title: 'Licensing & Vendor Information', key: 'licensing' },
    { title: 'Archive Strategy', key: 'archiveStrategy' },
    { title: 'Decommissioning Checklist', key: 'decommissioning' },
    { title: 'Risk Assessment', key: 'riskAssessment' },
];

type InputType = 'text' | 'date' | 'number' | 'textarea' | 'select' | 'checkbox';
type FormField = { key: string; label: string; type: InputType; options?: any[] };

const newApplication: Application = {
    id: '',
    identification: { name: '', appId: '', version: '', type: ApplicationType.OTHER, primaryBusinessFunction: '', businessOwner: '', itOwner: '', implementationDate: '', decommissionDate: '' },
    businessContext: { processesSupported: '', activeUsers: 0, userDepartments: '', frequency: Frequency.AD_HOC, criticality: Criticality.LOW, lastUseDate: '', archiveJustification: '' },
    technicalArchitecture: { platform: '', languages: '', database: '', os: '', infrastructure: '', runtimeComponents: '', dependencies: '', integrationMethod: '', systemRequirements: '' },
    dataClassification: { dataTypes: '', totalVolumeGB: 0, growthRate: '', hasSensitiveData: false, classification: DataClassification.INTERNAL, storageLocation: '', dbNames: '', fileSharePaths: '', dataFormat: '' },
    legalCompliance: { regulatoryRequirements: '', legalHold: false, retentionPeriod: '', auditTrail: false, dataResidency: '', industryCompliance: '', recordsPolicy: '', destructionDate: '' },
    dependencies: { upstreamSystems: '', downstreamSystems: '', sharedComponents: '', vendorDependencies: '', licenseDependencies: '', batchJobs: '', reportDependencies: '' },
    security: { authMethod: '', accessControl: '', adminPrivileges: '', encryption: '', certificates: '', networkRequirements: '', serviceAccounts: '' },
    documentation: { technicalDocs: false, userManuals: false, sourceCodeLocation: '', dbSchemas: false, businessProcessDocs: false, runbooks: false, knowledgeTransfer: '' },
    licensing: { vendorName: '', licenseType: '', expirationDate: '', annualCost: 0, supportStatus: '', vendorContact: '', licenseKeysLocation: '' },
    archiveStrategy: { archiveFormat: '', archiveLocation: '', readOnlyAccess: false, accessFrequency: '', accessMethod: '', queryCapabilities: '', testingRequirements: '', hasNativeExport: false, nativeExportFormats: '', exportProcessDetails: '' },
    decommissioning: { archiveCompleted: false, userCommsSent: false, accessRevoked: false, licensesCancelled: false, infraDecommissioned: false, vendorNotified: false, finalBackup: false, signOff: false },
    riskAssessment: { riskOfImproperArchive: Criticality.LOW, impactIfDataLost: '', workaround: '', personnelDependencies: '', archiveComplexity: Complexity.SIMPLE },
};

const getFieldsForSection = (sectionKey: string): FormField[] => {
    switch(sectionKey) {
        case 'identification': return [
            { key: 'name', label: 'Application Name', type: 'text' },
            { key: 'appId', label: 'Application ID/Code', type: 'text' },
            { key: 'version', label: 'Current Version', type: 'text' },
            { key: 'type', label: 'Application Type', type: 'select', options: Object.values(ApplicationType) },
            { key: 'primaryBusinessFunction', label: 'Primary Business Function', type: 'text' },
            { key: 'businessOwner', label: 'Business Owner', type: 'text' },
            { key: 'itOwner', label: 'IT Owner/Administrator', type: 'text' },
            { key: 'implementationDate', label: 'Implementation Date', type: 'date' },
            { key: 'decommissionDate', label: 'Planned Decommission Date', type: 'date' },
        ];
        case 'businessContext': return [
            { key: 'processesSupported', label: 'Business Process(es) Supported', type: 'textarea' },
            { key: 'activeUsers', label: 'Number of Active Users', type: 'number' },
            { key: 'userDepartments', label: 'User Departments/Locations', type: 'text' },
            { key: 'frequency', label: 'Frequency of Use', type: 'select', options: Object.values(Frequency) },
            { key: 'criticality', label: 'Business Criticality', type: 'select', options: Object.values(Criticality) },
            { key: 'lastUseDate', label: 'Last Active Use Date', type: 'date' },
            { key: 'archiveJustification', label: 'Business Justification for Archiving', type: 'textarea' },
        ];
        case 'archiveStrategy': return [
            { key: 'archiveFormat', label: 'Archive Format (e.g., SQL BAK, ZIP)', type: 'text' },
            { key: 'archiveLocation', label: 'Planned Archive Location (e.g., S3)', type: 'text' },
            { key: 'accessFrequency', label: 'Expected Access Frequency', type: 'text' },
            { key: 'accessMethod', label: 'Method for Accessing Archived Data', type: 'text' },
            { key: 'queryCapabilities', label: 'Query Capabilities on Archive', type: 'text' },
            { key: 'testingRequirements', label: 'Archive Testing Requirements', type: 'textarea' },
            { key: 'readOnlyAccess', label: 'Archive is Read-Only?', type: 'checkbox' },
            { key: 'hasNativeExport', label: 'Has Native Export Functionality?', type: 'checkbox' },
            { key: 'nativeExportFormats', label: 'Native Export Formats', type: 'text' },
            { key: 'exportProcessDetails', label: 'Export Process Details', type: 'textarea' },
        ];
        case 'decommissioning': return Object.keys(newApplication.decommissioning).map(key => ({
            key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) + '?', type: 'checkbox'
        }));
        case 'riskAssessment': return [
            { key: 'riskOfImproperArchive', label: 'Risk of Not Archiving Properly', type: 'select', options: Object.values(Criticality) },
            { key: 'impactIfDataLost', label: 'Impact if Data Lost', type: 'textarea' },
            { key: 'workaround', label: 'Workaround if Archive Fails', type: 'textarea' },
            { key: 'personnelDependencies', label: 'Dependencies on Key Personnel', type: 'textarea' },
            { key: 'archiveComplexity', label: 'Technical Complexity of Archive', type: 'select', options: Object.values(Complexity) },
        ];
        // Simplified for brevity, add other sections as needed following the pattern
        default: 
            return Object.keys(newApplication[sectionKey as keyof Application] || {}).map(key => {
                 const value = (newApplication[sectionKey as keyof Application] as any)[key];
                 let type: InputType = 'text';
                 if (typeof value === 'boolean') type = 'checkbox';
                 if (typeof value === 'number') type = 'number';
                 return { key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), type };
            });
    }
}


const AccordionItem: React.FC<{title: string, isOpen: boolean, onToggle: () => void, children: React.ReactNode}> = ({ title, isOpen, onToggle, children }) => {
    return (
        <div className="border-b border-gray-700">
            <h3>
                <button type="button" onClick={onToggle} className="flex justify-between items-center w-full p-5 font-medium text-left text-gray-400 hover:bg-gray-800" >
                    <span>{title}</span>
                    <IconChevronDown className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </h3>
            <div className={`p-5 border-t border-gray-700 bg-gray-900/50 ${isOpen ? '' : 'hidden'}`}>
                {children}
            </div>
        </div>
    );
};


const ApplicationForm: React.FC<ApplicationFormProps> = ({ application, onUpdate, onDelete }) => {
    const [localApp, setLocalApp] = useState(application);
    const [openAccordion, setOpenAccordion] = useState<string | null>('identification');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSummary, setAiSummary] = useState('');

    React.useEffect(() => {
        setLocalApp(application);
        setAiSummary('');
    }, [application]);

    const handleChange = useCallback((section: keyof Application, field: string, value: any) => {
        setLocalApp(prevApp => {
            const newApp = { ...prevApp };
            (newApp[section] as any)[field] = value;
            onUpdate(newApp); // Live update parent
            return newApp;
        });
    }, [onUpdate]);

    const handleGenerateSummary = async () => {
        setIsGenerating(true);
        setAiSummary('');
        const summary = await generateApplicationSummary(localApp);
        setAiSummary(summary);
        setIsGenerating(false);
    };

    const toggleAccordion = (key: string) => {
        setOpenAccordion(openAccordion === key ? null : key);
    };

    const renderField = (sectionKey: keyof Application, field: FormField) => {
        const value = (localApp[sectionKey] as any)[field.key];
        const commonClasses = "mt-1 block w-full bg-surface border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm text-text-primary";
        
        switch (field.type) {
            case 'checkbox':
                return (
                     <div className="flex items-center h-full">
                        <input type="checkbox" checked={!!value} onChange={e => handleChange(sectionKey, field.key, e.target.checked)} className="h-4 w-4 text-accent border-gray-600 rounded focus:ring-accent" />
                    </div>
                );
            case 'textarea':
                return <textarea value={value} onChange={e => handleChange(sectionKey, field.key, e.target.value)} rows={3} className={commonClasses}></textarea>;
            case 'select':
                return (
                    <select value={value} onChange={e => handleChange(sectionKey, field.key, e.target.value)} className={commonClasses}>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                );
            default:
                return <input type={field.type} value={value} onChange={e => handleChange(sectionKey, field.key, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} className={commonClasses} />;
        }
    };
    
    return (
        <div className="bg-surface p-6 h-full overflow-y-auto rounded-lg shadow-inner">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text-primary truncate" title={localApp.identification.name}>{localApp.identification.name || "New Application"}</h2>
                <div className="flex gap-2">
                     <button
                        onClick={handleGenerateSummary}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 disabled:cursor-wait"
                    >
                        <IconSparkles />
                        {isGenerating ? 'Generating...' : 'AI Summary'}
                    </button>
                    <button onClick={() => onDelete(application.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">Delete</button>
                </div>
            </div>
            
            {isGenerating && <div className="mb-4 p-4 bg-blue-900/50 rounded-md text-center text-text-secondary">Generating AI summary... please wait.</div>}
            {aiSummary && (
                 <div className="mb-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-accent mb-2 flex items-center gap-2"><IconSparkles /> AI-Generated Summary</h3>
                    <p className="text-text-secondary whitespace-pre-wrap">{aiSummary}</p>
                 </div>
            )}

            <form onSubmit={e => e.preventDefault()}>
                {formSections.map(section => (
                    <AccordionItem 
                        key={section.key} 
                        title={section.title}
                        isOpen={openAccordion === section.key}
                        onToggle={() => toggleAccordion(section.key)}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {getFieldsForSection(section.key).map(field => (
                                <div key={field.key} className={field.type === 'textarea' || (field.type === 'checkbox' && (getFieldsForSection(section.key).length % 2 !== 0 && field.key === getFieldsForSection(section.key)[getFieldsForSection(section.key).length-1].key)) ? 'md:col-span-2' : ''}>
                                    <label className="block text-sm font-medium text-text-secondary">{field.label}</label>
                                    {renderField(section.key as keyof Application, field)}
                                </div>
                            ))}
                        </div>
                    </AccordionItem>
                ))}
            </form>
        </div>
    );
};

export default ApplicationForm;