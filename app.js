/* =========================================================
   WALPAP V1
   Premium Digital Wallpaper Marketplace
   Firebase Auth + Firestore + Storage

   FILE:
   public/app.js / app.js

   FIRESTORE STRUCTURE

   users/{uid}
   wallpapers/{wallpaperId}
   purchases/{purchaseId}
   vault/{vaultId}
   certificates/{certificateId}
   marketplace/{listingId}

   ========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

const {
  auth,
  db,
  storage
} = window.WALPAP_FIREBASE;

const {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged
} = window.WALPAP_AUTH;


/* =========================================================
   FIRESTORE IMPORTS
========================================================= */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   GLOBAL STATE
========================================================= */

const state = {

  user: null,

  userData: null,

  wallpapers: [],

  vault: [],

  marketplace: [],

  selectedWallpaper: null,

  selectedVaultItem: null,

  currentPage: "home",

  loading: false,

  unsubscribeUser: null,

  unsubscribeVault: null

};


/* =========================================================
   CONFIG
========================================================= */

const CONFIG = {

  defaultPrice: 1000000,

  currency: "IDR",

  currencyLocale: "id-ID",

  appName: "WALPAP",

  defaultEditionTotal: 100,

  marketplaceFeePercent: 5

};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);


const $$ = (selector) =>
  [...document.querySelectorAll(selector)];


/* =========================================================
   DOM REFERENCES
========================================================= */

const els = {

  sideMenu: $("#sideMenu"),

  menuBtn: $("#menuBtn"),

  closeMenuBtn: $("#closeMenuBtn"),

  profileBtn: $("#profileBtn"),

  authModal: $("#authModal"),

  googleLoginBtn: $("#googleLoginBtn"),

  anonymousLoginBtn: $("#anonymousLoginBtn"),

  loginBtn: $("#loginBtn"),

  logoutBtn: $("#logoutBtn"),

  toast: $("#toast"),

  toastMessage: $("#toastMessage")

};


/* =========================================================
   FORMATTERS
========================================================= */

function formatIDR(value) {

  const number = Number(value || 0);

  return new Intl.NumberFormat(
    CONFIG.currencyLocale,
    {
      style: "currency",
      currency: CONFIG.currency,
      maximumFractionDigits: 0
    }
  ).format(number);

}


function formatNumber(value) {

  return new Intl.NumberFormat(
    CONFIG.currencyLocale
  ).format(Number(value || 0));

}


function formatDate(timestamp) {

  if (!timestamp) return "—";

  let date;

  if (
    typeof timestamp.toDate === "function"
  ) {

    date = timestamp.toDate();

  } else if (
    timestamp instanceof Date
  ) {

    date = timestamp;

  } else {

    date = new Date(timestamp);

  }

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  ).format(date);

}


function generateId(prefix = "id") {

  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 8)
  );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function toast(message, duration = 3000) {

  if (!els.toast) return;

  els.toastMessage.textContent = message;

  els.toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    els.toast.classList.remove("show");

  }, duration);

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(isLoading) {

  state.loading = isLoading;

  document.body.classList.toggle(
    "is-loading",
    isLoading
  );

}


/* =========================================================
   NAVIGATION
========================================================= */

function openPage(pageName) {

  if (!pageName) return;

  state.currentPage = pageName;


  $$(".page").forEach(page => {

    page.classList.remove("active");

  });


  const page =
    document.querySelector(
      `#page-${pageName}`
    );


  if (page) {

    page.classList.add("active");

  }


  $$(".bottom-nav-item").forEach(item => {

    item.classList.toggle(
      "active",
      item.dataset.page === pageName
    );

  });


  closeMenu();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  /*
   * Page-specific actions
   */

  if (pageName === "home") {

    renderHome();

  }

  if (pageName === "drops") {

    renderDrops();

  }

  if (pageName === "explore") {

    renderExplore();

  }

  if (pageName === "vault") {

    renderVault();

  }

  if (pageName === "marketplace") {

    loadMarketplace();

  }

  if (pageName === "profile") {

    renderProfile();

  }

}


function closeMenu() {

  els.sideMenu?.classList.remove("open");

}


function openMenu() {

  els.sideMenu?.classList.add("open");

}


/* =========================================================
   AUTH MODAL
========================================================= */

function openAuthModal() {

  els.authModal?.classList.add("open");

}


function closeAuthModal() {

  els.authModal?.classList.remove("open");

}


/* =========================================================
   FIREBASE AUTH
========================================================= */

async function loginGoogle() {

  try {

    setLoading(true);

    const provider =
      new GoogleAuthProvider();

    await signInWithPopup(
      auth,
      provider
    );

    closeAuthModal();

    toast("Welcome to WALPAP.");

  } catch (error) {

    console.error(error);

    toast(
      "Google sign-in gagal."
    );

  } finally {

    setLoading(false);

  }

}


async function loginGuest() {

  try {

    setLoading(true);

    await signInAnonymously(auth);

    closeAuthModal();

    toast(
      "Guest account created."
    );

  } catch (error) {

    console.error(error);

    toast(
      "Guest login gagal."
    );

  } finally {

    setLoading(false);

  }

}


async function logout() {

  try {

    await signOut(auth);

    toast(
      "You have been signed out."
    );

  } catch (error) {

    console.error(error);

    toast(
      "Logout gagal."
    );

  }

}


/* =========================================================
   USER DOCUMENT
========================================================= */

