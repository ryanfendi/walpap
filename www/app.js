/* =========================================================
   WALPAP V6
   PREMIUM DIGITAL WALLPAPER MARKETPLACE
   FIRESTORE EDITION
   =========================================================

   FIRESTORE ADALAH SUMBER KEBENARAN UNTUK:
   - User
   - Balance
   - Wallpapers
   - Purchases
   - Vault
   - Favorites

   Tidak menggunakan:
   - Replit API
   - server.js
   - local API

   FIRESTORE COLLECTIONS:

   users/{userId}
   wallpapers/{wallpaperId}
   purchases/{purchaseId}
   favorites/{favoriteId}

   ========================================================= */


/* =========================================================
   FIREBASE IMPORT
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  addDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   =========================================================
   GANTI DENGAN CONFIG DARI FIREBASE CONSOLE

   Firebase Console
   Project settings
   Your apps
   Web app
   SDK setup and configuration
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyAr6hebgw-T4Tr3gWZEXwJ1PycC8mVQt4k",
  authDomain: "walpape.firebaseapp.com",
  projectId: "walpape",
  storageBucket: "walpape.firebasestorage.app",
  messagingSenderId: "131497116491",
  appId: "1:131497116491:web:ae4a406c0fc50b6f23dece"
};


/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

let firebaseApp = null;
let db = null;

let firestoreReady = false;

try {
  firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  firestoreReady = true;
  console.log("[WALPAP] Firebase initialized");
} catch (error) {
  firestoreReady = false;
  console.error("[WALPAP] Firebase initialization failed:", error);
}


/* =========================================================
   CONFIG
   ========================================================= */

const TEST_USER_ID =
  "5be6256e-a996-46e0-889a-7500e65d2db0";

const STORAGE_USER_ID =
  "walpap_user_id";

const STORAGE_USERNAME =
  "walpap_username";

const STORAGE_BALANCE =
  "walpap_balance";

const STORAGE_OWNED =
  "walpap_owned";

const STORAGE_FAVORITES =
  "walpap_favorites";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let wallpapers = [];

let vaultItems = [];

let userId =
  localStorage.getItem(STORAGE_USER_ID) ||
  TEST_USER_ID;

let username =
  localStorage.getItem(STORAGE_USERNAME) ||
  "";

let balance = 0;

let owned = [];

let favorites = [];

let currentWallpaper = null;

let currentFilter = "all";

let apiOnline = false;

let toastTimer = null;

let refreshing = false;


/* =========================================================
   DEMO DATA
   =========================================================
   Hanya fallback visual jika diperlukan.
   DATA MARKETPLACE TETAP DARI FIRESTORE.
   ========================================================= */

const DEMO_WALLPAPERS = [
  {
    id: "demo-1",
    title: "Cyber Neon",
    creator: "WALPAP",
    creatorId: "demo",
    rarity: "Rare",
    price: 15000,
    edition: "1 / 100",
    editionLimit: 100,
    sold: 0,
    favoriteCount: 0,
    soldOut: false,
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=90"
  },
  {
    id: "demo-2",
    title: "Dark Galaxy",
    creator: "WALPAP",
    creatorId: "demo",
    rarity: "Epic",
    price: 25000,
    edition: "1 / 50",
    editionLimit: 50,
    sold: 0,
    favoriteCount: 0,
    soldOut: false,
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=90"
  },
  {
    id: "demo-3",
    title: "Minimal Black",
    creator: "WALPAP",
    creatorId: "demo",
    rarity: "Legendary",
    price: 50000,
    edition: "1 / 10",
    editionLimit: 10,
    sold: 0,
    favoriteCount: 0,
    soldOut: false,
    image:
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1200&q=90"
  }
];


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  console.log("[WALPAP] Starting...");

  loadLocalCache();

  renderInitialUI();

  await checkAPI();

  await initializeUser();

  await loadUserFromAPI();

  await loadWallpapers();

  await syncFavorites();

  await syncVault();

  renderAll();

  setupKeyboard();

  setupVisibilityRefresh();

  setupAutoRefresh();

  console.log("[WALPAP] Ready");
});


/* =========================================================
   LOCAL CACHE
   ========================================================= */

function loadLocalCache() {

  try {

    const savedBalance =
      localStorage.getItem(STORAGE_BALANCE);

    if (savedBalance !== null) {
      balance = Number(savedBalance) || 0;
    }

  } catch (error) {
    console.warn(
      "[WALPAP] Balance cache error:",
      error
    );
  }


  try {

    const savedOwned =
      localStorage.getItem(STORAGE_OWNED);

    if (savedOwned) {
      const parsed = JSON.parse(savedOwned);

      if (Array.isArray(parsed)) {
        owned = parsed;
      }
    }

  } catch (error) {
    owned = [];
  }


  try {

    const savedFavorites =
      localStorage.getItem(STORAGE_FAVORITES);

    if (savedFavorites) {

      const parsed =
        JSON.parse(savedFavorites);

      if (Array.isArray(parsed)) {
        favorites = parsed;
      }
    }

  } catch (error) {
    favorites = [];
  }
}


/* =========================================================
   SAVE CACHE
   ========================================================= */

function saveBalance() {

  try {

    localStorage.setItem(
      STORAGE_BALANCE,
      String(balance)
    );

  } catch (error) {
    console.warn(error);
  }
}


function saveOwned() {

  try {

    localStorage.setItem(
      STORAGE_OWNED,
      JSON.stringify(owned)
    );

  } catch (error) {
    console.warn(error);
  }
}


function saveFavorites() {

  try {

    localStorage.setItem(
      STORAGE_FAVORITES,
      JSON.stringify(favorites)
    );

  } catch (error) {
    console.warn(error);
  }
}


/* =========================================================
   INITIAL UI
   ========================================================= */

function renderInitialUI() {

  renderBalance();

  renderUsername();

  renderFavoriteCount();

}


/* =========================================================
   CHECK FIRESTORE
   ========================================================= */

