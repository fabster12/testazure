export enum ApplicationType {
  EXCEL_VBA = "Excel/VBA",
  SAP_MODULE = "SAP Module",
  DATABASE = "Database",
  CUSTOM_SOFTWARE = "Custom Software",
  COTS = "COTS",
  WEB_APP = "Web App",
  OTHER = "Other",
}

export enum Criticality {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

export enum Frequency {
  DAILY = "Daily",
  WEEKLY = "Weekly",
  MONTHLY = "Monthly",
  ANNUAL = "Annual",
  AD_HOC = "Ad-hoc",
}

export enum DataClassification {
  PUBLIC = "Public",
  INTERNAL = "Internal",
  CONFIDENTIAL = "Confidential",
  RESTRICTED = "Restricted",
}

export enum Complexity {
    SIMPLE = "Simple",
    MODERATE = "Moderate",
    COMPLEX = "Complex",
}

export interface Application {
  id: string;
  identification: {
    name: string;
    appId: string;
    version: string;
    type: ApplicationType;
    primaryBusinessFunction: string;
    businessOwner: string;
    itOwner: string;
    implementationDate: string;
    decommissionDate: string;
  };
  businessContext: {
    processesSupported: string;
    activeUsers: number;
    userDepartments: string;
    frequency: Frequency;
    criticality: Criticality;
    lastUseDate: string;
    archiveJustification: string;
  };
  technicalArchitecture: {
    platform: string;
    languages: string;
    database: string;
    os: string;
    infrastructure: string;
    runtimeComponents: string;
    dependencies: string;
    integrationMethod: string;
    systemRequirements: string;
  };
  dataClassification: {
    dataTypes: string;
    totalVolumeGB: number;
    growthRate: string;
    hasSensitiveData: boolean;
    classification: DataClassification;
    storageLocation: string;
    dbNames: string;
    fileSharePaths: string;
    dataFormat: string;
  };
  legalCompliance: {
    regulatoryRequirements: string;
    legalHold: boolean;
    retentionPeriod: string;
    auditTrail: boolean;
    dataResidency: string;
    industryCompliance: string;
    recordsPolicy: string;
    destructionDate: string;
  };
  dependencies: {
    upstreamSystems: string;
    downstreamSystems: string;
    sharedComponents: string;
    vendorDependencies: string;
    licenseDependencies: string;
    batchJobs: string;
    reportDependencies: string;
  };
  security: {
    authMethod: string;
    accessControl: string;
    adminPrivileges: string;
    encryption: string;
    certificates: string;
    networkRequirements: string;
    serviceAccounts: string;
  };
  documentation: {
    technicalDocs: boolean;
    userManuals: boolean;
    sourceCodeLocation: string;
    dbSchemas: boolean;
    businessProcessDocs: boolean;
    runbooks: boolean;
    knowledgeTransfer: string;
  };
  licensing: {
    vendorName: string;
    licenseType: string;
    expirationDate: string;
    annualCost: number;
    supportStatus: string;
    vendorContact: string;
    licenseKeysLocation: string;
  };
  archiveStrategy: {
    archiveFormat: string;
    archiveLocation: string;
    readOnlyAccess: boolean;
    accessFrequency: string;
    accessMethod: string;
    queryCapabilities: string;
    testingRequirements: string;
    hasNativeExport: boolean;
    nativeExportFormats: string;
    exportProcessDetails: string;
  };
  decommissioning: {
    archiveCompleted: boolean;
    userCommsSent: boolean;
    accessRevoked: boolean;
    licensesCancelled: boolean;
    infraDecommissioned: boolean;
    vendorNotified: boolean;
    finalBackup: boolean;
    signOff: boolean;
  };
  riskAssessment: {
    riskOfImproperArchive: Criticality;
    impactIfDataLost: string;
    workaround: string;
    personnelDependencies: string;
    archiveComplexity: Complexity;
  };
}

export interface ShipmentData {
  region: string;
  country: string;
  productCode: string;
  shipments: number;
  date: string; // YYYY-MM-DD
  revenue: number;
  cost: number;
  customerName: string;
}

export interface MainframeBooking {
  queryName: string;
  year: number;
  month: number;
  Country: string | null;
  recordCount: number;
  value01: string;
  value02?: string | null;
  value03?: string | null;
  value04?: string | null;
  value05?: string | null;  // SourceDescription
  value06?: string | null;  // CustomerName
}