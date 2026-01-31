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

    const countQuery = `
      SELECT COUNT(*) FROM budgets b 
      JOIN analytic_accounts aa ON b.analytic_account_id = aa.id 
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataQuery = `
      SELECT b.*, aa.name as analytic_account_name,
             COALESCE(SUM(bl.planned_amount), 0) as total_planned_amount
      FROM budgets b 
      JOIN analytic_accounts aa ON b.analytic_account_id = aa.id 
      LEFT JOIN budget_lines bl ON b.id = bl.budget_id
      ${whereClause} 
      GROUP BY b.id, aa.name
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
    const result = await query(`
      SELECT b.*, aa.name as analytic_account_name,
             COALESCE(SUM(bl.planned_amount), 0) as total_planned_amount
      FROM budgets b 
      JOIN analytic_accounts aa ON b.analytic_account_id = aa.id 
      LEFT JOIN budget_lines bl ON b.id = bl.budget_id
      WHERE b.id = $1
      GROUP BY b.id, aa.name
    `, [id]);
    return result.rows[0];
  },

  async create(budgetData) {
    const client = await require('../config/database').getClient();
    try {
      await client.query('BEGIN');

      // Create budget header
      const { name, analytic_account_id, date_from, date_to, planned_amount } = budgetData;
      const budgetResult = await client.query(
        'INSERT INTO budgets (name, analytic_account_id, date_from, date_to, state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, analytic_account_id, date_from, date_to, 'DRAFT']
      );

      const budget = budgetResult.rows[0];

      // Create budget line
      await client.query(
        'INSERT INTO budget_lines (budget_id, planned_amount) VALUES ($1, $2)',
        [budget.id, planned_amount]
      );

      await client.query('COMMIT');

      // Return budget with total amount
      return { ...budget, total_planned_amount: planned_amount };
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

      const { name, analytic_account_id, date_from, date_to, planned_amount } = updateData;

      // Update budget header
      const budgetResult = await client.query(
        'UPDATE budgets SET name = $1, analytic_account_id = $2, date_from = $3, date_to = $4 WHERE id = $5 RETURNING *',
        [name, analytic_account_id, date_from, date_to, id]
      );

      if (planned_amount !== undefined) {
        // Update or create budget line
        const existingLine = await client.query('SELECT id FROM budget_lines WHERE budget_id = $1', [id]);

        if (existingLine.rows.length > 0) {
          await client.query(
            'UPDATE budget_lines SET planned_amount = $1 WHERE budget_id = $2',
            [planned_amount, id]
          );
        } else {
          await client.query(
            'INSERT INTO budget_lines (budget_id, planned_amount) VALUES ($1, $2)',
            [id, planned_amount]
          );
        }
      }

      await client.query('COMMIT');

      const budget = budgetResult.rows[0];
      return { ...budget, total_planned_amount: planned_amount };
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

  async getOverlapping(analyticAccountId, dateFrom, dateTo, excludeId = null) {
    let whereClause = 'WHERE analytic_account_id = $1 AND (date_from <= $3 AND date_to >= $2)';
    let params = [analyticAccountId, dateFrom, dateTo];

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