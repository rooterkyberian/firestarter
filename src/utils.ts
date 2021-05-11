export function arrayAsString(arr: Array<any>): string {
  return arr
    .map((e) =>
      typeof e === "object" ? JSON.stringify(e, toPlain) : String(e)
    )
    .join(" ");
}

function toPlain(key, value) {
  if (typeof value === "object" && value instanceof Set) {
    return Array.from(value);
  }
  return value;
}

const commonKeyEventData = {
  altKey: false,
  bubbles: true,
  cancelBubble: false,
  cancelable: true,
  charCode: 0,
  composed: true,
  ctrlKey: false,
  currentTarget: null,
  defaultPrevented: true,
  detail: 0,
  eventPhase: 0,
};

export function press(
  { keyCode, charCode, key }: Partial<KeyboardEvent>,
  evtTarget = null
) {
  if (!evtTarget) {
    evtTarget = document.getElementsByTagName("body")[0];
  }
  const evtData = { ...commonKeyEventData, keyCode, charCode, key };
  evtTarget.dispatchEvent(new KeyboardEvent("keydown", evtData));
  evtTarget.dispatchEvent(new KeyboardEvent("keyup", evtData));
}

export function addGlobalStyle(css) {
  var head, style;
  head = document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }
  style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = css;
  head.appendChild(style);
}
