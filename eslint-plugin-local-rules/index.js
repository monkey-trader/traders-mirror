const path = require('path')
const fs = require('fs')

const rulesDir = path.resolve(__dirname, '../tools/eslint-rules')
const rules = {}

if (fs.existsSync(rulesDir)) {
  const files = fs.readdirSync(rulesDir)
  for (const f of files) {
    if (f.endsWith('.js')) {
      const name = f.replace(/\.js$/, '')
      rules[name] = require(path.join(rulesDir, f))
    }
  }
}

module.exports = {
  rules,
}

