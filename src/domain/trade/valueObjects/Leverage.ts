export class Leverage {
  public readonly value: string

  constructor(raw?: string) {
    if (!raw) {
      this.value = ''
      return
    }
    const v = String(raw).trim()
    // simple normalization: keep as string like '10x' or '5'
    if (!v) throw new Error('Invalid leverage')
    this.value = v
  }
}

