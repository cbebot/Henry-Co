#!/usr/bin/env node
/**
 * Migration Validation Script
 *
 * Validates Supabase migration files for:
 * - Naming convention compliance
 * - Idempotency patterns
 * - Prohibited operations
 * - Required elements
 *
 * Usage:
 *   node scripts/ci/validate-migrations.mjs
 *   node scripts/ci/validate-migrations.mjs --strict  (fails on warnings)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const strict = process.argv.includes("--strict");

const MIGRATIONS_DIR = join(__dirname, "..", "..", "apps", "hub", "supabase", "migrations");

const VALIDATION_RULES = {
  naming: {
    pattern: /^\d{14}_[a-z0-9_]+\.sql$/,
    description: "YYYYMMDDHHMMSS_description.sql format",
  },
  timestamp: {
    min: "20240000000000",
    max: "20300000000000",
    description: "Timestamp between 2024-2030",
  },
};

const REQUIRED_PATTERNS = [
  { pattern: /create\s+(table|or\s+replace\s+function|index|policy)\s+if\s+not\s+exists/i, required: false, name: "Idempotent CREATE" },
  { pattern: /alter\s+table.*add\s+column\s+if\s+not\s+exists/i, required: false, name: "Idempotent ALTER ADD COLUMN" },
  { pattern: /drop\s+(trigger|policy)\s+if\s+exists/i, required: false, name: "Idempotent DROP TRIGGER/POLICY" },
];

const PROHIBITED_PATTERNS = [
  { pattern: /create\s+table(?!\s+if\s+not\s+exists)/i, name: "Non-idempotent CREATE TABLE", severity: "error" },
  { pattern: /alter\s+table.*drop\s+column/i, name: "DROP COLUMN (destructive)", severity: "warning", reason: "Document recovery plan" },
  { pattern: /drop\s+table/i, name: "DROP TABLE (destructive)", severity: "warning", reason: "Document recovery plan" },
  { pattern: /delete\s+from\s+\w+\s+where/i, name: "Bulk DELETE", severity: "warning", reason: "Verify WHERE clause is correct" },
  { pattern: /update\s+\w+\s+set.*where/i, name: "Bulk UPDATE", severity: "warning", reason: "Verify WHERE clause and test on copy" },
  { pattern: /truncate\s+table/i, name: "TRUNCATE TABLE", severity: "error", reason: "Never truncate in production migrations" },
];

const RECOMMENDED_ELEMENTS = [
  { pattern: /enable\s+row\s+level\s+security/i, name: "RLS enabled", applicableTo: "user_data_tables" },
  { pattern: /create\s+policy/i, name: "RLS policy defined", applicableTo: "user_data_tables" },
  { pattern: /create\s+index\s+if\s+not\s+exists/i, name: "Indexes for performance" },
  { pattern: /comment\s+on/i, name: "Table/column comments" },
];

function validateFilename(filename) {
  const errors = [];
  const warnings = [];

  // Check extension
  if (extname(filename) !== ".sql") {
    errors.push(`Must be .sql file`);
    return { valid: false, errors, warnings };
  }

  // Check naming pattern
  const baseName = basename(filename, ".sql");
  if (!VALIDATION_RULES.naming.pattern.test(filename)) {
    errors.push(`Filename must match ${VALIDATION_RULES.naming.description}`);
    errors.push(`  Got: ${baseName}`);
    return { valid: false, errors, warnings };
  }

  // Extract and validate timestamp
  const timestamp = baseName.substring(0, 14);
  if (timestamp < VALIDATION_RULES.timestamp.min || timestamp > VALIDATION_RULES.timestamp.max) {
    warnings.push(`Timestamp ${timestamp} is outside expected range (2024-2030)`);
  }

  // Check description length
  const description = baseName.substring(15);
  if (description.length < 5) {
    warnings.push(`Description too short: "${description}"`);
  }
  if (description.length > 80) {
    warnings.push(`Description too long: "${description.substring(0, 40)}..."`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateContent(content, filename) {
  const errors = [];
  const warnings = [];
  const lines = content.split(/\r?\n/);

  // Check for prohibited patterns
  for (const prohibited of PROHIBITED_PATTERNS) {
    if (prohibited.pattern.test(content)) {
      const message = `${prohibited.name}${prohibited.reason ? ` - ${prohibited.reason}` : ""}`;
      if (prohibited.severity === "error") {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  }

  // Check for idempotency patterns (encourage but don't require)
  const hasIdempotentCreate = /create\s+(table|or\s+replace\s+function|index)\s+if\s+not\s+exists/i.test(content);
  const hasIdempotentAlter = /alter\s+table.*add\s+column\s+if\s+not\s+exists/i.test(content);
  const hasDropIfExists = /drop\s+(trigger|policy|index)\s+if\s+exists/i.test(content);

  if (!hasIdempotentCreate && !hasIdempotentAlter) {
    warnings.push("No idempotent CREATE/ALTER patterns found (IF NOT EXISTS / OR REPLACE)");
  }

  if (/create\s+(trigger|policy)/i.test(content) && !hasDropIfExists) {
    warnings.push("CREATE TRIGGER/POLICY without preceding DROP IF EXISTS (may fail on re-run)");
  }

  // Check for RLS on new tables
  const createTableMatches = content.match(/create\s+table\s+if\s+not\s+exists\s+(\w+)/gi) || [];
  const hasRlsEnable = /enable\s+row\s+level\s+security/i.test(content);
  
  if (createTableMatches.length > 0 && !hasRlsEnable) {
    const tableNames = createTableMatches.map(m => m.replace(/create\s+table\s+if\s+not\s+exists\s+/i, ""));
    warnings.push(`New table(s) without RLS: ${tableNames.join(", ")}. Consider if user data needs protection.`);
  }

  // Check for dangerous raw SQL
  const hasTransactionControl = /\bbegin\b|\bcommit\b|\brollback\b/i.test(content);
  if (hasTransactionControl) {
    warnings.push("Explicit transaction control found. Ensure this is intentional and correct.");
  }

  return { errors, warnings, lines: lines.length };
}

function validateMigrations() {
  console.log("HenryCo Migration Validation\n");
  console.log("============================\n");

  let allErrors = 0;
  let allWarnings = 0;
  let filesChecked = 0;

  try {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migration files found.");
      return { success: true, errors: 0, warnings: 0 };
    }

    console.log(`Checking ${files.length} migration file(s)...\n`);

    for (const filename of files) {
      const filepath = join(MIGRATIONS_DIR, filename);
      
      // Skip directories
      try {
        if (statSync(filepath).isDirectory()) continue;
      } catch {
        continue;
      }

      filesChecked++;
      console.log(`📄 ${filename}`);

      // Validate filename
      const filenameValidation = validateFilename(filename);
      if (!filenameValidation.valid) {
        console.log("   ❌ FILENAME ERRORS:");
        for (const error of filenameValidation.errors) {
          console.log(`      • ${error}`);
        }
        allErrors += filenameValidation.errors.length;
      }
      
      for (const warning of filenameValidation.warnings) {
        console.log(`   ⚠️  ${warning}`);
      }
      allWarnings += filenameValidation.warnings.length;

      // Validate content
      try {
        const content = readFileSync(filepath, "utf8");
        const contentValidation = validateContent(content, filename);

        if (contentValidation.errors.length > 0) {
          console.log("   ❌ CONTENT ERRORS:");
          for (const error of contentValidation.errors) {
            console.log(`      • ${error}`);
          }
        }

        for (const warning of contentValidation.warnings) {
          console.log(`   ⚠️  ${warning}`);
        }

        console.log(`   ℹ️  ${contentValidation.lines} lines`);

        allErrors += contentValidation.errors.length;
        allWarnings += contentValidation.warnings.length;
      } catch (err) {
        console.log(`   ❌ Could not read file: ${err.message}`);
        allErrors++;
      }

      console.log("");
    }

    // Summary
    console.log("============================");
    console.log("VALIDATION SUMMARY");
    console.log("============================");
    console.log(`Files checked: ${filesChecked}`);
    console.log(`Errors: ${allErrors}`);
    console.log(`Warnings: ${allWarnings}`);

    if (allErrors === 0 && allWarnings === 0) {
      console.log("\n✅ All migrations pass validation.");
      return { success: true, errors: 0, warnings: 0 };
    }

    if (allErrors === 0 && allWarnings > 0) {
      console.log("\n⚠️  No errors, but warnings found.");
      if (strict) {
        console.log("   (Strict mode: treating warnings as failures)");
        return { success: false, errors: 0, warnings: allWarnings };
      }
      console.log("   Run with --strict to fail on warnings.");
      return { success: true, errors: 0, warnings: allWarnings };
    }

    console.log("\n❌ Validation failed. Fix errors before merging.");
    return { success: false, errors: allErrors, warnings: allWarnings };

  } catch (err) {
    console.error(`\n❌ Validation script error: ${err.message}`);
    process.exit(1);
  }
}

const result = validateMigrations();
process.exit(result.success ? 0 : 1);
