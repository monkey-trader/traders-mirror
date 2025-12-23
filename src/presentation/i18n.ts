// Centralized i18n/messages for presentation layer
const messages = {
  en: {
    symbolRequired: 'Symbol required',
    entryDateRequired: 'Entry date required',
    invalidDate: 'Invalid date',
    sizePositive: 'Size must be positive',
    sizeNumber: 'Size must be a number',
    pricePositive: 'Price must be positive',
    priceNumber: 'Price must be a number',
    failedAdd: 'Failed to add trade',
    symbolTooLong: 'Symbol too long',
  },
}

const locale = 'en'

export const t = (key: keyof typeof messages['en']) => messages[locale][key]

export type MessageKey = keyof typeof messages['en']

