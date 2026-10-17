/** Tested teaching trainer: occurrence index + frequency map + max-heap + linked nodes.
 * Not an implementation claim about any publisher's tokenizer-fitting pipeline.
 */
const keyOf = pair => pair.join(",");
const pairOf = key => key.split(",").map(Number);
const rank = (a, b) => a.count - b.count || b.pair[0] - a.pair[0] || b.pair[1] - a.pair[1] || a.version - b.version;

class MaxHeap {
  entries = [];
  push(value) {
    const a = this.entries;
    a.push(value);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (rank(a[p], a[i]) >= 0) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.entries;
    if (!a.length) return undefined;
    const first = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        let child = i * 2 + 1;
        if (child >= a.length) break;
        if (child + 1 < a.length && rank(a[child + 1], a[child]) > 0) child++;
        if (rank(a[i], a[child]) >= 0) break;
        [a[i], a[child]] = [a[child], a[i]];
        i = child;
      }
    }
    return first;
  }
}

export function trainIncrementalByteBpe(documents, budget, { validate = false } = {}) {
  const nodes = documents.map(text => [...Buffer.from(text)].map((token, index, seq) => ({ token, prev:index - 1, next:index + 1 < seq.length ? index + 1 : -1, alive:true })));
  const counts = new Map(), positions = new Map(), versions = new Map(), heap = new MaxHeap();
  const pieces = new Map(Array.from({length:256}, (_, i) => [i, Buffer.from([i])]));
  let dirty = new Set();
  const at = (doc, index) => nodes[doc][index];
  function edge(doc, left, delta, initializing = false) {
    const a = at(doc,left), right = a.next;
    if (!a.alive || right === -1) return undefined;
    const b = at(doc,right);
    if (!b.alive || b.prev !== left) throw Error("Broken linked edge");
    const pair = [a.token,b.token], key = keyOf(pair), position = `${doc}:${left}`;
    const index = positions.get(key) ?? new Set();
    if (delta === 1) {
      if (index.has(position)) throw Error("Duplicate indexed edge");
      index.add(position);
    } else if (!index.delete(position)) throw Error("Removing an unindexed edge");
    positions.set(key,index);
    counts.set(key,(counts.get(key) ?? 0) + delta);
    if (counts.get(key) < 0) throw Error("Negative pair count");
    versions.set(key,initializing ? 0 : (versions.get(key) ?? 0) + 1);
    if (!initializing) dirty.add(key);
    return {pair,position};
  }
  // The only algorithmic full scan initializes the three views of the corpus.
  for (let d=0;d<nodes.length;d++) for (let i=0;i<nodes[d].length;i++) edge(d,i,1,true);
  for (const [key,count] of counts) heap.push({pair:pairOf(key),count,version:versions.get(key)});
  const sequences = () => nodes.map(doc => {
    const result=[];
    for(let i=doc.length ? 0 : -1;i!==-1;i=doc[i].next) result.push(doc[i].token);
    return result;
  });
  const countView = () => [...counts].filter(([,n])=>n>0).map(([key,count])=>({pair:pairOf(key),count})).sort((a,b)=>b.count-a.count || a.pair[0]-b.pair[0] || a.pair[1]-b.pair[1]);
  const positionView = () => countView().map(({pair})=>({pair,positions:[...positions.get(keyOf(pair))].sort((a,b)=>{
    const [ad,ai]=a.split(":").map(Number),[bd,bi]=b.split(":").map(Number);return ad-bd||ai-bi;
  })}));
  function assertConsistent() {
    if (!validate) return;
    const scanned = new Map();
    for(let d=0;d<nodes.length;d++) {
      let prev=-1, bytes=[];
      for(let i=nodes[d].length ? 0 : -1;i!==-1;i=at(d,i).next) {
        const a=at(d,i);
        if(!a.alive || a.prev!==prev) throw Error("Invalid linked list");
        bytes.push(pieces.get(a.token));
        if(a.next!==-1) {
          const key=keyOf([a.token,at(d,a.next).token]);
          const index=scanned.get(key) ?? new Set();index.add(`${d}:${i}`);scanned.set(key,index);
        }
        prev=i;
      }
      if(!Buffer.concat(bytes).equals(Buffer.from(documents[d]))) throw Error("Corpus bytes changed");
    }
    for(const key of new Set([...counts.keys(),...scanned.keys()])) {
      const actual=scanned.get(key) ?? new Set(), indexed=positions.get(key) ?? new Set();
      if(actual.size!==(counts.get(key) ?? 0) || actual.size!==indexed.size || [...actual].some(p=>!indexed.has(p))) throw Error("Incremental state differs from full-scan oracle");
    }
  }
  assertConsistent();
  const initial={sequences:sequences(),counts:countView(),positions:positionView()};
  const rounds=[];
  for(let step=0;step<budget;step++) {
    const stale=[];
    let best;
    for(let candidate;(candidate=heap.pop());) {
      const key=keyOf(candidate.pair);
      if(candidate.count!==(counts.get(key) ?? 0) || candidate.version!==versions.get(key) || candidate.count<=0) stale.push(candidate);
      else {best=candidate;break;}
    }
    if(!best) break;
    const before=sequences(), countsBefore=countView(), positionsBefore=positionView();
    const pair=best.pair,key=keyOf(pair),newId=256+step;
    pieces.set(newId,Buffer.concat(pair.map(id=>pieces.get(id))));
    const occurrences=[...positions.get(key)].map(p=>p.split(":").map(Number)).sort((a,b)=>a[0]-b[0] || a[1]-b[1]);
    const updates=[];dirty=new Set();
    for(const [doc,left] of occurrences) {
      const a=at(doc,left),right=a.next;
      if(!a.alive || right===-1 || !at(doc,right).alive || a.token!==pair[0] || at(doc,right).token!==pair[1]) continue;
      const b=at(doc,right),prev=a.prev,next=b.next;
      const neighborhoodBefore=[prev,left,right,next].filter(i=>i!==-1).map(index=>({index,token:at(doc,index).token}));
      const removed=[],added=[];
      if(prev!==-1) removed.push(edge(doc,prev,-1));
      removed.push(edge(doc,left,-1));
      if(next!==-1) removed.push(edge(doc,right,-1));
      a.token=newId;a.next=next;
      if(next!==-1) at(doc,next).prev=left;
      b.alive=false;b.prev=-1;b.next=-1;
      if(prev!==-1) added.push(edge(doc,prev,1));
      if(next!==-1) added.push(edge(doc,left,1));
      assertConsistent();
      updates.push({doc,left,right,prev,next,before:neighborhoodBefore,after:[prev,left,next].filter(i=>i!==-1).map(index=>({index,token:at(doc,index).token})),removed,added,countsAfter:countView()});
    }
    for(const changed of dirty) if(counts.get(changed)>0) heap.push({pair:pairOf(changed),count:counts.get(changed),version:versions.get(changed)});
    rounds.push({pair,newId,selectionCount:best.count,replacements:updates.length,stale,before,after:sequences(),countsBefore,countsAfter:countView(),positionsBefore,positionsAfter:positionView(),updates});
  }
  return {documents,initial,rounds,sequences:sequences(),merges:rounds.map(({pair,newId})=>({pair,newId}))};
}
