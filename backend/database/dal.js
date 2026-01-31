const { query } = require('../config/database');

// User DAL functions
const userDAL = {
  async getUserByCredentials(email, password) {
    const result = await query(
      'SELECT id, email, password_hash as password, name, role FROM users WHERE (email = $1 OR login = $1) AND active = true',
      [email]
    );
    return result.rows[0];
  },

  async getUserById(id) {
    const result = await query(
      'SELECT id, email, name, role FROM users WHERE id = $1 AND active = true',
      [id]
    );
    return result.rows[0];
  },

  async createUser(userData) {
    const { email, password, name, role = 'PORTAL' } = userData;
    const result = await query(
      'INSERT INTO users (email, login, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
      [email, email, password, name, role.toUpperCase()]
    );
    return result.rows[0];
  }
};

// Analytic Account (Cost Center) DAL functions
const analyticAccountDAL = {
  async getAll(page = 0, limit = 10, search = '') {
    const offset = page * limit;
    let whereClause = 'WHERE active = true';
    let params = [];

    if (search) {
      whereClause += ' AND name ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) FROM analytic_accounts ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT * FROM analytic_accounts ${whereClause} ORDER BY name LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getById(id) {
    const result = await query('SELECT * FROM analytic_accounts WHERE id = $1 AND active = true', [id]);
    return result.rows[0];
  },

  async create(analyticAccountData) {
    const { name, code } = analyticAccountData;
    const result = await query(
      'INSERT INTO analytic_accounts (name, code) VALUES ($1, $2) RETURNING *',
      [name, code]
    );
    return result.rows[0];
  },

  async update(id, updateData) {
    const { name, code } = updateData;
    const result = await query(
      'UPDATE analytic_accounts SET name = $1, code = $2 WHERE id = $3 RETURNING *',
      [name, code, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'UPDATE analytic_accounts SET active = false WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};

// Budget DAL functions (with budget_lines)
const budgetDAL = {
  async getAll(page = 0, limit = 10, search = '') {
    const offset = page * limit;
    let whereClause = 'WHERE b.id IS NOT NULL';
    let params = [];

    if (search) {
      whereClause += ' AND b.name ILIKE $1';
      params.push(`%${search}%`);
    }

    // Adjusted for schema-updated.sql (SERIAL, cost_centers, budget_lines)
    const countQuery = `
      SELECT COUNT(*) FROM budgets b 
      LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id 
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataQuery = `
      SELECT b.*, cc.name as analytic_account_name,
             b.start_date as date_from, b.end_date as date_to,
             b.cost_center_id as analytic_account_id,
             COALESCE(SUM(bl.planned_amount), b.planned_amount) as total_planned_amount
      FROM budgets b 
      LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id 
      LEFT JOIN budget_lines bl ON b.id = bl.budget_id
      ${whereClause} 
      GROUP BY b.id, cc.name
      ORDER BY b.created_at DESC 
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const dataResult = await query(dataQuery, params);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getById(id) {
    // Adjusted for schema-updated.sql
    const result = await query(`
      SELECT b.*, cc.name as analytic_account_name,
             b.start_date as date_from, b.end_date as date_to,
             b.cost_center_id as analytic_account_id,
             COALESCE(SUM(bl.planned_amount), b.planned_amount) as total_planned_amount,
             json_agg(
                json_build_object(
                    'id', bl.id,
                    'budgetedAmount', bl.planned_amount,
                    'achievedAmount', bl.achieved_amount,
                    'analyticId', bl.cost_center_id,
                    'analyticName', cc_line.name
                )
             ) as "analyticLines"
      FROM budgets b 
      LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id 
      LEFT JOIN budget_lines bl ON b.id = bl.budget_id
      LEFT JOIN cost_centers cc_line ON bl.cost_center_id = cc_line.id
      WHERE b.id = $1
      GROUP BY b.id, cc.name
    `, [id]);
    
    if (result.rows[0]) {
        // Fix up analyticLines if they are null (from left join)
        if (result.rows[0].analyticLines && result.rows[0].analyticLines[0] && result.rows[0].analyticLines[0].id === null) {
            result.rows[0].analyticLines = [];
        }
    }
    return result.rows[0];
  },

  async create(budgetData) {
    const client = await require('../config/database').getClient();
    try {
      await client.query('BEGIN');

      // 1. Parse Analytic Lines
      let lines = [];
      if (budgetData.analyticLines) {
          if (typeof budgetData.analyticLines === 'string') {
              try { lines = JSON.parse(budgetData.analyticLines); } catch(e) { lines = []; }
          } else if (Array.isArray(budgetData.analyticLines)) {
              lines = budgetData.analyticLines;
          }
      }

      // 2. Determine Header Values
      // Use provided analytic_account_id (mapped to cost_center_id) or fallback to first line's analyticId
      let costCenterId = budgetData.analytic_account_id || budgetData.cost_center_id;
      if (!costCenterId && lines.length > 0) {
          costCenterId = lines[0].analyticId;
      }
      // If still null, we might insert NULL if schema allows (we made it nullable)

      const { name, date_from, date_to } = budgetData;
      // Recalculate planned amount from lines if possible
      let plannedAmount = budgetData.planned_amount || 0;
      if (lines.length > 0) {
          const sum = lines.reduce((acc, line) => acc + (Number(line.budgetedAmount) || 0), 0);
          if (sum > 0) plannedAmount = sum;
      }

      // 3. Insert Budget Header
      const budgetResult = await client.query(
        'INSERT INTO budgets (name, cost_center_id, start_date, end_date, planned_amount, state) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, costCenterId, date_from, date_to, plannedAmount, 'draft']
      );

      const budget = budgetResult.rows[0];

      // 4. Insert Budget Lines
      if (lines.length > 0) {
          for (const line of lines) {
              await client.query(
                'INSERT INTO budget_lines (budget_id, cost_center_id, planned_amount, achieved_amount) VALUES ($1, $2, $3, $4)',
                [budget.id, line.analyticId, line.budgetedAmount || 0, line.achievedAmount || 0]
              );
          }
      } else {
          // Fallback: Create one line if no lines provided but we have header amount
          if (costCenterId && plannedAmount > 0) {
             await client.query(
                'INSERT INTO budget_lines (budget_id, cost_center_id, planned_amount) VALUES ($1, $2, $3)',
                [budget.id, costCenterId, plannedAmount]
              );
          }
      }

      await client.query('COMMIT');

      // Return budget with mappings
      return { 
          ...budget, 
          date_from: budget.start_date, 
          date_to: budget.end_date,
          analytic_account_id: budget.cost_center_id,
          total_planned_amount: plannedAmount 
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id, updateData) {
    const client = await require('../config/database').getClient();
    try {
      await client.query('BEGIN');

      const { name, date_from, date_to } = updateData;
      
      // Parse Lines
      let lines = [];
      if (updateData.analyticLines) {
          if (typeof updateData.analyticLines === 'string') {
              try { lines = JSON.parse(updateData.analyticLines); } catch(e) { lines = []; }
          } else if (Array.isArray(updateData.analyticLines)) {
              lines = updateData.analyticLines;
          }
      }

      let costCenterId = updateData.analytic_account_id || updateData.cost_center_id;
      if (!costCenterId && lines.length > 0) costCenterId = lines[0].analyticId;

      let plannedAmount = updateData.planned_amount || 0;
      if (lines.length > 0) {
          plannedAmount = lines.reduce((acc, line) => acc + (Number(line.budgetedAmount) || 0), 0);
      }

      // Update budget header
      const budgetResult = await client.query(
        'UPDATE budgets SET name = $1, cost_center_id = $2, start_date = $3, end_date = $4, planned_amount = $5 WHERE id = $6 RETURNING *',
        [name, costCenterId, date_from, date_to, plannedAmount, id]
      );

      // Replace lines (Delete all and re-insert for simplicity)
      if (lines.length > 0) {
          await client.query('DELETE FROM budget_lines WHERE budget_id = $1', [id]);
          for (const line of lines) {
              await client.query(
                'INSERT INTO budget_lines (budget_id, cost_center_id, planned_amount, achieved_amount) VALUES ($1, $2, $3, $4)',
                [id, line.analyticId, line.budgetedAmount || 0, line.achievedAmount || 0]
              );
          }
      }

      await client.query('COMMIT');

      const budget = budgetResult.rows[0];
      return { 
          ...budget, 
          date_from: budget.start_date, 
          date_to: budget.end_date,
          analytic_account_id: budget.cost_center_id,
          total_planned_amount: plannedAmount 
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async delete(id) {
    const result = await query('DELETE FROM budgets WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  async getOverlapping(costCenterId, startDate, endDate, excludeId = null) {
    if (!costCenterId) return []; // Cannot check overlap without cost center
    let whereClause = 'WHERE cost_center_id = $1 AND (start_date <= $3 AND end_date >= $2)';
    let params = [costCenterId, startDate, endDate];

    if (excludeId) {
      whereClause += ' AND id != $4';
      params.push(excludeId);
    }

    const result = await query(`SELECT * FROM budgets ${whereClause}`, params);
    return result.rows;
  }
};

// Contact DAL functions
const contactDAL = {
  async getAll(page = 0, limit = 10, search = '', type = null) {
    const offset = page * limit;
    let whereClause = 'WHERE active = true';
    let params = [];

    if (search) {
      whereClause += ' AND (name ILIKE $1 OR email ILIKE $1)';
      params.push(`%${search}%`);
    }

    if (type) {
      whereClause += ` AND contact_type = $${params.length + 1}`;
      params.push(type.toUpperCase());
    }

    const countResult = await query(`SELECT COUNT(*) FROM contacts ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT * FROM contacts ${whereClause} ORDER BY name LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getById(id) {
    const result = await query('SELECT * FROM contacts WHERE id = $1 AND active = true', [id]);
    return result.rows[0];
  },

  async create(contactData) {
    const { name, email, contact_type } = contactData;
    const result = await query(
      'INSERT INTO contacts (name, email, contact_type) VALUES ($1, $2, $3) RETURNING *',
      [name, email, contact_type.toUpperCase()]
    );
    return result.rows[0];
  },

  async update(id, updateData) {
    const { name, email, contact_type } = updateData;
    const result = await query(
      'UPDATE contacts SET name = $1, email = $2, contact_type = $3 WHERE id = $4 RETURNING *',
      [name, email, contact_type.toUpperCase(), id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'UPDATE contacts SET active = false WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};

// Invoice DAL functions (with invoice_lines)
const invoiceDAL = {
  async getAll(page = 0, limit = 10, search = '') {
    const offset = page * limit;
    let whereClause = 'WHERE ci.id IS NOT NULL';
    let params = [];

    if (search) {
      whereClause += ' AND c.name ILIKE $1';
      params.push(`%${search}%`);
    }

    const countQuery = `
      SELECT COUNT(*) FROM customer_invoices ci 
      LEFT JOIN contacts c ON ci.customer_id = c.id 
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataQuery = `
      SELECT ci.*, c.name as customer_name,
             COALESCE(SUM(il.quantity * il.price), 0) as total_amount
      FROM customer_invoices ci 
      LEFT JOIN contacts c ON ci.customer_id = c.id 
      LEFT JOIN invoice_lines il ON ci.id = il.invoice_id
      ${whereClause} 
      GROUP BY ci.id, c.name
      ORDER BY ci.created_at DESC 
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const dataResult = await query(dataQuery, params);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getById(id) {
    const result = await query(`
      SELECT ci.*, c.name as customer_name,
             COALESCE(SUM(il.quantity * il.price), 0) as total_amount
      FROM customer_invoices ci 
      LEFT JOIN contacts c ON ci.customer_id = c.id 
      LEFT JOIN invoice_lines il ON ci.id = il.invoice_id
      WHERE ci.id = $1
      GROUP BY ci.id, c.name
    `, [id]);
    return result.rows[0];
  },

  async create(invoiceData) {
    const client = await require('../config/database').getClient();
    try {
      await client.query('BEGIN');

      // Create invoice header
      const { customer_id, invoice_date, amount, product_id, analytic_account_id } = invoiceData;
      const invoiceResult = await client.query(
        'INSERT INTO customer_invoices (customer_id, invoice_date, state) VALUES ($1, $2, $3) RETURNING *',
        [customer_id, invoice_date, 'DRAFT']
      );

      const invoice = invoiceResult.rows[0];

      // Create invoice line
      await client.query(
        'INSERT INTO invoice_lines (invoice_id, product_id, quantity, price, analytic_account_id) VALUES ($1, $2, $3, $4, $5)',
        [invoice.id, product_id, 1, amount, analytic_account_id]
      );

      await client.query('COMMIT');

      // Return invoice with total amount
      return { ...invoice, total_amount: amount };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id, updateData) {
    const client = await require('../config/database').getClient();
    try {
      await client.query('BEGIN');

      const { customer_id, invoice_date, amount, product_id, analytic_account_id } = updateData;

      // Update invoice header
      const invoiceResult = await client.query(
        'UPDATE customer_invoices SET customer_id = $1, invoice_date = $2 WHERE id = $3 RETURNING *',
        [customer_id, invoice_date, id]
      );

      if (amount !== undefined) {
        // Update invoice line
        await client.query(
          'UPDATE invoice_lines SET price = $1, product_id = $2, analytic_account_id = $3 WHERE invoice_id = $4',
          [amount, product_id, analytic_account_id, id]
        );
      }

      await client.query('COMMIT');

      const invoice = invoiceResult.rows[0];
      return { ...invoice, total_amount: amount };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async delete(id) {
    const result = await query('DELETE FROM customer_invoices WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  async getPostedForAnalyticAccount(analyticAccountId, dateRange = null) {
    let whereClause = 'WHERE il.analytic_account_id = $1 AND ci.state = $2';
    let params = [analyticAccountId, 'POSTED'];

    if (dateRange && dateRange.startDate && dateRange.endDate) {
      whereClause += ' AND ci.invoice_date BETWEEN $3 AND $4';
      params.push(dateRange.startDate, dateRange.endDate);
    }

    const result = await query(`
      SELECT ci.*, il.quantity * il.price as amount 
      FROM customer_invoices ci 
      JOIN invoice_lines il ON ci.id = il.invoice_id 
      ${whereClause}
    `, params);
    return result.rows;
  }
};

// Product DAL functions
const productDAL = {
  async getAll(page = 0, limit = 10, search = '') {
    const offset = page * limit;
    let whereClause = 'WHERE p.active = true';
    let params = [];

    if (search) {
      whereClause += ' AND p.name ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) FROM products p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT p.*, pc.name as category_name FROM products p 
       LEFT JOIN product_categories pc ON p.category_id = pc.id 
       ${whereClause} ORDER BY p.name LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getById(id) {
    const result = await query(`
      SELECT p.*, pc.name as category_name 
      FROM products p 
      LEFT JOIN product_categories pc ON p.category_id = pc.id 
      WHERE p.id = $1 AND p.active = true
    `, [id]);
    return result.rows[0];
  },

  async create(productData) {
    const { name, category_id, price } = productData;
    const result = await query(
      'INSERT INTO products (name, category_id, price) VALUES ($1, $2, $3) RETURNING *',
      [name, category_id, price]
    );
    return result.rows[0];
  },

  async update(id, updateData) {
    const { name, category_id, price } = updateData;
    const result = await query(
      'UPDATE products SET name = $1, category_id = $2, price = $3 WHERE id = $4 RETURNING *',
      [name, category_id, price, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'UPDATE products SET active = false WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};

// Dashboard DAL functions
const dashboardDAL = {
  async getDashboardData() {
    // Return mock/placeholder data structure to satisfy frontend without DB queries
    // or return basic KPIs if they were previously implemented via other DALs.
    // Since we are revoking changes, we revert to a simple state.
    
    return {
      financialOverview: {
        revenue: 0,
        expenses: 0,
        netProfit: 0,
        receivables: 0
      },
      topProducts: [],
      recentSales: [],
      recentActivity: [],
      kpis: {
        totalBudget: { value: 0, trend: '0%', status: 'neutral' },
        committed: { value: 0, trend: '0%', status: 'neutral' },
        achieved: { value: 0, trend: '0%', status: 'neutral' },
        remaining: { value: 0, trend: '0%', status: 'neutral' }
      }
    };
  }
};

module.exports = {
  userDAL,
  analyticAccountDAL,
  budgetDAL,
  contactDAL,
  invoiceDAL,
  productDAL,
  dashboardDAL
};