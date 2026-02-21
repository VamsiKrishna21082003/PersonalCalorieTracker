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

export function exportDashboardToCSV(
  weeklyTrend: WeeklyTrend[],
  goalComparison: GoalComparison | null,
  dateRange: { startDate: string; endDate: string }
): void {
  // Create CSV content
  let csvContent = 'Nutrition Dashboard Export\n';
  csvContent += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n\n`;

  // Daily Summary
  csvContent += 'Daily Summary\n';
  csvContent += 'Date,Calories (kcal),Protein (g),Carbs (g),Fat (g)\n';
  
  weeklyTrend.forEach((day) => {
    csvContent += `${day.date},${day.calories.toFixed(2)},${day.protein.toFixed(2)},${day.carbs.toFixed(2)},${day.fat.toFixed(2)}\n`;
  });

  // Add totals
  if (weeklyTrend.length > 0) {
    const totals = weeklyTrend.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    csvContent += `\nTotal,${totals.calories.toFixed(2)},${totals.protein.toFixed(2)},${totals.carbs.toFixed(2)},${totals.fat.toFixed(2)}\n`;
    csvContent += `Average,${(totals.calories / weeklyTrend.length).toFixed(2)},${(totals.protein / weeklyTrend.length).toFixed(2)},${(totals.carbs / weeklyTrend.length).toFixed(2)},${(totals.fat / weeklyTrend.length).toFixed(2)}\n`;
  }

  // Goal Comparison
  if (goalComparison?.hasGoal) {
    csvContent += '\n\nGoal Comparison\n';
    csvContent += 'Metric,Goal,Actual,Difference\n';
    csvContent += `Calories,${goalComparison.goal!.calories},${goalComparison.actual!.calories},${goalComparison.difference!.calories.toFixed(2)}\n`;
    csvContent += `Protein (g),${goalComparison.goal!.protein},${goalComparison.actual!.protein},${goalComparison.difference!.protein.toFixed(2)}\n`;
    csvContent += `Carbs (g),${goalComparison.goal!.carbs},${goalComparison.actual!.carbs},${goalComparison.difference!.carbs.toFixed(2)}\n`;
    csvContent += `Fat (g),${goalComparison.goal!.fat},${goalComparison.actual!.fat},${goalComparison.difference!.fat.toFixed(2)}\n`;
  }

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `nutrition-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
