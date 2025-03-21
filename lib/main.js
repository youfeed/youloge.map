import { version } from "vite";

const useDOM = (name, object = "") => {};
const initModule = () => {
  let div = document.createElement("div"),
    canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  console.log("initModule");
};
const onReadys = (fn) => {
  console.log("onReady", fn);
};
export default function (element) {
  let draft = {
    selector: "",
    apikey: "",
    version: "",
    plugins: [],
  };

  //
  return {
    // version: "1.0.0",
    // init: () => initModule(),
    // onready: () => onReadys(),
  };
}
