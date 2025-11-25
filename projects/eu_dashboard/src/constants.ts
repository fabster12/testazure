import { Application, ApplicationType, Criticality, Frequency, DataClassification, Complexity, ShipmentData, MainframeBooking } from './types';

export const sampleApplications: Application[] = [
  {
    id: 'app-001',
    identification: {
      name: 'Legacy CRM',
      appId: 'CRM001',
      version: '2.3.1',
      type: ApplicationType.CUSTOM_SOFTWARE,
      primaryBusinessFunction: 'Customer Relationship Management',
      businessOwner: 'John Doe',
      itOwner: 'Jane Smith',
      implementationDate: '2005-06-15',
      decommissionDate: '2024-12-31',
    },
    businessContext: {
      processesSupported: 'Sales, Marketing Campaigns',
      activeUsers: 50,
      userDepartments: 'Sales, Marketing',
      frequency: Frequency.DAILY,
      criticality: Criticality.HIGH,
      lastUseDate: '2024-03-01',
      archiveJustification: 'Replaced by new Salesforce instance.',
    },
    technicalArchitecture: {
        platform: 'Windows Server 2008',
        languages: 'C#, VB.NET',
        database: 'SQL Server 2008 R2',
        os: 'Windows Server 2008',
        infrastructure: 'On-premise Virtual Machine (VMWare)',
        runtimeComponents: '.NET Framework 3.5',
        dependencies: 'Internal Auth Service',
        integrationMethod: 'Nightly file transfer (FTP)',
        systemRequirements: 'IE8, 2GB RAM'
    },
    dataClassification: {
        dataTypes: 'Customer Data, Sales Transactions',
        totalVolumeGB: 250,
        growthRate: '10GB/year (inactive)',
        hasSensitiveData: true,
        classification: DataClassification.CONFIDENTIAL,
        storageLocation: 'SAN Array X',
        dbNames: 'CRM_PROD, CRM_LOG',
        fileSharePaths: '\\\\fileserver\\crm_docs',
        dataFormat: 'Structured (SQL), Unstructured (PDFs)'
    },
    legalCompliance: {
        regulatoryRequirements: 'SOX, GDPR',
        legalHold: false,
        retentionPeriod: '7 years post-customer inactivity',
        auditTrail: true,
        dataResidency: 'USA',
        industryCompliance: 'N/A',
        recordsPolicy: 'CORP-REC-001',
        destructionDate: '2031-12-31'
    },
    dependencies: {
        upstreamSystems: 'Marketing Automation Platform',
        downstreamSystems: 'Billing System, Data Warehouse',
        sharedComponents: 'N/A',
        vendorDependencies: 'N/A',
        licenseDependencies: 'SQL Server 2008 License',
        batchJobs: 'Nightly data sync, Weekly report generation',
        reportDependencies: 'Q3 Sales Report'
    },
    security: {
        authMethod: 'Active Directory',
        accessControl: 'Role-based security groups',
        adminPrivileges: 'DBA, System Admin',
        encryption: 'None at rest, SSL for transport',
        certificates: 'Internal CA Cert (expired)',
        networkRequirements: 'Internal network access only',
        serviceAccounts: 'svc_crm_batch'
    },
    documentation: {
        technicalDocs: true,
        userManuals: false,
        sourceCodeLocation: 'SVN Repo (//svn/crm/trunk)',
        dbSchemas: true,
        businessProcessDocs: false,
        runbooks: true,
        knowledgeTransfer: 'Walkthrough with dev team required.'
    },
    licensing: {
        vendorName: 'In-house',
        licenseType: 'N/A',
        expirationDate: 'N/A',
        annualCost: 0,
        supportStatus: 'End-of-life',
        vendorContact: 'N/A',
        licenseKeysLocation: 'N/A'
    },
    archiveStrategy: {
        archiveFormat: 'SQL Bak file, Zipped file share',
        archiveLocation: 'Azure Blob Storage (Cold Tier)',
        readOnlyAccess: true,
        accessFrequency: 'Rarely, for legal discovery',
        accessMethod: 'Restored VM on demand',
        queryCapabilities: 'SQL queries on restored DB',
        testingRequirements: 'Confirm DB can be restored and queried.',
        hasNativeExport: true,
        nativeExportFormats: 'CSV, PDF',
        exportProcessDetails: 'Individual reports can be exported to CSV or PDF from the UI. Full data export requires database access and custom scripting.'
    },
    decommissioning: {
        archiveCompleted: false,
        userCommsSent: false,
        accessRevoked: false,
        licensesCancelled: false,
        infraDecommissioned: false,
        vendorNotified: false,
        finalBackup: false,
        signOff: false
    },
    riskAssessment: {
        riskOfImproperArchive: Criticality.HIGH,
        impactIfDataLost: 'Regulatory fines, loss of historical sales data.',
        workaround: 'None',
        personnelDependencies: 'Jane Smith (only one who knows the system)',
        archiveComplexity: Complexity.MODERATE
    }
  },
  {
    id: 'app-002',
    identification: {
      name: 'Q3 Reporting Spreadsheet',
      appId: 'FIN-RPT-003',
      version: '4.2',
      type: ApplicationType.EXCEL_VBA,
      primaryBusinessFunction: 'Financial Reporting',
      businessOwner: 'Alice Johnson',
      itOwner: 'Finance IT',
      implementationDate: '2015-01-20',
      decommissionDate: '2024-09-30',
    },
    businessContext: {
      processesSupported: 'Quarterly financial close',
      activeUsers: 5,
      userDepartments: 'Finance',
      frequency: Frequency.MONTHLY,
      criticality: Criticality.MEDIUM,
      lastUseDate: '2024-04-15',
      archiveJustification: 'Functionality moved to new ERP system.',
    },
     technicalArchitecture: {
        platform: 'Microsoft Excel',
        languages: 'VBA',
        database: 'N/A (Connects to SQL Server)',
        os: 'Windows 10/11',
        infrastructure: 'User desktops, File Share',
        runtimeComponents: 'Microsoft Office 365',
        dependencies: 'ODBC Driver for SQL Server',
        integrationMethod: 'Direct DB Connection (ODBC)',
        systemRequirements: 'Excel with Macros enabled'
    },
    dataClassification: {
        dataTypes: 'Financial Data',
        totalVolumeGB: 0.1,
        growthRate: '10MB/quarter (inactive)',
        hasSensitiveData: true,
        classification: DataClassification.RESTRICTED,
        storageLocation: '\\\\fileserver\\finance\\reports',
        dbNames: 'N/A',
        fileSharePaths: '\\\\fileserver\\finance\\reports',
        dataFormat: 'Excel (.xlsm)'
    },
    legalCompliance: {
        regulatoryRequirements: 'SOX',
        legalHold: false,
        retentionPeriod: '10 years',
        auditTrail: false,
        dataResidency: 'USA',
        industryCompliance: 'N/A',
        recordsPolicy: 'FIN-REC-005',
        destructionDate: '2034-09-30'
    },
    dependencies: {
        upstreamSystems: 'Data Warehouse (via ODBC)',
        downstreamSystems: 'N/A (manual copy-paste)',
        sharedComponents: 'N/A',
        vendorDependencies: 'N/A',
        licenseDependencies: 'Microsoft Office',
        batchJobs: 'N/A',
        reportDependencies: 'CFO Quarterly Briefing'
    },
    security: {
        authMethod: 'File System Permissions',
        accessControl: 'AD Group: Finance-Reports-RW',
        adminPrivileges: 'N/A',
        encryption: 'None',
        certificates: 'N/A',
        networkRequirements: 'Internal network',
        serviceAccounts: 'N/A'
    },
    documentation: {
        technicalDocs: false,
        userManuals: false,
        sourceCodeLocation: 'Embedded in .xlsm file',
        dbSchemas: false,
        businessProcessDocs: true,
        runbooks: false,
        knowledgeTransfer: 'N/A'
    },
    licensing: {
        vendorName: 'Microsoft',
        licenseType: 'Subscription',
        expirationDate: 'Varies by user',
        annualCost: 0,
        supportStatus: 'Active',
        vendorContact: 'N/A',
        licenseKeysLocation: 'N/A'
    },
    archiveStrategy: {
        archiveFormat: 'Zipped .xlsm file',
        archiveLocation: 'SharePoint Document Library (Archive)',
        readOnlyAccess: false,
        accessFrequency: 'Potentially annually for audit',
        accessMethod: 'Download and open in Excel',
        queryCapabilities: 'N/A',
        testingRequirements: 'Confirm file opens and macros are preserved.',
        hasNativeExport: true,
        nativeExportFormats: 'Excel, CSV',
        exportProcessDetails: 'File > Save As allows for CSV export. Data is already in Excel format.'
    },
    decommissioning: {
        archiveCompleted: false,
        userCommsSent: false,
        accessRevoked: false,
        licensesCancelled: false,
        infraDecommissioned: false,
        vendorNotified: false,
        finalBackup: false,
        signOff: false
    },
    riskAssessment: {
        riskOfImproperArchive: Criticality.MEDIUM,
        impactIfDataLost: 'Inability to answer historical audit questions.',
        workaround: 'Manual data reconstruction from ERP (difficult).',
        personnelDependencies: 'N/A',
        archiveComplexity: Complexity.SIMPLE
    }
  },
    {
    id: 'app-003',
    identification: {
      name: 'Supplier Contact Database',
      appId: 'PROC-DB-001',
      version: '1.0',
      type: ApplicationType.DATABASE,
      primaryBusinessFunction: 'Supplier Management',
      businessOwner: 'Mark Chen',
      itOwner: 'IT Support',
      implementationDate: '2002-11-01',
      decommissionDate: '2023-06-30',
    },
    businessContext: {
      processesSupported: 'Storing vendor contact information',
      activeUsers: 10,
      userDepartments: 'Procurement',
      frequency: Frequency.WEEKLY,
      criticality: Criticality.LOW,
      lastUseDate: '2023-05-15',
      archiveJustification: 'Vendor data migrated to central ERP system.',
    },
     technicalArchitecture: {
        platform: 'Microsoft Access',
        languages: 'VBA',
        database: 'MS Access 2003',
        os: 'Windows XP/7',
        infrastructure: 'File Share',
        runtimeComponents: 'MS Access Runtime',
        dependencies: 'N/A',
        integrationMethod: 'Manual Entry',
        systemRequirements: 'Microsoft Access 2003 or later'
    },
    dataClassification: {
        dataTypes: 'Supplier names, contacts, addresses',
        totalVolumeGB: 0.05,
        growthRate: 'Inactive',
        hasSensitiveData: false,
        classification: DataClassification.INTERNAL,
        storageLocation: '\\\\fileserver\\procurement\\database.mdb',
        dbNames: 'N/A',
        fileSharePaths: 'N/A',
        dataFormat: 'MS Access (.mdb)'
    },
    legalCompliance: {
        regulatoryRequirements: 'N/A',
        legalHold: false,
        retentionPeriod: '5 years',
        auditTrail: false,
        dataResidency: 'Canada',
        industryCompliance: 'N/A',
        recordsPolicy: 'PROC-REC-002',
        destructionDate: '2028-06-30'
    },
    dependencies: {
        upstreamSystems: 'N/A',
        downstreamSystems: 'N/A',
        sharedComponents: 'N/A',
        vendorDependencies: 'N/A',
        licenseDependencies: 'Microsoft Office',
        batchJobs: 'N/A',
        reportDependencies: 'N/A'
    },
    security: {
        authMethod: 'File System Permissions',
        accessControl: 'AD Group: Procurement-Users',
        adminPrivileges: 'N/A',
        encryption: 'None',
        certificates: 'N/A',
        networkRequirements: 'Internal network',
        serviceAccounts: 'N/A'
    },
    documentation: {
        technicalDocs: false,
        userManuals: true,
        sourceCodeLocation: 'N/A',
        dbSchemas: false,
        businessProcessDocs: false,
        runbooks: false,
        knowledgeTransfer: 'N/A'
    },
    licensing: {
        vendorName: 'Microsoft',
        licenseType: 'Perpetual',
        expirationDate: 'N/A',
        annualCost: 0,
        supportStatus: 'Unsupported',
        vendorContact: 'N/A',
        licenseKeysLocation: 'N/A'
    },
    archiveStrategy: {
        archiveFormat: '.mdb file',
        archiveLocation: 'SharePoint',
        readOnlyAccess: true,
        accessFrequency: 'Rarely',
        accessMethod: 'Open with modern MS Access',
        queryCapabilities: 'SQL View within MS Access',
        testingRequirements: 'Confirm file opens and tables are readable.',
        hasNativeExport: true,
        nativeExportFormats: 'CSV, Excel',
        exportProcessDetails: 'Built-in MS Access export wizards can be used to export individual tables to CSV or Excel.'
    },
    decommissioning: {
        archiveCompleted: true,
        userCommsSent: true,
        accessRevoked: true,
        licensesCancelled: false,
        infraDecommissioned: true,
        vendorNotified: false,
        finalBackup: true,
        signOff: true
    },
    riskAssessment: {
        riskOfImproperArchive: Criticality.LOW,
        impactIfDataLost: 'Minor inconvenience, data exists in ERP.',
        workaround: 'Check ERP system for vendor data.',
        personnelDependencies: 'N/A',
        archiveComplexity: Complexity.SIMPLE
    }
  },
  {
    id: 'app-004',
    identification: {
      name: 'Internal Project Wiki',
      appId: 'WIKI-001',
      version: '1.5',
      type: ApplicationType.WEB_APP,
      primaryBusinessFunction: 'Internal Knowledge Sharing',
      businessOwner: 'Project Management Office',
      itOwner: 'DevOps Team',
      implementationDate: '2010-03-10',
      decommissionDate: '2024-01-01',
    },
    businessContext: {
      processesSupported: 'Project documentation, team collaboration',
      activeUsers: 150,
      userDepartments: 'Engineering, PMO, Product',
      frequency: Frequency.DAILY,
      criticality: Criticality.MEDIUM,
      lastUseDate: '2023-12-20',
      archiveJustification: 'Replaced by Confluence Cloud.',
    },
     technicalArchitecture: {
        platform: 'LAMP Stack',
        languages: 'PHP 5.2',
        database: 'MySQL 5.0',
        os: 'CentOS 5',
        infrastructure: 'On-premise VM (KVM)',
        runtimeComponents: 'Apache 2.2',
        dependencies: 'N/A',
        integrationMethod: 'N/A',
        systemRequirements: 'Web browser'
    },
    dataClassification: {
        dataTypes: 'Project plans, technical specs, meeting notes',
        totalVolumeGB: 50,
        growthRate: 'Inactive',
        hasSensitiveData: true,
        classification: DataClassification.INTERNAL,
        storageLocation: 'Local VM Disk',
        dbNames: 'project_wiki_db',
        fileSharePaths: '/var/www/html/wiki/uploads',
        dataFormat: 'HTML, Text, Images'
    },
    legalCompliance: {
        regulatoryRequirements: 'N/A',
        legalHold: false,
        retentionPeriod: '3 years post-project completion',
        auditTrail: true,
        dataResidency: 'USA',
        industryCompliance: 'N/A',
        recordsPolicy: 'ENG-REC-009',
        destructionDate: 'Varies'
    },
    dependencies: {
        upstreamSystems: 'N/A',
        downstreamSystems: 'N/A',
        sharedComponents: 'N/A',
        vendorDependencies: 'N/A',
        licenseDependencies: 'N/A (All open source)',
        batchJobs: 'N/A',
        reportDependencies: 'N/A'
    },
    security: {
        authMethod: 'Local user accounts',
        accessControl: 'Per-page ACLs',
        adminPrivileges: 'WikiSysop',
        encryption: 'None',
        certificates: 'Self-signed SSL (expired)',
        networkRequirements: 'Internal network only',
        serviceAccounts: 'N/A'
    },
    documentation: {
        technicalDocs: true,
        userManuals: false,
        sourceCodeLocation: 'GitLab Repo',
        dbSchemas: true,
        businessProcessDocs: false,
        runbooks: true,
        knowledgeTransfer: 'DevOps team has basic knowledge.'
    },
    licensing: {
        vendorName: 'N/A',
        licenseType: 'Open Source (GPL)',
        expirationDate: 'N/A',
        annualCost: 0,
        supportStatus: 'End-of-life',
        vendorContact: 'N/A',
        licenseKeysLocation: 'N/A'
    },
    archiveStrategy: {
        archiveFormat: 'SQL Dump, Zipped file directory',
        archiveLocation: 'S3 Glacier',
        readOnlyAccess: true,
        accessFrequency: 'Never expected',
        accessMethod: 'Spin up new VM from image and restore data',
        queryCapabilities: 'SQL queries on restored DB',
        testingRequirements: 'Confirm data restore process.',
        hasNativeExport: true,
        nativeExportFormats: 'SQL Dump',
        exportProcessDetails: 'A full MySQL dump is the only supported export method. No front-end export feature for users.'
    },
    decommissioning: {
        archiveCompleted: false,
        userCommsSent: true,
        accessRevoked: true,
        licensesCancelled: true,
        infraDecommissioned: false,
        vendorNotified: true,
        finalBackup: false,
        signOff: false
    },
    riskAssessment: {
        riskOfImproperArchive: Criticality.MEDIUM,
        impactIfDataLost: 'Loss of historical project data, potential IP loss.',
        workaround: 'Find similar docs in Confluence (unlikely).',
        personnelDependencies: 'N/A',
        archiveComplexity: Complexity.COMPLEX
    }
  },
  {
    id: 'app-005',
    identification: {
      name: 'Desktop Publishing Pro v5',
      appId: 'DPP-5',
      version: '5.1.2',
      type: ApplicationType.COTS,
      primaryBusinessFunction: 'Marketing Material Creation',
      businessOwner: 'Marketing Dept',
      itOwner: 'Desktop Support',
      implementationDate: '2008-07-20',
      decommissionDate: '2022-12-31',
    },
    businessContext: {
      processesSupported: 'Creating brochures, flyers',
      activeUsers: 2,
      userDepartments: 'Marketing',
      frequency: Frequency.AD_HOC,
      criticality: Criticality.LOW,
      lastUseDate: '2022-10-01',
      archiveJustification: 'Obsolete, unsupported version. Replaced by Adobe Creative Suite.',
    },
     technicalArchitecture: {
        platform: 'Windows',
        languages: 'N/A',
        database: 'N/A',
        os: 'Windows 7',
        infrastructure: 'User Desktops',
        runtimeComponents: 'N/A',
        dependencies: 'N/A',
        integrationMethod: 'N/A',
        systemRequirements: 'Windows 7, 4GB RAM'
    },
    dataClassification: {
        dataTypes: 'Marketing documents',
        totalVolumeGB: 20,
        growthRate: 'Inactive',
        hasSensitiveData: false,
        classification: DataClassification.PUBLIC,
        storageLocation: '\\\\fileserver\\marketing\\dpp_projects',
        dbNames: 'N/A',
        fileSharePaths: 'N/A',
        dataFormat: 'Proprietary (.dpp)'
    },
    legalCompliance: {
        regulatoryRequirements: 'N/A',
        legalHold: true,
        retentionPeriod: 'As per project',
        auditTrail: false,
        dataResidency: 'USA',
        industryCompliance: 'N/A',
        recordsPolicy: 'MKT-REC-001',
        destructionDate: 'N/A'
    },
    dependencies: {
        upstreamSystems: 'N/A',
        downstreamSystems: 'N/A',
        sharedComponents: 'Corporate Font Pack',
        vendorDependencies: 'N/A',
        licenseDependencies: 'N/A',
        batchJobs: 'N/A',
        reportDependencies: 'N/A'
    },
    security: {
        authMethod: 'N/A',
        accessControl: 'File System Permissions',
        adminPrivileges: 'N/A',
        encryption: 'None',
        certificates: 'N/A',
        networkRequirements: 'N/A',
        serviceAccounts: 'N/A'
    },
    documentation: {
        technicalDocs: false,
        userManuals: true,
        sourceCodeLocation: 'N/A',
        dbSchemas: false,
        businessProcessDocs: false,
        runbooks: false,
        knowledgeTransfer: 'N/A'
    },
    licensing: {
        vendorName: 'PublishCorp',
        licenseType: 'Perpetual',
        expirationDate: 'N/A',
        annualCost: 0,
        supportStatus: 'Unsupported',
        vendorContact: 'N/A',
        licenseKeysLocation: 'License server (decommissioned)'
    },
    archiveStrategy: {
        archiveFormat: 'Zip of project files, PDF exports',
        archiveLocation: 'SharePoint',
        readOnlyAccess: false,
        accessFrequency: 'Rarely',
        accessMethod: 'Request from IT, manual file open',
        queryCapabilities: 'N/A',
        testingRequirements: 'Confirm PDF files are readable.',
        hasNativeExport: false,
        nativeExportFormats: 'PDF, JPG',
        exportProcessDetails: 'The application uses a proprietary file format (.dpp). Individual files can be exported/printed to PDF, but no bulk export exists.'
    },
    decommissioning: {
        archiveCompleted: true,
        userCommsSent: true,
        accessRevoked: true,
        licensesCancelled: true,
        infraDecommissioned: true,
        vendorNotified: true,
        finalBackup: true,
        signOff: true
    },
    riskAssessment: {
        riskOfImproperArchive: Criticality.LOW,
        impactIfDataLost: 'Marketing would need to recreate old materials if requested.',
        workaround: 'Recreate using Adobe InDesign.',
        personnelDependencies: 'N/A',
        archiveComplexity: Complexity.MODERATE
    }
  },
];

