export interface SvgBox { x: number; y: number; width: number; height: number }

function parseSvg(source: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('Invalid SVG');
  return doc.documentElement as unknown as SVGSVGElement;
}

export function readViewBox(source: string): SvgBox {
  const svg = parseSvg(source);
  const values = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (values.length === 4 && values.every(Number.isFinite) && values[2] > 0 && values[3] > 0) {
    return { x: values[0], y: values[1], width: values[2], height: values[3] };
  }
  const width = parseFloat(svg.getAttribute('width') || '24');
  const height = parseFloat(svg.getAttribute('height') || '24');
  return { x: 0, y: 0, width: width > 0 ? width : 24, height: height > 0 ? height : 24 };
}

export function cropSvg(source: string, box: SvgBox): string {
  if (!Object.values(box).every(Number.isFinite) || box.width <= 0 || box.height <= 0) throw new Error('Invalid crop dimensions');
  const svg = parseSvg(source);
  svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
  svg.setAttribute('width', String(box.width));
  svg.setAttribute('height', String(box.height));
  svg.setAttribute('overflow', 'hidden');
  svg.style.overflow = 'hidden';
  return new XMLSerializer().serializeToString(svg);
}

// Measure in an isolated document: uploaded scripts cannot execute, styles cannot
// affect the app, and CSP blocks network loads. Internal defs/use are preserved.
export async function measureSvg(source: string): Promise<SvgBox> {
  const svg = parseSvg(source);
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1024px;height:1024px;visibility:hidden;pointer-events:none';
  svg.querySelectorAll('script, foreignObject, animate, animateTransform, set').forEach(el => el.remove());
  svg.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
  });
  const view = readViewBox(source);
  svg.setAttribute('width', String(view.width)); svg.setAttribute('height', String(view.height));
  svg.style.width = `${view.width}px`; svg.style.height = `${view.height}px`;
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('SVG measurement timed out')), 5000);
      frame.onload = () => { window.clearTimeout(timeout); resolve(); };
      frame.srcdoc = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">${new XMLSerializer().serializeToString(svg)}`;
      document.body.appendChild(frame);
    });
    const rendered = frame.contentDocument?.querySelector('svg');
    if (!rendered) throw new Error('Cannot measure SVG');
    const bounds = rendered.getBBox();
    if (bounds.width <= 0 && bounds.height <= 0) throw new Error('SVG has no visible geometry');
    // getBBox excludes strokes in some browsers. Include a conservative stroke
    // margin (including miter joins and scaling) so outlines are not cut off.
    let margin = 0;
    rendered.querySelectorAll<SVGGraphicsElement>('path,rect,circle,ellipse,line,polyline,polygon,text,use').forEach(el => {
      const style = frame.contentWindow!.getComputedStyle(el);
      if (style.stroke === 'none' || style.display === 'none') return;
      const matrix = el.getCTM();
      const scale = matrix ? Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)) : 1;
      const join = style.strokeLinejoin === 'miter' ? Math.max(1, Number(style.strokeMiterlimit) || 4) : 1;
      margin = Math.max(margin, (parseFloat(style.strokeWidth) || 0) * scale * join / 2);
    });
    return { x: bounds.x - margin, y: bounds.y - margin, width: Math.max(bounds.width + margin * 2, 0.001), height: Math.max(bounds.height + margin * 2, 0.001) };
  } finally { frame.remove(); }
}

export async function fitSvgToContent(source: string, padding = 0): Promise<string> {
  const box = await measureSvg(source);
  return cropSvg(source, { x: box.x - padding, y: box.y - padding, width: box.width + padding * 2, height: box.height + padding * 2 });
}

export async function centerSvg(source: string): Promise<string> {
  const box = await measureSvg(source);
  const view = readViewBox(source);
  // Move the viewport origin, preserving defs, transforms, selectors and sizing.
  const svg = parseSvg(source);
  svg.setAttribute('viewBox', `${box.x + (box.width - view.width) / 2} ${box.y + (box.height - view.height) / 2} ${view.width} ${view.height}`);
  return new XMLSerializer().serializeToString(svg);
}
