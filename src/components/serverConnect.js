// src/components/serverConnect.js

import { addBlob } from '../utils/db.js';

export default function serverConnect({
  wsRef,
  audioChunksRef,
  rawSubtitles,
  setData,
  setStatus,
  audioPlayerRef,
  parseSentence,
  processingTextRef,
  currentInfoIdRef,
  refreshDB,
  onChunkDone
}) {
  // http://localhost:8080
  const ws = new WebSocket('wss://echo-server-568784088349.europe-west1.run.app');
  ws.binaryType = 'arraybuffer';
  wsRef.current = ws;

  ws.onopen = () => setStatus('🟢 已连接');
  ws.onclose = () => setStatus('🔴 已断开连接');
  ws.onerror = (err) => {
    console.error('WebSocket 错误:', err);
    setStatus('❌ 连接发生错误');
  };

  ws.onmessage = async (event) => {
    if (typeof event.data === 'string') {
      const res = JSON.parse(event.data);

      switch (res.type) {
        case 'start':
          audioChunksRef.current = [];
          rawSubtitles.current = [];
          setData([]);
          setStatus('🔄 正在合成...');
          break;

        case 'metadata':
          rawSubtitles.current.push(res.data);
          break;

        case 'end':
        const finalSentences = parseSentence(rawSubtitles.current, processingTextRef.current);
        setData(finalSentences);
        setStatus('✅ 当前段落合成完成');

        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });

        // ⚠️ 已注释掉：批量生成时禁止自动播放，防止多段声音打架
        // const audioUrl = URL.createObjectURL(blob);
        // if (audioPlayerRef.current) { ... }

        let targetInfoId = currentInfoIdRef.current;
        let isNewChat = false;

        if (!targetInfoId) {
          targetInfoId = Date.now().toString() + Math.random().toString(36).slice(2, 6);
          isNewChat = true;
        }

        try {
          const uniqueBlobId = Date.now().toString() + Math.random().toString(36).slice(2, 6);
          await addBlob({
            id: uniqueBlobId,
            infoId: targetInfoId,
            text: processingTextRef.current,
            sentences: finalSentences,
            audioBlob: blob
          });

          if (refreshDB) {
            refreshDB(isNewChat ? targetInfoId : null);
          }
        } catch (error) {
          console.error('❌ 保存到数据库失败:', error);
        }

        // 🌟 呼叫队列：本段处理完毕，发送下一段！
        if (onChunkDone) onChunkDone(false);

        break;

        case 'error':
          setStatus('❌ 错误: ' + res.message);
          break;

        default:
          break;
      }
    } else {
      audioChunksRef.current.push(event.data);
    }
  };

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}
