import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

interface InputFieldProps {
  label: string | ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
}) => {
  return (
    <View style={styles.container}>
      {typeof label === 'string' ? (
        <Text style={styles.label}>{label}</Text>
      ) : (
        label
      )}
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

export default InputField; 