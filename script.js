
const $ = (id) => document.getElementById(id);

const simpan = () => {
  localStorage.setItem("koleksikuData", JSON.stringify(data));
};

function muatData() {
  try {
    const tersimpan = JSON.parse(localStorage.getItem("koleksikuData"));
    if (tersimpan && Array.isArray(tersimpan.buku) &&
        Array.isArray(tersimpan.genre) &&
        Array.isArray(tersimpan.teman) &&
        Array.isArray(tersimpan.pinjam)) {
      return tersimpan;
    }
  } catch (error) {
    console.warn("Data tersimpan tidak dapat dibaca.");
  }

  return {
    genre: ["Komik", "Novel", "Fantasi", "Romantis"],
    buku: [],
    teman: [],
    pinjam: []
  };
}

let data = muatData();
let halamanAktif = "dashboard";

function escapeHTML(teks) {
  return String(teks ?? "").replace(/[&<>"']/g, karakter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[karakter]);
}

function angkaTersedia(buku) {
  const dipinjam = data.pinjam.filter(
    p => p.bukuId === buku.id && p.status === "Dipinjam"
  ).length;

  return Math.max(0, Number(buku.stok) - dipinjam);
}

function gantiHalaman(nama) {
  halamanAktif = nama;

  document.querySelectorAll(".page").forEach(halaman => {
    halaman.classList.toggle("hidden", halaman.id !== nama);
  });

  document.querySelectorAll(".menu").forEach(tombol => {
    tombol.classList.toggle("active", tombol.dataset.page === nama);
  });

  renderSemua();
}

document.querySelectorAll(".menu").forEach(tombol => {
  tombol.addEventListener("click", () => {
    gantiHalaman(tombol.dataset.page);
  });
});

// GENRE / KATEGORI

function renderGenre() {
  $("daftarGenre").innerHTML = data.genre.map((genre, index) => `
    <li>
      <span>${escapeHTML(genre)}</span>
      <button class="danger" data-hapus-genre="${index}">Hapus</button>
    </li>
  `).join("");

  $("genreBuku").innerHTML = data.genre.map(genre => `
    <option value="${escapeHTML(genre)}">${escapeHTML(genre)}</option>
  `).join("");
}

$("genreForm").addEventListener("submit", event => {
  event.preventDefault();

  const nama = $("namaGenre").value.trim();

  if (!nama) return;

  if (data.genre.some(g => g.toLowerCase() === nama.toLowerCase())) {
    alert("Genre tersebut sudah ada.");
    return;
  }

  data.genre.push(nama);
  simpan();
  $("namaGenre").value = "";
  renderSemua();
});

$("daftarGenre").addEventListener("click", event => {
  const tombol = event.target.closest("[data-hapus-genre]");
  if (!tombol) return;

  const index = Number(tombol.dataset.hapusGenre);
  const genre = data.genre[index];

  if (data.buku.some(b => b.genre === genre)) {
    alert("Genre masih digunakan oleh buku. Ubah genre buku terlebih dahulu.");
    return;
  }

  if (confirm(`Hapus genre "${genre}"?`)) {
    data.genre.splice(index, 1);
    simpan();
    renderSemua();
  }
});

// KOLEKSI BUKU

function bukaFormBuku(id = "") {
  if (data.genre.length === 0) {
    alert("Tambahkan genre terlebih dahulu.");
    gantiHalaman("genre");
    return;
  }

  $("bukuForm").reset();
  $("idBuku").value = id;

  if (id) {
    const buku = data.buku.find(b => b.id === id);
    if (!buku) return;

    $("judulForm").textContent = "Edit Buku";
    $("judulBuku").value = buku.judul;
    $("penulisBuku").value = buku.penulis;
    $("genreBuku").value = buku.genre;
    $("tahunBuku").value = buku.tahun;
    $("stokBuku").value = buku.stok;
    $("stokBuku").min = String(
      buku.stok - data.pinjam.filter(
        p => p.bukuId === id && p.status === "Dipinjam"
      ).length
    );
  } else {
    $("judulForm").textContent = "Tambah Buku";
    $("stokBuku").min = "1";
    $("stokBuku").value = "1";
  }

  $("dialogBuku").showModal();
}

$("tambahBuku").addEventListener("click", () => bukaFormBuku());
$("batalBuku").addEventListener("click", () => $("dialogBuku").close());

$("bukuForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("idBuku").value;
  const stok = Number($("stokBuku").value);

  const bukuBaru = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    judul: $("judulBuku").value.trim(),
    penulis: $("penulisBuku").value.trim(),
    genre: $("genreBuku").value,
    tahun: Number($("tahunBuku").value),
    stok
  };

  if (!bukuBaru.judul || !bukuBaru.penulis ||
      !bukuBaru.genre || !bukuBaru.tahun ||
      !Number.isInteger(stok) || stok < 1) {
    alert("Periksa kembali data buku.");
    return;
  }

  if (id) {
    const lama = data.buku.find(b => b.id === id);
    const sedangDipinjam = data.pinjam.filter(
      p => p.bukuId === id && p.status === "Dipinjam"
    ).length;

    if (stok < sedangDipinjam) {
      alert("Stok tidak boleh lebih kecil dari jumlah buku yang dipinjam.");
      return;
    }

    Object.assign(lama, bukuBaru);
  } else {
    data.buku.push(bukuBaru);
  }

  simpan();
  $("dialogBuku").close();
  renderSemua();
});

