'use client';

import React from 'react';
import { MistakeRecord } from '@/types/question';
import { X, BookOpen, Trash2, ArrowUpRight, Calendar, AlertCircle } from 'lucide-react';

interface MistakeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mistakes: MistakeRecord[];
  onSelectQuestion: (questionId: string) => void;
  onRemoveMistake: (id: string) => void;
}

export const MistakeDrawer: React.FC<MistakeDrawerProps> = ({
  isOpen,
  onClose,
  mistakes,
  onSelectQuestion,
  onRemoveMistake,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* 抽屉头部 */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  我的 GESP 错题本
                </h3>
                <p className="text-xs text-slate-500">
                  共收藏 {mistakes.length} 道错因诊断记录
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 错题列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mistakes.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  错题本空空如也
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  在做错题目或完成 AI 找茬诊断后，点击右侧的“加入错题本”即可沉淀在此反复复习。
                </p>
              </div>
            ) : (
              mistakes.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                        C++ {record.level} 级
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700">
                        {record.type === 'single'
                          ? '单选'
                          : record.type === 'judge'
                          ? '判断'
                          : '编程'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                    {record.questionTitle}
                  </h4>

                  {/* 错因简述快照 */}
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-900 space-y-1">
                    <div className="font-semibold flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      <span>当时错因定位：</span>
                    </div>
                    <div className="text-[11px] leading-relaxed line-clamp-2">
                      {record.diagnosis.errorAnalysis.summary}
                    </div>
                  </div>

                  {/* 操作区 */}
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onRemoveMistake(record.id)}
                      className="text-slate-400 hover:text-rose-600 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>移除</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectQuestion(record.questionId);
                        onClose();
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-0.5"
                    >
                      <span>前往重新订正</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
