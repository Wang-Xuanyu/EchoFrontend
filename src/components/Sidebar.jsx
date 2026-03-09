// src/components/Sidebar.jsx
import React from 'react';

export default function Sidebar({ chatInfos, currentInfoId, setCurrentInfoId, onDeleteChat, isOpen, setIsOpen }) {

  // 🌟 移动端点击聊天后，自动收起侧边栏
  const handleSelectChat = (id) => {
    setCurrentInfoId(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* 🌟 移动端背景遮罩层：点击遮罩层关闭侧边栏 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏主体：加上了 transform 和 transition 实现滑出动画，md: 以上恢复静态定位 */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col shadow-2xl md:shadow-xl z-40 flex-shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* 顶部 Logo 区 */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between md:justify-center h-[72px]">
          <h1 className="text-xl font-bold tracking-wider text-gray-100">Edge TTS</h1>
          {/* 🌟 移动端专属：关闭按钮 */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white focus:outline-none"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* 聊天列表滚动区 */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">

          <button
            onClick={() => handleSelectChat('')}
            className="flex items-center justify-center gap-2 w-full py-3 mb-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700 cursor-pointer shadow-sm focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span className="font-medium">新建对话</span>
          </button>

          {chatInfos && chatInfos.length > 0 ? (
            chatInfos.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectChat(item.id)}
                className={`group flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 select-none ${
                  currentInfoId === item.id
                    ? 'bg-blue-600 text-white shadow-md font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                <span className="truncate pr-2">
                  {item.title || '新对话'}
                </span>

                <button
                  onClick={(e) => onDeleteChat(item.id, e)}
                  title="删除"
                  className="opacity-0 group-hover:opacity-100 md:opacity-0 p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-md transition-all focus:outline-none flex-shrink-0"
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
    </>
  );
}
