/**
 * Budget Analysis Service
 * 
 * This service provides comprehensive budget analysis and comparison functionality.
 * It calculates budget vs actual performance, tracks achievement percentages,
 * and provides insights into budget utilization across cost centers.
 * 
 * Key Features:
 * - Budget vs actual calculations for individual budgets
 * - Multi-budget analysis and aggregation
 * - Cost center budget summaries
 * - Achievement percentage calculations
 * - Budget performance status determination
 * - Record inclusion validation for budget periods
 * - Currency formatting utilities
 * 
 * Performance Status Categories:
 * - not_started: 0% achievement
 * - under_utilized: < 50% achievement
 * - on_track: 50-90% achievement
 * - near_limit: 90-100% achievement
 * - over_budget: > 100% achievement
 * 
 * This service is crucial for financial reporting, dashboard displays, and
 * budget monitoring throughout the organization.
 */
class BudgetAnalysisService {
  // Calculates budget vs actual for a specific budget
  async calculateBudgetVsActual(budget, getPostedRecordsForBudget) {
    if (!budget) {
      return {
        success: false,
        errors: ['Budget is required']
      };
    }

    if (!budget.costCenterId || !budget.startDate || !budget.endDate || budget.plannedAmount === undefined) {
      return {
        success: false,
        errors: ['Budget must have costCenterId, startDate, endDate, and plannedAmount']
      };
    }

    try {
      // Get all posted records for this budget period and cost center
      const postedRecords = await getPostedRecordsForBudget(
        budget.costCenterId,
        budget.startDate,
        budget.endDate
      );

      // Calculate actual amount from posted records only
      const actualAmount = this.calculateActualAmount(postedRecords);
      
      // Calculate remaining amount
      const remainingAmount = budget.plannedAmount - actualAmount;
      
      // Calculate achievement percentage
      const achievementPercentage = this.calculateAchievementPercentage(actualAmount, budget.plannedAmount);

      return {
        success: true,
        data: {
          budgetId: budget.id,
          costCenterId: budget.costCenterId,
          budgetPeriod: {
            startDate: budget.startDate,
            endDate: budget.endDate
          },
          plannedAmount: budget.plannedAmount,
          actualAmount,
          remainingAmount,
          achievementPercentage,
          recordCount: postedRecords.length,
          isOverBudget: actualAmount > budget.plannedAmount
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to calculate budget vs actual']
      };
    }
  }

  // Calculates actual amount from posted records
  calculateActualAmount(postedRecords) {
    if (!postedRecords || postedRecords.length === 0) {
      return 0;
    }

    return postedRecords
      .filter(record => record.status === 'posted') // Only include posted records
      .reduce((total, record) => total + (record.amount || 0), 0);
  }

  // Calculates achievement percentage
  calculateAchievementPercentage(actualAmount, plannedAmount) {
    if (!plannedAmount || plannedAmount <= 0) {
      return 0;
    }

    return Math.round((actualAmount / plannedAmount) * 100 * 100) / 100; // Round to 2 decimal places
  }

  // Calculates budget vs actual for multiple budgets
  async calculateMultipleBudgetsVsActual(budgets, getPostedRecordsForBudget) {
    if (!budgets || budgets.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    try {
      const results = [];
      
      for (const budget of budgets) {
        try {
          const result = await this.calculateBudgetVsActual(budget, getPostedRecordsForBudget);
          if (result.success) {
            results.push(result.data);
          }
        } catch (error) {
          // Continue processing other budgets even if one fails
          continue;
        }
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to calculate multiple budgets vs actual']
      };
    }
  }

  // Gets budget summary for a cost center
  async getBudgetSummaryForCostCenter(costCenterId, budgets, getPostedRecordsForCostCenter) {
    if (!costCenterId) {
      return {
        success: false,
        errors: ['Cost center ID is required']
      };
    }

    try {
      // Filter budgets for this cost center
      const costCenterBudgets = budgets.filter(budget => budget.costCenterId === costCenterId);
      
      if (costCenterBudgets.length === 0) {
        return {
          success: true,
          data: {
            costCenterId,
            totalPlannedAmount: 0,
            totalActualAmount: 0,
            totalRemainingAmount: 0,
            overallAchievementPercentage: 0,
            budgetCount: 0,
            budgets: []
          }
        };
      }

      // Calculate totals
      let totalPlannedAmount = 0;
      let totalActualAmount = 0;
      const budgetDetails = [];

      for (const budget of costCenterBudgets) {
        const result = await this.calculateBudgetVsActual(budget, async (costCenterId, startDate, endDate) => {
          return await getPostedRecordsForCostCenter(costCenterId, startDate, endDate);
        });

        if (result.success) {
          totalPlannedAmount += result.data.plannedAmount;
          totalActualAmount += result.data.actualAmount;
          budgetDetails.push(result.data);
        }
      }

      const totalRemainingAmount = totalPlannedAmount - totalActualAmount;
      const overallAchievementPercentage = this.calculateAchievementPercentage(totalActualAmount, totalPlannedAmount);

      return {
        success: true,
        data: {
          costCenterId,
          totalPlannedAmount,
          totalActualAmount,
          totalRemainingAmount,
          overallAchievementPercentage,
          budgetCount: costCenterBudgets.length,
          isOverBudget: totalActualAmount > totalPlannedAmount,
          budgets: budgetDetails
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to get budget summary for cost center']
      };
    }
  }

  // Validates if a record should be included in budget calculations
  isRecordIncludedInBudget(record, budget) {
    // Must be posted
    if (record.status !== 'posted') {
      return false;
    }

    // Must match cost center
    if (record.costCenterId !== budget.costCenterId) {
      return false;
    }

    // Must be within budget period
    const recordDate = new Date(record.date || record.invoiceDate || record.billDate || record.expenseDate);
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);

    return recordDate >= budgetStart && recordDate <= budgetEnd;
  }

  // Gets budget performance status
  getBudgetPerformanceStatus(actualAmount, plannedAmount) {
    if (plannedAmount <= 0) {
      return 'no_budget';
    }

    const achievementPercentage = this.calculateAchievementPercentage(actualAmount, plannedAmount);

    if (achievementPercentage === 0) {
      return 'not_started';
    } else if (achievementPercentage < 50) {
      return 'under_utilized';
    } else if (achievementPercentage <= 90) {
      return 'on_track';
    } else if (achievementPercentage <= 100) {
      return 'near_limit';
    } else {
      return 'over_budget';
    }
  }

  // Formats budget analysis for display
  formatBudgetAnalysis(budgetAnalysis) {
    if (!budgetAnalysis) {
      return null;
    }

    return {
      ...budgetAnalysis,
      performanceStatus: this.getBudgetPerformanceStatus(budgetAnalysis.actualAmount, budgetAnalysis.plannedAmount),
      formattedPlannedAmount: this.formatCurrency(budgetAnalysis.plannedAmount),
      formattedActualAmount: this.formatCurrency(budgetAnalysis.actualAmount),
      formattedRemainingAmount: this.formatCurrency(budgetAnalysis.remainingAmount),
      formattedAchievementPercentage: `${budgetAnalysis.achievementPercentage}%`
    };
  }

  // Simple currency formatting (can be enhanced based on requirements)
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

module.exports = new BudgetAnalysisService();