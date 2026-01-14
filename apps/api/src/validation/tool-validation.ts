import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/AppError';
import { CreateAIToolInput } from '../services/ai-tool.service';

const CATEGORIES = ['LLM', 'CodeGen', 'RPA', 'Analytics', 'ImageGen', 'VoiceGen', 'Other'];
const DATA_TYPES = ['PII', 'Financial', 'IP', 'Proprietary', 'Public'];
const FREQUENCIES = ['Daily', 'Weekly', 'Rarely'];

export function validateCreateTool(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const input: CreateAIToolInput = req.body;
  const errors: Record<string, string[]> = {};

  // Name validation
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.name = ['Name is required'];
  } else if (input.name.trim().length > 200) {
    errors.name = ['Name must be less than 200 characters'];
  }

  // Category validation
  if (!input.category || typeof input.category !== 'string') {
    errors.category = ['Category is required'];
  } else if (!CATEGORIES.includes(input.category)) {
    errors.category = [`Category must be one of: ${CATEGORIES.join(', ')}`];
  }

  // Data types validation
  if (!Array.isArray(input.dataTypes) || input.dataTypes.length === 0) {
    errors.dataTypes = ['At least one data type must be selected'];
  } else {
    const invalidTypes = input.dataTypes.filter(
      (type) => typeof type !== 'string' || !DATA_TYPES.includes(type)
    );
    if (invalidTypes.length > 0) {
      errors.dataTypes = [
        `Invalid data types. Must be one of: ${DATA_TYPES.join(', ')}`,
      ];
    }
  }

  // Users validation
  if (typeof input.users !== 'number' || input.users < 1) {
    errors.users = ['Users must be a positive number'];
  } else if (input.users > 1000000) {
    errors.users = ['Users cannot exceed 1,000,000'];
  }

  // Frequency validation
  if (!input.frequency || typeof input.frequency !== 'string') {
    errors.frequency = ['Frequency is required'];
  } else if (!FREQUENCIES.includes(input.frequency)) {
    errors.frequency = [`Frequency must be one of: ${FREQUENCIES.join(', ')}`];
  }

  // Controls validation (optional but must be array if provided)
  if (input.controls !== undefined) {
    if (!Array.isArray(input.controls)) {
      errors.controls = ['Controls must be an array'];
    } else {
      const invalidControls = input.controls.filter(
        (control: string) => typeof control !== 'string' || control.trim().length === 0
      );
      if (invalidControls.length > 0) {
        errors.controls = ['All controls must be non-empty strings'];
      }
    }
  }

  // Optional fields validation
  if (input.vendor !== undefined && typeof input.vendor !== 'string') {
    errors.vendor = ['Vendor must be a string'];
  }

  if (input.description !== undefined && typeof input.description !== 'string') {
    errors.description = ['Description must be a string'];
  }

  if (input.url !== undefined) {
    if (typeof input.url !== 'string') {
      errors.url = ['URL must be a string'];
    } else if (input.url.trim().length > 0) {
      try {
        new URL(input.url);
      } catch {
        errors.url = ['URL must be a valid URL format'];
      }
    }
  }

  if (input.dataResidency !== undefined && typeof input.dataResidency !== 'string') {
    errors.dataResidency = ['Data residency must be a string'];
  }

  if (input.notes !== undefined && typeof input.notes !== 'string') {
    errors.notes = ['Notes must be a string'];
  }

  if (input.hasDPA !== undefined && typeof input.hasDPA !== 'boolean') {
    errors.hasDPA = ['hasDPA must be a boolean'];
  }

  // If there are errors, return validation error
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  // Clean and normalize input
  req.body = {
    ...input,
    name: input.name.trim(),
    category: input.category.trim(),
    vendor: input.vendor?.trim(),
    description: input.description?.trim(),
    url: input.url?.trim(),
    dataTypes: input.dataTypes.map((dt) => dt.trim()),
    controls: input.controls?.map((c) => c.trim()) || [],
    dataResidency: input.dataResidency?.trim(),
    notes: input.notes?.trim(),
  };

  next();
}

export function validateUpdateTool(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const input = req.body;
  const errors: Record<string, string[]> = {};

  // All fields are optional for updates, but if provided, must be valid

  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      errors.name = ['Name cannot be empty'];
    } else if (input.name.trim().length > 200) {
      errors.name = ['Name must be less than 200 characters'];
    }
  }

  if (input.category !== undefined) {
    if (typeof input.category !== 'string') {
      errors.category = ['Category must be a string'];
    } else if (!CATEGORIES.includes(input.category)) {
      errors.category = [`Category must be one of: ${CATEGORIES.join(', ')}`];
    }
  }

  if (input.dataTypes !== undefined) {
    if (!Array.isArray(input.dataTypes) || input.dataTypes.length === 0) {
      errors.dataTypes = ['At least one data type must be selected'];
    } else {
      const invalidTypes = input.dataTypes.filter(
        (type: string) => typeof type !== 'string' || !DATA_TYPES.includes(type)
      );
      if (invalidTypes.length > 0) {
        errors.dataTypes = [
          `Invalid data types. Must be one of: ${DATA_TYPES.join(', ')}`,
        ];
      }
    }
  }

  if (input.users !== undefined) {
    if (typeof input.users !== 'number' || input.users < 1) {
      errors.users = ['Users must be a positive number'];
    } else if (input.users > 1000000) {
      errors.users = ['Users cannot exceed 1,000,000'];
    }
  }

  if (input.frequency !== undefined) {
    if (typeof input.frequency !== 'string') {
      errors.frequency = ['Frequency must be a string'];
    } else if (!FREQUENCIES.includes(input.frequency)) {
      errors.frequency = [`Frequency must be one of: ${FREQUENCIES.join(', ')}`];
    }
  }

  if (input.controls !== undefined) {
    if (!Array.isArray(input.controls)) {
      errors.controls = ['Controls must be an array'];
    } else {
      const invalidControls = input.controls.filter(
        (control: string) => typeof control !== 'string' || control.trim().length === 0
      );
      if (invalidControls.length > 0) {
        errors.controls = ['All controls must be non-empty strings'];
      }
    }
  }

  if (input.url !== undefined && input.url !== null && input.url !== '') {
    if (typeof input.url !== 'string') {
      errors.url = ['URL must be a string'];
    } else {
      try {
        new URL(input.url);
      } catch {
        errors.url = ['URL must be a valid URL format'];
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  // Clean and normalize input
  if (input.name) req.body.name = input.name.trim();
  if (input.category) req.body.category = input.category.trim();
  if (input.vendor) req.body.vendor = input.vendor.trim();
  if (input.description) req.body.description = input.description.trim();
  if (input.url) req.body.url = input.url.trim();
  if (input.dataTypes) {
    req.body.dataTypes = input.dataTypes.map((dt: string) => dt.trim());
  }
  if (input.controls) {
    req.body.controls = input.controls.map((c: string) => c.trim());
  }
  if (input.dataResidency) req.body.dataResidency = input.dataResidency.trim();
  if (input.notes) req.body.notes = input.notes.trim();

  next();
}
