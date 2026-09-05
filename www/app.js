/* =========================================================
   WALPAP V4
   Premium Digital Wallpaper Marketplace
   Connected to WALPAP API
========================================================= */

const API_BASE =
  "https://walpap-api--ryanfendiwardan.replit.app";


/* =========================================================
   LOCAL CACHE / FALLBACK
========================================================= */

const demoWallpapers = [
  {
    id: "w1",
    title: "Neon Tokyo",
    creator: "CyberNeko",
    rarity: "legendary",
    price: 10000,
    edition: "#027 / 100",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w2",
    title: "Purple Galaxy",
    creator: "NovaX",
    rarity: "epic",
    price: 7500,
    edition: "#184 / 1000",
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w3",
    title: "Cyber City",
    creator: "PixelForge",
    rarity: "rare",
    price: 5000,
    edition: "#4921 / 10000",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w4",
    title: "Dark Mountain",
    creator: "VoidStudio",
    rarity: "mythic",
    price: 25000,
    edition: "#03 / 10",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w5",
    title: "Ocean Dream",
    creator: "BlueWave",
    rarity: "rare",
    price: 4500,
    edition: "#3280 / 10000",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=90"
  },

  {
    id: "w6",
    title: "Golden Future",
    creator: "LuxArt",
    rarity: "legendary",
    price: 15000,
    edition: "#041 / 100",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=90"
  }
];

let wallpapers = [];


/* =========================================================
   USER
========================================================= */

let userId =
  localStorage.getItem("walpap_user_id");

let username =
  localStorage.getItem("walpap_username") ||
  "WALPAP User";


/* =========================================================
   BALANCE
========================================================= */

let balance =
  Number(localStorage.getItem("walpap_balance"));

if (!Number.isFinite(balance)) {
  balance = 50000;
  saveBalance();
}


/* =========================================================
   OWNED
========================================================= */

let owned =
  JSON.parse(
    localStorage.getItem("walpap_owned") || "[]"
  );


/* =========================================================
   FAVORITES
========================================================= */

let favorites =
  JSON.parse(
    localStorage.getItem("walpap_favorites") || "[]"
  );


/* =========================================================
   STATE
========================================================= */

let currentWallpaper = null;

let currentFilter = "all";

let apiOnline = false;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    renderBalance();

    renderWallpapers();

    renderVault();

    updateWalletStats();

    await initializeUser();

    await loadWallpapers();

  }
);


/* =========================================================
   API HELPER
========================================================= */

