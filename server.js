const admin = require("firebase-admin");
const serviceAccount = require("./config/tanara-25a3c-firebase-adminsdk-g7o2k-84faa194ee.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tanara-25a3c-default-rtdb.firebaseio.com"
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

const db = admin.database();
const pertanyaanRef = db.ref('pertanyaan');
const tanamanRef = db.ref('tanaman');

app.get('/rekomendasiTanaman/:q1/:q2/:q3/:q4', (req, res) => {
  const q1 = parseInt(req.params.q1);
  const q2 = parseInt(req.params.q2);
  const q3 = parseInt(req.params.q3);
  const q4 = parseInt(req.params.q4);

  pertanyaanRef.once('value', (snapshotPertanyaan) => {
    const pertanyaanData = snapshotPertanyaan.val();

    if (!pertanyaanData || !pertanyaanData[q1 - 1] || !pertanyaanData[q2 - 1] || !pertanyaanData[q3 - 1] || !pertanyaanData[q4 - 1]) {
      return res.json({ error: 'Data pertanyaan tidak ditemukan' });
    }

    tanamanRef.once('value', (snapshotTanaman) => {
      const tanamanData = snapshotTanaman.val();

      if (!tanamanData) {
        return res.json({ error: 'Data tanaman tidak ditemukan' });
      }

      const matchingPlants = tanamanData.filter((tanaman) => {
        const hewanPeliharaanMatch = q1 === 1 ? true : false;  // Jika q1 = 1 (Ya), maka hewan peliharaan di rumah
        const luasRuanganMatch = tanaman.luas_ruangan.includes(pertanyaanData[q2 - 1].opsi[q2 - 1].jawaban);
        const cahayaMatch = q3 === 1 ? tanaman.cahaya === "Ya" : tanaman.cahaya === "Tidak";  // Jika q3 = 1 (Ya), maka tanaman membutuhkan cahaya matahari langsung
        const perawatanMatch = tanaman.perawatan === pertanyaanData[q4 - 1].opsi[q4 - 1].jawaban;

        return hewanPeliharaanMatch || luasRuanganMatch || cahayaMatch || perawatanMatch;
      });

      if (matchingPlants.length > 0) {
        res.json(matchingPlants);
      } else {
        res.json({ error: 'Tanaman tidak ditemukan' });
      }
    });
  });
});

app.get('/cariTanaman/:namaTanaman', (req, res) => {
    const namaTanaman = req.params.namaTanaman.toLowerCase();
  
    tanamanRef.once('value', (snapshotTanaman) => {
      const tanamanData = snapshotTanaman.val();
  
      if (!tanamanData) {
        return res.json({ error: 'Data tanaman tidak ditemukan' });
      }
  
      const selectedPlant = tanamanData.find((tanaman) => tanaman.nama.toLowerCase() === namaTanaman);
  
      if (selectedPlant) {
        res.json(selectedPlant);
      } else {
        res.json({ error: 'Tanaman tidak ditemukan' });
      }
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