function renderBuku() {
  const kata = $("cariBuku").value.toLowerCase();

  const hasil = data.buku.filter(b =>
    `${b.judul} ${b.penulis} ${b.genre}`.toLowerCase().includes(kata)
  );

  $("tabelBuku").innerHTML = hasil.map(b => `
    <tr>
      <td>${escapeHTML(b.judul)}</td>
      <td>${escapeHTML(b.penulis)}</td>
      <td>${escapeHTML(b.genre)}</td>
      <td>${b.tahun}</td>
      <td>${b.stok}</td>
      <td>${angkaTersedia(b)}</td>
      <td>
        <button data-edit-buku="${b.id}">Edit</button>
        <button class="danger" data-hapus-buku="${b.id}">Hapus</button>
      </td>
    </tr>
  `).join("");

  if (hasil.length === 0) {
    $("tabelBuku").innerHTML =
      '<tr><td colspan="7">Belum ada data buku.</td></tr>';
  }
}

$("cariBuku").addEventListener("input", renderBuku);

$("tabelBuku").addEventListener("click", event => {
  const edit = event.target.closest("[data-edit-buku]");
  const hapus = event.target.closest("[data-hapus-buku]");

  if (edit) {
    bukaFormBuku(edit.dataset.editBuku);
  }

  if (hapus) {
    const id = hapus.dataset.hapusBuku;

    if (data.pinjam.some(p => p.bukuId === id && p.status === "Dipinjam")) {
      alert("Buku masih dipinjam dan belum bisa dihapus.");
      return;
    }

    if (confirm("Yakin ingin menghapus buku ini?")) {
      data.buku = data.buku.filter(b => b.id !== id);
      data.pinjam = data.pinjam.filter(p => p.bukuId !== id);
      simpan();
      renderSemua();
    }
  }
});

// DATA TEMAN

$("temanForm").addEventListener("submit", event => {
  event.preventDefault();

  const nama = $("namaTeman").value.trim();
  const kontak = $("kontakTeman").value.trim();

  if (!nama) return;

  data.teman.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    nama,
    kontak
  });

  simpan();
  $("temanForm").reset();
  renderSemua();
});

function renderTeman() {
  $("tabelTeman").innerHTML = data.teman.map(t => `
    <tr>
      <td>${escapeHTML(t.nama)}</td>
      <td>${escapeHTML(t.kontak || "-")}</td>
      <td>
        <button class="danger" data-hapus-teman="${t.id}">Hapus</button>
      </td>
    </tr>
  `).join("");

  if (!data.teman.length) {
    $("tabelTeman").innerHTML =
      '<tr><td colspan="3">Belum ada data teman.</td></tr>';
  }
}

$("tabelTeman").addEventListener("click", event => {
  const tombol = event.target.closest("[data-hapus-teman]");
  if (!tombol) return;

  const id = tombol.dataset.hapusTeman;

  if (data.pinjam.some(p => p.temanId === id && p.status === "Dipinjam")) {
    alert("Teman masih memiliki pinjaman aktif.");
    return;
  }

  if (confirm("Hapus data teman ini?")) {
    data.teman = data.teman.filter(t => t.id !== id);
    data.pinjam = data.pinjam.filter(p => p.temanId !== id);
    simpan();
    renderSemua();
  }
});