async function checkAPI() {

  if (!firestoreReady || !db) {

    apiOnline = false;

    return false;
  }

  try {

    /*
      Membaca user document sebagai test koneksi.
      Jika document belum ada tetapi permission OK,
      Firestore tetap dianggap online.
    */

    await getDoc(
      doc(db, "users", userId)
    );

    apiOnline = true;

    console.log(
      "[WALPAP] Firestore online"
    );

    return true;

  } catch (error) {

    apiOnline = false;

    console.error(
      "[WALPAP] Firestore check failed:",
      error
    );

    return false;
  }
}


/* =========================================================
   FIRESTORE REQUEST HELPER
   ========================================================= */

async function firestoreRequest(action) {

  if (!firestoreReady || !db) {

    throw new Error(
      "Firestore belum dikonfigurasi."
    );
  }

  try {

    const result =
      await action();

    apiOnline = true;

    return result;

  } catch (error) {

    apiOnline = false;

    console.error(
      "[WALPAP] Firestore error:",
      error
    );

    throw error;
  }
}


/* =========================================================
   INITIALIZE USER
   ========================================================= */

async function initializeUser() {

  try {

    if (!userId) {

      userId = TEST_USER_ID;

      localStorage.setItem(
        STORAGE_USER_ID,
        userId
      );
    }

    const userRef =
      doc(db, "users", userId);

    const snap =
      await getDoc(userRef);

    if (!snap.exists()) {

      console.warn(
        "[WALPAP] User tidak ditemukan:",
        userId
      );

      showToast(
        "User WALPAP belum ditemukan di Firestore."
      );

      return null;
    }

    const data = snap.data();

    username =
      data.username ||
      data.name ||
      username ||
      "WALPAP USER";

    balance =
      Number(data.balance) || 0;

    localStorage.setItem(
      STORAGE_USER_ID,
      userId
    );

    localStorage.setItem(
      STORAGE_USERNAME,
      username
    );

    saveBalance();

    return data;

  } catch (error) {

    console.error(
      "[WALPAP] initializeUser:",
      error
    );

    showToast(
      "Gagal memuat akun."
    );

    return null;
  }
}


/* =========================================================
   LOAD USER
   =========================================================
   Nama function dipertahankan sebagai loadUserFromAPI
   agar kompatibel dengan versi app.js sebelumnya.
   Tetapi sekarang membaca Firestore.
   ========================================================= */

async function loadUserFromAPI() {

  try {

    const userRef =
      doc(db, "users", userId);

    const snap =
      await getDoc(userRef);

    if (!snap.exists()) {

      console.warn(
        "[WALPAP] Firestore user tidak ada."
      );

      return null;
    }

    const data = snap.data();

    /*
      FIRESTORE = SOURCE OF TRUTH
      Jangan menggunakan localStorage sebagai saldo utama.
    */

    balance =
      Number(data.balance) || 0;

    username =
      data.username ||
      data.name ||
      username ||
      "WALPAP USER";

    saveBalance();

    localStorage.setItem(
      STORAGE_USERNAME,
      username
    );

    renderBalance();

    renderUsername();

    return data;

  } catch (error) {

    console.error(
      "[WALPAP] loadUserFromAPI:",
      error
    );

    return null;
  }
}


/* =========================================================
   LOAD WALLPAPERS
   ========================================================= */

async function loadWallpapers() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "wallpapers")
      );

    const result = [];

    snapshot.forEach((docSnap) => {

      const data =
        docSnap.data();

      result.push(
        normalizeWallpaper({
          id: docSnap.id,
          ...data
        })
      );

    });

    wallpapers = result;

    console.log(
      "[WALPAP] Wallpapers:",
      wallpapers.length
    );

    renderWallpaperGrid();

    return wallpapers;

  } catch (error) {

    console.error(
      "[WALPAP] loadWallpapers:",
      error
    );

    wallpapers = [];

    renderWallpaperGrid();

    showToast(
      "Gagal memuat wallpaper."
    );

    return [];
  }
}


/* =========================================================
   NORMALIZE WALLPAPER
   ========================================================= */

function normalizeWallpaper(item) {

  const data = item || {};

  const sold =
    Number(
      data.editionsSold ??
      data.sold ??
      0
    ) || 0;

  const editionLimit =
    data.editionLimit ??
    data.editions ??
    data.limit ??
    0;

  let soldOut = false;

  if (
    typeof editionLimit === "number" &&
    editionLimit > 0
  ) {
    soldOut =
      sold >= editionLimit;
  }

  const image =
    data.imageUrl ||
    data.image ||
    data.url ||
    data.thumbnail ||
    "";

  const creator =
    data.creatorName ||
    data.creator ||
    data.author ||
    "WALPAP Creator";

  const creatorId =
    data.creatorId ||
    data.ownerId ||
    data.userId ||
    "";

  const price =
    Number(data.price) || 0;

  let edition = "";

  if (
    data.edition !== undefined &&
    data.edition !== null
  ) {

    edition =
      String(data.edition);

  } else if (
    typeof editionLimit === "number" &&
    editionLimit > 0
  ) {

    edition =
      `${sold + 1} / ${editionLimit}`;

  } else {

    edition = "Unlimited";
  }

  return {

    id:
      String(
        data.id ||
        data.wallpaperId ||
        ""
      ),

    title:
      data.title ||
      data.name ||
      "Untitled Wallpaper",

    creator,

    creatorId,

    rarity:
      data.rarity ||
      "Common",

    price,

    edition,

    editionLimit,

    sold,

    favoriteCount:
      Number(
        data.favoriteCount
      ) || 0,

    soldOut,

    image,

    description:
      data.description ||
      "",

    createdAt:
      data.createdAt ||
      null
  };
}


/* =========================================================
   RARITY LIMIT
   ========================================================= */

function getRarityLimit(rarity) {

  switch (
    String(rarity || "").toLowerCase()
  ) {

    case "common":
      return 1000;

    case "uncommon":
      return 500;

    case "rare":
      return 100;

    case "epic":
      return 50;

    case "legendary":
      return 10;

    default:
      return 100;
  }
}


/* =========================================================
   NUMBER HELPER
   ========================================================= */

function toNumber(value) {

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (value === null || value === undefined) {
    return 0;
  }

  const cleaned =
    String(value)
      .replace(/[^\d.-]/g, "");

  const number =
    Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}


