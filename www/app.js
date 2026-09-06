/* =========================================================
   WALPAP V6
   Premium Digital Wallpaper Marketplace
   Connected to WALPAP API

   IMPORTANT
   ---------------------------------------------------------
   Server/API adalah sumber kebenaran untuk:
   - User
   - Balance
   - Purchases
   - Vault
   - Wallpapers

   Frontend hanya menyimpan cache ringan di localStorage.
========================================================= */


/* =========================================================
   API
========================================================= */

const API_BASE =
  "https://walpap-api--ryanfendiwardan.replit.app";


/* =========================================================
   TEST USER
   ---------------------------------------------------------
   Untuk sementara kita gunakan akun buyer yang sudah
   memiliki data di backend.

   Setelah sistem login/auth selesai, bagian ini bisa
   diganti dengan user ID dari sistem login.
========================================================= */

const TEST_USER_ID =
  "5be6256e-a996-46e0-889a-7500e65d2db0";


/* =========================================================
   DEMO DATA
   ---------------------------------------------------------
   Tidak digunakan sebagai sumber data marketplace.
   Hanya fallback visual jika diperlukan.
========================================================= */

const demoWallpapers = [

  {
    id: "w1",

    title: "Neon Tokyo",

    creator: "CyberNeko",

    creatorId: "",

    rarity: "legendary",

    price: 10000,

    edition: "#027 / 100",

    editionSize: 100,

    editionLimit: 100,

    sold: 27,

    editionsSold: 27,

    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w2",

    title: "Purple Galaxy",

    creator: "NovaX",

    creatorId: "",

    rarity: "epic",

    price: 7500,

    edition: "#184 / 1000",

    editionSize: 1000,

    editionLimit: 1000,

    sold: 184,

    editionsSold: 184,

    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w3",

    title: "Cyber City",

    creator: "PixelForge",

    creatorId: "",

    rarity: "rare",

    price: 5000,

    edition: "#4921 / 10000",

    editionSize: 10000,

    editionLimit: 10000,

    sold: 4921,

    editionsSold: 4921,

    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w4",

    title: "Dark Mountain",

    creator: "VoidStudio",

    creatorId: "",

    rarity: "mythic",

    price: 25000,

    edition: "#03 / 10",

    editionSize: 10,

    editionLimit: 10,

    sold: 3,

    editionsSold: 3,

    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w5",

    title: "Ocean Dream",

    creator: "BlueWave",

    creatorId: "",

    rarity: "rare",

    price: 4500,

    edition: "#3280 / 10000",

    editionSize: 10000,

    editionLimit: 10000,

    sold: 3280,

    editionsSold: 3280,

    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w6",

    title: "Golden Future",

    creator: "LuxArt",

    creatorId: "",

    rarity: "legendary",

    price: 15000,

    edition: "#041 / 100",

    editionSize: 100,

    editionLimit: 100,

    sold: 41,

    editionsSold: 41,

    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=90"
  }

];


/* =========================================================
   GLOBAL DATA
========================================================= */

let wallpapers = [];


/* =========================================================
   USER
========================================================= */

let userId =
  TEST_USER_ID;


let username =
  localStorage.getItem(
    "walpap_username"
  ) ||
  "Test Buyer Paid";


/* =========================================================
   BALANCE
   ---------------------------------------------------------
   Jangan mengambil balance dari localStorage sebagai
   sumber kebenaran.
========================================================= */

let balance = 0;


/* =========================================================
   OWNED
========================================================= */

let owned = [];


/* =========================================================
   FAVORITES
========================================================= */

let favorites =
  safeJSONParse(
    localStorage.getItem(
      "walpap_favorites"
    ),
    []
  );


/* =========================================================
   STATE
========================================================= */

let currentWallpaper = null;

let currentFilter = "all";

let apiOnline = false;

let toastTimer = null;


/* =========================================================
   SAFE JSON
========================================================= */

