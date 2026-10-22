'use client';

import React, { useState, useEffect } from 'react';
import { Question } from '@/types/question';
import {
  Clock,
  Cpu,
  Copy,
  Check,
  Edit3,
  Bot,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Code2,
  Lock,
} from 'lucide-react';

interface CodingTemplateProps {
  question: Question;
  savedCode?: string;
  savedSymptoms?: string[];
  onSaveProgress: (code: string, symptoms: string[]) => void;
  onRequestDiagnose: (userCode: string, symptoms: string[]) => void;
  onEditQuestion: () => void;
  isDiagnosing: boolean;
}

const COMMON_SYMPTOMS = [
  '样例未通过',
  '部分测试点 WA (答案错误)',
  '编译报错 (Compile Error)',
  '运行超时 TLE',
  '输出了多余文字提示',
  '死循环或结果为随机大数',
];

export const CodingTemplate: React.FC<CodingTemplateProps> = ({
  question,
  savedCode,
  savedSymptoms = [],
  onSaveProgress,
  onRequestDiagnose,
  onEditQuestion,
  isDiagnosing,
}) => {
  const [code, setCode] = useState<string>(
    savedCode || question.starterCode || '#include <iostream>\nusing namespace std;\n\nint main() {\n    // 在此编写你的代码\n    \n    return 0;\n}'
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(savedSymptoms);
  const [copiedIndex, setCopiedIndex] = useState<{ [key: string]: boolean }>({});
  const [showRefCodeConfirm, setShowRefCodeConfirm] = useState<boolean>(false);
  const [showRefCode, setShowRefCode] = useState<boolean>(false);

  useEffect(() => {
    if (savedCode) setCode(savedCode);
    if (savedSymptoms) setSelectedSymptoms(savedSymptoms);
  }, [question.id, savedCode, savedSymptoms]);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedIndex((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleResetStarter = () => {
    if (window.confirm('确认将代码重置回题目初始模板吗？当前编辑内容将丢失。')) {
      const initial = question.starterCode || '';
      setCode(initial);
      onSaveProgress(initial, selectedSymptoms);
    }
  };

  const toggleSymptom = (sym: string) => {
    const updated = selectedSymptoms.includes(sym)
      ? selectedSymptoms.filter((s) => s !== sym)
      : [...selectedSymptoms, sym];
    setSelectedSymptoms(updated);
    onSaveProgress(code, updated);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onSaveProgress(newCode, selectedSymptoms);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 规范化题头 */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-md">
            {question.questionNo || '编程题'}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-md">
            {question.score} 分
          </span>
          <span className="text-xs text-slate-500">{question.yearPrompt}</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* 时空限制徽章 */}
          <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
            <span className="inline-flex items-center space-x-1" title="运行时间上限">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{question.timeLimit || '1.0 秒'}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center space-x-1" title="运行内存上限">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>{question.memoryLimit || '128.0 MB'}</span>
            </span>
          </div>

          <button
            onClick={onEditQuestion}
            className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
            title="教师模式：修改题干、样例、时空限制或满分代码"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>编辑此题</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 题目描述 */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">{question.title}</h2>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {question.description}
          </div>
        </div>

        {/* 输入输出格式规范卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>输入格式</span>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              {question.inputFormat || '请按照题意标准输入。'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>输出格式</span>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              {question.outputFormat || '输出最终计算结果。'}
            </div>
          </div>
        </div>

        {/* 多组输入输出样例展示（支持独立一键复制） */}
        {question.samples && question.samples.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                输入输出测试样例
              </span>
              <span className="text-[11px] text-slate-400">
                支持输入/输出独立复制
              </span>
            </div>

            <div className="space-y-4">
              {question.samples.map((sample, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                >
                  <div className="px-4 py-1.5 bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-between">
                    <span>样例 #{idx + 1}</span>
                    {sample.explanation && (
                      <span className="text-[11px] font-normal text-slate-500">
                        含样例说明
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
                    {/* 样例输入 */}
                    <div className="p-3 space-y-1.5 bg-white">
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                        <span>输入 (stdin)</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(sample.input, `in-${idx}`)
                          }
                          className="hover:text-blue-600 flex items-center space-x-1"
                        >
                          {copiedIndex[`in-${idx}`] ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>
                            {copiedIndex[`in-${idx}`] ? '已复制' : '复制输入'}
                          </span>
                        </button>
                      </div>
                      <pre className="p-2 rounded bg-slate-100 font-mono text-slate-800 overflow-x-auto select-all">
                        {sample.input}
                      </pre>
                    </div>

                    {/* 样例输出 */}
                    <div className="p-3 space-y-1.5 bg-white">
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                        <span>输出 (stdout)</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(sample.output, `out-${idx}`)
                          }
                          className="hover:text-blue-600 flex items-center space-x-1"
                        >
                          {copiedIndex[`out-${idx}`] ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>
                            {copiedIndex[`out-${idx}`] ? '已复制' : '复制输出'}
                          </span>
                        </button>
                      </div>
                      <pre className="p-2 rounded bg-slate-100 font-mono text-slate-800 overflow-x-auto select-all">
                        {sample.output}
                      </pre>
                    </div>
                  </div>

                  {/* 样例解释 */}
                  {sample.explanation && (
                    <div className="px-4 py-2 bg-amber-50/50 border-t border-slate-200 text-xs text-amber-900 leading-relaxed">
                      <span className="font-semibold text-amber-800 mr-1.5">
                        样例解释:
                      </span>
                      {sample.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数据范围与提示 */}
        {question.dataRange && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-700 mr-1">数据范围：</span>
            {question.dataRange}
          </div>
        )}

        {/* 代码输入作答区 */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span>你的 C++ 代码（粘贴或在此编辑）：</span>
            </label>
            <button
              onClick={handleResetStarter}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center space-x-1"
              title="重置为初始模板"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置模板</span>
            </button>
          </div>

          <div className="relative rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shadow-xs">
            <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                <span className="ml-2 font-mono text-[11px] text-slate-400">
                  solution.cpp (C++11)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                按当前考纲请在 main 函数中实现
              </span>
            </div>

            <textarea
              value={code}
              onChange={handleCodeChange}
              rows={12}
              placeholder="// 在此粘贴你的 C++ 错误代码..."
              className="w-full p-4 font-mono text-xs sm:text-sm text-emerald-300 bg-slate-900 focus:outline-none resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>

        {/* 错误现象快捷标签勾选 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 block">
            错误现象（勾选帮助 AI 更有针对性地找茬，可选）：
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((sym) => {
              const active = selectedSymptoms.includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggleSymptom(sym)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-all ${
                    active
                      ? 'bg-rose-50 border-rose-400 text-rose-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>

        {/* 触发 AI 找茬主按钮 */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => onRequestDiagnose(code, selectedSymptoms)}
            disabled={isDiagnosing || !code.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all"
          >
            <Bot className="w-5 h-5" />
            <span>{isDiagnosing ? 'AI 正在分析找茬中...' : '请 AI 老师帮我找茬 (启动启发式诊断)'}</span>
          </button>

          {/* 受控查看教师满分参考代码折叠入口 */}
          {question.referenceCode && (
            <div className="relative">
              {!showRefCode ? (
                <button
                  type="button"
                  onClick={() => setShowRefCodeConfirm(true)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center space-x-1 underline decoration-dotted"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>教师/查看官方标准参考代码</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRefCode(false)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  收起官方参考代码
                </button>
              )}
            </div>
          )}
        </div>

        {/* 二次确认弹窗：防学生直接抄答案 */}
        {showRefCodeConfirm && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 text-xs text-amber-900">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm">学习建议提醒</div>
                <div>
                  GESP 核心考查独立解决问题的逻辑能力。我们强烈建议先根据 AI 启发提示和 Hack 测试数据自行修正代码。确认现在查看官方满分标程吗？
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowRefCode(true);
                  setShowRefCodeConfirm(false);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg"
              >
                确认查看
              </button>
              <button
                type="button"
                onClick={() => setShowRefCodeConfirm(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg"
              >
                我再想想
              </button>
            </div>
          </div>
        )}

        {/* 展开展示官方参考代码 */}
        {showRefCode && question.referenceCode && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>官方满分标准参考代码（C++11 一级考纲合规）：</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  question.referenceCode &&
                  handleCopyText(question.referenceCode, 'ref-code')
                }
                className="text-slate-500 hover:text-blue-600 flex items-center space-x-1 font-normal"
              >
                {copiedIndex['ref-code'] ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedIndex['ref-code'] ? '已复制' : '复制标程'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-emerald-300 font-mono text-xs overflow-x-auto">
              <code>{question.referenceCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
