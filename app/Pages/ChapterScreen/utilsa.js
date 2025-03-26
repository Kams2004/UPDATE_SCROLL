// utils.js
import * as FileSystem from "expo-file-system";
import JSZip from "jszip";
import { Buffer } from "buffer";

export const getSafeImageSource = (backendUrl, defaultImage) => {
  if (backendUrl && backendUrl.trim() !== "") {
    try {
      return { uri: backendUrl };
    } catch (error) {
      console.warn("Invalid backend image URL", backendUrl);
      return defaultImage;
    }
  }
  return defaultImage;
};

export const extractImagesFromCBZ = async (cbzUri) => {
  try {
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

    const extractDir = `${FileSystem.cacheDirectory}extracted_${Date.now()}/`;
    await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });

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

    return extractedPages;
  } catch (error) {
    console.error("Image extraction failed:", error);
    throw error;
  }
};
