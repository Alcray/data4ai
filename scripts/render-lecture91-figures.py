"""Rebuild Lecture 9.1 figures from the numerical examples in its chapter."""
from pathlib import Path
from html import escape
from math import log
R=Path(__file__).resolve().parents[1]/'public/lecture-9-1'
R.mkdir(exist_ok=True)
INK='#111827'; A='#7253ED'; T='#F2EFFE'; BORDER='#D7DCE5'
def text(x,y,s,size=28,color=INK,anchor='start',bold=False):
 return f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" fill="{color}" text-anchor="{anchor}" font-weight="{700 if bold else 400}">{escape(str(s))}</text>'
def rect(x,y,w,h,fill='white',stroke=BORDER):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
def line(x,y,x2,y2,color=BORDER):return f'<path d="M{x} {y}L{x2} {y2}" fill="none" stroke="{color}" stroke-width="2"/>'
def save(name,desc,b):
 (R/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560" role="img"><title>{escape(desc)}</title>{b}</svg>\n')
def dual(name,xlabels,values1,values2,xname):
 b=''
 for offset,title,values in [(0,'HumanEval pass@1',values1),(700,'Mean accuracy: three benchmarks',values2)]:
  x=offset+95; y=350; w=520; h=225
  b+=text(offset+350,55,title,30,anchor='middle',bold=True)
  for pct in [0,20,40,60,80]:
   yy=y-h*pct/80;b+=line(x,yy,x+w,yy)+text(x-15,yy+8,str(pct)+'%',22,anchor='end')
  pts=[]
  for i,(label,v) in enumerate(zip(xlabels,values)):
   xx=x+w*(log(float(label))-log(float(xlabels[0])))/(log(float(xlabels[-1]))-log(float(xlabels[0]))); yy=y-h*v/80;pts.append(f'{xx},{yy}')
   b+=f'<circle cx="{xx}" cy="{yy}" r="6" fill="{A}"/>'+text(xx+14 if i==0 else xx,yy-17,f'{v:g}',24,A,'start' if i==0 else 'middle',True)+text(xx,y+38,label,24,anchor='middle')
  b+=f'<polyline points="{" ".join(pts)}" fill="none" stroke="{A}" stroke-width="3"/>'+text(offset+350,425,xname,25,anchor='middle')
 b+=text(350,490,'HumanEval: complete Python functions',24,anchor='middle')
 b+=text(350,525,'Pass@1: one solution passes all tests',24,anchor='middle')
 for y,label in [(475,'HellaSwag: plausible event continuations'),(510,'WinoGrande: pronoun resolution'),(545,'ARC-Challenge: science questions')]:
  b+=text(1050,y,label,23,anchor='middle')
 save(name,'HumanEval pass@1 and mean HellaSwag, WinoGrande, ARC-Challenge accuracy',b)
dual('cpt-forgetting',['0.25','1','4','8','20'],[15.2,17.2,21.8,25.8,26.3],[62.5,62.5,59.9,58.3,54.5],'Training tokens (billions; log scale)')
dual('sft-epochs',['1','2','4','8','16'],[30.2,46.4,47,49.7,41.6],[59.5,57.9,51.2,44.6,41.4],'Training epochs (log scale)')
# Proportional token budget; labels separated from the bar.
b=text(50,85,'10 million training tokens',36,bold=True)
b+=rect(50,190,910,115,A,A)+rect(960,190,390,115,T,A)
b+=text(505,255,'7M domain tokens',34,'white','middle',True)+text(1155,255,'3M replay',32,A,'middle',True)
b+=text(505,365,'70%',42,A,'middle',True)+text(1155,365,'30%',42,A,'middle',True)
save('replay-budget','A 10M-token budget split into 7M domain and 3M replay tokens',b)
# Matrix sizes as areas, thin factors visibly smaller; exact counts below.
b=text(290,55,'Full matrix',32,bold=True,anchor='middle')+text(1040,55,'LoRA factors',32,bold=True,anchor='middle')
b+=rect(130,105,320,320,T,A)
for d in range(40,320,40):b+=line(130+d,105,130+d,425)+line(130,105+d,450,105+d)
b+=text(290,280,'4,096 × 4,096',30,anchor='middle',bold=True)
b+=text(640,280,'→',52,A,anchor='middle')
b+=rect(790,105,30,320,T,A)+rect(925,245,340,30,T,A)+text(872,280,'×',38,A,anchor='middle')
b+=text(805,92,'B',28,A,'middle',True)+text(1100,220,'A',28,A,'middle',True)
b+=text(805,470,'4,096 × 16',27,anchor='middle')+text(1100,470,'16 × 4,096',27,anchor='middle')
b+=text(290,535,'16,777,216 parameters',30,anchor='middle',bold=True)+text(1040,535,'131,072 parameters · 0.78%',30,A,'middle',True)
save('lora-matrices','A 4096 by 4096 matrix versus rank-16 LoRA factors with 131072 trainable parameters',b)
# Mask shows actual serialized pieces; scoring mask, not an attention mask.
rows=[('System + user','Capital of France?','masked'),('Assistant header','<|im_start|>assistant','masked'),('Response','Paris','scored'),('Response','.','scored'),('Turn end','<|im_end|>','scored')]
b=text(35,42,'Role / piece',27,bold=True)+text(425,42,'Context read by the model',27,bold=True)+text(1175,42,'Loss',27,bold=True)
for i,(role,tok,status) in enumerate(rows):
 y=70+i*91;b+=rect(20,y,1360,77,T if status=='scored' else 'white')+text(40,y+49,role,28)+text(425,y+49,tok,28)+text(1175,y+49,status,28,A if status=='scored' else INK,bold=True)
save('response-mask','The Qwen conversation remains visible; only Paris, punctuation and the end-of-turn token are scored',b)

# Keep shared architecture figures, without secondary annotation strips.
import xml.etree.ElementTree as ET
ET.register_namespace('', 'http://www.w3.org/2000/svg')
for name in ['cpt-context', 'sft-demonstration', 'tool-result-mask']:
 root=ET.parse(R.parent/'lecture-10'/(name+'.svg')).getroot()
 for child in list(root):
  if not child.tag.endswith('text'):continue
  txt=''.join(child.itertext())
  if (name=='cpt-context' and float(child.attrib.get('y',0))>400) or (name=='tool-result-mask' and txt.startswith('Masked tool results')):
   root.remove(child)
  if name=='sft-demonstration' and txt.startswith('SFT updates'):
   for item in list(child):child.remove(item)
   child.text='Prediction error updates the weights'
 (R/(name+'.svg')).write_text(ET.tostring(root,encoding='unicode'))