const customerNames = [
    "Global Imports Inc.", "Euro Logistics", "Tech Solutions BV", "Nordic Goods", "Iberian Partners",
    "Alpine Traders", "Britannia Exporters", "Central Transport", "Innovate Corp", "Rapid Ship DE",
    "Parisian Freight", "Roman Deliveries", "Amsterdam Movers", "Warsaw Connect", "Vienna Cargo",
    "Brussels Forwarding"
];


export const europeanDashboardData: ShipmentData[] = [
    // Previous Month Data (December 2024)
    { region: 'Europe', country: 'Germany', productCode: 'International', shipments: 2100, date: '2024-12-15', revenue: 105000, cost: 84000, customerName: "Global Imports Inc." },
    { region: 'Europe', country: 'Germany', productCode: 'Domestic', shipments: 1450, date: '2024-12-10', revenue: 43500, cost: 39150, customerName: "Rapid Ship DE" },
    { region: 'Europe', country: 'France', productCode: 'International', shipments: 1750, date: '2024-12-20', revenue: 96250, cost: 77000, customerName: "Parisian Freight" },
    { region: 'Europe', country: 'UK', productCode: 'International', shipments: 1400, date: '2024-12-25', revenue: 84000, cost: 71400, customerName: "Britannia Exporters" },
    { region: 'Europe', country: 'Spain', productCode: 'Domestic', shipments: 700, date: '2024-12-22', revenue: 17500, cost: 15750, customerName: "Iberian Partners" },
    { region: 'Europe', country: 'Italy', productCode: 'International', shipments: 1050, date: '2024-12-05', revenue: 57750, cost: 49087, customerName: "Roman Deliveries" },
    { region: 'Europe', country: 'Netherlands', productCode: 'Special', shipments: 90, date: '2024-12-01', revenue: 13500, cost: 9450, customerName: "Amsterdam Movers" },
    { region: 'Europe', country: 'Poland', productCode: 'Domestic', shipments: 1150, date: '2024-12-14', revenue: 28750, cost: 24437, customerName: "Warsaw Connect" },
    { region: 'Europe', country: 'Belgium', productCode: 'International', shipments: 650, date: '2024-12-18', revenue: 35750, cost: 28600, customerName: "Brussels Forwarding" },
    { region: 'Europe', country: 'Austria', productCode: 'International', shipments: 300, date: '2024-12-20', revenue: 18000, cost: 13500, customerName: "Vienna Cargo" },

    // Current Month Data (January 2025)
    { region: 'Europe', country: 'Germany', productCode: 'International', shipments: 2050, date: '2025-01-15', revenue: 102500, cost: 82000, customerName: "Global Imports Inc." },
    { region: 'Europe', country: 'Germany', productCode: 'Domestic', shipments: 1300, date: '2025-01-10', revenue: 39000, cost: 35100, customerName: "Rapid Ship DE" },
    { region: 'Europe', country: 'Germany', productCode: 'Special', shipments: 150, date: '2025-01-05', revenue: 22500, cost: 15750, customerName: "Innovate Corp" },
    { region: 'Europe', country: 'France', productCode: 'International', shipments: 1800, date: '2025-01-20', revenue: 99000, cost: 79200, customerName: "Parisian Freight" },
    { region: 'Europe', country: 'France', productCode: 'Domestic', shipments: 1100, date: '2025-01-12', revenue: 33000, cost: 29700, customerName: "Euro Logistics" },
    { region: 'Europe', country: 'France', productCode: 'Special', shipments: 210, date: '2025-01-20', revenue: 31500, cost: 22050, customerName: "Tech Solutions BV" },
    { region: 'Europe', country: 'UK', productCode: 'International', shipments: 1500, date: '2025-01-25', revenue: 90000, cost: 76500, customerName: "Britannia Exporters" },
    { region: 'Europe', country: 'UK', productCode: 'Domestic', shipments: 850, date: '2025-01-18', revenue: 25500, cost: 22950, customerName: "Central Transport" },
    { region: 'Europe', country: 'Spain', productCode: 'International', shipments: 1300, date: '2025-01-10', revenue: 71500, cost: 57200, customerName: "Iberian Partners" },
    { region: 'Europe', country: 'Spain', productCode: 'Domestic', shipments: 650, date: '2025-01-22', revenue: 16250, cost: 14625, customerName: "Iberian Partners" },
    { region: 'Europe', country: 'Italy', productCode: 'International', shipments: 1100, date: '2025-01-05', revenue: 60500, cost: 51425, customerName: "Roman Deliveries" },
    { region: 'Europe', country: 'Italy', productCode: 'Domestic', shipments: 600, date: '2025-01-30', revenue: 18000, cost: 16200, customerName: "Roman Deliveries" },
    { region: 'Europe', country: 'Netherlands', productCode: 'International', shipments: 950, date: '2025-01-15', revenue: 52250, cost: 41800, customerName: "Amsterdam Movers" },
    { region: 'Europe', country: 'Poland', productCode: 'International', shipments: 800, date: '2025-01-10', revenue: 40000, cost: 32000, customerName: "Warsaw Connect" },
    { region: 'Europe', country: 'Poland', productCode: 'Domestic', shipments: 1200, date: '2025-01-14', revenue: 30000, cost: 25500, customerName: "Warsaw Connect" },
    { region: 'Europe', country: 'Belgium', productCode: 'International', shipments: 700, date: '2025-01-18', revenue: 38500, cost: 30800, customerName: "Brussels Forwarding" },
    { region: 'Europe', country: 'Belgium', productCode: 'Domestic', shipments: 400, date: '2025-01-25', revenue: 12000, cost: 10800, customerName: "Euro Logistics" },
    { region: 'Europe', country: 'Austria', productCode: 'International', shipments: 350, date: '2025-01-20', revenue: 21000, cost: 15750, customerName: "Vienna Cargo" },
    { region: 'Europe', country: 'Switzerland', productCode: 'International', shipments: 450, date: '2025-01-22', revenue: 31500, cost: 23625, customerName: "Alpine Traders" },
    { region: 'Europe', country: 'Portugal', productCode: 'International', shipments: 550, date: '2025-01-28', revenue: 30250, cost: 24200, customerName: "Iberian Partners" },
    { region: 'Europe', country: 'Sweden', productCode: 'International', shipments: 600, date: '2025-01-19', revenue: 36000, cost: 28800, customerName: "Nordic Goods" },
    { region: 'Europe', country: 'Denmark', productCode: 'International', shipments: 400, date: '2025-01-21', revenue: 24000, cost: 19200, customerName: "Nordic Goods" },
    { region: 'Europe', country: 'Norway', productCode: 'Special', shipments: 100, date: '2025-01-23', revenue: 18000, cost: 12600, customerName: "Nordic Goods" },
    { region: 'Europe', country: 'Sweden', productCode: 'Domestic', shipments: 300, date: '2025-01-15', revenue: 9000, cost: 8100, customerName: "Nordic Goods" },
];
