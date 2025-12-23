/**
 * ESLint rule: no-short-vo-names
 * Reports when a VariableDeclarator assigns `new TradeSymbol(...) | new EntryDate(...) | new Size(...) | new Price(...)`
 * to a short variable name (<= 3 chars). This enforces descriptive VO variable names.
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow short variable names for Value Object instances (TradeSymbol, EntryDate, Size, Price)',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'number' }
        },
        additionalProperties: false
      }
    ],
  },
  create(context) {
    const opts = context.options[0] || {}
    const MAX = typeof opts.max === 'number' ? opts.max : 3
    const VO_NAMES = new Set(['TradeSymbol', 'EntryDate', 'Size', 'Price'])

    return {
      VariableDeclarator(node) {
        if (!node.init) return
        if (node.init.type !== 'NewExpression') return
        const callee = node.init.callee
        if (!callee || callee.type !== 'Identifier') return
        if (!VO_NAMES.has(callee.name)) return

        // variable id can be Identifier or Pattern; only handle Identifier for now
        if (node.id && node.id.type === 'Identifier') {
          const name = node.id.name
          if (name.length <= MAX) {
            context.report({ node: node.id, message: `VO variable name '{{name}}' is too short; use a descriptive name like '${callee.name === 'TradeSymbol' ? 'tradeSymbol' : (callee.name === 'EntryDate' ? 'entityDate' : (callee.name === 'Size' ? 'sizeVo' : 'priceVo'))}'`, data: { name } })
          }
        }
      }
    }
  }
}