async function apiRequest(
  endpoint,
  options = {}
) {

  const response =
    await fetch(
      API_BASE + endpoint,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );

  let data = null;

  try {
    data =
      await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {

    throw new Error(
      data?.message ||
      data?.error ||
      `API Error ${response.status}`
    );

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

    return apiOnline;

  } catch (error) {

    console.warn(
      "WALPAP API offline:",
      error
    );

    apiOnline = false;

    return false;

  }

}


/* =========================================================
   USER INITIALIZATION
========================================================= */

async function initializeUser() {

  if (userId) {

    try {

      const data =
        await apiRequest(
          `/api/users/${encodeURIComponent(userId)}`
        );

      const user =
        data?.user ||
        data?.data ||
        data;

      if (user?.id) {

        userId =
          user.id;

        username =
          user.name ||
          user.username ||
          username;

        localStorage.setItem(
          "walpap_user_id",
          userId
        );

        localStorage.setItem(
          "walpap_username",
          username
        );

        if (
          typeof user.balance === "number"
        ) {

          balance =
            user.balance;

          saveBalance();

        }

        renderBalance();

        return;

      }

    } catch (error) {

      console.warn(
        "Existing user could not be loaded.",
        error
      );

    }

  }


  /* Create new user */

  try {

    const data =
      await apiRequest(
        "/api/users",
        {
          method: "POST",

          body:
            JSON.stringify({
              name: username
            })
        }
      );

    const user =
      data?.user ||
      data?.data ||
      data;

    if (user?.id) {

      userId =
        user.id;

      username =
        user.name ||
        user.username ||
        username;

      localStorage.setItem(
        "walpap_user_id",
        userId
      );

      localStorage.setItem(
        "walpap_username",
        username
      );

    }

  } catch (error) {

    console.warn(
      "User API unavailable. Using local mode.",
      error
    );

  }

}


/* =========================================================
   LOAD WALLPAPERS
========================================================= */

async function loadWallpapers() {

  try {

    const data =
      await apiRequest(
        "/api/wallpapers"
      );

    let list =
      data?.wallpapers ||
      data?.data ||
      data?.items ||
      [];

    if (!Array.isArray(list)) {

      list = [];

    }


    wallpapers =
      list.map(
        normalizeWallpaper
      );


    if (!wallpapers.length) {

      wallpapers =
        demoWallpapers.slice();

    } else {

      apiOnline = true;

    }

    renderWallpapers();

    renderVault();

    updateWalletStats();

  } catch (error) {

    console.warn(
      "Using demo wallpaper data:",
      error
    );

    wallpapers =
      demoWallpapers.slice();

    renderWallpapers();

  }

}


/* =========================================================
   NORMALIZE WALLPAPER
========================================================= */

function normalizeWallpaper(item) {

  const rarity =
    String(
      item.rarity ||
      "rare"
    ).toLowerCase();

  const price =
    Number(
      item.price ||
      0
    );

  let edition =
    item.edition;

  if (!edition) {

    const serial =
      item.serialNumber ||
      item.editionNumber ||
      1;

    const max =
      item.editionSize ||
      item.maxEditions ||
      rarityMaxEditions(
        rarity
      );

    edition =
      `#${String(serial).padStart(3, "0")} / ${max}`;

  }

  return {

    id:
      item.id ||
      item.wallpaperId,

    title:
      item.title ||
      item.name ||
      "Untitled Wallpaper",

    creator:
      item.creator ||
      item.creatorName ||
      item.username ||
      "WALPAP Creator",

    rarity,

    price,

    edition,

    image:
      item.image ||
      item.imageUrl ||
      item.url ||
      "",

    editionSize:
      item.editionSize ||
      item.maxEditions ||
      rarityMaxEditions(
        rarity
      ),

    sold:
      item.sold ||
      item.soldCount ||
      0

  };

}


/* =========================================================
   RARITY EDITIONS
========================================================= */

function rarityMaxEditions(
  rarity
) {

  const values = {

    common: "UNLIMITED",

    rare: 10000,

    epic: 1000,

    legendary: 100,

    mythic: 10,

    "1/1": 1

  };

  return (
    values[rarity] ||
    10000
  );

}


/* =========================================================
   STORAGE HELPERS
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
    JSON.stringify(owned)
  );

}


function saveFavorites() {

  localStorage.setItem(
    "walpap_favorites",
    JSON.stringify(favorites)
  );

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


  if (balanceEl) {

    if (balance >= 1000000) {

      balanceEl.textContent =
        "Rp" +
        (balance / 1000000)
          .toFixed(1)
          .replace(".0", "") +
        "M";

    } else if (balance >= 1000) {

      balanceEl.textContent =
        "Rp" +
        Math.floor(
          balance / 1000
        ) +
        "K";

    } else {

      balanceEl.textContent =
        "Rp" +
        formatRupiah(balance);

    }

  }


  if (walletBalance) {

    walletBalance.textContent =
      "Rp" +
      formatRupiah(balance);

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

  if (!grid) return;


  let list =
    wallpapers.slice();


  if (
    currentFilter !== "all"
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

        <div class="rarity ${escapeAttribute(item.rarity)}">
          ${escapeHtml(
            item.rarity.toUpperCase()
          )}
        </div>

        <button
          class="favorite ${liked ? "active" : ""}"
          onclick="event.stopPropagation(); toggleFavorite('${escapeAttribute(item.id)}')"
        >
          ${liked ? "♥" : "♡"}
        </button>

      </div>


      <div class="wall-info">

        <div class="wall-title">
          ${escapeHtml(item.title)}
        </div>

        <div class="wall-creator">
          by ${escapeHtml(item.creator)}
        </div>

        <div class="wall-bottom">

          <div class="wall-price">
            Rp${formatRupiah(item.price)}
          </div>

          <div class="wall-edition">
            ${escapeHtml(item.edition)}
          </div>

        </div>

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
      el =>
        el.classList.remove(
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


  if (!item) return;


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

  if (!modal) return;


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

      const setButtons =
        document.getElementById(
          "setButtons"
        );

      if (setButtons) {

        setButtons.style.display =
          "grid";

      }

    } else {

      buyButton.textContent =
        "BUY NOW";

      buyButton.disabled =
        false;

      const setButtons =
        document.getElementById(
          "setButtons"
        );

      if (setButtons) {

        setButtons.style.display =
          "none";

      }

    }

  }


  modal.classList.add(
    "show"
  );

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

  if (!currentWallpaper)
    return;


  const item =
    currentWallpaper;


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
    !userId
  ) {

    showToast(
      "Akun belum siap. Coba lagi."
    );

    await initializeUser();

    if (!userId)
      return;

  }


  /* API PURCHASE */

  if (apiOnline) {

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


      const purchase =
        data?.purchase ||
        data?.data ||
        data;


      owned.push(
        item.id
      );

      saveOwned();


      if (
        purchase?.balance !==
        undefined
      ) {

        balance =
          Number(
            purchase.balance
          );

      } else {

        balance -=
          Number(
            item.price
          );

      }


      saveBalance();

      renderBalance();

      renderVault();

      updateWalletStats();

      markOwnedUI();

      showToast(
        "✓ Wallpaper berhasil masuk Vault!"
      );

      return;

    } catch (error) {

      console.error(
        "Purchase API error:",
        error
      );

      showToast(
        error.message ||
        "Pembelian gagal."
      );

      return;

    }

  }


  /* LOCAL DEMO FALLBACK */

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


  balance -=
    item.price;

  owned.push(
    item.id
  );

  saveBalance();

  saveOwned();

  renderBalance();

  renderVault();

  updateWalletStats();

  markOwnedUI();

  showToast(
    "✓ Wallpaper berhasil masuk Vault!"
  );

}


