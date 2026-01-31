const contactService = require('../services/contactService');

describe('ContactService', () => {
  describe('validateContact', () => {
    test('requires contact name', () => {
      const result = contactService.validateContact({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact name is required');
    });

    test('rejects empty contact name', () => {
      const result = contactService.validateContact({ name: '' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact name is required');
    });

    test('rejects whitespace-only contact name', () => {
      const result = contactService.validateContact({ name: '   ' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact name is required');
    });

    test('requires valid contact type', () => {
      const result = contactService.validateContact({ name: 'Test Contact' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact type must be customer, supplier, or both');
    });

    test('rejects invalid contact type', () => {
      const result = contactService.validateContact({ 
        name: 'Test Contact',
        type: 'invalid'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact type must be customer, supplier, or both');
    });

    test('accepts customer type', () => {
      const result = contactService.validateContact({ 
        name: 'Test Contact',
        type: 'customer'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accepts supplier type', () => {
      const result = contactService.validateContact({ 
        name: 'Test Contact',
        type: 'supplier'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accepts both type', () => {
      const result = contactService.validateContact({ 
        name: 'Test Contact',
        type: 'both'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates email format if provided', () => {
      const result = contactService.validateContact({ 
        name: 'Test Contact',
        type: 'customer',
        email: 'invalid-email'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('accepts valid email format', () => {
      const result = contactService.validateContact({ 
        name: 'Test Contact',
        type: 'customer',
        email: 'test@example.com'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates phone format if provided', () => {
      const result = contactService.validateContact({ 
        name: 'Test Contact',
        type: 'customer',
        phone: 'invalid-phone'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone format');
    });

    test('accepts valid phone formats', () => {
      const validPhones = [
        '1234567890',
        '+1234567890',
        '123-456-7890',
        '(123) 456-7890',
        '+1 (123) 456-7890'
      ];

      validPhones.forEach(phone => {
        const result = contactService.validateContact({ 
          name: 'Test Contact',
          type: 'customer',
          phone
        });
        
        expect(result.isValid).toBe(true);
      });
    });

    test('accepts contact without optional fields', () => {
      const result = contactService.validateContact({ 
        name: 'Test Contact',
        type: 'customer'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createContact', () => {
    test('creates contact with valid data', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '123', name: 'Test Contact' });
      const contactData = {
        name: 'Test Contact',
        type: 'customer',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Main St'
      };
      
      const result = await contactService.createContact(contactData, mockSave);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123', name: 'Test Contact' });
      expect(mockSave).toHaveBeenCalledWith({
        name: 'Test Contact',
        type: 'customer',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Main St'
      });
    });

    test('trims whitespace from name, email, and phone', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '123' });
      const contactData = {
        name: '  Test Contact  ',
        type: 'customer',
        email: '  test@example.com  ',
        phone: '  1234567890  '
      };
      
      await contactService.createContact(contactData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith({
        name: 'Test Contact',
        type: 'customer',
        email: 'test@example.com',
        phone: '1234567890',
        address: ''
      });
    });

    test('handles missing optional fields', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '123' });
      const contactData = {
        name: 'Test Contact',
        type: 'customer'
      };
      
      await contactService.createContact(contactData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith({
        name: 'Test Contact',
        type: 'customer',
        email: '',
        phone: '',
        address: ''
      });
    });

    test('returns validation errors', async () => {
      const result = await contactService.createContact({ name: '' });
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Contact name is required');
    });

    test('handles save errors', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      const contactData = {
        name: 'Test Contact',
        type: 'customer'
      };
      
      const result = await contactService.createContact(contactData, mockSave);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create contact');
    });
  });

  describe('validateContactUpdate', () => {
    test('requires contact ID', () => {
      const result = contactService.validateContactUpdate(null, { name: 'Updated Contact' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact ID is required');
    });

    test('validates name if provided', () => {
      const result = contactService.validateContactUpdate('123', { name: '' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact name is required');
    });

    test('validates type if provided', () => {
      const result = contactService.validateContactUpdate('123', { type: 'invalid' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contact type must be customer, supplier, or both');
    });

    test('validates email if provided', () => {
      const result = contactService.validateContactUpdate('123', { email: 'invalid-email' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('validates phone if provided', () => {
      const result = contactService.validateContactUpdate('123', { phone: 'invalid-phone' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone format');
    });

    test('skips validation for fields not being updated', () => {
      const result = contactService.validateContactUpdate('123', { address: 'Updated address' });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accepts valid update data', () => {
      const result = contactService.validateContactUpdate('123', {
        name: 'Updated Contact',
        email: 'updated@example.com'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('allows empty email and phone in updates', () => {
      const result = contactService.validateContactUpdate('123', {
        email: '',
        phone: ''
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('isValidEmail', () => {
    test('validates correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(contactService.isValidEmail(email)).toBe(true);
      });
    });

    test('rejects invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@domain',
        'user name@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(contactService.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidPhone', () => {
    test('validates correct phone formats', () => {
      const validPhones = [
        '1234567890',
        '+1234567890',
        '123-456-7890',
        '(123) 456-7890',
        '+1 (123) 456-7890',
        '+44 20 7946 0958'
      ];

      validPhones.forEach(phone => {
        expect(contactService.isValidPhone(phone)).toBe(true);
      });
    });

    test('rejects invalid phone formats', () => {
      const invalidPhones = [
        'invalid-phone',
        '123', // too short
        'abcdefghij',
        '+',
        '0123456789012345678901234567890', // too long
        '',
        '   ', // whitespace only
        '0123456789' // starts with 0
      ];

      invalidPhones.forEach(phone => {
        expect(contactService.isValidPhone(phone)).toBe(false);
      });
    });
  });
});