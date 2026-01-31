/**
 * Contact Service
 * 
 * This service manages contact information for customers, suppliers, and other
 * business partners. Contacts are used to associate invoices and purchase bills
 * with specific entities for better tracking and reporting.
 * 
 * Key Features:
 * - Contact creation with type validation (customer, supplier, both)
 * - Email and phone format validation
 * - Contact update validation
 * - Flexible contact type system
 * - Data sanitization (trimming whitespace)
 * 
 * Business Rules:
 * - Contact name is required and cannot be empty
 * - Contact type must be 'customer', 'supplier', or 'both'
 * - Email format validation when provided (optional field)
 * - Phone format validation when provided (optional field)
 * - Address field is optional
 * 
 * Contacts provide essential business partner information for invoicing,
 * purchasing, and reporting purposes throughout the system.
 */
class ContactService {
  // Validates contact data and returns validation result
  validateContact(contactData) {
    const errors = [];

    // Basic required field validation
    if (!contactData.name || contactData.name.trim() === '') {
      errors.push('Contact name is required');
    }

    if (!contactData.type || !['customer', 'supplier', 'both'].includes(contactData.type)) {
      errors.push('Contact type must be customer, supplier, or both');
    }

    // Validate email format if provided (trim first)
    if (contactData.email) {
      const trimmedEmail = contactData.email.trim();
      if (trimmedEmail && !this.isValidEmail(trimmedEmail)) {
        errors.push('Invalid email format');
      }
    }

    // Validate phone format if provided (trim first)
    if (contactData.phone) {
      const trimmedPhone = contactData.phone.trim();
      if (trimmedPhone && !this.isValidPhone(trimmedPhone)) {
        errors.push('Invalid phone format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Creates contact with validation
  async createContact(contactData, saveContact) {
    const validation = this.validateContact(contactData);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    try {
      const contact = await saveContact({
        name: contactData.name.trim(),
        type: contactData.type,
        email: contactData.email ? contactData.email.trim() : '',
        phone: contactData.phone ? contactData.phone.trim() : '',
        address: contactData.address || ''
      });

      return {
        success: true,
        data: contact
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to create contact']
      };
    }
  }

  // Validates contact update
  validateContactUpdate(contactId, updateData) {
    const errors = [];

    if (!contactId) {
      errors.push('Contact ID is required');
    }

    // Validate fields only if they're being updated
    if (updateData.name !== undefined && (!updateData.name || updateData.name.trim() === '')) {
      errors.push('Contact name is required');
    }

    if (updateData.type !== undefined && !['customer', 'supplier', 'both'].includes(updateData.type)) {
      errors.push('Contact type must be customer, supplier, or both');
    }

    if (updateData.email !== undefined && updateData.email) {
      const trimmedEmail = updateData.email.trim();
      if (trimmedEmail && !this.isValidEmail(trimmedEmail)) {
        errors.push('Invalid email format');
      }
    }

    if (updateData.phone !== undefined && updateData.phone) {
      const trimmedPhone = updateData.phone.trim();
      if (trimmedPhone && !this.isValidPhone(trimmedPhone)) {
        errors.push('Invalid phone format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Basic email validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Basic phone validation (allows various formats)
  isValidPhone(phone) {
    if (!phone || phone.trim() === '') return false;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 4;
  }
}

module.exports = new ContactService();