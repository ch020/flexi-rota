// postcss.config.cjs

module.exports = {
  plugins: [
    require('tailwindcss'), // Ensure tailwindcss is included
    require('autoprefixer'), // Keep autoprefixer
  ],
};
