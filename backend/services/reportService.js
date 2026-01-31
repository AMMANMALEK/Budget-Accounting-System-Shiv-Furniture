const budgetAnalysisService = require('./budgetAnalysisService');

class ReportService {
  // Generates comprehensive budget report
  async generateBudgetReport(getAllCostCenters, getAllBudgets, getPostedRecordsForBudget, filters = {}) {
    try {
      const costCenters = await getAllCostCenters();
      const budgets = await getAllBudgets();
      
      // Apply filters
      let filteredBudgets = budgets;
      if (filters.costCenterId) {
        filteredBudgets = budgets.filter(budget => budget.costCenterId === filters.costCenterId);
      }
      if (filters.startDate || filters.endDate) {
        filteredBudgets = filteredBudgets.filter(budget => {
          const budgetStart = new Date(budget.startDate);
          const budgetEnd = new Date(budget.endDate);
          
          if (filters.startDate && budgetEnd < new Date(filters.startDate)) return false;
          if (filters.endDate && budgetStart > new Date(filters.endDate)) return false;
          return true;
        });
      }

      const reportData = [];
      let totalPlanned = 0;
      let totalActual = 0;

      for (const budget of filteredBudgets) {
        const costCenter = costCenters.find(cc => cc.id === budget.costCenterId);
        const analysis = await budgetAnalysisService.calculateBudgetVsActual(budget, getPostedRecordsForBudget);
        
        if (analysis.success) {
          const budgetData = {
            budgetId: budget.id,
            costCenterId: budget.costCenterId,
            costCenterName: costCenter?.name || 'Unknown',
            budgetDescription: budget.description || '',
            budgetPeriod: {
              startDate: budget.startDate,
              endDate: budget.endDate
            },
            plannedAmount: analysis.data.plannedAmount,
            actualAmount: analysis.data.actualAmount,
            remainingAmount: analysis.data.remainingAmount,
            achievementPercentage: analysis.data.achievementPercentage,
            performanceStatus: budgetAnalysisService.getBudgetPerformanceStatus(
              analysis.data.actualAmount,
              analysis.data.plannedAmount
            ),
            recordCount: analysis.data.recordCount,
            isOverBudget: analysis.data.isOverBudget
          };
          
          reportData.push(budgetData);
          totalPlanned += analysis.data.plannedAmount;
          totalActual += analysis.data.actualAmount;
        }
      }

      const totalRemaining = totalPlanned - totalActual;
      const overallAchievement = budgetAnalysisService.calculateAchievementPercentage(totalActual, totalPlanned);

      return {
        success: true,
        data: {
          reportMetadata: {
            generatedAt: new Date(),
            filters,
            totalBudgets: reportData.length,
            reportType: 'budget_analysis'
          },
          summary: {
            totalPlannedAmount: totalPlanned,
            totalActualAmount: totalActual,
            totalRemainingAmount: totalRemaining,
            overallAchievementPercentage: overallAchievement,
            isOverBudget: totalActual > totalPlanned
          },
          budgets: reportData
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to generate budget report']
      };
    }
  }

  // Generates expense report by cost center
  async generateExpenseReport(getAllCostCenters, getPostedRecordsForCostCenter, filters = {}) {
    try {
      const costCenters = await getAllCostCenters();
      let filteredCostCenters = costCenters;
      
      if (filters.costCenterId) {
        filteredCostCenters = costCenters.filter(cc => cc.id === filters.costCenterId);
      }

      const reportData = [];
      let totalExpenses = 0;

      for (const costCenter of filteredCostCenters) {
        const records = await getPostedRecordsForCostCenter(
          costCenter.id,
          filters.startDate,
          filters.endDate
        );

        const postedRecords = records.filter(record => record.status === 'posted');
        const costCenterExpenses = budgetAnalysisService.calculateActualAmount(postedRecords);
        
        // Group records by type
        const recordsByType = this.groupRecordsByType(postedRecords);
        
        const costCenterData = {
          costCenterId: costCenter.id,
          costCenterName: costCenter.name,
          costCenterDescription: costCenter.description || '',
          totalExpenses: costCenterExpenses,
          recordCount: postedRecords.length,
          expensesByType: recordsByType,
          records: postedRecords.map(record => ({
            id: record.id,
            type: this.getRecordType(record),
            amount: record.amount,
            description: record.description,
            date: record.date || record.invoiceDate || record.billDate || record.expenseDate,
            status: record.status
          }))
        };
        
        reportData.push(costCenterData);
        totalExpenses += costCenterExpenses;
      }

      // Calculate percentages
      reportData.forEach(item => {
        item.percentage = totalExpenses > 0 
          ? Math.round((item.totalExpenses / totalExpenses) * 100 * 100) / 100
          : 0;
      });

      // Sort by expenses descending
      reportData.sort((a, b) => b.totalExpenses - a.totalExpenses);

      return {
        success: true,
        data: {
          reportMetadata: {
            generatedAt: new Date(),
            filters,
            totalCostCenters: reportData.length,
            reportType: 'expense_analysis'
          },
          summary: {
            totalExpenses,
            totalRecords: reportData.reduce((sum, cc) => sum + cc.recordCount, 0),
            dateRange: {
              startDate: filters.startDate || null,
              endDate: filters.endDate || null
            }
          },
          costCenters: reportData
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to generate expense report']
      };
    }
  }

  // Generates variance report (budget vs actual)
  async generateVarianceReport(getAllCostCenters, getAllBudgets, getPostedRecordsForBudget, filters = {}) {
    try {
      const budgetReport = await this.generateBudgetReport(
        getAllCostCenters,
        getAllBudgets,
        getPostedRecordsForBudget,
        filters
      );

      if (!budgetReport.success) {
        return budgetReport;
      }

      const varianceData = budgetReport.data.budgets.map(budget => ({
        ...budget,
        variance: budget.actualAmount - budget.plannedAmount,
        variancePercentage: budget.plannedAmount > 0 
          ? Math.round(((budget.actualAmount - budget.plannedAmount) / budget.plannedAmount) * 100 * 100) / 100
          : 0,
        varianceType: budget.actualAmount > budget.plannedAmount ? 'unfavorable' : 'favorable'
      }));

      // Sort by variance (most unfavorable first)
      varianceData.sort((a, b) => b.variance - a.variance);

      const favorableVariances = varianceData.filter(v => v.varianceType === 'favorable');
      const unfavorableVariances = varianceData.filter(v => v.varianceType === 'unfavorable');

      return {
        success: true,
        data: {
          reportMetadata: {
            generatedAt: new Date(),
            filters,
            totalBudgets: varianceData.length,
            reportType: 'variance_analysis'
          },
          summary: {
            ...budgetReport.data.summary,
            totalVariance: budgetReport.data.summary.totalActualAmount - budgetReport.data.summary.totalPlannedAmount,
            favorableVarianceCount: favorableVariances.length,
            unfavorableVarianceCount: unfavorableVariances.length
          },
          variances: varianceData
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to generate variance report']
      };
    }
  }

  // Groups records by type (invoice, purchase bill, production expense)
  groupRecordsByType(records) {
    const grouped = {
      invoices: { count: 0, total: 0 },
      purchaseBills: { count: 0, total: 0 },
      productionExpenses: { count: 0, total: 0 }
    };

    records.forEach(record => {
      const type = this.getRecordType(record);
      if (grouped[type]) {
        grouped[type].count++;
        grouped[type].total += record.amount || 0;
      }
    });

    return grouped;
  }

  // Determines record type based on record properties
  getRecordType(record) {
    if (record.invoiceDate || record.contactId) return 'invoices';
    if (record.billDate || record.supplierId) return 'purchaseBills';
    if (record.expenseDate || record.productId) return 'productionExpenses';
    return 'invoices'; // Default fallback
  }

  // Validates user permissions for report access
  validateReportAccess(userContext) {
    if (!userContext) {
      return {
        hasAccess: false,
        reason: 'User not authenticated'
      };
    }

    // Both admin and portal users can access reports (read-only)
    if (userContext.role === 'admin' || userContext.role === 'portal') {
      return {
        hasAccess: true,
        isReadOnly: userContext.role === 'portal',
        reason: 'Access granted'
      };
    }

    return {
      hasAccess: false,
      reason: 'Insufficient permissions'
    };
  }

  // Formats report data for export
  formatReportForExport(reportData, format = 'json') {
    if (!reportData) {
      return null;
    }

    switch (format.toLowerCase()) {
      case 'csv':
        return this.formatReportAsCSV(reportData);
      case 'json':
      default:
        return this.formatReportAsJSON(reportData);
    }
  }

  // Formats report as JSON with currency formatting
  formatReportAsJSON(reportData) {
    const formatCurrency = budgetAnalysisService.formatCurrency;
    
    return {
      ...reportData,
      summary: {
        ...reportData.summary,
        formattedTotalPlannedAmount: formatCurrency(reportData.summary.totalPlannedAmount || 0),
        formattedTotalActualAmount: formatCurrency(reportData.summary.totalActualAmount || 0),
        formattedTotalRemainingAmount: formatCurrency(reportData.summary.totalRemainingAmount || 0),
        formattedTotalExpenses: formatCurrency(reportData.summary.totalExpenses || 0)
      }
    };
  }

  // Formats report as CSV (simplified implementation)
  formatReportAsCSV(reportData) {
    if (reportData.budgets) {
      // Budget report CSV
      const headers = ['Budget ID', 'Cost Center', 'Planned Amount', 'Actual Amount', 'Remaining Amount', 'Achievement %', 'Status'];
      const rows = reportData.budgets.map(budget => [
        budget.budgetId,
        budget.costCenterName,
        budget.plannedAmount,
        budget.actualAmount,
        budget.remainingAmount,
        budget.achievementPercentage,
        budget.performanceStatus
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    if (reportData.costCenters) {
      // Expense report CSV
      const headers = ['Cost Center', 'Total Expenses', 'Record Count', 'Percentage'];
      const rows = reportData.costCenters.map(cc => [
        cc.costCenterName,
        cc.totalExpenses,
        cc.recordCount,
        cc.percentage
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return 'No data available for CSV export';
  }
}

module.exports = new ReportService();