// PEMINJAMAN DAN PENGEMBALIAN

function renderPilihanPinjam() {
  $("pilihTeman").innerHTML = data.teman.map(t => `
    <option value="${t.id}">${escapeHTML(t.nama)}</option>
  `).join("");

  $("pilihBuku").innerHTML = data.buku
    .filter(b => angkaTersedia(b) > 0)
    .map(b => `
      <option value="${b.id}">
        ${escapeHTML(b.judul)} (tersedia ${angkaTersedia(b)})
      </option>
    `).join("");

  $("tanggalPinjam").value =
    $("tanggalPinjam").value || new Date().toLocaleDateString("en-CA");
}

$("pinjamForm").addEventListener("submit", event => {
  event.preventDefault();

  const temanId = $("pilihTeman").value;
  const bukuId = $("pilihBuku").value;
  const tanggal = $("tanggalPinjam").value;

  const buku = data.buku.find(b => b.id === bukuId);
  const teman = data.teman.find(t => t.id === temanId);

  if (!buku || !teman || !tanggal || angkaTersedia(buku) < 1) {
    alert("Pastikan data teman dan buku tersedia.");
    return;
  }

  data.pinjam.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    temanId,
    bukuId,
    tanggal,
    status: "Dipinjam",
    tanggalKembali: ""
  });

  simpan();
  renderSemua();
  alert("Peminjaman berhasil dicatat.");
});

function renderPinjam() {
  $("tabelPinjam").innerHTML = [...data.pinjam].reverse().map(p => {
    const teman = data.teman.find(t => t.id === p.temanId);
    const buku = data.buku.find(b => b.id === p.bukuId);

    return `
      <tr>
        <td>${escapeHTML(teman?.nama || "Data teman tidak tersedia")}</td>
        <td>${escapeHTML(buku?.judul || "Data buku tidak tersedia")}</td>
        <td>${escapeHTML(p.tanggal)}</td>
        <td>${p.status}${p.tanggalKembali
          ? " (" + escapeHTML(p.tanggalKembali) + ")" : ""}</td>
        <td>
          ${p.status === "Dipinjam"
            ? `<button data-kembali="${p.id}">Kembalikan</button>`
            : "-"}
        </td>
      </tr>
    `;
  }).join("");

  if (!data.pinjam.length) {
    $("tabelPinjam").innerHTML =
      '<tr><td colspan="5">Belum ada transaksi peminjaman.</td></tr>';
  }
}

$("tabelPinjam").addEventListener("click", event => {
  const tombol = event.target.closest("[data-kembali]");
  if (!tombol) return;

  const transaksi = data.pinjam.find(p => p.id === tombol.dataset.kembali);
  if (!transaksi || transaksi.status !== "Dipinjam") return;

  if (confirm("Catat buku ini sudah dikembalikan?")) {
    transaksi.status = "Dikembalikan";
    transaksi.tanggalKembali = new Date().toLocaleDateString("en-CA");
    simpan();
    renderSemua();
  }
});

// DASHBOARD DAN LAPORAN

function renderDashboard() {
  const totalEksemplar = data.buku.reduce(
    (jumlah, buku) => jumlah + Number(buku.stok), 0
  );

  const totalDipinjam = data.pinjam.filter(
    p => p.status === "Dipinjam"
  ).length;

  const tersedia = data.buku.reduce(
    (jumlah, buku) => jumlah + angkaTersedia(buku), 0
  );

  $("totalBuku").textContent = data.buku.length;
  $("totalEksemplar").textContent = totalEksemplar;
  $("totalDipinjam").textContent = totalDipinjam;
  $("totalTeman").textContent = data.teman.length;

  $("laporanJudul").textContent = data.buku.length;
  $("laporanTersedia").textContent = tersedia;
  $("laporanTransaksi").textContent = data.pinjam.length;
}

function renderSemua() {
  renderGenre();
  renderBuku();
  renderTeman();
  renderPilihanPinjam();
  renderPinjam();
  renderDashboard();
}

$("cetakLaporan").addEventListener("click", () => window.print());

renderSemua();
