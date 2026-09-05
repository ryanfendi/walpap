const wallpapers = [
    {
        id: "w1",
        name: "Neon Samurai",
        creator: "KAIRO",
        rarity: "legendary",
        price: 10000,
        edition: "#027 / 100",
        image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=90"
    },

    {
        id: "w2",
        name: "Cosmic Void",
        creator: "NOVA",
        rarity: "epic",
        price: 7000,
        edition: "#241 / 1000",
        image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=90"
    },

    {
        id: "w3",
        name: "Purple Dream",
        creator: "ELLA",
        rarity: "rare",
        price: 3000,
        edition: "#2188 / 10000",
        image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=90"
    },

    {
        id: "w4",
        name: "Dark Mountain",
        creator: "ZERO",
        rarity: "mythic",
        price: 25000,
        edition: "#07 / 10",
        image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=90"
    },

    {
        id: "w5",
        name: "Blue Horizon",
        creator: "WALPAP",
        rarity: "common",
        price: 0,
        edition: "UNLIMITED",
        image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=90"
    },

    {
        id: "w6",
        name: "Cyber City",
        creator: "NEON",
        rarity: "epic",
        price: 8500,
        edition: "#501 / 1000",
        image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=90"
    }
];


let balance =
    Number(localStorage.getItem("walpap_balance"))
    || 50000;

let owned =
    JSON.parse(
        localStorage.getItem("walpap_owned")
        || "[]"
    );

let favorites =
    JSON.parse(
        localStorage.getItem("walpap_favorites")
        || "[]"
    );

let currentWallpaper = null;
let currentFilter = "all";


/* INIT */

document.addEventListener("DOMContentLoaded", () => {

    updateBalance();

    renderWallpapers(wallpapers, "wallpaperGrid");

    renderWallpapers(wallpapers, "exploreGrid");

    renderCollection();

});


/* PAGE */

function showPage(pageId, button) {

    document.querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });

    const page =
        document.getElementById(pageId);

    if (page) {
        page.classList.add("active");
    }

    document.querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* EXPLORE */

function openExplore() {

    showPage("explorePage");

    renderWallpapers(
        wallpapers,
        "exploreGrid"
    );
}


/* COLLECTION */

function openCollection() {

    showPage("collectionPage");

    renderCollection();
}


/* HOME SCROLL */

function scrollToDrops() {

    document.getElementById("drops")
        ?.scrollIntoView({
            behavior: "smooth"
        });

}


/* RENDER */

function renderWallpapers(list, elementId) {

    const container =
        document.getElementById(elementId);

    if (!container) return;

    if (!list.length) {

        container.innerHTML = `
            <div class="empty-collection">
                Tidak ada wallpaper ditemukan.
            </div>
        `;

        return;
    }

    container.innerHTML =
        list.map(w => createCard(w))
        .join("");

}


/* CARD */

function createCard(w) {

    const isFavorite =
        favorites.includes(w.id);

    const price =
        w.price === 0
        ? "FREE"
        : formatRupiah(w.price);

    return `
        <article
            class="wallpaper-card"
            onclick="openDetail('${w.id}')">

            <div class="wallpaper-image">

                <img
                    src="${w.image}"
                    alt="${escapeHTML(w.name)}"
                    loading="lazy">

                <div class="card-gradient"></div>

                <div class="rarity">
                    ${w.rarity.toUpperCase()}
                </div>

                <button
                    class="favorite ${isFavorite ? "active" : ""}"
                    onclick="event.stopPropagation();
                    toggleFavorite('${w.id}')">

                    ${isFavorite ? "♥" : "♡"}

                </button>

            </div>

            <div class="card-info">

                <h3>
                    ${escapeHTML(w.name)}
                </h3>

                <p>
                    ${escapeHTML(w.creator)}
                </p>

                <div class="card-bottom">

                    <span class="price">
                        ${price}
                    </span>

                    <span class="edition">
                        ${w.edition}
                    </span>

                </div>

            </div>

        </article>
    `;
}


/* DETAIL */

