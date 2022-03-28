const colors = require('tailwindcss/colors')
module.exports = {
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
  },
  theme: {
    extend: {
      colors: {
        primary: colors.cyan,
        secondary: colors.blue,
        incorrect: colors.rose,
        correct: colors.lime,
        skipped: colors.neutral,
        submit: colors.purple,
      },
    },
  },
  plugins: [

  ],
  content: [
    "./src/**/*.svelte",
  ]
};