async function ensureUserDocument(firebaseUser) {

  if (!firebaseUser) return null;


  const userRef =
    doc(
      db,
      "users",
      firebaseUser.uid
    );


  const snapshot =
    await getDoc(userRef);


  if (!snapshot.exists()) {

    const userData = {

      uid: firebaseUser.uid,

      displayName:
        firebaseUser.displayName ||
        "WALPAP Collector",

      email:
        firebaseUser.email || "",

      photoURL:
        firebaseUser.photoURL || "",

      balance: 0,

      tier: "Collector",

      ownedCount: 0,

      totalSpent: 0,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    };


    await setDoc(
      userRef,
      userData
    );


    return userData;

  }


  return snapshot.data();

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async firebaseUser => {

    state.user =
      firebaseUser;


    if (!firebaseUser) {

      state.userData = null;

      updateAuthUI();

      return;

    }


    try {

      state.userData =
        await ensureUserDocument(
          firebaseUser
        );


      updateAuthUI();

      await loadUserVault();

      await loadWallpapers();

      renderAll();

    } catch (error) {

      console.error(
        "Authentication initialization error:",
        error
      );

    }

  }
);


/* =========================================================
   AUTH UI
========================================================= */

function updateAuthUI() {

  const loggedIn =
    Boolean(state.user);


  if (els.loginBtn) {

    els.loginBtn.style.display =
      loggedIn
        ? "none"
        : "block";

  }


  if (els.logoutBtn) {

    els.logoutBtn.style.display =
      loggedIn
        ? "block"
        : "none";

  }


  const name =
    state.userData?.displayName ||
    state.user?.displayName ||
    "Guest";


  const profileName =
    $("#profileName");


  if (profileName) {

    profileName.textContent =
      name;

  }


  const avatar =
    $(".profile-avatar");


  if (avatar) {

    avatar.textContent =
      name
        .charAt(0)
        .toUpperCase();

  }

}


/* =========================================================
   LOAD WALLPAPERS
========================================================= */

async function loadWallpapers() {

  try {

    const wallpapersRef =
      collection(
        db,
        "wallpapers"
      );


    let snapshot;


    try {

      const q =
        query(
          wallpapersRef,
          orderBy(
            "createdAt",
            "desc"
          )
        );

      snapshot =
        await getDocs(q);

    } catch (orderError) {

      /*
       * Jika Firestore belum memiliki index
       * atau createdAt belum tersedia.
       */

      console.warn(
        "Fallback wallpaper query:",
        orderError
      );

      snapshot =
        await getDocs(
          wallpapersRef
        );

    }


    state.wallpapers =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    /*
     * Demo fallback
     *
     * Hanya digunakan jika collection
     * wallpapers masih kosong.
     */

    if (
      state.wallpapers.length === 0
    ) {

      state.wallpapers =
        createDemoWallpapers();

    }


    renderAll();

  } catch (error) {

    console.error(
      "loadWallpapers:",
      error
    );

    toast(
      "Gagal memuat wallpaper."
    );

  }

}


/* =========================================================
   DEMO WALLPAPERS
========================================================= */

function createDemoWallpapers() {

  return [

    {

      id: "demo-obsidian",

      title: "Obsidian",

      subtitle:
        "Darkness, refined.",

      description:
        "A minimal black digital artifact designed for collectors who prefer silence over noise.",

      category: "genesis",

      price: 1000000,

      editionTotal: 100,

      editionSold: 7,

      imageUrl: "",

      status: "active",

      demo: true

    },


    {

      id: "demo-midnight",

      title: "Midnight",

      subtitle:
        "After the world sleeps.",

      description:
        "A cinematic midnight atmosphere built for OLED displays.",

      category: "midnight",

      price: 1500000,

      editionTotal: 100,

      editionSold: 0,

      imageUrl: "",

      status: "upcoming",

      demo: true

    },


    {

      id: "demo-gold",

      title: "Gold",

      subtitle:
        "Quiet luxury.",

      description:
        "A restrained golden composition created as a premium digital collectible.",

      category: "gold",

      price: 2000000,

      editionTotal: 50,

      editionSold: 0,

      imageUrl: "",

      status: "active",

      demo: true

    },


    {

      id: "demo-royal",

      title: "Royal",

      subtitle:
        "Designed to be noticed.",

      description:
        "A rich royal composition for collectors who want something unmistakable.",

      category: "royal",

      price: 3000000,

      editionTotal: 25,

      editionSold: 0,

      imageUrl: "",

      status: "active",

      demo: true

    }

  ];

}


/* =========================================================
   GET CURRENT EDITION
========================================================= */

function getCurrentEdition(wallpaper) {

  const sold =
    Number(
      wallpaper?.editionSold || 0
    );


  return sold + 1;

}


/* =========================================================
   STOCK
========================================================= */

function getRemaining(wallpaper) {

  const total =
    Number(
      wallpaper?.editionTotal ||
      CONFIG.defaultEditionTotal
    );


  const sold =
    Number(
      wallpaper?.editionSold || 0
    );


  return Math.max(
    0,
    total - sold
  );

}


/* =========================================================
   ART CLASS
========================================================= */

function artClassFor(wallpaper) {

  const category =
    String(
      wallpaper?.category || ""
    ).toLowerCase();


  if (category === "midnight") {

    return "midnight-art";

  }

  if (category === "gold") {

    return "gold-art";

  }

  if (category === "royal") {

    return "royal-art";

  }

  return "obsidian-art";

}


/* =========================================================
   IMAGE URL
========================================================= */

function setArtBackground(
  element,
  wallpaper
) {

  if (!element) return;


  element.style.backgroundImage = "";


  if (
    wallpaper?.imageUrl
  ) {

    element.style.backgroundImage =
      `url("${wallpaper.imageUrl}")`;

    element.style.backgroundSize =
      "cover";

    element.style.backgroundPosition =
      "center";

  }

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderHome();

  renderDrops();

  renderExplore();

  renderVault();

  renderProfile();

  updateAuthUI();

}


/* =========================================================
   HOME
========================================================= */

