import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Circle } from "react-native-progress";
import * as FileSystem from "expo-file-system";
import JSZip from "jszip";
import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../../Services/ApiService";

const DownloadProgressIndicator = ({
  chapterId,
  language,
  onDownloadComplete,
  onError,
  token,
}) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Preparing download...");
  const [isPaused, setIsPaused] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadResumable = useRef(null);

  const downloadChapter = async () => {
    try {
      setIsDownloading(true);
      setProgress(0);
      setStage("Starting download...");

      // Get download URL from API
      const downloadUrl = `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/chapter/${chapterId}/${language}`;

      // Create file path for download
      const downloadDir = `${FileSystem.cacheDirectory}downloads/`;
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      const fileUri = `${downloadDir}${chapterId}_${language}.cbz`;

      // Start download
      downloadResumable.current = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        (downloadProgress) => {
          const calculatedProgress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          setProgress(calculatedProgress);
          setStage("Downloading...");
        }
      );

      const { uri } = await downloadResumable.current.downloadAsync();

      if (!uri) {
        throw new Error("Download failed");
      }

      // Extract and save chapter
      await extractAndSaveChapter(uri);

      // Notify parent component
      onDownloadComplete();
    } catch (error) {
      if (error.message !== "Download paused") {
        console.error("Download error:", error);
        onError(error.message || "Download failed");
      }
    } finally {
      if (!isPaused) {
        setIsDownloading(false);
        downloadResumable.current = null;
      }
    }
  };

  const extractAndSaveChapter = async (fileUri) => {
    try {
      setStage("Extracting files...");

      // Extract CBZ file
      const zipData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const zip = new JSZip();
      await zip.loadAsync(zipData, { base64: true });

      // Filter and sort image files
      const validExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
      const entries = [];

      zip.forEach((relativePath, file) => {
        if (!file.dir && validExtensions.test(file.name)) {
          entries.push(file);
        }
      });

      entries.sort((a, b) => {
        const getNumber = (str) => {
          const match = str.name.match(/\d+/);
          return match ? parseInt(match[0]) : Infinity;
        };
        return getNumber(a) - getNumber(b);
      });

      if (entries.length === 0) {
        throw new Error("No valid images found in CBZ file");
      }

      // Create extraction directory
      const extractDir = `${FileSystem.documentDirectory}chapters/${chapterId}/${language}/`;
      await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });

      // Extract files
      const extractedPages = [];
      for (let i = 0; i < entries.length; i++) {
        const file = entries[i];
        const data = await file.async("uint8array");
        const base64Data = Buffer.from(data).toString("base64");
        const newFilename = `${extractDir}${String(i).padStart(
          3,
          "0"
        )}.${file.name.split(".").pop()}`;

        await FileSystem.writeAsStringAsync(newFilename, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        extractedPages.push({ uri: `file://${newFilename}` });
      }

      // Save chapter info to AsyncStorage
      await saveChapterInfo(extractedPages);

      setStage("Download complete!");
    } catch (error) {
      console.error("Extraction error:", error);
      throw error;
    }
  };

  const saveChapterInfo = async (pages) => {
    try {
      const chapterInfo = {
        id: chapterId,
        language,
        pages,
        downloadedAt: new Date().toISOString(),
      };

      const savedChapters = await AsyncStorage.getItem("savedChapters");
      let chapters = savedChapters ? JSON.parse(savedChapters) : [];

      // Remove if already exists
      chapters = chapters.filter(
        (ch) => !(ch.id === chapterId && ch.language === language)
      );
      chapters.push(chapterInfo);

      await AsyncStorage.setItem("savedChapters", JSON.stringify(chapters));
    } catch (error) {
      console.error("Error saving chapter info:", error);
      throw error;
    }
  };

  const togglePause = async () => {
    if (!isDownloading) return;

    if (isPaused) {
      // Resume download
      setIsPaused(false);
      setStage("Resuming download...");
      await downloadResumable.current.resumeAsync();
    } else {
      // Pause download
      setIsPaused(true);
      setStage("Download paused");
      await downloadResumable.current.pauseAsync();
    }
  };

  const startDownload = () => {
    if (!isDownloading) {
      downloadChapter();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stageText} numberOfLines={1} ellipsizeMode="tail">
          {stage}
        </Text>
        {isDownloading ? (
          <TouchableOpacity onPress={togglePause}>
            <Circle
              size={40}
              progress={progress}
              showsText={true}
              formatText={(p) => `${Math.round(p * 100)}%`}
              color="#EF7F1A"
              thickness={4}
              textStyle={styles.progressText}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startDownload}>
            <View style={styles.downloadButton}>
              <Text style={styles.downloadButtonText}>Download</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(26,26,26,0.9)",
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  stageText: {
    color: "#fff",
    fontSize: 10,
    marginBottom: 4,
    maxWidth: 80,
  },
  progressText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EF7F1A",
    justifyContent: "center",
    alignItems: "center",
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default DownloadProgressIndicator;
