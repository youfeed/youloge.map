const ENV_APIKEY = ''
// 缓存瓦片
const cacheTile = (()=>{
    const pool = new Map();
    return (key,value=null)=>{
        value && pool.set(key,value);
        return pool.has(key) ? pool.get(key) : null;
    };
})();
// 地址类: tiandi google tencent amap baidu
const wmtsrc = (map)=>{
    let apikey = map.apikey;
    return {
        'tiandi':({x,y,z,style='img_w'})=>{
            let [layer,set] = style.split('_');
            let host = `https://t0.tianditu.gov.cn/${s}/wmts`;
            return `${host}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=${set}&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${apikey}`
        },
        'google':({x,y,z,style='s'})=>{
            let host = `https://mt1.google.com/vt`
            return `${host}?lyrs=${style}&x=${x}&y=${y}&z=${z}`;
        },
        'amap':({x,y,z,style='s',size=1,scale=1})=>{
            let host = `https://webrd01.is.autonavi.com/appmaptile`;
            return `${host}?lang=zh_cn&size=${size}&scale=${scale}&style=${style}&x=${x}&y=${y}&z=${z}`;
        },
        'tencent':()=>{

        },
        'baidu':()=>{
            
        }
    }
}
// 图片类
const image = (map)=>{
    let apikey = map.apikey;
    // 占位图
    const placeholder = ()=>{
        const div = document.createElement('div');
        div.style.width = '256px'; // 瓦片大小
        div.style.height = '256px';
        div.style.backgroundColor = '#ccc'; // 灰色占位图
        div.innerText = 'Loading...'; // 可选的加载文本
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        return div;
    }
    // 监听图
    const observer = (origin,target,opt={})=>{
        const io = new IntersectionObserver((entries)=>{
            entries.forEach(entry=>{
                if(entry.isIntersecting && entry.target == origin){
                    io.unobserve(entry.target);
                    entry.target.src = entry.target.dataset.src;
                    ele.replaceWith(img); // 替换占位符
                    // 反向监听
                    observer(target,origin,opt)
                }
                // 清空监听
            })
        })
        return io;
    }
    const key = ({x,y,z,type,style}=obj)=>{
        return `${type}_${style}_${x}_${y}_${z}`;
    }
    const cache = ({x,y,z,type,style}=obj)=>{
        let cache = cacheTile;
        let k = key({x,y,z,type,style});
        return cache(k);
    }
    const element = ({x,y,z,type,style}=obj)=>{
        let k = key({x,y,z,type,style});
        let img = cache(k);
        let src = wmtsrc(map)['tiandi']({x,y,z,type,style});
        if(!img){
            img = document.createElement('img');
            img.dataset.src = src;cache(key,img);
        }
        const placeholder = createPlaceholder(); // 创建占位符
        placeholder.dataset.src = src;
        observer(placeholder,img);
        return placeholder;
    }
    return {element,cache,key}
};
// 瓦片类
const title = (map)=>{
    const Images = image(map);
    const left = ({x,y,z}=obj)=>{
        return {x:x-1,y:y,z:z,Images:Images};
    }
    const right = ({x,y,z}=obj)=>{
        return {x:x+1,y:y,z:z,Images:Images};
    }
    const top = ({x,y,z}=obj)=>{
        return {x:x,y:y-1,z:z,Images:Images};
    }
    const bottom = ({x,y,z}=obj)=>{
        return {x:x,y:y+1,z:z,Images:Images};
    }
    return { left,right,top,bottom };
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
        const tileX = Math.floor((x + 20037508.34) / (256 / scale));
        const tileY = Math.floor((20037508.34 - y) / (256 / scale));
        return { x:tileX, y:tileY,z:zoom };
    }
    return { mer,geo,tile };
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
    let stage = document.createElement("div");
    map.container = container;map.stage = stage;
    // stage.style.cssText = "position:relative;overflow:hidden;";
    // const resizeObserver = new ResizeObserver(entries => entries.forEach(entrie=>onResize(map,entrie)));resizeObserver.observe(div);
    mouseTouch(map); // 绑定鼠标触摸事件
    // 加载瓦片
    // 调试函数
    let Points = point(map);
    let Titles = title(map);
    let Images = image(map);
    
    console.log(Points,Titles);
    // 调试函数
    container.appendChild(stage);
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
    container.innerHTML = "";container.style.position = "relative";container.style.outline = "none";
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