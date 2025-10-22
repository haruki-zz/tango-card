import { useMemo } from 'react';
import { prepare_svg_markup } from '../services/svg_renderer';
import { use_element_size } from '../hooks/use_element_size';

interface SvgCanvasProps {
  readonly svg_source: string;
}

export function SvgCanvas({ svg_source }: SvgCanvasProps) {
  const { attach_ref, size } = use_element_size();

  const prepared_markup = useMemo(() => {
    if (size.width === 0 || size.height === 0) {
      return '';
    }
    return prepare_svg_markup(svg_source, {
      container_width: size.width,
      container_height: size.height,
    });
  }, [svg_source, size.height, size.width]);

  return (
    <div ref={attach_ref} className="svg-canvas" style={{ width: '100%', height: '100%' }}>
      {prepared_markup ? (
        <div dangerouslySetInnerHTML={{ __html: prepared_markup }} />
      ) : (
        <div>无法渲染 SVG，请检查源码。</div>
      )}
    </div>
  );
}
