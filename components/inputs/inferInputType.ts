export type InputFieldType = 'text' | 'textarea' | 'json' | 'file';

interface InferenceRule {
  pattern: RegExp;
  type: InputFieldType;
}

// Priority-ordered: first match wins
const RULES: InferenceRule[] = [
  { pattern: /attach|file|upload|document|image|pdf|photo|screenshot/i, type: 'file' },
  { pattern: /json|config|payload|schema|object|struct|data|body/i, type: 'json' },
  { pattern: /description|prompt|content|message|note|comment|summary|text|detail|reason|context|instruction/i, type: 'textarea' },
];

export function inferInputType(name: string): InputFieldType {
  for (const rule of RULES) {
    if (rule.pattern.test(name)) return rule.type;
  }
  return 'text';
}
