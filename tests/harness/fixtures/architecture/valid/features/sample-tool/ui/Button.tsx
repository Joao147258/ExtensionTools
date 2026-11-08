export function ActionButton(props: { label: string; onClick: () => void }) {
  return { type: 'button', label: props.label };
}