/* =========================================================
   RUPIAH
   ========================================================= */

function formatRupiah(value) {

  const number =
    toNumber(value);

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(number);
}


/* =========================================================
   BALANCE UI
   ========================================================= */

function renderBalance() {

  const selectors = [
    "#balance",
    "#walletBalance",
    "#userBalance",
    ".balance-value",
    "[data-balance]"
  ];

  selectors.forEach((selector) => {

    document
      .querySelectorAll(selector)
      .forEach((element) => {

        element.textContent =
          formatRupiah(balance);

      });

  });
}


/* =========================================================
   USERNAME UI
   ========================================================= */

function renderUsername() {

  const selectors = [
    "#username",
    "#profileName",
    "#userName",
    ".username",
    "[data-username]"
  ];

  selectors.forEach((selector) => {

    document
      .querySelectorAll(selector)
      .forEach((element) => {

        element.textContent =
          username || "WALPAP USER";

      });

  });
}


/* =========================================================
   FAVORITE COUNT
   ========================================================= */

function renderFavoriteCount() {

  const elements =
    document.querySelectorAll(
      "[data-favorite-count], #favoriteCount"
    );

  elements.forEach((element) => {

    element.textContent =
      favorites.length;

  });
}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {

  renderBalance();

  renderUsername();

  renderFavoriteCount();

  renderWallpaperGrid();

}


/* =========================================================
   WALLPAPER GRID
   ========================================================= */

