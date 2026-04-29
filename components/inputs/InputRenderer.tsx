'use client';

import { useWorkflowStore } from '@/stores/workflowStore';
import { inferInputType } from './inferInputType';
import { TextInput } from './TextInput';
import { TextAreaInput } from './TextAreaInput';
import { JsonEditorInput } from './JsonEditorInput';
import { FileUploadInput } from './FileUploadInput';

interface InputRendererProps {
  inputNames: string[];
}

function toLabel(name: string): string {
  return name
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InputRenderer({ inputNames }: InputRendererProps) {
  const inputs = useWorkflowStore((s) => s.inputs);
  const setInput = useWorkflowStore((s) => s.setInput);

  const handleChange = (name: string, value: unknown) => {
    setInput(name, value);
  };

  return (
    <div className="flex flex-col gap-6">
      {inputNames.map((name) => {
        const type = inferInputType(name);
        const label = toLabel(name);
        const value = (inputs[name] as string) ?? '';

        switch (type) {
          case 'file':
            return (
              <FileUploadInput
                key={name}
                name={name}
                label={label}
                onChange={handleChange}
              />
            );
          case 'json':
            return (
              <JsonEditorInput
                key={name}
                name={name}
                label={label}
                value={value}
                onChange={handleChange}
              />
            );
          case 'textarea':
            return (
              <TextAreaInput
                key={name}
                name={name}
                label={label}
                value={value}
                onChange={handleChange}
              />
            );
          default:
            return (
              <TextInput
                key={name}
                name={name}
                label={label}
                value={value}
                onChange={handleChange}
              />
            );
        }
      })}
    </div>
  );
}
