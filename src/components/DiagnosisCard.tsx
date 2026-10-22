'use client';

import React, { useState, useRef } from 'react';
import { DiagnoseResponse, Question } from '@/types/question';
import {
  Sparkles,
  Bug,
  Lightbulb,
  Video,
  Upload,
  BookMarked,
  CheckCircle2,
  FileCode,
  Tag,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

interface DiagnosisCardProps {
  question: Question;
  diagnosis: DiagnoseResponse | null;
  isLoading: boolean;
  isInMistakes: boolean;
  onToggleMistake: () => void;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({
  question,
  diagnosis,
  isLoading,
  isInMistakes,
  onToggleMistake,
}) => {
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(true);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [localVideoName, setLocalVideoName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理教师模式上传本地 MP4/WebM 视频预览
  const handleLocalVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setLocalVideoUrl(objectUrl);
      setLocalVideoName(file.name);
      setIsVideoOpen(true);
    }
  };

  const currentVideoSrc = localVideoUrl || question.animationUrl;

  // 1. 加载中状态
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-5 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-200"></div>
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-indigo-200 rounded w-1/3"></div>
            <div className="h-3 bg-indigo-100 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-20 bg-slate-100 rounded-xl"></div>
        <div className="h-32 bg-slate-100 rounded-xl"></div>
        <div className="h-44 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  // 2. 未触发诊断时的空状态引导
  if (!diagnosis) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800">
            等待作答与 AI 诊断
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            在左侧提交客观题答案或点击“请 AI 老师帮我找茬”，AI 将在这里输出概念辨析、行级代码漏洞剖析、Hack 测试数据与算法讲解动画。
          </p>
        </div>

        {/* 提前预览本题预设动画或上传本地动画 */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setIsVideoOpen(!isVideoOpen)}
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <Video className="w-3.5 h-3.5 text-indigo-500" />
            <span>提前预览本题算法讲解动画</span>
          </button>
        </div>

        {isVideoOpen && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900 text-left space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center space-x-1">
                <Video className="w-4 h-4 text-emerald-400" />
                <span>可视化推演动画</span>
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <Upload className="w-3 h-3" />
                <span>教师模式：选择本地视频</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={handleLocalVideoUpload}
              />
            </div>
            {currentVideoSrc ? (
              <video
                controls
                src={currentVideoSrc}
                className="w-full rounded-lg bg-black aspect-video max-h-60"
              >
                您的浏览器不支持视频播放。
              </video>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-lg">
                暂未预设动画视频，教师可通过右上角按钮直接加载本地 MP4 进行课堂推演。
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. 结构化诊断卡片展示
  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden space-y-5 p-6">
      {/* 头部标题与加入错题本 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                AI 启发式错因诊断报告
              </h3>
              {diagnosis.isFallbackMock && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  离线启发引擎
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              精准定位盲区 · 引导自行修改 · 严禁直接输出答案代码
            </p>
          </div>
        </div>

        <button
          onClick={onToggleMistake}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            isInMistakes
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          {isInMistakes ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
              <span>已收入错题本</span>
            </>
          ) : (
            <>
              <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
              <span>加入错题本</span>
            </>
          )}
        </button>
      </div>

      {/* 1. 【错因精准定位 / 代码找茬】 */}
      <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
        <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold uppercase tracking-wider">
          <Bug className="w-4 h-4 text-rose-600" />
          <span>错因精准定位 · 代码找茬</span>
        </div>
        <div className="font-semibold text-sm text-rose-950">
          {diagnosis.errorAnalysis.summary}
        </div>
        <ul className="text-xs text-rose-900 space-y-1 list-disc list-inside">
          {diagnosis.errorAnalysis.details.map((detail, idx) => (
            <li key={idx} className="leading-relaxed">
              {detail}
            </li>
          ))}
        </ul>
      </div>

      {/* 2. 【启发式修改提示与 Hack 测试数据】 */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
        <div className="flex items-center space-x-2 text-blue-800 text-xs font-bold uppercase tracking-wider">
          <Lightbulb className="w-4 h-4 text-blue-600" />
          <span>启发式思考引导（分步修改）</span>
        </div>
        <div className="space-y-2">
          {diagnosis.heuristicHints.map((hint, idx) => (
            <div
              key={idx}
              className="text-xs text-blue-950 flex items-start space-x-2 bg-white/70 p-2.5 rounded-lg border border-blue-100 leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{hint}</span>
            </div>
          ))}
        </div>

        {/* Hack 数据卡片 */}
        {diagnosis.hackData && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>专项 Hack 破绽数据（检验当前代码）</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded border border-amber-100 font-mono">
                <span className="text-slate-500 block text-[10px]">测试输入:</span>
                <span className="text-slate-900 font-bold">
                  {diagnosis.hackData.input}
                </span>
              </div>
              <div className="p-2 bg-white rounded border border-amber-100 font-mono">
                <span className="text-slate-500 block text-[10px]">预期正确输出:</span>
                <span className="text-emerald-700 font-bold">
                  {diagnosis.hackData.expectedOutput}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-amber-800">
              <span className="font-semibold">错误表现排查：</span>
              {diagnosis.hackData.actualBehavior}
            </div>
          </div>
        )}
      </div>

      {/* 3. 【可视化讲解动画演示（核心组件）】 */}
      <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">
              可视化讲解动画演示
            </span>
            {localVideoName && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                本地: {localVideoName}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors"
              title="支持选择本地 MP4/WebM 实时加载播放（无需后端存储）"
            >
              <Upload className="w-3 h-3 text-blue-400" />
              <span>教师模式：上传本地动画</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={handleLocalVideoUpload}
            />

            <button
              onClick={() => setIsVideoOpen(!isVideoOpen)}
              className="p-1 text-slate-400 hover:text-white"
            >
              {isVideoOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {isVideoOpen && (
          <div className="p-4 space-y-3">
            {currentVideoSrc ? (
              <video
                key={currentVideoSrc}
                controls
                src={currentVideoSrc}
                className="w-full rounded-lg bg-black aspect-video max-h-72"
              >
                您的浏览器不支持 HTML5 视频播放。
              </video>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-lg">
                该题配套推演视频制作中。老师可点击上方“上传本地动画”直接预览本地录屏或动画课件。
              </div>
            )}

            {(question.animationDesc || localVideoName) && (
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <span className="text-emerald-400 font-semibold mr-1">
                  推演重点：
                </span>
                {localVideoName
                  ? `当前已切换播放本地课件 [${localVideoName}] 进行课堂演示。`
                  : question.animationDesc}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 4. 【官方考纲考点溯源】 */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold">
          <Tag className="w-3.5 h-3.5 text-indigo-500" />
          <span>考纲溯源：</span>
          <span className="text-indigo-600 font-bold">
            {diagnosis.syllabusMapping.level}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {diagnosis.syllabusMapping.points.map((pt, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-700 border border-slate-200"
            >
              {pt}
            </span>
          ))}
        </div>
      </div>

      {/* 5. 【考场避坑小结】 */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center space-x-2 text-slate-800 text-xs font-bold uppercase tracking-wider">
          <FileCode className="w-4 h-4 text-amber-500" />
          <span>考场避坑要点精炼</span>
        </div>
        <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
          {diagnosis.pitfallSummary.map((pitfall, idx) => (
            <li key={idx} className="leading-relaxed">
              {pitfall}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