function renderWallpaperGrid() {

  const containers = [
    "#wallpaperGrid",
    "#wallpapers",
    ".wallpaper-grid",
    "[data-wallpaper-grid]"
  ];

  let container = null;

  for (const selector of containers) {

    container =
      document.querySelector(selector);

    if (container) break;
  }

  if (!container) {
    return;
  }

  let list = [...wallpapers];

  if (currentFilter !== "all") {

    list =
      list.filter(
        (wallpaper) =>
          String(
            wallpaper.rarity
          ).toLowerCase() ===
          String(
            currentFilter
          ).toLowerCase()
      );
  }

  if (!list.length) {

    container.innerHTML = `
      <div class="walpap-empty">
        <div style="font-size:40px">🖼️</div>
        <p>Belum ada wallpaper.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    list
      .map(
        (wallpaper) =>
          renderWallpaperCard(wallpaper)
      )
      .join("");
}


/* =========================================================
   WALLPAPER CARD
   ========================================================= */

function renderWallpaperCard(wallpaper) {

  const isOwned =
    owned.includes(wallpaper.id);

  const isFavorite =
    favorites.includes(wallpaper.id);

  const image =
    escapeAttribute(
      wallpaper.image ||
      "https://via.placeholder.com/800x1200?text=WALPAP"
    );

  const title =
    escapeHTML(wallpaper.title);

  const creator =
    escapeHTML(wallpaper.creator);

  const rarity =
    escapeHTML(wallpaper.rarity);

  const price =
    formatRupiah(wallpaper.price);

  const disabled =
    wallpaper.soldOut ||
    isOwned;

  let actionText =
    isOwned
      ? "OWNED"
      : wallpaper.soldOut
        ? "SOLD OUT"
        : "BUY";

  return `
    <article
      class="wallpaper-card"
      data-wallpaper-id="${escapeAttribute(wallpaper.id)}"
    >

      <div
        class="wallpaper-image-wrap"
        onclick="openDetail('${escapeJS(wallpaper.id)}')"
      >

        <img
          class="wallpaper-image"
          src="${image}"
          alt="${escapeAttribute(title)}"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/800x1200?text=WALPAP'"
        >

        <span class="rarity-badge">
          ${rarity}
        </span>

        ${
          isOwned
            ? `<span class="owned-badge">OWNED</span>`
            : ""
        }

      </div>

      <div class="wallpaper-info">

        <h3>
          ${title}
        </h3>

        <p>
          by ${creator}
        </p>

        <div class="wallpaper-meta">

          <span>
            ${escapeHTML(
              String(
                wallpaper.edition
              )
            )}
          </span>

          <span>
            ${price}
          </span>

        </div>

        <div class="wallpaper-actions">

          <button
            type="button"
            class="favorite-btn ${
              isFavorite
                ? "active"
                : ""
            }"
            onclick="toggleFavorite('${escapeJS(wallpaper.id)}'); event.stopPropagation();"
          >
            ${
              isFavorite
                ? "♥"
                : "♡"
            }
          </button>

          <button
            type="button"
            class="buy-btn"
            ${
              disabled
                ? "disabled"
                : ""
            }
            onclick="buyWallpaper('${escapeJS(wallpaper.id)}'); event.stopPropagation();"
          >
            ${actionText}
          </button>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   FILTER
   ========================================================= */

function setFilter(filter) {

  currentFilter =
    filter || "all";

  renderWallpaperGrid();
}


/* =========================================================
   DETAIL
   ========================================================= */

function openDetail(id) {

  let wallpaper =
    wallpapers.find(
      (item) =>
        item.id === String(id)
    );

  if (!wallpaper) {

    wallpaper =
      vaultItems.find(
        (item) =>
          item.id === String(id)
      );
  }

  if (!wallpaper) {

    showToast(
      "Wallpaper tidak ditemukan."
    );

    return;
  }

  currentWallpaper =
    wallpaper;

  const modal =
    document.querySelector(
      "#detailModal"
    ) ||
    document.querySelector(
      ".detail-modal"
    );

  if (!modal) {

    showWallpaperDetailFallback(
      wallpaper
    );

    return;
  }

  fillDetailModal(
    modal,
    wallpaper
  );

  modal.classList.add("active");

  modal.style.display = "flex";
}


/* =========================================================
   DETAIL MODAL
   ========================================================= */

function fillDetailModal(
  modal,
  wallpaper
) {

  const image =
    modal.querySelector(
      "[data-detail-image], #detailImage, .detail-image"
    );

  const title =
    modal.querySelector(
      "[data-detail-title], #detailTitle, .detail-title"
    );

  const creator =
    modal.querySelector(
      "[data-detail-creator], #detailCreator, .detail-creator"
    );

  const price =
    modal.querySelector(
      "[data-detail-price], #detailPrice, .detail-price"
    );

  const rarity =
    modal.querySelector(
      "[data-detail-rarity], #detailRarity, .detail-rarity"
    );

  const edition =
    modal.querySelector(
      "[data-detail-edition], #detailEdition, .detail-edition"
    );

  const description =
    modal.querySelector(
      "[data-detail-description], #detailDescription, .detail-description"
    );

  if (image) {

    image.src =
      wallpaper.image ||
      "https://via.placeholder.com/800x1200?text=WALPAP";

  }

  if (title) {
    title.textContent =
      wallpaper.title;
  }

  if (creator) {
    creator.textContent =
      wallpaper.creator;
  }

  if (price) {
    price.textContent =
      formatRupiah(
        wallpaper.price
      );
  }

  if (rarity) {
    rarity.textContent =
      wallpaper.rarity;
  }

  if (edition) {
    edition.textContent =
      wallpaper.edition;
  }

  if (description) {
    description.textContent =
      wallpaper.description ||
      "Premium digital wallpaper WALPAP.";
  }

  const buyButton =
    modal.querySelector(
      "[data-detail-buy], #detailBuy, .detail-buy"
    );

  if (buyButton) {

    const isOwned =
      owned.includes(
        wallpaper.id
      );

    const disabled =
      wallpaper.soldOut ||
      isOwned;

    buyButton.disabled =
      disabled;

    buyButton.textContent =
      isOwned
        ? "OWNED"
        : wallpaper.soldOut
          ? "SOLD OUT"
          : "BUY NOW";

    buyButton.onclick =
      () => buyWallpaper(
        wallpaper.id
      );
  }
}


/* =========================================================
   CLOSE DETAIL
   ========================================================= */

function closeDetail() {

  const modals = [
    document.querySelector("#detailModal"),
    document.querySelector(".detail-modal")
  ];

  modals.forEach((modal) => {

    if (!modal) return;

    modal.classList.remove("active");

    modal.style.display = "none";
  });

  currentWallpaper = null;
}


/* =========================================================
   FALLBACK DETAIL
   ========================================================= */

function showWallpaperDetailFallback(
  wallpaper
) {

  const existing =
    document.querySelector(
      "#walpapGeneratedDetail"
    );

  if (existing) {
    existing.remove();
  }

  const wrapper =
    document.createElement("div");

  wrapper.id =
    "walpapGeneratedDetail";

  wrapper.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99999;
    background:rgba(0,0,0,.85);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
  `;

  wrapper.innerHTML = `
    <div
      style="
        width:min(500px,100%);
        max-height:90vh;
        overflow:auto;
        background:#111;
        border-radius:20px;
        padding:20px;
        color:#fff;
      "
    >

      <button
        onclick="document.getElementById('walpapGeneratedDetail').remove()"
        style="
          float:right;
          background:none;
          border:0;
          color:#fff;
          font-size:28px;
        "
      >
        ×
      </button>

      <img
        src="${escapeAttribute(wallpaper.image)}"
        style="
          width:100%;
          max-height:500px;
          object-fit:cover;
          border-radius:15px;
        "
      >

      <h2>
        ${escapeHTML(wallpaper.title)}
      </h2>

      <p>
        ${escapeHTML(wallpaper.creator)}
      </p>

      <p>
        ${escapeHTML(wallpaper.rarity)}
      </p>

      <h3>
        ${formatRupiah(wallpaper.price)}
      </h3>

      <button
        onclick="buyWallpaper('${escapeJS(wallpaper.id)}')"
        ${
          wallpaper.soldOut ||
          owned.includes(wallpaper.id)
            ? "disabled"
            : ""
        }
        style="
          width:100%;
          padding:15px;
          border:0;
          border-radius:12px;
          font-weight:700;
        "
      >
        ${
          owned.includes(wallpaper.id)
            ? "OWNED"
            : wallpaper.soldOut
              ? "SOLD OUT"
              : "BUY NOW"
        }
      </button>

    </div>
  `;

  document.body.appendChild(
    wrapper
  );
}


/* =========================================================
   BUY WALLPAPER
   ========================================================= */

async function buyWallpaper(
  wallpaperId
) {

  const id =
    String(wallpaperId);

  const wallpaper =
    wallpapers.find(
      (item) => item.id === id
    );

  if (!wallpaper) {

    showToast(
      "Wallpaper tidak ditemukan."
    );

    return;
  }

  if (owned.includes(id)) {

    showToast(
      "Wallpaper sudah ada di Vault."
    );

    return;
  }

  if (wallpaper.soldOut) {

    showToast(
      "Wallpaper sudah SOLD OUT."
    );

    return;
  }

  const price =
    Number(wallpaper.price) || 0;

  if (price < 0) {

    showToast(
      "Harga wallpaper tidak valid."
    );

    return;
  }


  /* -------------------------------------------------------
     SELF PURCHASE PROTECTION
     ------------------------------------------------------- */

  if (
    wallpaper.creatorId &&
    wallpaper.creatorId === userId
  ) {

    showToast(
      "Creator tidak dapat membeli wallpaper sendiri."
    );

    return;
  }


  /* -------------------------------------------------------
     CONFIRM
     ------------------------------------------------------- */

  const confirmed =
    window.confirm(
      `Beli "${wallpaper.title}" seharga ${formatRupiah(price)}?`
    );

  if (!confirmed) {
    return;
  }


  /* -------------------------------------------------------
     TRANSACTION
     ------------------------------------------------------- */

  try {

    showToast(
      "Memproses pembelian..."
    );


    const userRef =
      doc(db, "users", userId);

    const wallpaperRef =
      doc(
        db,
        "wallpapers",
        id
      );


    /*
      Purchase ID dibuat deterministic.

      Artinya satu user hanya dapat membeli
      satu wallpaper satu kali.

      Contoh:

      5be625..._wallpaper123
    */

    const purchaseId =
      `${userId}_${id}`;

    const purchaseRef =
      doc(
        db,
        "purchases",
        purchaseId
      );


    const result =
      await runTransaction(
        db,
        async (transaction) => {

          const userSnap =
            await transaction.get(
              userRef
            );

          const wallpaperSnap =
            await transaction.get(
              wallpaperRef
            );

          const purchaseSnap =
            await transaction.get(
              purchaseRef
            );


          if (!userSnap.exists()) {

            throw new Error(
              "USER_NOT_FOUND"
            );
          }

          if (!wallpaperSnap.exists()) {

            throw new Error(
              "WALLPAPER_NOT_FOUND"
            );
          }

          if (purchaseSnap.exists()) {

            throw new Error(
              "ALREADY_OWNED"
            );
          }


          const userData =
            userSnap.data();

          const wallpaperData =
            wallpaperSnap.data();


          const currentBalance =
            Number(
              userData.balance
            ) || 0;


          const currentSold =
            Number(
              wallpaperData.editionsSold ??
              wallpaperData.sold ??
              0
            ) || 0;


          const editionLimit =
            Number(
              wallpaperData.editionLimit
            ) || 0;


          if (
            editionLimit > 0 &&
            currentSold >= editionLimit
          ) {

            throw new Error(
              "SOLD_OUT"
            );
          }


          if (
            currentBalance <
            price
          ) {

            throw new Error(
              "INSUFFICIENT_BALANCE"
            );
          }


          const newBalance =
            currentBalance -
            price;


          const newSold =
            currentSold +
            1;


          const editionNumber =
            newSold;


          /*
            USER BALANCE
          */

          transaction.update(
            userRef,
            {
              balance:
                newBalance
            }
          );


          /*
            WALLPAPER EDITION
          */

          transaction.update(
            wallpaperRef,
            {
              editionsSold:
                newSold
            }
          );


          /*
            PURCHASE / VAULT
          */

          transaction.set(
            purchaseRef,
            {

              userId,

              wallpaperId:
                id,

              wallpaperTitle:
                wallpaperData.title ||
                wallpaperData.name ||
                "",

              wallpaperImage:
                wallpaperData.imageUrl ||
                wallpaperData.image ||
                "",

              creatorId:
                wallpaperData.creatorId ||
                "",

              creatorName:
                wallpaperData.creatorName ||
                wallpaperData.creator ||
                "",

              rarity:
                wallpaperData.rarity ||
                "Common",

              editionNumber,

              edition:
                editionLimit > 0
                  ? `${editionNumber} / ${editionLimit}`
                  : "Unlimited",

              price,

              createdAt:
                serverTimestamp()
            }
          );


          return {
            newBalance,
            editionNumber
          };

        }
      );


    /* -------------------------------------------------------
       LOCAL STATE ONLY AS CACHE
       ------------------------------------------------------- */

    balance =
      result.newBalance;

    saveBalance();


    if (
      !owned.includes(id)
    ) {

      owned.push(id);

    }

    saveOwned();


    /* -------------------------------------------------------
       CLOSE MODAL
       ------------------------------------------------------- */

    closeDetail();


    /* -------------------------------------------------------
       RELOAD FROM FIRESTORE
       ------------------------------------------------------- */

    await loadUserFromAPI();

    await loadWallpapers();

    await syncVault();


    renderAll();


    showToast(
      `Pembelian berhasil! Edisi #${result.editionNumber}`
    );


  } catch (error) {

    console.error(
      "[WALPAP] Purchase failed:",
      error
    );


    switch (
      error.message
    ) {

      case "USER_NOT_FOUND":

        showToast(
          "User tidak ditemukan."
        );

        break;


      case "WALLPAPER_NOT_FOUND":

        showToast(
          "Wallpaper tidak ditemukan."
        );

        break;


      case "ALREADY_OWNED":

        await syncVault();

        showToast(
          "Wallpaper sudah ada di Vault."
        );

        break;


      case "SOLD_OUT":

        await loadWallpapers();

        showToast(
          "Wallpaper sudah SOLD OUT."
        );

        break;


      case "INSUFFICIENT_BALANCE":

        await loadUserFromAPI();

        showToast(
          `Saldo tidak cukup. Saldo kamu ${formatRupiah(balance)}.`
        );

        break;


      default:

        if (
          error.code ===
          "permission-denied"
        ) {

          showToast(
            "Firestore permission denied. Periksa Security Rules."
          );

        } else {

          showToast(
            "Pembelian gagal. Silakan coba lagi."
          );

        }

        break;
    }
  }
}


