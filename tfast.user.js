// ==UserScript==
// @name         Tfast
// @namespace    https://kyberian.net/
// @version      0.2
// @description  Improved tinder UI & keyboard shortcuts
// @author       RooTer
// @match        https://tinder.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  const settings = {
    activated: true,
  };

  const scriptName = "Tfast";

  GM_config.init({
    id: `${scriptName}Config`,
    title: `${scriptName} Config`,
    fields: {
      none: {
        // without this as first item "activated" gets ignored for some reason during save
        type: "hidden",
      },
      activated: {
        label: "activated",
        type: "checkbox",
        default: true,
      },
      autoSwipeLeft: {
        label: "autoSwipeLeft",
        type: "checkbox",
        default: false,
      },

      distanaceLimit: {
        label: "distanaceLimit",
        type: "number",
        default: 60,
      },

      heightLimit: {
        label: "heightLimit",
        type: "number",
        default: 175,
      },

      intrestsBlacklist: {
        label: "Intrests blacklist",
        title: "comma seperated",
        default: "Astrology",
      },
    },

    events: {
      open: function () {
        GM_config.get("activated", settings.activated);
      },
      save: function () {
        settings.activated = GM_config.get("activated");
      },
    },
  });

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

  function expandProfile() {
    press({
      keyCode: 38,
      key: "ArrowUp",
      code: "ArrowUp",
    });
    const e = document.getElementsByClassName("recCard");
    if (e && e.length) {
      e[0].click();
    }
  }

  function swipeLeft() {
    press({ key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 });
  }

  function getDistance() {
    const match = document.body.innerHTML.match(/(\d+) kilometers away/);
    if (!match) {
      return null;
    }
    const distance = Number(match[1]);
    return distance;
  }

  function getBio() {
    const bioDiv = document.querySelector("hr:first-of-type + div");
    if (!bioDiv) return null;
    return bioDiv.innerText;
  }

  /**
   *
   * @param {string} bio
   * @returns {number}
   */
  function bioExtractHeight(bio) {
    const low = 140,
      high = 195;
    const nums = Array(...bio.matchAll(/\b(\d{3})(cm)?\b/g))
      .map((m) => m[1])
      .filter((h) => h < high && h > low);
    if (nums.length) {
      return nums[0];
    }
    return null;
  }

  /**
   * @param {string} bio
   */
  function bioGetSocial(bio) {
    const social = {
      instagram: ["ig", "instagram", "inst", "insta", "instagram.com"],
      snapchat: ["snapchat", "snap", "👻"],
      facebook: ["fb", "facebook", "facebook.com"],
    };
    const revertSocialMap = {};
    for (const [socialNetworkName, aliases] of Object.entries(social)) {
      aliases.forEach((alias) => {
        revertSocialMap[alias] = socialNetworkName;
      });
    }
    const allSocialNames = [].concat.apply([], Object.values(social));
    const re = RegExp(
      `\\b(${allSocialNames.join("|")})[:\\s@/]*([\\w.]+)(\\b|👻)`,
      "gi"
    );
    const foundSocialArr = Array(...bio.matchAll(re)).map((m) => [
      revertSocialMap[m[1].toLowerCase()],
      m[2],
    ]);
    return Object.fromEntries(foundSocialArr.reverse());
  }

  function xpathResultsToArray(xpathResult) {
    let node,
      nodes = [];
    while ((node = xpathResult.iterateNext())) nodes.push(node);
    return nodes;
  }

  function getIntrests() {
    const knownIntrests = [
      "Astrology",
      "Wine",
      "Dancing",
      "Photography",
      "Tattoos",
      "Grab a drink",
      "Soccer",
      "Sports",
      "Netflix",
      "Walking",
      "Coffee",
      "Dog lover",
      "Hiking",
      "Art",
      "Reading",
      "Tea",
      "Running",
      "Travel",
      "Foodie",
      "Music",
      "Outdoors",
      "Movies",
      "Politics",
      "Volunteering",
      "Cat lover",
    ];
    const separator = "\uFFFF";

    const concatedList = knownIntrests.join(separator) + separator;
    const profileCard = document.querySelector(".profileCard__card");
    if (!profileCard) return null;
    let intrestsParentNode;
    {
      const xpath = `.//*[text() and contains("${concatedList}", concat(text(), "${separator}"))]/..`;
      const xpathResult = document.evaluate(
        xpath,
        profileCard,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
      );
      intrestsParentNode = xpathResult.snapshotItem(
        xpathResult.snapshotLength - 1
      );
    }
    if (!intrestsParentNode) return new Set();
    let intrests = new Set(
      xpathResultsToArray(
        document.evaluate(".//text()", intrestsParentNode)
      ).map((textNode) => textNode.textContent)
    );
    return intrests;
  }

  function startup() {
    let workmodeBtn = document.getElementsByClassName("workmodeBtn")[0];
    if (workmodeBtn) {
      workmodeBtn.addEventListener(
        "click",
        (event) => {
          GM_config.open();
          event.stopPropagation(); // stop "Work mode" activation
        },
        true
      );
      console.log("Workmode overriden");
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
          settings.activated = !settings.activated;
          break;
        default:
          console.log("keydown", e);
      }
    });
  }
  setTimeout(startup, 2000);

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
  let debounceTimeout = null;

  function viewChanged() {
    expandProfile();

    function rejectNrefresh() {
      if (GM_config.get("autoSwipeLeft")) {
        console.log("Swipe left due", ...arguments);
        swipeLeft();
        setTimeout(viewChanged, 250);
      } else {
        console.log(
          "autoSwipeLeft disabled; would have swiped left due",
          ...arguments
        );
      }
    }

    const distance = getDistance();
    if (distance) {
      console.log("Distance:", distance);
    }
    if (distance && distance > GM_config.get("distanaceLimit")) {
      rejectNrefresh("distance:", distance);
    }
    const intrests = getIntrests();
    if (intrests && intrests.size > 0) {
      console.log(intrests);
      const blacklistedIntrests = GM_config.get("intrestsBlacklist")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (blacklistedIntrests.some((e) => intrests.has(e))) {
        rejectNrefresh("intrests:", intrests);
      }
    }
    const bio = getBio();
    if (bio) {
      console.log("Bio:", bio);
      const height = bioExtractHeight(bio);
      if (height && height > GM_config.get("heightLimit")) {
        rejectNrefresh("height:", height);
      }
      const social = bioGetSocial(bio);
      if (Object.keys(social).length) {
        console.log("social", social);
      }
      for (const [socialNetworkName, name] of Object.entries(social)) {
        if (name.includes("vip")) {
          rejectNrefresh(`social[${socialNetworkName}]:`, name);
        }
      }
    }
  }

  const callback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        if (settings.activated) {
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }
          debounceTimeout = setTimeout(function () {
            viewChanged();
            debounceTimeout = null;
          }, 250);
        }
        break;
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
