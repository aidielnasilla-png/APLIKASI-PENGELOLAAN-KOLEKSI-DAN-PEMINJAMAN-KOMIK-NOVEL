
const $ = id => document.getElementById(id);

function buatId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function aman(nilai) {
  return String(nilai ?? "").replace(/[&<>"']/g, karakter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[karakter]);
}

function formatTanggal(tanggal) {
  if (!tanggal) return "-";
  const [tahun, bulan, hari] = tanggal.split("-");
  return `${hari}/${bulan}/${tahun}`;
}

function tanggalLokal(tanggal) {
  const salinan = new Date(tanggal);
  salinan.setMinutes(
    salinan.getMinutes() - salinan.getTimezoneOffset()
  );
  return salinan.toISOString().slice(0, 10);
}

// Memuat data dari browser
function muatData() {
  try {
    const hasil = JSON.parse(
      localStorage.getItem("koleksiKomikNovel")
    );

    if (
      hasil &&
      Array.isArray(hasil.koleksi) &&
      Array.isArray(hasil.teman) &&
      Array.isArray(hasil.transaksi)
    ) {
      return hasil;
    }
  } catch (error) {
    console.error("Gagal membaca data:", error);
  }

  return {
    koleksi: [],
    teman: [],
    transaksi: []
  };
}

let data = muatData();

function simpanData() {
  try {
    localStorage.setItem(
      "koleksiKomikNovel",
      JSON.stringify(data)
    );
  } catch (error) {
    alert("Data gagal disimpan. Periksa penyimpanan browser.");
    throw error;
  }
}

function koleksiById(id) {
  return data.koleksi.find(item => item.id === id);
}

function temanById(id) {
  return data.teman.find(item => item.id === id);
}

// Menghitung eksemplar yang tersedia
function tersedia(item) {
  const dipinjam = data.transaksi.filter(
    t => t.koleksiId === item.id &&
         t.status === "Dipinjam"
  ).length;

  return Math.max(0, item.jumlah - dipinjam);
}

// Navigasi menu
document.querySelectorAll("nav button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach(b =>
      b.classList.remove("active")
    );

    document.querySelectorAll(".page").forEach(halaman =>
      halaman.classList.remove("active")
    );

    button.classList.add("active");
    $(button.dataset.page).classList.add("active");
    render();
  });
});

// =============================
// DATA KOLEKSI
// =============================

$("formKoleksi").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("koleksiId").value;
  const jumlah = Number($("jumlah").value);

  const sedangDipinjam = data.transaksi.filter(
    t => t.koleksiId === id &&
         t.status === "Dipinjam"
  ).length;

  if (!Number.isInteger(jumlah) ||
      jumlah < 1 ||
      jumlah < sedangDipinjam) {
    alert("Jumlah harus berupa bilangan bulat dan tidak boleh kurang dari jumlah yang dipinjam.");
    return;
  }

  const item = {
    id: id || buatId(),
    judul: $("judul").value.trim(),
    penulis: $("penulis").value.trim(),
    jenis: $("jenis").value,
    genre: $("genre").value.trim(),
    volume: $("volume").value.trim(),
    tahun: Number($("tahun").value),
    jumlah,
    kondisi: $("kondisi").value
  };

  if (
    !item.judul ||
    !item.penulis ||
    !item.genre ||
    !item.volume ||
    !Number.isInteger(item.tahun) ||
    item.tahun < 1 ||
    item.tahun > 9999
  ) {
    alert("Periksa kembali data koleksi.");
    return;
  }

  if (id) {
    data.koleksi = data.koleksi.map(k =>
      k.id === id ? item : k
    );
  } else {
    data.koleksi.push(item);
  }

  simpanData();
  resetFormKoleksi();
  render();
});

function resetFormKoleksi() {
  $("formKoleksi").reset();
  $("koleksiId").value = "";
  $("jumlah").value = 1;
  $("judulFormKoleksi").textContent = "Tambah Koleksi";
}

function editKoleksi(id) {
  const k = koleksiById(id);
  if (!k) return;

  $("koleksiId").value = k.id;
  $("judul").value = k.judul;
  $("penulis").value = k.penulis;
  $("jenis").value = k.jenis;
  $("genre").value = k.genre;
  $("volume").value = k.volume;
  $("tahun").value = k.tahun;
  $("jumlah").value = k.jumlah;
  $("kondisi").value = k.kondisi;

  $("judulFormKoleksi").textContent = "Edit Koleksi";

  document.querySelector('[data-page="koleksi"]').click();
  $("judul").focus();
}

function hapusKoleksi(id) {
  const masihDipinjam = data.transaksi.some(
    t => t.koleksiId === id &&
         t.status === "Dipinjam"
  );

  if (masihDipinjam) {
    alert("Koleksi masih dipinjam dan tidak dapat dihapus.");
    return;
  }

  if (!confirm("Hapus koleksi ini?")) return;

  data.koleksi = data.koleksi.filter(k => k.id !== id);
  simpanData();
  render();
}

