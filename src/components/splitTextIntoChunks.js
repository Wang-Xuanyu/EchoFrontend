export default function splitTextIntoChunks(text, maxLength = 800) {
  if (!text) return [];
  const sentences = text.match(/[^.?!。？！\n]+[.?!。？！\n]*/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (let sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
};
