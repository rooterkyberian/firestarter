declare var GM_config: any, GM_notification: any;

import { knownIntrests } from "./tin";
import { addGlobalStyle, arrayAsString, press } from "./utils";

(function () {
  const settings = {
    activated: true,
  };

  const scriptName = "firestarter";

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
        type: "text",
        title: "comma seperated",
        default: "Astrology",
      },

      requiredRegexp: {
        label: "Reject if bio doesn't match regexp",
        type: "text",
        title: "regexp",
        default: "",
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
      .map((node) => (node as HTMLElement).style["background-image"])
      .filter(Boolean);
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

    .firestarterBtn {
    color: green;
    background: black;
    }

    `);

  function revertChoice() {
    (document
      .evaluate("//a[contains(., 'Back')]", document)
      .iterateNext() as HTMLElement).click(); // turn off profile expand to Rewind button comes back up
    setTimeout(() => {
      (document
        .evaluate("//button[contains(., 'Rewind')]", document)
        .iterateNext() as HTMLElement).click();
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
      (e[0] as HTMLElement).click();
    }
  }

  function swipeLeft() {
    press({ key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 });
  }

  function getDistance(): number {
    const match = document.body.innerHTML.match(/(\d+) kilometers away/);
    if (!match) {
      return null;
    }
    const distance = Number(match[1]);
    return distance;
  }

  function getBio(): string | null {
    const bioDiv = document.querySelector(
      "hr:first-of-type + div"
    ) as HTMLElement;
    if (!bioDiv) return null;
    return bioDiv.innerText;
  }

  function getReportButton() {
    const reportBtns = Array.from(
      document.querySelectorAll("button")
    ).filter((btn) => btn.innerText.startsWith("REPORT "));
    return reportBtns.length ? reportBtns[0] : null;
  }

  function bioExtractHeight(bio: string): number {
    const low = 140,
      high = 195;
    const nums = Array.from(bio.matchAll(/\b(\d{3}|\d\.\d\d)(cm)?\b/g))
      .map((m) => Number(m[1]))
      .map((n) => (n < 3 ? n * 100 : n))
      .filter((h) => h < high && h > low);
    if (nums.length) {
      return nums[0];
    }
    return null;
  }

  function bioGetSocial(bio: string) {
    const social = {
      instagram: ["ig", "instagram", "inst", "insta", "instagram.com", "📸"],
      snapchat: ["snapchat", "s/c", "snap", "👻", "s/c👻"],
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
      `\\b(${allSocialNames.join("|")})[:\\s@/]*([a-z\\d_-]{4,})(\\b|👻)`,
      "gi"
    );
    const foundSocialArr = Array.from(bio.matchAll(re)).map((m) => [
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

  function getOrAddChildNode(parent, id, tag = "div") {
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement("div");
      node.id = id;
      parent.appendChild(node);
    }

    return node;
  }

  function createLink(text, href) {
    const a = document.createElement("a");
    const linkText = document.createTextNode(text);
    a.appendChild(linkText);
    a.href = href;
    a.target = "_blank";
    return a;
  }

  function getIntrests() {
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

          GM_notification({
            text: `${scriptName} activated=${settings.activated}`,
            title: scriptName,
          });
          break;
        default:
          console.log("keydown", e);
      }
    });
  }
  setTimeout(startup, 2000);

  const targetNode = document.body;

  // Options for the observer (which mutations to observe)
  const config = { attributes: false, childList: true, subtree: true };

  function recViewChanged() {
    expandProfile();

    function rejectNrefresh(...args: any[]) {
      if (GM_config.get("autoSwipeLeft")) {
        console.log("Swiped left due", ...args);

        GM_notification({
          text: "Swiped left due " + arrayAsString(Array.from(arguments)),
          title: scriptName,
        });
        swipeLeft();
        setTimeout(recViewChanged, 250);
      } else {
        console.log(
          "autoSwipeLeft disabled; would have swiped left due",
          ...args
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
      for (const [socialNetworkName, name] of Object.entries(social) as Array<
        [string, string]
      >) {
        if (name.includes("vip")) {
          rejectNrefresh(`social[${socialNetworkName}]:`, name);
        }
      }

      {
        const requiredRegexp = (GM_config.get("requiredRegexp") || "").trim();
        if (requiredRegexp && !bio.match(RegExp(requiredRegexp, "i"))) {
          rejectNrefresh(`bio did not match regexp`);
        }
      }

      let socialLinksDiv = null;
      {
        const reportBtn = getReportButton();
        if (reportBtn) {
          socialLinksDiv = getOrAddChildNode(
            reportBtn.parentNode,
            "socialLinks"
          );
        }
      }
      if (socialLinksDiv) {
        socialLinksDiv.innerHTML = "";
        const instagramName = social["instagram"];
        if (instagramName) {
          socialLinksDiv.appendChild(
            createLink(
              `instagram: ${instagramName}`,
              `https://instagram.com/${instagramName}`
            )
          );
        }
      }
    }
  }

  function isRecsLocation() {
    return !!window.location.pathname.match(/^\/app\/(recs|matches)\b/);
  }

  let debounceTimeout = null;
  const mutationCallback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        if (settings.activated) {
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }
          debounceTimeout = setTimeout(function () {
            if (isRecsLocation()) {
              recViewChanged();
            }
            debounceTimeout = null;
          }, 250);
        }
        break;
      }
    }
  };

  const observer = new MutationObserver(mutationCallback);
  observer.observe(targetNode, config);

  function nextImg() {
    let imgBtns = Array.from(
      document.querySelector(".profileCard__card").querySelectorAll("button")
    );
    imgBtns = imgBtns.filter((imgBtn) => imgBtn.textContent.match(/([\d]\/)+/));
    if (!imgBtns.length) {
      return;
    }
    imgBtns = imgBtns.filter(
      (imgBtn) => imgBtns[0].parentElement === imgBtn.parentElement
    ); // filterout buttons from other sections (such as instagram)
    let previousWasActive = false;
    for (const imgBtn of [...imgBtns, ...imgBtns]) {
      if (previousWasActive) {
        imgBtn.click();
        break;
      }
      previousWasActive = imgBtn.classList.contains("bullet--active");
    }
  }
})();
