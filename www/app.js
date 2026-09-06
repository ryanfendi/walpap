import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyAr6hebgw-T4Tr3gWZEXwJ1PycC8mVQt4k",

  authDomain:
    "walpape.firebaseapp.com",

  projectId:
    "walpape",

  storageBucket:
    "walpape.firebasestorage.app",

  messagingSenderId:
    "131497116491",

  appId:
    "1:131497116491:web:ae4a406c0fc50b6f23dece"

};


/* =========================================================
   FIREBASE INIT
========================================================= */

const firebaseApp =
  initializeApp(
    firebaseConfig
  );


const auth =
  getAuth(
    firebaseApp
  );


const db =
  getFirestore(
    firebaseApp
  );


const storage =
  getStorage(
    firebaseApp
  );


/* =========================================================
   GLOBAL
========================================================= */

let userId = null;

let username =
  localStorage.getItem(
    "walpap_username"
  ) ||
  "WALPAP User";

let balance = 0;

let wallpapers = [];

let owned = [];

let favorites =
  safeJSONParse(
    localStorage.getItem(
      "walpap_favorites"
    ),
    []
  );

let currentWallpaper = null;

let currentFilter = "all";

let firebaseReady = false;

let toastTimer = null;


/* =========================================================
   SAFE JSON
========================================================= */

function safeJSONParse(
  value,
  fallback
) {

  try {

    return JSON.parse(
      value
    );

  } catch {

    return fallback;

  }

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "WALPAP Firestore starting..."
    );


    renderBalance();

    renderWallpapers();

    updateWalletStats();


    try {

      await initializeFirebaseUser();

      await syncUser();

      await loadWallpapers();

      await syncVault();

      await syncFavorites();


      renderBalance();

      renderWallpapers();

      await renderVault();

      updateWalletStats();


      firebaseReady = true;


      console.log(
        "WALPAP Firestore READY",
        {
          userId,
          username,
          balance,
          owned
        }
      );


    } catch (error) {

      console.error(
        "WALPAP INIT ERROR:",
        error
      );


      showToast(
        "Gagal terhubung ke Firebase."
      );

    }

  }
);


/* =========================================================
   FIREBASE USER
========================================================= */

async function initializeFirebaseUser() {

  /*
    Jika sudah login, gunakan user tersebut.
  */

  if (auth.currentUser) {

    userId =
      auth.currentUser.uid;

    return auth.currentUser;

  }


  /*
    Anonymous authentication.
  */

  const result =
    await signInAnonymously(
      auth
    );


  userId =
    result.user.uid;


  localStorage.setItem(
    "walpap_user_id",
    userId
  );


  console.log(
    "Firebase user:",
    userId
  );


  return result.user;

}


/* =========================================================
   USER DOCUMENT
========================================================= */

