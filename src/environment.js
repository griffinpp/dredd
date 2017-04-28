import path from 'path';
import fs from 'fs';

// if DB_HOST hasn't been set, we're probably running locally and need to load environment variables from the .env file
if (!process.env.DB_HOST) {
  loadEnvironment();
}

function loadEnvironment() {
  try {
    const filePath = path.join(__dirname, '.env');
    const file = fs.readFileSync(filePath).toString();
    const settings = JSON.parse(file);

    for (const key in settings) {
      if ({}.hasOwnProperty.call(settings, key)) {
        process.env[key] = settings[key];
      }
    }
  } catch (err) {
    /* eslint no-console: */
    console.error(`Error loading environment: ${err}`);
  }
}
