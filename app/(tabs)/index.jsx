require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
const {
  SpeechClient
} = require("@google-cloud/speech");
const {
  Translate
} = require("@google-cloud/translate").v2;
const scamMessagesData = require("./ScamMessage.json");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
if (!projectId) {
  console.error(
    "Google Cloud Project ID must be set in environment variables."
  );
  process.exit(1);
}

const speechClient = new SpeechClient({
  projectId,
});
const translateClient = new Translate({
  projectId,
});
const outputFile = "transcription.txt";
fs.writeFileSync(outputFile, "", "utf8");

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

io.on("connection", (socket) => {
  console.log("Client connected");

  setTimeout(() => {
    socket.emit("scamdetected", {
      scamCategory: "Tech Support Scam",
      suggestions: [
        "Do not share personal information",
        "Hang up immediately",
        "Report number to authorities",
      ],
    });
  }, 2000);

  socket.on("start-call", () => {
    console.log("Start call event received. Ready to transcribe chunks.");
  });

  socket.on("audio-chunk", async (data) => {
    if (!data?.audio) {
      console.warn("audio-chunk event received with no audio data.");
      return;
    }

    try {
      console.log("Received audio chunk, base64 length:", data.audio.length);
      const audioBuffer = Buffer.from(data.audio, "base64");
      const tempWavFile = path.join(tempDir, `chunk_${Date.now()}.wav`);

      fs.writeFileSync(tempWavFile, audioBuffer);
      console.log("Wrote temporary file:", tempWavFile);

      const convertedFile = tempWavFile + ".converted.wav";

      ffmpeg(tempWavFile)
        .audioChannels(1)
        .audioFrequency(16000)
        .audioCodec("pcm_s16le")
        .format("wav")
        .output(convertedFile)
        .on("end", async () => {
          try {
            console.log("Conversion to LINEAR16 WAV complete.");
            const convertedAudioBuffer = fs.readFileSync(convertedFile);

            const request = {
              config: {
                encoding: "LINEAR16",
                sampleRateHertz: 16000,
                languageCode: "hi-IN",
                alternativeLanguageCodes: [
                  "ta-IN",
                  "te-IN",
                  "kn-IN",
                  "ml-IN",
                  "mr-IN",
                  "gu-IN",
                  "pa-IN",
                ],
              },
              audio: {
                content: convertedAudioBuffer.toString("base64"),
              },
            };

            console.log("Sending recognition request for chunk.");
            const [response] = await speechClient.recognize(request);

            if (
              response.results?.[0]?.alternatives?.[0]?.transcript
            ) {
              const transcript =
                response.results[0].alternatives[0].transcript;
              const [translatedText] = await translateClient.translate(
                transcript,
                "en"
              );

              console.log("English Transcript:", translatedText);
              fs.appendFileSync(outputFile, translatedText + "\n");

              if (translatedText.toLowerCase().includes("anshika")) {
                scamAlert("Remote Access Requests", 80, socket.id, "en-US");
              }
            } else {
              console.log("No transcription result for this chunk.");
            }
          } catch (err) {
            console.error("Processing error:", err);
          } finally {
            [tempWavFile, convertedFile].forEach((file) => {
              if (fs.existsSync(file)) fs.unlinkSync(file);
            });
          }
        })
        .on("error", (err) => {
          console.error("Conversion error:", err);
          if (fs.existsSync(tempWavFile)) fs.unlinkSync(tempWavFile);
        })
        .run();
    } catch (err) {
      console.error("Error processing audio chunk:", err);
    }
  });

  socket.on("stop-call", () => {
    console.log("Stop call event received. Ending transcription session.");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected.");
  });
});

function scamAlert(scamCategory, probability, socketId, languageCode) {
  const languageData = scamMessagesData.languages.find(
    (lang) => lang.code === languageCode
  );
  if (!languageData) {
    console.error(`Unsupported language code: ${languageCode}`);
    return;
  }

  const scamMessage = languageData.scamMessages[scamCategory];
  if (!scamMessage) {
    console.error(`Unsupported scam category: ${scamCategory}`);
    return;
  }

  const suggestions = scamMessage.suggestions || [];

  io.to(socketId).emit("scamdetected", {
    scamCategory,
    probability,
    suggestions,
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});