async function syncUser() {

  if (!userId)
    return null;


  const userRef =
    doc(
      db,
      "users",
      userId
    );


  const snapshot =
    await getDoc(
      userRef
    );


  /*
    User belum ada.
  */

  if (!snapshot.exists()) {

    await setDoc(
      userRef,
      {

        username,

        name:
          username,

        balance:
          0,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    );


    balance = 0;


    return {

      id: userId,

      username,

      balance: 0

    };

  }


  const data =
    snapshot.data();


  username =
    data.username ||
    data.name ||
    username;


  balance =
    Number(
      data.balance || 0
    );


  localStorage.setItem(
    "walpap_username",
    username
  );


  renderBalance();


  console.log(
    "USER FROM FIRESTORE:",
    {
      id: userId,
      ...data
    }
  );


  return {

    id: userId,

    ...data

  };

}


/* =========================================================
   LOAD WALLPAPERS
========================================================= */

async function loadWallpapers() {

  const ref =
    collection(
      db,
      "wallpapers"
    );


  const snapshot =
    await getDocs(
      ref
    );


  wallpapers =
    snapshot.docs
      .map(
        document => {

          return normalizeWallpaper(
            {
              id:
                document.id,

              ...document.data()
            }
          );

        }
      );


  console.log(
    "WALLPAPERS:",
    wallpapers
  );


  renderWallpapers();


  return wallpapers;

}


/* =========================================================
   NORMALIZE WALLPAPER
========================================================= */

function normalizeWallpaper(
  item
) {

  const rarity =
    String(
      item.rarity ||
      "rare"
    ).toLowerCase();


  const editionLimit =
    item.editionLimit ??
    item.editionSize ??
    rarityMaxEditions(
      rarity
    );


  const editionsSold =
    Number(
      item.editionsSold ||
      item.sold ||
      0
    );


  return {

    id:
      item.id || "",

    title:
      item.title ||
      item.name ||
      "Untitled Wallpaper",

    creator:
      item.creatorName ||
      item.creator ||
      item.username ||
      "WALPAP Creator",

    creatorId:
      item.creatorId ||
      "",

    rarity,

    price:
      Number(
        item.price || 0
      ),

    edition:
      item.edition ||
      `#${String(
        editionsSold + 1
      ).padStart(
        5,
        "0"
      )} / ${editionLimit}`,

    editionSize:
      editionLimit,

    editionLimit,

    sold:
      editionsSold,

    editionsSold,

    favoriteCount:
      Number(
        item.favoriteCount || 0
      ),

    soldOut:
      Boolean(
        item.soldOut ||
        (
          editionLimit !==
          "UNLIMITED" &&
          editionsSold >=
          Number(editionLimit)
        )
      ),

    image:
      item.imageUrl ||
      item.image ||
      ""

  };

}


/* =========================================================
   RARITY
========================================================= */

function rarityMaxEditions(
  rarity
) {

  const values = {

    common:
      "UNLIMITED",

    rare:
      10000,

    epic:
      1000,

    legendary:
      100,

    mythic:
      10,

    "1/1":
      1

  };


  return (
    values[rarity] ||
    10000
  );

}


/* =========================================================
   SYNC VAULT
========================================================= */

async function syncVault() {

  if (!userId)
    return;


  const vaultRef =
    collection(
      db,
      "users",
      userId,
      "vault"
    );


  const snapshot =
    await getDocs(
      vaultRef
    );


  owned =
    snapshot.docs.map(
      document =>
        document.data()
          .wallpaperId ||
        document.id
    );


  owned =
    Array.from(
      new Set(
        owned.filter(Boolean)
      )
    );


  localStorage.setItem(
    "walpap_owned",
    JSON.stringify(
      owned
    )
  );


  updateWalletStats();


  console.log(
    "VAULT FROM FIRESTORE:",
    owned
  );


  return owned;

}


/* =========================================================
   RENDER VAULT
========================================================= */

async function renderVault() {

  const row =
    document.getElementById(
      "vaultRow"
    );


  if (!row)
    return;


  if (!userId) {

    row.innerHTML = `
      <div class="vault-empty">
        Connecting...
      </div>
    `;

    return;

  }


  if (!owned.length) {

    row.innerHTML = `
      <div class="vault-empty">
        💎 Your Vault is empty.<br>
        Buy your first rare wallpaper.
      </div>
    `;

    return;

  }


  const items =
    owned
      .map(
        id =>
          wallpapers.find(
            wallpaper =>
              String(
                wallpaper.id
              ) ===
              String(id)
          )
      )
      .filter(Boolean);


  if (!items.length) {

    row.innerHTML = `
      <div class="vault-empty">
        💎 Your Vault is empty.
      </div>
    `;

    return;

  }


  row.innerHTML =
    items
      .map(
        vaultCard
      )
      .join("");

}


/* =========================================================
   VAULT CARD
========================================================= */

function vaultCard(
  item
) {

  return `
    <div
      class="vault-card"
      onclick="openDetail('${escapeAttribute(item.id)}')"
    >

      <img
        src="${escapeAttribute(item.image)}"
        alt="${escapeAttribute(item.title)}"
        loading="lazy"
      >

    </div>
  `;

}


/* =========================================================
   PURCHASE
   ---------------------------------------------------------
   PERHATIAN:
   Untuk keamanan produksi, transaksi saldo harus
   dipindahkan ke Cloud Functions.
========================================================= */

async function buyCurrent() {

  if (!currentWallpaper)
    return;


  const item =
    currentWallpaper;


  if (!userId) {

    showToast(
      "User Firebase belum siap."
    );

    return;

  }


  if (
    owned.includes(
      item.id
    )
  ) {

    showToast(
      "Wallpaper sudah kamu miliki."
    );

    return;

  }


  if (
    item.creatorId &&
    item.creatorId ===
    userId
  ) {

    showToast(
      "Creator tidak dapat membeli wallpaper sendiri."
    );

    return;

  }


  if (
    balance <
    item.price
  ) {

    showToast(
      "Saldo WALPAP tidak cukup."
    );

    openWallet();

    return;

  }


  const buyButton =
    document.getElementById(
      "buyButton"
    );


  if (buyButton) {

    buyButton.disabled =
      true;

    buyButton.textContent =
      "BUYING...";

  }


  try {

    /*
      Transaction Firestore.
    */

    const userRef =
      doc(
        db,
        "users",
        userId
      );


    const wallpaperRef =
      doc(
        db,
        "wallpapers",
        item.id
      );


    const purchaseRef =
      doc(
        collection(
          db,
          "purchases"
        )
      );


    const vaultRef =
      doc(
        db,
        "users",
        userId,
        "vault",
        item.id
      );


    let newBalance = 0;

    let editionNumber = 0;


    await runTransaction(
      db,
      async transaction => {

        const userSnap =
          await transaction.get(
            userRef
          );


        const wallpaperSnap =
          await transaction.get(
            wallpaperRef
          );


        const vaultSnap =
          await transaction.get(
            vaultRef
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


        if (vaultSnap.exists()) {

          throw new Error(
            "ALREADY_PURCHASED"
          );

        }


        const userData =
          userSnap.data();


        const wallpaperData =
          wallpaperSnap.data();


        const currentBalance =
          Number(
            userData.balance || 0
          );


        const price =
          Number(
            wallpaperData.price || 0
          );


        if (
          currentBalance <
          price
        ) {

          throw new Error(
            "INSUFFICIENT_BALANCE"
          );

        }


        const sold =
          Number(
            wallpaperData.editionsSold ||
            0
          );


        const limit =
          wallpaperData.editionLimit ??
          10000;


        if (
          limit !==
          "UNLIMITED" &&
          sold >=
          Number(limit)
        ) {

          throw new Error(
            "SOLD_OUT"
          );

        }


        editionNumber =
          sold + 1;


        newBalance =
          currentBalance -
          price;


        transaction.update(
          userRef,
          {

            balance:
              newBalance,

            updatedAt:
              serverTimestamp()

          }
        );


        transaction.update(
          wallpaperRef,
          {

            editionsSold:
              editionNumber,

            sold:
              editionNumber,

            updatedAt:
              serverTimestamp()

          }
        );


        transaction.set(
          purchaseRef,
          {

            userId,

            wallpaperId:
              item.id,

            price,

            editionNumber,

            createdAt:
              serverTimestamp()

          }
        );


        transaction.set(
          vaultRef,
          {

            wallpaperId:
              item.id,

            purchaseId:
              purchaseRef.id,

            purchasedPrice:
              price,

            editionNumber,

            purchasedAt:
              serverTimestamp()

          }
        );

      }
    );


    /*
      Update local state only AFTER
      Firestore transaction succeeds.
    */

    balance =
      newBalance;


    owned.push(
      item.id
    );


    owned =
      Array.from(
        new Set(
          owned
        )
      );


    localStorage.setItem(
      "walpap_owned",
      JSON.stringify(
        owned
      )
    );


    await syncUser();

    await loadWallpapers();

    await syncVault();

    await renderVault();


    renderBalance();

    updateWalletStats();


    if (buyButton) {

      buyButton.textContent =
        "OWNED";

      buyButton.disabled =
        true;

    }


    showToast(
      `✓ Berhasil! Edition #${editionNumber} masuk Vault.`
    );


  } catch (error) {

    console.error(
      "FIRESTORE PURCHASE ERROR:",
      error
    );


    if (
      error.message ===
      "INSUFFICIENT_BALANCE"
    ) {

      showToast(
        "Saldo WALPAP tidak cukup."
      );

    } else if (
      error.message ===
      "ALREADY_PURCHASED"
    ) {

      await syncVault();

      showToast(
        "Wallpaper sudah kamu miliki."
      );

    } else if (
      error.message ===
      "SOLD_OUT"
    ) {

      await loadWallpapers();

      showToast(
        "Edition wallpaper sudah habis."
      );

    } else {

      showToast(
        error.message ||
        "Pembelian gagal."
      );

    }


    if (buyButton) {

      buyButton.disabled =
        false;

      buyButton.textContent =
        "BUY NOW";

    }

  }

}


/* =========================================================
   FAVORITES
========================================================= */

async function syncFavorites() {

  if (!userId)
    return;


  const ref =
    collection(
      db,
      "users",
      userId,
      "favorites"
    );


  const snapshot =
    await getDocs(
      ref
    );


  favorites =
    snapshot.docs.map(
      document =>
        document.data()
          .wallpaperId ||
        document.id
    );


  favorites =
    Array.from(
      new Set(
        favorites.filter(Boolean)
      )
    );


  saveFavorites();

  updateWalletStats();

}


/* =========================================================
   TOGGLE FAVORITE
========================================================= */

async function toggleFavorite(
  id
) {

  if (!userId)
    return;


  const favoriteRef =
    doc(
      db,
      "users",
      userId,
      "favorites",
      id
    );


  const exists =
    favorites.includes(
      id
    );


  try {

    if (exists) {

      await deleteDoc(
        favoriteRef
      );


      favorites =
        favorites.filter(
          item =>
            item !== id
        );


      showToast(
        "Dihapus dari Favorite"
      );

    } else {

      await setDoc(
        favoriteRef,
        {

          wallpaperId:
            id,

          createdAt:
            serverTimestamp()

        }
      );


      favorites.push(
        id
      );


      showToast(
        "♥ Ditambahkan ke Favorite"
      );

    }


    saveFavorites();

    renderWallpapers();

    updateWalletStats();


  } catch (error) {

    console.error(
      "FAVORITE ERROR:",
      error
    );


    showToast(
      "Favorite gagal disimpan."
    );

  }

}


/* =========================================================
   PUBLISH
========================================================= */

async function publishWallpaper() {

  if (!userId) {

    showToast(
      "Firebase belum siap."
    );

    return;

  }


  const title =
    document
      .getElementById(
        "creatorTitle"
      )
      ?.value
      .trim();


  const image =
    document
      .getElementById(
        "creatorImage"
      )
      ?.value
      .trim();


  const price =
    Number(
      document
        .getElementById(
          "creatorPrice"
        )
        ?.value
    );


  if (!title) {

    showToast(
      "Masukkan nama wallpaper."
    );

    return;

  }


  if (!image) {

    showToast(
      "Masukkan URL gambar."
    );

    return;

  }


  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {

    showToast(
      "Harga tidak valid."
    );

    return;

  }


  try {

    const wallpaperRef =
      await addDoc(
        collection(
          db,
          "wallpapers"
        ),
        {

          title,

          creatorId:
            userId,

          creatorName:
            username,

          imageUrl:
            image,

          price,

          rarity:
            "rare",

          editionLimit:
            10000,

          editionsSold:
            0,

          sold:
            0,

          favoriteCount:
            0,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


    console.log(
      "PUBLISHED:",
      wallpaperRef.id
    );


    await loadWallpapers();


    closeCreator();

    clearCreatorForm();


    showToast(
      "✓ Wallpaper berhasil dipublish!"
    );


  } catch (error) {

    console.error(
      "PUBLISH ERROR:",
      error
    );


    showToast(
      "Gagal mempublish wallpaper."
    );

  }

}


/* =========================================================
   BALANCE UI
========================================================= */

function renderBalance() {

  const balanceEl =
    document.getElementById(
      "balance"
    );


  const walletBalance =
    document.getElementById(
      "walletBalance"
    );


  const formatted =
    formatRupiah(
      balance
    );


  if (balanceEl) {

    if (
      balance >=
      1000000
    ) {

      balanceEl.textContent =
        "Rp" +
        (
          balance /
          1000000
        )
          .toFixed(1)
          .replace(
            ".0",
            ""
          ) +
        "M";

    } else if (
      balance >=
      1000
    ) {

      balanceEl.textContent =
        "Rp" +
        Math.floor(
          balance / 1000
        ) +
        "K";

    } else {

      balanceEl.textContent =
        "Rp" +
        formatted;

    }

  }


  if (walletBalance) {

    walletBalance.textContent =
      "Rp" +
      formatted;

  }

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(
  number
) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    Number(number) || 0
  );

}


/* =========================================================
   STORAGE
========================================================= */

function saveFavorites() {

  localStorage.setItem(
    "walpap_favorites",
    JSON.stringify(
      favorites
    )
  );

}


function updateWalletStats() {

  const elements = [

    [
      "walletOwned",
      owned.length
    ],

    [
      "walletFavorites",
      favorites.length
    ],

    [
      "profileOwned",
      owned.length
    ],

    [
      "profileFav",
      favorites.length
    ]

  ];


  elements.forEach(
    ([id, value]) => {

      const el =
        document.getElementById(
          id
        );


      if (el) {

        el.textContent =
          value;

      }

    }
  );

}


/* =========================================================
   WALLPAPER RENDER
========================================================= */

function renderWallpapers() {

  const grid =
    document.getElementById(
      "wallpaperGrid"
    );


  if (!grid)
    return;


  let list =
    wallpapers.slice();


  if (
    currentFilter !==
    "all"
  ) {

    list =
      list.filter(
        item =>
          item.rarity ===
          currentFilter
      );

  }


  if (!list.length) {

    grid.innerHTML = `
      <div class="vault-empty">
        No wallpaper found.
      </div>
    `;

    return;

  }


  grid.innerHTML =
    list
      .map(
        wallpaperCard
      )
      .join("");

}


/* =========================================================
   WALLPAPER CARD
========================================================= */

function wallpaperCard(
  item
) {

  const liked =
    favorites.includes(
      item.id
    );


  const isOwned =
    owned.includes(
      item.id
    );


  return `
    <article
      class="wall-card"
      onclick="openDetail('${escapeAttribute(item.id)}')"
    >

      <div class="wall-image">

        <img
          src="${escapeAttribute(item.image)}"
          alt="${escapeAttribute(item.title)}"
          loading="lazy"
        >

        <div class="rarity ${escapeAttribute(item.rarity)}">
          ${escapeHtml(
            item.rarity.toUpperCase()
          )}
        </div>

        <button
          class="favorite ${liked ? "active" : ""}"
          onclick="
            event.stopPropagation();
            toggleFavorite('${escapeAttribute(item.id)}')
          "
        >
          ${liked ? "♥" : "♡"}
        </button>

      </div>

      <div class="wall-info">

        <div class="wall-title">
          ${escapeHtml(
            item.title
          )}
        </div>

        <div class="wall-creator">
          by ${escapeHtml(
            item.creator
          )}
        </div>

        <div class="wall-bottom">

          <div class="wall-price">
            Rp${formatRupiah(
              item.price
            )}
          </div>

          <div class="wall-edition">
            ${escapeHtml(
              item.edition
            )}
          </div>

        </div>

        ${
          isOwned
            ? `
              <div class="owned-label">
                ✓ OWNED
              </div>
            `
            : ""
        }

      </div>

    </article>
  `;

}


/* =========================================================
   DETAIL
========================================================= */

function openDetail(
  id
) {

  const item =
    wallpapers.find(
      wallpaper =>
        String(
          wallpaper.id
        ) ===
        String(id)
    );


  if (!item)
    return;


  currentWallpaper =
    item;


  const modal =
    document.getElementById(
      "detailModal"
    );


  if (!modal)
    return;


  const image =
    document.getElementById(
      "detailImage"
    );


  const rarity =
    document.getElementById(
      "detailRarity"
    );


  const title =
    document.getElementById(
      "detailTitle"
    );


  const creator =
    document.getElementById(
      "detailCreator"
    );


  const edition =
    document.getElementById(
      "detailEdition"
    );


  const price =
    document.getElementById(
      "detailPrice"
    );


  const buyButton =
    document.getElementById(
      "buyButton"
    );


  if (image) {

    image.innerHTML = `
      <img
        src="${escapeAttribute(item.image)}"
        alt="${escapeAttribute(item.title)}"
      >
    `;

  }


  if (rarity)
    rarity.textContent =
      item.rarity.toUpperCase();


  if (title)
    title.textContent =
      item.title;


  if (creator)
    creator.textContent =
      item.creator;


  if (edition)
    edition.textContent =
      item.edition;


  if (price)
    price.textContent =
      "Rp" +
      formatRupiah(
        item.price
      );


  if (buyButton) {

    if (
      owned.includes(
        item.id
      )
    ) {

      buyButton.textContent =
        "OWNED";

      buyButton.disabled =
        true;

      showSetButtons();

    } else if (
      item.soldOut
    ) {

      buyButton.textContent =
        "SOLD OUT";

      buyButton.disabled =
        true;

      hideSetButtons();

    } else {

      buyButton.textContent =
        "BUY NOW";

      buyButton.disabled =
        false;

      hideSetButtons();

    }

  }


  modal.classList.add(
    "show"
  );

}


/* =========================================================
   FILTER
========================================================= */

function filterWallpapers(
  rarity,
  button
) {

  currentFilter =
    rarity;


  document
    .querySelectorAll(
      ".filter"
    )
    .forEach(
      element =>
        element.classList.remove(
          "active"
        )
    );


  if (button) {

    button.classList.add(
      "active"
    );

  }


  renderWallpapers();

}


/* =========================================================
   SET BUTTONS
========================================================= */

function showSetButtons() {

  const el =
    document.getElementById(
      "setButtons"
    );


  if (el)
    el.style.display =
      "grid";

}


function hideSetButtons() {

  const el =
    document.getElementById(
      "setButtons"
    );


  if (el)
    el.style.display =
      "none";

}


/* =========================================================
   CLOSE DETAIL
========================================================= */

function closeDetail() {

  const modal =
    document.getElementById(
      "detailModal"
    );


  if (modal)
    modal.classList.remove(
      "show"
    );


  currentWallpaper =
    null;

}


/* =========================================================
   WALLET
========================================================= */

async function openWallet() {

  await syncUser();

  renderBalance();

  updateWalletStats();


  const modal =
    document.getElementById(
      "walletModal"
    );


  if (modal)
    modal.classList.add(
      "show"
    );

}


function closeWallet() {

  const modal =
    document.getElementById(
      "walletModal"
    );


  if (modal)
    modal.classList.remove(
      "show"
    );

}


function topUp() {

  showToast(
    "Top Up belum dibuat. Hubungkan payment gateway terlebih dahulu."
  );

}


/* =========================================================
   SEARCH
========================================================= */

function openSearch() {

  const modal =
    document.getElementById(
      "searchModal"
    );


  if (modal)
    modal.classList.add(
      "show"
    );


  setTimeout(
    () => {

      document
        .getElementById(
          "searchInput"
        )
        ?.focus();

      searchWallpapers();

    },
    100
  );

}


function closeSearch() {

  const modal =
    document.getElementById(
      "searchModal"
    );


  if (modal)
    modal.classList.remove(
      "show"
    );

}


function searchWallpapers() {

  const input =
    document.getElementById(
      "searchInput"
    );


  const results =
    document.getElementById(
      "searchResults"
    );


  if (!input || !results)
    return;


  const query =
    input.value
      .toLowerCase()
      .trim();


  const list =
    query
      ? wallpapers.filter(
          item =>
            item.title
              .toLowerCase()
              .includes(
                query
              ) ||
            item.creator
              .toLowerCase()
              .includes(
                query
              ) ||
            item.rarity
              .toLowerCase()
              .includes(
                query
              )
        )
      : wallpapers.slice(
          0,
          5
        );


  results.innerHTML =
    list.length
      ? list
          .map(
            item => `
              <button
                class="search-result"
                onclick="openSearchResult('${escapeAttribute(item.id)}')"
              >

                <img
                  src="${escapeAttribute(item.image)}"
                  alt=""
                >

                <div>

                  <strong>
                    ${escapeHtml(
                      item.title
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      item.creator
                    )}
                  </span>

                </div>

              </button>
            `
          )
          .join("")
      : `
          <div class="vault-empty">
            No wallpaper found.
          </div>
        `;

}


function openSearchResult(
  id
) {

  closeSearch();

  setTimeout(
    () =>
      openDetail(id),
    150
  );

}


/* =========================================================
   CREATOR
========================================================= */

function openCreator() {

  document
    .getElementById(
      "creatorModal"
    )
    ?.classList.add(
      "show"
    );

}


function closeCreator() {

  document
    .getElementById(
      "creatorModal"
    )
    ?.classList.remove(
      "show"
    );

}


function clearCreatorForm() {

  [
    "creatorTitle",
    "creatorImage",
    "creatorPrice"

  ].forEach(
    id => {

      const el =
        document.getElementById(
          id
        );


      if (el)
        el.value = "";

    }
  );

}


/* =========================================================
   PROFILE
========================================================= */

async function openProfile() {

  await syncUser();

  await syncVault();

  updateWalletStats();


  document
    .getElementById(
      "profileModal"
    )
    ?.classList.add(
      "show"
    );

}


function closeProfile() {

  document
    .getElementById(
      "profileModal"
    )
    ?.classList.remove(
      "show"
    );

}


/* =========================================================
   HOME / EXPLORE
========================================================= */

function goHome() {

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function scrollExplore() {

  document
    .getElementById(
      "explore"
    )
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


/* =========================================================
   SHOW VAULT
========================================================= */

function showVault() {

  document
    .querySelector(
      ".vault"
    )
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


/* =========================================================
   SET WALLPAPER
========================================================= */

async function setCurrentWallpaper(
  target
) {

  await syncVault();


  if (
    !currentWallpaper ||
    !owned.includes(
      currentWallpaper.id
    )
  ) {

    showToast(
      "Beli wallpaper terlebih dahulu."
    );

    return;

  }


  /*
    Native Capacitor plugin.
  */

  try {

    const plugin =
      window.Capacitor
        ?.Plugins
        ?.WalpapWallpaper;


    if (plugin) {

      await plugin.setWallpaper({

        url:
          currentWallpaper.image,

        target:
          target === "both"
            ? "home"
            : target

      });


      if (
        target ===
        "both"
      ) {

        await plugin.setWallpaper({

          url:
            currentWallpaper.image,

          target:
            "lock"

        });

      }


      showToast(
        "✓ Wallpaper berhasil dipasang."
      );


      return;

    }


    /*
      Browser fallback.
    */

    window.open(
      currentWallpaper.image,
      "_blank"
    );


    showToast(
      "Simpan gambar lalu jadikan wallpaper."
    );


  } catch (error) {

    console.error(
      error
    );


    showToast(
      "Gagal memasang wallpaper."
    );

  }

}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(
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


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast)
    return;


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2600
    );

}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeDetail();

      closeWallet();

      closeSearch();

      closeCreator();

      closeProfile();

    }

  }
);


/* =========================================================
   GLOBAL API
========================================================= */

window.WALPAP = {

  getUserId:
    () => userId,

  getUsername:
    () => username,

  getBalance:
    () => balance,

  getOwned:
    () =>
      owned.slice(),

  getFavorites:
    () =>
      favorites.slice(),

  getWallpapers:
    () =>
      wallpapers.slice(),

  async refreshUser() {

    return await syncUser();

  },

  async refreshVault() {

    await syncVault();

    await renderVault();

    return owned;

  },

  async refreshWallpapers() {

    return await loadWallpapers();

  },

  async refreshAll() {

    await syncUser();

    await loadWallpapers();

    await syncVault();

    await syncFavorites();

    renderBalance();

    renderWallpapers();

    await renderVault();

    updateWalletStats();

  }

};
