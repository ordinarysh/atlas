#!/usr/bin/env tsx

/**
 * Development API Key Mint Script
 *
 * Generates a new API key for development and testing purposes.
 *
 * ⚠️  SECURITY WARNING ⚠️
 * - This script outputs the raw API key to the console
 * - Never commit API keys to version control
 * - Only use development keys in development/testing environments
 * - Production keys should be generated through secure, audited processes
 *
 * Usage:
 *   pnpm mint:key
 *   pnpm mint:key --id dev-frontend --scopes read:projects,write:projects
 *   pnpm mint:key --admin
 */

import { randomUUID } from "node:crypto";
import { createApiKeyStore, createApiKey, COMMON_SCOPES, SCOPE_GROUPS } from "@atlas/api-auth";

// Parse command line arguments
const args = process.argv.slice(2);

interface MintOptions {
  id?: string;
  scopes?: string[];
  admin?: boolean;
  expires?: string;
  name?: string;
  description?: string;
}

function parseArgs(): MintOptions {
  const options: MintOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--id":
        options.id = args[++i];
        break;
      case "--scopes":
        options.scopes = args[++i]?.split(",").map((s) => s.trim());
        break;
      case "--admin":
        options.admin = true;
        break;
      case "--expires":
        options.expires = args[++i];
        break;
      case "--name":
        options.name = args[++i];
        break;
      case "--description":
        options.description = args[++i];
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        showHelp();
        process.exit(1);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🔑 Atlas API Key Mint Script

Generate development API keys for testing and local development.

Usage:
  pnpm mint:key [options]

Options:
  --id <string>           Custom key ID (default: auto-generated)
  --scopes <scopes>       Comma-separated scopes (default: readonly)
  --admin                 Grant admin scope (bypasses all other permissions)
  --expires <date>        Expiration date (ISO format: 2024-12-31T23:59:59Z)
  --name <string>         Human-readable key name
  --description <string>  Key description
  --help, -h              Show this help message

Examples:
  pnpm mint:key
  pnpm mint:key --id dev-frontend --name "Frontend Development"
  pnpm mint:key --scopes read:projects,write:projects
  pnpm mint:key --admin --expires 2024-12-31T23:59:59Z
  
Available Scopes:
  Basic:     read, write, delete
  Projects:  read:projects, write:projects  
  System:    system:health, system:metrics
  Admin:     admin (bypasses all scope checks)

Scope Groups:
  readonly:  ${SCOPE_GROUPS.readonly.join(", ")}
  standard:  ${SCOPE_GROUPS.standard.join(", ")}
  service:   ${SCOPE_GROUPS.service.join(", ")}
  admin:     ${SCOPE_GROUPS.admin.join(", ")}

⚠️  Security Warning:
  - This script outputs the raw API key ONCE
  - Never commit API keys to version control
  - Only use in development/testing environments
  - Rotate keys regularly
`);
}

function validateOptions(options: MintOptions): void {
  // Validate expiration date
  if (options.expires) {
    const expiryDate = new Date(options.expires);
    if (isNaN(expiryDate.getTime())) {
      console.error("❌ Invalid expiration date format. Use ISO format: 2024-12-31T23:59:59Z");
      process.exit(1);
    }

    if (expiryDate <= new Date()) {
      console.error("❌ Expiration date must be in the future");
      process.exit(1);
    }
  }

  // Validate scopes
  if (options.scopes) {
    const allScopes = Object.values(COMMON_SCOPES);
    const invalidScopes = options.scopes.filter((scope) => !allScopes.includes(scope as any));

    if (invalidScopes.length > 0) {
      console.error(`❌ Invalid scopes: ${invalidScopes.join(", ")}`);
      console.error(`   Valid scopes: ${allScopes.join(", ")}`);
      process.exit(1);
    }
  }
}

async function mintApiKey() {
  console.log("🔑 Atlas API Key Mint Script\n");

  // Parse and validate arguments
  const options = parseArgs();
  validateOptions(options);

  // Show security warning
  console.log("⚠️  SECURITY WARNING:");
  console.log("   This script will display the raw API key ONCE");
  console.log("   Save it securely and never commit it to version control");
  console.log("   Only use this key in development/testing environments\n");

  try {
    // Create store
    const store = createApiKeyStore();

    // Prepare key options
    const keyId = options.id || `dev-${randomUUID().split("-")[0]}`;

    let scopes: string[];
    if (options.admin) {
      scopes = [...SCOPE_GROUPS.admin];
    } else if (options.scopes) {
      scopes = options.scopes;
    } else {
      scopes = [...SCOPE_GROUPS.readonly]; // Safe default
    }

    const keyOptions = {
      id: keyId,
      scopes,
      expiresAt: options.expires ? new Date(options.expires) : undefined,
      metadata: {
        name: options.name || `Development Key (${keyId})`,
        description: options.description || "Generated by mint-api-key script",
        createdBy: "mint-script",
        environment: "development",
        createdAt: new Date().toISOString(),
      },
    };

    // Generate the key
    console.log("🔄 Generating API key...");
    const result = await createApiKey(store, keyOptions);

    // Display results
    console.log("\n✅ API Key Generated Successfully!\n");

    // Display the raw key (THIS IS THE ONLY TIME IT'S SHOWN)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 API KEY (save this securely - shown only once):");
    console.log("");
    console.log(`   ${result.key}`);
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Display key information
    console.log("\n📋 Key Information:");
    console.log(`   ID:          ${result.record.id}`);
    console.log(`   Scopes:      ${result.record.scopes.join(", ")}`);
    console.log(`   Active:      ${result.record.active}`);
    console.log(`   Created:     ${result.record.createdAt.toISOString()}`);

    if (result.record.expiresAt) {
      console.log(`   Expires:     ${result.record.expiresAt.toISOString()}`);
    }

    if (result.record.metadata) {
      console.log(`   Name:        ${result.record.metadata.name}`);
      if (result.record.metadata.description) {
        console.log(`   Description: ${result.record.metadata.description}`);
      }
    }

    // Usage examples
    console.log("\n💡 Usage Examples:");
    console.log('   curl -H "Authorization: Bearer <API_KEY>" http://localhost:3000/api/projects');
    console.log('   curl -H "X-API-Key: <API_KEY>" http://localhost:3000/api/health');
    console.log("");

    // Environment variable suggestion
    console.log("🔧 Environment Variable (for testing):");
    console.log(`   export ATLAS_API_KEY="${result.key}"`);
    console.log("");

    // Final warnings
    console.log("⚠️  Remember:");
    console.log("   • This key is stored in memory and will be lost on server restart");
    console.log("   • Never commit this key to version control");
    console.log("   • Only use in development/testing environments");
    console.log("   • Rotate keys regularly for security");

    if (options.admin) {
      console.log("   • 🚨 ADMIN KEY: This key has administrative privileges!");
    }
  } catch (error) {
    console.error("\n❌ Failed to generate API key:");
    console.error(error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mintApiKey().catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
}