function safeJSONParse(
  value,
  fallback
) {

  try {

    const parsed =
      JSON.parse(value);

    return parsed;

  } catch (error) {

    return fallback;

  }

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "WALPAP V6 starting..."
    );


    renderBalance();

    renderWallpapers();

    renderVault();

    updateWalletStats();


    /*
      1. Check API
    */

    await checkAPI();


    /*
      2. Load server user
    */

    await initializeUser();


    /*
      3. Refresh user balance
    */

    await loadUserFromAPI();


    /*
      4. Load marketplace
    */

    await loadWallpapers();


    /*
      5. Load real Vault
    */

    await syncVault();


    /*
      Final UI
    */

    renderBalance();

    renderWallpapers();

    await renderVault();

    updateWalletStats();


    console.log(
      "WALPAP V6 ready",
      {
        userId,
        username,
        balance,
        owned,
        apiOnline
      }
    );

  }
);


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
  endpoint,
  options = {}
) {

  const requestOptions = {

    ...options,

    headers: {

      ...(options.body
        ? {
            "Content-Type":
              "application/json"
          }
        : {}),

      ...(options.headers || {})

    }

  };


  const response =
    await fetch(
      API_BASE + endpoint,
      requestOptions
    );


  let data = null;


  try {

    data =
      await response.json();

  } catch (error) {

    data = null;

  }


  if (!response.ok) {

    let message =
      "API Error " +
      response.status;


    if (
      data?.error?.message
    ) {

      message =
        data.error.message;

    } else if (
      typeof data?.error ===
      "string"
    ) {

      message =
        data.error;

    } else if (
      data?.message
    ) {

      message =
        data.message;

    }


    const apiError =
      new Error(message);


    apiError.status =
      response.status;


    apiError.code =
      data?.error?.code ||
      data?.code ||
      null;


    apiError.data =
      data;


    throw apiError;

  }


  return data;

}


/* =========================================================
   CHECK API
========================================================= */

async function checkAPI() {

  try {

    const data =
      await apiRequest("/");


    apiOnline =
      data?.success === true;


    console.log(
      "WALPAP API:",
      apiOnline
        ? "ONLINE"
        : "UNKNOWN"
    );


    return apiOnline;

  } catch (error) {

    console.error(
      "WALPAP API OFFLINE:",
      error
    );


    apiOnline = false;


    return false;

  }

}


/* =========================================================
   INITIALIZE USER
   ---------------------------------------------------------
   TIDAK MEMBUAT USER BARU.

   Kita harus menggunakan user backend yang sudah ada.
========================================================= */

async function initializeUser() {

  if (!userId) {

    console.error(
      "WALPAP userId tidak tersedia."
    );

    return null;

  }


  if (!apiOnline) {

    console.warn(
      "API offline, user tidak dapat disinkronkan."
    );

    return null;

  }


  try {

    const data =
      await apiRequest(
        `/api/users/${encodeURIComponent(userId)}`
      );


    const user =
      data?.user ||
      data?.data ||
      data;


    if (!user?.id) {

      throw new Error(
        "User tidak ditemukan di WALPAP API."
      );

    }


    userId =
      user.id;


    username =
      user.name ||
      user.username ||
      username;


    if (
      user.balance !==
      undefined &&
      user.balance !==
      null
    ) {

      balance =
        Number(
          user.balance
        );

    } else {

      balance = 0;

    }


    localStorage.setItem(
      "walpap_user_id",
      userId
    );


    localStorage.setItem(
      "walpap_username",
      username
    );


    saveBalance();

    renderBalance();

    console.log(
      "WALPAP USER LOADED:",
      user
    );


    return user;

  } catch (error) {

    console.error(
      "USER LOAD ERROR:",
      error
    );


    return null;

  }

}


/* =========================================================
   LOAD USER FROM API
========================================================= */

