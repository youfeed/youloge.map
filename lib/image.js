/**
 * 类层级关系
 * 一个地图有N个 图层Layer
 * 一个图层至少有一个 宫格 table
 * 一个宫格 有N个瓦片 title
 * 一个瓦片包含一个图片 image
 **/
// 缓存瓦片
const cacheTile = (()=>{
    const pool = new Map();
    return (key,value=null)=>{
        value && pool.set(key,value);
        return pool.has(key) ? pool.get(key) : null;
    };
})();
// 本地地图瓦片
const Loctile = (()=>{
    const render =  ({width=256,height=256,color='#FFFFFF'})=>{
        const canvas = document.createElement("canvas"),ctx = canvas.getContext("2d");
        canvas.width = width;canvas.height = height;
        ctx.fillStyle = color;ctx.fillRect(0, 0, width, height);
        return new Promise((resolve) => {
            canvas.toBlob((blob)=>{
                let url = URL.createObjectURL(blob);
                resolve(url);
            },"image/png");
        })
    }
    const W256 = render({width:256,height:256,color:'#FFFFFF'});
    const B256 = render({width:256,height:256,color:'#000000'});
    return { 'W256':W256,B256:B256 }
})()
// 网络地图瓦片服务类: tiandi google tencent amap baidu
const Webtile = (map)=>{
    let {apikey} = map;
    let itype = '';let istyle = '';
    const tiandi = ({x,y,z})=>{
        let [layer,set] = istyle.split('_');
        let host = `https://t0.tianditu.gov.cn/${istyle}/wmts`;
        return `${host}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=${set}&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${apikey}`
    }
    const google = ({x,y,z})=>{
        let host = `https://mt1.google.com/vt`
        return `${host}?lyrs=${istyle}&x=${x}&y=${y}&z=${z}`;
    }
    const amap = ({x,y,z})=>{
        let host = `https://webrd01.is.autonavi.com/appmaptile`;
        return `${host}?lang=zh_cn&size=1&scale=1&style=${istyle}&x=${x}&y=${y}&z=${z}`;
    }
    // wgs84 gcj02
    return ({type,style})=>{
        itype = type,istyle = style;
        return {tiandi,google,amap}
    }
}
/**
 *  监听地图瓦片：进入可视展示区域 离开可视区域
 *  当进入区域还要判断 它的周边是否有瓦片
 *  @param {HTMLElement} element
 *  @param {HTMLElement} origin
 *  @param {Object} opt
 *  @param {Function} opt.onenter
 *  @param {Function} opt.onexit
 *  @param {Function} opt.onchange
 **/
