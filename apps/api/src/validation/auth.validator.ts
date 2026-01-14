import { BadRequestError, ValidationError } from '../errors/AppError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false, // Optional for now
};

export class AuthValidator {
  /**
   * Validate email format
   */
  static validateEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new BadRequestError('Email is required');
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      throw new ValidationError('Invalid email format');
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new BadRequestError('Password is required');
    }

    const errors: string[] = [];

    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    }

    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new ValidationError('Password does not meet requirements', {
        password: errors,
      });
    }
  }

  /**
   * Validate signup input
   */
  static validateSignup(input: {
    email: string;
    password: string;
    name: string;
    companyName: string;
  }): void {
    this.validateEmail(input.email);
    this.validatePassword(input.password);

    if (!input.name || typeof input.name !== 'string' || input.name.trim().length < 2) {
      throw new BadRequestError('Name must be at least 2 characters');
    }

    if (!input.companyName || typeof input.companyName !== 'string' || input.companyName.trim().length < 2) {
      throw new BadRequestError('Company name must be at least 2 characters');
    }
  }

  /**
   * Validate login input
   */
  static validateLogin(input: { email: string; password: string }): void {
    this.validateEmail(input.email);

    if (!input.password || typeof input.password !== 'string') {
      throw new BadRequestError('Password is required');
    }
  }
}
