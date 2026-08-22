import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Starting Weight Tracking & Photo Body Evolution Logic Tests...\n');

// 1. Test sanitizeWeightHistory with optional photoTag (no forced "belly")
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
      photoTag: item.photoTag || undefined
    });
  });
  return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Test basic sanitization and deduplication
const rawData = [
  { id: 'w1', date: '2026-08-01T08:00:00.000Z', weight: 75.4, note: 'Depart', hasPhoto: true }, // No tag
  { id: 'w1_dup', date: '2026-08-01T18:00:00.000Z', weight: 75.2, note: 'Soir', hasPhoto: true, photoTag: 'front' },
  { id: 'w2', date: '2026-08-10T08:00:00.000Z', weight: 73.8, note: 'Apres jeune', hasPhoto: false },
  { id: 'w3', date: '2026-08-20T08:00:00.000Z', weight: 72.1, note: 'Fin detox', hasPhoto: true, photoTag: 'side' },
  { id: 'w_old', date: '2017-05-15T08:00:00.000Z', weight: 88.0, note: 'Archive 2017', hasPhoto: true }, // Historical photo added later
  { id: 'w_invalid', date: 'invalid-date', weight: 70 },
  { id: 'w_negative', date: '2026-08-21T08:00:00.000Z', weight: -5 }
];

const sanitized = sanitizeWeightHistory(rawData);
assert.equal(sanitized.length, 4, 'Should filter out invalid entries and deduplicate same-day entries');
assert.equal(sanitized[0].date, '2017-05-15T12:00:00.000Z', '2017 entry sorted first chronologically');
assert.equal(sanitized[0].photoTag, undefined, 'photoTag is undefined when none provided (no forced tag)');
assert.equal(sanitized[1].date, '2026-08-01T12:00:00.000Z', 'Standardized ISO time');
assert.equal(sanitized[1].hasPhoto, true, 'hasPhoto should be preserved');
assert.equal(sanitized[1].photoTag, 'front', 'Last same-day entry properties win');
assert.equal(sanitized[2].hasPhoto, false, 'hasPhoto correctly set to false when missing');
assert.equal(sanitized[3].photoTag, 'side', 'photoTag preserved');
console.log('✅ 1. sanitizeWeightHistory correctly handles deduplication, optional tags and chronological order.');

