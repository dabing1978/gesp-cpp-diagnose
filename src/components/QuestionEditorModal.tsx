'use client';

import React, { useState } from 'react';
import { OptionKey, Question } from '@/types/question';
import { X, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface QuestionEditorModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Question) => void;
  onReset: (id: string) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  question,
  isOpen,
  onClose,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<Question>({ ...question });

  if (!isOpen) return null;

  const handleChange = (
    field: keyof Question,
    value: unknown
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (key: OptionKey, text: string) => {
    const updatedOptions = (formData.options || []).map((o) =>
      o.key === key ? { ...o, text } : o
    );
    setFormData((prev) => ({ ...prev, options: updatedOptions }));
  };

  const handleSampleChange = (
    index: number,
    field: 'input' | 'output' | 'explanation',
    value: string
  ) => {
    const updatedSamples = [...(formData.samples || [])];
    updatedSamples[index] = { ...updatedSamples[index], [field]: value };
    setFormData((prev) => ({ ...prev, samples: updatedSamples }));
  };

  const handleAddSample = () => {
    const current = formData.samples || [];
    setFormData((prev) => ({
      ...prev,
      samples: [...current, { input: '', output: '', explanation: '' }],
    }));
  };

  const handleRemoveSample = (index: number) => {
    const updated = (formData.samples || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, samples: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('确认将此题恢复为最初预置的内容吗？您的自定义修改将被清除。')) {
      onReset(formData.id);
      onClose();
    }
  };

  const isCoding = formData.type === 'coding';
  const isJudge = formData.type === 'judge';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal 头部 */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold">
              ✏️ 教师微调模式：编辑真题内容
            </span>
            <span className="text-xs text-slate-400">({formData.id})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal 主表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">题号标识</label>
              <input
                type="text"
                value={formData.questionNo || ''}
                onChange={(e) => handleChange('questionNo', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-700">题目标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">真题分值 (分)</label>
              <input
                type="number"
                value={formData.score}
                onChange={(e) => handleChange('score', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-700">年份与出处标签</label>
              <input
                type="text"
                value={formData.yearPrompt || ''}
                onChange={(e) => handleChange('yearPrompt', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* 题干描述 */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">题干描述 (支持 Markdown)</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-xs"
              required
            />
          </div>

          {/* 题干附带代码 (针对客观题或函数题) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">题干代码片段（C++）</label>
            <textarea
              rows={4}
              value={formData.codeSnippet || ''}
              onChange={(e) => handleChange('codeSnippet', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-xs text-emerald-800 bg-slate-50"
              placeholder="// 可选：输入题目给出的 C++ 代码"
            />
          </div>

          {/* 客观题专属：选项与标准答案 */}
          {!isCoding && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800">
                {isJudge ? '判断题选项与答案' : '单选题选项与答案'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.options?.map((opt) => (
                  <div key={opt.key} className="space-y-1">
                    <label className="font-bold text-slate-600">选项 [{opt.key}] 内容</label>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(opt.key, e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700">标准正确答案 Key</label>
                <select
                  value={formData.correctAnswer}
                  onChange={(e) => handleChange('correctAnswer', e.target.value as OptionKey)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  {isJudge ? (
                    <>
                      <option value="T">T (对/正确)</option>
                      <option value="F">F (错/错误)</option>
                    </>
                  ) : (
                    <>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* 编程题专属：时空限制与样例 */}
          {isCoding && (
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-4">
              <div className="font-bold text-purple-900">编程题专属限制与测试样例</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">时间限制</label>
                  <input
                    type="text"
                    value={formData.timeLimit || '1.0 秒'}
                    onChange={(e) => handleChange('timeLimit', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">内存限制</label>
                  <input
                    type="text"
                    value={formData.memoryLimit || '128.0 MB'}
                    onChange={(e) => handleChange('memoryLimit', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">输入格式说明</label>
                  <textarea
                    rows={2}
                    value={formData.inputFormat || ''}
                    onChange={(e) => handleChange('inputFormat', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">输出格式说明</label>
                  <textarea
                    rows={2}
                    value={formData.outputFormat || ''}
                    onChange={(e) => handleChange('outputFormat', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* 样例列表 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">测试样例组</label>
                  <button
                    type="button"
                    onClick={handleAddSample}
                    className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加样例</span>
                  </button>
                </div>

                {formData.samples?.map((sample, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-700">
                      <span>样例 #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSample(idx)}
                        className="text-rose-500 hover:text-rose-700 flex items-center space-x-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>删除</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="输入数据"
                        value={sample.input}
                        onChange={(e) => handleSampleChange(idx, 'input', e.target.value)}
                        className="w-full px-2.5 py-1 font-mono text-xs border rounded"
                      />
                      <input
                        type="text"
                        placeholder="输出数据"
                        value={sample.output}
                        onChange={(e) => handleSampleChange(idx, 'output', e.target.value)}
                        className="w-full px-2.5 py-1 font-mono text-xs border rounded"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="样例解释说明 (可选)"
                      value={sample.explanation || ''}
                      onChange={(e) => handleSampleChange(idx, 'explanation', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border rounded bg-slate-50"
                    />
                  </div>
                ))}
              </div>

              {/* 满分参考代码 */}
              <div className="space-y-1">
                <label className="font-bold text-emerald-800">
                  官方标准满分参考代码（标程，AI 找茬判卷金标）
                </label>
                <textarea
                  rows={6}
                  value={formData.referenceCode || ''}
                  onChange={(e) => handleChange('referenceCode', e.target.value)}
                  className="w-full p-2.5 border border-emerald-300 rounded-lg font-mono text-xs bg-slate-900 text-emerald-300"
                />
              </div>
            </div>
          )}

          {/* 教师基础解析 */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">教师官方基础解析（AI 提示对标依据）</label>
            <textarea
              rows={3}
              value={formData.basicExplanation || ''}
              onChange={(e) => handleChange('basicExplanation', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* 讲解动画配置 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">默认讲解动画视频 URL</label>
              <input
                type="text"
                value={formData.animationUrl || ''}
                onChange={(e) => handleChange('animationUrl', e.target.value)}
                placeholder="/videos/example.mp4"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">讲解动画核心推演简介</label>
              <input
                type="text"
                value={formData.animationDesc || ''}
                onChange={(e) => handleChange('animationDesc', e.target.value)}
                placeholder="说明该动画演示的算法流程..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* 底部按钮栏 */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 font-semibold hover:bg-rose-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>恢复初始默认</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>保存并即时生效</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
