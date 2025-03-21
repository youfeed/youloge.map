const config = {
    // 初始坐标
    'center': [113.324520, 23.129110],
    // 缩放级别
    // 投影坐标系
    'projection': {
        '4326': 'EPSG:4326',
        '3857': 'EPSG:3857',
        '900913': 'EPSG:900913',
    },
    'options': {
        center:0,
        zoom:12,
        minZoom:3,
        maxZoom:20,
    },
    dpr:2,
    // 
    keyCodes: {
        left: [37],
        right: [39],
        down: [40],
        up: [38],
        zoomIn: [187, 107, 61, 171],
        zoomOut: [189, 109, 54, 173]
    },
    // 矢量底图
    'vec':'vec_c/wmts',
    // 矢量注记
    'cva_c':'cva_c/wmts',
    // 影像底图
    'img':'img_c/wmts',
    // 地形底图
    'ter':'ter_c/wmts',
    // 三维底图
    'cva':'cva_c/wmts',
    type:[
        {
            title:'地图',
            icon:"/map/maptype/vector.png"
        },{
            title:'卫星',
            icon:"/map/maptype/satellite.png"
        },{
            title:'卫星混合',
            icon:"/map/maptype/satellitepoi.png"
        },{
            title:'地形',
            icon:"/map/maptype/terrain.png"
        },{
            title:'地形混合',
            icon:"/map/maptype/terrainpoi.png"
        }
    ],
    // 像素点
    'poi':'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
}
// 控制
const Control = {
    zoom:{
        position:'',
        zoomInText: "+",
        zoomInTitle: "放大",
        zoomOutText: "-",
        zoomOutTitle: "缩小"
    },
    copyright:{
        tilepane:["vec", "cva", "ter", "cta", "img", "cia"],
        x:["米","公里"],
        y:["英里","英尺"],
        sources:'数据来源：国家地理信息公共服务平台'
    }
}
// 计算瓦片
const calcTile = ({lat,lng,zoom})=>{
    const size = 256; // 瓦片大小
    const scale = 1 << zoom; // 2 的 zoom 次方
    // 将经纬度转换为 Web Mercator 投影坐标
    const wx = (lng + 180) / 360 * scale * size;
    const wy = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale * size;
    // 计算瓦片的 x 和 y
    const tx = Math.floor(wx / size);
    const ty = Math.floor(wy / size);

    return { x: tx, y: ty, z: zoom };
}
// 加载瓦片
const loadTile = ({x,y,z,s=0})=>{
    const tileTemp = `https://t${s}.tianditu.gov.cn/DataServer?T=vec_w&x=${x}&y=${y}&l=${z}&tk=`;
    const image = new Image();image.src = tileTemp;
    image.onload = ()=>{
        return image;
    }
}
// click dblclick mousedown mouseup mouseover mouseout mousemove contextmenu keypress
const vv = {
    R: 6378137,
    Ee: 6356752.314245179,
    bounds: [[-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]],
    nq: function(t) {
        var i = Math.PI / 180
          , n = this.R
          , e = t.lat * i
          , o = this.Ee / n
          , s = Math.sqrt(1 - o * o)
          , r = s * Math.sin(e)
          , h = Math.tan(Math.PI / 4 - e / 2) / Math.pow((1 - r) / (1 + r), s / 2);
        return e = -n * Math.log(Math.max(h, 1e-10)),
        new T.Point(t.lng * i * n,e)
    },
    _q: function(t) {
        for (var i, n = 180 / Math.PI, e = this.R, o = this.Ee / e, s = Math.sqrt(1 - o * o), r = Math.exp(-t.y / e), h = Math.PI / 2 - 2 * Math.atan(r), a = 0, u = .1; a < 15 && Math.abs(u) > 1e-7; a++)
            i = s * Math.sin(h),
            i = Math.pow((1 - i) / (1 + i), s / 2),
            u = Math.PI / 2 - 2 * Math.atan(r * i) - h,
            h += u;
        return new T.dq(h * n,t.x * n / e)
    }
}
const ss = {
    r:6378137,
    qw:85.0511287798,
    scale: function(t) {
        return Math.pow(2, t)
    },
    zoom: function(t) {
        return Math.log(t) / Math.LN2
    },
    distance: function(t, i) {
        var n = i.lng - t.lng
        , e = i.lat - t.lat;
        return Math.sqrt(n * n + e * e)
    },
    bounds:function(t){
        var t = 6378137 * Math.PI;
        return T.cQ([-t, -t], [t, t])
    },
    _q:function(t){
        var i = 180 / Math.PI;
        // return new T.dq((2 * Math.atan(Math.exp(t.y / this.R)) - Math.PI / 2) * i,t.x * i / this.R)
    },
    nq: function(t){
        let i = Math.PI*t/180,n = this.qw,e = Math.max(Math.min(n, t.lat), -n), o = Math.sin(e * i);
        // return new T.Point(this.R * t.lng * i,this.R * Math.log((1 + o) / (1 - o)) / 2)
    }
}
// 瓦片图层
const TileLayer = {
    service: "WMS",
    request: "GetMap",
    version: "1.1.1",
    format: "image/jpeg",
    initialize: function(t,i) {},
    getTileUrl: function(t) {
        var i = this.tR(t)
              , n = this.kR.nq(i.Zq())
              , e = this.kR.nq(i.cq())
              , o = (this.LR >= 1.3 && this.kR === T.gq.uW ? [e.y, n.x, n.y, e.x] : [n.x, e.y, e.x, n.y]).join(",")
              , s = T.TileLayer.prototype.getTileUrl.call(this, t);
            return s + T.S.K(this.KR, s, this.options.jR) + (this.options.jR ? "&BBOX=" : "&bbox=") + o
    },
    setParams: function(t) {
      
    }
}
// 事件分发
const event = {
  on: (name, fn) => {
    console.log(name, fn);
  },
  off: (name, fn) => {
    console.log(name, fn);
  },
  emit: (name, data) => {}
}
const IPLocation = `https://location.tianditu.gov.cn/data/getCityName`
const useDOM = (name, object = "") => {};

