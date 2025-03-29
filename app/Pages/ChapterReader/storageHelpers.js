import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import JSZip from "jszip";
import { Buffer } from "buffer";

// Helper functions
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
  return `${dir}${chapterId}_extracted/`;
};

export const validateCBZFile = async (fileUri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }
    if (fileInfo.size < 4) {
      throw new Error("File is too small to be a valid CBZ");
    }

    // Read first 4 bytes to check signature
    const chunk = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: 4,
    });

    const signature = Buffer.from(chunk, "base64")
      .toString("hex")
      .toUpperCase();

    // Check for JSON signature (first characters of JSON)
    if (signature.startsWith("7B227B") || signature.startsWith("7B2265")) {
      // Read full file to get error message
      const fullContent = await FileSystem.readAsStringAsync(fileUri);
      try {
        const json = JSON.parse(fullContent);
        throw new Error(json.error || "Server returned JSON error");
      } catch (e) {
        throw new Error("Invalid JSON in CBZ file");
      }
    }

    // Standard ZIP signatures
    const validSignatures = ["504B0304", "504B0506", "504B0708"];
    if (!validSignatures.includes(signature)) {
      throw new Error(`Invalid CBZ signature: ${signature}`);
    }

    return true;
  } catch (error) {
    console.error("Validation failed:", error);
    throw error;
  }
};

const extractImagesFromCBZ = async (cbzUri, extractDir) => {
  try {
    console.log("Starting optimized CBZ extraction...");

    const zipData = await FileSystem.readAsStringAsync(cbzUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const zip = new JSZip();
    await zip.loadAsync(zipData, { base64: true });

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

    const extractedPages = [];

    // Extract images sequentially to prevent failures from affecting other images
    for (let i = 0; i < entries.length; i++) {
      const file = entries[i];
      try {
        const data = await file.async("uint8array");
        const base64Data = Buffer.from(data).toString("base64");

        const newFilename = `${extractDir}${String(i).padStart(
          3,
          "0"
        )}_${file.name.split("/").pop()}`;

        await FileSystem.writeAsStringAsync(newFilename, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const fileInfo = await FileSystem.getInfoAsync(newFilename);
        if (fileInfo.exists && fileInfo.size > 0) {
          extractedPages.push({ uri: `file://${newFilename}` });
          console.log(
            `Successfully extracted image ${i + 1}/${entries.length}`
          );
        } else {
          console.warn(`Failed to extract image ${i + 1}/${entries.length}`);
        }
      } catch (error) {
        console.error(
          `Error extracting image ${i + 1}/${entries.length}:`,
          error
        );
        // Continue with next image instead of failing completely
        continue;
      }
    }

    return extractedPages;
  } catch (error) {
    console.error("Image extraction failed:", error);
    throw new Error(`Image extraction failed: ${error.message}`);
  }
};

export const downloadChapter = async (chapterId, language, token) => {
  let downloadResumable;
  try {
    const downloadUrl = `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/chapter/${chapterId}/${language}`;
    const cbzPath = await getChapterFilePath(chapterId);
    const extractDir = await getChapterExtractPath(chapterId);

    // Ensure directories exist
    await FileSystem.makeDirectoryAsync(await getChapterDirectory(), {
      intermediates: true,
    });

    // Download with progress tracking
    downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      cbzPath,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
          Accept: "application/octet-stream",
        },
      },
      (downloadProgress) => {
        const progress = Math.min(
          50, // Reserve first 50% for download
          (downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite) *
            100
        );
        setDownloadProgress(progress);
      }
    );

    const { uri } = await downloadResumable.downloadAsync();
    if (!uri) throw new Error("Download failed");

    // Validate file
    await validateCBZFile(uri);

    // Extract images (will use remaining 50% of progress)
    const pages = await extractImagesFromCBZ(uri, chapterId);

    // Save download record
    await saveDownloadedChapter(chapterId);

    return pages;
  } catch (error) {
    console.error("Download failed:", error);
    // Clean up
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

export const handleDownloadChapter = async (
  chapterId,
  selectedLanguage,
  setCurrentlyDownloadingChapter,
  setDownloadStatus,
  setDownloadProgress,
  showMessage,
  setDownloadedChapters,
  setChapters,
  setSelectedChapterForReading
) => {
  try {
    setCurrentlyDownloadingChapter(chapterId);
    setDownloadStatus("downloading");
    setDownloadProgress(0);

    const token = await AsyncStorage.getItem("token");
    if (!token) {
      showMessage("Authentication required", "error");
      return;
    }

    // Start download process
    const pages = await downloadChapter(chapterId, selectedLanguage, token);

    // Update state
    setDownloadStatus("completed");
    setDownloadedChapters((prev) => new Set([...prev, chapterId]));
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, isDownloaded: true } : ch
      )
    );

    // Open reader with first page
    if (pages.length > 0) {
      setSelectedChapterForReading(chapterId);
    }
  } catch (error) {
    setDownloadStatus("failed");
    showMessage(`Download failed: ${error.message}`, "error");
  } finally {
    setTimeout(() => {
      setCurrentlyDownloadingChapter(null);
      setDownloadStatus(null);
    }, 2000);
  }
};

const saveDownloadedChapter = async (chapterId) => {
  try {
    const saved = await AsyncStorage.getItem("savedChapters");
    const savedIds = saved ? JSON.parse(saved) : [];
    if (!savedIds.includes(chapterId)) {
      await AsyncStorage.setItem(
        "savedChapters",
        JSON.stringify([...savedIds, chapterId])
      );
    }
  } catch (error) {
    console.error("Error saving download record:", error);
  }
};
