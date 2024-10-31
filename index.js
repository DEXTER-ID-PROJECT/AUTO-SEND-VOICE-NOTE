const express = require("express");
const multer = require("multer");
const axios = require("axios");
const twilio = require("twilio");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });
const port = process.env.PORT || 3000;

// GitHub and Twilio credentials
const GITHUB_TOKEN = "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";
const GITHUB_USERNAME = "DEXTER-ID-PROJECT";
const GITHUB_REPO = "storage";
const accountSid = "AC3703d9bed80e3a199b5d4abc7007d6f4";
const authToken = "0cb4f4d9765b6217df5ea8c6bcb7e939";
const client = new twilio(accountSid, authToken);

app.use(express.static("public"));

app.post("/send-voice-note", upload.single("audioFile"), async (req, res) => {
    const { phoneNumber } = req.body;
    const audioFilePath = req.file.path;
    const fileName = req.file.originalname;

    try {
        // Read file content and encode in Base64
        const fileContent = fs.readFileSync(audioFilePath, "base64");

        // Upload to GitHub repository
        const githubResponse = await axios.put(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${fileName}`,
            {
                message: `Upload audio file ${fileName}`,
                content: fileContent,
            },
            {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        // Retrieve file URL from GitHub
        const mediaUrl = githubResponse.data.content.download_url;

        // Send the voice note through Twilio
        await client.messages.create({
            from: "whatsapp:+15103425782",
            to: `whatsapp:${phoneNumber}`,
            mediaUrl: [mediaUrl],
        });

        res.json({ message: "Voice note sent successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to send voice note." });
    } finally {
        fs.unlinkSync(audioFilePath); // Clean up uploaded file
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