function renderHome() {

  if (!state.wallpapers.length) {
    return;
  }


  const active =
    state.wallpapers.find(
      item =>
        item.status === "active" &&
        getRemaining(item) > 0
    ) ||
    state.wallpapers[0];


  if (!active) return;


  /*
   * HERO
   */

  const heroArt =
    $("#heroArt");


  if (heroArt) {

    heroArt.className =
      `hero-art ${artClassFor(active)}`;

    setArtBackground(
      heroArt,
      active
    );

  }


  setText(
    "#heroTitle",
    active.title
  );


  setText(
    "#heroSubtitle",
    active.subtitle ||
    "A wallpaper designed to be owned."
  );


  setText(
    "#heroCta",
    "VIEW EDITION"
  );


  /*
   * DROP
   */

  const dropArt =
    $("#homeDropArt");


  if (dropArt) {

    dropArt.className =
      `art-preview ${artClassFor(active)}`;

    setArtBackground(
      dropArt,
      active
    );

  }


  setText(
    "#homeDropTitle",
    active.title
  );


  setText(
    "#homeDropSubtitle",
    active.subtitle || ""
  );


  setText(
    "#homeDropPrice",
    formatIDR(
      active.price ||
      CONFIG.defaultPrice
    )
  );


  const remaining =
    getRemaining(active);


  const total =
    Number(
      active.editionTotal ||
      CONFIG.defaultEditionTotal
    );


  setText(
    "#homeDropStock",
    `${remaining} / ${total} remaining`
  );


  setText(
    "#homeDropSold",
    `${active.editionSold || 0} sold`
  );


  const progress =
    $("#homeDropProgress");


  if (progress) {

    const percent =
      Math.min(
        100,
        (
          Number(active.editionSold || 0) /
          total
        ) * 100
      );


    progress.style.width =
      `${percent}%`;

  }


  const button =
    $("#homeDropButton");


  if (button) {

    button.onclick =
      () => openWallpaper(
        active.id
      );

  }


  const heroCta =
    $("#heroCta");


  if (heroCta) {

    heroCta.onclick =
      () => openWallpaper(
        active.id
      );

  }


  /*
   * COMING SOON
   */

  const upcoming =
    state.wallpapers.find(
      item =>
        item.status === "upcoming"
    );


  if (upcoming) {

    setText(
      "#comingTitle",
      upcoming.title
    );


    setText(
      "#comingDate",
      upcoming.releaseAt
        ? formatDate(
            upcoming.releaseAt
          )
        : "Coming soon"
    );


    const comingArt =
      $("#comingArt");


    if (comingArt) {

      comingArt.className =
        `art-preview ${artClassFor(upcoming)}`;

      setArtBackground(
        comingArt,
        upcoming
      );

    }


    startCountdown(
      upcoming.releaseAt
    );

  }

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
  selector,
  value
) {

  const element =
    $(selector);


  if (element) {

    element.textContent =
      value ?? "";

  }

}


/* =========================================================
   DROPS
========================================================= */

