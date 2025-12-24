export type TradeTargetKind = 'TAKE_PROFIT' | 'STOP_LOSS' | 'BREAK_EVEN' | 'OTHER'

export type TradeTargetStatus = 'OPEN' | 'TRIGGERED' | 'CANCELED'

export type TradeTargetDTO = {
  id?: string
  kind: TradeTargetKind
  rank?: number
  price: number
  size?: number
  status?: TradeTargetStatus
  executedPrice?: number
  executedAt?: string
  note?: string
}

export class TradeTargetKindInvalidError extends Error {}
export class TradeTargetPriceInvalidError extends Error {}
export class TradeTargetRankInvalidError extends Error {}
export class TradeTargetSizeInvalidError extends Error {}

export class TradeTarget {
  private readonly _id?: string
  private readonly _kind: TradeTargetKind
  private readonly _rank?: number
  private readonly _price: number
  private readonly _size?: number
  private _status: TradeTargetStatus
  private _executedPrice?: number
  private _executedAt?: string
  private _note?: string

  constructor(input: TradeTargetDTO) {
    const { id, kind, rank, price, size, status, executedPrice, executedAt, note } = input

    const allowedKinds: TradeTargetKind[] = ['TAKE_PROFIT', 'STOP_LOSS', 'BREAK_EVEN', 'OTHER']
    if (!allowedKinds.includes(kind)) {
      throw new TradeTargetKindInvalidError('Invalid TradeTarget kind')
    }

    const priceNum = Number(price)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      throw new TradeTargetPriceInvalidError('Price must be a positive number')
    }

    if (kind === 'TAKE_PROFIT' && rank !== undefined) {
      const rankNum = Number(rank)
      if (!Number.isInteger(rankNum) || rankNum < 1) {
        throw new TradeTargetRankInvalidError('Rank must be an integer >= 1 for TAKE_PROFIT')
      }
      this._rank = rankNum
    }

    if (size !== undefined) {
      const sizeNum = Number(size)
      if (!Number.isFinite(sizeNum) || sizeNum <= 0) {
        throw new TradeTargetSizeInvalidError('Size must be a positive number')
      }
      this._size = sizeNum
    }

    this._id = id
    this._kind = kind
    this._price = priceNum
    // normalize status: default OPEN; allowed statuses are OPEN/TRIGGERED/CANCELED
    this._status = (status ?? 'OPEN') as TradeTargetStatus
    this._executedPrice = executedPrice
    this._executedAt = executedAt
    this._note = note
  }

  toPrimitive(): TradeTargetDTO {
    return {
      id: this._id,
      kind: this._kind,
      rank: this._rank,
      price: this._price,
      size: this._size,
      status: this._status,
      executedPrice: this._executedPrice,
      executedAt: this._executedAt,
      note: this._note,
    }
  }

  // getters
  get id(): string | undefined { return this._id }
  get kind(): TradeTargetKind { return this._kind }
  get rank(): number | undefined { return this._rank }
  get price(): number { return this._price }
  get size(): number | undefined { return this._size }
  get status(): TradeTargetStatus { return this._status }
  get executedPrice(): number | undefined { return this._executedPrice }
  get executedAt(): string | undefined { return this._executedAt }
  get note(): string | undefined { return this._note }

  // mutating helpers
  markTriggered(executedPrice?: number, executedAt?: string) {
    this._status = 'TRIGGERED'
    if (executedPrice !== undefined) this._executedPrice = executedPrice
    if (executedAt !== undefined) this._executedAt = executedAt
  }

  markCanceled() {
    this._status = 'CANCELED'
  }
}