async function loadUserFromAPI() {

  if (
    !userId ||
    !apiOnline
  ) {

    return null;

  }


  try {

    const data =
      await apiRequest(
        `/api/users/${encodeURIComponent(userId)}`
      );


    const user =
      data?.user ||
      data?.data ||
      data;


    if (!user?.id) {

      return null;

    }


    username =
      user.name ||
      user.username ||
      username;


    balance =
      Number(
        user.balance ?? 0
      );


    localStorage.setItem(
      "walpap_username",
      username
    );


    saveBalance();

    renderBalance();


    console.log(
      "SERVER BALANCE:",
      balance
    );


    return user;

  } catch (error) {

    console.error(
      "BALANCE SYNC ERROR:",
      error
    );


    return null;

  }

}


/* =========================================================
   LOAD WALLPAPERS
========================================================= */

async function loadWallpapers() {

  if (!apiOnline) {

    wallpapers = [];

    renderWallpapers();

    return [];

  }


  try {

    const data =
      await apiRequest(
        "/api/wallpapers"
      );


    let list =
      data?.wallpapers ||
      data?.items ||
      data?.data ||
      data;


    if (
      !Array.isArray(list)
    ) {

      list = [];

    }


    wallpapers =
      list.map(
        normalizeWallpaper
      );


    console.log(
      "WALLPAPERS FROM SERVER:",
      wallpapers
    );


    renderWallpapers();

    return wallpapers;

  } catch (error) {

    console.error(
      "WALLPAPER LOAD ERROR:",
      error
    );


    wallpapers = [];

    renderWallpapers();


    return [];

  }

}


/* =========================================================
   NORMALIZE WALLPAPER
========================================================= */

function normalizeWallpaper(
  item
) {

  item =
    item ||
    {};


  const rarity =
    String(
      item.rarity ||
      "rare"
    ).toLowerCase();


  const price =
    Number(
      item.price ?? 0
    );


  const editionLimit =
    item.editionLimit ??
    item.editionSize ??
    item.maxEditions ??
    rarityMaxEditions(
      rarity
    );


  const editionsSold =
    Number(
      item.editionsSold ??
      item.soldCount ??
      item.sold ??
      0
    );


  let edition =
    item.edition;


  if (!edition) {

    const serial =
      item.editionNumber ??
      item.serialNumber ??
      (editionsSold > 0
        ? editionsSold
        : 1);


    edition =
      `#${String(
        serial
      ).padStart(5, "0")} / ${editionLimit}`;

  }


  return {

    id:
      item.id ||
      item.wallpaperId ||
      "",


    title:
      item.title ||
      item.name ||
      "Untitled Wallpaper",


    creator:
      item.creatorName ||
      item.creator ||
      item.username ||
      item.creatorId ||
      "WALPAP Creator",


    creatorId:
      item.creatorId ||
      "",


    rarity,


    price,


    edition,


    editionSize:
      editionLimit,


    editionLimit,


    sold:
      editionsSold,


    editionsSold,


    favoriteCount:
      Number(
        item.favoriteCount ??
        0
      ),


    soldOut:
      Boolean(
        item.soldOut ??
        (
          editionLimit !==
          "UNLIMITED" &&
          Number(editionsSold) >=
          Number(editionLimit)
        )
      ),


    image:
      item.imageUrl ||
      item.image ||
      item.url ||
      ""

  };

}


/* =========================================================
   RARITY EDITIONS
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
   STORAGE
========================================================= */

function saveBalance() {

  localStorage.setItem(
    "walpap_balance",
    String(balance)
  );

}


function saveOwned() {

  localStorage.setItem(
    "walpap_owned",
    JSON.stringify(
      owned
    )
  );

}


function saveFavorites() {

  localStorage.setItem(
    "walpap_favorites",
    JSON.stringify(
      favorites
    )
  );

}


