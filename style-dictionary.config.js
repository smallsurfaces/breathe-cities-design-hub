/** @type {import('style-dictionary').Config} */
export default {
  source: [
    'tokens/global/*.json',
    'tokens/semantic/*.json',
  ],

  platforms: {
    // ─── CSS Custom Properties ────────────────────────────────────────────────
    css: {
      transformGroup: 'css',
      prefix: 'bc',
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            selector: ':root',
            outputReferences: true,
          },
        },
      ],
    },

    // ─── Tailwind Theme Extension ─────────────────────────────────────────────
    tailwind: {
      transformGroup: 'js',
      buildPath: 'dist/tailwind/',
      files: [
        {
          destination: 'theme.js',
          format: 'javascript/module',
        },
      ],
    },

    // ─── JSON (for Figma Token Studio sync) ──────────────────────────────────
    json: {
      transformGroup: 'js',
      buildPath: 'dist/json/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/nested',
        },
      ],
    },
  },
};