function openDetail(id) {

    const wallpaper =
        wallpapers.find(w => w.id === id);

    if (!wallpaper) return;

    currentWallpaper = wallpaper;

    document.getElementById("detailImage")
        .style.backgroundImage =
        `url("${wallpaper.image}")`;

    document.getElementById("detailName")
        .textContent = wallpaper.name;

    document.getElementById("detailCreator")
        .textContent =
        "CREATOR • " + wallpaper.creator;

    document.getElementById("detailEdition")
        .textContent = wallpaper.edition;

    document.getElementById("detailRarity")
        .textContent =
        wallpaper.rarity.toUpperCase();

    document.getElementById("detailRarityText")
        .textContent =
        wallpaper.rarity.toUpperCase();

    document.getElementById("detailPrice")
        .textContent =
        wallpaper.price === 0
        ? "FREE"
        : formatRupiah(wallpaper.price);

    const buyButton =
        document.getElementById("buyButton");

    if (owned.includes(wallpaper.id)) {

        buyButton.textContent =
            "OWNED";

        buyButton.disabled = true;

    } else {

        buyButton.textContent =
            wallpaper.price === 0
            ? "COLLECT"
            : "BUY NOW";

        buyButton.disabled = false;
    }

    document.getElementById("detailModal")
        .classList.add("open");
}


/* BUY */

function buyCurrentWallpaper() {

    if (!currentWallpaper) return;

    const w = currentWallpaper;

    if (owned.includes(w.id)) {

        showToast("Wallpaper sudah dimiliki.");

        return;
    }


    if (w.price === 0) {

        owned.push(w.id);

        saveOwned();

        renderCollection();

        showToast(
            "✓ Wallpaper masuk ke Collection"
        );

        return;
    }


    if (balance < w.price) {

        showToast(
            "Saldo tidak cukup. Top up Wallet."
        );

        openWallet();

        return;
    }


    balance -= w.price;

    owned.push(w.id);

    saveOwned();

    saveBalance();

    updateBalance();

    renderCollection();

    document.getElementById("buyButton")
        .textContent = "OWNED";

    document.getElementById("buyButton")
        .disabled = true;

    showToast(
        "✓ Berhasil membeli " + w.name
    );

}


/* FAVORITE */

function toggleFavorite(id) {

    if (favorites.includes(id)) {

        favorites =
            favorites.filter(x => x !== id);

    } else {

        favorites.push(id);

    }

    localStorage.setItem(
        "walpap_favorites",
        JSON.stringify(favorites)
    );

    renderWallpapers(
        wallpapers,
        "wallpaperGrid"
    );

    renderWallpapers(
        getFiltered(),
        "exploreGrid"
    );

    renderCollection();

}


/* FILTER */

function filterCategory(category) {

    currentFilter = category;

    const filtered =
        category === "all"
        ? wallpapers
        : wallpapers.filter(
            w => w.rarity === category
        );

    renderWallpapers(
        filtered,
        "wallpaperGrid"
    );

    renderWallpapers(
        filtered,
        "exploreGrid"
    );

    showPage("explorePage");

}


function getFiltered() {

    if (currentFilter === "all") {
        return wallpapers;
    }

    return wallpapers.filter(
        w => w.rarity === currentFilter
    );

}


/* COLLECTION */

function renderCollection() {

    const grid =
        document.getElementById("collectionGrid");

    const preview =
        document.getElementById("collectionPreview");

    const ownedWallpapers =
        wallpapers.filter(
            w => owned.includes(w.id)
        );


    if (grid) {

        grid.innerHTML =
            ownedWallpapers.length
            ? ownedWallpapers
                .map(w => createCard(w))
                .join("")
            : `
                <div class="empty-collection">
                    Koleksimu masih kosong.<br>
                    Mulai koleksi wallpaper pertamamu.
                </div>
            `;

    }


    if (preview) {

        preview.innerHTML =
            ownedWallpapers.length
            ? ownedWallpapers
                .slice(0, 5)
                .map(w => `
                    <div class="collection-mini"
                         onclick="openDetail('${w.id}')">

                        <img src="${w.image}"
                             alt="${w.name}">

                    </div>
                `)
                .join("")
            : `
                <div class="empty-collection">
                    Your Vault is empty
                </div>
            `;

    }


    const count =
        document.getElementById("ownedCount");

    const favCount =
        document.getElementById("favoriteCount");

    if (count) {
        count.textContent =
            ownedWallpapers.length;
    }

    if (favCount) {
        favCount.textContent =
            favorites.length;
    }

}


/* WALLET */

function openWallet() {

    document.getElementById("walletBig")
        .textContent =
        formatRupiah(balance);

    document.getElementById("walletModal")
        .classList.add("open");

}