/* =========================================================
   RUPIAH
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

    if (balance >= 1000000) {

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
      balance >= 1000
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


  const ownedNow =
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
          onerror="this.style.display='none'"
        >

        <div
          class="rarity ${escapeAttribute(item.rarity)}"
        >
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
          ownedNow
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


  if (!modal)
    return;


  if (image) {

    image.innerHTML = `
      <img
        src="${escapeAttribute(item.image)}"
        alt="${escapeAttribute(item.title)}"
      >
    `;

  }


  if (rarity) {

    rarity.textContent =
      item.rarity.toUpperCase();

  }


  if (title) {

    title.textContent =
      item.title;

  }


  if (creator) {

    creator.textContent =
      item.creator;

  }


  if (edition) {

    edition.textContent =
      item.edition;

  }


  if (price) {

    price.textContent =
      "Rp" +
      formatRupiah(
        item.price
      );

  }


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
   SET BUTTONS
========================================================= */

function showSetButtons() {

  const setButtons =
    document.getElementById(
      "setButtons"
    );


  if (setButtons) {

    setButtons.style.display =
      "grid";

  }

}


function hideSetButtons() {

  const setButtons =
    document.getElementById(
      "setButtons"
    );


  if (setButtons) {

    setButtons.style.display =
      "none";

  }

}


/* =========================================================
   CLOSE DETAIL
========================================================= */

function closeDetail() {

  const modal =
    document.getElementById(
      "detailModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }


  currentWallpaper =
    null;

}


/* =========================================================
   BUY
========================================================= */

async function buyCurrent() {

  if (!currentWallpaper) {

    return;

  }


  const item =
    currentWallpaper;


  /*
    Already owned
  */

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


  /*
    API must be online
  */

  if (!apiOnline) {

    showToast(
      "WALPAP API sedang offline."
    );

    return;

  }


  /*
    Refresh balance first.
  */

  await loadUserFromAPI();


  /*
    Self purchase protection.
  */

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


  /*
    Client-side balance check.
    Server remains authoritative.
  */

  if (
    balance <
    Number(item.price)
  ) {

    showToast(
      "Saldo WALPAP tidak cukup."
    );

    openWallet();

    return;

  }


  /*
    Disable button while purchasing.
  */

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

    const data =
      await apiRequest(
        "/api/purchases",
        {
          method: "POST",

          body:
            JSON.stringify({
              userId,

              wallpaperId:
                item.id
            })
        }
      );


    console.log(
      "PURCHASE RESPONSE:",
      data
    );


    const purchase =
      data?.purchase ||
      data?.data ||
      data;


    /*
      IMPORTANT:
      Backend returns userBalance.
    */

    if (
      data?.userBalance !==
      undefined
    ) {

      balance =
        Number(
          data.userBalance
        );

    } else {

      /*
        Refresh from server instead
        of trusting local calculation.
      */

      await loadUserFromAPI();

    }


    /*
      Refresh Vault.
    */

    await syncVault();


    /*
      Refresh marketplace.
    */

    await loadWallpapers();


    renderBalance();

    updateWalletStats();


    /*
      Reopen/update current item.
    */

    if (
      currentWallpaper
    ) {

      const refreshed =
        wallpapers.find(
          wallpaper =>
            String(
              wallpaper.id
            ) ===
            String(
              currentWallpaper.id
            )
        );


      if (refreshed) {

        currentWallpaper =
          refreshed;

      }

    }


    markOwnedUI();


    showToast(
      "✓ Wallpaper berhasil masuk Vault!"
    );


    console.log(
      "WALPAP PURCHASE SUCCESS:",
      purchase
    );


  } catch (error) {

    console.error(
      "PURCHASE ERROR:",
      error
    );


    if (
      error.code ===
      "INSUFFICIENT_BALANCE"
    ) {

      showToast(
        "Saldo WALPAP tidak cukup."
      );

      await loadUserFromAPI();

      openWallet();

    } else if (
      error.code ===
      "ALREADY_PURCHASED"
    ) {

      showToast(
        "Wallpaper sudah kamu miliki."
      );

      await syncVault();

    } else if (
      error.code ===
      "CREATOR_CANNOT_PURCHASE"
    ) {

      showToast(
        "Creator tidak dapat membeli wallpaper sendiri."
      );

    } else if (
      error.code ===
      "SOLD_OUT"
    ) {

      showToast(
        "Edition wallpaper sudah habis."
      );

      await loadWallpapers();

    } else {

      showToast(
        error.message ||
        "Pembelian gagal."
      );

    }


    /*
      Restore button.
    */

    if (buyButton) {

      buyButton.disabled =
        false;

      buyButton.textContent =
        "BUY NOW";

    }

  }

}


