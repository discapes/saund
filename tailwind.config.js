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
        primary2: colors.purple,
        secondary2: colors.pink,
        incorrect: colors.rose,
        correct: colors.lime,
        skipped: colors.neutral,
        submit: colors.purple,
      },
      inset: {
        '1/16': '6.25%',
        '2/16': '12.5%',
        '4/16': '25%',
        '7/16': '43.75%',
        '11/16': '68.75%',
      },
      borderColor: {
        DEFAULT: colors.white,
      },
    },
  },
  plugins: [

  ],
  content: [
    "./src/**/*.svelte",
    "./src/**/*.js",
  ]
};