function renderDrops() {

  const container =
    $("#dropProducts");


  if (!container) return;


  const products =
    state.wallpapers;


  if (!products.length) {

    container.innerHTML =
      `
      <div class="fine-print">
        No drops available.
      </div>
      `;

    return;

  }


  container.innerHTML =
    products.map(
      wallpaper =>
        createProductCard(
          wallpaper
        )
    ).join("");


  bindProductCards(
    container
  );

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(
  wallpaper
) {

  const remaining =
    getRemaining(wallpaper);


  const total =
    Number(
      wallpaper.editionTotal ||
      CONFIG.defaultEditionTotal
    );


  const sold =
    Number(
      wallpaper.editionSold || 0
    );


  const soldPercent =
    Math.min(
      100,
      (sold / total) * 100
    );


  const soldOut =
    remaining <= 0;


  return `

    <article
      class="product-card"
      data-product-id="${escapeHTML(
        wallpaper.id
      )}"
    >

      <div
        class="product-image ${artClassFor(
          wallpaper
        )}"
      >

        ${
          wallpaper.imageUrl
            ? `
              <img
                src="${escapeHTML(
                  wallpaper.imageUrl
                )}"
                alt="${escapeHTML(
                  wallpaper.title
                )}"
                loading="lazy"
              >
            `
            : ""
        }

      </div>


      <div class="product-card-body">

        <div class="card-top">

          <div>

            <div class="eyebrow">
              ${escapeHTML(
                wallpaper.category ||
                "COLLECTIBLE"
              )}
            </div>

            <h3>
              ${escapeHTML(
                wallpaper.title ||
                "Untitled"
              )}
            </h3>

          </div>

          <strong>
            ${formatIDR(
              wallpaper.price ||
              CONFIG.defaultPrice
            )}
          </strong>

        </div>


        <p>
          ${escapeHTML(
            wallpaper.subtitle || ""
          )}
        </p>


        <div class="stock-row">

          <span>
            ${remaining} / ${total}
          </span>

          <span>
            ${sold} sold
          </span>

        </div>


        <div class="progress">

          <div
            style="width:${soldPercent}%"
          ></div>

        </div>


        ${
          soldOut
            ? `
              <div class="limited-warning">
                SOLD OUT
              </div>
            `
            : ""
        }


        <button
          class="primary-btn product-view-btn"
          data-product-id="${escapeHTML(
            wallpaper.id
          )}"
          ${soldOut ? "disabled" : ""}
        >
          ${
            soldOut
              ? "SOLD OUT"
              : "VIEW EDITION"
          }
        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   BIND PRODUCT CARDS
========================================================= */

function bindProductCards(
  container
) {

  container
    .querySelectorAll(
      ".product-view-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openWallpaper(
            button.dataset.productId
          );

        }
      );

    });

}


/* =========================================================
   EXPLORE
========================================================= */

let currentExploreFilter =
  "all";


function renderExplore() {

  const grid =
    $("#exploreGrid");


  if (!grid) return;


  let products =
    state.wallpapers;


  if (
    currentExploreFilter !==
    "all"
  ) {

    products =
      products.filter(
        item =>
          String(
            item.category || ""
          ).toLowerCase() ===
          currentExploreFilter
      );

  }


  if (!products.length) {

    grid.innerHTML =
      `
      <div class="fine-print">
        No wallpapers found.
      </div>
      `;

    return;

  }


  grid.innerHTML =
    products.map(
      wallpaper =>
        createExploreCard(
          wallpaper
        )
    ).join("");


  grid
    .querySelectorAll(
      "[data-product-id]"
    )
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          openWallpaper(
            card.dataset.productId
          );

        }
      );

    });

}


/* =========================================================
   EXPLORE CARD
========================================================= */

function createExploreCard(
  wallpaper
) {

  const remaining =
    getRemaining(wallpaper);


  return `

    <article
      class="explore-card"
      data-product-id="${escapeHTML(
        wallpaper.id
      )}"
    >

      <div
        class="explore-art ${artClassFor(
          wallpaper
        )}"
        ${
          wallpaper.imageUrl
            ? `
              style="
                background-image:url(
                  '${escapeHTML(
                    wallpaper.imageUrl
                  )}'
                )
              "
            `
            : ""
        }
      ></div>


      <div>

        <div class="eyebrow">
          ${
            remaining > 0
              ? `#${String(
                  getCurrentEdition(
                    wallpaper
                  )
                ).padStart(3, "0")}`
              : "SOLD OUT"
          }
        </div>

        <h3>
          ${escapeHTML(
            wallpaper.title
          )}
        </h3>

        <span>
          ${formatIDR(
            wallpaper.price
          )}
        </span>

      </div>

    </article>

  `;

}


/* =========================================================
   OPEN WALLPAPER
========================================================= */

function openWallpaper(
  wallpaperId
) {

  const wallpaper =
    state.wallpapers.find(
      item =>
        item.id === wallpaperId
    );


  if (!wallpaper) {

    toast(
      "Wallpaper tidak ditemukan."
    );

    return;

  }


  state.selectedWallpaper =
    wallpaper;


  renderDetail(
    wallpaper
  );


  openPage("detail");

}


/* =========================================================
   DETAIL
========================================================= */

function renderDetail(
  wallpaper
) {

  if (!wallpaper) return;


  const art =
    $("#detailArt");


  if (art) {

    art.className =
      `detail-art ${artClassFor(
        wallpaper
      )}`;

    setArtBackground(
      art,
      wallpaper
    );

  }


  setText(
    "#detailTitle",
    wallpaper.title
  );


  setText(
    "#detailSubtitle",
    wallpaper.subtitle || ""
  );


  setText(
    "#detailPrice",
    formatIDR(
      wallpaper.price ||
      CONFIG.defaultPrice
    )
  );


  const currentEdition =
    getCurrentEdition(
      wallpaper
    );


  const total =
    wallpaper.editionTotal ||
    CONFIG.defaultEditionTotal;


  setText(
    "#detailEdition",
    `EDITION ${String(
      currentEdition
    ).padStart(3, "0")} / ${total}`
  );


  const remaining =
    getRemaining(
      wallpaper
    );


  setText(
    "#detailStock",
    `${remaining} editions remaining`
  );


  if (remaining <= 10) {

    setText(
      "#detailUrgency",
      "Very limited availability."
    );

  } else {

    setText(
      "#detailUrgency",
      "Limited digital edition."
    );

  }


  setText(
    "#detailDescription",
    wallpaper.description ||
    "A premium digital collectible."
  );


  const buyButton =
    $("#buyDetailBtn");


  if (buyButton) {

    buyButton.disabled =
      remaining <= 0;


    buyButton.textContent =
      remaining <= 0
        ? "SOLD OUT"
        : "CLAIM THIS EDITION";


    buyButton.onclick =
      () => {

        if (remaining <= 0) {

          toast(
            "Edition ini sudah habis."
          );

          return;

        }

        openCheckout(
          wallpaper
        );

      };

  }


  updatePriceLadder(
    wallpaper
  );

}


/* =========================================================
   PRICE LADDER
========================================================= */

function updatePriceLadder(
  wallpaper
) {

  const steps =
    $$(".price-step");


  if (!steps.length) return;


  const sold =
    Number(
      wallpaper.editionSold || 0
    );


  steps.forEach(
    (step, index) => {

      step.classList.remove(
        "active"
      );


      if (index === 0 && sold < 10) {

        step.classList.add(
          "active"
        );

      }


      if (
        index === 1 &&
        sold >= 10 &&
        sold < 30
      ) {

        step.classList.add(
          "active"
        );

      }


      if (
        index === 2 &&
        sold >= 30 &&
        sold < 60
      ) {

        step.classList.add(
          "active"
        );

      }


      if (
        index === 3 &&
        sold >= 60
      ) {

        step.classList.add(
          "active"
        );

      }

    }
  );

}


/* =========================================================
   CHECKOUT
========================================================= */

function openCheckout(
  wallpaper
) {

  if (!wallpaper) return;


  if (!state.user) {

    toast(
      "Sign in terlebih dahulu."
    );

    openAuthModal();

    return;

  }


  state.selectedWallpaper =
    wallpaper;


  renderCheckout(
    wallpaper
  );


  openPage(
    "checkout"
  );

}


function renderCheckout(
  wallpaper
) {

  const art =
    $("#checkoutArt");


  if (art) {

    art.className =
      `checkout-art ${artClassFor(
        wallpaper
      )}`;

    setArtBackground(
      art,
      wallpaper
    );

  }


  setText(
    "#checkoutTitle",
    wallpaper.title
  );


  const edition =
    getCurrentEdition(
      wallpaper
    );


  const total =
    wallpaper.editionTotal ||
    CONFIG.defaultEditionTotal;


  setText(
    "#checkoutEdition",
    `Edition ${String(
      edition
    ).padStart(3, "0")} / ${total}`
  );


  const price =
    Number(
      wallpaper.price ||
      CONFIG.defaultPrice
    );


  setText(
    "#checkoutPrice",
    formatIDR(price)
  );


  setText(
    "#summaryPrice",
    formatIDR(price)
  );


  setText(
    "#summaryEdition",
    `#${String(
      edition
    ).padStart(3, "0")}`
  );


  setText(
    "#summaryTotal",
    formatIDR(price)
  );


  setText(
    "#checkoutBalance",
    formatIDR(
      state.userData?.balance || 0
    )
  );


  const balance =
    Number(
      state.userData?.balance || 0
    );


  const confirmButton =
    $("#confirmPurchaseBtn");


  if (confirmButton) {

    confirmButton.disabled =
      balance < price;


    if (balance < price) {

      confirmButton.textContent =
        "INSUFFICIENT BALANCE";

    } else {

      confirmButton.textContent =
        "CONFIRM PURCHASE";

    }

  }


  const notice =
    $("#checkoutNotice");


  if (notice) {

    notice.textContent =
      balance >= price

        ? "Your purchase will be permanently recorded in your WALPAP Vault."

        : `You need ${formatIDR(
            price - balance
          )} more balance to purchase this edition.`;

  }

}


/* =========================================================
   PURCHASE
========================================================= */

async function purchaseWallpaper() {

  if (!state.user) {

    openAuthModal();

    return;

  }


  const wallpaper =
    state.selectedWallpaper;


  if (!wallpaper) {

    toast(
      "Tidak ada wallpaper dipilih."
    );

    return;

  }


  const price =
    Number(
      wallpaper.price ||
      CONFIG.defaultPrice
    );


  try {

    setLoading(true);


    /*
     * =====================================================
     * DEMO DATA
     *
     * Demo wallpaper tidak boleh mengubah
     * Firestore karena belum benar-benar
     * mempunyai inventory document.
     * =====================================================
     */

    if (wallpaper.demo) {

      toast(
        "Demo mode: hubungkan wallpaper ke Firestore untuk pembelian nyata."
      );

      return;

    }


    /*
     * =====================================================
     * FIRESTORE TRANSACTION
     * =====================================================
     *
     * Transaction digunakan agar pembelian,
     * saldo dan stok diproses secara atomik.
     *
     * CATATAN:
     * Firestore Rules tetap WAJIB diperketat.
     */

    const result =
      await runTransaction(
        db,
        async transaction => {

          const userRef =
            doc(
              db,
              "users",
              state.user.uid
            );


          const wallpaperRef =
            doc(
              db,
              "wallpapers",
              wallpaper.id
            );


          const userSnap =
            await transaction.get(
              userRef
            );


          const wallpaperSnap =
            await transaction.get(
              wallpaperRef
            );


          if (!userSnap.exists()) {

            throw new Error(
              "USER_NOT_FOUND"
            );

          }


          if (
            !wallpaperSnap.exists()
          ) {

            throw new Error(
              "WALLPAPER_NOT_FOUND"
            );

          }


          const userData =
            userSnap.data();


          const currentWallpaper =
            wallpaperSnap.data();


          const balance =
            Number(
              userData.balance || 0
            );


          const currentSold =
            Number(
              currentWallpaper.editionSold ||
              0
            );


          const editionTotal =
            Number(
              currentWallpaper.editionTotal ||
              CONFIG.defaultEditionTotal
            );


          if (
            balance < price
          ) {

            throw new Error(
              "INSUFFICIENT_BALANCE"
            );

          }


          if (
            currentSold >=
            editionTotal
          ) {

            throw new Error(
              "SOLD_OUT"
            );

          }


          const editionNumber =
            currentSold + 1;


          const newBalance =
            balance - price;


          const newSold =
            currentSold + 1;


          /*
           * Purchase ID
           */

          const purchaseRef =
            doc(
              collection(
                db,
                "purchases"
              )
            );


          /*
           * Vault ID
           */

          const vaultId =
            `${state.user.uid}_${wallpaper.id}`;


          const vaultRef =
            doc(
              db,
              "vault",
              vaultId
            );


          /*
           * Certificate
           */

          const certificateId =
            generateId(
              "WALPAP"
            );


          const certificateRef =
            doc(
              db,
              "certificates",
              certificateId
            );


          /*
           * Update USER
           */

          transaction.update(
            userRef,
            {

              balance:
                newBalance,

              ownedCount:
                Number(
                  userData.ownedCount || 0
                ) + 1,

              totalSpent:
                Number(
                  userData.totalSpent || 0
                ) + price,

              updatedAt:
                serverTimestamp()

            }
          );


          /*
           * Update WALLPAPER
           */

          transaction.update(
            wallpaperRef,
            {

              editionSold:
                newSold,

              updatedAt:
                serverTimestamp()

            }
          );


          /*
           * PURCHASE
           */

          transaction.set(
            purchaseRef,
            {

              userId:
                state.user.uid,

              wallpaperId:
                wallpaper.id,

              wallpaperTitle:
                currentWallpaper.title ||
                "",

              price,

              editionNumber,

              editionTotal,

              certificateId,

              purchasedAt:
                serverTimestamp(),

              status:
                "completed"

            }
          );


          /*
           * VAULT
           */

          transaction.set(
            vaultRef,
            {

              userId:
                state.user.uid,

              wallpaperId:
                wallpaper.id,

              wallpaperTitle:
                currentWallpaper.title ||
                "",

              imageUrl:
                currentWallpaper.imageUrl ||
                "",

              price,

              editionNumber,

              editionTotal,

              purchaseId:
                purchaseRef.id,

              certificateId,

              purchasedAt:
                serverTimestamp(),

              status:
                "owned"

            }
          );


          /*
           * CERTIFICATE
           */

          transaction.set(
            certificateRef,
            {

              certificateId,

              userId:
                state.user.uid,

              wallpaperId:
                wallpaper.id,

              wallpaperTitle:
                currentWallpaper.title ||
                "",

              editionNumber,

              editionTotal,

              purchaseId:
                purchaseRef.id,

              issuedAt:
                serverTimestamp(),

              status:
                "valid"

            }
          );


          return {

            purchaseId:
              purchaseRef.id,

            certificateId,

            editionNumber,

            newBalance

          };

        }
      );


    /*
     * Update local state
     */

    state.userData.balance =
      result.newBalance;


    state.userData.ownedCount =
      Number(
        state.userData.ownedCount || 0
      ) + 1;


    state.userData.totalSpent =
      Number(
        state.userData.totalSpent || 0
      ) + price;


    /*
     * Update local wallpaper
     */

    wallpaper.editionSold =
      Number(
        wallpaper.editionSold || 0
      ) + 1;


    toast(
      `Edition #${String(
        result.editionNumber
      ).padStart(3, "0")} berhasil menjadi milik Anda.`
    );


    /*
     * Load vault again
     */

    await loadUserVault();


    /*
     * Show certificate
     */

    await openCertificateById(
      result.certificateId
    );


  } catch (error) {

    console.error(
      "purchaseWallpaper:",
      error
    );


    switch (error.message) {

      case "INSUFFICIENT_BALANCE":

        toast(
          "Saldo WALPAP tidak mencukupi."
        );

        break;


      case "SOLD_OUT":

        toast(
          "Edition sudah sold out."
        );

        break;


      case "USER_NOT_FOUND":

        toast(
          "Account tidak ditemukan."
        );

        break;


      case "WALLPAPER_NOT_FOUND":

        toast(
          "Wallpaper tidak ditemukan."
        );

        break;


      default:

        toast(
          "Purchase gagal. Coba lagi."
        );

    }

  } finally {

    setLoading(false);

  }

}


/* =========================================================
   LOAD USER VAULT
========================================================= */

async function loadUserVault() {

  if (!state.user) {

    state.vault = [];

    renderVault();

    return;

  }


  try {

    const vaultRef =
      collection(
        db,
        "vault"
      );


    const q =
      query(
        vaultRef,
        where(
          "userId",
          "==",
          state.user.uid
        )
      );


    const snapshot =
      await getDocs(q);


    state.vault =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderVault();


  } catch (error) {

    console.error(
      "loadUserVault:",
      error
    );

  }

}


/* =========================================================
   RENDER VAULT
========================================================= */

function renderVault() {

  const grid =
    $("#vaultGrid");


  if (!grid) return;


  if (!state.user) {

    grid.innerHTML =
      `
      <div class="fine-print">
        Sign in to access your Vault.
      </div>
      `;

    return;

  }


  setText(
    "#vaultCount",
    state.vault.length
  );


  const totalValue =
    state.vault.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.price || 0
        ),
      0
    );


  setText(
    "#vaultValue",
    formatIDR(
      totalValue
    )
  );


  setText(
    "#vaultTier",
    calculateTier(
      state.vault.length,
      totalValue
    )
  );


  if (!state.vault.length) {

    grid.innerHTML =
      `
      <div class="fine-print">
        Your Vault is empty.<br>
        Your first collectible is waiting.
      </div>
      `;

    return;

  }


  grid.innerHTML =
    state.vault
      .map(
        item =>
          createVaultCard(
            item
          )
      )
      .join("");


  grid
    .querySelectorAll(
      "[data-certificate-id]"
    )
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          openCertificateById(
            card.dataset.certificateId
          );

        }
      );

    });

}


/* =========================================================
   VAULT CARD
========================================================= */

function createVaultCard(
  item
) {

  const wallpaper =
    state.wallpapers.find(
      wallpaper =>
        wallpaper.id ===
        item.wallpaperId
    );


  const artClass =
    wallpaper
      ? artClassFor(wallpaper)
      : "obsidian-art";


  return `

    <article
      class="vault-card"
      data-certificate-id="${escapeHTML(
        item.certificateId || ""
      )}"
    >

      <div
        class="vault-art ${artClass}"
        ${
          item.imageUrl
            ? `
              style="
                background-image:url(
                  '${escapeHTML(
                    item.imageUrl
                  )}'
                )
              "
            `
            : ""
        }
      >

        <div class="owned-badge">
          OWNED
        </div>

      </div>


      <div class="vault-card-body">

        <div class="eyebrow">
          EDITION
        </div>

        <h3>
          ${escapeHTML(
            item.wallpaperTitle ||
            "WALPAP"
          )}
        </h3>

        <p>
          #${String(
            item.editionNumber || 0
          ).padStart(3, "0")}
          /
          ${item.editionTotal || 100}
        </p>

        <button
          class="secondary-btn"
        >
          VIEW CERTIFICATE
        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   CERTIFICATE
