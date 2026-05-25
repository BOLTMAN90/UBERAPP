import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Show eye icon to preview password (default: true when secureTextEntry is set). */
  allowPasswordPreview?: boolean;
}

export function InputField({
  label,
  error,
  style,
  secureTextEntry,
  allowPasswordPreview = true,
  ...props
}: InputFieldProps) {
  const { colors } = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPasswordField = secureTextEntry === true;
  const showEye = isPasswordField && allowPasswordPreview;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textSecondary}
          autoCapitalize={isPasswordField ? 'none' : props.autoCapitalize}
          autoCorrect={isPasswordField ? false : props.autoCorrect}
          {...props}
          secureTextEntry={showEye ? !passwordVisible : secureTextEntry}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.white,
              color: colors.text,
            },
            showEye && styles.inputWithIcon,
            style,
          ]}
        />
        {showEye ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.eyeButton}
            hitSlop={12}>
            <FontAwesome
              name={passwordVisible ? 'eye-slash' : 'eye'}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  inputWithIcon: {
    paddingRight: Spacing.xl + Spacing.md,
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  error: {
    fontSize: 12,
  },
});
