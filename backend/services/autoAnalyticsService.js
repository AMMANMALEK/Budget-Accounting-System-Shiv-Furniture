class AutoAnalyticsService {
  // Applies auto analytics to a transaction when it's posted
  async applyAutoAnalytics(transaction, getAutoAnalyticalModels) {
    // Only apply analytics when transaction is posted
    if (transaction.status !== 'posted') {
      return {
        success: true,
        applied: false,
        reason: 'Auto analytics only applied to posted transactions'
      };
    }

    // Don't overwrite manual analytics assignment
    if (transaction.costCenterId) {
      return {
        success: true,
        applied: false,
        reason: 'Manual cost center assignment present, not overwriting'
      };
    }

    try {
      // Get all confirmed auto analytical models
      const models = await getAutoAnalyticalModels();
      const confirmedModels = models.filter(model => model.state === 'confirmed');

      if (confirmedModels.length === 0) {
        return {
          success: true,
          applied: false,
          reason: 'No confirmed auto analytical models available'
        };
      }

      // Extract transaction attributes
      const transactionAttributes = this.extractTransactionAttributes(transaction);

      // Find matching models
      const matchingModels = this.findMatchingModels(confirmedModels, transactionAttributes);

      if (matchingModels.length === 0) {
        return {
          success: true,
          applied: false,
          reason: 'No matching auto analytical models found'
        };
      }

      // Select the best matching model
      const selectedModel = this.selectBestMatchingModel(matchingModels, transactionAttributes);

      return {
        success: true,
        applied: true,
        selectedModel: {
          id: selectedModel.id,
          analytics_to_apply: selectedModel.analytics_to_apply,
          matchedFields: this.getMatchedFields(selectedModel, transactionAttributes),
          matchScore: this.calculateMatchScore(selectedModel, transactionAttributes)
        },
        reason: 'Auto analytics applied successfully'
      };
    } catch (error) {
      return {
        success: false,
        applied: false,
        reason: 'Failed to apply auto analytics',
        error: error.message
      };
    }
  }

  // Extracts relevant attributes from transaction for matching
  extractTransactionAttributes(transaction) {
    return {
      partner_id: transaction.contactId || transaction.supplierId || null,
      partner_tag_id: transaction.partnerTagId || null,
      product_id: transaction.productId || null,
      product_category_id: transaction.productCategoryId || null
    };
  }

  // Finds all models that match the transaction attributes
  findMatchingModels(models, transactionAttributes) {
    return models.filter(model => this.isModelMatch(model, transactionAttributes));
  }

  // Checks if a model matches the transaction attributes
  isModelMatch(model, transactionAttributes) {
    // A model matches if AT LEAST ONE field matches
    const matchFields = ['partner_id', 'partner_tag_id', 'product_id', 'product_category_id'];
    
    return matchFields.some(field => {
      const modelValue = model[field];
      const transactionValue = transactionAttributes[field];
      
      // If model doesn't specify this field, it's not a constraint
      if (!modelValue) return false;
      
      // If transaction doesn't have this field, no match
      if (!transactionValue) return false;
      
      // Check for exact match
      return modelValue === transactionValue;
    });
  }

  // Selects the best matching model based on specificity and recency
  selectBestMatchingModel(matchingModels, transactionAttributes) {
    // Score each model by number of matched fields
    const scoredModels = matchingModels.map(model => ({
      model,
      score: this.calculateMatchScore(model, transactionAttributes),
      matchedFields: this.getMatchedFields(model, transactionAttributes)
    }));

    // Sort by score (descending), then by creation date (most recent first)
    scoredModels.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      
      // If scores are equal, prefer most recently created
      const dateA = new Date(a.model.createdAt || a.model.created_at || 0);
      const dateB = new Date(b.model.createdAt || b.model.created_at || 0);
      return dateB - dateA;
    });

    return scoredModels[0].model;
  }

  // Calculates match score based on number of matched fields
  calculateMatchScore(model, transactionAttributes) {
    const matchFields = ['partner_id', 'partner_tag_id', 'product_id', 'product_category_id'];
    let score = 0;

    matchFields.forEach(field => {
      const modelValue = model[field];
      const transactionValue = transactionAttributes[field];
      
      if (modelValue && transactionValue && modelValue === transactionValue) {
        score++;
      }
    });

    return score;
  }

  // Gets the list of fields that matched for a model
  getMatchedFields(model, transactionAttributes) {
    const matchFields = ['partner_id', 'partner_tag_id', 'product_id', 'product_category_id'];
    const matched = [];

    matchFields.forEach(field => {
      const modelValue = model[field];
      const transactionValue = transactionAttributes[field];
      
      if (modelValue && transactionValue && modelValue === transactionValue) {
        matched.push(field);
      }
    });

    return matched;
  }

  // Validates auto analytical model data
  validateAutoAnalyticalModel(modelData) {
    const errors = [];

    // Must have analytics_to_apply (cost center)
    if (!modelData.analytics_to_apply) {
      errors.push('Analytics to apply (cost center) is required');
    }

    // Must have valid state
    const validStates = ['draft', 'confirmed', 'cancelled'];
    if (!modelData.state || !validStates.includes(modelData.state)) {
      errors.push('State must be one of: draft, confirmed, cancelled');
    }

    // Must have at least one matching field
    const matchFields = ['partner_id', 'partner_tag_id', 'product_id', 'product_category_id'];
    const hasMatchField = matchFields.some(field => modelData[field]);
    
    if (!hasMatchField) {
      errors.push('At least one matching field must be specified (partner_id, partner_tag_id, product_id, product_category_id)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Gets model specificity level for display purposes
  getModelSpecificityLevel(model) {
    const matchFields = ['partner_id', 'partner_tag_id', 'product_id', 'product_category_id'];
    const specifiedFields = matchFields.filter(field => model[field]);
    
    const count = specifiedFields.length;
    
    if (count === 1) return 'generic';
    if (count === 2) return 'moderate';
    if (count === 3) return 'specific';
    if (count === 4) return 'highly_specific';
    
    return 'none';
  }

  // Simulates auto analytics application for testing/preview
  async simulateAutoAnalytics(transaction, getAutoAnalyticalModels) {
    const result = await this.applyAutoAnalytics(transaction, getAutoAnalyticalModels);
    
    return {
      ...result,
      simulation: true,
      wouldApply: result.applied,
      transactionAttributes: this.extractTransactionAttributes(transaction)
    };
  }

  // Gets analytics suggestions for a transaction (for UI preview)
  async getAnalyticsSuggestions(transaction, getAutoAnalyticalModels) {
    try {
      const models = await getAutoAnalyticalModels();
      const confirmedModels = models.filter(model => model.state === 'confirmed');
      const transactionAttributes = this.extractTransactionAttributes(transaction);
      
      const matchingModels = this.findMatchingModels(confirmedModels, transactionAttributes);
      
      const suggestions = matchingModels.map(model => ({
        modelId: model.id,
        analytics_to_apply: model.analytics_to_apply,
        matchScore: this.calculateMatchScore(model, transactionAttributes),
        matchedFields: this.getMatchedFields(model, transactionAttributes),
        specificityLevel: this.getModelSpecificityLevel(model)
      }));

      // Sort by match score
      suggestions.sort((a, b) => b.matchScore - a.matchScore);

      return {
        success: true,
        suggestions,
        recommendedAnalytics: suggestions.length > 0 ? suggestions[0].analytics_to_apply : null
      };
    } catch (error) {
      return {
        success: false,
        suggestions: [],
        error: error.message
      };
    }
  }

  // Bulk applies auto analytics to multiple transactions
  async bulkApplyAutoAnalytics(transactions, getAutoAnalyticalModels) {
    const results = [];
    
    for (const transaction of transactions) {
      const result = await this.applyAutoAnalytics(transaction, getAutoAnalyticalModels);
      results.push({
        transactionId: transaction.id,
        ...result
      });
    }

    const summary = {
      total: results.length,
      applied: results.filter(r => r.applied).length,
      skipped: results.filter(r => !r.applied).length,
      errors: results.filter(r => !r.success).length
    };

    return {
      success: true,
      results,
      summary
    };
  }

  // Gets analytics coverage report
  async getAnalyticsCoverageReport(transactions, getAutoAnalyticalModels) {
    try {
      const models = await getAutoAnalyticalModels();
      const confirmedModels = models.filter(model => model.state === 'confirmed');
      
      let coveredTransactions = 0;
      let uncoveredTransactions = 0;
      const coverageDetails = [];

      for (const transaction of transactions) {
        const transactionAttributes = this.extractTransactionAttributes(transaction);
        const matchingModels = this.findMatchingModels(confirmedModels, transactionAttributes);
        
        if (matchingModels.length > 0) {
          coveredTransactions++;
          const bestModel = this.selectBestMatchingModel(matchingModels, transactionAttributes);
          coverageDetails.push({
            transactionId: transaction.id,
            covered: true,
            suggestedAnalytics: bestModel.analytics_to_apply,
            matchScore: this.calculateMatchScore(bestModel, transactionAttributes)
          });
        } else {
          uncoveredTransactions++;
          coverageDetails.push({
            transactionId: transaction.id,
            covered: false,
            reason: 'No matching auto analytical models'
          });
        }
      }

      const coveragePercentage = transactions.length > 0 
        ? Math.round((coveredTransactions / transactions.length) * 100 * 100) / 100
        : 0;

      return {
        success: true,
        coverage: {
          totalTransactions: transactions.length,
          coveredTransactions,
          uncoveredTransactions,
          coveragePercentage
        },
        details: coverageDetails
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AutoAnalyticsService();