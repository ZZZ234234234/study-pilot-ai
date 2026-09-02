export function shouldSendQuestion(event: {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  keyCode?: number;
}): boolean {
  // Enter confirms a Chinese IME candidate before it can submit a message.
  return (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing &&
    event.keyCode !== 229
  );
}
