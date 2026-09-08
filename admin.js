/* =========================================================
   WALPAP ADMIN
   FIREBASE AUTH + FIRESTORE ONLY

   NO FIREBASE STORAGE
   ---------------------------------------------------------
   Artwork disimpan menggunakan imageUrl publik.
   ========================================================= */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
   ========================================================= */

const {
  auth,
  db,
  provider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} = window.WALPAP_ADMIN_FIREBASE;


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;

let wallpapers = [];

let editingWallpaperId = null;


/* =========================================================
   DOM
   ========================================================= */

const loginScreen =
  document.getElementById("loginScreen");

const adminApp =
  document.getElementById("adminApp");

const googleLoginBtn =
  document.getElementById("googleLoginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const loginError =
  document.getElementById("loginError");

const adminAvatar =
  document.getElementById("adminAvatar");

const adminUserName =
  document.getElementById("adminUserName");

const statRevenue =
  document.getElementById("statRevenue");

const statCollectors =
  document.getElementById("statCollectors");

const statWallpapers =
  document.getElementById("statWallpapers");

const statSold =
  document.getElementById("statSold");

const newWallpaperBtn =
  document.getElementById("newWallpaperBtn");

const wallpaperList =
  document.getElementById("wallpaperList");

const wallpaperFormSection =
  document.getElementById(
    "wallpaperFormSection"
  );

const formTitle =
  document.getElementById("formTitle");

const wallpaperForm =
  document.getElementById("wallpaperForm");

const saveWallpaperBtn =
  document.getElementById(
    "saveWallpaperBtn"
  );

const cancelFormBtn =
  document.getElementById(
    "cancelFormBtn"
  );

const cancelFormBtn2 =
  document.getElementById(
    "cancelFormBtn2"
  );

const imageUrlInput =
  document.getElementById("imageUrl");

const imagePreview =
  document.getElementById(
    "imagePreview"
  );

const previewEmpty =
  document.getElementById(
    "previewEmpty"
  );

const toast =
  document.getElementById("toast");

const toastMessage =
  document.getElementById(
    "toastMessage"
  );


/* =========================================================
   HELPERS
   ========================================================= */

function formatIDR(value) {

  const number =
    Number(value || 0);

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(number);
}


function escapeHTML(value) {

  if (value === null ||
      value === undefined) {

    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function showToast(message) {

  toastMessage.textContent =
    message;

  toast.classList.add("show");

  clearTimeout(
    showToast.timeout
  );

  showToast.timeout =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2800);
}


function showLoginError(message) {

  loginError.textContent =
    message;

  loginError.classList.remove(
    "hidden"
  );
}


function hideLoginError() {

  loginError.textContent = "";

  loginError.classList.add(
    "hidden"
  );
}


function formatDate(timestamp) {

  if (!timestamp) {
    return "-";
  }

  try {

    const date =
      timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

    return new Intl.DateTimeFormat(
      "id-ID",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    ).format(date);

  } catch {

    return "-";

  }
}


/* =========================================================
   AUTH
   ========================================================= */

googleLoginBtn.addEventListener(
  "click",
  async () => {

    hideLoginError();

    googleLoginBtn.disabled = true;

    googleLoginBtn.textContent =
      "Signing in...";

    try {

      await signInWithPopup(
        auth,
        provider
      );

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      showLoginError(
        getAuthErrorMessage(error)
      );

    } finally {

      googleLoginBtn.disabled =
        false;

      googleLoginBtn.textContent =
        "Continue with Google";

    }

  }
);


logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );

      showToast(
        "Gagal logout."
      );

    }

  }
);


function getAuthErrorMessage(error) {

  const code =
    error?.code || "";

  if (
    code ===
    "auth/popup-closed-by-user"
  ) {

    return "Login dibatalkan.";

  }

  if (
    code ===
    "auth/popup-blocked"
  ) {

    return "Popup login diblokir browser.";

  }

  if (
    code ===
    "auth/unauthorized-domain"
  ) {

    return (
      "Domain belum ditambahkan ke Firebase " +
      "Authentication → Authorized domains."
    );

  }

  return (
    "Login gagal. Pastikan konfigurasi " +
    "Firebase sudah benar."
  );
}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      currentUser = null;

      showLogin();

      return;
    }

    currentUser = user;

    try {

      const isAdmin =
        await checkAdmin(
          user.uid
        );

      if (!isAdmin) {

        showLoginError(
          "Akun ini bukan administrator WALPAP."
        );

        await signOut(auth);

        return;
      }

      showAdmin();

      updateAdminHeader(
        user
      );

      await loadDashboard();

    } catch (error) {

      console.error(
        "AUTH CHECK ERROR:",
        error
      );

      showLoginError(
        "Gagal memeriksa akses admin."
      );

    }

  }
);


