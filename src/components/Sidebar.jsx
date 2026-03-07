// src/components/Sidebar.jsx
import React from 'react';

export default function Sidebar({ chatInfos, currentInfoId, setCurrentInfoId, onDeleteChat }) {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-20 flex-shrink-0">
      {/* 顶部 Logo 区 */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-center h-[72px]">
        <h1 className="text-xl font-bold tracking-wider text-gray-100">Edge TTS</h1>
      </div>

      {/* 聊天列表滚动区 */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">

        {/* 新建对话按钮 */}
        <button
          onClick={() => setCurrentInfoId('')}
          className="flex items-center justify-center gap-2 w-full py-3 mb-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700 cursor-pointer shadow-sm focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span className="font-medium">新建对话</span>
        </button>

        {/* 🌟 历史聊天列表 */}
        {chatInfos && chatInfos.length > 0 ? (
          chatInfos.map((item) => (
            <div
              key={item.id}
              onClick={() => setCurrentInfoId(item.id)}
              // ⚠️ 重点：加上了 group 类名，为了让里面的垃圾桶图标实现“悬浮出现”的效果
              className={`group flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 select-none ${
                currentInfoId === item.id
                  ? 'bg-blue-600 text-white shadow-md font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <span className="truncate pr-2">
                {item.title || '新对话'}
              </span>

              {/* 🌟 悬浮垃圾桶按钮 */}
              <button
                onClick={(e) => onDeleteChat(item.id, e)}
                title="删除"
                // opacity-0 group-hover:opacity-100 实现鼠标移入才显示
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-md transition-all focus:outline-none flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          ))
        ) : ''}
      </div>
    </aside>
  );
}
