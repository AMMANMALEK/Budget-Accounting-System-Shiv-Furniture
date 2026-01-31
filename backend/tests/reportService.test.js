const reportService = require('../services/reportService');

// Mock the budgetAnalysisService
jest.mock('../services/budgetAnalysisService', () => ({
  calculateBudgetVsActual: jest.fn(),
  calculateActualAmount: jest.fn(),
  calculateAchievementPercentage: jest.fn(),
  getBudgetPerformanceStatus: jest.fn(),
  formatCurrency: jest.fn()
}));

const budgetAnalysisService = require('../services/budgetAnalysisService');

describe('ReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore any spies
    jest.restoreAllMocks();
  });

  describe('generateBudgetReport', () => {
    const mockCostCenters = [
      { id: 'cc1', name: 'Marketing' },
      { id: 'cc2', name: 'Operations' }
    ];
    
    const mockBudgets = [
      { 
        id: 'b1', 
        costCenterId: 'cc1', 
        startDate: new Date('2024-01-01'), 
        endDate: new Date('2024-12-31'),
        description: 'Marketing budget'
      },
      { 
        id: 'b2', 
        costCenterId: 'cc2', 
        startDate: new Date('2024-01-01'), 
        endDate: new Date('2024-12-31'),
        description: 'Operations budget'
      }
    ];

    test('generates comprehensive budget report', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue(mockCostCenters);
      const mockGetAllBudgets = jest.fn().mockResolvedValue(mockBudgets);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      budgetAnalysisService.calculateBudgetVsActual
        .mockResolvedValueOnce({
          success: true,
          data: { plannedAmount: 1000, actualAmount: 750, remainingAmount: 250, achievementPercentage: 75, recordCount: 3, isOverBudget: false }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { plannedAmount: 2000, actualAmount: 1800, remainingAmount: 200, achievementPercentage: 90, recordCount: 5, isOverBudget: false }
        });

      budgetAnalysisService.getBudgetPerformanceStatus
        .mockReturnValueOnce('on_track')
        .mockReturnValueOnce('near_limit');

      budgetAnalysisService.calculateAchievementPercentage.mockReturnValue(85);

      const result = await reportService.generateBudgetReport(
        mockGetAllCostCenters,
        mockGetAllBudgets,
        mockGetPostedRecords
      );

      expect(result.success).toBe(true);
      expect(result.data.reportMetadata.reportType).toBe('budget_analysis');
      expect(result.data.reportMetadata.totalBudgets).toBe(2);
      expect(result.data.summary.totalPlannedAmount).toBe(3000);
      expect(result.data.summary.totalActualAmount).toBe(2550);
      expect(result.data.summary.overallAchievementPercentage).toBe(85);
      expect(result.data.budgets).toHaveLength(2);
      expect(result.data.budgets[0].performanceStatus).toBe('on_track');
    });

    test('applies cost center filter', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue(mockCostCenters);
      const mockGetAllBudgets = jest.fn().mockResolvedValue(mockBudgets);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      budgetAnalysisService.calculateBudgetVsActual.mockResolvedValue({
        success: true,
        data: { plannedAmount: 1000, actualAmount: 750, remainingAmount: 250, achievementPercentage: 75, recordCount: 3, isOverBudget: false }
      });

      budgetAnalysisService.getBudgetPerformanceStatus.mockReturnValue('on_track');
      budgetAnalysisService.calculateAchievementPercentage.mockReturnValue(75);

      const filters = { costCenterId: 'cc1' };
      const result = await reportService.generateBudgetReport(
        mockGetAllCostCenters,
        mockGetAllBudgets,
        mockGetPostedRecords,
        filters
      );

      expect(result.success).toBe(true);
      expect(result.data.budgets).toHaveLength(1);
      expect(result.data.budgets[0].costCenterId).toBe('cc1');
      expect(result.data.reportMetadata.filters).toEqual(filters);
    });

    test('applies date range filter', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue(mockCostCenters);
      const mockGetAllBudgets = jest.fn().mockResolvedValue([
        { 
          id: 'b1', 
          costCenterId: 'cc1', 
          startDate: new Date('2024-01-01'), 
          endDate: new Date('2024-06-30')
        },
        { 
          id: 'b2', 
          costCenterId: 'cc2', 
          startDate: new Date('2024-07-01'), 
          endDate: new Date('2024-12-31')
        }
      ]);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      budgetAnalysisService.calculateBudgetVsActual.mockResolvedValue({
        success: true,
        data: { plannedAmount: 1000, actualAmount: 750, remainingAmount: 250, achievementPercentage: 75, recordCount: 3, isOverBudget: false }
      });

      budgetAnalysisService.getBudgetPerformanceStatus.mockReturnValue('on_track');
      budgetAnalysisService.calculateAchievementPercentage.mockReturnValue(75);

      const filters = { 
        startDate: new Date('2024-01-01'), 
        endDate: new Date('2024-06-30') 
      };
      
      const result = await reportService.generateBudgetReport(
        mockGetAllCostCenters,
        mockGetAllBudgets,
        mockGetPostedRecords,
        filters
      );

      expect(result.success).toBe(true);
      expect(result.data.budgets).toHaveLength(1);
      expect(result.data.budgets[0].budgetId).toBe('b1');
    });

    test('handles errors gracefully', async () => {
      const mockGetAllCostCenters = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockGetAllBudgets = jest.fn().mockResolvedValue([]);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      const result = await reportService.generateBudgetReport(
        mockGetAllCostCenters,
        mockGetAllBudgets,
        mockGetPostedRecords
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to generate budget report');
    });
  });

  describe('generateExpenseReport', () => {
    const mockCostCenters = [
      { id: 'cc1', name: 'Marketing', description: 'Marketing department' },
      { id: 'cc2', name: 'Operations', description: 'Operations department' }
    ];

    test('generates expense report by cost center', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue(mockCostCenters);
      const mockGetPostedRecords = jest.fn()
        .mockResolvedValueOnce([
          { id: '1', amount: 300, status: 'posted', description: 'Invoice 1', invoiceDate: new Date('2024-01-01') },
          { id: '2', amount: 200, status: 'draft', description: 'Invoice 2' } // Should be ignored
        ])
        .mockResolvedValueOnce([
          { id: '3', amount: 700, status: 'posted', description: 'Bill 1', billDate: new Date('2024-01-02') }
        ]);

      budgetAnalysisService.calculateActualAmount
        .mockReturnValueOnce(300)
        .mockReturnValueOnce(700);

      // Mock groupRecordsByType
      jest.spyOn(reportService, 'groupRecordsByType').mockImplementation(() => ({
        invoices: { count: 1, total: 300 },
        purchaseBills: { count: 0, total: 0 },
        productionExpenses: { count: 0, total: 0 }
      }));

      const result = await reportService.generateExpenseReport(
        mockGetAllCostCenters,
        mockGetPostedRecords
      );

      expect(result.success).toBe(true);
      expect(result.data.reportMetadata.reportType).toBe('expense_analysis');
      expect(result.data.summary.totalExpenses).toBe(1000);
      expect(result.data.costCenters).toHaveLength(2);
      expect(result.data.costCenters[0].totalExpenses).toBe(700); // Sorted descending
      expect(result.data.costCenters[0].percentage).toBe(70);
      expect(result.data.costCenters[1].totalExpenses).toBe(300);
      expect(result.data.costCenters[1].percentage).toBe(30);
    });

    test('applies cost center filter', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue(mockCostCenters);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      budgetAnalysisService.calculateActualAmount.mockReturnValue(0);

      const filters = { costCenterId: 'cc1' };
      const result = await reportService.generateExpenseReport(
        mockGetAllCostCenters,
        mockGetPostedRecords,
        filters
      );

      expect(result.success).toBe(true);
      expect(result.data.costCenters).toHaveLength(1);
      expect(result.data.costCenters[0].costCenterId).toBe('cc1');
    });
  });

  describe('generateVarianceReport', () => {
    test('generates variance report with favorable and unfavorable variances', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue([]);
      const mockGetAllBudgets = jest.fn().mockResolvedValue([]);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      // Mock generateBudgetReport
      jest.spyOn(reportService, 'generateBudgetReport').mockResolvedValue({
        success: true,
        data: {
          summary: { totalPlannedAmount: 3000, totalActualAmount: 2800 },
          budgets: [
            { budgetId: 'b1', plannedAmount: 1000, actualAmount: 800 }, // Favorable variance
            { budgetId: 'b2', plannedAmount: 2000, actualAmount: 2000 } // No variance
          ]
        }
      });

      const result = await reportService.generateVarianceReport(
        mockGetAllCostCenters,
        mockGetAllBudgets,
        mockGetPostedRecords
      );

      expect(result.success).toBe(true);
      expect(result.data.reportMetadata.reportType).toBe('variance_analysis');
      expect(result.data.summary.totalVariance).toBe(-200); // 2800 - 3000
      expect(result.data.variances).toHaveLength(2);
      expect(result.data.variances[0].variance).toBe(0); // Sorted by variance descending
      expect(result.data.variances[0].varianceType).toBe('favorable');
      expect(result.data.variances[1].variance).toBe(-200);
      expect(result.data.variances[1].varianceType).toBe('favorable');
    });

    test('handles budget report generation failure', async () => {
      const mockGetAllCostCenters = jest.fn().mockResolvedValue([]);
      const mockGetAllBudgets = jest.fn().mockResolvedValue([]);
      const mockGetPostedRecords = jest.fn().mockResolvedValue([]);

      jest.spyOn(reportService, 'generateBudgetReport').mockResolvedValue({
        success: false,
        errors: ['Budget report failed']
      });

      const result = await reportService.generateVarianceReport(
        mockGetAllCostCenters,
        mockGetAllBudgets,
        mockGetPostedRecords
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Budget report failed');
    });
  });

  describe('groupRecordsByType', () => {
    test('groups records by type correctly', () => {
      // Clear any existing mocks
      if (reportService.groupRecordsByType.mockRestore) {
        reportService.groupRecordsByType.mockRestore();
      }
      
      const records = [
        { amount: 100, invoiceDate: new Date(), contactId: 'c1' },
        { amount: 200, billDate: new Date(), supplierId: 's1' },
        { amount: 150, expenseDate: new Date(), productId: 'p1' },
        { amount: 300, invoiceDate: new Date() } // Default to invoice
      ];

      const result = reportService.groupRecordsByType(records);

      expect(result.invoices.count).toBe(2);
      expect(result.invoices.total).toBe(400);
      expect(result.purchaseBills.count).toBe(1);
      expect(result.purchaseBills.total).toBe(200);
      expect(result.productionExpenses.count).toBe(1);
      expect(result.productionExpenses.total).toBe(150);
    });
  });

  describe('getRecordType', () => {
    test('identifies invoice records', () => {
      const record1 = { invoiceDate: new Date() };
      const record2 = { contactId: 'c1' };
      
      expect(reportService.getRecordType(record1)).toBe('invoices');
      expect(reportService.getRecordType(record2)).toBe('invoices');
    });

    test('identifies purchase bill records', () => {
      const record1 = { billDate: new Date() };
      const record2 = { supplierId: 's1' };
      
      expect(reportService.getRecordType(record1)).toBe('purchaseBills');
      expect(reportService.getRecordType(record2)).toBe('purchaseBills');
    });

    test('identifies production expense records', () => {
      const record1 = { expenseDate: new Date() };
      const record2 = { productId: 'p1' };
      
      expect(reportService.getRecordType(record1)).toBe('productionExpenses');
      expect(reportService.getRecordType(record2)).toBe('productionExpenses');
    });

    test('defaults to invoices for unknown records', () => {
      const record = { amount: 100 };
      
      expect(reportService.getRecordType(record)).toBe('invoices');
    });
  });

  describe('validateReportAccess', () => {
    test('grants access to admin users', () => {
      const userContext = { id: '123', role: 'admin' };
      
      const result = reportService.validateReportAccess(userContext);
      
      expect(result.hasAccess).toBe(true);
      expect(result.isReadOnly).toBe(false);
      expect(result.reason).toBe('Access granted');
    });

    test('grants read-only access to portal users', () => {
      const userContext = { id: '123', role: 'portal' };
      
      const result = reportService.validateReportAccess(userContext);
      
      expect(result.hasAccess).toBe(true);
      expect(result.isReadOnly).toBe(true);
      expect(result.reason).toBe('Access granted');
    });

    test('denies access to unauthenticated users', () => {
      const result = reportService.validateReportAccess(null);
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('User not authenticated');
    });

    test('denies access to users with invalid roles', () => {
      const userContext = { id: '123', role: 'invalid' };
      
      const result = reportService.validateReportAccess(userContext);
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Insufficient permissions');
    });
  });

  describe('formatReportForExport', () => {
    test('formats report as JSON by default', () => {
      budgetAnalysisService.formatCurrency.mockImplementation(amount => `$${amount.toFixed(2)}`);
      
      const reportData = {
        summary: {
          totalPlannedAmount: 1000,
          totalActualAmount: 750
        }
      };
      
      const result = reportService.formatReportForExport(reportData);
      
      expect(result.summary.formattedTotalPlannedAmount).toBe('$1000.00');
      expect(result.summary.formattedTotalActualAmount).toBe('$750.00');
    });

    test('formats report as CSV', () => {
      const reportData = {
        budgets: [
          { budgetId: 'b1', costCenterName: 'Marketing', plannedAmount: 1000, actualAmount: 750, remainingAmount: 250, achievementPercentage: 75, performanceStatus: 'on_track' }
        ]
      };
      
      const result = reportService.formatReportForExport(reportData, 'csv');
      
      expect(result).toContain('Budget ID,Cost Center,Planned Amount,Actual Amount,Remaining Amount,Achievement %,Status');
      expect(result).toContain('b1,Marketing,1000,750,250,75,on_track');
    });

    test('returns null for null input', () => {
      const result = reportService.formatReportForExport(null);
      
      expect(result).toBeNull();
    });
  });

  describe('formatReportAsCSV', () => {
    test('formats expense report as CSV', () => {
      const reportData = {
        costCenters: [
          { costCenterName: 'Marketing', totalExpenses: 1000, recordCount: 5, percentage: 60 },
          { costCenterName: 'Operations', totalExpenses: 667, recordCount: 3, percentage: 40 }
        ]
      };
      
      const result = reportService.formatReportAsCSV(reportData);
      
      expect(result).toContain('Cost Center,Total Expenses,Record Count,Percentage');
      expect(result).toContain('Marketing,1000,5,60');
      expect(result).toContain('Operations,667,3,40');
    });

    test('returns no data message for unknown report type', () => {
      const reportData = { unknownField: 'value' };
      
      const result = reportService.formatReportAsCSV(reportData);
      
      expect(result).toBe('No data available for CSV export');
    });
  });
});