/* =========================================================
   MARK OWNED UI
========================================================= */

function markOwnedUI() {

  const buyButton =
    document.getElementById(
      "buyButton"
    );


  if (buyButton) {

    buyButton.textContent =
      "OWNED";

    buyButton.disabled =
      true;

  }


  showSetButtons();

}


/* =========================================================
   FAVORITE
========================================================= */

async function toggleFavorite(
  id
) {

  const wasLiked =
    favorites.includes(
      id
    );


  /*
    Optimistic UI
  */

  if (wasLiked) {

    favorites =
      favorites.filter(
        favoriteId =>
          favoriteId !== id
      );

  } else {

    favorites.push(
      id
    );

  }


  saveFavorites();

  renderWallpapers();

  updateWalletStats();


  /*
    API sync
  */

  if (
    userId &&
    apiOnline
  ) {

    try {

      if (wasLiked) {

        await apiRequest(
          "/api/favorites",
          {
            method: "DELETE",

            body:
              JSON.stringify({
                userId,

                wallpaperId:
                  id
              })
          }
        );

        showToast(
          "Dihapus dari Favorite"
        );

      } else {

        await apiRequest(
          "/api/favorites",
          {
            method: "POST",

            body:
              JSON.stringify({
                userId,

                wallpaperId:
                  id
              })
          }
        );

        showToast(
          "♥ Ditambahkan ke Favorite"
        );

      }

    } catch (error) {

      console.error(
        "FAVORITE API ERROR:",
        error
      );


      /*
        Rollback.
      */

      if (wasLiked) {

        favorites.push(
          id
        );

      } else {

        favorites =
          favorites.filter(
            favoriteId =>
              favoriteId !== id
          );

      }


      saveFavorites();

      renderWallpapers();

      updateWalletStats();


      showToast(
        "Favorite gagal disimpan."
      );

    }

  } else {

    showToast(
      wasLiked
        ? "Dihapus dari Favorite"
        : "♥ Ditambahkan ke Favorite"
    );

  }

}


/* =========================================================
   FAVORITE CURRENT
========================================================= */

function toggleFavoriteCurrent() {

  if (!currentWallpaper)
    return;


  toggleFavorite(
    currentWallpaper.id
  );

}


/* =========================================================
   VAULT
========================================================= */