// 地图初始化完成
const onReady = (map, event, fn) => {
  // 把事件分发器挂载到地图上
  console.log("onReady", map, event, fn);
};
// 初始化地图
const initMap = (dom,draft) => {
  let {clientHeight,clientWidth} = dom;
  let isDragging = false;let startX, startY;
  let map = {
    
  }
  console.dir(dom);
  // 创建DIV 
  let div = document.createElement("div"),canvas = document.createElement("canvas");
  canvas.width = clientWidth;canvas.height = clientHeight;
  let ctx = canvas.getContext("2d");
  console.log("initMap", draft);
  // 设置地图容器
  div.appendChild(canvas);
  document.body.appendChild(div);
  // 设置地图容器
  map.container = div;
  map.canvas = canvas;
  map.ctx = ctx;
  div.appendChild(canvas);dom.appendChild(div);
  // 处理贴图
  let {x,y,z} = calcTile({lat:23.129110,lng:113.324520,zoom:12});
  let image = loadTile({x,y,z,s:0});
  console.log(image);
  // 触摸事件处理
  const startDrag = (x,y) => {
    console.log("startDrag",x,y);
    isDragging = true;
    startX = x;
    startY = y;
  }
  const moveDrag = (x,y) => {
    if (!isDragging) return;
    const dx = x - startX;
    const dy = y - startY;
    //
    //
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    startX = x;startY = y;
  }
  const endDrag = (x,y) => {
    isDragging = false;
  }
  canvas.ontouchstart = ({touches:[{clientX,clientY}]}) => startDrag(clientX,clientY);
  canvas.onmousedown = ({clientX, clientY}) => startDrag(clientX,clientY);
  canvas.ontouchmove = ({touches:[{clientX,clientY}]}) => moveDrag(clientX,clientY);
  canvas.onmousemove = ({clientX, clientY}) => moveDrag(clientX,clientY);
  canvas.ontouchend = ({touches:[{clientX,clientY}]}) => endDrag(clientX,clientY);
  canvas.onmouseup = ({clientX, clientY}) => endDrag(clientX,clientY);
  return map;
}
export default function (element) {
  let draft = {
    selector: "#map",
    apikey: "",
    version: "",
    plugins: [],
  };
  const dpr = window.devicePixelRatio;
  let dom = document.querySelector(draft.selector);
  if(!dom){
    return console.error("地图容器不存在");
  }
  dom.innerHTML = "";
  const map = initMap(dom,draft)

  //
  return {
    version: "1.0.0",
    onready: (fn) => onReady(map, event, fn),
    // 设置地图中心点 Center
    // 设置地图缩放级别 Zoom
    // 设置地图水平面上的旋转角度 Rotation
    // 设置地图俯仰角 Pitch
    // 设置地图显示比例 Scale
    // 设置地图与容器偏移量 Offset
    // 设置地图鼠标样式 CursorStyle
    // 设置地图是否支持拖拽 Draggable
    // 设置地图是否支持滚轮缩放 Scrollable
    // 设置地图最大缩放级别 MaxZoom 3～20
    // 设置地图最小缩放级别 MinZoom 3～20
    // 设置地图限制边界 Boundary
    // 将地图中心平滑移动到指定的经纬度坐标 panTo
  };
}
