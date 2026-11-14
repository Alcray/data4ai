"""Reproduce the 8B memory arithmetic and figures shared by chapter and deck."""
from pathlib import Path
from html import escape
OUT = Path(__file__).resolve().parents[1] / 'public/lecture-9-1'
INK = '#111827'; ACCENT = '#7253ED'; TINT = '#F2EFFE'; BORDER = '#D7DCE5'
PARAMS = 8_000_000_000
ADAPTERS = 40_000_000
STATE_BYTES = 2 + 4 + 4 + 4 + 4
HIDDEN_BYTES = 1 * 4096 * 4096 * 2
CACHE_BYTES = 2 * 32 * 1 * 4096 * 8 * 128 * 2

def text(x, y, value, size=28, color=INK, anchor='start', bold=False):
    return f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" fill="{color}" text-anchor="{anchor}" font-weight="{700 if bold else 400}">{escape(str(value))}</text>'

def rect(x, y, w, h, fill='white', stroke=BORDER):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'

def line(x, y, x2, y2):
    return f'<path d="M{x} {y}L{x2} {y2}" fill="none" stroke="{BORDER}" stroke-width="2"/>'

def save(name, desc, body):
    (OUT / (name + '.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560" role="img"><title>{escape(desc)}</title>{body}</svg>\n')

# Bit cells use the same width, so the raw 4:1 storage ratio is visible.
b = text(40, 52, '8,000,000,000 parameters', 34, bold=True)
for y, label, bits, detail, total in [(125, 'BF16', 16, '16 bits = 2 bytes', '8 billion × 2 bytes = 16 GB'), (315, 'INT4', 4, '4 bits = 0.5 bytes', '8 billion × 0.5 bytes = 4 GB')]:
    b += text(40, y+40, label, 32, ACCENT, bold=True)
    for bit in range(bits):
        b += rect(210 + bit*28, y, 25, 52, TINT, ACCENT)
    b += text(210, y+96, detail, 28)
    b += text(735, y+40, total, 31, bold=True)
b += text(735, 450, '+ scales / zero points', 27) + text(735, 490, '+ higher-precision layers', 27)
b += text(40, 535, 'GB = 1 billion bytes', 25)
save('memory-weights', 'BF16 uses 16 GB of raw weights; packed INT4 uses 4 GB, with quantization overhead added.', b)

# Explicit allocation policy, five trainable-state arrays, then a scoped subtotal.
b = text(40, 42, '8B parameters · BF16 compute · AdamW', 32, bold=True)
for x, label in [(40, 'Stored tensor'), (640, 'Bytes / parameter'), (1040, '8B total')]:
    b += text(x, 106, label, 27, bold=True)
rows = [('Working weights · BF16',2), ('Accumulated gradients · FP32',4), ('Master weights · FP32',4), ('AdamW first moment · FP32',4), ('AdamW second moment · FP32',4)]
for i, (label, size) in enumerate(rows):
    y = 155+i*53
    b += line(40,y+16,1360,y+16) + text(40,y,label,27) + text(690,y,str(size),28,ACCENT,bold=True) + text(1040,y,f'{PARAMS*size/1e9:g} GB',28,bold=True)
b += rect(40,430,1320,64,TINT,ACCENT) + text(62,472,'Persistent state',29,bold=True) + text(645,472,'18 bytes / parameter',28) + text(1040,472,f'{PARAMS*STATE_BYTES/1e9:g} GB',32,ACCENT,bold=True)
b += text(40,540,'Additional memory: saved activations + temporary buffers + runtime',27)
save('memory-training','Full-parameter pretraining, CPT and SFT share a 144 GB state subtotal under the specified mixed-precision AdamW policy.',b)

# Count one concrete tensor, then show what saving one per layer would cost.
b = text(40,50,'One BF16 hidden-state tensor',32,bold=True)
for x, value, label in [(40,'1','sequence'),(350,'4,096','tokens'),(660,'4,096','hidden values'),(1000,'2 bytes','per value')]:
    b += text(x,145,value,42,ACCENT,bold=True) + text(x,190,label,27)
for x in [280,590,930]:b += text(x,145,'×',34)
b += rect(40,235,1320,70,TINT,ACCENT) + text(700,282,f'{HIDDEN_BYTES:,} bytes = 32 MiB',36,ACCENT,'middle',True)
b += text(40,363,'One saved tensor per layer',29,bold=True)
b += text(40,423,'32 layers × 32 MiB',31) + text(650,423,'1 GiB ≈ 1.074 GB',34,ACCENT,bold=True)
b += text(40,488,'Four sequences: these tensors use 4 GiB',29)
b += text(40,540,'Also stored: other attention / feed-forward intermediates',27)
save('memory-activations','A 4096 by 4096 BF16 hidden-state tensor is 32 MiB; saving one in each of 32 layers is 1 GiB for one sequence.',b)

# Numeric multiplication with a label for every factor, plus cache scaling.
b = text(40,46,'One sequence · 4,096 cached tokens · BF16',32,bold=True)
factors=[('2','K and V'),('32','layers'),('1','sequence'),('4,096','tokens'),('8','KV heads'),('128','head width'),('2','bytes / value')]
for i,(value,label) in enumerate(factors):
    x=100+i*200
    b += text(x,137,value,38,ACCENT,'middle',True)+text(x,183,label,24,anchor='middle')
    if i<6:b+=text(x+100,137,'×',30,anchor='middle')
b += rect(40,232,1320,76,TINT,ACCENT)+text(700,282,f'{CACHE_BYTES:,} bytes = 0.5 GiB ≈ 0.537 GB',34,ACCENT,'middle',True)
for x,h,a,c in [(40,'1 sequence','4,096 tokens','0.5 GiB'),(520,'4 sequences','4,096 tokens each','2 GiB'),(1000,'1 sequence','32,768 tokens','4 GiB')]:
    b += text(x,382,h,28,bold=True)+text(x,429,a,26)+text(x,493,c,36,ACCENT,bold=True)
save('memory-cache','Count both keys and values across layers, tokens, heads and precision: 0.5 GiB for the specified 4096-token sequence.',b)

# Both use the same BF16 KV cache. Unknown runtime costs are named, not invented.
b = text(40,46,'8B weights + one 4,096-token BF16 cache',32,bold=True)
headers=[(40,'Allocation'),(660,'BF16 weights'),(1060,'INT4 weights')]
for x,s in headers:b+=text(x,119,s,29,bold=True)
for y,label,left,right in [(188,'Weight payload','16 GB','4 GB'),(260,'KV cache','0.537 GB','0.537 GB'),(332,'Subtotal','16.537 GB','4.537 GB')]:
    b += line(40,y+24,1360,y+24)+text(40,y,label,29)+text(660,y,left,32,ACCENT,bold=True)+text(1060,y,right,32,ACCENT,bold=True)
b += text(40,416,'Add to both',27,bold=True)+text(390,416,'Transient activations + execution buffers',27)
b += text(40,477,'Add to INT4',27,bold=True)+text(390,477,'Quantization metadata + unquantized layers',27)
save('memory-inference','Inference weight and cache subtotals are 16.537 GB for BF16 and 4.537 GB for INT4; runtime and quantization costs are additional.',b)

# Keep the same 18-byte policy for adapters so the comparison is auditable.
b = text(40,47,'40M trainable adapter parameters',32,bold=True)
b += text(40,106,'40 million × 18 bytes = 0.72 GB of adapter state',32,ACCENT,bold=True)
for x,s in [(40,'Allocation'),(650,'BF16 LoRA'),(1040,'4-bit QLoRA')]:b+=text(x,194,s,29,bold=True)
for y,label,left,right in [(261,'Frozen 8B base','16 GB','4 GB'),(323,'Trainable adapter state','0.72 GB','0.72 GB'),(385,'State subtotal','16.72 GB','4.72 GB')]:
    b+=line(40,y+20,1360,y+20)+text(40,y,label,29)+text(650,y,left,32,ACCENT,bold=True)+text(1040,y,right,32,ACCENT,bold=True)
b += text(40,467,'Add to both',27,bold=True)+text(390,467,'Saved activations + runtime buffers',27)
b += text(40,530,'Add to QLoRA',27,bold=True)+text(390,530,'NF4 metadata + unquantized base layers',27)
save('memory-adapters','For 40M adapters and the stated AdamW policy, BF16 LoRA state costs 16.72 GB and four-bit QLoRA state costs 4.72 GB before other allocations.',b)