const Obstile = (element)=>{
    const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                let {lazy,blob} = entry.target.dataset;
                entry.target.src = lazy;
                // 1. 当前原始可视 则它的上下左右必须有瓦片
                // 2. 周边瓦片再走一遍是否可视
                // 3. 
                // Observer(target,origin,opt)
            }
            // 清空监听
        })
    });
    element.onload = ()=>{
        io.observe(element);
    }
}
// 图片类
const image = (map)=>{
    const {Points,Titles} = map;
    const images = new Map();
    // ${type}_${style}_${x}_${y}_${z}
    const get = (name)=>{
        return images.has(name)? images.get(name) : null;
    }
    // 需要实现 宫格挂载 可视监听
    const render = ({name,src})=>{
        if(images.has(name)) return images.get(name);
        let img = document.createElement('img');
        Loctile.B256.then(blob=>{
            img.src = blob
            img.dataset.blob = blob;
        });// 创建图片
        img.dataset.lazy = src;
        img.style.opacity = 1;
        img.style.width = '256px';
        img.style.height = '256px';
        // img.style.transform = `translate3d(${Points[name].x}px, ${Points[name].y}px, 0px)`;
        images.set(name,img);
        // width: 256px; height: 256px; transform: translate3d(-2576px, 783px, 0px); opacity: 1;
        return img;
    }
    return {get,render}
};
// 瓦片类：可以指向上下左右 还可以返回一圈瓦片9个
const title = (map)=>{
    const {Images} = map;
    const render = ({x,y,z})=>{
        const clone = Object.assign({}, {x,y,z}); // 深拷贝
        const left = ()=>(--clone.y,render(clone)) // 左
        const right = ()=>(++clone.x,render(clone)) // 右
        const top = ()=>(--clone.y,render(clone)) // 上
        const bottom = ()=>(++clone.y,render(clone)) // 下
        return {x,y,z,left,right,top,bottom};
    }
    return (obj)=>render(obj)
}
// 坐标类：WGS84
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
    // 计算瓦片坐标
    const tile = ({ lat, lng, zoom }) => {
        const { x, y } = mer({ lat, lng });
        const scale = 1 << zoom; // 2 的 zoom 次方
        const tileX = Math.floor((x + 20037508.34) / (256 * scale));
        const tileY = Math.floor((20037508.34 - y) / (256 * scale));
        // 计算像素位置
        const pixelX = Math.floor((x + 20037508.34) % 256);
        const pixelY = Math.floor((20037508.34 - y) % 256);
        return { x:tileX, y:tileY,z:zoom,px:pixelX,py:pixelY };
    }
    // 计算像素坐标
    const pixel = ({ x, y, zoom }) => {
        
    }
    return { mer,geo,tile };
}
// 图层类
const layer = (map)=>{
    const { stage,center, zoom, tileSize } = map;
    const layers = new Map();
    const get = (name)=>{
        return layers.has(name) && layers.get(name);
    }
    const show = (name)=>{
        get(name) && (get(name).style.display = 'block');
    }
    const hide = (name)=>{
        get(name) && (get(name).style.display = 'none');
    }
    const render = ({name='',index=1,width='100%',height="100%"})=>{
        if(layers.has(name)) return get(name); 
        let div = document.createElement('div');
        div.name = name;div.style.width = width;
        div.style.height = height;
        div.style.zIndex = index;
        stage.appendChild(div);
        layers.set(name,div);
        return div;
    }
    return { get,show,hide,render }
}
// 宫格类: 包含N个title对象 
const table = (map)=>{
    const { stage,center, zoom, Layers,Titles,Images,Points } = map;
    const tables = new Map();
    const get = (name)=>{
        return tables.has(name) && tables.get(name);
    }
    const render = ({layer,name,row=3,col=3})=>{
        if(tables.has(name)) return get(name); 
        let tableLayer = Layers.get(layer);
        // tableLayer.
    }
    return { get,render }
    // const col = [];const row = [];
    // // 计算可视区域内的瓦片坐标
    // const tileCenter = Points.tile({ lat: center.lat, lng: center.lng, zoom});
    // center.x = tileCenter.x;
    // center.y = tileCenter.y;
    // // 计算瓦片中心点
    // tileCenter.type = 'tiandi';
    // tileCenter.style = 'img_w';
    // const imageCenter = Images.element(tileCenter);
    // //  
    // const tile = Titles(tileCenter);
    // console.log(tile,tile.left());
    // console.log(map,tileCenter,imageCenter);
    // stage.appendChild(imageCenter);
    // return {};
}
// 鼠标触摸
const mouseTouch = ({container,stage,dragging,center,startX,startY,offsetX,offsetY}) => {
    const onMouseUp = (event) => {
        onOver(event.clientX, event.clientY); 
        window.removeEventListener('mouseup', onMouseUp);
    }
    // Multi-touch point
    const onStart = (x,y) => {
        dragging = true;startX = x;startY = y;
        window.addEventListener('mouseup', onMouseUp);
        console.log(x,y,offsetX,offsetY,stage);
    }
    const onMove = (x,y,multiTouch=[])=>{
        // console.log(x,y);
        // 按下状态
        // 按下状态
        if (!dragging) return;
        const dx = x - startX;
        const dy = y - startY;
        stage.style.transform = `translate3d(${offsetX + dx}px, ${offsetY + dy}px, 0px)`;
        console.log(offsetX + dx,offsetY + dy);
    }
    const onOver = (x,y)=>{
        dragging = false;
        const dx = x - startX;
        const dy = y - startY;
        // 更新当前偏移量
        offsetX += dx;
        offsetY += dy;
        // 计算经纬度偏移量
        const scale = 1 << map.zoom; // 2 的 zoom 次方
        const lngOffset = (map.offsetX * 360) / (scale * map.tileSize);
        const latOffset = (map.offsetY * 360) / (scale * map.tileSize);
        // 更新中心点坐标
        center.lng -= lngOffset;
        center.lat += latOffset;
    }
    //
    container.onmousedown = ({clientX, clientY}) => onStart(clientX,clientY);
    container.ontouchstart = ({touches:[{clientX,clientY}]}) => onStart(clientX,clientY);
    //
    container.onmousemove = ({clientX, clientY}) => onMove(clientX,clientY);
    container.ontouchmove = ({touches:[{clientX,clientY},...multiTouch]}) => onMove(clientX,clientY,multiTouch);
    //
    container.onmouseup = ({clientX, clientY}) => onOver(clientX,clientY);
    container.ontouchend = ({touches:[{clientX,clientY}]}) => onOver(clientX,clientY);
}
// 初始化地图
const initMap = (container,{apikey}=obj) => {
    console.log(apikey);
    let dpr = window.devicePixelRatio || 1; // 获取设备像素比
    let map = {
        apikey:apikey,
        dpr: dpr,magnifier:1.5,tileSize:256,
        gridHorizontal:1,gridVertical:1,
        
        cx:0,cy:0,zoom:12,
        minZoom:3,maxZoom:18,
        center:{lng:116.40769,lat:39.89945},
        // 鼠标触摸
        dragging:false,startX:0,startY:0,offsetX:0,offsetY:0,
    };
    let {clientHeight,clientWidth} = container; // 获取容器宽高
    let root = document.createElement("div");
    root.title = 'root';
    root.style.cssText = "position:relative;left:0;top:0;width:100%;height:100%;overflow:hidden;"; // 设置样式
    let stage = document.createElement("div");
    stage.title = "stage"
    stage.style.cssText = "position:relative;left:0;top:0;width:100%;height:100%;overflow:hidden;"; // 设置样式
    map.container = container;map.stage = stage;
    root.appendChild(stage);container.appendChild(root);
    // stage.style.cssText = "position:relative;overflow:hidden;";
    // const resizeObserver = new ResizeObserver(entries => entries.forEach(entrie=>onResize(map,entrie)));resizeObserver.observe(div);
    mouseTouch(map); // 绑定鼠标触摸事件
    // 挂载插件
    map.Points = point(map);
    map.Titles = title(map);
    map.Images = image(map);
    map.Tables = table(map);
    map.Layers = layer(map);
    map.Webtiles = Webtile(map);
    
    // 开始绘制
    // 1. 创建图层 
    const tileLayer = map.Layers.render({name:'tile_mca',index:20});
    // 2. 计算中心的瓦片坐标
    const centerTile = map.Points.tile({ lat: map.center.lat, lng: map.center.lng, zoom:map.zoom});
    // 3. 设置中心瓦片坐标
    map.center.x = centerTile.x;map.center.y = centerTile.y;
    // 4. 配置webMTS对象
    const wmts = map.Webtiles({type:'',style:'vec_w'})['tiandi'];
    const src = wmts(centerTile)
    // 5. 获取瓦片图片对象
    const imageCenter = map.Images.render({name:`xx`,src:src});
    // 5. 渲染瓦片图片 + 图片位移
    imageCenter.style.transform = `translate3d(${(clientWidth - centerTile.px) / 2}px,${(clientHeight - centerTile.py) / 2}px,0)`;
    // 6. 添加瓦片图片到图层
    tileLayer.appendChild(imageCenter);
    // 6. 监听中心瓦片
    Obstile(imageCenter);
    console.log(111,clientHeight,clientWidth,centerTile);
    
    return map;
}
export default function ({selector,apikey}) {
    let draft = {
        selector: "#map",
        apikey: apikey,
        version: "",
        plugins: [],
    };
    let container = document.querySelector(selector);
    if(!container){ return console.error("地图容器不存在"); }
    container.innerHTML = "";
    const map = initMap(container,draft);
    return {
        version:'1.0.0',
        // 地图中心点 Center
        center:({lat,lng}={})=>{
            if(lat == undefined || lng == undefined){
                return map.center;
            }
            map.center = {lat,lng};
        },
    }
}