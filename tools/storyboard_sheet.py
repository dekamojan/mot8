#!/usr/bin/env python3
"""
Buat LEMBAR STORYBOARD (seperti contoh di Threads): kisi frame per adegan dengan nomor, waktu, dan narasi.

    python3 tools/storyboard_sheet.py video2 --video out/video2.mp4
    python3 tools/storyboard_sheet.py video2 --video out/video2.mp4 --cols 4 --out out/storyboard.png

Membaca public/<video>/scenes.json (hasil prepare.py; bila tidak ada, scenes.src.json), mengambil satu frame tiap adegan
(0,7 dtk setelah adegan mulai, supaya animasi masuk sudah selesai), lalu menyusun kisi PNG.
Butuh: ffmpeg dan Pillow (pip install pillow). Cocok sebagai langkah terakhir di GitHub Action (unggah sebagai artifact).

Opsi:
  --video   file video hasil render (wajib)
  --scenes  path scenes.json lain (bawaan: public/<video>/scenes.json)
  --cols    jumlah kolom (bawaan 5)
  --width   lebar tiap frame dalam piksel (bawaan 360)
  --offset  detik setelah awal adegan untuk mengambil frame (bawaan 0.7)
  --out     file hasil (bawaan: storyboard.png di sebelah video)
"""
import argparse, json, os, re, subprocess, sys, tempfile

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit('GAGAL: butuh Pillow (pip install pillow)')

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('--video', dest='vid', required=True)
ap.add_argument('--scenes', default=''); ap.add_argument('--cols', type=int, default=5)
ap.add_argument('--width', type=int, default=360); ap.add_argument('--offset', type=float, default=0.7)
ap.add_argument('--out', default='')
a = ap.parse_args()

D = f'public/{a.video}'
sp = a.scenes or next((p for p in (f'{D}/scenes.json', f'{D}/scenes.src.json') if os.path.exists(p)), '')
if not sp or not os.path.exists(sp): sys.exit(f'GAGAL: scenes.json tidak ditemukan di {D}/ (atau pakai --scenes)')
if not os.path.exists(a.vid): sys.exit(f'GAGAL: video {a.vid} tidak ditemukan')
data = json.load(open(sp, encoding='utf-8'))
scenes = data['scenes']

dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', a.vid], capture_output=True, text=True).stdout.strip() or 0)

def font(sz, bold=True):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
              '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf', '/Library/Fonts/Arial Bold.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def wrap(txt, fnt, maxw, dr):
    lines, cur = [], ''
    for w in txt.split():
        t = (cur + ' ' + w).strip()
        if dr.textlength(t, font=fnt) <= maxw: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

W = a.width
tmp = tempfile.mkdtemp()
tiles = []
for i, s in enumerate(scenes):
    t = min(max(0.0, s['start'] + a.offset), max(0.0, dur - 0.1)) if dur else s['start'] + a.offset
    fp = f'{tmp}/f{i:02d}.png'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', a.vid, '-frames:v', '1', '-vf', f'scale={W}:-2', fp], check=True)
    tiles.append((i, s, Image.open(fp).convert('RGB')))

fh = tiles[0][2].height
fn, fs = font(20), font(19, False)
PAD, CARD_PAD, TXT_H = 14, 10, 160
cw, ch = W + CARD_PAD * 2, fh + CARD_PAD + TXT_H
cols = max(1, a.cols); rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (PAD + cols * (cw + PAD), PAD + rows * (ch + PAD)), '#efe8d8')
dr = ImageDraw.Draw(sheet)
for k, (i, s, im) in enumerate(tiles):
    x = PAD + (k % cols) * (cw + PAD); y = PAD + (k // cols) * (ch + PAD)
    dr.rounded_rectangle((x, y, x + cw, y + ch), radius=16, fill='#ffffff', outline='#d8cfba', width=2)
    mask = Image.new('L', im.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width, im.height), radius=12, fill=255)
    sheet.paste(im, (x + CARD_PAD, y + CARD_PAD), mask)
    by = y + CARD_PAD + fh + 12
    dr.ellipse((x + CARD_PAD, by, x + CARD_PAD + 34, by + 34), fill='#ffc933', outline='#2a2140', width=3)
    nb = str(i + 1); dr.text((x + CARD_PAD + 17, by + 17), nb, font=fn, fill='#2a2140', anchor='mm')
    st = s['start']; dr.text((x + CARD_PAD + 44, by + 17), f'{int(st // 60)}:{int(st % 60):02d}', font=fn, fill='#2a2140', anchor='lm')
    narasi = re.sub(r'\*', '', s.get('title', ''))
    for li, line in enumerate(wrap(narasi, fs, cw - CARD_PAD * 2 - 6, dr)[:4]):
        dr.text((x + CARD_PAD, by + 44 + li * 24), line, font=fs, fill='#3a3350')
out = a.out or os.path.join(os.path.dirname(a.vid) or '.', 'storyboard.png')
sheet.save(out)
print(f'OK  {len(tiles)} adegan -> {out} ({sheet.width}x{sheet.height})')