$("cariKoleksi").addEventListener("input", renderKoleksi);

function renderKoleksi() {
  const q = $("cariKoleksi").value.toLowerCase();

  const hasil = data.koleksi.filter(k =>
    [k.judul, k.penulis, k.genre, k.jenis].some(
      v => String(v).toLowerCase().includes(q)
    )
  );

  $("tabelKoleksi").innerHTML = hasil.length
    ? hasil.map(k => `
      <tr>
        <td>${aman(k.judul)}</td>
        <td>${aman(k.penulis)}</td>
        <td>${aman(k.jenis)}</td>
        <td>${aman(k.genre)}</td>
        <td>${aman(k.volume)}</td>
        <td>${k.tahun}</td>
        <td>${k.jumlah}</td>
        <td>${tersedia(k)}</td>
        <td>${aman(k.kondisi)}</td>
        <td>
          <div class="actions">
            <button class="secondary"
              onclick="editKoleksi('${k.id}')">Edit</button>
            <button class="danger"
              onclick="hapusKoleksi('${k.id}')">Hapus</button>
          </div>
        </td>
      </tr>
    `).join("")
    : `<tr>
        <td colspan="10" class="empty">
          Data koleksi belum tersedia.
        </td>
      </tr>`;
}

// =============================
// DATA TEMAN
// =============================

$("formTeman").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("temanId").value;

  const teman = {
    id: id || buatId(),
    nama: $("namaTeman").value.trim(),
    kontak: $("kontakTeman").value.trim()
  };

  if (!teman.nama) {
    alert("Nama teman wajib diisi.");
    return;
  }

  if (id) {
    data.teman = data.teman.map(t =>
      t.id === id ? teman : t
    );
  } else {
    data.teman.push(teman);
  }

  simpanData();
  resetFormTeman();
  render();
});

function resetFormTeman() {
  $("formTeman").reset();
  $("temanId").value = "";
  $("judulFormTeman").textContent = "Tambah Teman";
}

function editTeman(id) {
  const t = temanById(id);
  if (!t) return;

  $("temanId").value = t.id;
  $("namaTeman").value = t.nama;
  $("kontakTeman").value = t.kontak;
  $("judulFormTeman").textContent = "Edit Teman";

  document.querySelector('[data-page="teman"]').click();
}

function hapusTeman(id) {
  const masihMeminjam = data.transaksi.some(
    t => t.temanId === id &&
         t.status === "Dipinjam"
  );

  if (masihMeminjam) {
    alert("Teman masih memiliki pinjaman aktif.");
    return;
  }

  if (!confirm("Hapus data teman ini?")) return;

  data.teman = data.teman.filter(t => t.id !== id);
  simpanData();
  render();
}

function renderTeman() {
  $("tabelTeman").innerHTML = data.teman.length
    ? data.teman.map(t => `
      <tr>
        <td>${aman(t.nama)}</td>
        <td>${aman(t.kontak || "-")}</td>
        <td>
          <div class="actions">
            <button class="secondary"
              onclick="editTeman('${t.id}')">Edit</button>
            <button class="danger"
              onclick="hapusTeman('${t.id}')">Hapus</button>
          </div>
        </td>
      </tr>
    `).join("")
    : `<tr>
        <td colspan="3" class="empty">
          Belum ada data teman.
        </td>
      </tr>`;
}

// =============================
// PEMINJAMAN
// =============================

const hariIni = new Date();
const batasDefault = new Date(hariIni);
batasDefault.setDate(batasDefault.getDate() + 7);

$("tanggalPinjam").value = tanggalLokal(hariIni);
$("tanggalKembali").value = tanggalLokal(batasDefault);

$("formPinjam").addEventListener("submit", event => {
  event.preventDefault();

  const koleksiId = $("pilihKoleksi").value;
  const temanId = $("pilihTeman").value;
  const tanggal = $("tanggalPinjam").value;
  const batas = $("tanggalKembali").value;

  const item = koleksiById(koleksiId);

  if (!item || !temanById(temanId)) {
    alert("Tambahkan koleksi dan data teman terlebih dahulu.");
    return;
  }

  if (tersedia(item) < 1) {
    alert("Koleksi tidak tersedia.");
    return;
  }

  if (!tanggal || !batas || batas < tanggal) {
    alert("Tanggal pengembalian tidak boleh sebelum tanggal pinjam.");
    return;
  }

  data.transaksi.push({
    id: buatId(),
    koleksiId,
    temanId,
    tanggal,
    batas,
    tanggalKembali: "",
    status: "Dipinjam"
  });

  simpanData();
  render();

  alert("Peminjaman berhasil dicatat.");
});

