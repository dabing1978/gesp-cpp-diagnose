'use client';

import React, { useState } from 'react';
import { X, Copy, Check, RotateCcw, Download } from 'lucide-react';
import { exportQuestionsJson, resetAllQuestions } from '@/lib/questionService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onReload,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const jsonStr = exportQuestionsJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gesp-questions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        '确认清除所有题目的自定义修改，完全恢复为项目内置初始题库吗？'
      )
    ) {
      resetAllQuestions();
      onReload();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">题库导出与数据管理</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          <p className="leading-relaxed">
            您在界面中通过【✏️ 编辑此题】所做的所有修改（错别字订正、标程更新、动画配置变更），均已安全保存在本地。您可以将最新题库 JSON 复制或下载，直接替换项目的 <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-indigo-600">src/data/questions.json</code>。
          </p>

          <div className="relative rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-emerald-400 text-xs max-h-80 overflow-y-auto">
            <pre>
              <code>{jsonStr}</code>
            </pre>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleResetAll}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 font-semibold hover:bg-rose-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>清空所有修改，恢复初始题库</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg font-medium"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已复制' : '复制 JSON'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>下载 JSON 文件</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
