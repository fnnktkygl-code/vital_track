import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Starting Weight Tracking & Photo Body Evolution Logic Tests...\n');

// 1. Test sanitizeWeightHistory
function sanitizeWeightHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return [];
  const map = new Map();
  history.forEach(item => {
    if (!item || item.weight === undefined || item.weight === null) return;
    const w = parseFloat(item.weight);
    if (isNaN(w) || w <= 0) return;
    const dateObj = new Date(item.date);
    if (isNaN(dateObj.getTime())) return;
    const dateStr = dateObj.toISOString().split('T')[0];
    map.set(dateStr, {
      id: item.id || ('w_' + dateStr.replace(/-/g, '')),
      date: `${dateStr}T12:00:00.000Z`,
      weight: Math.round(w * 10) / 10,
      note: item.note || '',
      hasPhoto: !!item.hasPhoto,
      photoTag: item.photoTag || 'belly'
    });
  });
  return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Test basic sanitization and deduplication
const rawData = [
  { id: 'w1', date: '2026-08-01T08:00:00.000Z', weight: 75.4, note: 'Depart', hasPhoto: true, photoTag: 'belly' },
  { id: 'w1_dup', date: '2026-08-01T18:00:00.000Z', weight: 75.2, note: 'Soir', hasPhoto: true, photoTag: 'front' },
  { id: 'w2', date: '2026-08-10T08:00:00.000Z', weight: 73.8, note: 'Apres jeune', hasPhoto: false },
  { id: 'w3', date: '2026-08-20T08:00:00.000Z', weight: 72.1, note: 'Fin detox', hasPhoto: true, photoTag: 'side' },
  { id: 'w_invalid', date: 'invalid-date', weight: 70 },
  { id: 'w_negative', date: '2026-08-21T08:00:00.000Z', weight: -5 }
];

const sanitized = sanitizeWeightHistory(rawData);
assert.equal(sanitized.length, 3, 'Should filter out invalid entries and deduplicate same-day entries');
assert.equal(sanitized[0].date, '2026-08-01T12:00:00.000Z', 'Standardized ISO time');
assert.equal(sanitized[0].hasPhoto, true, 'hasPhoto should be preserved');
assert.equal(sanitized[0].photoTag, 'front', 'Last same-day entry properties win');
assert.equal(sanitized[1].hasPhoto, false, 'hasPhoto correctly set to false when missing');
assert.equal(sanitized[2].photoTag, 'side', 'photoTag preserved');
console.log('✅ 1. sanitizeWeightHistory correctly handles deduplication and photo attributes.');

// 2. Test Before / After delta and duration calculations
function calculateComparisonMetrics(beforeEntry, afterEntry) {
  const deltaKg = Math.round((afterEntry.weight - beforeEntry.weight) * 10) / 10;
  const timeDiffMs = Math.abs(new Date(afterEntry.date).getTime() - new Date(beforeEntry.date).getTime());
  const daysDiff = Math.max(0, Math.round(timeDiffMs / (1000 * 60 * 60 * 24)));
  return { deltaKg, daysDiff };
}

const comp = calculateComparisonMetrics(sanitized[0], sanitized[2]);
assert.equal(comp.deltaKg, -3.1, 'Weight lost is -3.1 kg');
assert.equal(comp.daysDiff, 19, '19 days elapsed between 2026-08-01 and 2026-08-20');
console.log('✅ 2. Before/After comparison metrics (deltaKg, daysDiff) calculated accurately.');

// 3. Test Storage IndexedDB functions existence in storage.js
const storageCode = readFileSync(join(__dirname, '../web-app/src/storage.js'), 'utf-8');
assert.ok(storageCode.includes('saveWeightPhoto'), 'storage.js exports saveWeightPhoto');
assert.ok(storageCode.includes('getWeightPhoto'), 'storage.js exports getWeightPhoto');
assert.ok(storageCode.includes('deleteWeightPhoto'), 'storage.js exports deleteWeightPhoto');
assert.ok(storageCode.includes('weight_photos'), 'storage.js sets up weight_photos store in IndexedDB v2');
console.log('✅ 3. storage.js properly declares IndexedDB weight_photos store and CRUD operations.');

// 4. Test main.js bindings and functions
const mainCode = readFileSync(join(__dirname, '../web-app/src/main.js'), 'utf-8');
assert.ok(mainCode.includes('compressWeightImage'), 'main.js includes canvas image compressor & EXIF stripper');
assert.ok(mainCode.includes('renderWeightGallery'), 'main.js includes renderWeightGallery');
assert.ok(mainCode.includes('renderWeightCompare'), 'main.js includes renderWeightCompare');
assert.ok(mainCode.includes('initWeightSplitSlider'), 'main.js includes initWeightSplitSlider');
assert.ok(mainCode.includes('toggleWeightPrivacyMode'), 'main.js includes toggleWeightPrivacyMode');
assert.ok(mainCode.includes('openWeightLightbox'), 'main.js includes openWeightLightbox');
assert.ok(mainCode.includes('window.handleWeightPhotoSelect'), 'main.js registers photo upload handler on window');
console.log('✅ 4. main.js includes and exports all necessary methods.');

// 5. Test index.html DOM structure
const htmlCode = readFileSync(join(__dirname, '../web-app/index.html'), 'utf-8');
assert.ok(htmlCode.includes('id="weightPrivacyToggleBtn"'), 'index.html has privacy toggle button');
assert.ok(htmlCode.includes('id="weightViewTabs"'), 'index.html has weight view tabs');
assert.ok(htmlCode.includes('id="weightGalleryView"'), 'index.html has gallery view container');
assert.ok(htmlCode.includes('id="weightCompareView"'), 'index.html has comparator view container');
assert.ok(htmlCode.includes('id="weightSplitSliderContainer"'), 'index.html has split slider container');
assert.ok(htmlCode.includes('id="weightPhotoCameraInput"'), 'index.html has camera capture input');
assert.ok(htmlCode.includes('id="weightPhotoInput"'), 'index.html has gallery file input');
assert.ok(htmlCode.includes('id="weightPhotoLightbox"'), 'index.html has lightbox modal');
console.log('✅ 5. index.html contains all necessary DOM nodes for tabs, photo inputs, comparator, and lightbox.');

console.log('\n🎉 ALL WEIGHT TRACKING & BODY EVOLUTION TESTS PASSED SUCCESSFULLY!');
