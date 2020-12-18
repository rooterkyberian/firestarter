// ==UserScript==
// @name         Tfast
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Improved tinder UI & keyboard shortcuts
// @author       You
// @match        https://tinder.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const scriptName = "Tfast";

  function allProfileImages() {
    const backgroundImageStyles = Array.from(
      document.querySelectorAll("div.recsPage div")
    )
      .map((node) => node.style["background-image"])
      .filter(Boolean);
  }

  function addGlobalStyle(css) {
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

  addGlobalStyle(`

    .profileCard {
    height: initial ! important;
    //width: initial ! important;
    }

    .profileCard__slider__backLink {
    //width: 375px ! important;
    }

    .Maw\(650px\) {
    max-width: initial ! important
    }

    .tfastBtn {
    color: green;
    background: black;
    }

    `);

  let activated = true;

  function newBtn(text) {
    let btn = document.createElement("button");
    btn.innerHTML = text;
    btn.className = "tfastBtn";
    return btn;
  }

  function revertChoice() {
    document
      .evaluate("//a[contains(., 'Back')]", document)
      .iterateNext()
      .click(); // turn off profile expand to Rewind button comes back up
    setTimeout(() => {
      document
        .evaluate("//button[contains(., 'Rewind')]", document)
        .iterateNext()
        .click();
    }, 50);
  }

  function startup() {
    let workmodeBtn = document.getElementsByClassName("workmodeBtn")[0];
    if (workmodeBtn) {
      function toggle() {
        activated = !activated;
        console.log(`${scriptName} ${activated}`);
      }

      workmodeBtn.addEventListener(
        "click",
        (event) => {
          toggle();
          event.stopPropagation(); // stop "Work mode" activation
        },
        true
      );
    }

    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "NumpadDecimal":
          location.reload();
          break;
        case "Numpad0":
          nextImg();
          break;
        case "PageDown":
          revertChoice();
          break;
        case "Insert":
          activated = !activated;
          break;
        default:
          console.log(e);
          console.log(e.code);
      }
    });
  }
  setTimeout(startup, 1000);

  const targetNode = document.getElementById("content");

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

  function press({ keyCode, charCode, key }, evtTarget) {
    if (!evtTarget) {
      evtTarget = document.getElementsByTagName("body")[0];
    }
    const evtData = { ...commonKeyEventData, keyCode, charCode, key };
    evtTarget.dispatchEvent(new KeyboardEvent("keydown", evtData));
    evtTarget.dispatchEvent(new KeyboardEvent("keyup", evtData));
  }

  // Options for the observer (which mutations to observe)
  const config = { attributes: false, childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  //
  let clickDebounce = false;

  const callback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        if (activated && !clickDebounce) {
          clickDebounce = true;
          setTimeout(function () {
            press({
              keyCode: 38,
              key: "ArrowUp",
              code: "ArrowUp",
            });
            const e = document.getElementsByClassName("recCard");
            if (e && e.length) {
              e[0].click();
            }
            clickDebounce = false;
          }, 250);
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);

  function nextImg() {
    let imgBtns = Array.from(
      document
        .querySelector(
          ".profileCard__card, *[itemtype='http://schema.org/Person']"
        )
        .querySelectorAll("*[data-cy-active]")
    );
    imgBtns = imgBtns.filter(
      (imgBtn) => imgBtns[0].parentElement === imgBtn.parentElement
    ); // filterout buttons from other sections (such as instagram)
    let previousWasActive = false;
    for (const imgBtn of [...imgBtns, ...imgBtns]) {
      if (previousWasActive) {
        imgBtn.click();
        break;
      }
      previousWasActive = imgBtn.dataset.cyActive === "true";
    }
  }
})();