async function renderVault() {

  const row =
    document.getElementById(
      "vaultRow"
    );


  if (!row)
    return;


  /*
    API required.
  */

  if (
    !userId ||
    !apiOnline
  ) {

    row.innerHTML = `
      <div class="vault-empty">
        Connecting to WALPAP Vault...
      </div>
    `;

    return;

  }


  try {

    const data =
      await apiRequest(
        `/api/vault/${encodeURIComponent(userId)}`
      );


    console.log(
      "VAULT RESPONSE:",
      data
    );


    const serverItems =
      Array.isArray(data)
        ? data
        : data?.vault ||
          data?.wallpapers ||
          data?.items ||
          data?.data ||
          [];


    if (
      !Array.isArray(
        serverItems
      )
    ) {

      throw new Error(
        "Format Vault API tidak valid."
      );

    }


    /*
      Empty vault.
    */

    if (
      serverItems.length === 0
    ) {

      owned = [];

      saveOwned();

      updateWalletStats();


      row.innerHTML = `
        <div class="vault-empty">
          💎 Your Vault is empty.<br>
          Buy your first rare wallpaper.
        </div>
      `;

      return;

    }


    /*
      Normalize nested purchase + wallpaper.
    */

    const vaultItems =
      serverItems
        .map(
          entry => {

            const wallpaper =
              entry?.wallpaper ||
              entry;


            const purchase =
              entry?.purchase ||
              {};


            const item =
              normalizeWallpaper(
                wallpaper
              );


            item.purchase =
              purchase;


            item.purchaseId =
              purchase.id ||
              null;


            /*
              Edition from purchase.
            */

            if (
              purchase.edition
            ) {

              item.edition =
                purchase.edition;

            } else if (
              purchase.editionNumber !==
              undefined
            ) {

              const limit =
                wallpaper.editionLimit ??
                wallpaper.editionSize ??
                10000;


              item.edition =
                `#${String(
                  purchase.editionNumber
                ).padStart(
                  5,
                  "0"
                )} / ${limit}`;

            }


            return item;

          }
        )
        .filter(
          item =>
            item.id
        );


    /*
      Server is source of truth for ownership.
    */

    owned =
      Array.from(
        new Set(
          vaultItems.map(
            item =>
              item.id
          )
        )
      );


    saveOwned();

    updateWalletStats();


    /*
      Render Vault.
    */

    row.innerHTML =
      vaultItems
        .map(
          vaultCard
        )
        .join("");


  } catch (error) {

    console.error(
      "VAULT RENDER ERROR:",
      error
    );


    row.innerHTML = `
      <div class="vault-empty">
        Unable to load WALPAP Vault.
      </div>
    `;

  }

}


/* =========================================================
   SYNC VAULT
========================================================= */