function topUp(amount) {

    balance += amount;

    saveBalance();

    updateBalance();

    document.getElementById("walletBig")
        .textContent =
        formatRupiah(balance);

    showToast(
        "+" + formatRupiah(amount)
    );

}


function updateBalance() {

    const balanceElement =
        document.getElementById("balance");

    if (balanceElement) {

        balanceElement.textContent =
            formatRupiah(balance);

    }

}


function saveBalance() {

    localStorage.setItem(
        "walpap_balance",
        balance
    );

}


/* SAVE */

function saveOwned() {

    localStorage.setItem(
        "walpap_owned",
        JSON.stringify(owned)
    );

}


/* CREATOR */

function openCreator() {

    document.getElementById("creatorModal")
        .classList.add("open");

}


function publishWallpaper() {

    const name =
        document.getElementById("creatorName")
            .value.trim();

    const price =
        Number(
            document.getElementById("creatorPrice")
                .value
        );

    const rarity =
        document.getElementById("creatorRarity")
            .value;

    const image =
        document.getElementById("creatorImage")
            .value.trim();


    if (!name || !image) {

        showToast(
            "Isi nama dan URL gambar."
        );

        return;
    }


    const newWallpaper = {

        id:
            "creator_" +
            Date.now(),

        name,

        creator:
            "YOU",

        rarity,

        price:
            Number.isFinite(price)
            ? price
            : 0,

        edition:
            rarity === "mythic"
            ? "#01 / 10"
            : "NEW",

        image

    };


    wallpapers.unshift(
        newWallpaper
    );


    closeModal("creatorModal");

    renderWallpapers(
        wallpapers,
        "wallpaperGrid"
    );

    renderWallpapers(
        wallpapers,
        "exploreGrid"
    );


    document.getElementById("creatorName")
        .value = "";

    document.getElementById("creatorPrice")
        .value = "";

    document.getElementById("creatorImage")
        .value = "";


    showToast(
        "✓ Wallpaper berhasil dipublish"
    );

}


/* SEARCH */

function openSearch() {

    document.getElementById("searchModal")
        .classList.add("open");

    setTimeout(() => {

        document.getElementById("searchInput")
            ?.focus();

    }, 200);

}


function searchWallpaper() {

    const query =
        document.getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();

    const results =
        wallpapers.filter(w =>
            w.name.toLowerCase().includes(query)
            ||
            w.creator.toLowerCase().includes(query)
            ||
            w.rarity.toLowerCase().includes(query)
        );


    const container =
        document.getElementById("searchResults");

    container.innerHTML =
        results.map(w => `
            <div class="search-result"
                 onclick="closeModal('searchModal');
                 openDetail('${w.id}')">

                <img src="${w.image}"
                     alt="${w.name}">

                <div>

                    <strong>
                        ${escapeHTML(w.name)}
                    </strong>

                    <p>
                        ${w.rarity.toUpperCase()}
                        • ${w.edition}
                    </p>

                </div>

            </div>
        `).join("");

}


/* WALLPAPER */

async function setCurrentWallpaper(target) {

    if (!currentWallpaper) return;

    if (!owned.includes(currentWallpaper.id)) {

        showToast(
            "Beli/collect wallpaper terlebih dahulu."
        );

        return;
    }


    const isNative =
        window.Capacitor &&
        window.Capacitor.isNativePlatform &&
        window.Capacitor.isNativePlatform();


    if (isNative) {

        try {

            await window.Capacitor.Plugins
                .WalpapWallpaper
                .setWallpaper({

                    url: currentWallpaper.image,

                    target: target

                });


            showToast(
                target === "home"
                ? "✓ Home Screen berhasil diubah"
                : "✓ Lock Screen berhasil diubah"
            );

        } catch (error) {

            console.error(error);

            showToast(
                "Gagal memasang wallpaper."
            );

        }

    } else {

        const link =
            document.createElement("a");

        link.href =
            currentWallpaper.image;

        link.download =
            "WALPAP-" +
            currentWallpaper.name
                .replace(/\s+/g, "-") +
            ".jpg";

        document.body.appendChild(link);

        link.click();

        link.remove();

        showToast(
            "Gambar diunduh. Atur wallpaper melalui Galeri."
        );

    }

}


/* CLOSE MODAL */

function closeModal(id) {

    document.getElementById(id)
        ?.classList.remove("open");

}


/* FORMAT */

function formatRupiah(number) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(number);

}


/* TOAST */

let toastTimer;

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);

}


/* ESCAPE HTML */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
