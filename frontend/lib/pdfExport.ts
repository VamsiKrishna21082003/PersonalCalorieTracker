import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface Insights {
  goalStatus?: any;
  macroBalance?: any;
  trend?: any;
}

export async function exportDashboardToPDF(
  summaryStats: SummaryStats,
  weeklyTrend: WeeklyTrend[],
  goalComparison: GoalComparison | null,
  macroBreakdown: MacroBreakdown | null,
  dateRange: { startDate: string; endDate: string }
): Promise<void> {
  const doc = new jsPDF();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Nutrition Dashboard Report', 14, yPos);
  yPos += 10;

  // Date Range
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`, 14, yPos);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPos + 5);
  yPos += 15;

  // Summary Statistics
  doc.setFontSize(16);
  doc.text('Summary Statistics', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value', 'Unit']],
    body: [
      ['Total Calories', summaryStats.calories.toFixed(0), 'kcal'],
      ['Protein', summaryStats.protein.toFixed(1), 'g'],
      ['Carbs', summaryStats.carbs.toFixed(1), 'g'],
      ['Fat', summaryStats.fat.toFixed(1), 'g'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
  });
  yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : yPos + 50;

  // Goal Comparison
  if (goalComparison?.hasGoal) {
    doc.setFontSize(16);
    doc.text('Goal Comparison', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Goal', 'Actual', 'Difference']],
      body: [
        [
          'Calories',
          goalComparison.goal!.calories.toString(),
          goalComparison.actual!.calories.toFixed(0),
          goalComparison.difference!.calories.toFixed(0),
        ],
        [
          'Protein (g)',
          goalComparison.goal!.protein.toString(),
          goalComparison.actual!.protein.toFixed(1),
          goalComparison.difference!.protein.toFixed(1),
        ],
        [
          'Carbs (g)',
          goalComparison.goal!.carbs.toString(),
          goalComparison.actual!.carbs.toFixed(1),
          goalComparison.difference!.carbs.toFixed(1),
        ],
        [
          'Fat (g)',
          goalComparison.goal!.fat.toString(),
          goalComparison.actual!.fat.toFixed(1),
          goalComparison.difference!.fat.toFixed(1),
        ],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });
    yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : yPos + 50;
  }

  // Macro Breakdown
  if (macroBreakdown?.percentages) {
    doc.setFontSize(16);
    doc.text('Macronutrient Breakdown', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Macronutrient', 'Amount (g)', 'Percentage (%)']],
      body: [
        ['Protein', macroBreakdown.protein.toFixed(1), macroBreakdown.percentages.protein.toFixed(1)],
        ['Carbs', macroBreakdown.carbs.toFixed(1), macroBreakdown.percentages.carbs.toFixed(1)],
        ['Fat', macroBreakdown.fat.toFixed(1), macroBreakdown.percentages.fat.toFixed(1)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });
    yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : yPos + 50;
  }

  // Daily Summary
  if (weeklyTrend.length > 0) {
    doc.setFontSize(16);
    doc.text('Daily Summary', 14, yPos);
    yPos += 8;

    const dailyData = weeklyTrend.map((day) => [
      day.date,
      day.calories.toFixed(0),
      day.protein.toFixed(1),
      day.carbs.toFixed(1),
      day.fat.toFixed(1),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Calories (kcal)', 'Protein (g)', 'Carbs (g)', 'Fat (g)']],
      body: dailyData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
    });
  }

  // Save PDF
  doc.save(`nutrition-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`);
}