/* =========================================================
   FAVORITE DOCUMENT ID
   ========================================================= */

function favoriteDocumentId(
  wallpaperId
) {

  return `${userId}_${wallpaperId}`;
}


/* =========================================================
   SYNC FAVORITES
   ========================================================= */

async function syncFavorites() {

  try {

    const favoritesRef =
      collection(
        db,
        "favorites"
      );

    const q =
      query(
        favoritesRef,
        where(
          "userId",
          "==",
          userId
        )
      );

    const snapshot =
      await getDocs(q);

    favorites = [];

    snapshot.forEach(
      (docSnap) => {

        const data =
          docSnap.data();

        if (data.wallpaperId) {

          favorites.push(
            String(
              data.wallpaperId
            )
          );
        }
      }
    );

    saveFavorites();

    renderFavoriteCount();

    renderWallpaperGrid();

    return favorites;

  } catch (error) {

    console.error(
      "[WALPAP] syncFavorites:",
      error
    );

    return favorites;
  }
}


/* =========================================================
   TOGGLE FAVORITE
   ========================================================= */

async function toggleFavorite(
  wallpaperId
) {

  const id =
    String(wallpaperId);

  const favoriteId =
    favoriteDocumentId(id);

  const favoriteRef =
    doc(
      db,
      "favorites",
      favoriteId
    );

  try {

    const existing =
      favorites.includes(id);


    if (existing) {

      await deleteDoc(
        favoriteRef
      );

      favorites =
        favorites.filter(
          item => item !== id
        );

      showToast(
        "Dihapus dari Favorites."
      );

    } else {

      await setDoc(
        favoriteRef,
        {
          userId,

          wallpaperId:
            id,

          createdAt:
            serverTimestamp()
        }
      );

      favorites.push(id);

      showToast(
        "Ditambahkan ke Favorites."
      );
    }


    saveFavorites();

    renderFavoriteCount();

    renderWallpaperGrid();

  } catch (error) {

    console.error(
      "[WALPAP] toggleFavorite:",
      error
    );

    showToast(
      "Gagal mengubah favorite."
    );
  }
}


