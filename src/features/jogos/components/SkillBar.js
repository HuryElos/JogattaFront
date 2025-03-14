import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SkillBar = ({ label, value }) => {
  const skillValue = typeof value === 'number' ? value : 0;
  const percent = (skillValue / 5) * 100;

  return (
    <View style={styles.skillBarContainer}>
      <Text style={styles.skillBarLabel}>{label}:</Text>
      <View style={styles.skillBarTrack}>
        <View style={[styles.skillBarFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.skillBarValue}>{skillValue.toFixed(1)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  skillBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  skillBarLabel: {
    width: 110,
    fontSize: 14,
    color: '#555',
  },
  skillBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#ccc',
    borderRadius: 3,
    marginHorizontal: 5,
  },
  skillBarFill: {
    height: 6,
    backgroundColor: '#3E8ACC',
  },
  skillBarValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 13,
    color: '#333',
  },
});

export default SkillBar;
