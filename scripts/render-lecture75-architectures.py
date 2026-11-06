"""Draw the lecture's functional architecture figures as editable SVGs."""
from html import escape
from hashlib import sha256
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INK = '#233446'
GRAY = ('#69747d', '#f6f7f8', '#aab2b8')
BLUE = ('#237ca7', '#f0f7fc', '#8abbd5')
GREEN = ('#4d7c49', '#f3f8f1', '#a4bea0')
ORANGE = ('#a65b28', '#fff6ee', '#d9ad8d')
PURPLE = ('#765296', '#f7f1fb', '#bca3d0')
RED = ('#a44258', '#fcf1f4', '#cf9eab')


def txt(x, y, lines, size=25, color=INK, bold=False, mono=False):
    if isinstance(lines, str):
        lines = [lines]
    font = 'Consolas, monospace' if mono else 'Arial, sans-serif'
    return f'<text x="{x}" y="{y}" fill="{color}" font-family="{font}" font-size="{size}" font-weight="{700 if bold else 400}">' + ''.join(
        f'<tspan x="{x}" dy="{0 if i == 0 else size * 1.35}">{escape(line)}</tspan>' for i, line in enumerate(lines)) + '</text>'


def rect(x, y, w, h, fill='white', stroke='#aab2b8', radius=10):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'


def panel(x, y, w, h, number, title, color):
    return (rect(x, y, w, h, color[1], color[2])
            + f'<circle cx="{x+16}" cy="{y-28}" r="16" fill="{color[0]}"/>'
            + txt(x+10, y-21, str(number), 21, 'white', True)
            + txt(x+41, y-19, title, 28, color[0], True))


