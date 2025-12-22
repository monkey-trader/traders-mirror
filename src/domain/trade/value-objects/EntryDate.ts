export class EntryDate {
  public readonly iso: string

  constructor(isoOrDate: string | Date) {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
    if (Number.isNaN(d.getTime())) throw new Error('Entry date required')
    this.iso = d.toISOString()
  }

  toDate() {
    return new Date(this.iso)
  }

  toString() {
    return this.iso
  }

  equals(other: EntryDate) {
    return this.iso === other.iso
  }
}

