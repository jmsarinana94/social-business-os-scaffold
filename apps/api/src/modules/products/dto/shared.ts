import { registerDecorator, ValidationOptions } from 'class-validator';

export function optionalString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'optionalString',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return value === undefined || value === null || typeof value === 'string';
        },
      },
    });
  };
}

// narrow string unions used by DTOs (the API surface)
export type DTOType = 'PHYSICAL' | 'DIGITAL';
export type DTOStatus = 'ACTIVE' | 'INACTIVE';

// Very simple SKU format (A–Z, 0–9, dash, underscore, dot); no spaces.
export const SKU_REGEX = /^[A-Z0-9._-]+$/;