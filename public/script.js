const grid = document.getElementById("dreamGrid");
const dreamFile = document.getElementById("dreamFile");
const imagePreview = document.getElementById("imagePreview");

let currentFilter = "all";
let allDreams = [];

/* PENCEREYİ AÇ */

function openModal() {
    document.getElementById("dreamModal").style.display = "flex";
}

/* FORMU TEMİZLE */

function resetForm() {
    document.getElementById("dreamTitle").value = "";
    document.getElementById("dreamDescription").value = "";
    document.getElementById("dreamCategory").value = "";
    document.getElementById("dreamImage").value = "";
    document.getElementById("dreamColor").value = "#E9DDFB";

    dreamFile.value = "";
    imagePreview.innerHTML = "";
    imagePreview.style.display = "none";
}

/* PENCEREYİ KAPAT */

function closeModal() {
    document.getElementById("dreamModal").style.display = "none";
    resetForm();
}

/* FOTOĞRAF ÖNİZLEMESİ */

dreamFile.addEventListener("change", function() {
    const file = this.files[0];

    imagePreview.innerHTML = "";

    if (!file) {
        imagePreview.style.display = "none";
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Lütfen bir fotoğraf dosyası seç.");
        this.value = "";
        imagePreview.style.display = "none";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Fotoğraf en fazla 5 MB olabilir.");
        this.value = "";
        imagePreview.style.display = "none";
        return;
    }

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "Seçilen fotoğrafın önizlemesi";

    imagePreview.appendChild(img);
    imagePreview.style.display = "block";
});

/* HAYALLERİ YÜKLE */

async function loadDreams() {
    try {
        const response = await fetch("/dreams");

        if (!response.ok) {
            throw new Error("Yükleme başarısız");
        }

        allDreams = await response.json();

        renderDreams();

    } catch (error) {
        grid.textContent = "Hayaller yüklenirken bir sorun oluştu.";
        console.error(error);
    }
}

/* HAYALLERİ EKRANA YERLEŞTİR */

/* HAYAL İSTATİSTİKLERİNİ GÜNCELLE */

function updateStats() {
    const total = allDreams.length;

    const completed = allDreams.filter(
        dream => dream.completed
    ).length;

    const pending = total - completed;

    const percentage = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    document.getElementById("totalDreams").textContent = total;
    document.getElementById("completedDreams").textContent = completed;
    document.getElementById("pendingDreams").textContent = pending;

    document.getElementById("successRate").textContent =
        "%" + percentage;

    document.getElementById("progressFill").style.width =
        percentage + "%";
}

function renderDreams() {
    updateStats();

    grid.innerHTML = "";

    let filteredDreams = allDreams;

    if (currentFilter === "active") {
        filteredDreams = allDreams.filter(dream => !dream.completed);
    }

    if (currentFilter === "completed") {
        filteredDreams = allDreams.filter(dream => dream.completed);
    }

    const count = filteredDreams.length;

    document.getElementById("dreamCount").textContent =
        count + (count === 1 ? " hayal" : " hayal");

    if (currentFilter === "all") {
        document.querySelector(".section-heading h2").textContent =
            "✦ Hayal Koleksiyonum";
    } else if (currentFilter === "active") {
        document.querySelector(".section-heading h2").textContent =
            "♡ Hayallerim";
    } else {
        document.querySelector(".section-heading h2").textContent =
            "✓ Tamamlanan Hayallerim";
    }

    if (!filteredDreams.length) {
        let message = "Hayallerin burada seni bekliyor. ✨";

        if (currentFilter === "active") {
            message = "Bekleyen hayalin kalmamış. Harika! ✨";
        }

        if (currentFilter === "completed") {
            message = "Henüz tamamladığın bir hayal yok. İlkini gerçekleştireceğin günü bekliyoruz! 🌷";
        }

        grid.innerHTML = `<div class="empty">${message}</div>`;
        return;
    }

    filteredDreams.forEach(dream => {
        const card = document.createElement("article");
        card.className = "card";

        if (dream.completed) {
            card.classList.add("completed");
        }

        /* FOTOĞRAF */

        const image = document.createElement("div");
        image.className = "card-image";
        image.style.background = dream.color || "#E9DDFB";

        if (dream.image) {
            const img = document.createElement("img");

            img.src = dream.image;
            img.alt = dream.title;

            img.onerror = () => {
                image.innerHTML = "✨";
            };

            image.appendChild(img);

        } else {
            image.classList.add("no-image");
            image.textContent = "🌟";
        }

        /* BAŞLIK */

        const title = document.createElement("h3");
        title.textContent = dream.title;

        /* AÇIKLAMA */

        const description = document.createElement("p");
        description.textContent = dream.description;

        /* KATEGORİ */

        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = dream.category;

        /* TAMAMLANMA ROZETİ */

        if (dream.completed) {
            const badge = document.createElement("div");
            badge.className = "completed-badge";
            badge.textContent = "✓ Hayalim gerçekleşti!";
            card.appendChild(badge);
        }

        /* BUTONLAR */

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const completeButton = document.createElement("button");

        if (dream.completed) {
            completeButton.textContent = "↶ Yeniden Aktifleştir";
            completeButton.className = "reactivate";
        } else {
            completeButton.textContent = "✓ Tamamlandı";
            completeButton.className = "complete";
        }

        completeButton.onclick = () => toggleDream(dream);

        const edit = document.createElement("button");
        edit.textContent = "Düzenle";
        edit.onclick = () => editDream(dream);

        const remove = document.createElement("button");
        remove.textContent = "Sil";
        remove.className = "delete";
        remove.onclick = () => deleteDream(dream._id);

        actions.append(completeButton, edit, remove);

        card.append(image, title, description, tag, actions);

        grid.appendChild(card);
    });
}

