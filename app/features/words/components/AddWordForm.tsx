import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type {
  AiGenerationParams,
  AiGenerationResponse,
} from "@/app/lib/api/aiGenerator";
import {
  DEFAULT_FAMILIARITY,
  FAMILIARITY_VALUES,
} from "@/app/lib/constants";
import { DatabaseConnection } from "@/app/lib/db";
import {
  AiMetadata,
  Familiarity,
  WordEntry,
} from "@/app/lib/types";
import {
  createWordWithActivity,
  NewWordInput,
} from "../services/createWord";

type GeneratorClient = {
  generate: (params: AiGenerationParams) => Promise<AiGenerationResponse>;
};

const loadDefaultGenerator = (): GeneratorClient =>
  // 动态加载以避免在测试时触发 Supabase 环境校验
  require("@/app/lib/api/aiGenerator").aiGenerator as GeneratorClient;

interface AddWordFormProps {
  db: DatabaseConnection;
  generator?: GeneratorClient;
  onSaved?: (entry: WordEntry) => void;
  clock?: () => Date;
}

const familiarityLabels: Record<Familiarity, string> = {
  familiar: "熟悉",
  unfamiliar: "不熟",
};

const FormRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

export const AddWordForm = ({
  db,
  generator,
  onSaved,
  clock,
}: AddWordFormProps) => {
  const generatorClient = useMemo(
    () => generator ?? loadDefaultGenerator(),
    [generator],
  );
  const [surface, setSurface] = useState("");
  const [reading, setReading] = useState("");
  const [meaningZh, setMeaningZh] = useState("");
  const [exampleJa, setExampleJa] = useState("");
  const [familiarity, setFamiliarity] =
    useState<Familiarity>(DEFAULT_FAMILIARITY);
  const [aiMeta, setAiMeta] = useState<AiMetadata | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetMessages = () => {
    setError(null);
    setHint(null);
  };

  const normalizeDraft = (): NewWordInput | null => {
    const normalized = {
      surface: surface.trim(),
      reading: reading.trim(),
      meaningZh: meaningZh.trim(),
      exampleJa: exampleJa.trim(),
      familiarity,
      aiMeta,
    };

    if (
      !normalized.surface ||
      !normalized.reading ||
      !normalized.meaningZh ||
      !normalized.exampleJa
    ) {
      return null;
    }

    return normalized;
  };

  const handleGenerate = async () => {
    resetMessages();
    const normalizedSurface = surface.trim();
    if (!normalizedSurface) {
      setError("请先输入词面");
      return;
    }

    setAiLoading(true);
    try {
      const response = await generatorClient.generate({
        surface: normalizedSurface,
      });
      if (response.status === "success") {
        setReading(response.data.reading);
        setMeaningZh(response.data.meaningZh);
        setExampleJa(response.data.exampleJa);
        setAiMeta({ model: response.data.model });
        setHint("AI 生成完成，可继续编辑");
      } else {
        setReading(response.editableDraft.reading);
        setMeaningZh(response.editableDraft.meaningZh);
        setExampleJa(response.editableDraft.exampleJa);
        setAiMeta(undefined);
        setError(response.reason);
      }
    } catch (caught) {
      const err = caught as Error;
      setError(err.message || "AI 生成失败，请稍后重试");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    resetMessages();
    const normalized = normalizeDraft();
    if (!normalized) {
      setError("请填写完整信息后再保存");
      return;
    }

    setSaving(true);
    try {
      const { word } = await createWordWithActivity(
        db,
        normalized,
        clock ? clock() : new Date(),
      );

      setHint("保存成功，可继续添加下一个单词");
      setSurface("");
      setReading("");
      setMeaningZh("");
      setExampleJa("");
      setFamiliarity(DEFAULT_FAMILIARITY);
      setAiMeta(undefined);
      onSaved?.(word);
    } catch (caught) {
      const err = caught as Error;
      setError(err.message || "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const renderMessage = () => {
    if (error) {
      return <Text style={styles.error}>{error}</Text>;
    }
    if (hint) {
      return <Text style={styles.hint}>{hint}</Text>;
    }
    return null;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>新增单词</Text>
      <FormRow label="词面">
        <TextInput
          value={surface}
          onChangeText={setSurface}
          placeholder="输入词面"
          accessibilityLabel="词面输入框"
          style={styles.input}
        />
      </FormRow>
      <FormRow label="AI 生成">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="AI 生成按钮"
          style={[styles.button, aiLoading && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={aiLoading || saving}
        >
          {aiLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>AI 生成</Text>
          )}
        </Pressable>
      </FormRow>
      <FormRow label="读音">
        <TextInput
          value={reading}
          onChangeText={setReading}
          placeholder="假名读音"
          accessibilityLabel="读音输入框"
          style={styles.input}
        />
      </FormRow>
      <FormRow label="释义">
        <TextInput
          value={meaningZh}
          onChangeText={setMeaningZh}
          placeholder="中文释义"
          accessibilityLabel="释义输入框"
          style={[styles.input, styles.multiline]}
          multiline
        />
      </FormRow>
      <FormRow label="例句">
        <TextInput
          value={exampleJa}
          onChangeText={setExampleJa}
          placeholder="日文例句"
          accessibilityLabel="例句输入框"
          style={[styles.input, styles.multiline]}
          multiline
        />
      </FormRow>
      <FormRow label="熟悉度">
        <View style={styles.segment}>
          {FAMILIARITY_VALUES.map((option) => {
            const active = familiarity === option;
            const isLast = option === FAMILIARITY_VALUES[FAMILIARITY_VALUES.length - 1];
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.segmentButton,
                  !isLast && styles.segmentButtonSpacing,
                  active && styles.segmentButtonActive,
                ]}
                onPress={() => setFamiliarity(option)}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.segmentText,
                    active && styles.segmentTextActive,
                  ]}
                >
                  {familiarityLabels[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FormRow>
      {renderMessage()}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="保存单词"
        style={[styles.saveButton, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving || aiLoading}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>保存</Text>
        )}
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#475569",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  segment: {
    flexDirection: "row",
  },
  segmentButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentButtonSpacing: {
    marginRight: 8,
  },
  segmentButtonActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },
  segmentText: {
    color: "#334155",
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#1d4ed8",
  },
  error: {
    color: "#b91c1c",
    fontSize: 14,
    marginBottom: 8,
  },
  hint: {
    color: "#0f5132",
    fontSize: 14,
    marginBottom: 8,
  },
});
