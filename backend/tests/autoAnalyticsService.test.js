const autoAnalyticsService = require('../services/autoAnalyticsService');

describe('AutoAnalyticsService', () => {
  describe('applyAutoAnalytics', () => {
    const mockModels = [
      {
        id: 'model1',
        partner_id: 'partner1',
        product_category_id: 'cat1',
        analytics_to_apply: 'cc1',
        state: 'confirmed',
        createdAt: '2024-01-01'
      },
      {
        id: 'model2',
        product_category_id: 'cat1',
        analytics_to_apply: 'cc2',
        state: 'confirmed',
        createdAt: '2024-01-02'
      },
      {
        id: 'model3',
        partner_id: 'partner1',
        analytics_to_apply: 'cc3',
        state: 'draft', // Should be ignored
        createdAt: '2024-01-03'
      }
    ];

    test('only applies analytics to posted transactions', async () => {
      const transaction = { status: 'draft', contactId: 'partner1' };
      const mockGetModels = jest.fn().mockResolvedValue(mockModels);

      const result = await autoAnalyticsService.applyAutoAnalytics(transaction, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.applied).toBe(false);
      expect(result.reason).toBe('Auto analytics only applied to posted transactions');
    });

    test('does not overwrite manual cost center assignment', async () => {
      const transaction = { 
        status: 'posted', 
        contactId: 'partner1', 
        costCenterId: 'manual_cc' 
      };
      const mockGetModels = jest.fn().mockResolvedValue(mockModels);

      const result = await autoAnalyticsService.applyAutoAnalytics(transaction, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.applied).toBe(false);
      expect(result.reason).toBe('Manual cost center assignment present, not overwriting');
    });

    test('applies analytics when matching model found', async () => {
      const transaction = { 
        status: 'posted', 
        contactId: 'partner1',
        productCategoryId: 'cat1'
      };
      const mockGetModels = jest.fn().mockResolvedValue(mockModels);

      const result = await autoAnalyticsService.applyAutoAnalytics(transaction, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.applied).toBe(true);
      expect(result.selectedModel.analytics_to_apply).toBe('cc1'); // Most specific match
      expect(result.selectedModel.matchScore).toBe(2); // partner + category
      expect(result.selectedModel.matchedFields).toEqual(['partner_id', 'product_category_id']);
    });

    test('selects most specific model when multiple matches', async () => {
      const transaction = { 
        status: 'posted', 
        productCategoryId: 'cat1'
      };
      const mockGetModels = jest.fn().mockResolvedValue(mockModels);

      const result = await autoAnalyticsService.applyAutoAnalytics(transaction, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.applied).toBe(true);
      expect(result.selectedModel.analytics_to_apply).toBe('cc2'); // More recent when same specificity
      expect(result.selectedModel.matchScore).toBe(1); // Only category matches
    });

    test('returns no match when no models match', async () => {
      const transaction = { 
        status: 'posted', 
        contactId: 'unknown_partner'
      };
      const mockGetModels = jest.fn().mockResolvedValue(mockModels);

      const result = await autoAnalyticsService.applyAutoAnalytics(transaction, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.applied).toBe(false);
      expect(result.reason).toBe('No matching auto analytical models found');
    });

    test('ignores cancelled and draft models', async () => {
      const modelsWithCancelled = [
        ...mockModels,
        {
          id: 'model4',
          partner_id: 'partner1',
          analytics_to_apply: 'cc4',
          state: 'cancelled',
          createdAt: '2024-01-04'
        }
      ];

      const transaction = { 
        status: 'posted', 
        contactId: 'partner1'
      };
      const mockGetModels = jest.fn().mockResolvedValue(modelsWithCancelled);

      const result = await autoAnalyticsService.applyAutoAnalytics(transaction, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.applied).toBe(true);
      // Should not select the cancelled model
      expect(result.selectedModel.id).not.toBe('model4');
      expect(result.selectedModel.id).not.toBe('model3'); // Draft model
    });

    test('handles errors gracefully', async () => {
      const transaction = { status: 'posted' };
      const mockGetModels = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await autoAnalyticsService.applyAutoAnalytics(transaction, mockGetModels);

      expect(result.success).toBe(false);
      expect(result.applied).toBe(false);
      expect(result.reason).toBe('Failed to apply auto analytics');
    });
  });

  describe('extractTransactionAttributes', () => {
    test('extracts attributes from invoice transaction', () => {
      const transaction = {
        contactId: 'partner1',
        partnerTagId: 'tag1',
        productId: 'product1',
        productCategoryId: 'cat1'
      };

      const result = autoAnalyticsService.extractTransactionAttributes(transaction);

      expect(result).toEqual({
        partner_id: 'partner1',
        partner_tag_id: 'tag1',
        product_id: 'product1',
        product_category_id: 'cat1'
      });
    });

    test('extracts attributes from purchase bill transaction', () => {
      const transaction = {
        supplierId: 'supplier1',
        productId: 'product1'
      };

      const result = autoAnalyticsService.extractTransactionAttributes(transaction);

      expect(result).toEqual({
        partner_id: 'supplier1',
        partner_tag_id: null,
        product_id: 'product1',
        product_category_id: null
      });
    });

    test('handles missing attributes', () => {
      const transaction = {};

      const result = autoAnalyticsService.extractTransactionAttributes(transaction);

      expect(result).toEqual({
        partner_id: null,
        partner_tag_id: null,
        product_id: null,
        product_category_id: null
      });
    });
  });

  describe('isModelMatch', () => {
    test('matches when at least one field matches', () => {
      const model = {
        partner_id: 'partner1',
        product_category_id: 'cat1'
      };
      const attributes = {
        partner_id: 'partner1',
        product_category_id: 'different_cat'
      };

      const result = autoAnalyticsService.isModelMatch(model, attributes);

      expect(result).toBe(true); // partner_id matches
    });

    test('does not match when no fields match', () => {
      const model = {
        partner_id: 'partner1',
        product_category_id: 'cat1'
      };
      const attributes = {
        partner_id: 'different_partner',
        product_category_id: 'different_cat'
      };

      const result = autoAnalyticsService.isModelMatch(model, attributes);

      expect(result).toBe(false);
    });

    test('ignores empty model fields', () => {
      const model = {
        partner_id: null,
        product_category_id: 'cat1'
      };
      const attributes = {
        partner_id: 'partner1',
        product_category_id: 'cat1'
      };

      const result = autoAnalyticsService.isModelMatch(model, attributes);

      expect(result).toBe(true); // Only considers non-null model fields
    });

    test('handles missing transaction attributes', () => {
      const model = {
        partner_id: 'partner1'
      };
      const attributes = {
        partner_id: null,
        product_category_id: 'cat1'
      };

      const result = autoAnalyticsService.isModelMatch(model, attributes);

      expect(result).toBe(false); // Transaction doesn't have partner_id
    });
  });

  describe('calculateMatchScore', () => {
    test('calculates score based on matched fields', () => {
      const model = {
        partner_id: 'partner1',
        product_category_id: 'cat1',
        product_id: 'product1'
      };
      const attributes = {
        partner_id: 'partner1',
        product_category_id: 'cat1',
        product_id: 'different_product'
      };

      const score = autoAnalyticsService.calculateMatchScore(model, attributes);

      expect(score).toBe(2); // partner_id and product_category_id match
    });

    test('returns zero when no fields match', () => {
      const model = {
        partner_id: 'partner1'
      };
      const attributes = {
        partner_id: 'different_partner'
      };

      const score = autoAnalyticsService.calculateMatchScore(model, attributes);

      expect(score).toBe(0);
    });
  });

  describe('selectBestMatchingModel', () => {
    test('selects model with highest score', () => {
      const models = [
        {
          id: 'model1',
          partner_id: 'partner1',
          createdAt: '2024-01-01'
        },
        {
          id: 'model2',
          partner_id: 'partner1',
          product_category_id: 'cat1',
          createdAt: '2024-01-02'
        }
      ];
      const attributes = {
        partner_id: 'partner1',
        product_category_id: 'cat1'
      };

      const result = autoAnalyticsService.selectBestMatchingModel(models, attributes);

      expect(result.id).toBe('model2'); // Higher score (2 vs 1)
    });

    test('selects most recent when scores are equal', () => {
      const models = [
        {
          id: 'model1',
          partner_id: 'partner1',
          createdAt: '2024-01-01'
        },
        {
          id: 'model2',
          partner_id: 'partner1',
          createdAt: '2024-01-02'
        }
      ];
      const attributes = {
        partner_id: 'partner1'
      };

      const result = autoAnalyticsService.selectBestMatchingModel(models, attributes);

      expect(result.id).toBe('model2'); // More recent
    });
  });

  describe('validateAutoAnalyticalModel', () => {
    test('validates complete model', () => {
      const model = {
        analytics_to_apply: 'cc1',
        state: 'confirmed',
        partner_id: 'partner1'
      };

      const result = autoAnalyticsService.validateAutoAnalyticalModel(model);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('requires analytics_to_apply', () => {
      const model = {
        state: 'confirmed',
        partner_id: 'partner1'
      };

      const result = autoAnalyticsService.validateAutoAnalyticalModel(model);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Analytics to apply (cost center) is required');
    });

    test('requires valid state', () => {
      const model = {
        analytics_to_apply: 'cc1',
        state: 'invalid',
        partner_id: 'partner1'
      };

      const result = autoAnalyticsService.validateAutoAnalyticalModel(model);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('State must be one of: draft, confirmed, cancelled');
    });

    test('requires at least one matching field', () => {
      const model = {
        analytics_to_apply: 'cc1',
        state: 'confirmed'
      };

      const result = autoAnalyticsService.validateAutoAnalyticalModel(model);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one matching field must be specified (partner_id, partner_tag_id, product_id, product_category_id)');
    });
  });

  describe('getModelSpecificityLevel', () => {
    test('returns correct specificity levels', () => {
      const generic = { partner_id: 'partner1' };
      const moderate = { partner_id: 'partner1', product_category_id: 'cat1' };
      const specific = { partner_id: 'partner1', product_category_id: 'cat1', product_id: 'product1' };
      const highlySpecific = { 
        partner_id: 'partner1', 
        partner_tag_id: 'tag1',
        product_category_id: 'cat1', 
        product_id: 'product1' 
      };

      expect(autoAnalyticsService.getModelSpecificityLevel(generic)).toBe('generic');
      expect(autoAnalyticsService.getModelSpecificityLevel(moderate)).toBe('moderate');
      expect(autoAnalyticsService.getModelSpecificityLevel(specific)).toBe('specific');
      expect(autoAnalyticsService.getModelSpecificityLevel(highlySpecific)).toBe('highly_specific');
    });
  });

  describe('getAnalyticsSuggestions', () => {
    const mockModels = [
      {
        id: 'model1',
        partner_id: 'partner1',
        product_category_id: 'cat1',
        analytics_to_apply: 'cc1',
        state: 'confirmed'
      },
      {
        id: 'model2',
        product_category_id: 'cat1',
        analytics_to_apply: 'cc2',
        state: 'confirmed'
      }
    ];

    test('returns suggestions sorted by match score', async () => {
      const transaction = {
        contactId: 'partner1',
        productCategoryId: 'cat1'
      };
      const mockGetModels = jest.fn().mockResolvedValue(mockModels);

      const result = await autoAnalyticsService.getAnalyticsSuggestions(transaction, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].matchScore).toBe(2); // Higher score first
      expect(result.suggestions[1].matchScore).toBe(1);
      expect(result.recommendedAnalytics).toBe('cc1');
    });

    test('returns empty suggestions when no matches', async () => {
      const transaction = {
        contactId: 'unknown_partner'
      };
      const mockGetModels = jest.fn().mockResolvedValue(mockModels);

      const result = await autoAnalyticsService.getAnalyticsSuggestions(transaction, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.suggestions).toHaveLength(0);
      expect(result.recommendedAnalytics).toBeNull();
    });
  });

  describe('bulkApplyAutoAnalytics', () => {
    test('processes multiple transactions', async () => {
      const transactions = [
        { id: 'tx1', status: 'posted', contactId: 'partner1' },
        { id: 'tx2', status: 'draft', contactId: 'partner1' },
        { id: 'tx3', status: 'posted', contactId: 'unknown' }
      ];
      const mockModels = [
        {
          id: 'model1',
          partner_id: 'partner1',
          analytics_to_apply: 'cc1',
          state: 'confirmed'
        }
      ];
      const mockGetModels = jest.fn().mockResolvedValue(mockModels);

      const result = await autoAnalyticsService.bulkApplyAutoAnalytics(transactions, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.applied).toBe(1); // Only tx1 should be applied
      expect(result.summary.skipped).toBe(2); // tx2 (draft) and tx3 (no match)
    });
  });

  describe('getAnalyticsCoverageReport', () => {
    test('calculates coverage percentage', async () => {
      const transactions = [
        { id: 'tx1', contactId: 'partner1' },
        { id: 'tx2', contactId: 'partner2' },
        { id: 'tx3', contactId: 'unknown' }
      ];
      const mockModels = [
        {
          id: 'model1',
          partner_id: 'partner1',
          analytics_to_apply: 'cc1',
          state: 'confirmed'
        },
        {
          id: 'model2',
          partner_id: 'partner2',
          analytics_to_apply: 'cc2',
          state: 'confirmed'
        }
      ];
      const mockGetModels = jest.fn().mockResolvedValue(mockModels);

      const result = await autoAnalyticsService.getAnalyticsCoverageReport(transactions, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.coverage.totalTransactions).toBe(3);
      expect(result.coverage.coveredTransactions).toBe(2);
      expect(result.coverage.uncoveredTransactions).toBe(1);
      expect(result.coverage.coveragePercentage).toBe(66.67);
      expect(result.details).toHaveLength(3);
    });

    test('handles empty transactions', async () => {
      const transactions = [];
      const mockGetModels = jest.fn().mockResolvedValue([]);

      const result = await autoAnalyticsService.getAnalyticsCoverageReport(transactions, mockGetModels);

      expect(result.success).toBe(true);
      expect(result.coverage.coveragePercentage).toBe(0);
    });
  });
});