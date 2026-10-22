'use client';

import React from 'react';
import { Question } from '@/types/question';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface QuestionNavProps {
  questions: Question[];
  activeQuestionId: string;
  onSelectQuestion: (id: string) => void;
  mistakeIds: Set<string>;
  passedIds: Set<string>;
}

export const QuestionNav: React.FC<QuestionNavProps> = ({
  questions,
  activeQuestionId,
  onSelectQuestion,
  mistakeIds,
  passedIds,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1 mb-2 flex items-center justify-between">
        <span>当前题单 ({questions.length} 题)</span>
        <span className="text-[11px] font-normal text-slate-400">点击切换题目</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {questions.map((q) => {
          const isActive = q.id === activeQuestionId;
          const isPassed = passedIds.has(q.id);
          const isMistake = mistakeIds.has(q.id);

          let badgeColor = 'bg-slate-100 text-slate-600';
          if (q.type === 'single') badgeColor = 'bg-blue-100 text-blue-700';
          if (q.type === 'judge') badgeColor = 'bg-emerald-100 text-emerald-700';
          if (q.type === 'coding') badgeColor = 'bg-purple-100 text-purple-700';

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(q.id)}
              className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isActive
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                  {q.type === 'single' ? '单选' : q.type === 'judge' ? '判断' : '编程'}
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  {q.score}分
                </span>
              </div>

              <div className="text-xs font-bold text-slate-800 line-clamp-1">
                {q.questionNo || q.title}
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/80 text-[10px]">
                <span className="text-slate-500 line-clamp-1">{q.title}</span>
                {isPassed && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                )}
                {!isPassed && isMistake && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 ml-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
