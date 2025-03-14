// src/features/user/screens/QuadraPhotoScreen.js

import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function QuadraPhotoScreen({ route, navigation }) {
  const { photoUrl } = route.params;

  return (
    <View style={styles.container}>
      {/* Ao tocar na imagem, voltamos para a tela anterior */}
      <TouchableOpacity style={styles.imageContainer} onPress={() => navigation.goBack()}>
        <Image
          source={{ uri: photoUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
});
