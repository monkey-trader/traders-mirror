export class Price {
  public readonly value: number;
  constructor(price: number) {
    if (price <= 0) throw new PriceMustBePositiveError(price);
    this.value = price;
  }
}

export class PriceMustBePositiveError extends Error {
  constructor(price: unknown) {
    super(`Price must be positive: ${price}`);
    this.name = 'PriceMustBePositiveError';
  }
}
