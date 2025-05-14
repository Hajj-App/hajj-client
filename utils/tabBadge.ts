import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkForNewUpdates } from './events';

const NEW_UPDATES_KEY = "newUpdatesAvailable";

export const clearNewUpdatesFlag = async () => {
  try {
    await AsyncStorage.removeItem(NEW_UPDATES_KEY);
  } catch (error) {
    console.error('Error clearing new updates flag:', error);
  }
};

export const shouldShowTabBadge = async (): Promise<boolean> => {
  try {
    const hasUpdates = await AsyncStorage.getItem("newUpdatesAvailable");
    if (hasUpdates === "true") {
      return true;
    }

    const hasNewEvents = await checkForNewUpdates();
    if (hasNewEvents) {
      await AsyncStorage.setItem("newUpdatesAvailable", "true");
    }
    return hasNewEvents;
  } catch (error) {
    console.error('Error checking tab badge:', error);
    return false;
  }
}; 