def path(d, dashed=False, color='#78828a', arrow=True):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.5" stroke-linejoin="round"' + (' stroke-dasharray="7 6"' if dashed else '') + (' marker-end="url(#arrow)"' if arrow else '') + '/>'


def line(x1, y1, x2, y2):
    return path(f'M{x1} {y1}H{x2}' if y1 == y2 else f'M{x1} {y1}L{x2} {y2}')


def junction(x, y):
    return f'<circle cx="{x}" cy="{y}" r="3.5" fill="#78828a"/>'


def speech(x, y, scale=1):
    return f'<g transform="translate({x} {y}) scale({scale})" stroke="{INK}" stroke-width="2.5" fill="white" stroke-linejoin="round"><path d="M0 0H50V34H22L9 46V34H0Z"/><path d="M9 10H40M9 19H34"/></g>'


def arm(x, y, scale=1):
    return f'<g transform="translate({x} {y}) scale({scale})" stroke="{INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 104H108V112H3Z" fill="#e4e9ed"/><path d="M23 104V80L58 49L80 19L104 39" fill="none"/><path d="M39 98V85L69 60L87 34" fill="none"/><circle cx="31" cy="81" r="12" fill="#dce7ec"/><circle cx="62" cy="48" r="10" fill="#dce7ec"/><circle cx="82" cy="22" r="9" fill="#dce7ec"/><path d="M104 39L119 42L127 29M104 39L107 56L122 62" fill="none"/></g>'


def scene(x, y, w=170, h=105, box=False):
    # A schematic camera frame, including a tabletop, cup, and tray.
    s=rect(x,y,w,h,'#edf5fb','#95aec0',5)
    s+=f'<path d="M{x+1} {y+h*.68}H{x+w-1}V{y+h-1}H{x+1}Z" fill="#e5dfd4"/>'
    s+=f'<path d="M{x+w*.25} {y+h*.34}H{x+w*.43}L{x+w*.40} {y+h*.69}H{x+w*.28}Z" fill="#7eb5ce" stroke="#375a6c" stroke-width="2"/>'
    s+=f'<path d="M{x+w*.43} {y+h*.40}C{x+w*.56} {y+h*.37},{x+w*.53} {y+h*.60},{x+w*.42} {y+h*.56}" fill="none" stroke="#375a6c" stroke-width="2"/>'
    s+=f'<path d="M{x+w*.65} {y+h*.58}L{x+w*.90} {y+h*.58}L{x+w*.84} {y+h*.76}H{x+w*.59}Z" fill="#d5dce1" stroke="#8998a2" stroke-width="2"/>'
    if box:s+=f'<rect x="{x+w*.21}" y="{y+h*.28}" width="{w*.31}" height="{h*.46}" fill="none" stroke="#765296" stroke-width="2.5" stroke-dasharray="5 3"/>'
    return s


def tokens(x,y,n=6,color=BLUE,vertical=False):
    return ''.join(rect(x if vertical else x+i*23, y+i*29 if vertical else y,17,22,color[1],color[2],3) for i in range(n))


def network(x,y,color=GREEN):
    s=''
    for a in range(3):
        for b in range(3):
            s+=f'<path d="M{x+8} {y+a*23}L{x+54} {y+b*23}" stroke="{color[2]}" stroke-width="1.4"/>'
    for xx in [x,x+54]:
        for i in range(3):s+=f'<circle cx="{xx+4}" cy="{y+i*23}" r="5" fill="white" stroke="{color[0]}" stroke-width="2"/>'
    return s


def input_panel(rows):
    s=panel(16,110,235,440,1,'Inputs',GRAY)
    for i,(kind,label,detail) in enumerate(rows):
        y=140+i*(390/len(rows))
        if kind=='language':s+=speech(34,y+8,.8)
        elif kind=='image':s+=scene(31,y+4,65,49)
        elif kind=='state':s+=arm(34,y-2,.48)
        else:s+=network(38,y+8,BLUE)
        s+=txt(108,y+26,label,24,bold=True)
        s+=txt(34,y+88,detail,22,GRAY[0])
        if i<len(rows)-1:s+=f'<path d="M30 {y+(156 if len(rows)==2 else 112)}H237" stroke="#d4dadd" stroke-width="1.5"/>'
    return s


def encoders(visual_name='Visual encoder',language_name='Language input',dual=False,image_y=400):
    s=panel(310,110,265,160,2,language_name,BLUE)
    s+=speech(333,135,.75)+txt(390,162,'Tokenizer',25,BLUE[0])+txt(332,215,'Token embeddings',23,BLUE[0])+tokens(332,230,8,BLUE)
    s+=panel(310,350,265,200,3,visual_name,GREEN)
    s+=scene(330,372,78,58)+network(462,378,GREEN)+line(408,401,461,401)
    s+=txt(331,476,['DINOv2 + SigLIP' if dual else 'Image features','Feature projection'],23,GREEN[0])+tokens(331,514,8,GREEN)
    s+=line(251,190,310,190)+path(f'M251 {image_y}H280V401H310')
    return s


def transformer(title='Transformer',output='Next-token prediction'):
    s=panel(635,110,380,440,4,title,ORANGE)
    s+=txt(657,155,'Visual + text embeddings',23,ORANGE[0])
    s+=tokens(658,188,10,ORANGE)
    s+=rect(666,248,318,183,'#fffcf8',ORANGE[2])
    s+=txt(684,279,'Transformer block',24,ORANGE[0],True)
    s+=rect(685,304,128,92,'white',ORANGE[2],5)+txt(699,339,['Self-','attention'],22,ORANGE[0])
    s+=rect(846,304,119,92,'white',ORANGE[2],5)+txt(860,339,['Feed-','forward'],22,ORANGE[0])
    s+=line(813,350,846,350)+txt(880,420,'repeated',19,ORANGE[0])
    s+=rect(650,470,350,64,'white',ORANGE[2],6)
    s+=line(824,210,824,248)+line(824,431,824,470)+txt(667,510,output,24,ORANGE[0],True)
    s+=path('M575 241H593V199H604',arrow=False)+path('M575 525H604V199',arrow=False)
    s+=junction(604,199)+line(604,199,635,199)
    return s


def robot(x=1410,y=330,feedback='New images and measured robot state',output_x=1335,output_y=512):
    s=panel(x,y,173,220,6,'Robot',GRAY)
    s+=arm(x+23,y+15,.9)+txt(x+16,y+145,['Controller','Motor actuation'],19,INK)
    s+=path(f'M{output_x} {output_y}H1380V475H{x}')
    s+=path(f'M{x+86} 550V602H134V550',True)
    s+=rect(550,582,515,37,'white','white',0)+txt(568,608,feedback,23,GRAY[0])
    return s


def document(body,desc):
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="660" viewBox="0 0 1600 660" role="img"><title>'+escape(desc)+'</title><defs><marker id="arrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" viewBox="0 0 10 10" refX="9" refY="5" orient="auto"><path d="M0 0L9 5L0 10Z" fill="#78828a"/></marker></defs><rect width="1600" height="660" fill="white"/>'+body+'</svg>\n'


def build():
    figures={}
    # Functional VLM: intentionally generic, not a claim about a vendor's internals.
    s=input_panel([('language','Question',['“Where is','the cup?”']),('image','Image',['Camera frame'])])
    s+=encoders()+transformer()
    s+=panel(1070,110,505,440,5,'Text or spatial output',PURPLE)
    s+=speech(1094,143)+txt(1171,171,['“The cup is','on the left.”'],29,PURPLE[0])
    s+=f'<path d="M1088 254H1557" stroke="{PURPLE[2]}" stroke-width="1.5"/>'
    s+=scene(1100,281,224,150,True)+txt(1350,330,['Image point','or box'],25,PURPLE[0])
    s+=txt(1098,482,['Perception output','requires an action policy to move.'],25,PURPLE[0])
    s+=path('M1000 502H1043V320H1070')
    figures['vlm-interface.svg']=document(s,'Functional VLM architecture: language and image encodings condition a Transformer that generates text or spatial data.')

    # Tool use: abstract functional modules, rather than undocumented internals.
    s=input_panel([('language','Goal',['“Pick up cup”']),('image','Scene',['Camera frame']),('api','Tools',['Available skill API'])])
    s+=encoders(language_name='Goal encoding',image_y=310)+transformer('Multimodal agent','Structured tool call')
    s+=panel(1070,110,280,440,5,'Skill execution',GREEN)
    s+=txt(1090,151,'Model output',22,PURPLE[0],True)+rect(1090,170,240,65,PURPLE[1],PURPLE[2],5)+txt(1104,211,'pick("cup")',25,PURPLE[0],mono=True)
    s+=line(1210,235,1210,290)+rect(1090,290,240,97,'white',GREEN[2],5)+txt(1106,326,['Existing skill','Planner / policy'],24,GREEN[0])
    s+=rect(1090,438,240,40,'white',GREEN[2],5)
    s+=line(1210,387,1210,438)+tokens(1095,448,9,GREEN)+txt(1090,513,'Joint-target sequence',22,GREEN[0])
    s+=path('M1000 502H1043V202H1090')+robot(feedback='New observations and skill status',output_x=1330,output_y=458)
    # Tool API conditions the agent independently of image and goal encoders.
    s+=path('M251 509H280V570H618V226H635')+txt(316,588,'Tool descriptions',22,GRAY[0])
    figures['tool-agent-interface.svg']=document(s,'Functional tool-using agent: image and goal encodings plus a skill API condition a tool call. A separate skill supplies robot commands.')

    # Original ACT at inference.
    s=input_panel([('image','Images',['Multiple views']),('state','State',['Joint positions','and gripper state'])])
    s+=panel(310,110,265,230,2,'Visual encoder',GREEN)
    s+=scene(329,130,94,65)+network(472,143)+line(423,166,471,166)
    s+=txt(331,235,['ResNet features','Spatial projection'],25,GREEN[0])+tokens(331,294,8,GREEN)
    s+=panel(310,420,265,130,3,'State and latent',BLUE)
    s+=txt(330,461,['State projection','Latent: prior mean'],23,BLUE[0])+tokens(331,510,8,BLUE)
    s+=line(251,190,310,190)+path('M251 435H280V480H310')
    s+=panel(635,110,380,440,4,'ACT Transformer',ORANGE)
    s+=rect(663,145,324,115,'white',ORANGE[2],6)+txt(688,180,['Encoder','Image + state + latent'],25,ORANGE[0])
    s+=line(824,260,824,331)+rect(663,331,324,105,'white',ORANGE[2],6)+txt(688,366,['Decoder','Learned step queries'],25,ORANGE[0])
    s+=rect(650,470,350,64,'white',ORANGE[2],6)
    s+=line(824,436,824,470)+txt(665,504,'Linear action head',25,ORANGE[0],True)
    s+=path('M575 305H595V185H663')+path('M575 521H612V225H663')
    s+=panel(1070,110,280,440,5,'Action chunk',RED)
    s+=txt(1091,151,'Joint-target chunk',22,RED[0],True)
    s+=rect(1090,174,240,112,'white',RED[2],5)+txt(1104,210,['0.20  −0.40  …','0.30  −0.30  …'],24,RED[0],mono=True)
    s+=line(1210,286,1210,340)+rect(1090,340,240,132,'#fafafa',GRAY[2],5)+txt(1105,374,['Restore units','Select / ensemble','overlapping steps'],22,GRAY[0])
    s+=rect(1085,490,250,44,'white',RED[2],5)+line(1210,472,1210,490)
    s+=txt(1091,517,'Joint + gripper targets',22,RED[0])+path('M1000 502H1042V230H1090')+robot()
    figures['act-interface.svg']=document(s,'ACT inference architecture: visual features, projected joint state, and fixed latent feed an encoder–decoder Transformer. Numerical action chunks are postprocessed and executed.')

    # Original OpenVLA: learned action-token prediction, fixed dequantization.
    s=input_panel([('language','Text',['“Pick up the cup”']),('image','Image',['Camera frame'])])
    s+=encoders('Fused vision',dual=True)+transformer('Llama 2 backbone','Action-token prediction')
    s+=panel(1070,110,280,440,5,'Action decoding',PURPLE)
    s+=rect(1090,170,240,75,'white',PURPLE[2],5)
    s+=txt(1090,151,'Action token IDs',23,PURPLE[0],True)+tokens(1093,176,9,PURPLE)+txt(1092,229,'ID₁  ID₂  ID₃  …',23,PURPLE[0],mono=True)
    s+=line(1210,245,1210,290)+rect(1090,290,240,119,'#fafafa',GRAY[2],5)+txt(1108,325,['Fixed bin lookup','Restore scale'],22,GRAY[0])
    s+=rect(1085,458,250,78,'white',PURPLE[2],5)
    s+=line(1210,409,1210,458)+txt(1090,491,['Translation, rotation,','and gripper values'],23,PURPLE[0])
    s+=path('M1000 502H1042V187H1090')+robot(feedback='New camera image',output_y=497)
    figures['token-vla-interface.svg']=document(s,'Original OpenVLA architecture: SigLIP and DINOv2 image features and language embeddings condition Llama 2. Predicted action tokens are decoded to numerical robot commands.')

    # π0: prefix VLM, action expert, and continuous-time sampling.
    s=input_panel([('image','Images',['Camera views']),('language','Text',['“Pick up the cup”']),('state','State',['Joints + gripper'])])
    s+=panel(310,110,265,245,2,'PaliGemma',GREEN)
    s+=scene(330,130,83,57)+speech(479,138,.7)+txt(330,231,['SigLIP features','Text embeddings'],22,GREEN[0])
    s+=tokens(330,292,8,GREEN)+txt(330,340,'VLM context',21,GREEN[0])
    s+=panel(310,435,265,115,3,'State projection',BLUE)+txt(331,479,'State embedding',22,BLUE[0])+tokens(331,505,8,BLUE)
    s+=line(251,190,310,190)+path('M251 350H280V264H310')+line(251,509,310,509)
    s+=panel(635,110,380,440,4,'Flow action expert',ORANGE)
    s+=txt(659,155,'Noisy action chunk + time',23,ORANGE[0])+tokens(663,179,10,ORANGE)
    s+=rect(669,258,307,109,'white',ORANGE[2],6)+txt(689,293,['Transformer','Predict action velocity'],23,ORANGE[0])
    s+=line(824,201,824,258)+line(824,367,824,427)
    s+=rect(685,427,280,63,'white',ORANGE[2],6)+txt(705,467,'Update actions',24,ORANGE[0])
    s+=path('M965 448H996V240H824',True,arrow=False)+junction(824,240)+txt(659,529,'Repeat flow integration',22,ORANGE[0])
    s+=path('M575 303H601V295H669')+path('M575 516H618V335H669')
    s+=panel(1070,110,280,440,5,'Continuous output',RED)
    s+=txt(1090,151,'Continuous chunk',22,RED[0],True)+rect(1090,174,240,112,'white',RED[2],5)+txt(1104,210,['0.20  −0.40  …','0.30  −0.30  …'],24,RED[0],mono=True)
    s+=line(1210,286,1210,340)+rect(1090,340,240,127,'#fafafa',GRAY[2],5)+txt(1105,374,['Restore units','Map conventions','Select next steps'],21,GRAY[0])
    s+=rect(1085,490,250,44,'white',RED[2],5)+line(1210,467,1210,490)
    s+=txt(1090,515,'Joint-target interface',22,RED[0])+path('M965 477H1028V230H1090')+robot()
    figures['continuous-vla-interface.svg']=document(s,'π0 functional architecture: image and language representations plus robot state condition an action expert. Flow integration yields continuous action chunks, then fixed adaptation and robot execution follow.')

    # Closed-loop architecture with actual observation and command representations.
    s=panel(65,110,440,185,1,'Observation',BLUE)
    s+=scene(86,132,175,110)+arm(284,135,.65)+txt(85,278,'Camera images + joint state',24,BLUE[0])
    s+=panel(1050,110,480,185,2,'Learned policy',ORANGE)
    s+=tokens(1073,145,6,ORANGE)+line(1225,157,1268,157)+network(1290,135,ORANGE)+txt(1074,256,'Predict the next action chunk',24,ORANGE[0])
    s+=panel(1050,385,480,185,3,'Robot controller',RED)
    s+=txt(1075,432,['Joint targets → tracking control','Motor commands → joint motion'],25,RED[0])
    s+=f'<path d="M1090 545L1130 525L1170 538L1210 510L1250 522L1290 500L1330 514L1370 493L1410 506" fill="none" stroke="{RED[0]}" stroke-width="3"/>'
    s+=panel(65,385,440,185,4,'Robot and environment',GREEN)
    s+=arm(85,405,1)+scene(260,411,213,115)+txt(85,554,'Movement changes the scene',23,GREEN[0])
    s+=line(505,200,1050,200)+txt(655,180,'Observation inputs',27,GRAY[0])
    s+=path('M1530 200H1560V480H1530')+txt(1240,335,'Action targets',25,GRAY[0])
    s+=line(1050,481,505,481)+txt(675,459,'Physical actuation',27,GRAY[0])
    s+=path('M65 480H32V200H65')+txt(85,335,'New feedback',25,GRAY[0])
    figures['robot-feedback-loop.svg']=document(s,'Closed-loop robot architecture: observation inputs feed a learned policy, action targets feed a controller, and physical movement changes the next camera images and measured state.')
    return figures


if __name__ == '__main__':
    references = [ROOT/'app/future-decks/lecture-8.ts', ROOT/'content/lectures/lecture-8.qmd']
    documents = {path: path.read_text() for path in references}
    for name, data in build().items():
        (ROOT/'public'/'lecture-8'/name).write_text(data)
        # Public assets retain their names; update their URLs when the drawing changes.
        # This also refreshes images in an already-open presentation through HMR.
        revision = sha256(data.encode()).hexdigest()[:12]
        target = 'lecture-8/' + name
        for path in references:
            documents[path] = re.sub(re.escape(target) + r'(?:\?v=[a-f0-9]+)?',
                                     target + '?v=' + revision, documents[path])
    for path, text in documents.items():
        if text != path.read_text():
            path.write_text(text)
