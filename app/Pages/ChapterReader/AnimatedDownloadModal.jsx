// In AnimatedDownloadModal.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Circle } from 'react-native-progress';

const AnimatedDownloadModal = ({ progress, stage, inline = false }) => {
  return (
    <View style={[styles.container, inline && styles.inlineContainer]}>
      <View style={styles.content}>
        {stage && (
          <Text 
            style={[styles.stageText, inline && styles.inlineStageText]} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {stage}
          </Text>
        )}
        <Circle
          size={inline ? 30 : 60}
          progress={progress / 100}
          showsText={true}
          formatText={(p) => `${Math.round(p * 100)}%`}
          color="#EF7F1A"
          thickness={inline ? 3 : 5}
          textStyle={[styles.progressText, inline && styles.inlineProgressText]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    padding: 20,
  },
  inlineContainer: {
    backgroundColor: 'transparent',
    padding: 5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    maxWidth: 200,
  },
  inlineStageText: {
    fontSize: 10,
    marginBottom: 5,
    maxWidth: 100,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inlineProgressText: {
    fontSize: 10,
  },
});

export default AnimatedDownloadModal;