/**
 * TypeScript type definitions for the EU Dashboard
 */

// Raw CSV data types (as they come from the files)
export interface BookingRecord {
  YearVal: string;
  MonthVal: string;
  Country: string;
  BookingType: string;
  RecordCount: string;
}

export interface ExceptionRecord {
  YearVal: string;
  MonthVal: string;
  Country: string;
  RecordCount: string;
  OpsSourceCode: string;
}

export interface RevenueRecord {
  YearVal: string;
  MonthVal: string;
  Country: string;
  RecordCount: string;
  Division: string;
  Revenue_EUR: string;
}

// Processed data types (for visualization)
export interface CountryBookings {
  country: string;
  totalBookings: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface CountryException {
  country: string;
  bookings: number;
  exceptions: number;
  exceptionRate: number; // Percentage
}

// Dashboard summary metrics
export interface DashboardMetrics {
  totalRevenue: number;
  totalBookings: number;
  averageExceptionRate: number;
  activeCountries: number;
}

// All loaded data
export interface DashboardData {
  bookings: BookingRecord[];
  exceptions: ExceptionRecord[];
  revenue: RevenueRecord[];
  metrics: DashboardMetrics;
  processedData: {
    countryBookings: CountryBookings[];
    monthlyRevenue: MonthlyRevenue[];
    countryExceptions: CountryException[];
  };
}
