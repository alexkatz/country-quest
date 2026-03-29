import { extendTailwindMerge } from 'tailwind-merge';

export const tw = extendTailwindMerge({
  extend: {
    theme: {
      color: ['background', 'text', 'surface', 'land'],
    },
  },
});
