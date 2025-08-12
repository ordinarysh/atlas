#!/usr/bin/env node

import { execSync } from 'child_process'
import { mkdtempSync, cpSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const templateDir = join(__dirname, '..')

// Parse arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry')

console.log('🚀 Atlas Template Smoke Test')
console.log('============================')

if (isDryRun) {
  console.log('📝 DRY RUN MODE - No actual commands will be executed')
  console.log('')
  console.log('Would perform the following steps:')
  console.log('1. Create temporary directory in system temp')
  console.log('2. Copy template files to temp directory')
  console.log('3. Run: pnpm install')
  console.log('4. Run: pnpm build')
  console.log('5. Run: pnpm type-check')
  console.log('6. Clean up temporary directory')
  console.log('')
  console.log('✅ Dry run complete')
  process.exit(0)
}

let tempDir

try {
  // Step 1: Create temporary directory
  console.log('📁 Creating temporary directory...')
  tempDir = mkdtempSync(join(tmpdir(), 'atlas-template-'))
  console.log(`   Created: ${tempDir}`)

  // Step 2: Copy template to temp directory
  console.log('📋 Copying template files...')
  cpSync(templateDir, tempDir, { 
    recursive: true,
    filter: (src) => {
      // Skip node_modules and build outputs
      const skip = ['node_modules', '.turbo', 'dist', '.next'].some(dir => 
        src.includes(`/${dir}`) || src.endsWith(dir)
      )
      return !skip
    }
  })
  console.log('   Template copied successfully')

  // Step 3: Install dependencies
  console.log('📦 Installing dependencies with pnpm...')
  execSync('pnpm install', { 
    cwd: tempDir, 
    stdio: 'inherit',
    env: { ...process.env, COREPACK_ENABLE_STRICT: '0' }
  })

  // Step 4: Build all packages
  console.log('🔨 Building all packages...')
  execSync('pnpm build', { 
    cwd: tempDir, 
    stdio: 'inherit' 
  })

  // Step 5: Type check
  console.log('✔️  Running type checks...')
  execSync('pnpm type-check', { 
    cwd: tempDir, 
    stdio: 'inherit' 
  })

  console.log('')
  console.log('✅ Smoke test passed successfully!')

} catch (error) {
  console.error('')
  console.error('❌ Smoke test failed:')
  console.error(error.message)
  process.exit(1)
} finally {
  // Clean up
  if (tempDir) {
    console.log('🧹 Cleaning up temporary directory...')
    try {
      rmSync(tempDir, { recursive: true, force: true })
      console.log('   Cleanup complete')
    } catch (cleanupError) {
      console.warn('   Warning: Failed to clean up temp directory:', cleanupError.message)
    }
  }
}