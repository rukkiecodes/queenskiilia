import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

type Props = {
  label?: string;
  required?: boolean;
  value: Date | null;
  onChange: (date: Date | null) => void;
  /** Earliest date selectable. Defaults to tomorrow. */
  minimumDate?: Date;
  placeholder?: string;
};

const tomorrow = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
};

/**
 * Apple-style date field: tap to open native date picker.
 * - iOS: opens a modal with an inline `spinner` style picker + Done/Cancel.
 * - Android: opens the OS date picker dialog directly.
 */
export function DateField({
  label,
  required,
  value,
  onChange,
  minimumDate,
  placeholder = 'Select a date',
}: Props) {
  const [showIOS, setShowIOS] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ?? minimumDate ?? tomorrow());

  const open = () => {
    setTempDate(value ?? minimumDate ?? tomorrow());
    if (Platform.OS === 'ios') setShowIOS(true);
    else setShowAndroid(true);
  };

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowAndroid(false);
    if (event.type === 'set' && date) onChange(date);
  };

  return (
    <View style={{ gap: spacing.xs, alignSelf: 'stretch' }}>
      {label ? (
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          {label}
          {required ? (
            <ThemedText font={fonts.semiBold} size="callout" color="danger">
              {' *'}
            </ThemedText>
          ) : null}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={open}
        style={({ pressed }) => ({
          borderWidth: 1,
          borderColor: colors.hairline,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          backgroundColor: colors.canvas,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <ThemedText
          font={fonts.regular}
          size="body"
          color={value ? 'ink' : 'inkMuted48'}
        >
          {value ? value.toLocaleDateString() : placeholder}
        </ThemedText>
      </Pressable>

      {/* iOS: inline spinner inside a custom modal so users see Done/Cancel */}
      {showIOS ? (
        <Modal
          transparent
          animationType="fade"
          visible={showIOS}
          onRequestClose={() => setShowIOS(false)}
        >
          <Pressable
            onPress={() => setShowIOS(false)}
            style={{
              flex: 1,
              backgroundColor: colors.scrim,
              justifyContent: 'flex-end',
            }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: colors.canvas,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                paddingBottom: spacing.xl,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.hairline,
                }}
              >
                <Pressable onPress={() => setShowIOS(false)}>
                  <ThemedText font={fonts.regular} size="body" color="primary">
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChange(tempDate);
                    setShowIOS(false);
                  }}
                >
                  <ThemedText font={fonts.semiBold} size="body" color="primary">
                    Done
                  </ThemedText>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={minimumDate ?? tomorrow()}
                onChange={(_, d) => d && setTempDate(d)}
                themeVariant="light"
              />
              {value ? (
                <View style={{ paddingHorizontal: spacing.lg }}>
                  <Button
                    label="Clear"
                    variant="ghost"
                    onPress={() => {
                      onChange(null);
                      setShowIOS(false);
                    }}
                    fullWidth
                  />
                </View>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {/* Android: native dialog handles its own UI */}
      {showAndroid ? (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          minimumDate={minimumDate ?? tomorrow()}
          onChange={onAndroidChange}
        />
      ) : null}
    </View>
  );
}
