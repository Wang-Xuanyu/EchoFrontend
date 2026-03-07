// src/components/Main.jsx
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Focusmode from "./Focusmode"
const VOICE_OPTIONS = [
  {
    group: "🇺🇸 美国英语 (US)",
    options: [
      { value: "en-US-AriaNeural", label: "Aria (女声) - 自然/情感丰富" },
      { value: "en-US-GuyNeural", label: "Guy (男声) - 成熟沉稳" },
      { value: "en-US-JennyNeural", label: "Jenny (女声) - 微软默认/亲切" },
      { value: "en-US-ChristopherNeural", label: "Christopher (男声) - 广播腔" },
      { value: "en-US-AnaNeural", label: "Ana (女童声) - 清脆可爱" },
      { value: "en-US-MichelleNeural", label: "Michelle (女声) - 柔和/纪录片" },
      { value: "en-US-SteffanNeural", label: "Steffan (男声) - 清朗/教育" },
    ]
  },
  {
    group: "🇬🇧 英国英语 (GB)",
    options: [
      { value: "en-GB-SoniaNeural", label: "Sonia (女声) - 标准英音/优雅" },
      { value: "en-GB-RyanNeural", label: "Ryan (男声) - 专业/克制" },
      { value: "en-GB-LibbyNeural", label: "Libby (女声) - 轻松活泼" },
      { value: "en-GB-OliverNeural", label: "Oliver (男声) - 年轻/活力" },
    ]
  },
  {
    group: "🇦🇺 澳洲英语 (AU)",
    options: [
      { value: "en-AU-NatashaNeural", label: "Natasha (女声) - 澳洲口音/平易近人" },
      { value: "en-AU-WilliamNeural", label: "William (男声) - 清晰有力" },
    ]
  },
  {
    group: "🇨🇦 加拿大英语 (CA)",
    options: [
      { value: "en-CA-ClaraNeural", label: "Clara (女声) - 发音饱满" },
      { value: "en-CA-LiamNeural", label: "Liam (男声) - 平稳厚重" },
    ]
  }
];

