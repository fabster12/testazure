import React, { useState, useRef } from 'react';
import { getArchiveStrategyRecommendation } from '../services/geminiService';
import { IconDownload, IconSparkles, IconUpload } from './icons';

const initialAnswers = {
    isTransactional: '',
    isNonTransactional: '',
    isRegulated: '',
    hasPii: '',
    isWormRequired: '',
    accessNeeds: {
        Operations: false,
        Compliance: false,
        Finance: false,
        'Customer Service': false,
        Auditors: false,
        None: false,
    },
    retrievalFrequency: '',
    retentionPeriod: '',
    isPhasedLifecycle: '',
    dataPurpose: {
        'Ongoing operations': false,
        'Historical analytics': false,
        Compliance: false,
        'Ad hoc investigations': false,
    },
    canBeAnonymized: '',
    dataOwner: '',
    hasMetadataCatalog: '',
    dataVolume: '',
    recallPreference: '',
    needsIntegration: '',
    hasQualityIssues: '',
};

const QuestionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-surface p-6 rounded-lg shadow-md border border-secondary/20">
        <h3 className="text-lg font-semibold text-accent mb-4">{title}</h3>
        {children}
    </div>
);

const YesNoQuestion: React.FC<{ label: string; name: string; value: string; onChange: (value: string) => void }> = ({ label, name, value, onChange }) => (
    <div className="mb-4">
        <p className="font-medium text-text-primary">{label}</p>
        <div className="flex gap-x-4 mt-2">
            <label className="flex items-center cursor-pointer">
                <input type="radio" name={name} value="Yes" checked={value === 'Yes'} onChange={e => onChange(e.target.value)} className="form-radio h-4 w-4 text-accent bg-background border-secondary" />
                <span className="ml-2 text-sm text-text-secondary">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
                <input type="radio" name={name} value="No" checked={value === 'No'} onChange={e => onChange(e.target.value)} className="form-radio h-4 w-4 text-accent bg-background border-secondary" />
                <span className="ml-2 text-sm text-text-secondary">No</span>
            </label>
        </div>
    </div>
);

const MultiSelectQuestion: React.FC<{ label: string; options: string[]; values: Record<string, boolean>; onChange: (option: string, checked: boolean) => void }> = ({ label, options, values, onChange }) => (
     <div className="mb-4">
        <p className="font-medium text-text-primary">{label}</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
            {options.map(option => (
                <label key={option} className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={values[option]} onChange={e => onChange(option, e.target.checked)} className="form-checkbox h-4 w-4 text-accent bg-background border-secondary rounded" />
                    <span className="ml-2 text-sm text-text-secondary">{option}</span>
                </label>
            ))}
        </div>
    </div>
);

const RadioQuestion: React.FC<{ label: string; name: string; options: string[]; value: string; onChange: (value: string) => void }> = ({ label, name, options, value, onChange }) => (
    <div className="mb-4">
        <p className="font-medium text-text-primary">{label}</p>
        <div className="flex flex-col gap-2 mt-2">
            {options.map(option => (
                <label key={option} className="flex items-center cursor-pointer">
                    <input type="radio" name={name} value={option} checked={value === option} onChange={e => onChange(e.target.value)} className="form-radio h-4 w-4 text-accent bg-background border-secondary" />
                    <span className="ml-2 text-sm text-text-secondary">{option}</span>
                </label>
            ))}
        </div>
    </div>
);


