/**
 * Tailwind CSS v4 IDE Support Configuration
 *
 * Minimal config for IDE intellisense only.
 * All theme configuration is handled in CSS files.
 */

import { atlasPreset } from '@atlas/design-system'
import type { Config } from 'tailwindcss'

const config: Config = {
  // Use the Atlas Design System preset
  presets: [atlasPreset()],

  // Content paths for IDE intellisense support only
  content: [
    './src/**/*.{js,jsx,ts,tsx,html,md,mdx}',
    '../../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
}

export default config
