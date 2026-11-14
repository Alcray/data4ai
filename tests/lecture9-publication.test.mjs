import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const read = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
const moduleFrom = async path => import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const {default:deck}=await moduleFrom('app/future-decks/lecture-10.ts');
const {lecture10Html:html}=await moduleFrom('app/generated/lecture-10.ts');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
test('Every Lecture 9 slide links to a unique rendered chapter destination',()=>{
 for(const slide of [deck,...deck.slides]) {
  assert.ok(slide.textAnchor,slide.title);
  assert.equal(ids.filter(id=>id===slide.textAnchor).length,1,slide.title+': '+slide.textAnchor);
 }
});
test('Lecture 9 formula sources resolve to native math and have legends',()=>{
 for(const slide of deck.slides.filter(s=>s.kind==='formula')){
  assert.equal(ids.filter(id=>id===slide.formulaAnchor).length,1);
  const block=html.split(`id="${slide.formulaAnchor}"`)[1].split('</div>')[0];
  assert.match(block,/<math/);
  assert.ok(slide.rows.length>=4);
  assert.ok(slide.formulaExplanation);
  assert.equal(slide.items,undefined);
 }
});
test('Every Lecture 9 figure exists and is shared with the chapter',()=>{
 for(const slide of deck.slides.filter(s=>s.kind==='image')){
  assert.ok(existsSync(new URL('../public/'+slide.image.src,import.meta.url)),slide.image.src);
  assert.ok(html.includes(slide.image.src),slide.image.src);
  assert.ok(slide.image.alt);
 }
});
test('Provider serialization preserves chapter whitespace and special tokens',()=>{
 const qmd=read('content/lectures/lecture-10.qmd');
 for(const anchor of ['llama-template','qwen-template','gemma-template']){
  const expected=qmd.split(`[]{#${anchor}}`)[1].match(/```text\n([\s\S]*?)\n```/)[1];
  assert.equal(deck.slides.find(s=>s.textAnchor===anchor).code,expected);
 }
});

test('Published Lecture 9 names benchmarks and retains the reviewed 38-slide scope',()=>{
 assert.equal(deck.number,10);
 assert.equal(deck.slides.length+1,38);
 assert.doesNotMatch(read('content/lectures/lecture-10.qmd').split('\n')[1],/draft/i);
 for(const name of ['cpt-forgetting','sft-epochs']) {
  const svg=read('public/lecture-9-1/'+name+'.svg');
  for(const label of ['HumanEval','HellaSwag','WinoGrande','ARC-Challenge']) assert.ok(svg.includes(label),name+': '+label);
 }
 for(const slide of deck.slides.filter(s=>/LoRA retains|Higher-rank LoRA/.test(s.title))) {
  for(const label of ['HumanEval','HellaSwag','WinoGrande','ARC-Challenge']) assert.ok(slide.headers.join(' ').includes(label),label);
 }
});
