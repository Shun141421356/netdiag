/**
 * exportImage.ts
 * キャンバス領域をPNG/SVGとして書き出す
 */

import { DiagramData } from '../types/diagram';
import { CABLE_STYLES, getAbsolutePortCenter, controlOffset, CONTAINER_TYPES } from '../types/diagram';

// ---- PNG export (html2canvas) ----
export async function exportAsPng(
  canvasWrapEl: HTMLElement,
  filename: string,
  scale: number,
  panX: number,
  panY: number,
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  // キャンバス内の実コンテンツ範囲を取得してトリミング
  const result = await html2canvas(canvasWrapEl, {
    backgroundColor: '#f9fafb',
    scale: 2, // retina
    useCORS: true,
    logging: false,
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = result.toDataURL('image/png');
  link.click();
}

// ---- SVG export (ノードをforeignObjectで埋め込む代わりに、SVGネイティブで描画) ----
export function exportAsSvg(diagram: DiagramData, filename: string): void {
  const nodes = diagram.nodes;
  const conns = diagram.connections;

  if (nodes.length === 0) {
    alert('ノードが何もありません');
    return;
  }

  // バウンディングボックス計算
  const PAD = 40;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const h = n.height ?? (26 + n.ports.length * 20 + 8);
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + h);
  }
  const W = maxX - minX + PAD * 2;
  const H = maxY - minY + PAD * 2;
  const ox = minX - PAD; // オフセット
  const oy = minY - PAD;

  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  lines.push(`<rect width="${W}" height="${H}" fill="#f9fafb"/>`);

  // グリッド
  lines.push(`<defs>`);
  lines.push(`<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20,0 L0,0 0,20" fill="none" stroke="#e5e7eb" stroke-width="0.5"/></pattern>`);
  for (const [k, v] of Object.entries(CABLE_STYLES)) {
    lines.push(`<marker id="arr-${k}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${v.stroke}"/></marker>`);
  }
  lines.push(`</defs>`);
  lines.push(`<rect width="${W}" height="${H}" fill="url(#grid)"/>`);

  // 接続線
  for (const conn of conns) {
    const fromNode = nodes.find(n => n.id === conn.fromNode);
    const toNode   = nodes.find(n => n.id === conn.toNode);
    if (!fromNode || !toNode) continue;
    const fromPort = fromNode.ports.find(p => p.id === conn.fromPort);
    const toPort   = toNode.ports.find(p => p.id === conn.toPort);
    if (!fromPort || !toPort) continue;

    const fp = getAbsolutePortCenter(fromNode, conn.fromPort);
    const tp = getAbsolutePortCenter(toNode, conn.toPort);
    const fo = controlOffset(fromPort.side);
    const to = controlOffset(toPort.side);
    const style = CABLE_STYLES[conn.cableType as keyof typeof CABLE_STYLES];

    const fx = fp.x - ox, fy = fp.y - oy;
    const tx = tp.x - ox, ty = tp.y - oy;
    const d = `M${fx},${fy} C${fx+fo.dx},${fy+fo.dy} ${tx+to.dx},${ty+to.dy} ${tx},${ty}`;
    const dash = style.dash ? `stroke-dasharray="${style.dash}"` : '';
    lines.push(`<path d="${d}" fill="none" stroke="${style.stroke}" stroke-width="${style.width}" ${dash} marker-end="url(#arr-${conn.cableType})"/>`);

    // ラベル
    const midX = (fx + tx) / 2, midY = (fy + ty) / 2 - 10;
    lines.push(`<text x="${midX}" y="${midY}" text-anchor="middle" font-size="9" fill="${style.stroke}" opacity="0.8" font-family="sans-serif">${style.label}</text>`);
  }

  // ノード
  for (const node of nodes) {
    const nx = node.x - ox, ny = node.y - oy;
    const w = node.width;
    const isContainer = CONTAINER_TYPES.includes(node.type);
    const isCloud = node.type === 'ntt-cloud';
    const h = node.height ?? (26 + node.ports.length * 20 + 8);

    if (isCloud) {
      lines.push(`<rect x="${nx+2}" y="${ny+2}" width="${w-4}" height="${h-4}" rx="36" fill="${node.bg}" fill-opacity="0.75" stroke="${node.color}" stroke-width="1.5" stroke-dasharray="8,4"/>`);
      lines.push(`<text x="${nx+14}" y="${ny+20}" font-size="11" font-weight="600" fill="${node.color}" font-family="sans-serif">${node.label}</text>`);
    } else if (isContainer) {
      lines.push(`<rect x="${nx}" y="${ny}" width="${w}" height="${h}" rx="8" fill="${node.bg}" fill-opacity="0.2" stroke="${node.color}" stroke-width="1.5" stroke-dasharray="6,3"/>`);
      lines.push(`<rect x="${nx}" y="${ny}" width="${w}" height="24" rx="6" fill="${node.bg}" fill-opacity="0.8"/>`);
      lines.push(`<text x="${nx+8}" y="${ny+16}" font-size="11" font-weight="600" fill="${node.color}" font-family="sans-serif">${node.label}${node.floor ? ' ' + node.floor : ''}</text>`);
    } else {
      // 通常ノード
      lines.push(`<rect x="${nx}" y="${ny}" width="${w}" height="${h}" rx="8" fill="white" stroke="#d1d5db" stroke-width="1"/>`);
      lines.push(`<rect x="${nx}" y="${ny}" width="${w}" height="26" rx="6" fill="${node.bg}"/>`);
      lines.push(`<rect x="${nx}" y="${ny+20}" width="${w}" height="6" fill="${node.bg}"/>`); // ヘッダ下部を四角で
      lines.push(`<text x="${nx+24}" y="${ny+17}" font-size="11" font-weight="600" fill="${node.color}" font-family="sans-serif">${node.label}${node.model ? '  ' + node.model : ''}</text>`);
      // ポート
      node.ports.forEach((port, i) => {
        const py = ny + 26 + 4 + i * 20 + 10;
        lines.push(`<text x="${nx+12}" y="${py+4}" font-size="10" fill="#6b7280" font-family="sans-serif">${port.label}</text>`);
      });
    }

    // コンテナのポートドット
    if (isContainer || isCloud) {
      for (const port of node.ports) {
        const abs = getAbsolutePortCenter(node, port.id);
        const px = abs.x - ox, py = abs.y - oy;
        lines.push(`<circle cx="${px}" cy="${py}" r="5" fill="white" stroke="${node.color}" stroke-width="2"/>`);
        lines.push(`<text x="${px+8}" y="${py+4}" font-size="9" fill="${node.color}" font-family="sans-serif">${port.label}</text>`);
      }
    }
  }

  lines.push(`</svg>`);
  const svg = lines.join('\n');
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.download = `${filename}.svg`;
  a.href = URL.createObjectURL(blob);
  a.click();
}
