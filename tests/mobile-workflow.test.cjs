const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInNewContext(js, { exports, require: id => {
    if (id in dependencies) return dependencies[id];
    throw Error('Unexpected dependency: ' + id);
  }, console, Date, Error });
  return exports;
}
const model = load('src/drawing/model.ts');
const templates = load('src/drawing/templates.ts');
test('200 unique offline compositions including 50 Christmas scenes', () => {
  const catalog = templates.DRAWING_TEMPLATES;
  assert.equal(catalog.length, 200);
  assert.equal(new Set(catalog.map(t => t.id)).size, 200);
  assert.equal(new Set(catalog.map(t => JSON.stringify(templates.GUIDE_PATHS[t.id]))).size, 200);
  assert.equal(catalog.filter(t => t.category === 'Navidad').length, 50);
  catalog.forEach(t => assert.ok(templates.GUIDE_PATHS[t.id]?.length));
});
test('same proportional gesture on phone and tablet gives the same logical stroke', () => {
  const phone = model.canvasPoint(90, 130, 180, 260);
  const tablet = model.canvasPoint(270, 390, 540, 780);
  assert.equal(JSON.stringify(phone), JSON.stringify(tablet));
  assert.equal(phone.x, 180); assert.equal(phone.y, 260);
  assert.equal(model.canvasPoint(-10, 900, 180, 260).y, 520);
  assert.match(model.strokePath([phone]), /l0.01 0$/);
  assert.match(model.strokePath([{x:0,y:0},phone,{x:360,y:520}]), /Q/);
});
test('only drafts, assigned and returned letters allow editing', () => {
  for (const status of ['DRAFT','ASSIGNED','RETURNED']) assert.equal(model.canEditLetter(status), true);
  for (const status of ['PENDING_SYNC','SYNCED','COMPLETADO','APROBADA',undefined]) assert.equal(model.canEditLetter(status), false);
});
function drawingRepo(status) {
  const calls = [];
  const tx = {
    getFirstAsync: async sql => sql.includes('FROM local_letters') ? { status } : { file_path:'old.png' },
    runAsync: async (...args) => { calls.push(args); return { changes:1 }; },
  };
  const db = { ...tx, withExclusiveTransactionAsync: async fn => fn(tx) };
  const files = { documentDirectory:'file:///local/', makeDirectoryAsync:async()=>{}, copyAsync:async()=>{}, deleteAsync:async p=>calls.push(['delete-file',p]) };
  return { calls, repo: load('src/repos/drawings_repo.ts', { '../db': {getDb:async()=>db}, '../drawing/model':model, 'expo-file-system/legacy': files }) };
}
test('storage rejects a drawing save if the letter was queued while the editor was open', async () => {
  const { calls, repo } = drawingRepo('PENDING_SYNC');
  await assert.rejects(repo.saveDrawingPath('L1', 'temp.png','Descripción'), /preparada/);
  assert.equal(calls.filter(c => c[0].includes('INSERT') || c[0].includes('DELETE FROM')).length, 0);
  assert.ok(calls.some(c => c[0] === 'delete-file')); // remove failed temporary copy
});
test('saving preserves vector layers and a legacy base image for explicit re-editing', async () => {
  const { calls, repo } = drawingRepo('DRAFT');
  const state = {version:1,paths:[],template:null,baseImage:'old.png'};
  await repo.saveDrawingPath('L1','temp.png','Descripción',state);
  const insert = calls.find(c => c[0].startsWith('INSERT'));
  assert.equal(insert[1][5], JSON.stringify(state));
  assert.equal(calls.filter(c => c[0] === 'delete-file').length, 0);
});
test('one selected question saves with the complete message and no separate answer', async () => {
  let status = 'DRAFT'; const writes = [];
  const tx = { getFirstAsync: async()=>({status}), runAsync: async(...args)=>writes.push(args) };
  const repo = load('src/repos/questions_repo.ts', { '../db':{getDb:async()=>({withExclusiveTransactionAsync:async fn=>fn(tx)})}, '../drawing/model':model });
  const q = {id:2,question_text:'¿Qué te gusta?',is_required:1};
  await assert.rejects(repo.saveQuestionAndMessage('L1','Mensaje completo',null), /Selecciona/);
  await assert.rejects(repo.saveQuestionAndMessage('L1','Corto',q), /redacta/);
  assert.equal(writes.length,0);
  await repo.saveQuestionAndMessage('L1','  Mensaje completo  ',q);
  assert.equal(writes.length,3);
  assert.match(writes[0][0], /DELETE FROM letter_answers/);
  assert.match(writes[1][0], /answer_in_message/);
  assert.match(writes[1][0], /'', 1/);
  assert.deepEqual(Array.from(writes[1][1]), ['L1',2,'¿Qué te gusta?']);
  assert.equal(writes[2][1][0], 'Mensaje completo');
  assert.match(writes[2][0], /content_version=2/);
  status='PENDING_SYNC';
  await assert.rejects(repo.saveQuestionAndMessage('L1','Mensaje cambiado',q), /preparada/);
  assert.equal(writes.length,3);
});
test('selection and full message complete the task without answering all required catalog questions', () => {
  assert.equal(model.isMessageComplete({has_message:1,selected_questions_count:1,required_questions_count:40,answered_required_count:0}),true);
  assert.equal(model.isMessageComplete({has_message:0,selected_questions_count:1}),false);
  assert.equal(model.isMessageComplete({has_message:1,selected_questions_count:0,answered_questions_count:0}),false);
  assert.equal(model.isMessageComplete({has_message:1,answered_questions_count:2,answered_required_count:2,required_questions_count:2}),true);
  assert.equal(model.isMessageComplete({has_message:1,answered_questions_count:1,answered_required_count:1,required_questions_count:2}),false);
});
test('sync keeps selected prompt marker even with an empty separate answer', async () => {
  const row = {question_id:2,question_text:'¿Qué te gusta?',answer_text:'',answer_in_message:1};
  const repo=load('src/repos/questions_repo.ts',{'../db':{getDb:async()=>({getAllAsync:async sql=>{
    assert.match(sql,/answer_in_message/);return [row];
  }})},'../drawing/model':model});
  assert.equal(JSON.stringify(await repo.listAnswers('L1')),JSON.stringify([row]));
});
