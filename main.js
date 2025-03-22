import MAP from "./lib/main.js";

document.querySelector("#app").innerHTML = `
  <div>
    <h1>瓦片地图调试</h1>
    <div id="map" style="max-width: 800px;aspect-ratio: 16 / 9;border: 1px solid #000;margin: 0 auto;"></div>
    <p class="read-the-docs">
      @micateam
      <button id="Get_Center">Get Center</button>
    </p>
  </div>
`;

let map = MAP({
  selector: "#map",
  apikey:''
});
map.onready = () => {
  console.log('onready:map');
}
console.log(map);
document.querySelector("#Get_Center").onclick = () => {
  console.log(map.center());
};