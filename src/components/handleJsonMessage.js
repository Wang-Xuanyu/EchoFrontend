import playAudio from './playAudio'
export default function handleJsonMessage ({res,audioChunksRef,rawSubtitles,setData,setStatus,audioPlayerRef,parseSentence,textRef}) {
  switch (res.type) {
    case 'start':
      audioChunksRef.current = [];
      rawSubtitles.current = []; // 清空临时缓存
      setData([]); // 清空页面数据
      setStatus('🔄 正在合成...');
      break;
    case 'metadata':
      // 碎片存入 useRef 缓存
      rawSubtitles.current.push(res.data);
      break;
    case 'end':
      // ❌ 这里不能用 Hook，改成调用普通函数
      // 解析完成后，用 setData 存入 State 触发页面更新
      const finalSentences = parseSentence(rawSubtitles.current, textRef);
      setData(finalSentences);

      setStatus('✅ 合成完成');
      playAudio(audioChunksRef,audioPlayerRef);
      break;
    case 'error':
      setStatus('❌ 错误: ' + res.message);
      break;
    default:
      break;
  }
};
