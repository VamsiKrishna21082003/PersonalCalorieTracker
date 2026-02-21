'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from './ui/Button';
import { exportDashboardToPDF } from '@/lib/pdfExport';
import { exportDashboardToCSV } from '@/lib/csvExport';

interface SummaryStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeeklyTrend {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface GoalComparison {
  hasGoal: boolean;
  goal?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  actual?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  difference?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MacroBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  percentages?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface DashboardActionsProps {
  summaryStats: SummaryStats;
  weeklyTrend: WeeklyTrend[];
  goalComparison: GoalComparison | null;
  macroBreakdown: MacroBreakdown | null;
  dateRange: { startDate: string; endDate: string };
}

export default function DashboardActions({
  summaryStats,
  weeklyTrend,
  goalComparison,
  macroBreakdown,
  dateRange,
}: DashboardActionsProps) {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      await exportDashboardToPDF(
        summaryStats,
        weeklyTrend,
        goalComparison,
        macroBreakdown,
        dateRange
      );
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportCSV = () => {
    setExportingCSV(true);
    try {
      exportDashboardToCSV(weeklyTrend, goalComparison, dateRange);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExportingCSV(false);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={exportingPDF}
        className="flex items-center gap-2"
      >
        {exportingPDF ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Download PDF</span>
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={exportingCSV}
        className="flex items-center gap-2"
      >
        {exportingCSV ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
          </>
        )}
      </Button>
    </div>
  );
}