========================================================= */

async function openCertificateById(
  certificateId
) {

  if (!certificateId) {

    toast(
      "Certificate tidak ditemukan."
    );

    return;

  }


  try {

    const certificateRef =
      doc(
        db,
        "certificates",
        certificateId
      );


    const snapshot =
      await getDoc(
        certificateRef
      );


    if (!snapshot.exists()) {

      toast(
        "Certificate tidak ditemukan."
      );

      return;

    }


    const certificate =
      snapshot.data();


    if (
      state.user &&
      certificate.userId !==
        state.user.uid
    ) {

      toast(
        "Certificate bukan milik account ini."
      );

      return;

    }


    state.selectedVaultItem =
      certificate;


    renderCertificate(
      certificate
    );


    openPage(
      "certificate"
    );


  } catch (error) {

    console.error(
      "openCertificate:",
      error
    );

    toast(
      "Gagal membuka certificate."
    );

  }

}


/* =========================================================
   RENDER CERTIFICATE
========================================================= */

function renderCertificate(
  certificate
) {

  const wallpaper =
    state.wallpapers.find(
      item =>
        item.id ===
        certificate.wallpaperId
    );


  const art =
    $("#certificateArt");


  if (art) {

    art.className =
      `certificate-art ${
        wallpaper
          ? artClassFor(wallpaper)
          : "obsidian-art"
      }`;


    if (wallpaper) {

      setArtBackground(
        art,
        wallpaper
      );

    }

  }


  setText(
    "#certificateTitle",
    certificate.wallpaperTitle
  );


  setText(
    "#certificateEdition",
    `EDITION ${String(
      certificate.editionNumber
    ).padStart(3, "0")} / ${
      certificate.editionTotal || 100
    }`
  );


  const owner =
    state.userData?.displayName ||
    "WALPAP Collector";


  setText(
    "#certificateOwner",
    owner
  );


  setText(
    "#certificateId",
    certificate.certificateId
  );


  setText(
    "#certificateDate",
    formatDate(
      certificate.issuedAt
    )
  );


  const downloadButton =
    $("#downloadCertificateBtn");


  if (downloadButton) {

    downloadButton.onclick =
      () => {

        saveCertificateAsImage(
          certificate
        );

      };

  }

}


