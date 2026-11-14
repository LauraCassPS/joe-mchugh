"""Validate portable Home/About routes, assets, semantics and intentional draft state."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re,json
ROOT=Path(__file__).resolve().parent.parent
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Page(HTMLParser):
 def __init__(self,path):
  super().__init__();self.path=path;self.nodes=[];self.ids=set();self.stack=[];self.feed(path.read_text());assert not self.stack,path
 def handle_starttag(self,t,attrs):
  a=dict(attrs);self.nodes.append((t,a))
  if 'id' in a:assert a['id'] not in self.ids;self.ids.add(a['id'])
  if t not in VOID:self.stack.append(t)
 def handle_endtag(self,t):assert self.stack.pop()==t,(self.path,t)
pages={p:Page(p) for p in [ROOT/'index.html',ROOT/'about/index.html',ROOT/'one-to-one/index.html',ROOT/'team-coaching/index.html']}
for path,page in pages.items():
 assert sum(t=='h1' for t,a in page.nodes)==1
 assert sum(t=='main' for t,a in page.nodes)==1
 previous=0
 for t,a in page.nodes:
  if re.fullmatch('h[1-6]',t):level=int(t[1]);assert level<=previous+1;previous=level
  for key in ['aria-labelledby','aria-describedby']:
   assert all(i in page.ids for i in a.get(key,'').split())
  urls=[a[k] for k in ['href','src'] if k in a]
  if t=='img':
   assert a.get('alt') and int(a['width'])>0 and int(a['height'])>0
   urls += [v.strip().split()[0] for v in a.get('srcset','').split(',') if v.strip()]
  for url in urls:
   parsed=urlsplit(url)
   if parsed.scheme:continue
   target=(path.parent/unquote(parsed.path)).resolve() if parsed.path else path
   if target.is_dir():target=target/'index.html'
   assert target.is_relative_to(ROOT) and target.exists(),(path,url)
   if parsed.fragment:
    assert target in pages and unquote(parsed.fragment) in pages[target].ids,url
  if a.get('class')=='nav-pending':assert t=='span' and 'href' not in a
 assert sum(a.get('class')=='nav-pending' for t,a in page.nodes)==0
 assert any(t=='meta' and a.get('name')=='robots' and 'noindex' in a.get('content','') for t,a in page.nodes)
 for payload in re.findall(r'<script type="application/ld\+json">(.*?)</script>',path.read_text(),re.S):json.loads(payload)
 print('PASS:',path.relative_to(ROOT),'semantics, links, assets, alt text, metadata and connected service navigation')
for path in [p for folder in ('homepage','about','one-to-one','team-coaching') for p in (ROOT/folder).glob('*.css')]:
 for url in re.findall(r'url\([\'\"]?([^\'\")]+)',path.read_text()):assert (path.parent/url).resolve().exists(),(path,url)
print('PASS: all source and compiled CSS resources exist.')