async function syncVault() {

  if (
    !userId ||
    !apiOnline
  ) {

    return;

  }


  try {

    const data =
      await apiRequest(
        `/api/vault/${encodeURIComponent(userId)}`
      );


    console.log(
      "VAULT SYNC:",
      data
    );


    const serverItems =
      Array.isArray(data)
        ? data
        : data?.vault ||
          data?.wallpapers ||
          data?.items ||
          data?.data ||
          [];


    if (
      !Array.isArray(
        serverItems
      )
    ) {

      return;

    }


    const serverOwned =
      serverItems
        .map(
          entry => {

            const wallpaper =
              entry?.wallpaper ||
              null;


            return (
              wallpaper?.id ||
              entry?.wallpaperId ||
              null
            );

          }
        )
        .filter(Boolean);


    owned =
      Array.from(
        new Set(
          serverOwned
        )
      );


    saveOwned();

    updateWalletStats();


    await renderVault();


  } catch (error) {

    console.error(
      "VAULT SYNC ERROR:",
      error
    );

  }

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
        onerror="this.style.display='none'"
      >

    </div>
  `;

}


/* =========================================================
   SHOW VAULT
========================================================= */

function showVault() {

  const vault =
    document.querySelector(
      ".vault"
    );


  if (vault) {

    vault.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


/* =========================================================
   SET WALLPAPER
========================================================= */

async function setCurrentWallpaper(
  target
) {

  if (!currentWallpaper)
    return;


  /*
    Verify ownership with server.
  */

  await syncVault();


  if (
    !owned.includes(
      currentWallpaper.id
    )
  ) {

    showToast(
      "Beli wallpaper terlebih dahulu."
    );

    return;

  }


  try {

    /*
      Capacitor native plugin
    */

    if (
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.WalpapWallpaper
    ) {

      const plugin =
        window.Capacitor
          .Plugins
          .WalpapWallpaper;


      if (
        target === "both"
      ) {

        await plugin.setWallpaper({
          url:
            currentWallpaper.image,

          target:
            "home"
        });


        await plugin.setWallpaper({
          url:
            currentWallpaper.image,

          target:
            "lock"
        });

      } else {

        await plugin.setWallpaper({
          url:
            currentWallpaper.image,

          target
        });

      }


      showToast(
        target === "both"
          ? "✓ Home + Lock berhasil!"
          : target === "home"
            ? "✓ Home Screen berhasil!"
            : "✓ Lock Screen berhasil!"
      );


      return;

    }


    /*
      Browser fallback.
    */

    if (
      !currentWallpaper.image
    ) {

      showToast(
        "URL gambar tidak tersedia."
      );

      return;

    }


    const link =
      document.createElement(
        "a"
      );


    link.href =
      currentWallpaper.image;


    link.download =
      (
        currentWallpaper.title ||
        "walpap"
      ) +
      ".jpg";


    link.target =
      "_blank";


    link.rel =
      "noopener";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    showToast(
      "Gambar dibuka. Simpan lalu jadikan wallpaper."
    );


  } catch (error) {

    console.error(
      "SET WALLPAPER ERROR:",
      error
    );


    showToast(
      "Gagal memasang wallpaper."
    );

  }

}


/* =========================================================
   WALLET
========================================================= */

async function openWallet() {

  /*
    Always use server balance.
  */

  await loadUserFromAPI();


  renderBalance();

  updateWalletStats();


  const modal =
    document.getElementById(
      "walletModal"
    );


  if (modal) {

    modal.classList.add(
      "show"
    );

  }

}


function closeWallet() {

  const modal =
    document.getElementById(
      "walletModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


/* =========================================================
   TOP UP
========================================================= */

function topUp() {

  /*
    Backend saat ini belum memiliki endpoint
    top-up saldo user yang sudah ada.

    Jangan membuat saldo palsu di browser.
  */

  showToast(
    "Top Up resmi WALPAP belum tersedia."
  );

}


/* =========================================================
   WALLET STATS
========================================================= */

function updateWalletStats() {

  const ownedEl =
    document.getElementById(
      "walletOwned"
    );


  const favoriteEl =
    document.getElementById(
      "walletFavorites"
    );


  if (ownedEl) {

    ownedEl.textContent =
      owned.length;

  }


  if (favoriteEl) {

    favoriteEl.textContent =
      favorites.length;

  }


  const profileOwned =
    document.getElementById(
      "profileOwned"
    );


  const profileFav =
    document.getElementById(
      "profileFav"
    );


  if (profileOwned) {

    profileOwned.textContent =
      owned.length;

  }


  if (profileFav) {

    profileFav.textContent =
      favorites.length;

  }

}


/* =========================================================
   SEARCH
========================================================= */

function openSearch() {

  const modal =
    document.getElementById(
      "searchModal"
    );


  if (modal) {

    modal.classList.add(
      "show"
    );

  }


  setTimeout(
    function () {

      const input =
        document.getElementById(
          "searchInput"
        );


      if (input) {

        input.focus();

      }

    },
    150
  );


  searchWallpapers();

}


function closeSearch() {

  const modal =
    document.getElementById(
      "searchModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


/* =========================================================
   SEARCH WALLPAPERS
========================================================= */

function searchWallpapers() {

  const input =
    document.getElementById(
      "searchInput"
    );


  const results =
    document.getElementById(
      "searchResults"
    );


  if (
    !input ||
    !results
  ) {

    return;

  }


  const query =
    input.value
      .toLowerCase()
      .trim();


  const list =
    query

      ? wallpapers.filter(
          item =>

            String(
              item.title
            )
              .toLowerCase()
              .includes(
                query
              ) ||

            String(
              item.creator
            )
              .toLowerCase()
              .includes(
                query
              ) ||

            String(
              item.rarity
            )
              .toLowerCase()
              .includes(
                query
              )
        )

      : wallpapers.slice(
          0,
          5
        );


  if (!list.length) {

    results.innerHTML = `
      <div class="vault-empty">
        No wallpaper found.
      </div>
    `;

    return;

  }


  results.innerHTML =
    list
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
                ·
                ${escapeHtml(
                  item.rarity.toUpperCase()
                )}
              </span>

            </div>

          </button>
        `
      )
      .join("");

}