/* =========================================================
   MARK OWNED
========================================================= */

function markOwnedUI() {

  const buyButton =
    document.getElementById(
      "buyButton"
    );

  const setButtons =
    document.getElementById(
      "setButtons"
    );


  if (buyButton) {

    buyButton.textContent =
      "OWNED";

    buyButton.disabled =
      true;

  }


  if (setButtons) {

    setButtons.style.display =
      "grid";

  }

}


/* =========================================================
   FAVORITE
========================================================= */

async function toggleFavorite(
  id
) {

  const index =
    favorites.indexOf(id);


  if (index >= 0) {

    favorites.splice(
      index,
      1
    );

    showToast(
      "Dihapus dari Favorite"
    );

  } else {

    favorites.push(
      id
    );

    showToast(
      "♥ Ditambahkan ke Favorite"
    );

  }


  saveFavorites();

  renderWallpapers();

  renderVault();

  updateWalletStats();


  /* Sync API */

  if (
    userId &&
    apiOnline
  ) {

    try {

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

    } catch (error) {

      console.warn(
        "Favorite API sync failed:",
        error
      );

    }

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

  if (!row) return;


  /* Try server vault */

  if (
    userId &&
    apiOnline
  ) {

    try {

      const data =
        await apiRequest(
          `/api/vault/${encodeURIComponent(userId)}`
        );

      const serverItems =
        data?.wallpapers ||
        data?.items ||
        data?.data;


      if (
        Array.isArray(
          serverItems
        )
      ) {

        const normalized =
          serverItems.map(
            normalizeWallpaper
          );


        if (
          normalized.length
        ) {

          row.innerHTML =
            normalized
              .map(
                vaultCard
              )
              .join("");

          return;

        }

      }

    } catch (error) {

      console.warn(
        "Vault API failed:",
        error
      );

    }

  }


  /* Local vault */

  const items =
    wallpapers.filter(
      item =>
        owned.includes(
          item.id
        )
    );


  if (!items.length) {

    row.innerHTML = `
      <div class="vault-empty">
        💎 Your Vault is empty.<br>
        Buy your first rare wallpaper.
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

    if (
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.WalpapWallpaper
    ) {

      if (
        target === "both"
      ) {

        await window.Capacitor
          .Plugins
          .WalpapWallpaper
          .setWallpaper({
            url:
              currentWallpaper.image,

            target:
              "home"
          });


        await window.Capacitor
          .Plugins
          .WalpapWallpaper
          .setWallpaper({
            url:
              currentWallpaper.image,

            target:
              "lock"
          });

      } else {

        await window.Capacitor
          .Plugins
          .WalpapWallpaper
          .setWallpaper({
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


    /* Browser fallback */

    const link =
      document.createElement(
        "a"
      );

    link.href =
      currentWallpaper.image;

    link.download =
      currentWallpaper.title +
      ".jpg";

    link.target =
      "_blank";

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

function openWallet() {

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
    DEMO ONLY.

    Nanti diganti dengan:
    QRIS
    Midtrans
    Xendit
    DOKU
    Bank Transfer
  */

  const amount =
    50000;


  balance +=
    amount;

  saveBalance();

  renderBalance();

  updateWalletStats();


  showToast(
    "+Rp50.000 demo top-up"
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
    () => {

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
   SEARCH
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
    () => {

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
   CREATOR PUBLISH
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


  /* API CREATOR */

  if (
    userId &&
    apiOnline
  ) {

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

                image,

                price,

                rarity:
                  "rare",

                editionSize:
                  10000

              })
          }
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

      return;

    } catch (error) {

      console.error(
        "Publish API error:",
        error
      );

      showToast(
        error.message ||
        "Gagal mempublish wallpaper."
      );

      return;

    }

  }


  /* LOCAL FALLBACK */

  const localItem = {

    id:
      "creator_" +
      Date.now(),

    title,

    creator:
      username,

    rarity:
      "rare",

    price,

    edition:
      "#001 / 10000",

    image,

    editionSize:
      10000

  };


  wallpapers.unshift(
    localItem
  );


  renderWallpapers();

  closeCreator();

  clearCreatorForm();


  showToast(
    "✓ Wallpaper berhasil dipublish!"
  );

}


/* =========================================================
   CLEAR CREATOR FORM
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

function openProfile() {

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

let toastTimer;


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
