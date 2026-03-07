import { openDB } from 'idb';

const DB_NAME = 'Echo_Database';
const DB_VERSION = 1;

/**
 * ==========================================
 * 1. 核心：初始化数据库
 * ==========================================
 */
export const initDB = async () => {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('infos')) {
        db.createObjectStore('infos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('blobs')) {
        const blobStore = db.createObjectStore('blobs', { keyPath: 'id' });
        blobStore.createIndex('infoId', 'infoId');
      }
    },
  });
};

/**
 * ==========================================
 * 2. Infos 表操作 (聊天会话元数据)
 * ==========================================
 */

// [查] 获取所有会话列表 (按时间倒序)
export const getInfos = async () => {
  const db = await initDB();
  const infos = await db.getAll('infos');
  return infos.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getBlobs = async () => {
  const db = await initDB();
  const blobs = await db.getAll('blobs');
  return blobs
};

// [查] 获取单个会话详情
export const getInfoById = async (id) => {
  const db = await initDB();
  return await db.get('infos', id);
};

// [增] 创建新会话
export const createInfo = async (id, title = '新对话') => {
  const db = await initDB();
  const newInfo = { id, title, updatedAt: Date.now() };
  await db.add('infos', newInfo);
  return newInfo;
};

// [改] 更新会话信息 (例如：用户手动修改聊天标题)
export const updateInfo = async (id, updates) => {
  const db = await initDB();
  const info = await db.get('infos', id);
  if (!info) throw new Error('Info not found');

  const updatedInfo = { ...info, ...updates, updatedAt: Date.now() };
  await db.put('infos', updatedInfo);
  return updatedInfo;
};

// [删] 删除单个会话 (🔥 级联删除：会自动删掉这个会话下的所有音频 blob，释放硬盘空间)
export const deleteInfo = async (id) => {
  const db = await initDB();
  const tx = db.transaction(['infos', 'blobs'], 'readwrite');

  // 1. 删除 infos 表里的会话
  await tx.objectStore('infos').delete(id);

  // 2. 查出所有属于这个会话的 blobs 并逐个删除
  const blobStore = tx.objectStore('blobs');
  const blobsToDelete = await blobStore.index('infoId').getAllKeys(id);
  for (const blobId of blobsToDelete) {
    await blobStore.delete(blobId);
  }

  await tx.done;
};

// [清空] 清空所有会话
export const clearAllInfos = async () => {
  const db = await initDB();
  await db.clear('infos');
};


/**
 * ==========================================
 * 3. Blobs 表操作 (具体文本与音频文件)
 * ==========================================
 */

// [查] 获取某个会话下的所有数据块 (按时间正序排列)
export const getBlobsByInfoId = async (infoId) => {
  const db = await initDB();
  const blobs = await db.getAllFromIndex('blobs', 'infoId', infoId);
  return blobs.sort((a, b) => a.createdAt - b.createdAt);
};

// [查] 获取单个数据块 (提取某一段特定的音频)
export const getBlobById = async (id) => {
  const db = await initDB();
  return await db.get('blobs', id);
};

// [增] 添加数据块 (🔥 包含智能更新 Info 标题的事务)
// [增] 添加数据块 (🔥 包含智能懒创建 Info 的事务)
export const addBlob = async (blobData) => {
  const db = await initDB();
  const tx = db.transaction(['blobs', 'infos'], 'readwrite');

  // 1. 第一步：把具体的音频和文本存入 blobs 表
  const newBlob = { ...blobData, createdAt: Date.now() };
  await tx.objectStore('blobs').add(newBlob);

  // 2. 第二步：去 infos 表里找有没有对应的聊天室
  const infoStore = tx.objectStore('infos');
  let info = await infoStore.get(blobData.infoId);

  // 🌟 核心修复区 🌟
  if (!info) {
    // 【情况 A：懒创建的第一句话】
    // 数据库里还没有这个聊天室，我们当场给它建一个！
    // 标题直接截取这句话的前 15 个字
    info = {
      id: blobData.infoId,
      title: blobData.text ? blobData.text.substring(0, 15) + (blobData.text.length > 15 ? '...' : '') : '新对话',
      updatedAt: Date.now()
    };
    await infoStore.put(info); // 存入新创建的聊天室

  } else {
    // 【情况 B：老聊天室继续发消息】
    // 聊天室已经存在了，我们只更新它的最后活跃时间
    info.updatedAt = Date.now();

    // 如果它之前没拿到名字（叫新对话），现在给它补上名字
    if (info.title === '新对话' && blobData.text) {
      info.title = blobData.text.substring(0, 15) + (blobData.text.length > 15 ? '...' : '');
    }
    await infoStore.put(info); // 更新老聊天室
  }

  // 提交事务
  await tx.done;
  return newBlob;
};

// [删] 删除单条请求记录及其音频
export const deleteBlob = async (id) => {
  const db = await initDB();
  await db.delete('blobs', id);
};

// [清空] 危险操作：清空所有保存的音频和文本数据
export const clearAllBlobs = async () => {
  const db = await initDB();
  await db.clear('blobs');
};

/**
 * ==========================================
 * 4. 终极清理 (格式化)
 * ==========================================
 */
// [清空库] 一键清除所有聊天和音频 (恢复出厂设置)
export const factoryResetDatabase = async () => {
  const db = await initDB();
  const tx = db.transaction(['infos', 'blobs'], 'readwrite');
  await tx.objectStore('infos').clear();
  await tx.objectStore('blobs').clear();
  await tx.done;
};





export const deleteChatById = async (infoId) => {
  const db = await initDB();
  const tx = db.transaction(['infos', 'blobs'], 'readwrite');

  // 1. 删除 infos 表里的聊天标题
  await tx.objectStore('infos').delete(infoId);

  // 2. 找出 blobs 表里所有属于这个聊天的音频块，并全部删除
  const blobStore = tx.objectStore('blobs');
  const allBlobs = await blobStore.getAll();
  for (const blob of allBlobs) {
    if (blob.infoId === infoId) {
      await blobStore.delete(blob.id);
    }
  }

  await tx.done;
  console.log(`🗑️ 聊天 [${infoId}] 及其关联的音频已彻底删除！`);
};
