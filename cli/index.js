#!/usr/bin/env node

/**
 * Claude Crew CLI
 * Generate social media-ready PNG images of your Claude Code agents
 */

import { program } from 'commander';
import { resolve, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { loadAll, getCounts } from './src/agentLoader.js';
import { enrichAgents, checkClaudeCLI } from './src/metadataGenerator.js';
import { generateCrewImage } from './src/imageGenerator.js';

/* global __VERSION__ */
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0-dev';

program
  .name('claude-crew')
  .description('Generate social media-ready PNG images of your Claude Code agents')
  .version(VERSION);

program
  .command('generate')
  .description('Generate a crew image from your Claude agents')
  .option('-o, --output <path>', 'Output file path', './claude-crew.png')
  .option('-a, --agents <dir>', 'Agents directory', '~/.claude/agents')
  .option('--no-plugins', 'Exclude plugins from the image')
  .action(async (options) => {
    try {
      const outputPath = resolve(options.output);
      const outputDir = dirname(outputPath);

      // Ensure output directory exists
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Get counts
      const counts = getCounts(options.agents, { includePlugins: options.plugins !== false });
      if (counts.total === 0) {
        console.error(`Error: No agents or plugins found`);
        console.log('\nMake sure you have agent markdown files in ~/.claude/agents/');
        console.log('or installed plugins in ~/.claude/plugins/');
        process.exit(1);
      }

      console.log(`Found ${counts.agents} agent(s) and ${counts.plugins} plugin(s)`);

      // Check if Claude CLI is available (required for metadata generation)
      const claudeAvailable = await checkClaudeCLI();
      if (!claudeAvailable) {
        console.error('\nError: Claude CLI is required but not found.');
        console.log('\nThis tool generates AI-powered metadata for your agents using Claude CLI.');
        console.log('Please install Claude CLI first: https://claude.ai/code');
        process.exit(1);
      }

      // Load all agents and plugins
      console.log('\nLoading agents and plugins...');
      const items = await loadAll(options.agents, { includePlugins: options.plugins !== false });

      // Generate metadata for each agent using AI
      console.log('Generating metadata for each agent...');
      const enrichedItems = await enrichAgents(items, 2);

      // Log items
      console.log('\nItems to render:');
      enrichedItems.forEach(item => {
        const sourceLabel = item.source === 'plugin' ? '[plugin]' : '[agent]';
        console.log(`  ${sourceLabel} ${item.displayName} (${item.name}) - "${item.tagline}"`);
      });

      // Generate image
      console.log('\nGenerating image...');
      await generateCrewImage(enrichedItems, outputPath);

      console.log(`\n✓ Image saved to ${outputPath}`);
    } catch (err) {
      console.error(`\nError: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all agents and plugins')
  .option('-a, --agents <dir>', 'Agents directory', '~/.claude/agents')
  .option('--no-plugins', 'Exclude plugins')
  .action(async (options) => {
    try {
      const items = await loadAll(options.agents, { includePlugins: options.plugins !== false });

      const agents = items.filter(i => i.source === 'agent');
      const plugins = items.filter(i => i.source === 'plugin');

      console.log(`Found ${agents.length} agent(s) and ${plugins.length} plugin(s)\n`);

      if (agents.length > 0) {
        console.log('Agents:');
        agents.forEach(agent => {
          console.log(`  ${agent.name}`);
          console.log(`    Scope: ${agent.scope}`);
          console.log(`    Description: ${(agent.description || '').slice(0, 60)}...`);
          console.log('');
        });
      }

      if (plugins.length > 0) {
        console.log('Plugins:');
        plugins.forEach(plugin => {
          console.log(`  ${plugin.name}`);
          console.log(`    Description: ${(plugin.description || '').slice(0, 60)}...`);
          console.log('');
        });
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// Default command
program.action(() => {
  program.help();
});

program.parse();
