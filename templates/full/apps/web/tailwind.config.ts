/**
 * Tailwind CSS v4 IDE Support Configuration
 *
 * Minimal config for IDE intellisense only.
 * All theme configuration is handled in CSS files.
 */

import type { Config } from 'tailwindcss'
import { atlasPreset } from '@atlas/design-system'

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