/* =========================================================
   SYNC VAULT
   ========================================================= */

async function syncVault() {

  try {

    const purchasesRef =
      collection(
        db,
        "purchases"
      );

    const q =
      query(
        purchasesRef,
        where(
          "userId",
          "==",
          userId
        )
      );

    const snapshot =
      await getDocs(q);

    const result = [];

    for (
      const purchaseSnap
      of snapshot.docs
    ) {

      const purchase =
        purchaseSnap.data();

      const wallpaperId =
        String(
          purchase.wallpaperId ||
          ""
        );

      let wallpaper =
        wallpapers.find(
          item =>
            item.id ===
            wallpaperId
        );


      /*
        Jika belum ada di marketplace
        tetap ambil dari Firestore.
      */

      if (!wallpaper && wallpaperId) {

        try {

          const wallpaperSnap =
            await getDoc(
              doc(
                db,
                "wallpapers",
                wallpaperId
              )
            );

          if (
            wallpaperSnap.exists()
          ) {

            wallpaper =
              normalizeWallpaper({
                id:
                  wallpaperSnap.id,

                ...wallpaperSnap.data()
              });
          }

        } catch (error) {

          console.warn(
            "[WALPAP] Vault wallpaper fetch failed:",
            error
          );
        }
      }


      /*
        Fallback menggunakan snapshot
        yang tersimpan pada purchase.
      */

      if (!wallpaper) {

        wallpaper =
          normalizeWallpaper({

            id:
              wallpaperId,

            title:
              purchase.wallpaperTitle ||
              "Purchased Wallpaper",

            creator:
              purchase.creatorName ||
              "WALPAP Creator",

            creatorId:
              purchase.creatorId ||
              "",

            rarity:
              purchase.rarity ||
              "Common",

            price:
              purchase.price ||
              0,

            edition:
              purchase.edition ||
              purchase.editionNumber ||
              "Owned",

            image:
              purchase.wallpaperImage ||
              ""

          });
      }


      if (wallpaper) {

        result.push({

          ...wallpaper,

          purchaseId:
            purchaseSnap.id,

          purchasePrice:
            Number(
              purchase.price
            ) || 0,

          editionNumber:
            purchase.editionNumber ||
            null,

          purchaseEdition:
            purchase.edition ||
            wallpaper.edition,

          purchaseCreatedAt:
            purchase.createdAt ||
            null

        });
      }
    }


    vaultItems =
      result;


    /*
      OWNED selalu berdasarkan Firestore.
    */

    owned =
      [
        ...new Set(
          result
            .map(
              item =>
                item.id
            )
            .filter(Boolean)
        )
      ];


    saveOwned();

    renderVault(
      vaultItems
    );

    renderWallpaperGrid();

    return vaultItems;

  } catch (error) {

    console.error(
      "[WALPAP] syncVault:",
      error
    );

    renderVault([]);

    return [];
  }
}


/* =========================================================
   RENDER VAULT
   ========================================================= */