/* =========================================================
   SHOW / HIDE
   ========================================================= */

function showLogin() {

  loginScreen.classList.remove(
    "hidden"
  );

  adminApp.classList.add(
    "hidden"
  );
}


function showAdmin() {

  loginScreen.classList.add(
    "hidden"
  );

  adminApp.classList.remove(
    "hidden"
  );
}


/* =========================================================
   ADMIN CHECK
   ========================================================= */

async function checkAdmin(uid) {

  if (!uid) {
    return false;
  }

  const adminRef =
    doc(
      db,
      "admins",
      uid
    );

  const snapshot =
    await getDoc(adminRef);

  return snapshot.exists();
}


/* =========================================================
   ADMIN HEADER
   ========================================================= */

function updateAdminHeader(user) {

  adminUserName.textContent =
    user.displayName ||
    user.email ||
    "Admin";

  if (user.photoURL) {

    adminAvatar.src =
      user.photoURL;

  } else {

    adminAvatar.src =
      "data:image/svg+xml," +
      encodeURIComponent(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="100"
        >
          <rect
            width="100"
            height="100"
            fill="#222"
          />
          <text
            x="50"
            y="58"
            text-anchor="middle"
            font-size="40"
            fill="#aaa"
          >
            A
          </text>
        </svg>
      `);

  }
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

  await Promise.all([

    loadWallpapers(),

    loadStats()

  ]);

}


/* =========================================================
   LOAD WALLPAPERS
   ========================================================= */

async function loadWallpapers() {

  wallpaperList.innerHTML =
    `
      <div class="empty">
        Loading wallpapers...
      </div>
    `;

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

    } catch {

      snapshot =
        await getDocs(
          wallpapersRef
        );

    }

    wallpapers =
      snapshot.docs.map(
        item => ({

          id: item.id,

          ...item.data()

        })
      );

    renderWallpapers();

    updateWallpaperCount();

  } catch (error) {

    console.error(
      "LOAD WALLPAPERS ERROR:",
      error
    );

    wallpaperList.innerHTML =
      `
        <div class="empty">
          Gagal memuat wallpapers.
        </div>
      `;

  }
}


/* =========================================================
   RENDER WALLPAPERS
   ========================================================= */

function renderWallpapers() {

  if (!wallpapers.length) {

    wallpaperList.innerHTML =
      `
        <div class="empty">
          Belum ada wallpaper.
          <br><br>
          Klik "+ New Wallpaper"
          untuk membuat koleksi pertama.
        </div>
      `;

    return;
  }


  wallpaperList.innerHTML =
    wallpapers
      .map(
        wallpaper =>
          renderWallpaperCard(
            wallpaper
          )
      )
      .join("");


  document
    .querySelectorAll(
      "[data-edit-wallpaper]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset
              .editWallpaper;

          editWallpaper(id);

        }
      );

    });


  document
    .querySelectorAll(
      "[data-delete-wallpaper]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset
              .deleteWallpaper;

          deleteWallpaper(id);

        }
      );

    });

}


function renderWallpaperCard(
  wallpaper
) {

  const image =
    wallpaper.imageUrl ||
    "";

  const title =
    wallpaper.title ||
    "Untitled";

  const subtitle =
    wallpaper.subtitle ||
    "";

  const status =
    wallpaper.status ||
    "draft";

  const price =
    wallpaper.price || 0;

  const editionTotal =
    wallpaper.editionTotal || 0;

  const editionSold =
    wallpaper.editionSold || 0;

  const remaining =
    Math.max(
      0,
      editionTotal - editionSold
    );


  return `

    <article
      class="wallpaper-card"
    >

      ${
        image
          ? `
            <img
              class="wallpaper-image"
              src="${escapeHTML(image)}"
              alt="${escapeHTML(title)}"
              loading="lazy"
              onerror="this.style.display='none'"
            >
          `
          : `
            <div
              class="wallpaper-image"
            ></div>
          `
      }


      <div class="wallpaper-content">

        <div class="wallpaper-top">

          <div>

            <div class="wallpaper-title">
              ${escapeHTML(title)}
            </div>

            <div class="wallpaper-subtitle">
              ${escapeHTML(subtitle)}
            </div>

          </div>

          <div class="status">
            ${escapeHTML(status)}
          </div>

        </div>


        <div class="wallpaper-info">

          <div class="info-item">

            <div class="info-label">
              PRICE
            </div>

            <div class="info-value">
              ${formatIDR(price)}
            </div>

          </div>


          <div class="info-item">

            <div class="info-label">
              EDITIONS
            </div>

            <div class="info-value">
              ${editionSold} / ${editionTotal}
            </div>

          </div>


          <div class="info-item">

            <div class="info-label">
              REMAINING
            </div>

            <div class="info-value">
              ${remaining}
            </div>

          </div>


          <div class="info-item">

            <div class="info-label">
              RELEASE
            </div>

            <div class="info-value">
              ${formatDate(
                wallpaper.releaseAt
              )}
            </div>

          </div>

        </div>


        <div class="card-actions">

          <button
            class="secondary-btn"
            type="button"
            data-edit-wallpaper="${escapeHTML(
              wallpaper.id
            )}"
          >
            Edit
          </button>

          <button
            class="danger-btn"
            type="button"
            data-delete-wallpaper="${escapeHTML(
              wallpaper.id
            )}"
          >
            Delete
          </button>

        </div>

      </div>

    </article>

  `;
}


/* =========================================================
   STATS
   ========================================================= */

async function loadStats() {

  try {

    /*
    USERS
    */

    const usersSnapshot =
      await getDocs(
        collection(
          db,
          "users"
        )
      );

    statCollectors.textContent =
      usersSnapshot.size;


    /*
    PURCHASES
    */

    const purchasesSnapshot =
      await getDocs(
        collection(
          db,
          "purchases"
        )
      );


    let revenue = 0;

    let sold = 0;


    purchasesSnapshot.forEach(
      item => {

        const data =
          item.data();

        revenue +=
          Number(
            data.price ||
            data.amount ||
            0
          );

        sold += 1;

      }
    );


    statRevenue.textContent =
      formatIDR(
        revenue
      );

    statSold.textContent =
      sold;


  } catch (error) {

    console.error(
      "STATS ERROR:",
      error
    );

    statRevenue.textContent =
      "Rp0";

    statCollectors.textContent =
      "0";

    statSold.textContent =
      "0";

  }


  updateWallpaperCount();

}


function updateWallpaperCount() {

  statWallpapers.textContent =
    wallpapers.length;
}


/* =========================================================
   NEW WALLPAPER
   ========================================================= */

newWallpaperBtn.addEventListener(
  "click",
  () => {

    openNewWallpaperForm();

  }
);


function openNewWallpaperForm() {

  editingWallpaperId = null;

  formTitle.textContent =
    "New Wallpaper";

  saveWallpaperBtn.textContent =
    "Save Wallpaper";

  wallpaperForm.reset();

  resetImagePreview();

  wallpaperFormSection
    .classList
    .remove("hidden");

  wallpaperFormSection
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


/* =========================================================
   EDIT WALLPAPER
   ========================================================= */

function editWallpaper(id) {

  const wallpaper =
    wallpapers.find(
      item =>
        item.id === id
    );

  if (!wallpaper) {

    showToast(
      "Wallpaper tidak ditemukan."
    );

    return;
  }


  editingWallpaperId =
    id;


  formTitle.textContent =
    "Edit Wallpaper";

  saveWallpaperBtn.textContent =
    "Update Wallpaper";


  document.getElementById(
    "title"
  ).value =
    wallpaper.title || "";


  document.getElementById(
    "subtitle"
  ).value =
    wallpaper.subtitle || "";


  document.getElementById(
    "category"
  ).value =
    wallpaper.category || "";


  document.getElementById(
    "status"
  ).value =
    wallpaper.status || "draft";


  document.getElementById(
    "price"
  ).value =
    wallpaper.price || "";


  document.getElementById(
    "editionTotal"
  ).value =
    wallpaper.editionTotal || "";


  document.getElementById(
    "description"
  ).value =
    wallpaper.description || "";


  imageUrlInput.value =
    wallpaper.imageUrl || "";


  /*
  releaseAt
  */

  if (wallpaper.releaseAt) {

    try {

      const date =
        wallpaper.releaseAt.toDate
          ? wallpaper.releaseAt.toDate()
          : new Date(
              wallpaper.releaseAt
            );

      document.getElementById(
        "releaseAt"
      ).value =
        toDateTimeLocal(
          date
        );

    } catch {

      document.getElementById(
        "releaseAt"
      ).value = "";

    }

  } else {

    document.getElementById(
      "releaseAt"
    ).value = "";

  }


  updateImagePreview();


  wallpaperFormSection
    .classList
    .remove("hidden");


  wallpaperFormSection
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


function toDateTimeLocal(
  date
) {

  const pad =
    number =>
      String(number)
        .padStart(
          2,
          "0"
        );


  return (
    date.getFullYear() +
    "-" +
    pad(
      date.getMonth() + 1
    ) +
    "-" +
    pad(
      date.getDate()
    ) +
    "T" +
    pad(
      date.getHours()
    ) +
    ":" +
    pad(
      date.getMinutes()
    )
  );
}


/* =========================================================
   IMAGE URL PREVIEW
   ========================================================= */

imageUrlInput.addEventListener(
  "input",
  () => {

    updateImagePreview();

  }
);


function updateImagePreview() {

  const url =
    imageUrlInput.value.trim();


  if (!url) {

    resetImagePreview();

    return;
  }


  imagePreview.src =
    url;


  imagePreview.classList.remove(
    "hidden"
  );

  previewEmpty.classList.add(
    "hidden"
  );


  imagePreview.onload =
    () => {

      imagePreview.classList.remove(
        "hidden"
      );

      previewEmpty.classList.add(
        "hidden"
      );

    };


  imagePreview.onerror =
    () => {

      imagePreview.classList.add(
        "hidden"
      );

      previewEmpty.textContent =
        "URL gambar tidak dapat dimuat.";

      previewEmpty.classList.remove(
        "hidden"
      );

    };

}


function resetImagePreview() {

  imagePreview.src = "";

  imagePreview.classList.add(
    "hidden"
  );

  previewEmpty.textContent =
    "Masukkan URL gambar untuk melihat preview.";

  previewEmpty.classList.remove(
    "hidden"
  );

}


/* =========================================================
   SAVE / UPDATE
   ========================================================= */

wallpaperForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (!currentUser) {

      showToast(
        "Admin belum login."
      );

      return;
    }


    const title =
      document.getElementById(
        "title"
      ).value.trim();


    const subtitle =
      document.getElementById(
        "subtitle"
      ).value.trim();


    const category =
      document.getElementById(
        "category"
      ).value.trim();


    const status =
      document.getElementById(
        "status"
      ).value;


    const price =
      Number(
        document.getElementById(
          "price"
        ).value
      );


    const editionTotal =
      Number(
        document.getElementById(
          "editionTotal"
        ).value
      );


    const releaseAt =
      document.getElementById(
        "releaseAt"
      ).value;


    const imageUrl =
      imageUrlInput.value.trim();


    const description =
      document.getElementById(
        "description"
      ).value.trim();


    /*
    VALIDATION
    */

    if (!title) {

      showToast(
        "Title wajib diisi."
      );

      return;
    }


    if (
      !Number.isFinite(price) ||
      price < 0
    ) {

      showToast(
        "Harga tidak valid."
      );

      return;
    }


    if (
      !Number.isInteger(
        editionTotal
      ) ||
      editionTotal < 1
    ) {

      showToast(
        "Jumlah edition tidak valid."
      );

      return;
    }


    if (
      imageUrl &&
      !isValidHttpUrl(
        imageUrl
      )
    ) {

      showToast(
        "Image URL harus berupa URL http/https."
      );

      return;
    }


    /*
    CHECK EXISTING SOLD
    */

    let editionSold = 0;


    if (editingWallpaperId) {

      const existing =
        wallpapers.find(
          item =>
            item.id ===
            editingWallpaperId
        );

      editionSold =
        Number(
          existing?.editionSold ||
          0
        );


      if (
        editionTotal <
        editionSold
      ) {

        showToast(
          `Edition total tidak boleh lebih kecil dari edition terjual (${editionSold}).`
        );

        return;
      }

    }


    /*
    DATA
    */

    const wallpaperData = {

      title,

      subtitle,

      category,

      status,

      price,

      editionTotal,

      editionSold,

      imageUrl,

      description,

      updatedAt:
        serverTimestamp()

    };


    /*
    RELEASE DATE
    */

    if (releaseAt) {

      const releaseDate =
        new Date(
          releaseAt
        );

      if (
        Number.isNaN(
          releaseDate.getTime()
        )
      ) {

        showToast(
          "Release date tidak valid."
        );

        return;
      }

      wallpaperData.releaseAt =
        releaseDate;

    } else {

      wallpaperData.releaseAt =
        null;

    }


    /*
    SAVE
    */

    saveWallpaperBtn.disabled =
      true;

    saveWallpaperBtn.textContent =
      editingWallpaperId
        ? "Updating..."
        : "Saving...";


    try {

      if (editingWallpaperId) {

        const wallpaperRef =
          doc(
            db,
            "wallpapers",
            editingWallpaperId
          );


        await updateDoc(
          wallpaperRef,
          wallpaperData
        );


        showToast(
          "Wallpaper berhasil diupdate."
        );

      } else {

        wallpaperData.createdAt =
          serverTimestamp();


        await addDoc(
          collection(
            db,
            "wallpapers"
          ),
          wallpaperData
        );


        showToast(
          "Wallpaper berhasil dibuat."
        );

      }


      closeForm();

      await loadDashboard();


    } catch (error) {

      console.error(
        "SAVE WALLPAPER ERROR:",
        error
      );

      showToast(
        getFirestoreErrorMessage(
          error
        )
      );

    } finally {

      saveWallpaperBtn.disabled =
        false;

      saveWallpaperBtn.textContent =
        editingWallpaperId
          ? "Update Wallpaper"
          : "Save Wallpaper";

    }

  }
);


/* =========================================================
   VALIDATE URL
   ========================================================= */

function isValidHttpUrl(
  value
) {

  try {

    const url =
      new URL(value);

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );

  } catch {

    return false;

  }
}


/* =========================================================
   FIRESTORE ERROR
   ========================================================= */

function getFirestoreErrorMessage(
  error
) {

  if (
    error?.code ===
    "permission-denied"
  ) {

    return (
      "Permission denied. Pastikan UID akun " +
      "sudah ada di admins/{UID} dan Firestore Rules benar."
    );

  }

  return (
    "Gagal menyimpan wallpaper."
  );
}


/* =========================================================
   DELETE
   ========================================================= */

async function deleteWallpaper(id) {

  const wallpaper =
    wallpapers.find(
      item =>
        item.id === id
    );


  if (!wallpaper) {

    showToast(
      "Wallpaper tidak ditemukan."
    );

    return;
  }


  const confirmed =
    window.confirm(
      `Hapus "${wallpaper.title || "Wallpaper"}"?\n\n` +
      "Data wallpaper akan dihapus dari Firestore."
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "wallpapers",
        id
      )
    );


    showToast(
      "Wallpaper berhasil dihapus."
    );


    await loadDashboard();


  } catch (error) {

    console.error(
      "DELETE ERROR:",
      error
    );

    showToast(
      getFirestoreErrorMessage(
        error
      )
    );

  }

}


/* =========================================================
   CLOSE FORM
   ========================================================= */

cancelFormBtn.addEventListener(
  "click",
  closeForm
);


cancelFormBtn2.addEventListener(
  "click",
  closeForm
);


function closeForm() {

  editingWallpaperId = null;

  wallpaperForm.reset();

  resetImagePreview();

  wallpaperFormSection
    .classList
    .add("hidden");

  formTitle.textContent =
    "New Wallpaper";

  saveWallpaperBtn.textContent =
    "Save Wallpaper";

}


/* =========================================================
   GLOBAL DEBUG
   ========================================================= */

window.WALPAP_ADMIN = {

  reload:
    loadDashboard,

  wallpapers:
    () => wallpapers,

  currentUser:
    () => currentUser,

  newWallpaper:
    openNewWallpaperForm

};


console.log(
  "%cWALPAP ADMIN READY",
  "font-weight:bold;font-size:18px"
);

console.log(
  "Firebase Storage: DISABLED"
);

console.log(
  "Artwork source: imageUrl"
);
