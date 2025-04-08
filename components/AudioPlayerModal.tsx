import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { FontAwesome5 } from '@expo/vector-icons';
import { StorageFile } from '@/utils/storageTypes';

interface AudioPlayerModalProps {
  visible: boolean;
  audioFile: StorageFile | null;
  onClose: () => void;
}

const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  visible,
  audioFile,
  onClose,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error("Error setting up audio mode:", error);
      }
    };

    setupAudio();
  }, []);

  useEffect(() => {
    if (visible && audioFile) {
      loadAndPlayAudio();
    } else {
      stopAudio();
    }

    return () => {
      stopAudio();
    };
  }, [visible, audioFile]);

  const loadAndPlayAudio = async () => {
    if (!audioFile) return;

    try {
      setIsLoading(true);
      setError(null);

      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Load and play the new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioFile.downloadURL },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        }
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

      // When audio finishes playing
      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play the audio file. Please try again.');
      setIsLoading(false);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
      setSound(null);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setError('Failed to control audio playback. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Audio Guide</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome5 name="times" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#34D399" />
              <Text style={styles.loadingText}>Loading audio...</Text>
            </View>
          ) : (
            <View style={styles.playerContainer}>
              <Text style={styles.audioName} numberOfLines={1}>
                {audioFile?.name || 'Unknown Audio'}
              </Text>
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
                disabled={isLoading}
              >
                <FontAwesome5
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  playerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  audioName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
});

export default AudioPlayerModal; 