/* =========================================================
   SAVE CERTIFICATE
========================================================= */

async function saveCertificateAsImage(
  certificate
) {

  /*
   * Untuk MVP:
   * buka print dialog browser.
   *
   * Certificate CSS sudah dibuat
   * sehingga user dapat menyimpan
   * sebagai PDF.
   */

  toast(
    "Gunakan Print → Save as PDF untuk menyimpan certificate."
  );


  setTimeout(
    () => {

      window.print();

    },
    500
  );

}


/* =========================================================
   MARKETPLACE
========================================================= */

async function loadMarketplace() {

  const container =
    $("#marketList");


  if (!container) return;


  try {

    const marketplaceRef =
      collection(
        db,
        "marketplace"
      );


    const q =
      query(
        marketplaceRef,
        where(
          "status",
          "==",
          "active"
        )
      );


    const snapshot =
      await getDocs(q);


    state.marketplace =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderMarketplace();

  } catch (error) {

    console.error(
      "loadMarketplace:",
      error
    );


    container.innerHTML =
      `
      <div class="fine-print">
        Marketplace belum memiliki listing.
      </div>
      `;

  }

}


/* =========================================================
   RENDER MARKETPLACE
========================================================= */

function renderMarketplace() {

  const container =
    $("#marketList");


  if (!container) return;


  if (!state.marketplace.length) {

    container.innerHTML =
      `
      <div class="fine-print">
        No collector listings yet.
      </div>
      `;

    return;

  }


  container.innerHTML =
    state.marketplace
      .map(
        listing =>
          createMarketplaceCard(
            listing
          )
      )
      .join("");

}


