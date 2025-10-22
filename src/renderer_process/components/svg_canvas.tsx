import { useMemo } from 'react';
import { prepare_svg_markup } from '../services/svg_renderer';

interface SvgCanvasProps {
  readonly svg_source: string;
  readonly width?: number;
  readonly height?: number;
}

export function SvgCanvas({ svg_source, width = 640, height = 360 }: SvgCanvasProps) {
  const prepared_markup = useMemo(
    () =>
      prepare_svg_markup(svg_source, {
        container_width: width,
        container_height: height,
      }),
    [svg_source, width, height],
  );

  if (!prepared_markup) {
    return <div>无法渲染 SVG，请检查源码。</div>;
  }

  return (
    <div
      className="svg-canvas"
      style={{ width: '100%', height: '100%' }}
      dangerouslySetInnerHTML={{ __html: prepared_markup }}
    />
  );
}