/* HAYALİ TAMAMLA VEYA YENİDEN AKTİFLEŞTİR */

async function toggleDream(dream) {
    try {
        const response = await fetch("/dreams/" + dream._id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                completed: !dream.completed
            })
        });

        if (!response.ok) {
            throw new Error("Hayalin durumu değiştirilemedi.");
        }

        await loadDreams();

    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

/* MENÜ FİLTRELERİ */

function changeFilter(filter) {
    currentFilter = filter;

    const menuItems = document.querySelectorAll(".sidebar .menu-item");

    menuItems.forEach(item => {
        item.classList.remove("active");
    });

    if (filter === "all") {
        menuItems[0].classList.add("active");
    } else if (filter === "active") {
        menuItems[1].classList.add("active");
    } else if (filter === "completed") {
        menuItems[2].classList.add("active");
    }

    renderDreams();
}

/* MENÜ TIKLAMALARI */

document.querySelectorAll(".sidebar .menu-item").forEach((item, index) => {
    if (index === 0) {
        item.addEventListener("click", () => changeFilter("all"));
    }

    if (index === 1) {
        item.addEventListener("click", () => changeFilter("active"));
    }

    if (index === 2) {
        item.addEventListener("click", () => changeFilter("completed"));
    }
});

/* YENİ HAYAL KAYDET */

async function saveDream() {
    const title = document.getElementById("dreamTitle").value.trim();

    const description =
        document.getElementById("dreamDescription").value.trim();

    const category =
        document.getElementById("dreamCategory").value;

    const imageUrl =
        document.getElementById("dreamImage").value.trim();

    const color =
        document.getElementById("dreamColor").value;

    const file = dreamFile.files[0];

    if (!title || !description || !category) {
        alert("Lütfen başlık, açıklama ve kategori alanlarını doldur.");
        return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
        alert("Fotoğraf en fazla 5 MB olabilir.");
        return;
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("color", color);

    if (file) {
        formData.append("image", file);
    } else if (imageUrl) {
        formData.append("image", imageUrl);
    }

    const saveButton = document.getElementById("saveButton");

    saveButton.disabled = true;
    saveButton.textContent = "Kaydediliyor...";

    try {
        const response = await fetch("/dreams", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Hayal kaydedilemedi.");
        }

        closeModal();
        currentFilter = "all";

        await loadDreams();
        changeFilter("all");

    } catch (error) {
        alert(error.message || "Bir hata oluştu.");

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Kaydet ✨";
    }
}

/* HAYAL DÜZENLE */

async function editDream(dream) {
    const title = prompt("Hayalinin adı:", dream.title);

    if (title === null) return;

    const description = prompt("Açıklama:", dream.description);

    if (description === null) return;

    try {
        const response = await fetch("/dreams/" + dream._id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title.trim(),
                description: description.trim()
            })
        });

        if (!response.ok) {
            throw new Error("Hayal güncellenemedi.");
        }

        await loadDreams();

    } catch (error) {
        alert(error.message);
    }
}

/* HAYAL SİL */

async function deleteDream(id) {
    if (!confirm("Bu hayali panondan kaldırmak istiyor musun?")) {
        return;
    }

    try {
        const response = await fetch("/dreams/" + id, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Hayal silinemedi.");
        }

        await loadDreams();

    } catch (error) {
        alert(error.message);
    }
}

/* SAYFA AÇILDIĞINDA HAYALLERİ GETİR */

loadDreams();