/* =========================================================
   MARKETPLACE CARD
========================================================= */

function createMarketplaceCard(
  listing
) {

  return `

    <article class="market-card">

      <div class="market-art obsidian-art">

        ${
          listing.imageUrl
            ? `
              <img
                src="${escapeHTML(
                  listing.imageUrl
                )}"
                alt="${escapeHTML(
                  listing.title || ""
                )}"
              >
            `
            : ""
        }

      </div>


      <div class="market-body">

        <div class="eyebrow">
          RESALE
        </div>

        <div class="market-title">
          ${escapeHTML(
            listing.title ||
            "WALPAP Edition"
          )}
        </div>


        <div class="market-history">

          Edition #
          ${String(
            listing.editionNumber || 0
          ).padStart(3, "0")}

        </div>


        <div class="seller">

          Seller:
          ${escapeHTML(
            listing.sellerName ||
            "Collector"
          )}

        </div>


        <strong>
          ${formatIDR(
            listing.price
          )}
        </strong>


        <button
          class="primary-btn"
          data-listing-id="${escapeHTML(
            listing.id
          )}"
        >
          VIEW LISTING
        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   PROFILE
========================================================= */

function renderProfile() {

  if (!state.user) {

    setText(
      "#profileName",
      "Guest"
    );

    setText(
      "#profileOwned",
      "0"
    );

    setText(
      "#profileSpent",
      formatIDR(0)
    );

    setText(
      "#profileBalance",
      formatIDR(0)
    );

    return;

  }


  const data =
    state.userData || {};


  const owned =
    Number(
      data.ownedCount || 0
    );


  const spent =
    Number(
      data.totalSpent || 0
    );


  const balance =
    Number(
      data.balance || 0
    );


  const tier =
    calculateTier(
      owned,
      spent
    );


  setText(
    "#profileName",
    data.displayName ||
    "WALPAP Collector"
  );


  setText(
    "#profileOwned",
    owned
  );


  setText(
    "#profileSpent",
    formatIDR(spent)
  );


  setText(
    "#profileBalance",
    formatIDR(balance)
  );


  setText(
    "#profileTier",
    tier.toUpperCase()
  );


  setText(
    "#profileStatus",
    getCollectionStatus(
      owned
    )
  );


  /*
   * Collection progress
   */

  const progress =
    $("#profileProgress");


  if (progress) {

    const percentage =
      Math.min(
        100,
        owned * 20
      );


    progress.style.width =
      `${percentage}%`;

  }


  /*
   * Badges
   */

  const firstBadge =
    $("#badgeFirst");


  if (firstBadge) {

    firstBadge.classList.toggle(
      "active",
      owned >= 1
    );

  }


  const genesisBadge =
    $("#badgeGenesis");


  if (genesisBadge) {

    genesisBadge.classList.toggle(
      "active",
      state.vault.some(
        item =>
          Number(
            item.editionNumber
          ) <= 100
      )
    );

  }


  const collectorBadge =
    $("#badgeCollector");


  if (collectorBadge) {

    collectorBadge.classList.toggle(
      "active",
      owned >= 3
    );

  }


  const eliteBadge =
    $("#badgeElite");


  if (eliteBadge) {

    eliteBadge.classList.toggle(
      "active",
      spent >= 10000000
    );

  }

}


/* =========================================================
   TIER
========================================================= */

function calculateTier(
  owned,
  spent
) {

  if (
    spent >= 50000000 ||
    owned >= 20
  ) {

    return "Elite";

  }


  if (
    spent >= 10000000 ||
    owned >= 10
  ) {

    return "Inner Circle";

  }


  if (
    spent >= 5000000 ||
    owned >= 5
  ) {

    return "Collector+";

  }


  return "Collector";

}


/* =========================================================
   COLLECTION STATUS
========================================================= */

function getCollectionStatus(
  owned
) {

  if (owned >= 20) {

    return "You have built a serious collection.";

  }


  if (owned >= 10) {

    return "Your Vault is becoming exceptional.";

  }


  if (owned >= 5) {

    return "Your collection is taking shape.";

  }


  if (owned >= 1) {

    return "Your first piece is now yours.";

  }


  return "Start your collection.";

}


/* =========================================================
   COUNTDOWN
========================================================= */

let countdownInterval =
  null;


function startCountdown(
  releaseAt
) {

  const element =
    $("#comingCountdown");


  if (!element) return;


  if (countdownInterval) {

    clearInterval(
      countdownInterval
    );

  }


  if (!releaseAt) {

    element.textContent =
      "-- : -- : --";

    return;

  }


  let releaseDate;


  if (
    typeof releaseAt.toDate ===
    "function"
  ) {

    releaseDate =
      releaseAt.toDate();

  } else {

    releaseDate =
      new Date(releaseAt);

  }


  function update() {

    const now =
      Date.now();


    const target =
      releaseDate.getTime();


    const difference =
      target - now;


    if (
      difference <= 0
    ) {

      element.textContent =
        "LIVE";


      clearInterval(
        countdownInterval
      );

      return;

    }


    const hours =
      Math.floor(
        difference /
        (1000 * 60 * 60)
      );


    const minutes =
      Math.floor(
        (
          difference %
          (1000 * 60 * 60)
        ) /
        (1000 * 60)
      );


    const seconds =
      Math.floor(
        (
          difference %
          (1000 * 60)
        ) /
        1000
      );


    element.textContent =
      `${String(hours).padStart(2, "0")} : ` +
      `${String(minutes).padStart(2, "0")} : ` +
      `${String(seconds).padStart(2, "0")}`;

  }


  update();


  countdownInterval =
    setInterval(
      update,
      1000
    );

}


/* =========================================================
   FILTER
========================================================= */

$$(".filter").forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        $$(".filter")
          .forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );


        button.classList.add(
          "active"
        );


        currentExploreFilter =
          button.dataset.filter ||
          "all";


        renderExplore();

      }
    );

  }
);


/* =========================================================
   COLLECTION FILTER
========================================================= */

$$(".collection-card").forEach(
  card => {

    card.addEventListener(
      "click",
      () => {

        const category =
          card.dataset.category ||
          "all";


        currentExploreFilter =
          category;


        $$(".filter")
          .forEach(
            filter => {

              filter.classList.toggle(
                "active",
                filter.dataset.filter ===
                  category
              );

            }
          );


        openPage(
          "explore"
        );


        renderExplore();

      }
    );

  }
);


/* =========================================================
   GLOBAL PAGE BUTTONS
========================================================= */

$$("[data-page]").forEach(
  element => {

    element.addEventListener(
      "click",
      event => {

        /*
         * Jangan override product cards
         */

        if (
          element.dataset.productId
        ) {

          return;

        }


        const page =
          element.dataset.page;


        if (page) {

          openPage(page);

        }

      }
    );

  }
);


/* =========================================================
   MENU
========================================================= */

els.menuBtn?.addEventListener(
  "click",
  openMenu
);


els.closeMenuBtn?.addEventListener(
  "click",
  closeMenu
);


/* =========================================================
   PROFILE BUTTON
========================================================= */

els.profileBtn?.addEventListener(
  "click",
  () => {

    openPage(
      "profile"
    );

  }
);


/* =========================================================
   AUTH BUTTONS
========================================================= */

els.googleLoginBtn?.addEventListener(
  "click",
  loginGoogle
);


els.anonymousLoginBtn?.addEventListener(
  "click",
  loginGuest
);


els.loginBtn?.addEventListener(
  "click",
  openAuthModal
);


els.logoutBtn?.addEventListener(
  "click",
  logout
);


/* =========================================================
   CLOSE MODAL
========================================================= */

$$("[data-close-modal]").forEach(
  element => {

    element.addEventListener(
      "click",
      closeAuthModal
    );

  }
);


/* =========================================================
   CONFIRM PURCHASE
========================================================= */

$("#confirmPurchaseBtn")
  ?.addEventListener(
    "click",
    purchaseWallpaper
  );


/* =========================================================
   BACK BUTTONS
========================================================= */

$("#checkoutBack")
  ?.addEventListener(
    "click",
    () => {

      openPage(
        "detail"
      );

    }
  );


$("#certificateBack")
  ?.addEventListener(
    "click",
    () => {

      openPage(
        "vault"
      );

    }
  );


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeMenu();

      closeAuthModal();

    }

  }
);


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function init() {

  console.log(
    "%cWALPAP",
    "font-size:28px;font-weight:bold"
  );


  console.log(
    "Premium Digital Wallpaper Marketplace"
  );


  /*
   * Load public wallpapers immediately.
   */

  await loadWallpapers();


  /*
   * Initial UI.
   */

  renderAll();


  /*
   * Home page.
   */

  openPage(
    "home"
  );

}


init();


/* =========================================================
   DEBUG API
========================================================= */

window.WALPAP = {

  state,

  auth,

  db,

  storage,

  loadWallpapers,

  loadUserVault,

  renderAll,

  openPage,

  openWallpaper,

  purchaseWallpaper,

  loginGoogle,

  loginGuest,

  logout

};


/* =========================================================
   END WALPAP APP.JS
========================================================= */
