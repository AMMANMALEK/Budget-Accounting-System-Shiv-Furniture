const budgetAnalysisService = require('./budgetAnalysisService');

class DashboardService {
  // Gets dashboard overview with aggregated data per cost center
  async getDashboardOverview(getAllCostCenters, getAllBudgets, getPostedRecordsForCostCenter) {
    try {
      const costCenters = await getAllCostCenters();
      const budgets = await getAllBudgets();
      
      const costCenterSummaries = [];
      let totalPlannedAmount = 0;
      let totalActualAmount = 0;
      let totalBudgetCount = 0;

      for (const costCenter of costCenters) {
        const summary = await budgetAnalysisService.getBudgetSummaryForCostCenter(
          costCenter.id,
          budgets,
          getPostedRecordsForCostCenter
        );

        if (summary.success) {
          const costCenterData = {
            ...summary.data,
            costCenterName: costCenter.name,
            costCenterDescription: costCenter.description || ''
          };
          
          costCenterSummaries.push(costCenterData);
          totalPlannedAmount += summary.data.totalPlannedAmount;
          totalActualAmount += summary.data.totalActualAmount;
          totalBudgetCount += summary.data.budgetCount;
        }
      }

      const totalRemainingAmount = totalPlannedAmount - totalActualAmount;
      const overallAchievementPercentage = budgetAnalysisService.calculateAchievementPercentage(
        totalActualAmount,
        totalPlannedAmount
      );

      return {
        success: true,
        data: {
          overview: {
            totalPlannedAmount,
            totalActualAmount,
            totalRemainingAmount,
            overallAchievementPercentage,
            totalBudgetCount,
            costCenterCount: costCenters.length,
            isOverBudget: totalActualAmount > totalPlannedAmount
          },
          costCenters: costCenterSummaries
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get dashboard overview']
      };
    }
  }

  // Gets budget performance summary
  async getBudgetPerformanceSummary(getAllBudgets, getPostedRecordsForBudget) {
    try {
      const budgets = await getAllBudgets();
      const budgetAnalyses = [];
      
      const performanceStats = {
        not_started: 0,
        under_utilized: 0,
        on_track: 0,
        near_limit: 0,
        over_budget: 0
      };

      for (const budget of budgets) {
        const analysis = await budgetAnalysisService.calculateBudgetVsActual(budget, getPostedRecordsForBudget);
        
        if (analysis.success) {
          const performanceStatus = budgetAnalysisService.getBudgetPerformanceStatus(
            analysis.data.actualAmount,
            analysis.data.plannedAmount
          );
          
          const budgetData = {
            ...analysis.data,
            performanceStatus
          };
          
          budgetAnalyses.push(budgetData);
          performanceStats[performanceStatus]++;
        }
      }

      return {
        success: true,
        data: {
          performanceStats,
          budgets: budgetAnalyses,
          totalBudgets: budgets.length
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get budget performance summary']
      };
    }
  }

  // Gets expense breakdown by cost center
  async getExpenseBreakdown(getAllCostCenters, getPostedRecordsForCostCenter, dateRange = null) {
    try {
      const costCenters = await getAllCostCenters();
      const expenseBreakdown = [];
      let totalExpenses = 0;

      for (const costCenter of costCenters) {
        const records = await getPostedRecordsForCostCenter(
          costCenter.id,
          dateRange?.startDate,
          dateRange?.endDate
        );

        const postedRecords = records.filter(record => record.status === 'posted');
        const costCenterExpenses = budgetAnalysisService.calculateActualAmount(postedRecords);
        
        expenseBreakdown.push({
          costCenterId: costCenter.id,
          costCenterName: costCenter.name,
          totalExpenses: costCenterExpenses,
          recordCount: postedRecords.length,
          percentage: 0 // Will be calculated after total is known
        });

        totalExpenses += costCenterExpenses;
      }

      // Calculate percentages
      expenseBreakdown.forEach(item => {
        item.percentage = totalExpenses > 0 
          ? Math.round((item.totalExpenses / totalExpenses) * 100 * 100) / 100
          : 0;
      });

      // Sort by expenses descending
      expenseBreakdown.sort((a, b) => b.totalExpenses - a.totalExpenses);

      return {
        success: true,
        data: {
          totalExpenses,
          dateRange: dateRange || { startDate: null, endDate: null },
          breakdown: expenseBreakdown
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get expense breakdown']
      };
    }
  }

  // Gets top spending cost centers
  async getTopSpendingCostCenters(limit = 5, getAllCostCenters, getPostedRecordsForCostCenter, dateRange = null) {
    try {
      const expenseBreakdown = await this.getExpenseBreakdown(
        getAllCostCenters,
        getPostedRecordsForCostCenter,
        dateRange
      );

      if (!expenseBreakdown.success) {
        return expenseBreakdown;
      }

      const topSpenders = expenseBreakdown.data.breakdown
        .slice(0, limit)
        .map(item => ({
          costCenterId: item.costCenterId,
          costCenterName: item.costCenterName,
          totalExpenses: item.totalExpenses,
          percentage: item.percentage,
          recordCount: item.recordCount
        }));

      return {
        success: true,
        data: {
          topSpenders,
          totalExpenses: expenseBreakdown.data.totalExpenses,
          dateRange: expenseBreakdown.data.dateRange
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get top spending cost centers']
      };
    }
  }

  // Gets budget alerts (over budget or near limit)
  async getBudgetAlerts(getAllBudgets, getPostedRecordsForBudget, thresholdPercentage = 90) {
    try {
      const budgets = await getAllBudgets();
      const alerts = [];

      for (const budget of budgets) {
        const analysis = await budgetAnalysisService.calculateBudgetVsActual(budget, getPostedRecordsForBudget);
        
        if (analysis.success) {
          const { achievementPercentage, actualAmount, plannedAmount } = analysis.data;
          
          if (achievementPercentage >= thresholdPercentage) {
            const alertType = achievementPercentage > 100 ? 'over_budget' : 'near_limit';
            
            alerts.push({
              budgetId: budget.id,
              costCenterId: budget.costCenterId,
              alertType,
              achievementPercentage,
              actualAmount,
              plannedAmount,
              excessAmount: actualAmount - plannedAmount,
              budgetPeriod: {
                startDate: budget.startDate,
                endDate: budget.endDate
              }
            });
          }
        }
      }

      // Sort by achievement percentage descending (most critical first)
      alerts.sort((a, b) => b.achievementPercentage - a.achievementPercentage);

      return {
        success: true,
        data: {
          alerts,
          alertCount: alerts.length,
          overBudgetCount: alerts.filter(alert => alert.alertType === 'over_budget').length,
          nearLimitCount: alerts.filter(alert => alert.alertType === 'near_limit').length
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get budget alerts']
      };
    }
  }

  // Gets monthly expense trends
  async getMonthlyExpenseTrends(getAllCostCenters, getPostedRecordsForDateRange, year = new Date().getFullYear()) {
    try {
      const costCenters = await getAllCostCenters();
      const monthlyData = [];

      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        
        let monthlyTotal = 0;
        const costCenterBreakdown = [];

        for (const costCenter of costCenters) {
          const records = await getPostedRecordsForDateRange(
            costCenter.id,
            startDate,
            endDate
          );

          const postedRecords = records.filter(record => record.status === 'posted');
          const costCenterAmount = budgetAnalysisService.calculateActualAmount(postedRecords);
          
          costCenterBreakdown.push({
            costCenterId: costCenter.id,
            costCenterName: costCenter.name,
            amount: costCenterAmount
          });

          monthlyTotal += costCenterAmount;
        }

        monthlyData.push({
          month,
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
          totalAmount: monthlyTotal,
          costCenters: costCenterBreakdown
        });
      }

      return {
        success: true,
        data: {
          year,
          monthlyData,
          yearTotal: monthlyData.reduce((sum, month) => sum + month.totalAmount, 0)
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get monthly expense trends']
      };
    }
  }

  // Validates user permissions for dashboard access
  validateDashboardAccess(userContext) {
    if (!userContext) {
      return {
        hasAccess: false,
        reason: 'User not authenticated'
      };
    }

    // Both admin and portal users can access dashboard (read-only)
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

  // Formats dashboard data for display
  formatDashboardData(dashboardData) {
    if (!dashboardData) {
      return null;
    }

    return {
      ...dashboardData,
      overview: {
        ...dashboardData.overview,
        formattedTotalPlannedAmount: budgetAnalysisService.formatCurrency(dashboardData.overview.totalPlannedAmount),
        formattedTotalActualAmount: budgetAnalysisService.formatCurrency(dashboardData.overview.totalActualAmount),
        formattedTotalRemainingAmount: budgetAnalysisService.formatCurrency(dashboardData.overview.totalRemainingAmount),
        formattedOverallAchievementPercentage: `${dashboardData.overview.overallAchievementPercentage}%`
      },
      costCenters: dashboardData.costCenters.map(cc => ({
        ...cc,
        formattedTotalPlannedAmount: budgetAnalysisService.formatCurrency(cc.totalPlannedAmount),
        formattedTotalActualAmount: budgetAnalysisService.formatCurrency(cc.totalActualAmount),
        formattedTotalRemainingAmount: budgetAnalysisService.formatCurrency(cc.totalRemainingAmount)
      }))
    };
  }
}

module.exports = new DashboardService();