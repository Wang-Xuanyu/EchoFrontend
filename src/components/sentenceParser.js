// sentenceParser.js
export default function parseSentence(metadataList, originalText) {
  // originalText = originalText.current
  if (!metadataList || metadataList.length === 0 || !originalText) return [];

  const rawSentences = originalText
    .match(/[^.?!。？！\n]+[.?!。？！\n]*/g)
    ?.map(s => s.trim())
    .filter(s => s.replace(/[\s.?!。？！\n,'"-]/g, '').length > 0) || [originalText];

  const result = [];
  let metaIdx = 0;

  for (let i = 0; i < rawSentences.length; i++) {
    const sentenceText = rawSentences[i];
    let currentStart = null;
    let currentEnd = null;
    let accumulatedChars = 0;
    const targetCleanLength = sentenceText.replace(/[\s.?!。？！\n,'"-]/g, '').length;

    while (metaIdx < metadataList.length) {
      const meta = metadataList[metaIdx];
      if (currentStart === null) currentStart = meta.start;
      currentEnd = meta.end;
      const metaCleanLength = meta.part.replace(/[\s.?!。？！\n,'"-]/g, '').length;
      accumulatedChars += metaCleanLength;
      metaIdx++;

      if (accumulatedChars >= targetCleanLength) {
        break;
      }
    }

    result.push({
      id: i,
      start: currentStart,
      end: currentEnd,
      text: sentenceText
    });
  }

  return result;
}
