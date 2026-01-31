const budgetAnalysisService = require('../services/budgetAnalysisService');

describe('BudgetAnalysisService', () => {
  describe('calculateBudgetVsActual', () => {
    const mockBudget = {
      id: '123',
      costCenterId: 'cc1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      plannedAmount: 1000
    };

    test('requires budget parameter', async () => {
      const result = await budgetAnalysisService.calculateBudgetVsActual(null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Budget is required');
    });

    test('validates budget has required fields', async () => {
      const incompleteBudget = { id: '123' };
      
      const result = await budgetAnalysisService.calculateBudgetVsActual(incompleteBudget);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Budget must have costCenterId, startDate, endDate, and plannedAmount');
    });

    test('calculates with no posted records', async () => {
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);
      
      const result = await budgetAnalysisService.calculateBudgetVsActual(mockBudget, mockGetPostedRecords);
      
      expect(result.success).toBe(true);
      expect(result.data.actualAmount).toBe(0);
      expect(result.data.remainingAmount).toBe(1000);
      expect(result.data.achievementPercentage).toBe(0);
      expect(result.data.recordCount).toBe(0);
      expect(result.data.isOverBudget).toBe(false);
    });

    test('calculates with posted records', async () => {
      const postedRecords = [
        { amount: 200, status: 'posted' },
        { amount: 300, status: 'posted' },
        { amount: 100, status: 'draft' } // Should be ignored
      ];
      const mockGetPostedRecords = jest.fn().mockResolvedValue(postedRecords);
      
      const result = await budgetAnalysisService.calculateBudgetVsActual(mockBudget, mockGetPostedRecords);
      
      expect(result.success).toBe(true);
      expect(result.data.actualAmount).toBe(500); // Only posted records: 200 + 300
      expect(result.data.remainingAmount).toBe(500); // 1000 - 500
      expect(result.data.achievementPercentage).toBe(50); // (500/1000) * 100
      expect(result.data.recordCount).toBe(3);
      expect(result.data.isOverBudget).toBe(false);
      expect(mockGetPostedRecords).toHaveBeenCalledWith('cc1', mockBudget.startDate, mockBudget.endDate);
    });

    test('detects over budget situation', async () => {
      const postedRecords = [
        { amount: 800, status: 'posted' },
        { amount: 400, status: 'posted' }
      ];
      const mockGetPostedRecords = jest.fn().mockResolvedValue(postedRecords);
      
      const result = await budgetAnalysisService.calculateBudgetVsActual(mockBudget, mockGetPostedRecords);
      
      expect(result.success).toBe(true);
      expect(result.data.actualAmount).toBe(1200);
      expect(result.data.remainingAmount).toBe(-200); // 1000 - 1200
      expect(result.data.achievementPercentage).toBe(120); // (1200/1000) * 100
      expect(result.data.isOverBudget).toBe(true);
    });

    test('handles database errors', async () => {
      const mockGetPostedRecords = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await budgetAnalysisService.calculateBudgetVsActual(mockBudget, mockGetPostedRecords);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to calculate budget vs actual');
    });

    test('includes all required fields in response', async () => {
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);
      
      const result = await budgetAnalysisService.calculateBudgetVsActual(mockBudget, mockGetPostedRecords);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('budgetId', '123');
      expect(result.data).toHaveProperty('costCenterId', 'cc1');
      expect(result.data).toHaveProperty('budgetPeriod');
      expect(result.data.budgetPeriod).toHaveProperty('startDate');
      expect(result.data.budgetPeriod).toHaveProperty('endDate');
      expect(result.data).toHaveProperty('plannedAmount', 1000);
      expect(result.data).toHaveProperty('actualAmount');
      expect(result.data).toHaveProperty('remainingAmount');
      expect(result.data).toHaveProperty('achievementPercentage');
      expect(result.data).toHaveProperty('recordCount');
      expect(result.data).toHaveProperty('isOverBudget');
    });
  });

  describe('calculateActualAmount', () => {
    test('returns 0 for empty records', () => {
      const result = budgetAnalysisService.calculateActualAmount([]);
      
      expect(result).toBe(0);
    });

    test('returns 0 for null records', () => {
      const result = budgetAnalysisService.calculateActualAmount(null);
      
      expect(result).toBe(0);
    });

    test('only includes posted records', () => {
      const records = [
        { amount: 100, status: 'posted' },
        { amount: 200, status: 'draft' }, // Should be ignored
        { amount: 300, status: 'posted' },
        { amount: 150, status: 'cancelled' } // Should be ignored
      ];
      
      const result = budgetAnalysisService.calculateActualAmount(records);
      
      expect(result).toBe(400); // 100 + 300
    });

    test('handles records with missing amounts', () => {
      const records = [
        { amount: 100, status: 'posted' },
        { status: 'posted' }, // Missing amount
        { amount: null, status: 'posted' }, // Null amount
        { amount: 200, status: 'posted' }
      ];
      
      const result = budgetAnalysisService.calculateActualAmount(records);
      
      expect(result).toBe(300); // 100 + 0 + 0 + 200
    });
  });

  describe('calculateAchievementPercentage', () => {
    test('returns 0 when planned amount is 0', () => {
      const result = budgetAnalysisService.calculateAchievementPercentage(100, 0);
      
      expect(result).toBe(0);
    });

    test('returns 0 when planned amount is negative', () => {
      const result = budgetAnalysisService.calculateAchievementPercentage(100, -500);
      
      expect(result).toBe(0);
    });

    test('calculates correct percentage', () => {
      const result = budgetAnalysisService.calculateAchievementPercentage(250, 1000);
      
      expect(result).toBe(25);
    });

    test('handles over 100% achievement', () => {
      const result = budgetAnalysisService.calculateAchievementPercentage(1200, 1000);
      
      expect(result).toBe(120);
    });

    test('rounds to 2 decimal places', () => {
      const result = budgetAnalysisService.calculateAchievementPercentage(333.33, 1000);
      
      expect(result).toBe(33.33);
    });
  });

  describe('calculateMultipleBudgetsVsActual', () => {
    test('returns empty array for no budgets', async () => {
      const result = await budgetAnalysisService.calculateMultipleBudgetsVsActual([]);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test('calculates multiple budgets', async () => {
      const budgets = [
        { id: '1', costCenterId: 'cc1', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), plannedAmount: 1000 },
        { id: '2', costCenterId: 'cc2', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), plannedAmount: 2000 }
      ];
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);
      
      const result = await budgetAnalysisService.calculateMultipleBudgetsVsActual(budgets, mockGetPostedRecords);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].budgetId).toBe('1');
      expect(result.data[1].budgetId).toBe('2');
    });

    test('handles errors gracefully and continues processing', async () => {
      const budgets = [
        { id: '1', costCenterId: 'cc1', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), plannedAmount: 1000 }
      ];
      const mockGetPostedRecords = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await budgetAnalysisService.calculateMultipleBudgetsVsActual(budgets, mockGetPostedRecords);
      
      // Should succeed but return empty results since all individual calculations failed
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getBudgetSummaryForCostCenter', () => {
    test('requires cost center ID', async () => {
      const result = await budgetAnalysisService.getBudgetSummaryForCostCenter(null, []);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Cost center ID is required');
    });

    test('returns empty summary for no budgets', async () => {
      const result = await budgetAnalysisService.getBudgetSummaryForCostCenter('cc1', []);
      
      expect(result.success).toBe(true);
      expect(result.data.costCenterId).toBe('cc1');
      expect(result.data.totalPlannedAmount).toBe(0);
      expect(result.data.totalActualAmount).toBe(0);
      expect(result.data.totalRemainingAmount).toBe(0);
      expect(result.data.overallAchievementPercentage).toBe(0);
      expect(result.data.budgetCount).toBe(0);
      expect(result.data.budgets).toEqual([]);
    });

    test('calculates summary for cost center budgets', async () => {
      const budgets = [
        { id: '1', costCenterId: 'cc1', startDate: new Date('2024-01-01'), endDate: new Date('2024-06-30'), plannedAmount: 1000 },
        { id: '2', costCenterId: 'cc1', startDate: new Date('2024-07-01'), endDate: new Date('2024-12-31'), plannedAmount: 1500 },
        { id: '3', costCenterId: 'cc2', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), plannedAmount: 2000 } // Different cost center
      ];
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);
      
      const result = await budgetAnalysisService.getBudgetSummaryForCostCenter('cc1', budgets, mockGetPostedRecords);
      
      expect(result.success).toBe(true);
      expect(result.data.costCenterId).toBe('cc1');
      expect(result.data.totalPlannedAmount).toBe(2500); // 1000 + 1500
      expect(result.data.totalActualAmount).toBe(0);
      expect(result.data.totalRemainingAmount).toBe(2500);
      expect(result.data.overallAchievementPercentage).toBe(0);
      expect(result.data.budgetCount).toBe(2);
      expect(result.data.budgets).toHaveLength(2);
      expect(result.data.isOverBudget).toBe(false);
    });
  });

  describe('isRecordIncludedInBudget', () => {
    const budget = {
      costCenterId: 'cc1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    };

    test('excludes draft records', () => {
      const record = { status: 'draft', costCenterId: 'cc1', invoiceDate: new Date('2024-06-01') };
      
      const result = budgetAnalysisService.isRecordIncludedInBudget(record, budget);
      
      expect(result).toBe(false);
    });

    test('excludes records from different cost center', () => {
      const record = { status: 'posted', costCenterId: 'cc2', invoiceDate: new Date('2024-06-01') };
      
      const result = budgetAnalysisService.isRecordIncludedInBudget(record, budget);
      
      expect(result).toBe(false);
    });

    test('excludes records outside budget period', () => {
      const record = { status: 'posted', costCenterId: 'cc1', invoiceDate: new Date('2023-12-31') };
      
      const result = budgetAnalysisService.isRecordIncludedInBudget(record, budget);
      
      expect(result).toBe(false);
    });

    test('includes valid posted records', () => {
      const record = { status: 'posted', costCenterId: 'cc1', invoiceDate: new Date('2024-06-01') };
      
      const result = budgetAnalysisService.isRecordIncludedInBudget(record, budget);
      
      expect(result).toBe(true);
    });

    test('handles different date field names', () => {
      const records = [
        { status: 'posted', costCenterId: 'cc1', invoiceDate: new Date('2024-06-01') },
        { status: 'posted', costCenterId: 'cc1', billDate: new Date('2024-06-01') },
        { status: 'posted', costCenterId: 'cc1', expenseDate: new Date('2024-06-01') },
        { status: 'posted', costCenterId: 'cc1', date: new Date('2024-06-01') }
      ];
      
      records.forEach(record => {
        const result = budgetAnalysisService.isRecordIncludedInBudget(record, budget);
        expect(result).toBe(true);
      });
    });
  });

  describe('getBudgetPerformanceStatus', () => {
    test('returns no_budget for zero planned amount', () => {
      const result = budgetAnalysisService.getBudgetPerformanceStatus(100, 0);
      
      expect(result).toBe('no_budget');
    });

    test('returns not_started for zero actual amount', () => {
      const result = budgetAnalysisService.getBudgetPerformanceStatus(0, 1000);
      
      expect(result).toBe('not_started');
    });

    test('returns under_utilized for low achievement', () => {
      const result = budgetAnalysisService.getBudgetPerformanceStatus(400, 1000); // 40%
      
      expect(result).toBe('under_utilized');
    });

    test('returns on_track for moderate achievement', () => {
      const result = budgetAnalysisService.getBudgetPerformanceStatus(700, 1000); // 70%
      
      expect(result).toBe('on_track');
    });

    test('returns near_limit for high achievement', () => {
      const result = budgetAnalysisService.getBudgetPerformanceStatus(950, 1000); // 95%
      
      expect(result).toBe('near_limit');
    });

    test('returns over_budget for exceeded budget', () => {
      const result = budgetAnalysisService.getBudgetPerformanceStatus(1200, 1000); // 120%
      
      expect(result).toBe('over_budget');
    });
  });

  describe('formatBudgetAnalysis', () => {
    test('returns null for null input', () => {
      const result = budgetAnalysisService.formatBudgetAnalysis(null);
      
      expect(result).toBeNull();
    });

    test('formats budget analysis with additional fields', () => {
      const budgetAnalysis = {
        plannedAmount: 1000,
        actualAmount: 750,
        remainingAmount: 250,
        achievementPercentage: 75
      };
      
      const result = budgetAnalysisService.formatBudgetAnalysis(budgetAnalysis);
      
      expect(result).toHaveProperty('performanceStatus', 'on_track');
      expect(result).toHaveProperty('formattedPlannedAmount');
      expect(result).toHaveProperty('formattedActualAmount');
      expect(result).toHaveProperty('formattedRemainingAmount');
      expect(result).toHaveProperty('formattedAchievementPercentage', '75%');
      expect(result.formattedPlannedAmount).toContain('$1,000.00');
    });
  });

  describe('formatCurrency', () => {
    test('formats currency correctly', () => {
      const result = budgetAnalysisService.formatCurrency(1234.56);
      
      expect(result).toBe('$1,234.56');
    });

    test('formats zero correctly', () => {
      const result = budgetAnalysisService.formatCurrency(0);
      
      expect(result).toBe('$0.00');
    });

    test('formats negative amounts correctly', () => {
      const result = budgetAnalysisService.formatCurrency(-500);
      
      expect(result).toBe('-$500.00');
    });
  });
});