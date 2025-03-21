import MAP from "./lib/main.js";

document.querySelector("#app").innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div id="map" style="width: 640px; height: 480px;border: 1px solid #000;">
      <button id="counter" type="button">map</button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`;
// document.querySelector("#map")
let map = MAP({
  selector: "#map",
});
console.log(map);
