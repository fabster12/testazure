/**
 * Data loading and processing service
 * Handles CSV parsing and data aggregation
 */

import Papa from 'papaparse';
import type {
  BookingRecord,
  ExceptionRecord,
  RevenueRecord,
  DashboardData,
  CountryBookings,
  MonthlyRevenue,
  CountryException,
  DashboardMetrics
} from '../types';

/**
 * Load and parse a CSV file
 */
async function loadCSV<T>(path: string): Promise<T[]> {
  const response = await fetch(path);
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error: Error) => reject(error)
    });
  });
}

/**
 * Process bookings data: aggregate by country
 */
function processBookings(bookings: BookingRecord[]): CountryBookings[] {
  const countryMap = new Map<string, number>();

  bookings.forEach(record => {
    const country = record.Country;
    const count = parseInt(record.RecordCount) || 0;
    countryMap.set(country, (countryMap.get(country) || 0) + count);
  });

  // Convert to array and sort by bookings (descending)
  return Array.from(countryMap.entries())
    .map(([country, totalBookings]) => ({ country, totalBookings }))
    .sort((a, b) => b.totalBookings - a.totalBookings)
    .slice(0, 15); // Top 15 countries for better visualization
}

/**
 * Process revenue data: aggregate by month
 */
function processRevenue(revenue: RevenueRecord[]): MonthlyRevenue[] {
  const monthMap = new Map<string, number>();

  revenue.forEach(record => {
    const month = `${record.YearVal}-${record.MonthVal.padStart(2, '0')}`;
    const amount = parseInt(record.Revenue_EUR) || 0;
    monthMap.set(month, (monthMap.get(month) || 0) + amount);
  });

  // Convert to array and sort by month
  return Array.from(monthMap.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Process exception data: calculate exception rate by country
 */
function processExceptions(
  bookings: BookingRecord[],
  exceptions: ExceptionRecord[]
): CountryException[] {
  // Aggregate bookings by country
  const bookingsByCountry = new Map<string, number>();
  bookings.forEach(record => {
    const country = record.Country;
    const count = parseInt(record.RecordCount) || 0;
    bookingsByCountry.set(country, (bookingsByCountry.get(country) || 0) + count);
  });

  // Aggregate exceptions by country
  const exceptionsByCountry = new Map<string, number>();
  exceptions.forEach(record => {
    const country = record.Country || 'Unknown';
    const count = parseInt(record.RecordCount) || 0;
    exceptionsByCountry.set(country, (exceptionsByCountry.get(country) || 0) + count);
  });

  // Calculate exception rates
  const results: CountryException[] = [];

  bookingsByCountry.forEach((bookingCount, country) => {
    const exceptionCount = exceptionsByCountry.get(country) || 0;
    const exceptionRate = bookingCount > 0
      ? (exceptionCount / bookingCount) * 100
      : 0;

    results.push({
      country,
      bookings: bookingCount,
      exceptions: exceptionCount,
      exceptionRate: parseFloat(exceptionRate.toFixed(2))
    });
  });

  // Sort by exception rate (descending) and take top 15
  return results
    .sort((a, b) => b.exceptionRate - a.exceptionRate)
    .slice(0, 15);
}

/**
 * Calculate dashboard summary metrics
 */
function calculateMetrics(
  bookings: BookingRecord[],
  exceptions: ExceptionRecord[],
  revenue: RevenueRecord[]
): DashboardMetrics {
  // Total bookings
  const totalBookings = bookings.reduce(
    (sum, record) => sum + (parseInt(record.RecordCount) || 0),
    0
  );

  // Total revenue
  const totalRevenue = revenue.reduce(
    (sum, record) => sum + (parseInt(record.Revenue_EUR) || 0),
    0
  );

  // Total exceptions
  const totalExceptions = exceptions.reduce(
    (sum, record) => sum + (parseInt(record.RecordCount) || 0),
    0
  );

  // Average exception rate
  const averageExceptionRate = totalBookings > 0
    ? (totalExceptions / totalBookings) * 100
    : 0;

  // Active countries (unique countries from bookings)
  const activeCountries = new Set(bookings.map(r => r.Country)).size;

  return {
    totalRevenue,
    totalBookings,
    averageExceptionRate: parseFloat(averageExceptionRate.toFixed(2)),
    activeCountries
  };
}

/**
 * Process bookings by month for trend analysis
 */
export function processMonthlyBookings(bookings: BookingRecord[]): Array<{ month: string; bookings: number }> {
  const monthMap = new Map<string, number>();

  bookings.forEach(record => {
    const month = `${record.YearVal}-${record.MonthVal.padStart(2, '0')}`;
    const count = parseInt(record.RecordCount) || 0;
    monthMap.set(month, (monthMap.get(month) || 0) + count);
  });

  return Array.from(monthMap.entries())
    .map(([month, bookings]) => ({ month, bookings }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Process booking type distribution
 */
export function processBookingTypes(bookings: BookingRecord[]): Array<{ type: string; count: number }> {
  const typeMap = new Map<string, number>();

  bookings.forEach(record => {
    const type = record.BookingType || 'Unknown';
    const count = parseInt(record.RecordCount) || 0;
    typeMap.set(type, (typeMap.get(type) || 0) + count);
  });

  return Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Process exceptions by month for trend analysis
 */
export function processMonthlyExceptions(exceptions: ExceptionRecord[]): Array<{ month: string; exceptions: number }> {
  const monthMap = new Map<string, number>();

  exceptions.forEach(record => {
    const month = `${record.YearVal}-${record.MonthVal.padStart(2, '0')}`;
    const count = parseInt(record.RecordCount) || 0;
    monthMap.set(month, (monthMap.get(month) || 0) + count);
  });

  return Array.from(monthMap.entries())
    .map(([month, exceptions]) => ({ month, exceptions }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Process ops source distribution
 */
export function processOpsSource(exceptions: ExceptionRecord[]): Array<{ source: string; count: number }> {
  const sourceMap = new Map<string, number>();

  exceptions.forEach(record => {
    const source = record.OpsSourceCode || 'Unknown';
    const count = parseInt(record.RecordCount) || 0;
    sourceMap.set(source, (sourceMap.get(source) || 0) + count);
  });

  return Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Process revenue by division
 */
export function processRevenuByDivision(revenue: RevenueRecord[]): Array<{ division: string; revenue: number }> {
  const divisionMap = new Map<string, number>();

  revenue.forEach(record => {
    const division = record.Division || 'Unknown';
    const amount = parseInt(record.Revenue_EUR) || 0;
    divisionMap.set(division, (divisionMap.get(division) || 0) + amount);
  });

  return Array.from(divisionMap.entries())
    .map(([division, revenue]) => ({ division, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Process revenue by country (top countries)
 */
export function processRevenueByCountry(revenue: RevenueRecord[]): Array<{ country: string; revenue: number }> {
  const countryMap = new Map<string, number>();

  revenue.forEach(record => {
    const country = record.Country || 'Unknown';
    const amount = parseInt(record.Revenue_EUR) || 0;
    countryMap.set(country, (countryMap.get(country) || 0) + amount);
  });

  return Array.from(countryMap.entries())
    .map(([country, revenue]) => ({ country, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15); // Top 15 countries
}

/**
 * Load all data and process it for the dashboard
 */
export async function loadDashboardData(): Promise<DashboardData> {
  console.log('Loading dashboard data...');

  try {
    // Load all CSV files in parallel
    const [bookings, exceptions, revenue] = await Promise.all([
      loadCSV<BookingRecord>('/data/01_Bookings_JK.csv'),
      loadCSV<ExceptionRecord>('/data/05_Exceptions_YH.csv'),
      loadCSV<RevenueRecord>('/data/81_TotalRevenue.csv')
    ]);

    console.log(`Loaded ${bookings.length} bookings, ${exceptions.length} exceptions, ${revenue.length} revenue records`);

    // Process data for visualizations
    const countryBookings = processBookings(bookings);
    const monthlyRevenue = processRevenue(revenue);
    const countryExceptions = processExceptions(bookings, exceptions);
    const metrics = calculateMetrics(bookings, exceptions, revenue);

    return {
      bookings,
      exceptions,
      revenue,
      metrics,
      processedData: {
        countryBookings,
        monthlyRevenue,
        countryExceptions
      }
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw error;
  }
}
