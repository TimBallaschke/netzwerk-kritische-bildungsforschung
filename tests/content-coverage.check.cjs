const {test} = require('node:test');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const data = JSON.parse(execFileSync('php',['tests/content-coverage.php'],{encoding:'utf8'}));

test('QA content fills every editable field of all five entry blueprints and validates through Panel forms',()=>{
  assert.equal(data.qaCount,16);
  assert.deepEqual(data.missingFields,[]);
  assert.deepEqual(data.formErrors,[]);
  assert.deepEqual(data.fieldCounts,{beitrag:8,veranstaltung:15,'call-for-papers':13,publikation:12,notiz:13});
});
test('all five detail types render their own content, images and PDFs instead of the homepage feed',()=>{
  const counts={beitrag:1,veranstaltung:2,'call-for-papers':0,publikation:1,notiz:2};
  for(const [type,details] of Object.entries(data.details)) {
    assert.match(details.title,/TEST ·/);
    assert.equal(details.images,counts[type],type+' images');
    assert.ok(details.pdfs>0,type+' PDF');
    assert.ok(details.hasBody,type+' body');
    assert.ok(details.hasGenderStar,type+' literal gender star');
    assert.equal(details.hasFeed,false,type+' must not render homepage feed');
  }
});
test('home and seminar contact text honor Panel content',()=>{
  assert.ok(data.introFromPanel);
  assert.ok(data.seminarContactTitle);
});
test('feed and archive visibility respect draft, hidden, past and future states',()=>{
  for(const key of ['hiddenAbsent','draftAbsent','pastEventPresent','futureEventAbsent']) assert.ok(data[key],key);
  assert.equal(data.aboutSections,3);
  assert.equal(data.seminarRows,5);
});

test('PDF fields limit the Panel upload and file picker to PDF documents',()=>{
  assert.equal(Object.keys(data.pdfRestrictions).length,5);
  for(const [type,field] of Object.entries(data.pdfRestrictions)) {
    assert.equal(field.accept,'.pdf',type);
    assert.equal(field.query,'page.files.filterBy("extension", "pdf")',type);
  }
});
