import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../dashboard-data');
const CONFIG_DIR = path.join(DATA_DIR, 'config');
const WIDGETS_DIR = path.join(DATA_DIR, 'widgets');
const THEMES_DIR = path.join(DATA_DIR, 'themes');
const DASHBOARD_CONFIG_FILE = path.join(CONFIG_DIR, 'dashboard.yml');

// Default Dashboard Config Schema
const DEFAULT_CONFIG = {
    widgets: [], // Array of configured widgets
    layout: [],  // Grid layout configuration
    version: '1.0.0'
};

export function ensureStorage() {
    const dirs = [DATA_DIR, CONFIG_DIR, WIDGETS_DIR, THEMES_DIR];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    if (!fs.existsSync(DASHBOARD_CONFIG_FILE)) {
        console.log('Creating default dashboard.yml');
        saveConfig(DEFAULT_CONFIG);
    }
}

export function loadConfig() {
    try {
        if (!fs.existsSync(DASHBOARD_CONFIG_FILE)) {
            return DEFAULT_CONFIG;
        }
        const fileContents = fs.readFileSync(DASHBOARD_CONFIG_FILE, 'utf8');
        const config = yaml.load(fileContents);
        return config || DEFAULT_CONFIG;
    } catch (e) {
        console.error('Failed to load config:', e);
        return DEFAULT_CONFIG;
    }
}

export function saveConfig(config) {
    try {
        const yamlStr = yaml.dump(config);
        fs.writeFileSync(DASHBOARD_CONFIG_FILE, yamlStr, 'utf8');
        return true;
    } catch (e) {
        console.error('Failed to save config:', e);
        return false;
    }
}

export {
    DATA_DIR,
    CONFIG_DIR
};
