import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useCallback,
} from "react";
import { Keyboard, TextInput, View } from "react-native";
type Entry = { input: View | null; error: string | undefined };
const FocusContext = createContext<{
  entries: Map<string, Entry>;
  check: () => void;
} | null>(null);
export function FormFocusProvider({ children }: { children: React.ReactNode }) {
  const entries = useRef(new Map<string, Entry>()).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const check = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      for (const entry of entries.values())
        if (entry.error) {
          entry.input?.focus();
          break;
        }
    }, 0);
  }, [entries]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <FocusContext.Provider value={{ entries, check }}>
      {children}
    </FocusContext.Provider>
  );
}
export function useFieldFocus<T extends View = TextInput>(error?: string) {
  const context = useContext(FocusContext);
  const id = useId();
  const ref = useRef<T>(null);
  const entries = context?.entries;
  const check = context?.check;
  useEffect(() => {
    entries?.set(id, { input: ref.current, error: undefined });
    return () => {
      entries?.delete(id);
    };
  }, [entries, id]);
  useEffect(() => {
    const entry = entries?.get(id);
    if (entry) entry.error = error;
    if (error) {
      if (check) check();
      else ref.current?.focus();
    }
  }, [error, entries, id, check]);
  return {
    ref,
    onSubmitEditing: () => {
      const fields = entries ? [...entries.keys()] : [];
      const next = entries?.get(fields[fields.indexOf(id) + 1] || "");
      if (next?.input) next.input.focus();
      else Keyboard.dismiss();
    },
  };
}
