import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { trainIncrementalByteBpe } from "../scripts/lecture6-incremental-bpe.mjs";

function fullScanTrainer(documents,budget) {
  let seqs=documents.map(text=>[...Buffer.from(text)]);
  const merges=[];
  for(let step=0;step<budget;step++) {
    const counts=new Map();
    for(const seq of seqs)for(let i=0;i+1<seq.length;i++) {
      const key=[seq[i],seq[i+1]].join(",");counts.set(key,(counts.get(key)??0)+1);
    }
    if(!counts.size)break;
    const [best]=[...counts].map(([key,count])=>({pair:key.split(",").map(Number),count})).sort((a,b)=>b.count-a.count||a.pair[0]-b.pair[0]||a.pair[1]-b.pair[1]);
    const newId=256+step;merges.push({pair:best.pair,newId});
    seqs=seqs.map(seq=>{
      const out=[];
      for(let i=0;i<seq.length;i++) {
        if(seq[i]===best.pair[0]&&seq[i+1]===best.pair[1]){out.push(newId);i++;}else out.push(seq[i]);
      }
      return out;
    });
  }
  return {merges,sequences:seqs};
}

test("Incremental BPE reproduces the visual fixture and final byte pieces",()=>{
  const trace=trainIncrementalByteBpe(["banana","banana","band"],2,{validate:true});
  assert.deepEqual(trace,JSON.parse(readFileSync(new URL("../content/fixtures/lecture6-incremental-bpe-trace.json",import.meta.url),"utf8")));
  assert.deepEqual(trace.merges,[{pair:[97,110],newId:256},{pair:[98,256],newId:257}]);
  assert.deepEqual(trace.sequences,[[257,256,97],[257,256,97],[257,100]]);
  assert.deepEqual(trace.initial.positions[0].positions,["0:1","0:3","1:1","1:3","2:1"]);
});

test("One replacement deletes three indexed edges and creates two",()=>{
  const trace=trainIncrementalByteBpe(["banana","banana","band"],1,{validate:true});
  const update=trace.rounds[0].updates[0];
  assert.deepEqual(update.removed.map(row=>row.pair),[[98,97],[97,110],[110,97]]);
  assert.deepEqual(update.added.map(row=>row.pair),[[98,256],[256,97]]);
  assert.deepEqual(update.before.map(node=>node.index),[0,1,2,3]);
  assert.deepEqual(update.after.map(node=>node.index),[0,1,3]);
  assert.deepEqual(update.countsAfter,[{pair:[97,110],count:4},{pair:[110,97],count:3},{pair:[98,97],count:2},{pair:[98,256],count:1},{pair:[110,100],count:1},{pair:[256,97],count:1}]);
  assert.equal(trace.rounds[0].updates.length,5);
});

test("The progressive abab/abac walkthrough agrees with independently scanned counts and postings",()=>{
  const fixture=JSON.parse(readFileSync(new URL("../content/fixtures/lecture6-indexed-walkthrough-trace.json",import.meta.url),"utf8"));
  const {scan,...recorded}=fixture;
  const actual=trainIncrementalByteBpe(["abab","abac"],1,{validate:true});
  assert.deepEqual(recorded,actual);
  assert.deepEqual(actual.merges,[{pair:[97,98],newId:256}]);
  assert.deepEqual(actual.sequences,[[256,256],[256,97,99]]);
  assert.deepEqual(actual.initial.counts,[{pair:[97,98],count:3},{pair:[98,97],count:2},{pair:[97,99],count:1}]);
  const counts=new Map(),positions=new Map(),expected=[];
  actual.initial.sequences.forEach((seq,doc)=>{
    for(let node=0;node+1<seq.length;node++) {
      const pair=[seq[node],seq[node+1]],key=pair.join(",");
      counts.set(key,(counts.get(key)??0)+1);
      positions.set(key,[...(positions.get(key)??[]),`${doc}:${node}`]);
      expected.push({doc,node,pair,count:counts.get(key),positions:[...positions.get(key)],counts:[...counts].map(([key,count])=>({pair:key.split(",").map(Number),count}))});
    }
  });
  assert.deepEqual(scan,expected);
  assert.deepEqual(scan.slice(0,3).map(e=>[e.pair,e.count]),[[[97,98],1],[[98,97],1],[[97,98],2]]);
  assert.deepEqual(actual.rounds[0].updates.map(e=>[e.doc,e.left]),[[0,0],[0,2],[1,0]]);
  assert.deepEqual(actual.rounds[0].updates[1].before.map(e=>e.token),[256,97,98],"Second occurrence uses its already-merged current neighbor");
  assert.deepEqual(actual.rounds[0].positionsAfter,[{pair:[97,99],positions:["1:2"]},{pair:[256,97],positions:["1:0"]},{pair:[256,256],positions:["0:0"]}]);
});

test("The max-heap rejects stale candidates before selecting a live maximum",()=>{
  const trace=trainIncrementalByteBpe(["banana","banana","band"],2,{validate:true});
  assert.deepEqual(trace.rounds[1].stale.map(({pair,count})=>({pair,count})),[{pair:[110,97],count:4},{pair:[98,97],count:3}]);
  assert.deepEqual(trace.rounds[1].pair,[98,256]);
  assert.equal(trace.rounds[1].selectionCount,3);
});

test("Overlap, empty documents, Unicode bytes and boundaries match a full-scan trainer",()=>{
  for(const documents of [[],[""],["a"],["aaa"],["aaaaa","aaa"],["ab","ab"],["a","b"],["banana","banana","band"],["éé","ЯЯ","中中"],["ababa","babab","abab"]]) {
    for(const budget of [0,1,2,8]) {
      const incremental=trainIncrementalByteBpe(documents,budget,{validate:true});
      assert.deepEqual({merges:incremental.merges,sequences:incremental.sequences},fullScanTrainer(documents,budget));
    }
  }
  const overlap=trainIncrementalByteBpe(["aaa"],1,{validate:true}).rounds[0];
  assert.equal(overlap.selectionCount,2);assert.equal(overlap.replacements,1);
});

test("Incremental counts and occurrences agree with full recounts on deterministic random corpora",()=>{
  let state=1729;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
  for(let sample=0;sample<150;sample++) {
    const docs=Array.from({length:1+random()%4},()=>Array.from({length:random()%16},()=>"abnc"[random()%4]).join(""));
    const incremental=trainIncrementalByteBpe(docs,8,{validate:true});
    assert.deepEqual({merges:incremental.merges,sequences:incremental.sequences},fullScanTrainer(docs,8));
  }
});
