import { useState, useEffect, useRef } from 'react';
import parseSentence from './components/sentenceParser.js';
import serverConnect from './components/serverConnect.js';
import sendText from './components/sendText.js';
import splitTextIntoChunks from './components/splitTextIntoChunks.js';

import Sidebar from './components/Sidebar.jsx';
import Main from './components/Main.jsx';

// 🌟 引入我们刚刚写好的 DB 方法
import {deleteChatById, getInfos,getBlobs, createInfo, getBlobsByInfoId,clearAllBlobs,clearAllInfos } from './utils/db.js';

function App() {
  const [chatInfos, setChatInfos] = useState([]);
  const [currentInfoId, setCurrentInfoId] = useState('');
  const [historyBlobs, setHistoryBlobs] = useState([]);

  const [text, setText] = useState('');
  const [status, setStatus] = useState('等待连接...');
  const [data, setData] = useState([]);
  const [currentVoice, setCurrentVoice] = useState("en-US-AriaNeural");

  // 🌟 2. 新增队列状态：是否正在处理批量发送
  const [isSending, setIsSending] = useState(false);
  const textQueueRef = useRef([]); // 存放切分好的文字块队列

  const processingTextRef = useRef('');
  const textRef = useRef(text);
  const currentInfoIdRef = useRef(currentInfoId);
  // 突破闭包限制：随时获取最新的发音人
  const currentVoiceRef = useRef(currentVoice);

  const rawSubtitles = useRef([]);
  const wsRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  useEffect(() => { textRef.current = text; }, [text]);
  useEffect(() => { currentInfoIdRef.current = currentInfoId; }, [currentInfoId]);
  useEffect(() => { currentVoiceRef.current = currentVoice; }, [currentVoice]);

  useEffect(() => {
    const initApp = async () => {
      let infos = await getInfos();
      setChatInfos(infos);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (currentInfoId) {
      // 切换到老聊天室时，去数据库拉取对应的音频和文本块
      getBlobsByInfoId(currentInfoId).then(blobs => {
        setHistoryBlobs(blobs);
      });
      setData([]);
      setStatus('等待连接...');
    } else {
      // 🌟 修复关键：如果 ID 为空（点击了新建对话），就把右侧变成白板！
      setHistoryBlobs([]);
      setData([]);
      setStatus('等待连接...');
    }
  }, [currentInfoId]);

  const handleDeleteChat = async (infoIdToDel, e) => {
    e.stopPropagation(); // ⚠️ 阻止点击事件冒泡（防止点删除时触发了切换聊天的效果）

    if (!window.confirm("确定要永久删除这条对话及其所有音频吗？")) return;

    // 1. 从数据库中彻底删除
    await deleteChatById(infoIdToDel);

    // 2. 更新左侧列表的 State，让它瞬间消失
    setChatInfos(prev => prev.filter(info => info.id !== infoIdToDel));

    // 3. 如果删除的刚好是当前正在看的聊天，就把右侧清空变成白板
    if (currentInfoId === infoIdToDel) {
      setCurrentInfoId('');
    }
  };


  // 🌟 3. 处理队列的核心逻辑 (用 Ref 包裹防止 React 闭包陷阱)
  const processNextChunk = (hasError = false) => {
    // 如果出错了，或者队列全发完了，就结束发送状态
    if (hasError || textQueueRef.current.length === 0) {
      setIsSending(false);
      textQueueRef.current = [];
      return;
    }

    // 从队列里拿出下一段文字发给服务器
    const chunk = textQueueRef.current.shift();
    processingTextRef.current = chunk;
    const voice = currentVoiceRef.current;

    sendText({
      text: chunk, wsRef, voice: voice, lang: voice.substring(0, 5)
    });
  };

  // 用一个 ref 把函数传给 serverConnect
  const processNextChunkRef = useRef(processNextChunk);
  useEffect(() => { processNextChunkRef.current = processNextChunk; });

  useEffect(() => {
    serverConnect({
      wsRef, audioChunksRef, rawSubtitles, setData, setStatus, audioPlayerRef, parseSentence, processingTextRef, currentInfoIdRef,
      refreshDB: async (newInfoId) => {
        const updatedInfos = await getInfos();
        setChatInfos(updatedInfos);
        if (newInfoId) {
          setCurrentInfoId(newInfoId);
          setHistoryBlobs(await getBlobsByInfoId(newInfoId));
        } else if (currentInfoIdRef.current) {
          setHistoryBlobs(await getBlobsByInfoId(currentInfoIdRef.current));
        }
      },
      // 🌟 4. 把处理队列的方法传给 WebSocket 连接器
      onChunkDone: (hasError) => processNextChunkRef.current(hasError)
    });
  }, []);

  // 🌟 5. 发送按钮逻辑变更：切分并启动队列
  const handleSend = () => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    // 把长文本切成数组并塞进队列
    textQueueRef.current = splitTextIntoChunks(text, 800);

    // 扣动扳机，发射第一个块
    processNextChunkRef.current();
    setText('');
  };

  return (
    <div className="flex flex-row h-screen w-screen overflow-hidden bg-gray-50 text-gray-800">


      <Sidebar onDeleteChat={handleDeleteChat} chatInfos={chatInfos} currentInfoId={currentInfoId} setCurrentInfoId={setCurrentInfoId} />
      <Main
        text={text}
        setText={setText}
        status={status}
        data={data}
        historyBlobs={historyBlobs}
        currentVoice={currentVoice}
        setCurrentVoice={setCurrentVoice}
        audioPlayerRef={audioPlayerRef}
        onSend={handleSend}
        isSending={isSending} // 🌟 传给 Main，让发送按钮在排队时禁用
      />
    </div>
  );
}
// <div onClick={async ()=>{
//   console.log('infos:',await getInfos());
//   console.log("blobs:",await getBlobs())
// }}>log</div>
// <div onClick={async ()=>{
//   await clearAllBlobs()
//   await clearAllInfos()
// }}>clear</div>
export default App;
