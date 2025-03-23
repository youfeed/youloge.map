### Youloge MAP 免费瓦片地图服务

> 用于网站简单地图展示服务

### 设计标准

- 坐标采用 WGS84 坐标系 (EPSG:4326) === GCJ02 坐标系 (EPSG:3857)

### 快速开始

- npm 安装
- CDN 引入

### 开始使用

```
const map = map();
map.onready();


```

### API设计

- map.center({lat:0,lng:0} ); // 无参：返回中心的 有参：设置中心点
- map.zoom(12); // 无参：返回当前的缩放级别 有参：设置缩放级别

