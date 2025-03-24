import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useTranslation } from "react-i18next";

const DownloadProgress = ({
  chapter,
  onDownloadComplete,
  style,
  buttonStyle,
  textStyle,
  isPurchased,
  isFirstChapter,
}) => {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if this chapter is already downloaded
    checkIfDownloaded();
  }, [chapter.id]);

  const checkIfDownloaded = async () => {
    try {
      const savedChapters = await AsyncStorage.getItem("savedChapters");
      const savedChapterIds = savedChapters ? JSON.parse(savedChapters) : [];
      const downloaded = savedChapterIds.includes(chapter.id);
      setIsDownloaded(downloaded);
    } catch (error) {
      console.error("Error checking download status:", error);
    }
  };

  const handleDownload = async () => {
    if (isDownloading || isDownloaded) return;

    try {
      setIsDownloading(true);
      const chapterDir = `${FileSystem.documentDirectory}chapters/`;
      const chapterFile = `${chapterDir}${chapter.id}.json`;

      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(chapterDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(chapterDir, {
          intermediates: true,
        });
      }

      // Simulate download progress (in a real app, this would be an actual API call)
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 0.05;
        setProgress(Math.min(currentProgress, 1));

        if (currentProgress >= 1) {
          clearInterval(progressInterval);
          completeDownload();
        }
      }, 100);

      // In a real app, you would download the content from your API
      // const downloadResumable = FileSystem.createDownloadResumable(
      //   `https://your-api-url/chapters/${chapter.id}`,
      //   chapterFile,
      //   {},
      //   (downloadProgress) => {
      //     const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      //     setProgress(progress);
      //   }
      // );
      // await downloadResumable.downloadAsync();

      // For demo purposes, we'll just save the chapter data
      const dummyDelay = setTimeout(async () => {
        await FileSystem.writeAsStringAsync(
          chapterFile,
          JSON.stringify(chapter)
        );

        // Update savedChapters in AsyncStorage
        const savedChapters = await AsyncStorage.getItem("savedChapters");
        const savedChapterIds = savedChapters ? JSON.parse(savedChapters) : [];

        if (!savedChapterIds.includes(chapter.id)) {
          savedChapterIds.push(chapter.id);
          await AsyncStorage.setItem(
            "savedChapters",
            JSON.stringify(savedChapterIds)
          );
        }

        clearTimeout(dummyDelay);
      }, 2000);
    } catch (error) {
      console.error("Error downloading chapter:", error);
      setIsDownloading(false);
      setProgress(0);
    }
  };

  const completeDownload = async () => {
    setIsDownloading(false);
    setIsDownloaded(true);

    if (onDownloadComplete) {
      onDownloadComplete(chapter.id);
    }
  };

  if (isDownloaded) {
    return (
      <TouchableOpacity
        style={[styles.readButton, styles.downloadedButton, buttonStyle]}
        onPress={() => onDownloadComplete(chapter.id)}
      >
        <Text style={[styles.buttonText, textStyle]}>{t("chapter.read")}</Text>
      </TouchableOpacity>
    );
  }

  if (isDownloading) {
    return (
      <View style={[styles.progressContainer, style]}>
        <View style={styles.progressBackground}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.readButton,
        isPurchased || isFirstChapter
          ? styles.freeChapterButton
          : styles.paidChapterButton,
        buttonStyle,
      ]}
      onPress={handleDownload}
    >
      <Text style={[styles.buttonText, textStyle]}>
        {isPurchased || isFirstChapter
          ? t("chapter.download")
          : t("chapter.buy")}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  readButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  freeChapterButton: {
    backgroundColor: "#4CAF50",
  },
  paidChapterButton: {
    backgroundColor: "#F57C00",
  },
  downloadedButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  progressContainer: {
    width: "100%",
    height: 36,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
    justifyContent: "center",
  },
  progressBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#E0E0E0",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#4CAF50",
  },
  progressText: {
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
    zIndex: 1,
  },
});

export default DownloadProgress;
