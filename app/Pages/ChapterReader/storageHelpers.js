// storageHelpers.js
import * as FileSystem from "expo-file-system";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import JSZip from "jszip";
import { Buffer } from "buffer";

export const getChapterDirectory = async () => {
  const userId = await AsyncStorage.getItem("userId");
  if (!userId) throw new Error("User ID not found");
  return `${FileSystem.documentDirectory}users/${userId}/chapters/`;
};

export const getChapterFilePath = async (chapterId, language = "en") => {
  const userPath = await getUserSpecificPath();
  return `${userPath}chapters/${language}/${chapterId}.cbz`;
};

export const isChapterDownloaded = async (chapterId, language = "en") => {
  try {
    // Check both CBZ file and extracted files with language support
    const cbzPath = await getChapterFilePath(chapterId, language);
    const extractPath = await getChapterExtractPath(chapterId, language);

    const [cbzInfo, extractInfo] = await Promise.all([
      FileSystem.getInfoAsync(cbzPath),
      FileSystem.getInfoAsync(extractPath),
    ]);

    // Additional check to ensure files are not empty
    if (cbzInfo.exists && extractInfo.exists) {
      // Verify the CBZ file has content
      const cbzSize = cbzInfo.size || 0;
      if (cbzSize < 1024) {
        // Minimum 1KB file size
        console.warn(
          `CBZ file too small (${cbzSize} bytes), considering not downloaded`
        );
        return false;
      }

      // Check if extraction directory has files
      const extractFiles = await FileSystem.readDirectoryAsync(extractPath);
      if (extractFiles.length === 0) {
        console.warn("Extraction directory empty, considering not downloaded");
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error(
      `Error checking chapter download (ID: ${chapterId}, Lang: ${language}):`,
      error
    );

    // Clean up potentially corrupted files
    try {
      await cleanChapterFiles(chapterId, language);
    } catch (cleanError) {
      console.error("Error during cleanup:", cleanError);
    }

    return false;
  }
};

// Helper function to clean up chapter files
const cleanChapterFiles = async (chapterId, language) => {
  try {
    const cbzPath = await getChapterFilePath(chapterId, language);
    const extractPath = await getChapterExtractPath(chapterId, language);

    await Promise.all([
      FileSystem.deleteAsync(cbzPath, { idempotent: true }),
      FileSystem.deleteAsync(extractPath, { idempotent: true }),
    ]);

    console.log(`Cleaned up files for chapter ${chapterId} (${language})`);
  } catch (error) {
    throw error;
  }
};

// New function to get extraction path with language support
export const getChapterExtractPath = async (chapterId, language = "en") => {
  const userPath = await getUserSpecificPath();
  return `${userPath}extracted/${language}/${chapterId}/`;
};
useEffect(() => {
  const checkForLanguageChanges = async () => {
    const chaptersToRedownload = [];

    for (const chapterId of downloadedChapters) {
      const downloadState = downloadStates[chapterId];
      if (downloadState && downloadState.language !== selectedLanguage) {
        chaptersToRedownload.push(chapterId);
      }
    }

    if (chaptersToRedownload.length > 0) {
      // Clear existing downloads in progress for these chapters
      setDownloadStates((prev) => {
        const newState = { ...prev };
        chaptersToRedownload.forEach((id) => delete newState[id]);
        return newState;
      });

      // Optionally, you could automatically restart downloads here
      // for (const chapterId of chaptersToRedownload) {
      //   handleDownloadClick(chapterId);
      // }
    }
  };

  checkForLanguageChanges();
}, [selectedLanguage, downloadedChapters]);
export const saveDownloadedChapter = async (chapterId) => {
  try {
    const savedChapters = await AsyncStorage.getItem("savedChapters");
    const chapters = savedChapters ? JSON.parse(savedChapters) : [];
    if (!chapters.includes(chapterId)) {
      chapters.push(chapterId);
      await AsyncStorage.setItem("savedChapters", JSON.stringify(chapters));
    }
  } catch (error) {
    console.error("Error saving downloaded chapter:", error);
  }
};

export const extractImagesFromCBZ = async (cbzUri, chapterId) => {
  try {
    const extractDir = await getChapterExtractPath(chapterId);

    // Create extraction directory if it doesn't exist
    await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });

    // Read CBZ file
    const base64Data = await FileSystem.readAsStringAsync(cbzUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Load with JSZip
    const zip = new JSZip();
    const arrayBuffer = Uint8Array.from(
      Buffer.from(base64Data, "base64")
    ).buffer;
    await zip.loadAsync(arrayBuffer);

    // Filter and sort image files
    const imageFiles = [];
    zip.forEach((relativePath, file) => {
      if (!file.dir && /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) {
        imageFiles.push(file);
      }
    });

    imageFiles.sort((a, b) => {
      const getNum = (str) => parseInt(str.name.match(/\d+/)?.[0] || 0);
      return getNum(a) - getNum(b);
    });

    if (imageFiles.length === 0) {
      throw new Error("No valid images found in CBZ file");
    }

    // Extract images
    const extractedPages = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileData = await file.async("uint8array");
      const fileName = `${String(i).padStart(3, "0")}.${file.name
        .split(".")
        .pop()}`;
      const filePath = `${extractDir}${fileName}`;

      await FileSystem.writeAsStringAsync(
        filePath,
        Buffer.from(fileData).toString("base64"),
        { encoding: FileSystem.EncodingType.Base64 }
      );

      extractedPages.push({ uri: `file://${filePath}` });
    }

    // Save metadata
    await saveDownloadedChapter(chapterId);

    return extractedPages;
  } catch (error) {
    console.error("CBZ extraction failed:", error);
    throw error;
  }
};
