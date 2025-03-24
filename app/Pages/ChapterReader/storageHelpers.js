// storageHelpers.js
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getChapterFilePath = async (chapterId) => {
  const userDir = `${FileSystem.documentDirectory}users/`;
  const userId = await AsyncStorage.getItem('userId');
  return `${userDir}${userId}/chapters/${chapterId}.cbz`;
};

export const isChapterDownloaded = async (chapterId) => {
  try {
    const filePath = await getChapterFilePath(chapterId);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking chapter download:', error);
    return false;
  }
};

export const saveDownloadedChapter = async (chapterId) => {
  try {
    const savedChapters = await AsyncStorage.getItem('savedChapters');
    const chapters = savedChapters ? JSON.parse(savedChapters) : [];
    if (!chapters.includes(chapterId)) {
      chapters.push(chapterId);
      await AsyncStorage.setItem('savedChapters', JSON.stringify(chapters));
    }
  } catch (error) {
    console.error('Error saving downloaded chapter:', error);
  }
};