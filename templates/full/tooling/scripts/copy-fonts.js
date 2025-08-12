#!/usr/bin/env node

/**
 * Copy Fonts Script
 *
 * Copies font files from packages/ui/src/fonts to all app public directories.
 * Run this after adding new fonts to ensure they're available in all apps.
 *
 * Usage:
 *   node scripts/copy-fonts.js
 *   npm run fonts:copy (if added to package.json)
 */

const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");

async function copyFonts() {
  const fontSource = path.join(__dirname, "../packages/ui/src/fonts");
  const apps = ["web"]; // Add more apps here: ['web', 'admin', 'mobile']

  // Check if fonts directory exists
  if (!fsSync.existsSync(fontSource)) {
    console.log("📁 No fonts directory found at packages/ui/src/fonts/");
    console.log("   Create the directory and add .woff2 files to get started!");
    return;
  }

  // Get list of font files
  const fontFiles = await fs.readdir(fontSource);
  const actualFonts = fontFiles.filter(
    (file) => file.endsWith(".woff2") || file.endsWith(".woff") || file.endsWith(".ttf"),
  );

  if (actualFonts.length === 0) {
    console.log("📁 No font files found in packages/ui/src/fonts/");
    console.log("   Add .woff2 files there and run this script again.");
    return;
  }

  console.log(`🔤 Found ${actualFonts.length} font file(s):`);
  actualFonts.forEach((font) => console.log(`   • ${font}`));
  console.log("");

  for (const app of apps) {
    const destination = path.join(__dirname, `../apps/${app}/public/fonts`);

    try {
      // Ensure app directory exists
      const appPath = path.join(__dirname, `../apps/${app}`);
      if (!fsSync.existsSync(appPath)) {
        console.log(`⚠️  Skipping ${app} (app directory doesn't exist)`);
        continue;
      }

      // Ensure public/fonts directory exists
      await fs.mkdir(destination, { recursive: true });

      // Copy all fonts
      for (const fontFile of actualFonts) {
        const sourcePath = path.join(fontSource, fontFile);
        const destPath = path.join(destination, fontFile);
        await fs.copyFile(sourcePath, destPath);
      }

      console.log(`✅ Copied ${actualFonts.length} fonts to apps/${app}/public/fonts/`);
    } catch (error) {
      console.error(`❌ Failed to copy fonts to ${app}:`, error.message);
    }
  }

  console.log("");
  console.log("🎉 Font copying complete!");
  console.log("");
  console.log("Next steps:");
  console.log("1. Define @font-face in packages/ui/src/theme.css");
  console.log("2. Add font variables to @theme static");
  console.log("3. Preload fonts in your app layout");
  console.log("");
  console.log("📖 Full guide: docs/FONT_SETUP.md");
}

// Handle errors gracefully
copyFonts().catch((error) => {
  console.error("💥 Script failed:", error.message);
  process.exit(1);
});
