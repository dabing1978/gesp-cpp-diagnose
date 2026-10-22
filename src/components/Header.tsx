'use client';

import React from 'react';
import { GespLevel, LevelMeta, QuestionType } from '@/types/question';
import { BookOpen, Sparkles, Download, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentLevel: GespLevel;
  onSelectLevel: (lvl: GespLevel) => void;
  levelsMeta: LevelMeta[];
  currentType: 'all' | QuestionType;
  onSelectType: (type: 'all' | QuestionType) => void;
  mistakeCount: number;
  onOpenMistakes: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLevel,
  onSelectLevel,
  levelsMeta,
  currentType,
  onSelectType,
  mistakeCount,
  onOpenMistakes,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 顶部主信息栏 */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  GESP C++ 真题在线自测与 AI 错题诊断
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  MVP v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                精准找茬 · 启发式引导 · 动画推演 · 严禁直接输出答案代码
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenExport}
              title="导出当前最新题库 JSON（含教师微调修改）"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">题库管理/导出</span>
            </button>

            <button
              onClick={onOpenMistakes}
              className="relative inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>我的错题本</span>
              {mistakeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                  {mistakeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 次级筛选栏：GESP 1~8 级紧凑选择器 + 题型过滤 */}
        <div className="py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* 等级选择器 */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-slate-500 font-medium whitespace-nowrap mr-1">
              考纲等级:
            </span>
            {levelsMeta.map((lm) => {
              const isActive = lm.level === currentLevel;
              const isAvailable = lm.available;

              if (isAvailable) {
                return (
                  <button
                    key={lm.level}
                    onClick={() => onSelectLevel(lm.level)}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>C++ {lm.level} 级</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  </button>
                );
              }

              return (
                <div
                  key={lm.level}
                  title={`${lm.name} - 考纲已录入，真题待上线`}
                  className="inline-flex items-center space-x-1 px-2 py-1 rounded-md font-normal bg-slate-50 text-slate-400 border border-dashed border-slate-200 cursor-not-allowed select-none"
                >
                  <span>{lm.level} 级</span>
                  <span className="text-[10px] text-slate-400 scale-90">待上线</span>
                </div>
              );
            })}
          </div>

          {/* 题型过滤标签 */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
            {(
              [
                { key: 'all', label: '全部题型' },
                { key: 'single', label: '单选题' },
                { key: 'judge', label: '判断题' },
                { key: 'coding', label: '编程题' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => onSelectType(t.key)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentType === t.key
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