function renderPilihan() {
  const pilihanKoleksi = data.koleksi.filter(
    k => tersedia(k) > 0
  );

  $("pilihKoleksi").innerHTML =
    '<option value="">-- Pilih koleksi --</option>' +
    pilihanKoleksi.map(k => `
      <option value="${k.id}">
        ${aman(k.judul)} (tersedia: ${tersedia(k)})
      </option>
    `).join("");

  $("pilihTeman").innerHTML =
    '<option value="">-- Pilih teman --</option>' +
    data.teman.map(t => `
      <option value="${t.id}">${aman(t.nama)}</option>
    `).join("");

  $("pilihKoleksi").disabled = !pilihanKoleksi.length;
  $("pilihTeman").disabled = !data.teman.length;
}

function kembalikan(id) {
  const transaksi = data.transaksi.find(t => t.id === id);

  if (!transaksi || transaksi.status !== "Dipinjam") return;

  if (!confirm("Konfirmasi pengembalian koleksi?")) return;

  transaksi.status = "Dikembalikan";
  transaksi.tanggalKembali = tanggalLokal(new Date());

  simpanData();
  render();
}

function renderAktif() {
  const aktif = data.transaksi.filter(
    t => t.status === "Dipinjam"
  );

  $("tabelAktif").innerHTML = aktif.length
    ? aktif.map(t => {
      const k = koleksiById(t.koleksiId);
      const p = temanById(t.temanId);

      return `
        <tr>
          <td>${aman(k?.judul || "Data dihapus")}</td>
          <td>${aman(p?.nama || "Data dihapus")}</td>
          <td>${formatTanggal(t.tanggal)}</td>
          <td>${formatTanggal(t.batas)}</td>
          <td><span class="status borrowed">Dipinjam</span></td>
          <td>
            <button class="success"
              onclick="kembalikan('${t.id}')">
              Kembalikan
            </button>
          </td>
        </tr>
      `;
    }).join("")
    : `<tr>
        <td colspan="6" class="empty">
          Tidak ada peminjaman aktif.
        </td>
      </tr>`;
}

// =============================
// DASHBOARD
// =============================

function renderDashboard() {
  $("totalKoleksi").textContent = data.koleksi.reduce(
    (total, k) => total + k.jumlah, 0
  );

  $("totalTersedia").textContent = data.koleksi.reduce(
    (total, k) => total + tersedia(k), 0
  );

  $("totalDipinjam").textContent = data.transaksi.filter(
    t => t.status === "Dipinjam"
  ).length;

  $("totalTeman").textContent = data.teman.length;

  const aktif = data.transaksi.filter(
    t => t.status === "Dipinjam"
  );

  $("ringkasanPinjaman").innerHTML = aktif.length
    ? `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Judul</th>
              <th>Peminjam</th>
              <th>Batas Kembali</th>
            </tr>
          </thead>
          <tbody>
            ${aktif.map(t => {
              const k = koleksiById(t.koleksiId);
              const p = temanById(t.temanId);

              return `
                <tr>
                  <td>${aman(k?.judul || "Data dihapus")}</td>
                  <td>${aman(p?.nama || "Data dihapus")}</td>
                  <td>${formatTanggal(t.batas)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>`
    : '<p class="empty">Belum ada peminjaman aktif.</p>';
}

// =============================
// RIWAYAT PEMINJAMAN
// =============================

$("cariRiwayat").addEventListener("input", renderRiwayat);

function renderRiwayat() {
  const q = $("cariRiwayat").value.toLowerCase();

  const hasil = [...data.transaksi]
    .reverse()
    .filter(t => {
      const k = koleksiById(t.koleksiId);
      const p = temanById(t.temanId);

      return `${k?.judul || ""} ${p?.nama || ""}`
        .toLowerCase()
        .includes(q);
    });

  $("tabelRiwayat").innerHTML = hasil.length
    ? hasil.map(t => {
      const k = koleksiById(t.koleksiId);
      const p = temanById(t.temanId);

      const status = t.status === "Dipinjam"
        ? '<span class="status borrowed">Dipinjam</span>'
        : '<span class="status">Dikembalikan</span>';

      return `
        <tr>
          <td>${aman(k?.judul || "Data dihapus")}</td>
          <td>${aman(p?.nama || "Data dihapus")}</td>
          <td>${formatTanggal(t.tanggal)}</td>
          <td>${formatTanggal(t.batas)}</td>
          <td>${formatTanggal(t.tanggalKembali)}</td>
          <td>${status}</td>
        </tr>
      `;
    }).join("")
    : `<tr>
        <td colspan="6" class="empty">
          Belum ada riwayat transaksi.
        </td>
      </tr>`;
}

// Menampilkan seluruh data
function render() {
  renderDashboard();
  renderKoleksi();
  renderTeman();
  renderPilihan();
  renderAktif();
  renderRiwayat();
}

// Jalankan aplikasi
render();

