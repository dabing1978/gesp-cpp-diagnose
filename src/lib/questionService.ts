import initialQuestions from '@/data/questions.json';
import syllabusData from '@/data/syllabus.json';
import { GespLevel, LevelMeta, MistakeRecord, Question, QuestionType } from '@/types/question';

const STORAGE_KEYS = {
  OVERRIDES: 'gesp_question_overrides',
  MISTAKES: 'gesp_mistake_notebook',
  PROGRESS: 'gesp_user_progress',
};

// 安全获取 localStorage（兼容 SSR）
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.warn(`Error reading localStorage for key "${key}":`, e);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving localStorage for key "${key}":`, e);
  }
}

/**
 * 获取合并了本地覆写层后的全部题目列表
 */
export function getAllQuestions(): Question[] {
  const overrides = getStorageItem<Record<string, Question>>(STORAGE_KEYS.OVERRIDES, {});
  const baseQuestions = (initialQuestions as unknown) as Question[];

  return baseQuestions.map((q) => {
    if (overrides[q.id]) {
      return { ...q, ...overrides[q.id] };
    }
    return q;
  });
}

/**
 * 根据等级和题型筛选题目
 */
export function getQuestionsByFilter(
  level: GespLevel = 1,
  typeFilter: 'all' | QuestionType = 'all'
): Question[] {
  const all = getAllQuestions();
  return all.filter((q) => {
    const matchLevel = q.level === level;
    const matchType = typeFilter === 'all' || q.type === typeFilter;
    return matchLevel && matchType;
  });
}

/**
 * 根据 ID 获取单道题目
 */
export function getQuestionById(id: string): Question | undefined {
  const all = getAllQuestions();
  return all.find((q) => q.id === id);
}

/**
 * 获取 1~8 级考纲元信息
 */
export function getLevelsMeta(): LevelMeta[] {
  return syllabusData.levels as LevelMeta[];
}

/**
 * 【教师模式】在线手动修改题目，实时覆写并持久化在本地 localStorage
 */
export function updateQuestion(updated: Question): void {
  const overrides = getStorageItem<Record<string, Question>>(STORAGE_KEYS.OVERRIDES, {});
  overrides[updated.id] = updated;
  setStorageItem(STORAGE_KEYS.OVERRIDES, overrides);
}

/**
 * 重置单道题目回初始预置状态
 */
export function resetQuestion(id: string): void {
  const overrides = getStorageItem<Record<string, Question>>(STORAGE_KEYS.OVERRIDES, {});
  if (overrides[id]) {
    delete overrides[id];
    setStorageItem(STORAGE_KEYS.OVERRIDES, overrides);
  }
}

/**
 * 重置所有题目覆写
 */
export function resetAllQuestions(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEYS.OVERRIDES);
}

/**
 * 导出当前最新的完整题库 JSON 文本（便于教师直接复制更新代码库）
 */
export function exportQuestionsJson(): string {
  const all = getAllQuestions();
  return JSON.stringify(all, null, 2);
}

/**
 * 获取错题本列表
 */
export function getMistakeRecords(): MistakeRecord[] {
  return getStorageItem<MistakeRecord[]>(STORAGE_KEYS.MISTAKES, []);
}

/**
 * 添加或更新错题记录
 */
export function saveMistakeRecord(record: MistakeRecord): void {
  const list = getMistakeRecords();
  const existingIndex = list.findIndex((m) => m.questionId === record.questionId);
  if (existingIndex >= 0) {
    list[existingIndex] = record;
  } else {
    list.unshift(record);
  }
  setStorageItem(STORAGE_KEYS.MISTAKES, list);
}

/**
 * 移除错题记录
 */
export function removeMistakeRecord(id: string): void {
  const list = getMistakeRecords();
  const filtered = list.filter((m) => m.id !== id && m.questionId !== id);
  setStorageItem(STORAGE_KEYS.MISTAKES, filtered);
}

/**
 * 判断某题是否在错题本中
 */
export function isQuestionInMistakes(questionId: string): boolean {
  const list = getMistakeRecords();
  return list.some((m) => m.questionId === questionId);
}

export interface UserProgressData {
  answer?: string;
  code?: string;
  symptoms?: string[];
  passed?: boolean;
  updatedAt: string;
}

/**
 * 获取做题记录
 */
export function getUserProgress(questionId: string): UserProgressData | undefined {
  const progressMap = getStorageItem<Record<string, UserProgressData>>(STORAGE_KEYS.PROGRESS, {});
  return progressMap[questionId];
}

/**
 * 保存做题记录
 */
export function saveUserProgress(
  questionId: string,
  data: Partial<UserProgressData>
): void {
  const progressMap = getStorageItem<Record<string, UserProgressData>>(STORAGE_KEYS.PROGRESS, {});
  progressMap[questionId] = {
    ...progressMap[questionId],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  setStorageItem(STORAGE_KEYS.PROGRESS, progressMap);
}
