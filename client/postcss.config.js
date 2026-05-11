// Tailwind v4 does not require postcss-import or tailwind/nesting
// plugins; only autoprefixer is still needed for vendor prefixes.
export default {
  plugins: {
    autoprefixer: {},
  },
};
