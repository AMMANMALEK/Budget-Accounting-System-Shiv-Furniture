const express = require('express');
const contactService = require('../services/contactService');
const { requireAuth } = require('../middleware/authMiddleware');
const { createResourceAccessMiddleware } = require('../middleware/accessControlMiddleware');
const { contactDAL } = require('../database/dal');

const router = express.Router();

// GET /api/contacts
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '', type } = req.query;
    const result = await contactDAL.getAll(parseInt(page), parseInt(limit), search, type);
    res.json(result);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      error: 'Failed to fetch contacts',
      type: 'ServerError'
    });
  }
});

// GET /api/contacts/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const contact = await contactDAL.getById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        type: 'NotFoundError'
      });
    }
    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      error: 'Failed to fetch contact',
      type: 'ServerError'
    });
  }
});

// POST /api/contacts
router.post('/', requireAuth, createResourceAccessMiddleware('contact', 'create'), async (req, res) => {
  try {
    // Basic validation
    if (!req.body.name || !req.body.contact_type) {
      return res.status(400).json({
        error: 'Name and contact type are required',
        type: 'ValidationError'
      });
    }

    if (!['CUSTOMER', 'VENDOR'].includes(req.body.contact_type.toUpperCase())) {
      return res.status(400).json({
        error: 'Contact type must be CUSTOMER or VENDOR',
        type: 'ValidationError'
      });
    }

    const newContact = await contactDAL.create({
      name: req.body.name,
      email: req.body.email,
      contact_type: req.body.contact_type
    });

    res.status(201).json(newContact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      error: 'Failed to create contact',
      type: 'ServerError'
    });
  }
});

// PUT /api/contacts/:id
router.put('/:id', requireAuth, createResourceAccessMiddleware('contact', 'update'), async (req, res) => {
  try {
    // Basic validation
    if (!req.body.name || !req.body.contact_type) {
      return res.status(400).json({
        error: 'Name and contact type are required',
        type: 'ValidationError'
      });
    }

    if (!['CUSTOMER', 'VENDOR'].includes(req.body.contact_type.toUpperCase())) {
      return res.status(400).json({
        error: 'Contact type must be CUSTOMER or VENDOR',
        type: 'ValidationError'
      });
    }

    const updatedContact = await contactDAL.update(req.params.id, {
      name: req.body.name,
      email: req.body.email,
      contact_type: req.body.contact_type
    });
    
    if (!updatedContact) {
      return res.status(404).json({
        error: 'Contact not found',
        type: 'NotFoundError'
      });
    }

    res.json(updatedContact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      error: 'Failed to update contact',
      type: 'ServerError'
    });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', requireAuth, createResourceAccessMiddleware('contact', 'delete'), async (req, res) => {
  try {
    const deletedContact = await contactDAL.delete(req.params.id);
    
    if (!deletedContact) {
      return res.status(404).json({
        error: 'Contact not found',
        type: 'NotFoundError'
      });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      error: 'Failed to delete contact',
      type: 'ServerError'
    });
  }
});

module.exports = router;