async function renderVault(
  items = null
) {

  if (items === null) {

    items =
      await syncVault();

    return;
  }

  const containers = [
    "#vaultGrid",
    "#myVault",
    ".vault-grid",
    "[data-vault-grid]"
  ];

  let container = null;

  for (
    const selector
    of containers
  ) {

    container =
      document.querySelector(
        selector
      );

    if (container) break;
  }

  if (!container) {
    return;
  }


  if (!items.length) {

    container.innerHTML = `
      <div class="walpap-empty">

        <div style="font-size:40px">
          🔐
        </div>

        <h3>
          My Vault masih kosong
        </h3>

        <p>
          Wallpaper yang kamu beli akan muncul di sini.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    items
      .map(
        item =>
          renderVaultCard(item)
      )
      .join("");
}


/* =========================================================
   VAULT CARD
   ========================================================= */

function renderVaultCard(
  item
) {

  const image =
    escapeAttribute(
      item.image ||
      "https://via.placeholder.com/800x1200?text=WALPAP"
    );

  const title =
    escapeHTML(
      item.title
    );

  const edition =
    escapeHTML(
      String(
        item.purchaseEdition ||
        item.edition ||
        "Owned"
      )
    );

  const creator =
    escapeHTML(
      item.creator
    );

  return `
    <article
      class="vault-card"
      data-vault-id="${escapeAttribute(item.id)}"
    >

      <div
        onclick="openDetail('${escapeJS(item.id)}')"
        style="cursor:pointer"
      >

        <img
          src="${image}"
          alt="${escapeAttribute(title)}"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/800x1200?text=WALPAP'"
        >

      </div>

      <div class="vault-info">

        <h3>
          ${title}
        </h3>

        <p>
          ${creator}
        </p>

        <span>
          Edition ${edition}
        </span>

        <button
          type="button"
          onclick="setWallpaperFromVault('${escapeJS(item.id)}')"
        >
          SET WALLPAPER
        </button>

      </div>

    </article>
  `;
}


/* =========================================================
   SET WALLPAPER FROM VAULT
   ========================================================= */

async function setWallpaperFromVault(
  wallpaperId
) {

  const item =
    vaultItems.find(
      wallpaper =>
        wallpaper.id ===
        String(wallpaperId)
    );

  if (!item) {

    showToast(
      "Wallpaper tidak ditemukan di Vault."
    );

    return;
  }

  await setWallpaper(
    item
  );
}


/* =========================================================
   SET WALLPAPER
   ========================================================= */

async function setWallpaper(
  wallpaper
) {

  if (!wallpaper) {
    return;
  }

  const image =
    wallpaper.image;

  if (!image) {

    showToast(
      "File wallpaper tidak tersedia."
    );

    return;
  }


  /* -------------------------------------------------------
     CAPACITOR PLUGIN
     ------------------------------------------------------- */

  try {

    if (
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.WalpapWallpaper
    ) {

      const plugin =
        window.Capacitor.Plugins.WalpapWallpaper;

      if (
        typeof plugin.setWallpaper ===
        "function"
      ) {

        await plugin.setWallpaper({
          url: image
        });

        showToast(
          "Wallpaper berhasil dipasang."
        );

        return;
      }
    }

  } catch (error) {

    console.warn(
      "[WALPAP] Native wallpaper plugin failed:",
      error
    );
  }


  /* -------------------------------------------------------
     BROWSER FALLBACK
     ------------------------------------------------------- */

  try {

    const response =
      await fetch(image);

    const blob =
      await response.blob();

    const blobUrl =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href =
      blobUrl;

    link.download =
      `${sanitizeFilename(
        wallpaper.title
      )}.jpg`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      blobUrl
    );

    showToast(
      "Wallpaper diunduh."
    );

  } catch (error) {

    console.error(
      "[WALPAP] Download failed:",
      error
    );

    /*
      Jika CORS mencegah fetch,
      buka image langsung.
    */

    window.open(
      image,
      "_blank"
    );

    showToast(
      "Wallpaper dibuka di browser."
    );
  }
}


/* =========================================================
   WALLET
   ========================================================= */

async function openWallet() {

  await loadUserFromAPI();

  renderBalance();

  const modal =
    document.querySelector(
      "#walletModal"
    );

  if (modal) {

    modal.classList.add(
      "active"
    );

    modal.style.display =
      "flex";
  }

  showToast(
    `Saldo saat ini ${formatRupiah(balance)}`
  );
}


/* =========================================================
   TOP UP
   ========================================================= */

function topUp() {

  showToast(
    "Fitur Top Up perlu payment gateway."
  );
}


/* =========================================================
   PROFILE
   ========================================================= */

async function openProfile() {

  await loadUserFromAPI();

  const modal =
    document.querySelector(
      "#profileModal"
    );

  if (modal) {

    modal.classList.add(
      "active"
    );

    modal.style.display =
      "flex";
  }
}


/* =========================================================
   SEARCH
   ========================================================= */

function searchWallpapers(
  keyword
) {

  const search =
    String(
      keyword || ""
    )
      .trim()
      .toLowerCase();

  const containers = [
    "#wallpaperGrid",
    "#wallpapers",
    ".wallpaper-grid",
    "[data-wallpaper-grid]"
  ];

  let container = null;

  for (
    const selector
    of containers
  ) {

    container =
      document.querySelector(
        selector
      );

    if (container) break;
  }

  if (!container) {
    return;
  }


  let result =
    wallpapers;


  if (search) {

    result =
      wallpapers.filter(
        wallpaper => {

          const text =
            [
              wallpaper.title,
              wallpaper.creator,
              wallpaper.rarity,
              wallpaper.description
            ]
              .join(" ")
              .toLowerCase();

          return text.includes(
            search
          );
        }
      );
  }


  if (!result.length) {

    container.innerHTML = `
      <div class="walpap-empty">
        Tidak ada wallpaper ditemukan.
      </div>
    `;

    return;
  }


  container.innerHTML =
    result
      .map(
        wallpaper =>
          renderWallpaperCard(
            wallpaper
          )
      )
      .join("");
}


/* =========================================================
   CREATOR / PUBLISH
   ========================================================= */

async function publishWallpaper(
  data = null
) {

  /*
    Mendukung:
    - publishWallpaper({...})
    - membaca form jika data null
  */

  let payload =
    data;


  if (!payload) {

    payload =
      collectPublishForm();
  }


  if (!payload) {

    showToast(
      "Data wallpaper belum lengkap."
    );

    return null;
  }


  const title =
    String(
      payload.title ||
      ""
    ).trim();

  const imageUrl =
    String(
      payload.imageUrl ||
      payload.image ||
      ""
    ).trim();

  const description =
    String(
      payload.description ||
      ""
    ).trim();

  const rarity =
    payload.rarity ||
    "Common";

  let price =
    Number(
      payload.price
    ) || 0;


  if (!title) {

    showToast(
      "Judul wallpaper wajib diisi."
    );

    return null;
  }


  if (!imageUrl) {

    showToast(
      "URL gambar wallpaper wajib diisi."
    );

    return null;
  }


  if (price < 0) {
    price = 0;
  }


  const editionLimit =
    Number(
      payload.editionLimit
    ) ||
    getRarityLimit(
      rarity
    );


  try {

    const wallpaperData = {

      title,

      creatorId:
        userId,

      creatorName:
        username ||
        "WALPAP Creator",

      imageUrl,

      description,

      price,

      rarity,

      editionLimit,

      editionsSold:
        0,

      createdAt:
        serverTimestamp()
    };


    const reference =
      await addDoc(
        collection(
          db,
          "wallpapers"
        ),
        wallpaperData
      );


    showToast(
      "Wallpaper berhasil dipublish."
    );


    await loadWallpapers();


    return reference.id;

  } catch (error) {

    console.error(
      "[WALPAP] publishWallpaper:",
      error
    );

    showToast(
      "Gagal publish wallpaper."
    );

    return null;
  }
}


/* =========================================================
   COLLECT PUBLISH FORM
   ========================================================= */

function collectPublishForm() {

  const title =
    getInputValue([
      "#publishTitle",
      "#wallpaperTitle",
      "[name='title']"
    ]);

  const imageUrl =
    getInputValue([
      "#publishImage",
      "#imageUrl",
      "[name='imageUrl']",
      "[name='image']"
    ]);

  const description =
    getInputValue([
      "#publishDescription",
      "#wallpaperDescription",
      "[name='description']"
    ]);

  const rarity =
    getInputValue([
      "#publishRarity",
      "#wallpaperRarity",
      "[name='rarity']"
    ]) ||
    "Common";

  const price =
    getInputValue([
      "#publishPrice",
      "#wallpaperPrice",
      "[name='price']"
    ]);

  const editionLimit =
    getInputValue([
      "#editionLimit",
      "#publishEditionLimit",
      "[name='editionLimit']"
    ]);


  return {

    title,

    imageUrl,

    description,

    rarity,

    price:

      Number(price) || 0,

    editionLimit:

      Number(
        editionLimit
      ) ||
      getRarityLimit(
        rarity
      )
  };
}


/* =========================================================
   INPUT HELPER
   ========================================================= */

function getInputValue(
  selectors
) {

  for (
    const selector
    of selectors
  ) {

    const element =
      document.querySelector(
        selector
      );

    if (element) {

      return element.value;
    }
  }

  return "";
}


/* =========================================================
   CREATOR PANEL
   ========================================================= */

function openCreator() {

  const modal =
    document.querySelector(
      "#creatorModal"
    ) ||
    document.querySelector(
      "#publishModal"
    );

  if (!modal) {

    showToast(
      "Panel creator tidak ditemukan."
    );

    return;
  }

  modal.classList.add(
    "active"
  );

  modal.style.display =
    "flex";
}


/* =========================================================
   CLOSE MODALS
   ========================================================= */

function closeModal(
  selector
) {

  const modal =
    document.querySelector(
      selector
    );

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "active"
  );

  modal.style.display =
    "none";
}


/* =========================================================
   REFRESH EVERYTHING
   ========================================================= */

async function refreshAll() {

  if (refreshing) {
    return;
  }

  refreshing = true;

  try {

    await checkAPI();

    await loadUserFromAPI();

    await loadWallpapers();

    await syncFavorites();

    await syncVault();

    renderAll();

  } catch (error) {

    console.error(
      "[WALPAP] refreshAll:",
      error
    );

  } finally {

    refreshing = false;
  }
}


/* =========================================================
   VISIBILITY REFRESH
   ========================================================= */

function setupVisibilityRefresh() {

  document.addEventListener(
    "visibilitychange",
    async () => {

      if (
        document.visibilityState ===
        "visible"
      ) {

        await refreshAll();
      }
    }
  );
}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

function setupAutoRefresh() {

  /*
    Sinkronisasi berkala.
    Saldo/Vault tetap diambil dari Firestore.
  */

  setInterval(
    async () => {

      if (
        document.visibilityState ===
        "visible"
      ) {

        await refreshAll();
      }

    },
    30000
  );
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  message
) {

  clearTimeout(
    toastTimer
  );


  let toast =
    document.querySelector(
      "#walpapToast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "walpapToast";

    toast.style.cssText = `
      position:fixed;
      left:50%;
      bottom:25px;
      transform:translateX(-50%);
      z-index:999999;
      background:#111;
      color:#fff;
      padding:13px 18px;
      border-radius:999px;
      font-size:14px;
      font-weight:600;
      box-shadow:0 10px 40px rgba(0,0,0,.35);
      max-width:90%;
      text-align:center;
    `;

    document.body.appendChild(
      toast
    );
  }


  toast.textContent =
    String(message);


  toast.style.display =
    "block";


  toastTimer =
    setTimeout(
      () => {

        toast.style.display =
          "none";

      },
      3500
    );
}


/* =========================================================
   KEYBOARD
   ========================================================= */

function setupKeyboard() {

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Escape"
      ) {

        closeDetail();

        [
          "#walletModal",
          "#profileModal",
          "#creatorModal",
          "#publishModal"
        ]
          .forEach(
            selector =>
              closeModal(
                selector
              )
          );
      }
    }
  );
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
  value
) {

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
   ESCAPE ATTRIBUTE
   ========================================================= */

function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );
}


/* =========================================================
   ESCAPE JS
   ========================================================= */

function escapeJS(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    )
    .replace(
      /"/g,
      '\\"'
    )
    .replace(
      /\n/g,
      "\\n"
    )
    .replace(
      /\r/g,
      "\\r"
    );
}


/* =========================================================
   SANITIZE FILENAME
   ========================================================= */

function sanitizeFilename(
  value
) {

  return String(
    value || "walpap-wallpaper"
  )
    .replace(
      /[^a-z0-9-_ ]/gi,
      ""
    )
    .trim()
    .replace(
      /\s+/g,
      "-"
    )
    .slice(
      0,
      80
    ) ||
    "walpap-wallpaper";
}


/* =========================================================
   DEBUG OBJECT
   ========================================================= */

window.WALPAP = {

  get userId() {
    return userId;
  },

  get username() {
    return username;
  },

  get balance() {
    return balance;
  },

  get owned() {
    return owned;
  },

  get favorites() {
    return favorites;
  },

  get wallpapers() {
    return wallpapers;
  },

  get vault() {
    return vaultItems;
  },

  get firestoreOnline() {
    return firestoreReady &&
      apiOnline;
  },

  refresh:
    refreshAll,

  refreshUser:
    loadUserFromAPI,

  refreshWallpapers:
    loadWallpapers,

  refreshVault:
    syncVault,

  refreshFavorites:
    syncFavorites,

  buy:
    buyWallpaper,

  favorite:
    toggleFavorite,

  publish:
    publishWallpaper,

  setWallpaper:

    setWallpaperFromVault

};


/* =========================================================
   GLOBAL FUNCTIONS
   =========================================================
   Karena app.js adalah ES MODULE,
   function tidak otomatis tersedia untuk
   onclick="" di HTML.

   Maka kita expose semuanya ke window.
   ========================================================= */

Object.assign(
  window,
  {

    openDetail,

    closeDetail,

    buyWallpaper,

    toggleFavorite,

    setFilter,

    searchWallpapers,

    syncVault,

    renderVault,

    syncFavorites,

    openWallet,

    topUp,

    openProfile,

    openCreator,

    publishWallpaper,

    setWallpaper,

    setWallpaperFromVault,

    closeModal,

    refreshAll,

    showToast

  }
);


/* =========================================================
   STARTUP LOG
   ========================================================= */

console.log(
  "%cWALPAP V6 FIRESTORE",
  "font-weight:bold;font-size:18px"
);

console.log(
  "[WALPAP] User:",
  userId
);

console.log(
  "[WALPAP] Firestore:",
  firestoreReady
);
