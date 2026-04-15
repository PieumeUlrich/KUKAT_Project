import { body } from 'express-validator';

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .notEmpty().withMessage('New password is required.'),
];

export const bookingValidator = [
  body('customerID').isInt({ min: 1 }).withMessage('Valid customer is required.'),
  body('productID').isInt({ min: 1 }).withMessage('Valid product is required.'),
  body('bookingDate').isDate().withMessage('Valid booking date is required.'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number.'),
  body('taxRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100.'),
  body('numberOfTravellers').optional().isInt({ min: 1 }).withMessage('Travellers must be at least 1.'),
];

export const customerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required.'),
];

export const employeeValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().withMessage('Valid email is required.'),
  body('roleID').isInt({ min: 1 }).withMessage('Valid role is required.'),
  body('password').if(body('employeeID').not().exists())
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

export const productValidator = [
  body('productName').trim().notEmpty().withMessage('Product name is required.'),
  body('supplierID').isInt({ min: 1 }).withMessage('Valid supplier is required.'),
  body('categoryID').isInt({ min: 1 }).withMessage('Valid category is required.'),
];

export const paymentValidator = [
  body('amountPaid').isFloat({ min: 0.01 }).withMessage('Amount paid must be greater than 0.'),
  body('paymentMethod').isIn(['CARD', 'CASH', 'TRANSFER', 'CHECK', 'CHEQUE'])
    .withMessage('Valid payment method is required.'),
  body('paymentDate').optional().isDate().withMessage('Valid payment date is required.'),
];

export const commissionPaymentValidator = [
  body('paymentAmount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0.'),
  body('paymentMethod').isIn(['TRANSFER', 'CHEQUE', 'CASH'])
    .withMessage('Valid payment method is required.'),
];