import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Text, View } from "react-native";
import { Button, C, s } from "./ui";
type Action = { label: string; disabled: boolean; run: () => void };
const SaveContext = createContext<React.Dispatch<
  React.SetStateAction<Action | null>
> | null>(null);
export function EditorSaveProvider({
  children,
  dirty,
  busy,
}: {
  children: React.ReactNode;
  dirty: boolean;
  busy: boolean;
}) {
  const [action, setAction] = useState<Action | null>(null);
  return (
    <SaveContext.Provider value={setAction}>
      {children}
      {action && (
        <View
          style={{
            padding: 14,
            gap: 8,
            borderTopWidth: 1,
            borderColor: C.line,
            backgroundColor: "white",
          }}
        >
          <Text
            accessibilityLiveRegion="polite"
            style={[s.body, { fontSize: 12 }]}
          >
            {busy
              ? "Saving your changes…"
              : dirty
                ? "Unsaved changes"
                : "Ready to save"}
          </Text>
          <Button
            label={action.label}
            disabled={action.disabled}
            onPress={action.run}
          />
        </View>
      )}
    </SaveContext.Provider>
  );
}
export function SaveControl({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const register = useContext(SaveContext);
  const action = useRef(onPress);
  action.current = onPress;
  useEffect(() => {
    if (!register) return;
    register({ label, disabled, run: () => action.current() });
    return () => register(null);
  }, [register, label, disabled]);
  return register ? null : (
    <Button label={label} disabled={disabled} onPress={onPress} />
  );
}
export { FormFocusProvider, useFieldFocus } from "./FormFocus";