export default function Main({
  text, setText, status, data, historyBlobs, currentVoice, setCurrentVoice, audioPlayerRef, onSend, isSending
}) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeSentence, setActiveSentence] = useState('点击下方播放按钮，开始聆听...');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAudioEnded = () => {
    const player = audioPlayerRef.current;
    if (!player || !historyBlobs) return;

    const currentBlobId = player.dataset.blobId;
    if (!currentBlobId) return;

    const currentIndex = historyBlobs.findIndex(b => String(b.id) === currentBlobId);

    if (currentIndex !== -1 && currentIndex < historyBlobs.length - 1) {
      const nextBlob = historyBlobs[currentIndex + 1];
      if (nextBlob.audioBlob) {
        player.src = URL.createObjectURL(nextBlob.audioBlob);
        player.dataset.blobId = nextBlob.id;

        if (nextBlob.sentences && nextBlob.sentences.length > 0) {
          player.dataset.currentSentenceId = `${nextBlob.id}-${nextBlob.sentences[0].id}`;
        }
        player.play().catch(e => console.error("自动连播失败:", e));
      }
    } else {
      player.dataset.currentSentenceId = '';
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const player = audioPlayerRef.current;
    if (!player || !isFocusMode) return;

    const currentBlobId = player.dataset.blobId;
    const currentTimeMs = player.currentTime * 1000;

    if (!currentBlobId || !historyBlobs) return;

    const currentBlob = historyBlobs.find(b => String(b.id) === currentBlobId);
    if (currentBlob && currentBlob.sentences) {
      const currentSentence = currentBlob.sentences.find(
        s => currentTimeMs >= s.start && currentTimeMs <= s.end
      );

      if (currentSentence && currentSentence.text !== activeSentence) {
        setActiveSentence(currentSentence.text);
      }
    }
  };

  const togglePlayPause = () => {
    const player = audioPlayerRef.current;
    if (!player) return;

    if (!player.src || player.src === '' || player.src === window.location.href) {
      if (historyBlobs && historyBlobs.length > 0 && historyBlobs[0].audioBlob) {
        player.src = URL.createObjectURL(historyBlobs[0].audioBlob);
        player.dataset.blobId = historyBlobs[0].id;
        player.play();
      }
    } else {
      if (player.paused) player.play();
      else player.pause();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center p-5 bg-white z-10 border-b border-gray-100">
        <select
          value={currentVoice}
          onChange={(e) => setCurrentVoice(e.target.value)}
          className="p-2.5 text-base text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-72 transition-colors"
        >
          {VOICE_OPTIONS.map((group, index) => (
            <optgroup key={index} label={group.group}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <button
          onClick={() => setIsFocusMode(!isFocusMode)}
          className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm flex items-center gap-2 ${
            isFocusMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isFocusMode ? '🎯 退出专注模式' : '📖 进入专注模式'}
        </button>
      </div>

      {/* 滚动内容区 */}
      <main className="flex-1 overflow-y-auto p-5 w-full max-w-[800px] mx-auto pb-20 flex flex-col">

        {/* ========================================= */}
        {/* 视图 A: 专注模式 (动态单句)                 */}
        {/* ========================================= */}
        {isFocusMode ? (
          <Focusmode {...{activeSentence,togglePlayPause,isPlaying}}/>
        ) : (

        /* ========================================= */
        /* 视图 B: 原文模式 (🌟 恢复了完全干净的块状排版) */
        /* ========================================= */
          <div className="leading-[1.9] text-lg pb-10 mt-4">

            {historyBlobs && historyBlobs.map((blob) => (
              <React.Fragment key={blob.id}>
                {blob.sentences && blob.sentences.map((item) => (
                  // 🌟 恢复成 div，每一句独立成块，鼠标悬停有轻微的高亮背景
                  <div
                    key={`${blob.id}-${item.id}`}
                    className="my-3 p-3 hover:bg-gray-50 hover:shadow-sm rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200"
                    onClick={() => {
                      const player = audioPlayerRef.current;
                      if (!player) return;

                      const sentenceKey = `${blob.id}-${item.id}`;

                      if (player.dataset.blobId !== String(blob.id)) {
                        if (blob.audioBlob) {
                          player.src = URL.createObjectURL(blob.audioBlob);
                          player.dataset.blobId = blob.id;
                        }
                      }

                      if (player.dataset.currentSentenceId === sentenceKey && !player.paused) {
                        player.pause();
                      } else {
                        player.currentTime = item.start / 1000;
                        player.play().catch(e => console.error("播放失败:", e));
                        player.dataset.currentSentenceId = sentenceKey;
                      }
                    }}
                  >
                    {item.text}
                  </div>
                ))}
              </React.Fragment>
            ))}

            {(!historyBlobs || historyBlobs.length === 0) && (!data || data.length === 0) && (
              <div className="flex items-center justify-center h-40 text-gray-400 mt-20">
                在下方输入长文本并发送，解析后的句子将显示在这里...
              </div>
            )}
          </div>
        )}
      </main>

      {/* 底部固定输入区 */}
      {!isFocusMode && (
        <footer className="w-full bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-10">
          <div className="w-full max-w-[800px] mx-auto">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="font-bold text-gray-700 text-sm">Enter Here</label>
              <span className={`text-sm font-semibold ${status.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
                Status: {status}
              </span>
            </div>

            <div className="flex gap-3 items-end">
              <textarea
                className="flex-1 p-3 text-base leading-relaxed rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none bg-gray-50"
                rows="3"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type the text that you want to hear and click submit..."
              />

              <Button
                endIcon={<SendIcon />}
                variant="outlined"
                size="large"
                disabled={isSending || !text.trim()}
                sx={{ height: '100%', borderRadius: '12px', minHeight: '50px', whiteSpace: 'nowrap' }}
                onClick={onSend}
              >
                {isSending ? '队列发送中...' : '发送'}
              </Button>
            </div>
          </div>
        </footer>
      )}

      {/* 隐藏的全局音频播放器 */}
      <audio
        ref={audioPlayerRef}
        controls
        className="hidden"
        onEnded={handleAudioEnded}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
// // src/components/Main.jsx
// import React from 'react';
// import Button from '@mui/material/Button';
// import SendIcon from '@mui/icons-material/Send';
//
// const VOICE_OPTIONS = [
//   {
//     group: "🇺🇸 美国英语 (US)",
//     options: [
//       { value: "en-US-AriaNeural", label: "Aria (女声) - 自然/情感丰富" },
//       { value: "en-US-GuyNeural", label: "Guy (男声) - 成熟沉稳" },
//       { value: "en-US-JennyNeural", label: "Jenny (女声) - 微软默认/亲切" },
//       { value: "en-US-ChristopherNeural", label: "Christopher (男声) - 广播腔" },
//       { value: "en-US-AnaNeural", label: "Ana (女童声) - 清脆可爱" },
//       { value: "en-US-MichelleNeural", label: "Michelle (女声) - 柔和/纪录片" },
//       { value: "en-US-SteffanNeural", label: "Steffan (男声) - 清朗/教育" },
//     ]
//   },
//   {
//     group: "🇬🇧 英国英语 (GB)",
//     options: [
//       { value: "en-GB-SoniaNeural", label: "Sonia (女声) - 标准英音/优雅" },
//       { value: "en-GB-RyanNeural", label: "Ryan (男声) - 专业/克制" },
//       { value: "en-GB-LibbyNeural", label: "Libby (女声) - 轻松活泼" },
//       { value: "en-GB-OliverNeural", label: "Oliver (男声) - 年轻/活力" },
//     ]
//   },
//   {
//     group: "🇦🇺 澳洲英语 (AU)",
//     options: [
//       { value: "en-AU-NatashaNeural", label: "Natasha (女声) - 澳洲口音/平易近人" },
//       { value: "en-AU-WilliamNeural", label: "William (男声) - 清晰有力" },
//     ]
//   },
//   {
//     group: "🇨🇦 加拿大英语 (CA)",
//     options: [
//       { value: "en-CA-ClaraNeural", label: "Clara (女声) - 发音饱满" },
//       { value: "en-CA-LiamNeural", label: "Liam (男声) - 平稳厚重" },
//     ]
//   }
// ];
// export default function Main({
//   text, setText, status, data, historyBlobs, currentVoice, setCurrentVoice, audioPlayerRef, onSend, isSending
// }) {
//
//   // 🌟 新增：处理音频播放完毕后的“自动连播”逻辑
//   const handleAudioEnded = () => {
//     const player = audioPlayerRef.current;
//     if (!player || !historyBlobs) return;
//
//     // 获取刚才播完的是哪一个 Blob 块
//     const currentBlobId = player.dataset.blobId;
//     if (!currentBlobId) return;
//
//     // 去历史记录数组里，找到它的索引位置
//     const currentIndex = historyBlobs.findIndex(b => String(b.id) === currentBlobId);
//
//     // 如果它不是最后一段，就自动播放下一段
//     if (currentIndex !== -1 && currentIndex < historyBlobs.length - 1) {
//       const nextBlob = historyBlobs[currentIndex + 1];
//
//       if (nextBlob.audioBlob) {
//         // 加载下一段音频
//         player.src = URL.createObjectURL(nextBlob.audioBlob);
//         player.dataset.blobId = nextBlob.id;
//
//         // 顺便记录当前正在播放的句子，方便下次点击时执行暂停逻辑
//         if (nextBlob.sentences && nextBlob.sentences.length > 0) {
//           player.dataset.currentSentenceId = `${nextBlob.id}-${nextBlob.sentences[0].id}`;
//         }
//
//         // 自动播放！
//         player.play().catch(e => console.error("自动连播失败 (可能是浏览器限制了自动播放):", e));
//       }
//     } else {
//       // 如果全部播完了，清空状态
//       player.dataset.currentSentenceId = '';
//     }
//   };
//
//   return (
//     <div className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
//       {/* Main 的上方滚动内容区 */}
//       <main className="flex-1 overflow-y-auto p-5 w-full max-w-[800px] mx-auto pb-20">
//         <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 mt-4">Edge TTS React 测试</h2>
//
//         {/* --- 下拉选择菜单 --- */}
//         <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
//           <label className="font-bold block mb-2 text-gray-700 text-sm">
//             选择发音人：
//           </label>
//           <select
//             value={currentVoice}
//             onChange={(e) => setCurrentVoice(e.target.value)}
//             className="w-full p-2.5 text-base text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
//           >
//             {VOICE_OPTIONS.map((group, index) => (
//               <optgroup key={index} label={group.group}>
//                 {group.options.map((option) => (
//                   <option key={option.value} value={option.value}>
//                     {option.label}
//                   </option>
//                 ))}
//               </optgroup>
//             ))}
//           </select>
//         </div>
//
//         {/* --- 句子展示区 --- */}
//         <div className="leading-[1.9] text-lg pb-10">
//
//           {historyBlobs && historyBlobs.map((blob) => (
//             <React.Fragment key={blob.id}>
//               {blob.sentences && blob.sentences.map((item) => (
//                 <div
//                   key={`${blob.id}-${item.id}`}
//                   className="my-3 p-3 hover:bg-gray-50 hover:shadow-sm rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200"
//                   onClick={() => {
//                     const player = audioPlayerRef.current;
//                     if (!player) return;
//
//                     const sentenceKey = `${blob.id}-${item.id}`;
//
//                     if (player.dataset.blobId !== String(blob.id)) {
//                       if (blob.audioBlob) {
//                         player.src = URL.createObjectURL(blob.audioBlob);
//                         player.dataset.blobId = blob.id;
//                       }
//                     }
//
//                     if (player.dataset.currentSentenceId === sentenceKey && !player.paused) {
//                       player.pause();
//                     } else {
//                       player.currentTime = item.start / 1000;
//                       player.play().catch(e => console.error("播放失败:", e));
//                       player.dataset.currentSentenceId = sentenceKey;
//                     }
//                   }}
//                 >
//                   {item.text}
//                 </div>
//               ))}
//             </React.Fragment>
//           ))}
//
//           {/* 空白提示 */}
//           {(!historyBlobs || historyBlobs.length === 0) && (!data || data.length === 0) && (
//             <div className="flex items-center justify-center h-40 text-gray-400">
//               在下方输入文本并发送，解析后的句子将显示在这里...
//             </div>
//           )}
//         </div>
//       </main>
//
//       {/* 底部固定输入区 */}
//       <footer className="w-full bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-10">
//         <div className="w-full max-w-[800px] mx-auto">
//           <div className="flex justify-between items-center mb-2 px-1">
//             <label className="font-bold text-gray-700 text-sm">Enter Here</label>
//             <span className={`text-sm font-semibold ${status.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
//               Status: {status}
//             </span>
//           </div>
//
//           <div className="flex gap-3 items-end">
//             <textarea
//               className="flex-1 p-3 text-base leading-relaxed rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none bg-gray-50"
//               rows="3"
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//               placeholder="Type the text that you want to hear and click submit..."
//             />
//
//             <Button
//               endIcon={<SendIcon />}
//               variant="outlined"
//               size="large"
//               disabled={isSending || !text.trim()} // 在排队发送中禁用按钮
//               sx={{ height: '100%', borderRadius: '12px', minHeight: '50px', whiteSpace: 'nowrap' }}
//               onClick={onSend}
//             >
//               {isSending ? '发送中...' : 'Send'}
//             </Button>
//           </div>
//         </div>
//       </footer>
//
//       {/* 🌟 核心绑定：给原生 audio 加上 onEnded 监听器 */}
//       <audio
//         ref={audioPlayerRef}
//         controls
//         className="hidden"
//         onEnded={handleAudioEnded}
//       />
//     </div>
//   );
// }
