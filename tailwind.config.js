/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

module.exports = {
  content: ["./src/**/*.{html,md}"],
  theme: {
    colors: {
      'black': '#000000',
      'white': '#ffffff',
      'gray': {
        50: '#f7f7f8',
        100: '#ecedee',
        200: '#dcdee0',
        300: '#bfc3c5',
        400: '#9fa4a8',
        500: '#747c81',
        600: '#52585b',
        700: '#3d4143',
        800: '#27292b',
        900: '#131515',
        950: '#0a0a0b'
      },
      'blue': {
        50: '#f6fbfe',
        100: '#e8f5fd',
        200: '#c8e7f9',
        300: '#87c5e8',
        400: '#51b3ec',
        500: '#218cca',
        600: '#166ea2',
        700: '#0d4d73',
        800: '#05324d',
        900: '#032030',
        950: '#00101a'
      },
      'green': colors.green,
      'red': colors.red,
      'amber': colors.amber
    },
    extend: {
      fontFamily: {
        'sans': ['Rubik', ...defaultTheme.fontFamily.sans],
        'serif': ['Libre Baskerville', ...defaultTheme.fontFamily.serif],
        'mono': ['Roboto Mono', ...defaultTheme.fontFamily.mono],
        'title': ['Trirong', ...defaultTheme.fontFamily.serif]
      }
    }
  },
  plugins: [],
}

