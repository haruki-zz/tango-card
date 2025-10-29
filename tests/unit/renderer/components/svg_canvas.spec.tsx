import { render, screen, fireEvent } from '@testing-library/react';
import { SvgCanvas } from '../../../../src/renderer_process/components/svg_canvas';

jest.mock('../../../../src/renderer_process/hooks/use_element_size', () => {
  const size = { width: 320, height: 180 };
  return {
    __esModule: true,
    use_element_size: () => ({
      attach_ref: jest.fn(),
      size,
    }),
    __set_mock_size: (next_size: { width: number; height: number }) => {
      size.width = next_size.width;
      size.height = next_size.height;
    },
  };
});

const { __set_mock_size: set_mock_size } = jest.requireMock(
  '../../../../src/renderer_process/hooks/use_element_size',
);

class MockPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
    this.pointerType = init.pointerType ?? 'mouse';
  }
}

beforeAll(() => {
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    writable: true,
    value: MockPointerEvent,
  });
  Object.defineProperty(global, 'PointerEvent', {
    configurable: true,
    writable: true,
    value: MockPointerEvent,
  });
});

describe('SvgCanvas', () => {
  beforeEach(() => {
    set_mock_size({ width: 320, height: 180 });
  });

  it('renders empty state when svg source is blank', () => {
    render(<SvgCanvas svg_source="   " />);
    expect(screen.getByText('填写卡片内容后即可在此查看预览。')).toBeInTheDocument();
  });

  it('renders an error message when svg cannot be parsed', () => {
    render(<SvgCanvas svg_source="<svg>" />);
    expect(screen.getByText('SVG 无法解析，请检查源码。')).toBeInTheDocument();
  });

  it('renders the svg preview when markup is valid', () => {
    const valid_svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="#22c55e"/></svg>';
    const { container } = render(<SvgCanvas svg_source={valid_svg} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('shows initializing message while container size is unknown', () => {
    set_mock_size({ width: 0, height: 0 });
    render(<SvgCanvas svg_source="<svg xmlns='http://www.w3.org/2000/svg'></svg>" />);
    expect(screen.getByText('预览加载中...')).toBeInTheDocument();
  });

  it('invokes swipe callback when touch gesture is detected', () => {
    const handle_swipe = jest.fn();
    const { container } = render(
      <SvgCanvas
        svg_source="<svg xmlns='http://www.w3.org/2000/svg'></svg>"
        on_swipe={handle_swipe}
      />,
    );
    const host = container.querySelector('.svg-canvas');
    expect(host).not.toBeNull();
    if (!host) {
      return;
    }
    fireEvent.pointerDown(host, { pointerId: 1, pointerType: 'touch', clientX: 200, clientY: 16 });
    fireEvent.pointerUp(host, { pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 18 });
    expect(handle_swipe).toHaveBeenCalledWith('left');
  });

  it('detects vertical swipe gestures', () => {
    const handle_swipe = jest.fn();
    const { container } = render(
      <SvgCanvas
        svg_source="<svg xmlns='http://www.w3.org/2000/svg'></svg>"
        on_swipe={handle_swipe}
      />,
    );
    const host = container.querySelector('.svg-canvas');
    expect(host).not.toBeNull();
    if (!host) {
      return;
    }
    fireEvent.pointerDown(host, { pointerId: 2, pointerType: 'touch', clientX: 32, clientY: 20 });
    fireEvent.pointerUp(host, { pointerId: 2, pointerType: 'touch', clientX: 40, clientY: 120 });
    expect(handle_swipe).toHaveBeenCalledWith('down');
  });
});
