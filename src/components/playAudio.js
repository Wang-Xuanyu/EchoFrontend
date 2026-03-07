export default function playAudio(audioChunksRef,audioPlayerRef) {
  if (audioChunksRef.current.length === 0) return;
  const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
  const audioUrl = URL.createObjectURL(blob);
  if (audioPlayerRef.current) {
    audioPlayerRef.current.src = audioUrl;
  }
};
