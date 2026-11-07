
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const multer = require("multer");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const Dream = require("./models/Dream");

const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("DreamBoard veritabanına bağlandı! 💜"))
    .catch((error) => console.log("Bağlantı hatası:", error.message));

// Hayalleri listele
app.get("/dreams", async (req, res) => {
    try {
        const dreams = await Dream.find().sort({ createdAt: -1 });
        res.json(dreams);
    } catch (error) {
        res.status(500).json({ message: "Hayaller yüklenemedi." });
    }
});

// Yeni hayal ekle
app.post("/dreams", upload.single("image"), async (req, res) => {
    try {
        const { title, description, category, color } = req.body;

        const dream = new Dream({
            title,
            description,
            category,
            color,
            image: req.file ? `/uploads/${req.file.filename}` : ""
        });

        await dream.save();
        res.status(201).json(dream);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Hayali güncelle
app.put("/dreams/:id", async (req, res) => {
    try {
        const dream = await Dream.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!dream) {
            return res.status(404).json({ message: "Hayal bulunamadı." });
        }

        res.json(dream);
    } catch (error) {
        res.status(400).json({ message: "Güncelleme başarısız." });
    }
});

// Hayali sil
app.delete("/dreams/:id", async (req, res) => {
    try {
        const dream = await Dream.findByIdAndDelete(req.params.id);

        if (!dream) {
            return res.status(404).json({ message: "Hayal bulunamadı." });
        }

        res.json({ message: "Hayal silindi! ✨" });
    } catch (error) {
        res.status(400).json({ message: "Silme işlemi başarısız." });
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`DreamBoard http://localhost:${PORT} adresinde çalışıyor.`);
});
