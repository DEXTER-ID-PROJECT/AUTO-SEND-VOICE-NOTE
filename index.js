const express = require("express");
const multer = require("multer");
const axios = require("axios");
const twilio = require("twilio");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });
const port = process.env.PORT || 3000;

// Load credentials from environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPO = process.env.GITHUB_REPO;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = new twilio(accountSid, authToken);

app.use(express.static("public"));

app.post("/send-voice-note", upload.single("audioFile"), async (req, res) => {
    const { phoneNumber } = req.body;
    const audioFilePath = req.file?.path;
    const fileName = req.file?.originalname;

    if (!audioFilePath || !phoneNumber) {
        return res.status(400).json({ message: "Missing audio file or phone number." });
    }

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

        console.log("GitHub response:", githubResponse.data);

        // Retrieve file URL from GitHub
        const mediaUrl = githubResponse.data.content.download_url;

        // Send the voice note through Twilio
        try {
            const message = await client.messages.create({
                from: `whatsapp:${twilioNumber}`,
                to: `whatsapp:${phoneNumber}`,
                mediaUrl: [mediaUrl],
            });
            console.log("Twilio message response:", message);
            res.json({ message: "Voice note sent successfully!" });
        } catch (twilioError) {
            console.error("Error from Twilio:", twilioError);
            return res.status(500).json({ message: "Twilio failed to send voice note." });
        }
    } catch (error) {
        console.error("Error sending voice note:", error);
        res.status(500).json({ message: "Failed to send voice note." });
    } finally {
        if (audioFilePath) fs.unlinkSync(audioFilePath); // Clean up uploaded file
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
