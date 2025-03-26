// storageHelpers.js
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import JSZip from "jszip";
import { Buffer } from "buffer";

export const getChapterDirectory = async () => {
  const userId = await AsyncStorage.getItem("userId");
  if (!userId) throw new Error("User ID not found");
  return `${FileSystem.documentDirectory}users/${userId}/chapters/`;
};

export const getChapterFilePath = async (chapterId) => {
  const dir = await getChapterDirectory();
  return `${dir}${chapterId}.cbz`;
};

export const getChapterExtractPath = async (chapterId) => {
  const dir = await getChapterDirectory();
  return `${dir}extracted/${chapterId}/`;
};

export const isChapterDownloaded = async (chapterId) => {
  try {
    // Check both CBZ file and extracted files
    const cbzPath = await getChapterFilePath(chapterId);
    const extractPath = await getChapterExtractPath(chapterId);

    const [cbzInfo, extractInfo] = await Promise.all([
      FileSystem.getInfoAsync(cbzPath),
      FileSystem.getInfoAsync(extractPath),
    ]);

    return cbzInfo.exists && extractInfo.exists;
  } catch (error) {
    console.error("Error checking chapter download:", error);
    return false;
  }
};

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

export const downloadChapter = async (chapterId, language, token) => {
  try {
    // 1. Prepare directories
    const cbzPath = await getChapterFilePath(chapterId);
    const extractDir = await getChapterExtractPath(chapterId);

    // Create parent directory if it doesn't exist
    await FileSystem.makeDirectoryAsync(await getChapterDirectory(), {
      intermediates: true,
    });

    // 2. Download the CBZ file
    const downloadUrl = `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/chapter/${chapterId}/${language}`;

    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      cbzPath,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/zip",
        },
      },
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        console.log(`Download progress: ${(progress * 100).toFixed(2)}%`);
      }
    );

    console.log("Starting download...");
    const { uri } = await downloadResumable.downloadAsync();

    if (!uri) {
      throw new Error("Download failed - no URI returned");
    }

    console.log("Download completed, verifying file...");
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists || fileInfo.size === 0) {
      throw new Error("Downloaded file is empty or does not exist");
    }

    // 3. Extract the CBZ file
    console.log("Extracting images...");
    const extractedPages = await extractImagesFromCBZ(uri, chapterId);

    // 4. Save download record
    await saveDownloadedChapter(chapterId);

    console.log("Chapter download and extraction completed successfully");
    return extractedPages;
  } catch (error) {
    console.error("Download error:", error);

    // Clean up if something went wrong
    try {
      await FileSystem.deleteAsync(await getChapterFilePath(chapterId), {
        idempotent: true,
      });
      await FileSystem.deleteAsync(await getChapterExtractPath(chapterId), {
        idempotent: true,
        recursive: true,
      });
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }

    throw error;
  }
};