const InitialQuestionnaire: React.FC = () => {
    const [answers, setAnswers] = useState(initialAnswers);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);


    const handleAnswerChange = (field: keyof typeof initialAnswers, value: any) => {
        setAnswers(prev => ({ ...prev, [field]: value }));
    };

    const handleMultiSelectChange = (field: 'accessNeeds' | 'dataPurpose', option: string, checked: boolean) => {
        setAnswers(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [option]: checked,
            }
        }));
    };

    const handleGetRecommendation = async () => {
        setIsLoading(true);
        setResult('');
        try {
            const recommendation = await getArchiveStrategyRecommendation(answers);
            setResult(recommendation);
        } catch (error) {
            console.error(error);
            setResult('An error occurred while getting the recommendation. Please check the console and try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExportAnswers = () => {
        try {
            const jsonString = JSON.stringify(answers, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'questionnaire_answers.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export answers:", error);
            alert("An error occurred while exporting the answers.");
        }
    };

    const handleImportAnswers = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File content is not readable text.");
                }
                const importedAnswers = JSON.parse(text);
                // Basic validation
                if (importedAnswers.isTransactional !== undefined && importedAnswers.accessNeeds) {
                    setAnswers(importedAnswers);
                    alert("Answers imported successfully!");
                } else {
                    throw new Error("Invalid JSON structure for questionnaire answers.");
                }
            } catch (error) {
                console.error("Failed to import answers:", error);
                alert("Failed to import answers. Please ensure the file is a valid JSON export from this questionnaire.");
            }
        };
        reader.onerror = () => {
            alert("Error reading the file.");
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto text-text-primary bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Initial Archiving Questionnaire</h1>
                        <p className="text-md text-text-secondary mt-1">Answer these questions to get an AI-powered recommendation for your archiving strategy.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={importInputRef}
                            onChange={handleImportAnswers}
                            className="hidden"
                            accept="application/json"
                        />
                        <button
                            onClick={() => importInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-surface hover:bg-secondary/20 border border-secondary/20 rounded-md"
                            aria-label="Import answers from JSON file"
                        >
                            <IconUpload />
                            Import Answers
                        </button>
                        <button
                            onClick={handleExportAnswers}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-surface hover:bg-secondary/20 border border-secondary/20 rounded-md"
                            aria-label="Export answers to JSON file"
                        >
                            <IconDownload />
                            Export Answers
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <QuestionCard title="Data Classification">
                        <YesNoQuestion label="Is this data transactional (shipments, manifests, invoicing, tracking events)?" name="isTransactional" value={answers.isTransactional} onChange={v => handleAnswerChange('isTransactional', v)} />
                        <YesNoQuestion label="Is this data non-transactional (telematics logs, route metadata, performance dashboards, reference data)?" name="isNonTransactional" value={answers.isNonTransactional} onChange={v => handleAnswerChange('isNonTransactional', v)} />
                    </QuestionCard>

                    <QuestionCard title="Regulatory & Privacy">
                        <YesNoQuestion label="Is retention mandated by law or regulation (customs, safety, financial reporting, GDPR in EU contexts)?" name="isRegulated" value={answers.isRegulated} onChange={v => handleAnswerChange('isRegulated', v)} />
                        <YesNoQuestion label="Does the data include personal or sensitive information (PII, customer data, driver identifiers) that needs special handling?" name="hasPii" value={answers.hasPii} onChange={v => handleAnswerChange('hasPii', v)} />
                        <YesNoQuestion label="Is immutable/WORM storage required for audits or compliance?" name="isWormRequired" value={answers.isWormRequired} onChange={v => handleAnswerChange('isWormRequired', v)} />
                    </QuestionCard>

                    <QuestionCard title="Access & Retrieval">
                        <MultiSelectQuestion label="Who needs access to archived data?" options={Object.keys(initialAnswers.accessNeeds)} values={answers.accessNeeds} onChange={(opt, val) => handleMultiSelectChange('accessNeeds', opt, val)} />
                        <RadioQuestion label="Expected retrieval frequency (for audits, dispute resolution, reporting):" name="retrievalFrequency" options={['Frequent', 'Occasional', 'Rare']} value={answers.retrievalFrequency} onChange={v => handleAnswerChange('retrievalFrequency', v)} />
                    </QuestionCard>

                    <QuestionCard title="Retention & Lifecycle">
                        <div className="mb-4">
                            <label className="block font-medium text-text-primary">Minimum retention required (months/years) or Not Applicable:</label>
                            <input type="text" value={answers.retentionPeriod} onChange={e => handleAnswerChange('retentionPeriod', e.target.value)} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm text-text-primary" />
                        </div>
                        <YesNoQuestion label="Is phased data lifecycle needed (move from active -> nearline -> cold storage over time)?" name="isPhasedLifecycle" value={answers.isPhasedLifecycle} onChange={v => handleAnswerChange('isPhasedLifecycle', v)} />
                    </QuestionCard>
                    
                    <QuestionCard title="Business Value & Disposition">
                        <MultiSelectQuestion label="Primary purpose for keeping data:" options={Object.keys(initialAnswers.dataPurpose)} values={answers.dataPurpose} onChange={(opt, val) => handleMultiSelectChange('dataPurpose', opt, val)} />
                        <YesNoQuestion label="Can data be anonymized/pseudonymized (while keeping useful operational value)?" name="canBeAnonymized" value={answers.canBeAnonymized} onChange={v => handleAnswerChange('canBeAnonymized', v)} />
                    </QuestionCard>
                    
                    <QuestionCard title="Ownership & Stewardship">
                         <div className="mb-4">
                            <label className="block font-medium text-text-primary">Data owner / data steward (name or team, e.g., Operations, Compliance, IT):</label>
                            <input type="text" value={answers.dataOwner} onChange={e => handleAnswerChange('dataOwner', e.target.value)} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm text-text-primary" />
                        </div>
                        <YesNoQuestion label="Do we have a metadata catalog or data lineage owner to align with?" name="hasMetadataCatalog" value={answers.hasMetadataCatalog} onChange={v => handleAnswerChange('hasMetadataCatalog', v)} />
                    </QuestionCard>
                    
                     <QuestionCard title="Cost & Scale">
                        <RadioQuestion label="Expected data volume (rough tiers):" name="dataVolume" options={['Small (<100GB)', 'Medium (100GB–10TB)', 'Large (>10TB)']} value={answers.dataVolume} onChange={v => handleAnswerChange('dataVolume', v)} />
                        <YesNoQuestion label="Is there a preference for faster recall vs cost savings (Tiering: hot/warm/cold)?" name="recallPreference" value={answers.recallPreference} onChange={v => handleAnswerChange('recallPreference', v)} />
                    </QuestionCard>

                    <QuestionCard title="Operational Readiness (Optional Quick Flags)">
                        <YesNoQuestion label="Do we require integration with existing platforms (ERP, TMS, RMS, CRM) in archives?" name="needsIntegration" value={answers.needsIntegration} onChange={v => handleAnswerChange('needsIntegration', v)} />
                        <YesNoQuestion label="Any known data quality issues we should flag early?" name="hasQualityIssues" value={answers.hasQualityIssues} onChange={v => handleAnswerChange('hasQualityIssues', v)} />
                    </QuestionCard>
                </div>

                <div className="mt-8 text-center">
                     <button
                        onClick={handleGetRecommendation}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-accent hover:bg-accent/80 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 disabled:cursor-wait"
                    >
                        <IconSparkles />
                        {isLoading ? 'Analyzing...' : 'Get AI Recommendation'}
                    </button>
                </div>

                {(isLoading || result) && (
                    <div className="mt-8">
                        <QuestionCard title="AI Recommendation">
                            {isLoading && <div className="text-center text-text-secondary">Generating recommendation... please wait.</div>}
                             {result && <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }}></div>}
                        </QuestionCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialQuestionnaire;