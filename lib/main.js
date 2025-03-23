const IPLocation = `https://location.tianditu.gov.cn/data/getCityName`
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
    // 天地图
    'tiandi': {
        
    }, 
    // 谷歌地图
    'google': {
        '4326': 'EPSG:4326',
        LowerCorner: [-20037508.3427892, -20037508.3427892],
        UpperCorner: [20037508.3427892, 20037508.3427892],
        center:0,
        zoom:12,
        minZoom:3,
        maxZoom:18,
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
const emitBus = (() => {
    const events = {};
    return {
        // 注册事件监听器
        on: (event, listener) => {
            if (!events[event]) {
                events[event] = [];
            }
            events[event].push(listener);
        },

        // 移除事件监听器
        off: (event, listener) => {
            if (!events[event]) return;
            events[event] = events[event].filter(l => l !== listener);
        },

        // 触发事件
        emit: (event, args={}) => {
            if (!events[event]) return;
            events[event].forEach(listener => {
                console.log('listener',listener)
                listener(args);
            });
        }
    };
})();
// 缓存瓦片
const cacheTile = (()=>{
    const pool = new Map();
    return (key,value=null)=>{
        value && pool.set(key,value);
        return pool.has(key) ? pool.get(key) : null;
    };
})();
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
        return e = -n * Math.log(Math.max(h, 1e-10)),new T.Point(t.lng * i * n,e)
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
// 坐标转换方法：WGS 84
const point = (map) => {
    let R = 6378137; // 地球半径，单位米
    let E = 6356752.314245179; // 地球极半径
    let B = [[-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]]; // 边界框
    let H = 0.00669342162296594323; // 偏心率平方
    let U = 0.00673949674227647014; // 偏心率的倒数平方

    // 将地理坐标转换为投影坐标
    const mer = ({ lat, lng }) => {
        const i = Math.PI / 180;
        const n = R;
        const e = lat * i;
        const o = E / n;
        const s = Math.sqrt(1 - o * o);
        const r = s * Math.sin(e);
        const h = Math.tan(Math.PI / 4 - e / 2) / Math.pow((1 - r) / (1 + r), s / 2);
        const y = -n * Math.log(Math.max(h, 1e-10));
        const x = lng * i * n;
        return { x, y };
    }

    // 将投影坐标转换为地理坐标
    const geo = ({ x, y }) => {
        const lng = (x / R) * 180 / Math.PI;
        const lat = (Math.atan(Math.exp(y / R)) * 360 / Math.PI) - 90;
        return { lat, lng };
    }

    return {
        mer,
        geo
    }
}
// 生成前缀
const genPrefix = ()=>{
    let current = 0,list = [0,1,2,3,4,5,6,7];
    return ()=>{
        let shift = list.shift();
        list.push(shift);
        return shift;
    };
}


// 鼠标坐标
const mouseLocation = (map,clientX,clientY) => {
    const { canvas, tileSize, zoom, center } = map;
    const rect = canvas.getBoundingClientRect();
    const scale = 1 << zoom; // 2 的 zoom 次方
    // 计算鼠标在画布上的相对位置
    const x = clientX - rect.left - canvas.width / 2;
    const y = clientY - rect.top - canvas.height / 2;
    // 将画布坐标转换为地图坐标
    const lng = center.lng + (x / tileSize) * 360 / scale;
    const lat = center.lat - (y / tileSize) * 360 / scale;
    return { lng, lat };
}
// 尺寸变化
const onResize = (map,{contentRect}) => {
    let {width, height} = contentRect,{canvas,magnifier} = map;
    canvas.width = width * magnifier >> 0;canvas.height = height * magnifier >> 0;
    map.gridHorizontal = Math.ceil(width / 256 / 2);
    map.gridVertical = Math.ceil(height / 256 / 2);
    // 重新计算一下瓦片宫格
    emitBus.emit("title:calc");
    emitBus.emit("title:load",'vec_w');
    setTimeout(()=>emitBus.emit("title:load",'cva_w'),100);
    console.log("onResize",map.gridHorizontal,map.gridVertical);
};
// 计算瓦片
const calcTile = (map,visibled=true)=>{
    let {tileSize,zoom,gridHorizontal,gridVertical,center:{lat,lng}} = map;
    const scale = 1 << zoom; // 2 的 zoom 次方
    // 将经纬度转换为 Web Mercator 投影坐标
    const wx = (lng + 180) / 360 * scale * tileSize;
    const wy = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale * tileSize;
    // 计算中心点的瓦片坐标
    const cx = Math.floor(wx / tileSize);
    const cy = Math.floor(wy / tileSize);
    // 生成瓦片坐标
    const tileGroup = [];
    for (let i = -gridHorizontal; i <= gridHorizontal; i++) {
        for (let j = -gridVertical; j <= gridVertical; j++) {
            const tileX = cx + i;
            const tileY = cy + j;
            tileGroup.push({i,j, x: tileX, y: tileY, z: zoom });
        }
    }
    // 
    map.cx = cx;map.cy = cy;map.tileGroup = tileGroup;
    console.log('tileGroup',tileGroup,gridHorizontal);
    return tileGroup;
}
// 加载瓦片 https://m0.map.gtimg.com/hwap?z=10&x=1711&y=1205&styleid=1000&scene=0&version=1836
const loadTile = (map,layers='vec_w')=>{
    let {apikey,canvas,ctx,tileSize,tileGroup,offsetX,offsetY} = map;
    let tileCache = cacheTile;
    let idPrefix = genPrefix();
    // 创建离屏画布
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    // 清空离屏画布
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    // 遍历瓦片坐标
    tileGroup.forEach(item=>{
        let {i,j,x,y,z} = item,id = idPrefix();
        let key = `${layers}_${x}_${y}_${z}`;
        let [LAYER,TILEMATRIXSET] = layers.split('_');
        let image = tileCache(key);
        if(image){
            offscreenCtx.drawImage(image, 
                (i * tileSize) + offsetX + (map.gridHorizontal * tileSize / 2),
                (j * tileSize) + offsetY + (map.gridVertical * tileSize / 2), 
            tileSize, tileSize);
            ctx.drawImage(offscreenCanvas, 0, 0);
        }else{
            const tileTemp = `https://t${id}.tianditu.gov.cn/${layers}/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${LAYER}&STYLE=default&TILEMATRIXSET=${TILEMATRIXSET}&FORMAT=tiles&tk=${apikey}&TILECOL=${x}&TILEROW=${y}&TILEMATRIX=${z}`;
            // const tileTemp = `https://t${id}.tianditu.gov.cn/DataServer?T=${layers}&x=${x}&y=${y}&l=${z}&tk=${apikey}`;
            const image = new Image();image.src = tileTemp,image.count = 0;
            image.onload = ()=>{
                offscreenCtx.drawImage(image, 
                    (i * tileSize) + offsetX + (map.gridHorizontal * tileSize / 2),
                    (j * tileSize) + offsetY + (map.gridVertical * tileSize / 2), 
                tileSize, tileSize);
                tileCache(key,image);
                ctx.drawImage(offscreenCanvas, 0, 0);
            }
            image.onerror = ()=>{
                ++image.count < 3 && (image.src = tileTemp);
            }
            
        }
        // 初始绘制
        ctx.drawImage(offscreenCanvas, 0, 0);
    })
}
// 地图初始化完成
const onReady = (map, event, fn) => {
  // 把事件分发器挂载到地图上
  console.log("onReady", map, event, fn);
};
// 初始化地图
const initMap = (container,{apikey}) => {
    let map = {
        apikey:apikey,
        dpr: 1,magnifier:1.5,tileSize:256,
        gridHorizontal:1,gridVertical:1,
        offsetX:0,offsetY:0,
        cx:0,cy:0,zoom:12,
        minZoom:3,maxZoom:18,
        center:{lng:116.40769,lat:39.89945},
    },dpr = window.devicePixelRatio || 1;
    let {clientHeight,clientWidth} = container;
    let isDragging = false;let startX, startY;
    // 创建DIV 
    let div = document.createElement("div"),canvas = document.createElement("canvas"),ctx = canvas.getContext("2d");
    // 立即绑定
    map.container = container;map.div = div;map.canvas = canvas;map.ctx = ctx;map.dpr = dpr;
    div.style.cssText = "width:100%;height:100%;position:relative;overflow:hidden;";
    canvas.style.cssText = "position:absolute;top:50%;left:50%;transform: translate(-50%, -50%);border:1px solid red";
    canvas.width = clientWidth;canvas.height = clientHeight;
    // 视口监听
    const resizeObserver = new ResizeObserver(entries => entries.forEach(entrie=>onResize(map,entrie)));
    resizeObserver.observe(div);
    // 设置地图容器
    div.appendChild(canvas);container.appendChild(div);
    // 触摸事件处理
    const startDrag = (x,y) => {
        let moLocation = mouseLocation(map,x,y);
        console.log("startDrag",moLocation,x,y);
        isDragging = true;
        startX = x;
        startY = y;
        // 在 window 上添加 mouseup 事件监听器
        window.addEventListener('mouseup', onMouseUp);
    }
    const onMouseUp = (event) => {
        endDrag(event.clientX, event.clientY);
        // 移除 window 上的 mouseup 事件监听器
        window.removeEventListener('mouseup', onMouseUp);
    }
    const moveDrag = (x,y) => {
        if (!isDragging) return;
        const dx = x - startX;
        const dy = y - startY;
        // console.log("moveDrag",x,y,dx,dy,startX,startY);  
        // 使用 CSS transform 移动 canvas
        canvas.style.transform = `translate(-50%, -50%) translate3d(${dx}px, ${dy}px,0)`;
        //
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        // startX = x;startY = y;
    }
    const endDrag = (x,y) => {
        isDragging = false;
        const dx = x - startX;
        const dy = y - startY;
        // 更新当前偏移量
        map.offsetX += dx;
        map.offsetY += dy;
        // 计算经纬度偏移量
        const scale = 1 << map.zoom; // 2 的 zoom 次方
        const lngOffset = (map.offsetX * 360) / (scale * map.tileSize);
        const latOffset = (map.offsetY * 360) / (scale * map.tileSize);
        // 更新中心点坐标
        map.center.lng -= lngOffset;
        map.center.lat += latOffset;
        // 重置偏移量
        map.offsetX = 0;
        map.offsetY = 0;
        // 重置 transform
        canvas.style.transform = "translate(-50%, -50%) translate3d(0, 0, 0)";
        // 重载瓦片
        emitBus.emit("title:calc");
        emitBus.emit("title:load",'vec_w');
        setTimeout(()=>emitBus.emit("title:load",'cva_w'),100);
        // loadTile(map,'vec_w');
    }
    canvas.ontouchstart = ({touches:[{clientX,clientY}]}) => startDrag(clientX,clientY);
    canvas.onmousedown = ({clientX, clientY}) => startDrag(clientX,clientY);
    canvas.ontouchmove = ({touches:[{clientX,clientY}]}) => moveDrag(clientX,clientY);
    canvas.onmousemove = ({clientX, clientY}) => moveDrag(clientX,clientY);
    canvas.ontouchend = ({touches:[{clientX,clientY}]}) => endDrag(clientX,clientY);
    canvas.onmouseup = ({clientX, clientY}) => endDrag(clientX,clientY);
    canvas.onwheel = (e) => {
        e.preventDefault();
        let {zoom,minZoom, maxZoom} = map;
        if (e.deltaY < 0) {
            map.zoom = Math.min(zoom + 1, maxZoom); // 放大
        } else {
            map.zoom = Math.max(zoom - 1, minZoom); // 缩小
        }
        console.log("onwheel",map.zoom);
        // 
         // 重载瓦片
         emitBus.emit("title:calc");
         emitBus.emit("title:load",'vec_w');
         setTimeout(()=>emitBus.emit("title:load",'cva_w'),100);
        // 
    }
    // 
    return map;
}
export default function ({selector,apikey}) {
    let draft = {
        selector: "#map",
        apikey: apikey,
        version: "",
        plugins: [],
    };
    let dom = document.querySelector(draft.selector);
    if(!dom){
        return console.error("地图容器不存在");
    }
    dom.innerHTML = "";
    const map = initMap(dom,draft);
    // 事件绑定
    emitBus.on("title:calc",()=>calcTile(map));
    emitBus.on("title:load",(layer)=>loadTile(map,layer));
    //
    return {
        version: "1.0.0",
        onready: (fn) => {
            emitBus.on("map:ready",()=>fn);
            emitBus.emit("map:ready");
        },
        // 地图中心点 Center
        center:({lat,lng}={})=>{
            if(lat == undefined || lng == undefined){
                return map.center;
            }
            map.center = {lat,lng};
        },
        // 地图缩放级别 Zoom
        zoom:(val)=>{
            if(val){
                return map.zoom = val;
            }
            return map.zoom;
        },
        // 地图鼠标样式 CursorStyle
        cursor:(val)=>{
            if(val){
                return map.cursor = val;
            }
            return map.cursor;
        },
        // 地图限制边界 Boundary
        boundary:(val)=>{
            if(val){
                return map.bound = val;
            }
            return map.bound;
        }
        // 设置地图水平面上的旋转角度 Rotation
        // 设置地图俯仰角 Pitch
        // 设置地图显示比例 Scale
        // 设置地图与容器偏移量 Offset
        // 设置地图是否支持拖拽 Draggable
        // 设置地图是否支持滚轮缩放 Scrollable
        // 设置地图最大缩放级别 MaxZoom 3～20
        // 设置地图最小缩放级别 MinZoom 3～20
        // 将地图中心平滑移动到指定的经纬度坐标 panTo
    };
}