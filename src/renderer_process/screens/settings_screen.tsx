export function SettingsScreen() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px' }}>
      <h2>设置</h2>
      <p>更多配置选项将在后续版本开放。</p>
      <ul>
        <li>数据目录：Electron userData/tango-card</li>
        <li>默认记忆权重：熟知 1，不太熟 3，需要强化 5</li>
        <li>SVG 安全：保存前会自动移除 script/foreignObject 标签</li>
      </ul>
    </section>
  );
}
