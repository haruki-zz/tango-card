# app/features/heatmap
- 聚合 ActivityLog 为周/月视图（UTC 分桶，周日为起始）的活跃度数据。
- 提供纯函数 `buildHeatmapData`/`getHeatmapData` 生成方格数据与缓存回退。
- 使用 AsyncStorage 做 1 年 TTL 的本地缓存，日志缺失时可离线读取缓存。
- `components/HeatmapView` 使用 `react-native-svg` 渲染方格与周/月切换，支持点击日期查看新增/复习详情。
