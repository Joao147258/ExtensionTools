import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads and validates the public repository safety configuration.
 * Also attempts to load private rules if present in .local/repository-safety.private.json.
 */
export function loadSafetyConfig(projectRoot = process.cwd()) {
  const publicConfigPath = path.join(projectRoot, '.harness/config/repository-safety.config.json');
  if (!fs.existsSync(publicConfigPath)) {
    throw new Error(`Public configuration not found at: ${publicConfigPath}`);
  }

  let publicConfig;
  try {
    const raw = fs.readFileSync(publicConfigPath, 'utf8');
    publicConfig = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse public configuration JSON: ${err.message}`, { cause: err });
  }

  // Schema & critical properties validation
  if (!publicConfig.version || !publicConfig.rules) {
    throw new Error('Invalid repository-safety.config.json: Missing version or rules.');
  }

  const { rules } = publicConfig;
  if (!Array.isArray(rules.publicDirectories) || !Array.isArray(rules.prohibitedDirectories)) {
    throw new Error(
      'Invalid repository-safety.config.json: publicDirectories and prohibitedDirectories must be arrays.'
    );
  }

  // Check for private config
  const privateConfigPath = path.join(projectRoot, '.local/repository-safety.private.json');
  let privateConfig = {
    forbiddenReferences: [],
    additionalPrivatePaths: [],
    additionalSensitiveKeywords: [],
  };

  let hasPrivateConfig = false;
  if (fs.existsSync(privateConfigPath)) {
    try {
      const raw = fs.readFileSync(privateConfigPath, 'utf8');
      privateConfig = JSON.parse(raw);
      hasPrivateConfig = true;
    } catch (err) {
      throw new Error(`Failed to parse private configuration JSON in .local: ${err.message}`, {
        cause: err,
      });
    }
  }

  return {
    publicConfig,
    privateConfig,
    hasPrivateConfig,
  };
}
