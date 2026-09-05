/* =========================================================
   WALPAP V3
   Premium Digital Wallpaper Marketplace
========================================================= */

const wallpapers = [
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


/* =========================================================
   STORAGE
========================================================= */

let balance =
  Number(localStorage.getItem("walpap_balance"));

if (!balance) {
  balance = 50000;
  saveBalance();
}

let owned =
  JSON.parse(
    localStorage.getItem("walpap_owned") || "[]"
  );

let favorites =
  JSON.parse(
    localStorage.getItem("walpap_favorites") || "[]"
  );


/* =========================================================
   STATE
========================================================= */

let currentWallpaper = null;

let currentFilter = "all";


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  renderBalance();

  renderWallpapers();

  renderVault();

  updateWalletStats();

});


/* =========================================================
   STORAGE HELPERS
========================================================= */

function saveBalance() {

  localStorage.setItem(
    "walpap_balance",
    balance
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
   BALANCE
========================================================= */

function formatRupiah(number) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(number);

}


function renderBalance() {

  const balanceEl =
    document.getElementById("balance");

  const walletBalance =
    document.getElementById("walletBalance");

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
        Math.floor(balance / 1000) +
        "K";

    } else {

      balanceEl.textContent =
        "Rp" +
        balance;

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

  let list = wallpapers;

  if (currentFilter !== "all") {

    list =
      wallpapers.filter(
        item =>
          item.rarity === currentFilter
      );

  }

  grid.innerHTML =
    list.map(
      wallpaperCard
    ).join("");

}


function wallpaperCard(item) {

  const liked =
    favorites.includes(item.id);

  return `
    <article
      class="wall-card"
      onclick="openDetail('${item.id}')"
    >

      <div class="wall-image">

        <img
          src="${item.image}"
          alt="${escapeHtml(item.title)}"
          loading="lazy"
        >

        <div class="rarity ${item.rarity}">
          ${item.rarity.toUpperCase()}
        </div>

        <button
          class="favorite ${liked ? "active" : ""}"
          onclick="event.stopPropagation(); toggleFavorite('${item.id}')"
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
            ${item.edition}
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

  currentFilter = rarity;

  document
    .querySelectorAll(".filter")
    .forEach(
      el =>
        el.classList.remove("active")
    );

  if (button) {

    button.classList.add("active");

  }

  renderWallpapers();

}


/* =========================================================
   DETAIL
========================================================= */

function openDetail(id) {

  const item =
    wallpapers.find(
      wallpaper =>
        wallpaper.id === id
    );

  if (!item) return;

  currentWallpaper = item;

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

  image.innerHTML = `
    <img
      src="${item.image}"
      alt="${escapeHtml(item.title)}"
    >
  `;

  rarity.textContent =
    item.rarity.toUpperCase();

  title.textContent =
    item.title;

  creator.textContent =
    item.creator;

  edition.textContent =
    item.edition;

  price.textContent =
    "Rp" +
    formatRupiah(item.price);

  if (owned.includes(item.id)) {

    buyButton.textContent =
      "OWNED";

    buyButton.disabled = true;

    document.getElementById(
      "setButtons"
    ).style.display = "grid";

  } else {

    buyButton.textContent =
      "BUY NOW";

    buyButton.disabled = false;

    document.getElementById(
      "setButtons"
    ).style.display = "none";

  }

  modal.classList.add("show");

}


/* =========================================================
   CLOSE DETAIL
========================================================= */

function closeDetail() {

  document
    .getElementById("detailModal")
    .classList.remove("show");

  currentWallpaper = null;

}


/* =========================================================
   BUY
========================================================= */

function buyCurrent() {

  if (!currentWallpaper) return;

  const item =
    currentWallpaper;

  if (owned.includes(item.id)) {

    showToast(
      "Wallpaper sudah kamu miliki."
    );

    return;

  }

  if (balance < item.price) {

    showToast(
      "Saldo WALPAP tidak cukup."
    );

    openWallet();

    return;

  }

  balance -= item.price;

  owned.push(item.id);

  saveBalance();

  saveOwned();

  renderBalance();

  renderVault();

  updateWalletStats();

  document.getElementById(
    "buyButton"
  ).textContent = "OWNED";

  document.getElementById(
    "buyButton"
  ).disabled = true;

  document.getElementById(
    "setButtons"
  ).style.display = "grid";

  showToast(
    "✓ Wallpaper berhasil masuk Vault!"
  );

}


/* =========================================================
   FAVORITE
========================================================= */

function toggleFavorite(id) {

  const index =
    favorites.indexOf(id);

  if (index >= 0) {

    favorites.splice(index, 1);

    showToast(
      "Dihapus dari Favorite"
    );

  } else {

    favorites.push(id);

    showToast(
      "♥ Ditambahkan ke Favorite"
    );

  }

  saveFavorites();

  renderWallpapers();

  renderVault();

  updateWalletStats();

}


function toggleFavoriteCurrent() {

  if (!currentWallpaper) return;

  toggleFavorite(
    currentWallpaper.id
  );

}


/* =========================================================
   VAULT
========================================================= */

function renderVault() {

  const row =
    document.getElementById(
      "vaultRow"
    );

  if (!row) return;

  const items =
    wallpapers.filter(
      item =>
        owned.includes(item.id)
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
        item => `
          <div
            class="vault-card"
            onclick="openDetail('${item.id}')"
          >

            <img
              src="${item.image}"
              alt="${escapeHtml(item.title)}"
              loading="lazy"
            >

          </div>
        `
      )
      .join("");

}


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

  if (!currentWallpaper) return;

  if (!owned.includes(
    currentWallpaper.id
  )) {

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

      if (target === "both") {

        await window.Capacitor.Plugins.WalpapWallpaper.setWallpaper({
          url: currentWallpaper.image,
          target: "home"
        });

        await window.Capacitor.Plugins.WalpapWallpaper.setWallpaper({
          url: currentWallpaper.image,
          target: "lock"
        });

      } else {

        await window.Capacitor.Plugins.WalpapWallpaper.setWallpaper({
          url: currentWallpaper.image,
          target: target
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
      document.createElement("a");

    link.href =
      currentWallpaper.image;

    link.download =
      currentWallpaper.title +
      ".jpg";

    link.target = "_blank";

    document.body.appendChild(link);

    link.click();

    link.remove();

    showToast(
      "Gambar dibuka. Simpan lalu jadikan wallpaper."
    );

  } catch (error) {

    console.error(error);

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

  document
    .getElementById("walletModal")
    .classList.add("show");

}


function closeWallet() {

  document
    .getElementById("walletModal")
    .classList.remove("show");

}


function topUp() {

  /*
    Demo top-up.
    Nanti bisa diganti:
    QRIS
    Midtrans
    Xendit
    DOKU
    bank transfer
  */

  const amount =
    50000;

  balance += amount;

  saveBalance();

  renderBalance();

  updateWalletStats();

  showToast(
    "+Rp50.000 demo top-up"
  );

}


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

  document
    .getElementById("searchModal")
    .classList.add("show");

  setTimeout(() => {

    const input =
      document.getElementById(
        "searchInput"
      );

    if (input) {

      input.focus();

    }

  }, 150);

  searchWallpapers();

}


function closeSearch() {

  document
    .getElementById("searchModal")
    .classList.remove("show");

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

  if (!input || !results) return;

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
              .includes(query) ||
            item.creator
              .toLowerCase()
              .includes(query) ||
            item.rarity
              .toLowerCase()
              .includes(query)
        )
      : wallpapers.slice(0, 5);

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
            onclick="openSearchResult('${item.id}')"
          >

            <img
              src="${item.image}"
              alt=""
            >

            <div>

              <strong>
                ${escapeHtml(item.title)}
              </strong>

              <span>
                ${escapeHtml(item.creator)}
                ·
                ${item.rarity.toUpperCase()}
              </span>

            </div>

          </button>
        `
      )
      .join("");

}