/* =========================================================
   SEARCH RESULT
========================================================= */

function openSearchResult(
  id
) {

  closeSearch();


  setTimeout(
    function () {

      openDetail(
        id
      );

    },
    200
  );

}


/* =========================================================
   CREATOR
========================================================= */

function openCreator() {

  const modal =
    document.getElementById(
      "creatorModal"
    );


  if (modal) {

    modal.classList.add(
      "show"
    );

  }

}


function closeCreator() {

  const modal =
    document.getElementById(
      "creatorModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


/* =========================================================
   PUBLISH WALLPAPER
========================================================= */

async function publishWallpaper() {

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


  if (
    !userId ||
    !apiOnline
  ) {

    showToast(
      "WALPAP API sedang offline."
    );

    return;

  }


  try {

    const data =
      await apiRequest(
        "/api/wallpapers",
        {
          method: "POST",

          body:
            JSON.stringify({

              creatorId:
                userId,

              creator:
                username,

              title,

              imageUrl:
                image,

              image:
                image,

              price,

              rarity:
                "rare",

              editionLimit:
                10000,

              editionSize:
                10000

            })
        }
      );


    console.log(
      "PUBLISH RESPONSE:",
      data
    );


    const created =
      data?.wallpaper ||
      data?.data ||
      data;


    if (
      created?.id
    ) {

      wallpapers.unshift(
        normalizeWallpaper(
          created
        )
      );

    } else {

      await loadWallpapers();

    }


    renderWallpapers();

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
      error.message ||
      "Gagal mempublish wallpaper."
    );

  }

}


/* =========================================================
   CLEAR CREATOR
========================================================= */

function clearCreatorForm() {

  const title =
    document.getElementById(
      "creatorTitle"
    );


  const image =
    document.getElementById(
      "creatorImage"
    );


  const price =
    document.getElementById(
      "creatorPrice"
    );


  if (title)
    title.value = "";


  if (image)
    image.value = "";


  if (price)
    price.value = "";

}


/* =========================================================
   PROFILE
========================================================= */

async function openProfile() {

  await loadUserFromAPI();

  updateWalletStats();


  const modal =
    document.getElementById(
      "profileModal"
    );


  if (modal) {

    modal.classList.add(
      "show"
    );

  }

}


function closeProfile() {

  const modal =
    document.getElementById(
      "profileModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


/* =========================================================
   HOME
========================================================= */

function goHome() {

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   EXPLORE
========================================================= */

function scrollExplore() {

  const explore =
    document.getElementById(
      "explore"
    );


  if (explore) {

    explore.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


/* =========================================================
   API STATUS
========================================================= */

async function showAPIStatus() {

  const online =
    await checkAPI();


  showToast(
    online
      ? "● WALPAP API Online"
      : "● WALPAP API Offline"
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
      function () {

        toast.classList.remove(
          "show"
        );

      },
      2600
    );

}


/* =========================================================
   ESCAPE HTML
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


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  function (event) {

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
   DEBUG
========================================================= */

window.WALPAP = {

  getUserId() {

    return userId;

  },


  getUsername() {

    return username;

  },


  getBalance() {

    return balance;

  },


  getOwned() {

    return owned.slice();

  },


  getFavorites() {

    return favorites.slice();

  },


  getWallpapers() {

    return wallpapers.slice();

  },


  isAPIOnline() {

    return apiOnline;

  },


  async refreshUser() {

    return await loadUserFromAPI();

  },


  async refreshWallpapers() {

    return await loadWallpapers();

  },


  async refreshVault() {

    return await syncVault();

  },


  async refreshAll() {

    await checkAPI();

    await initializeUser();

    await loadUserFromAPI();

    await loadWallpapers();

    await syncVault();

    renderBalance();

    renderWallpapers();

    updateWalletStats();

  }

};


/* =========================================================
   END WALPAP V6
========================================================= */
