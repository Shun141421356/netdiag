/**
 * exportImage.ts
 * SVGを生成 → CanvasでPNG化
 * html2canvasを使わずtransform問題を回避
 */

import { DiagramData, CABLE_STYLES, CONTAINER_TYPES, getAbsolutePortCenter, controlOffset } from '../types/diagram';

const PAD = 48;
const FONT = 'system-ui, -apple-system, sans-serif';

// ---- SVG文字列生成 ----
export function buildSvgString(diagram: DiagramData): string | null {
  const nodes = diagram.nodes;
  const conns  = diagram.connections;
  if (nodes.length === 0) return null;

  // バウンディングボックス
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const h = n.height ?? (26 + Math.max(n.ports.filter(p=>p.side==='left'||p.side==='right').length,1) * 20 + 12);
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width); maxY = Math.max(maxY, n.y + h);
  }
  const W  = maxX - minX + PAD * 2;
  const H  = maxY - minY + PAD * 2;
  const ox = minX - PAD;
  const oy = minY - PAD;

  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);

  // 背景・グリッド
  lines.push(`<rect width="${W}" height="${H}" fill="#f9fafb"/>`);
  lines.push(`<defs>
    <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M20,0 L0,0 0,20" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
    </pattern>
    ${Object.entries(CABLE_STYLES).map(([k,v])=>
      `<marker id="a-${k}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="${v.stroke}"/>
      </marker>`
    ).join('')}
  </defs>`);
  lines.push(`<rect width="${W}" height="${H}" fill="url(#g)"/>`);

  // ---- コンテナ（背面）----
  for (const node of nodes) {
    if (!CONTAINER_TYPES.includes(node.type)) continue;
    const nx = node.x - ox, ny = node.y - oy;
    const w = node.width, h = node.height ?? 200;
    const lbl = esc(node.label + (node.floor ? ' '+node.floor : ''));

    if (node.type === 'ntt-cloud') {
      lines.push(`<rect x="${nx+2}" y="${ny+2}" width="${w-4}" height="${h-4}" rx="36" fill="${node.bg}" fill-opacity="0.75" stroke="${node.color}" stroke-width="1.5" stroke-dasharray="8,4"/>`);
      lines.push(`<text x="${nx+14}" y="${ny+22}" font-size="12" font-weight="600" fill="${node.color}" font-family="${FONT}">${lbl}</text>`);
    } else {
      lines.push(`<rect x="${nx}" y="${ny}" width="${w}" height="${h}" rx="8" fill="${node.bg}" fill-opacity="0.18" stroke="${node.color}" stroke-width="1.5" stroke-dasharray="6,3"/>`);
      lines.push(`<rect x="${nx}" y="${ny}" width="${w}" height="26" rx="6" fill="${node.bg}" fill-opacity="0.85"/>`);
      lines.push(`<rect x="${nx}" y="${ny+20}" width="${w}" height="6" fill="${node.bg}" fill-opacity="0.85"/>`);
      lines.push(`<text x="${nx+10}" y="${ny+18}" font-size="11" font-weight="600" fill="${node.color}" font-family="${FONT}">${lbl}</text>`);
    }
    // コンテナポートドット
    for (const port of node.ports) {
      const abs = getAbsolutePortCenter(node, port.id);
      const px = abs.x - ox, py = abs.y - oy;
      lines.push(`<circle cx="${px}" cy="${py}" r="5" fill="white" stroke="${node.color}" stroke-width="2"/>`);
      const tx = port.side==='right' ? px+8 : port.side==='left' ? px-8 : px;
      const anchor = port.side==='right' ? 'start' : port.side==='left' ? 'end' : 'middle';
      const ty = port.side==='bottom' ? py+14 : port.side==='top' ? py-6 : py+4;
      lines.push(`<text x="${tx}" y="${ty}" font-size="9" fill="${node.color}" text-anchor="${anchor}" font-family="${FONT}">${esc(port.label)}</text>`);
    }
  }

  // ---- 接続線 ----
  for (const conn of conns) {
    const fn = nodes.find(n=>n.id===conn.fromNode);
    const tn = nodes.find(n=>n.id===conn.toNode);
    if (!fn||!tn) continue;
    const fp2 = fn.ports.find(p=>p.id===conn.fromPort);
    const tp2 = tn.ports.find(p=>p.id===conn.toPort);
    if (!fp2||!tp2) continue;

    const fp = getAbsolutePortCenter(fn, conn.fromPort);
    const tp = getAbsolutePortCenter(tn, conn.toPort);
    const fo = controlOffset(fp2.side);
    const to = controlOffset(tp2.side);
    const st = CABLE_STYLES[conn.cableType as keyof typeof CABLE_STYLES];

    const fx=fp.x-ox, fy=fp.y-oy, tx=tp.x-ox, ty=tp.y-oy;
    const d = `M${fx},${fy} C${fx+fo.dx},${fy+fo.dy} ${tx+to.dx},${ty+to.dy} ${tx},${ty}`;
    const dash = st.dash ? `stroke-dasharray="${st.dash}"` : '';
    lines.push(`<path d="${d}" fill="none" stroke="${st.stroke}" stroke-width="${st.width}" ${dash} marker-end="url(#a-${conn.cableType})"/>`);

    const mx=(fx+tx)/2, my=(fy+ty)/2-10;
    lines.push(`<text x="${mx}" y="${my}" text-anchor="middle" font-size="9" fill="${st.stroke}" opacity="0.85" font-family="${FONT}">${esc(st.label)}</text>`);
  }

  // ---- 通常ノード（前面）----
  for (const node of nodes) {
    if (CONTAINER_TYPES.includes(node.type)) continue;
    const nx = node.x - ox, ny = node.y - oy;
    const w  = node.width;

    const lrPorts = node.ports.filter(p=>p.side==='left'||p.side==='right');
    const topPorts = node.ports.filter(p=>p.side==='top');
    const botPorts = node.ports.filter(p=>p.side==='bottom');
    const maxLR = Math.max(lrPorts.length, 1);
    const HEADER = 26;
    const PORT_H = 20;
    const totalH = HEADER + (topPorts.length>0?22:0) + maxLR * PORT_H + 8 + (botPorts.length>0?22:0) + (node.sfps?.length??0)*18 + (node.notes?18:0);

    // 上ポートの余白
    const topOff = topPorts.length > 0 ? 22 : 0;
    const realNY = ny;

    lines.push(`<rect x="${nx}" y="${realNY}" width="${w}" height="${totalH}" rx="8" fill="white" stroke="#d1d5db" stroke-width="1"/>`);
    // ヘッダ
    lines.push(`<rect x="${nx}" y="${realNY+topOff}" width="${w}" height="${HEADER}" rx="0" fill="${node.bg}"/>`);
    if (topOff===0) {
      lines.push(`<rect x="${nx}" y="${realNY}" width="${w}" height="${HEADER}" rx="6" fill="${node.bg}"/>`);
      lines.push(`<rect x="${nx}" y="${realNY+HEADER-6}" width="${w}" height="6" fill="${node.bg}"/>`);
    }
    const modelStr = node.model ? `  ${node.model}` : '';
    lines.push(`<text x="${nx+24}" y="${realNY+topOff+17}" font-size="11" font-weight="600" fill="${node.color}" font-family="${FONT}">${esc(node.label+modelStr)}</text>`);

    // 上ポート
    if (topPorts.length > 0) {
      topPorts.forEach((port, i) => {
        const px = nx + w * (i+1) / (topPorts.length+1);
        lines.push(`<circle cx="${px}" cy="${realNY+8}" r="4" fill="white" stroke="${node.color}" stroke-width="2"/>`);
        lines.push(`<text x="${px}" y="${realNY+20}" font-size="8" fill="#9ca3af" text-anchor="middle" font-family="${FONT}">${esc(port.label)}</text>`);
      });
    }

    // 左右ポート
    const bodyY = realNY + topOff + HEADER + 4;
    const leftPorts  = node.ports.filter(p=>p.side==='left');
    const rightPorts = node.ports.filter(p=>p.side==='right');
    const rows = Math.max(leftPorts.length, rightPorts.length);
    for (let i=0;i<rows;i++) {
      const py = bodyY + i * PORT_H + PORT_H/2;
      const lp = leftPorts[i], rp = rightPorts[i];
      if (lp) {
        lines.push(`<circle cx="${nx}" cy="${py}" r="4" fill="white" stroke="${node.color}" stroke-width="2"/>`);
        lines.push(`<text x="${nx+8}" y="${py+4}" font-size="10" fill="#6b7280" font-family="${FONT}">${esc(lp.label)}</text>`);
      }
      if (rp) {
        lines.push(`<circle cx="${nx+w}" cy="${py}" r="4" fill="white" stroke="${node.color}" stroke-width="2"/>`);
        lines.push(`<text x="${nx+w-8}" y="${py+4}" font-size="10" fill="#6b7280" text-anchor="end" font-family="${FONT}">${esc(rp.label)}</text>`);
      }
    }

    // 下ポート
    if (botPorts.length > 0) {
      const bY = bodyY + rows * PORT_H + 4;
      botPorts.forEach((port, i) => {
        const px = nx + w * (i+1) / (botPorts.length+1);
        lines.push(`<text x="${px}" y="${bY+8}" font-size="8" fill="#9ca3af" text-anchor="middle" font-family="${FONT}">${esc(port.label)}</text>`);
        lines.push(`<circle cx="${px}" cy="${bY+16}" r="4" fill="white" stroke="${node.color}" stroke-width="2"/>`);
      });
    }
  }

  // ---- 凡例 ----
  const legX = 8, legY = H - Object.keys(CABLE_STYLES).length * 16 - 28;
  lines.push(`<rect x="${legX-4}" y="${legY-16}" width="130" height="${Object.keys(CABLE_STYLES).length*16+20}" rx="6" fill="white" fill-opacity="0.9" stroke="#e5e7eb"/>`);
  lines.push(`<text x="${legX}" y="${legY-4}" font-size="9" font-weight="600" fill="#9ca3af" font-family="${FONT}">凡例</text>`);
  Object.entries(CABLE_STYLES).forEach(([,v],i) => {
    const ly = legY + i*16;
    const dash = v.dash ? `stroke-dasharray="${v.dash}"` : '';
    lines.push(`<line x1="${legX}" y1="${ly+4}" x2="${legX+28}" y2="${ly+4}" stroke="${v.stroke}" stroke-width="2" ${dash}/>`);
    lines.push(`<text x="${legX+34}" y="${ly+8}" font-size="10" fill="#4b5563" font-family="${FONT}">${esc(v.label)}</text>`);
  });

  lines.push(`</svg>`);
  return lines.join('\n');
}

// ---- SVG書き出し ----
export function exportAsSvg(diagram: DiagramData, filename: string): void {
  const svg = buildSvgString(diagram);
  if (!svg) { alert('ノードが何もありません'); return; }
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.download = `${filename}.svg`; a.href = URL.createObjectURL(blob); a.click();
}

// ---- PNG書き出し (SVG→Canvas→PNG) ----
export function exportAsPng(diagram: DiagramData, filename: string): void {
  const svg = buildSvgString(diagram);
  if (!svg) { alert('ノードが何もありません'); return; }

  const blob  = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url   = URL.createObjectURL(blob);
  const img   = new Image();

  img.onload = () => {
    const SCALE = 2; // retina
    const canvas = document.createElement('canvas');
    canvas.width  = img.width  * SCALE;
    canvas.height = img.height * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const a = document.createElement('a');
    a.download = `${filename}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('PNG変換に失敗しました');
  };

  img.src = url;
}
