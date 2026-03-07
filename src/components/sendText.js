export default function sendText({text,wsRef,voice,lang}) {
  if (!text.trim()) return alert('请输入文本');
  if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
    return alert('WebSocket 未连接，请稍后再试');
  }
  const payload = {
    text: text,
    voice,
    lang
  };
  wsRef.current.send(JSON.stringify(payload));
}
