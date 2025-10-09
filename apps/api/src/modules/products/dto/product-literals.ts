// apps/api/src/modules/products/dto/product-literals.ts
export const ProductTypeLiteral = ['PHYSICAL', 'DIGITAL'] as const;
export type ProductTypeLiteral = typeof ProductTypeLiteral[number];

export const ProductStatusLiteral = ['ACTIVE', 'INACTIVE'] as const;
export type ProductStatusLiteral = typeof ProductStatusLiteral[number];