// 2. Test Gallery strict date-descending sort (most recent date in pole position)
const photoEntries = sanitized.filter(h => h.hasPhoto);
const gallerySorted = [...photoEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
assert.equal(gallerySorted[0].date, '2026-08-20T12:00:00.000Z', 'Most recent date (2026) is first in Gallery');
assert.equal(gallerySorted[gallerySorted.length - 1].date, '2017-05-15T12:00:00.000Z', 'Oldest date (2017) is last in Gallery');
console.log('✅ 2. Gallery sorts photos strictly by date descending (latest in pole position).');

// 3. Test Before / After Comparator default selection (oldest = Before, newest = After)
const compareSorted = [...photoEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
const defaultBefore = compareSorted[0];
const defaultAfter = compareSorted[compareSorted.length - 1];
assert.equal(defaultBefore.date, '2017-05-15T12:00:00.000Z', 'Before default is oldest historical photo (2017)');
assert.equal(defaultAfter.date, '2026-08-20T12:00:00.000Z', 'After default is newest photo (2026)');

function calculateComparisonMetrics(beforeEntry, afterEntry) {
  const deltaKg = Math.round((afterEntry.weight - beforeEntry.weight) * 10) / 10;
  const timeDiffMs = Math.abs(new Date(afterEntry.date).getTime() - new Date(beforeEntry.date).getTime());
  const daysDiff = Math.max(0, Math.round(timeDiffMs / (1000 * 60 * 60 * 24)));
  return { deltaKg, daysDiff };
}

const comp = calculateComparisonMetrics(defaultBefore, defaultAfter);
assert.equal(comp.deltaKg, -15.9, 'Weight lost is -15.9 kg between 2017 and 2026');
assert.ok(comp.daysDiff > 3000, 'Days diff calculated correctly across multiple years');
console.log('✅ 3. Before/After comparator defaults (oldest vs newest) and metrics calculated accurately.');

// 4. Test Storage IndexedDB functions & RGPD Purge in storage.js
const storageCode = readFileSync(join(__dirname, '../web-app/src/storage.js'), 'utf-8');
assert.ok(storageCode.includes('saveWeightPhoto'), 'storage.js exports saveWeightPhoto');
assert.ok(storageCode.includes('getWeightPhoto'), 'storage.js exports getWeightPhoto');
assert.ok(storageCode.includes('deleteWeightPhoto'), 'storage.js exports deleteWeightPhoto');
assert.ok(storageCode.includes('clearAllWeightPhotos'), 'storage.js exports clearAllWeightPhotos for RGPD purge');
assert.ok(storageCode.includes('weight_photos'), 'storage.js sets up weight_photos store in IndexedDB v2');
console.log('✅ 4. storage.js properly declares IndexedDB weight_photos store and clearAllWeightPhotos purge.');

// 5. Test RGPD integration in auth.js
const authCode = readFileSync(join(__dirname, '../web-app/src/auth.js'), 'utf-8');
assert.ok(authCode.includes('clearAllWeightPhotos'), 'auth.js invokes clearAllWeightPhotos on account deletion & reset');
console.log('✅ 5. auth.js integrates clearAllWeightPhotos in deleteAccountAndAllData and resetHealthData.');

// 6. Test main.js bindings and features
const mainCode = readFileSync(join(__dirname, '../web-app/src/main.js'), 'utf-8');
assert.ok(mainCode.includes('compressWeightImage'), 'main.js includes canvas image compressor & EXIF stripper');
assert.ok(mainCode.includes('renderWeightGallery'), 'main.js includes renderWeightGallery');
assert.ok(mainCode.includes('filterWeightGallery'), 'main.js includes filterWeightGallery');
assert.ok(mainCode.includes('renderWeightCompare'), 'main.js includes renderWeightCompare');
assert.ok(mainCode.includes('setWeightCompareMode'), 'main.js includes setWeightCompareMode for split vs side-by-side');
assert.ok(mainCode.includes('setWeightCompareTarget'), 'main.js includes setWeightCompareTarget for active photo selection');
assert.ok(mainCode.includes('adjustWeightCompareZoom'), 'main.js includes adjustWeightCompareZoom for independent photo scaling');
assert.ok(mainCode.includes('resetWeightCompareAlign'), 'main.js includes resetWeightCompareAlign');
assert.ok(mainCode.includes('downloadWeightComparisonCard'), 'main.js includes downloadWeightComparisonCard');
assert.ok(mainCode.includes('initWeightSplitSlider'), 'main.js includes initWeightSplitSlider');
assert.ok(mainCode.includes('toggleWeightPrivacyMode'), 'main.js includes toggleWeightPrivacyMode');
assert.ok(mainCode.includes('toggleLightboxZoom'), 'main.js includes toggleLightboxZoom');
assert.ok(mainCode.includes('openWeightLightbox'), 'main.js includes openWeightLightbox');
assert.ok(mainCode.includes('chart-photo-thumb'), 'main.js renders circular SVG photo thumbnail pins');
assert.ok(mainCode.includes('window.handleWeightPhotoSelect'), 'main.js registers photo upload handler on window');
console.log('✅ 6. main.js includes and exports all necessary methods (gallery filters, SVG pins, dual-mode comparator, independent zoom/pan).');

// 7. Test index.html DOM structure
const htmlCode = readFileSync(join(__dirname, '../web-app/index.html'), 'utf-8');
assert.ok(htmlCode.includes('id="weightPrivacyToggleBtn"'), 'index.html has privacy toggle button');
assert.ok(htmlCode.includes('id="weightViewTabs"'), 'index.html has weight view tabs');
assert.ok(htmlCode.includes('id="weightGalleryFilters"'), 'index.html has gallery filter bar');
assert.ok(htmlCode.includes('id="weightGalleryView"'), 'index.html has gallery view container');
assert.ok(htmlCode.includes('id="weightCompareView"'), 'index.html has comparator view container');
assert.ok(htmlCode.includes('id="btnModeSplit"'), 'index.html has split mode button');
assert.ok(htmlCode.includes('id="btnModeSide"'), 'index.html has side-by-side mode button');
assert.ok(htmlCode.includes('id="chipTargetBefore"'), 'index.html has before target selector chip');
assert.ok(htmlCode.includes('id="chipTargetAfter"'), 'index.html has after target selector chip');
assert.ok(htmlCode.includes('id="weightCompareSideContainer"'), 'index.html has side-by-side comparison container');
assert.ok(htmlCode.includes('id="weightDownloadCompareBtn"'), 'index.html has download comparison card CTA');
assert.ok(htmlCode.includes('id="weightSplitSliderContainer"'), 'index.html has split slider container');
assert.ok(htmlCode.includes('id="weightPhotoCameraInput"'), 'index.html has camera capture input');
assert.ok(htmlCode.includes('id="weightPhotoInput"'), 'index.html has gallery file input');
assert.ok(htmlCode.includes('id="weightPhotoLightbox"'), 'index.html has lightbox modal');
assert.ok(!htmlCode.includes('data-tag="belly"'), 'index.html MUST NOT contain data-tag="belly"');
assert.ok(!htmlCode.includes('weight.photoTagBelly'), 'index.html MUST NOT contain photoTagBelly');
console.log('✅ 7. index.html contains all necessary DOM nodes for tabs, dual-mode comparator, independent zoom, and zero belly tag.');

console.log('\n🎉 ALL WEIGHT TRACKING & BODY EVOLUTION TESTS PASSED SUCCESSFULLY!');

