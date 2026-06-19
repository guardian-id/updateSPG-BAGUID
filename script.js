const POWER_AUTOMATE_URL = "https://default9ec0d6c58a25418fb3841c77c55584.c2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c14e8384778140c5ae023257a47f26de/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Yfol_lBbDC-_2t5UZUViySYU596lVF9AWj7fy8FIKhs";

document.addEventListener("DOMContentLoaded", function () {
    const formBox = document.getElementById('formBox');
    const form = document.getElementById('storeForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const responseMessage = document.getElementById('responseMessage');

    // 1. Ambil parameter terenkripsi 'q' dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedParam = urlParams.get('q'); // Membaca parameter aman ?q=...

    let tokoParam = null;
    let brandParam = null;
    let namaParam = null;
    let emailParam = null;
    let tanggalParam = null;

    // Proses membongkar string Base64 kembali ke parameter asli jika ada
    if (encryptedParam) {
        try {
            // Mengubah Base64 kembali menjadi teks biasa (toko=xxx&brand=yyy...)
            const decodedString = atob(encryptedParam);
            const decodedParams = new URLSearchParams(decodedString);
            
            tokoParam = decodedParams.get('toko');
            brandParam = decodedParams.get('brand');
            namaParam = decodedParams.get('nama');
            emailParam = decodedParams.get('email');
            tanggalParam = decodedParams.get('tanggal');
        } catch (e) {
            console.error("Gagal membaca enkripsi URL:", e);
            formBox.innerHTML = `<div style="text-align: center; padding: 20px; color: red; font-weight: bold;">AKSES DITOLAK: Tautan rusak atau format tidak valid.</div>`;
            return;
        }
    }

    // Fungsi jika terjadi error/ditolak di awal halaman
    const showBlockMessage = (msg) => {
        formBox.innerHTML = `<div style="text-align: center; padding: 20px; color: red; font-weight: bold;">${msg}</div>`;
    };

    // Fungsi sukses yang akan menghapus isi container dan memunculkan ucapan terima kasih harian
    const showSuccessMessage = (date, storeName) => {
        formBox.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 60px; color: #2e7d32; margin-bottom: 15px;">✓</div>
                <h2 style="color: #2e7d32; margin-bottom: 10px;">Terima Kasih</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Terima kasih sudah melakukan submit data untuk <br><strong>${storeName}</strong> pada tanggal <strong>${date}</strong>.<br><br>
                    Akses update SPG&BA telah ditutup.
                </p>
            </div>
        `;
    };

    // 2. VALIDASI PARAMETER TANGGAL & TOKO WAJIB ADA
    if (!tanggalParam || !tokoParam) {
        showBlockMessage("AKSES DITOLAK: Link tidak valid (Missing Date or Store Parameter).");
        return;
    }

    // 3. BUAT KUNCI UNIK GABUNGAN (Tanggal + Nama Toko)
    const currentSubmissionKey = `${tanggalParam}|${tokoParam}`;

    // VALIDASI LIMITASI BERDASARKAN KUNCI GABUNGAN
    const lastSubmitKey = localStorage.getItem('lastSubmitKey');
    if (lastSubmitKey === currentSubmissionKey) {
        showSuccessMessage(tanggalParam, tokoParam);
        return;
    }

    // 4. Isi field form otomatis dari URL parameter jika lolos validasi
    document.getElementById('toko').value = tokoParam;
    if (brandParam) document.getElementById('brand').value = brandParam;
    if (namaParam) document.getElementById('nama').value = namaParam;
    if (emailParam) document.getElementById('email').value = emailParam;

    // 5. Handle Submit Form
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Kunci tombol biar tidak ter-klik dua kali saat loading
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Mengirim...";
        responseMessage.innerText = "";

        const payload = {
            toko: document.getElementById('toko').value,
            brand: document.getElementById('brand').value,
            nama: document.getElementById('nama').value,
            email: document.getElementById('email').value,
            jenis: document.getElementById('jenis').value,
            tanggal_buka_form: tanggalParam,
            timestamp_submit: new Date().toISOString()
        };

        try {
            const response = await fetch(POWER_AUTOMATE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Simpan kunci gabungan (Tanggal + Toko) ke localStorage sebagai bukti gembok
                localStorage.setItem('lastSubmitKey', currentSubmissionKey);
                
                // BERSIHKAN CONTAINER & TAMPILKAN TERIMA KASIH SECARA TOTAL
                showSuccessMessage(tanggalParam, tokoParam);

            } else {
                throw new Error("Gagal mengirim data.");
            }

        } catch (error) {
            console.error("Error:", error);
            responseMessage.style.color = "red";
            responseMessage.style.textAlign = "center";
            responseMessage.innerText = "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.";
            
            // Kembalikan tombol jika gagal kirim karena gangguan jaringan/sistem
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Kirim Data";
        }
    });
});
