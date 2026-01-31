const dashboardService = require('../services/dashboardService');

// Mock the budgetAnalysisService
jest.mock('../services/budgetAnalysisService', () => ({
  getBudgetSummaryForCostCenter: jest.fn(),
  calculateBudgetVsActual: jest.fn(),
  calculateActualAmount: jest.fn(),
  calculateAchievementPercentage: jest.fn(),
  getBudgetPerformanceStatus: jest.fn(),
  formatCurrency: jest.fn()
}));

const budgetAnalysisService = require('../services/budgetAnalysisService');

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardOverview', () => {
    const mockCostCenters = [
      { id: 'cc1', name: 'Marketing', description: 'Marketing department' },
      { id: 'cc2', name: 'Operations', description: 'Operations department' }
    ];
    
    const mockBudgets = [
      { id: 'b1', costCenterId: 'cc1', plannedAmount: 1000 },
      { id: 'b2', costCenterId: 'cc2', plannedAmount: 2000 }
    ];

    test('returns dashboard overview with aggregated data', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue(mockCostCenters);
      const mockGetAllBudgets = jest.fn().mockResolvedValue(mockBudgets);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      budgetAnalysisService.getBudgetSummaryForCostCenter
        .mockResolvedValueOnce({
          success: true,
          data: { totalPlannedAmount: 1000, totalActualAmount: 500, budgetCount: 1 }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { totalPlannedAmount: 2000, totalActualAmount: 1200, budgetCount: 1 }
        });

      budgetAnalysisService.calculateAchievementPercentage.mockReturnValue(56.67);

      const result = await dashboardService.getDashboardOverview(
        mockGetAllCostCenters,
        mockGetAllBudgets,
        mockGetPostedRecords
      );

      expect(result.success).toBe(true);
      expect(result.data.overview.totalPlannedAmount).toBe(3000);
      expect(result.data.overview.totalActualAmount).toBe(1700);
      expect(result.data.overview.totalRemainingAmount).toBe(1300);
      expect(result.data.overview.overallAchievementPercentage).toBe(56.67);
      expect(result.data.overview.totalBudgetCount).toBe(2);
      expect(result.data.overview.costCenterCount).toBe(2);
      expect(result.data.costCenters).toHaveLength(2);
    });

    test('handles errors gracefully', async () => {
      const mockGetAllCostCenters = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockGetAllBudgets = jest.fn().mockResolvedValue([]);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      const result = await dashboardService.getDashboardOverview(
        mockGetAllCostCenters,
        mockGetAllBudgets,
        mockGetPostedRecords
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to get dashboard overview');
    });
  });

  describe('getBudgetPerformanceSummary', () => {
    const mockBudgets = [
      { id: 'b1', costCenterId: 'cc1', plannedAmount: 1000 },
      { id: 'b2', costCenterId: 'cc2', plannedAmount: 2000 }
    ];

    test('returns budget performance summary', async () => {
      const mockGetAllBudgets = jest.fn().mockResolvedValue(mockBudgets);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      budgetAnalysisService.calculateBudgetVsActual
        .mockResolvedValueOnce({
          success: true,
          data: { actualAmount: 500, plannedAmount: 1000 }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { actualAmount: 1800, plannedAmount: 2000 }
        });

      budgetAnalysisService.getBudgetPerformanceStatus
        .mockReturnValueOnce('under_utilized')
        .mockReturnValueOnce('on_track');

      const result = await dashboardService.getBudgetPerformanceSummary(
        mockGetAllBudgets,
        mockGetPostedRecords
      );

      expect(result.success).toBe(true);
      expect(result.data.performanceStats.under_utilized).toBe(1);
      expect(result.data.performanceStats.on_track).toBe(1);
      expect(result.data.budgets).toHaveLength(2);
      expect(result.data.totalBudgets).toBe(2);
    });

    test('handles errors gracefully', async () => {
      const mockGetAllBudgets = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      const result = await dashboardService.getBudgetPerformanceSummary(
        mockGetAllBudgets,
        mockGetPostedRecords
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to get budget performance summary');
    });
  });

  describe('getExpenseBreakdown', () => {
    const mockCostCenters = [
      { id: 'cc1', name: 'Marketing' },
      { id: 'cc2', name: 'Operations' }
    ];

    test('returns expense breakdown by cost center', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue(mockCostCenters);
      const mockGetPostedRecords = jest.fn()
        .mockResolvedValueOnce([{ amount: 300, status: 'posted' }])
        .mockResolvedValueOnce([{ amount: 700, status: 'posted' }]);

      budgetAnalysisService.calculateActualAmount
        .mockReturnValueOnce(300)
        .mockReturnValueOnce(700);

      const result = await dashboardService.getExpenseBreakdown(
        mockGetAllCostCenters,
        mockGetPostedRecords
      );

      expect(result.success).toBe(true);
      expect(result.data.totalExpenses).toBe(1000);
      expect(result.data.breakdown).toHaveLength(2);
      expect(result.data.breakdown[0].totalExpenses).toBe(700); // Sorted descending
      expect(result.data.breakdown[0].percentage).toBe(70);
      expect(result.data.breakdown[1].totalExpenses).toBe(300);
      expect(result.data.breakdown[1].percentage).toBe(30);
    });

    test('handles date range filtering', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue(mockCostCenters);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);
      budgetAnalysisService.calculateActualAmount.mockReturnValue(0);

      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const result = await dashboardService.getExpenseBreakdown(
        mockGetAllCostCenters,
        mockGetPostedRecords,
        dateRange
      );

      expect(result.success).toBe(true);
      expect(result.data.dateRange).toEqual(dateRange);
      expect(mockGetPostedRecords).toHaveBeenCalledWith('cc1', dateRange.startDate, dateRange.endDate);
    });
  });

  describe('getTopSpendingCostCenters', () => {
    test('returns top spending cost centers', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue([
        { id: 'cc1', name: 'Marketing' },
        { id: 'cc2', name: 'Operations' },
        { id: 'cc3', name: 'Sales' }
      ]);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      // Mock the getExpenseBreakdown method
      jest.spyOn(dashboardService, 'getExpenseBreakdown').mockResolvedValue({
        success: true,
        data: {
          totalExpenses: 3000,
          breakdown: [
            { costCenterId: 'cc2', costCenterName: 'Operations', totalExpenses: 1500, percentage: 50, recordCount: 5 },
            { costCenterId: 'cc1', costCenterName: 'Marketing', totalExpenses: 1000, percentage: 33.33, recordCount: 3 },
            { costCenterId: 'cc3', costCenterName: 'Sales', totalExpenses: 500, percentage: 16.67, recordCount: 2 }
          ]
        }
      });

      const result = await dashboardService.getTopSpendingCostCenters(
        2,
        mockGetAllCostCenters,
        mockGetPostedRecords
      );

      expect(result.success).toBe(true);
      expect(result.data.topSpenders).toHaveLength(2);
      expect(result.data.topSpenders[0].costCenterName).toBe('Operations');
      expect(result.data.topSpenders[1].costCenterName).toBe('Marketing');
      expect(result.data.totalExpenses).toBe(3000);
    });
  });

  describe('getBudgetAlerts', () => {
    const mockBudgets = [
      { id: 'b1', costCenterId: 'cc1', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') },
      { id: 'b2', costCenterId: 'cc2', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') }
    ];

    test('returns budget alerts for over budget and near limit', async () => {
      const mockGetAllBudgets = jest.fn().mockResolvedValue(mockBudgets);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      budgetAnalysisService.calculateBudgetVsActual
        .mockResolvedValueOnce({
          success: true,
          data: { achievementPercentage: 120, actualAmount: 1200, plannedAmount: 1000 }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { achievementPercentage: 95, actualAmount: 1900, plannedAmount: 2000 }
        });

      const result = await dashboardService.getBudgetAlerts(
        mockGetAllBudgets,
        mockGetPostedRecords,
        90
      );

      expect(result.success).toBe(true);
      expect(result.data.alerts).toHaveLength(2);
      expect(result.data.alertCount).toBe(2);
      expect(result.data.overBudgetCount).toBe(1);
      expect(result.data.nearLimitCount).toBe(1);
      expect(result.data.alerts[0].alertType).toBe('over_budget'); // Sorted by achievement percentage
      expect(result.data.alerts[1].alertType).toBe('near_limit');
    });

    test('returns no alerts when budgets are under threshold', async () => {
      const mockGetAllBudgets = jest.fn().mockResolvedValue(mockBudgets);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      budgetAnalysisService.calculateBudgetVsActual.mockResolvedValue({
        success: true,
        data: { achievementPercentage: 50, actualAmount: 500, plannedAmount: 1000 }
      });

      const result = await dashboardService.getBudgetAlerts(
        mockGetAllBudgets,
        mockGetPostedRecords,
        90
      );

      expect(result.success).toBe(true);
      expect(result.data.alerts).toHaveLength(0);
      expect(result.data.alertCount).toBe(0);
    });
  });

  describe('validateDashboardAccess', () => {
    test('grants access to admin users', () => {
      const userContext = { id: '123', role: 'admin' };
      
      const result = dashboardService.validateDashboardAccess(userContext);
      
      expect(result.hasAccess).toBe(true);
      expect(result.isReadOnly).toBe(false);
      expect(result.reason).toBe('Access granted');
    });

    test('grants read-only access to portal users', () => {
      const userContext = { id: '123', role: 'portal' };
      
      const result = dashboardService.validateDashboardAccess(userContext);
      
      expect(result.hasAccess).toBe(true);
      expect(result.isReadOnly).toBe(true);
      expect(result.reason).toBe('Access granted');
    });

    test('denies access to unauthenticated users', () => {
      const result = dashboardService.validateDashboardAccess(null);
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('User not authenticated');
    });

    test('denies access to users with invalid roles', () => {
      const userContext = { id: '123', role: 'invalid' };
      
      const result = dashboardService.validateDashboardAccess(userContext);
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Insufficient permissions');
    });
  });

  describe('formatDashboardData', () => {
    test('formats dashboard data with currency formatting', () => {
      budgetAnalysisService.formatCurrency.mockImplementation(amount => `$${amount.toFixed(2)}`);
      
      const dashboardData = {
        overview: {
          totalPlannedAmount: 1000,
          totalActualAmount: 750,
          totalRemainingAmount: 250,
          overallAchievementPercentage: 75
        },
        costCenters: [
          {
            costCenterId: 'cc1',
            totalPlannedAmount: 1000,
            totalActualAmount: 750,
            totalRemainingAmount: 250
          }
        ]
      };
      
      const result = dashboardService.formatDashboardData(dashboardData);
      
      expect(result.overview.formattedTotalPlannedAmount).toBe('$1000.00');
      expect(result.overview.formattedTotalActualAmount).toBe('$750.00');
      expect(result.overview.formattedOverallAchievementPercentage).toBe('75%');
      expect(result.costCenters[0].formattedTotalPlannedAmount).toBe('$1000.00');
    });

    test('returns null for null input', () => {
      const result = dashboardService.formatDashboardData(null);
      
      expect(result).toBeNull();
    });
  });
});