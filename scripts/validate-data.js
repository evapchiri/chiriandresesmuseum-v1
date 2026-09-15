/**
 * Chiriandreses Museum — data validation.
 * Checks data/objects.json against a JSON Schema (required fields present)
 * and confirms every locationId/periodId/campaignId actually resolves in
 * its lookup file. Run with: node scripts/validate-data.js
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

const OBJECT_SCHEMA = {
  type: 'object',
  required: [
    'id', 'sketchfabUid', 'slug', 'title', 'type', 'use', 'materials',
    'measurements', 'weight', 'condition', 'integrity', 'chronology',
    'locationId', 'periodId', 'campaignId', 'story', 'captureDate',
    'complexity', 'software', 'provenance', 'fullRecord',
  ],
  properties: {
    id: { type: 'string', pattern: '^CHAN-\\d{3}$' },
    sketchfabUid: { type: 'string', minLength: 1 },
    slug: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    story: { type: 'array', items: { type: 'string' }, minItems: 1 },
    complexity: { type: ['object', 'null'] },
    provenance: {
      type: 'array',
      items: {
        type: 'object',
        required: ['property', 'status', 'note'],
        properties: {
          status: { enum: ['measured', 'estimated', 'n/a', 'flagged'] },
        },
      },
    },
    fullRecord: { type: 'object' },
  },
};

/* Runs validation. Returns an array of human-readable error strings
 * (empty when everything is clean). */
function validate() {
  const errors = [];

  const objects = readJSON(path.join(DATA, 'objects.json'));
  const locations = readJSON(path.join(DATA, 'locations.json'));
  const periods = readJSON(path.join(DATA, 'periods.json'));
  const campaigns = readJSON(path.join(DATA, 'campaigns.json'));

  const locationIds = new Set(locations.map((l) => l.id));
  const periodIds = new Set(periods.map((p) => p.id));
  const campaignIds = new Set(campaigns.map((c) => c.id));

  const ajv = new Ajv({ allErrors: true });
  const validateObject = ajv.compile(OBJECT_SCHEMA);

  const seenIds = new Set();
  const seenSlugs = new Set();

  for (const obj of objects) {
    const label = obj.id || obj.slug || '(unknown object)';

    if (!validateObject(obj)) {
      for (const err of validateObject.errors) {
        errors.push(`${label}: ${err.instancePath || '(root)'} ${err.message}`);
      }
    }

    if (obj.id) {
      if (seenIds.has(obj.id)) errors.push(`Duplicate id: ${obj.id}`);
      seenIds.add(obj.id);
    }
    if (obj.slug) {
      if (seenSlugs.has(obj.slug)) errors.push(`Duplicate slug: ${obj.slug}`);
      seenSlugs.add(obj.slug);
    }

    if (obj.locationId && !locationIds.has(obj.locationId)) {
      errors.push(`${label}: locationId "${obj.locationId}" not found in locations.json`);
    }
    if (obj.periodId && !periodIds.has(obj.periodId)) {
      errors.push(`${label}: periodId "${obj.periodId}" not found in periods.json`);
    }
    if (obj.campaignId && !campaignIds.has(obj.campaignId)) {
      errors.push(`${label}: campaignId "${obj.campaignId}" not found in campaigns.json`);
    }
  }

  return errors;
}

if (require.main === module) {
  const errors = validate();
  if (errors.length) {
    console.error(`Data validation failed with ${errors.length} error(s):\n`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`Data validation passed (${readJSON(path.join(DATA, 'objects.json')).length} objects, 0 errors).`);
}

module.exports = { validate };