function openSearchResult(id) {

  closeSearch();

  setTimeout(() => {

    openDetail(id);

  }, 200);

}


/* =========================================================
   CREATOR
========================================================= */

function openCreator() {

  document
    .getElementById("creatorModal")
    .classList.add("show");

}


function closeCreator() {

  document
    .getElementById("creatorModal")
    .classList.remove("show");

}


function publishWallpaper() {

  const title =
    document
      .getElementById("creatorTitle")
      .value
      .trim();

  const image =
    document
      .getElementById("creatorImage")
      .value
      .trim();

  const price =
    Number(
      document
        .getElementById("creatorPrice")
        .value
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

  if (!price || price < 0) {

    showToast(
      "Harga tidak valid."
    );

    return;

  }

  wallpapers.unshift({

    id:
      "creator_" +
      Date.now(),

    title,

    creator:
      "WALPAP Creator",

    rarity:
      "rare",

    price,

    edition:
      "#001 / 10000",

    image

  });

  renderWallpapers();

  closeCreator();

  document
    .getElementById(
      "creatorTitle"
    )
    .value = "";

  document
    .getElementById(
      "creatorImage"
    )
    .value = "";

  document
    .getElementById(
      "creatorPrice"
    )
    .value = "";

  showToast(
    "✓ Wallpaper berhasil dipublish!"
  );

}


/* =========================================================
   PROFILE
========================================================= */

function openProfile() {

  updateWalletStats();

  document
    .getElementById("profileModal")
    .classList.add("show");

}


function closeProfile() {

  document
    .getElementById("profileModal")
    .classList.remove("show");

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
   TOAST
========================================================= */

let toastTimer;

function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );

  if (!toast) return;

  toast.textContent =
    message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2600);

}


/* =========================================================
   SECURITY / HTML ESCAPE
========================================================= */

function escapeHtml(value) {

  return String(value)

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
