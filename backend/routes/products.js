const express = require('express');
const { productDAL } = require('../database/dal');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/products
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await productDAL.getAll(parseInt(page), parseInt(limit), search);
    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      type: 'ServerError'
    });
  }
});

// GET /api/products/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const product = await productDAL.getById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        type: 'NotFoundError'
      });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      type: 'ServerError'
    });
  }
});

// POST /api/products
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, category_id, price } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({
        error: 'Name and price are required',
        type: 'ValidationError'
      });
    }

    const product = await productDAL.create({ name, category_id, price });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      error: 'Failed to create product',
      type: 'ServerError'
    });
  }
});

// PUT /api/products/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, category_id, price } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({
        error: 'Name and price are required',
        type: 'ValidationError'
      });
    }

    const updatedProduct = await productDAL.update(req.params.id, { name, category_id, price });
    
    if (!updatedProduct) {
      return res.status(404).json({
        error: 'Product not found',
        type: 'NotFoundError'
      });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      error: 'Failed to update product',
      type: 'ServerError'
    });
  }
});

// DELETE /api/products/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await productDAL.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Product not found',
        type: 'NotFoundError'
      });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      error: 'Failed to delete product',
      type: 'ServerError'
    });
  }
});

module.exports = router;