'use client';

import React, { useState } from 'react';
import { OptionKey, Question } from '@/types/question';
import { CheckCircle, XCircle, Bot, Copy, Check, Edit3, HelpCircle } from 'lucide-react';

interface JudgeTemplateProps {
  question: Question;
  userAnswer?: OptionKey;
  onSaveProgress: (ans: OptionKey) => void;
  onRequestDiagnose: (userAnswer: OptionKey, userThought: string) => void;
  onEditQuestion: () => void;
  isDiagnosing: boolean;
}

export const JudgeTemplate: React.FC<JudgeTemplateProps> = ({
  question,
  userAnswer: initialAnswer,
  onSaveProgress,
  onRequestDiagnose,
  onEditQuestion,
  isDiagnosing,
}) => {
  const [selectedKey, setSelectedKey] = useState<OptionKey | undefined>(initialAnswer);
  const [submitted, setSubmitted] = useState<boolean>(Boolean(initialAnswer));
  const [userThought, setUserThought] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const isCorrect = submitted && selectedKey === question.correctAnswer;
  const isWrong = submitted && selectedKey !== question.correctAnswer;

  const handleCopyCode = () => {
    if (question.codeSnippet) {
      navigator.clipboard.writeText(question.codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSubmit = () => {
    if (!selectedKey) return;
    setSubmitted(true);
    onSaveProgress(selectedKey);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 规范化题头 */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-md">
            {question.questionNo || '判断题'}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-md">
            {question.score} 分
          </span>
          <span className="text-xs text-slate-500">{question.yearPrompt}</span>
        </div>

        <button
          onClick={onEditQuestion}
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
          title="教师模式：修改题干、分值或解析"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>编辑此题</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* 题目标题与描述 */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">{question.title}</h2>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {question.description}
          </div>
        </div>

        {/* C++ 代码片段（若有） */}
        {question.codeSnippet && (
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs text-slate-400">
              <span className="font-mono">C++11 代码片段</span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1 text-slate-300 hover:text-white"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '已复制' : '复制代码'}</span>
              </button>
            </div>
            <pre className="p-4 font-mono text-sm leading-relaxed overflow-x-auto text-emerald-300">
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* 判断题选项网格 (T: 对 / F: 错) */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            你的判断是：
          </label>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { key: 'T' as OptionKey, text: '对（正确）', icon: '✓' },
              { key: 'F' as OptionKey, text: '错（错误）', icon: '✗' },
            ].map((opt) => {
              const isSelected = selectedKey === opt.key;
              let cardStyle = 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20';

              if (submitted) {
                if (opt.key === question.correctAnswer) {
                  cardStyle = 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-semibold ring-2 ring-emerald-500';
                } else if (isSelected && !isCorrect) {
                  cardStyle = 'border-rose-500 bg-rose-50/60 text-rose-900 font-semibold ring-2 ring-rose-500';
                } else {
                  cardStyle = 'border-slate-200 opacity-50';
                }
              } else if (isSelected) {
                cardStyle = 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500';
              }

              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelectedKey(opt.key)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer disabled:cursor-default transition-all ${cardStyle}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {opt.icon}
                  </span>
                  <span className="text-sm font-medium">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 提交作答按钮 */}
        {!submitted && (
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={!selectedKey}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              提交判断
            </button>
          </div>
        )}

        {/* 提交后比对与基础解析展示 */}
        {submitted && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* 答案对错状态提示 */}
            <div className={`p-4 rounded-xl flex items-start space-x-3 ${
              isCorrect ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {isCorrect
                    ? '判断正确！概念掌握很扎实！'
                    : `判断错误。你的选择是 [${selectedKey === 'T' ? '正确' : '错误'}]，标准答案是 [${question.correctAnswer === 'T' ? '正确' : '错误'}]。`}
                </div>
                <div className="text-xs text-slate-600">
                  {isCorrect ? '可结合右侧动画进一步理解编译器词法底层原理。' : '请查看教师解析，或启动 AI 深度启发式诊断。'}
                </div>
              </div>
            </div>

            {/* 教师基础解析 */}
            {question.basicExplanation && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>教师官方基础解析：</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {question.basicExplanation}
                </div>
              </div>
            )}

            {/* 若判断错误，浮现 AI 找茬诊断触发入口 */}
            {isWrong && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm font-bold text-indigo-900">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    <span>AI 启发式错题深度找茬</span>
                  </div>
                  <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-full">
                    打破概念误区 · 启发思考
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 block">
                    你当时为什么会这么判断？（可选填，帮助 AI 指出你的认知盲区）：
                  </label>
                  <input
                    type="text"
                    value={userThought}
                    onChange={(e) => setUserThought(e.target.value)}
                    placeholder="例如：我以为包含字母和数字就可以，不知道数字不能放在开头..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <button
                  onClick={() => selectedKey && onRequestDiagnose(selectedKey, userThought)}
                  disabled={isDiagnosing}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-sm flex items-center justify-center space-x-2 transition-all"
                >
                  <Bot className="w-4 h-4" />
                  <span>{isDiagnosing ? 'AI 正在深度找茬分析中...' : '启动 AI 启发式错因诊断'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
