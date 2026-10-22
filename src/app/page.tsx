'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GespLevel, OptionKey, Question, QuestionType, DiagnoseResponse } from '@/types/question';
import {
  getQuestionsByFilter,
  getLevelsMeta,
  getMistakeRecords,
  saveMistakeRecord,
  removeMistakeRecord,
  isQuestionInMistakes,
  getUserProgress,
  saveUserProgress,
  updateQuestion,
  resetQuestion,
} from '@/lib/questionService';
import { Header } from '@/components/Header';
import { QuestionNav } from '@/components/QuestionNav';
import { SingleChoiceTemplate } from '@/components/templates/SingleChoiceTemplate';
import { JudgeTemplate } from '@/components/templates/JudgeTemplate';
import { CodingTemplate } from '@/components/templates/CodingTemplate';
import { DiagnosisCard } from '@/components/DiagnosisCard';
import { QuestionEditorModal } from '@/components/QuestionEditorModal';
import { MistakeDrawer } from '@/components/MistakeDrawer';
import { ExportModal } from '@/components/ExportModal';

const defaultQuestions = getQuestionsByFilter(1, 'all');

export default function Home() {
  const [currentLevel, setCurrentLevel] = useState<GespLevel>(1);
  const [currentType, setCurrentType] = useState<'all' | QuestionType>('all');
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(defaultQuestions[0]?.id || '');
  const [diagnosisMap, setDiagnosisMap] = useState<Record<string, DiagnoseResponse>>({});
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [mistakeRecords, setMistakeRecords] = useState(getMistakeRecords());
  const [isMistakesOpen, setIsMistakesOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [passedSet, setPassedSet] = useState<Set<string>>(new Set());

  const levelsMeta = useMemo(() => getLevelsMeta(), []);

  // 刷新题目列表
  const refreshQuestions = useCallback(() => {
    const list = getQuestionsByFilter(currentLevel, currentType);
    setQuestions(list);
    if (list.length > 0 && (!activeQuestionId || !list.some((q) => q.id === activeQuestionId))) {
      setActiveQuestionId(list[0].id);
    }
  }, [currentLevel, currentType, activeQuestionId]);

  useEffect(() => {
    refreshQuestions();
  }, [refreshQuestions]);

  // 同步错题与答对状态
  useEffect(() => {
    const records = getMistakeRecords();
    setMistakeRecords(records);

    // 检查答对题目
    const passed = new Set<string>();
    questions.forEach((q) => {
      const prog = getUserProgress(q.id);
      if (prog && prog.passed) {
        passed.add(q.id);
      }
    });
    setPassedSet(passed);
  }, [questions]);

  const activeQuestion = useMemo(() => {
    return questions.find((q) => q.id === activeQuestionId) || questions[0];
  }, [questions, activeQuestionId]);

  const mistakeIds = useMemo(() => {
    return new Set(mistakeRecords.map((m) => m.questionId));
  }, [mistakeRecords]);

  // 客观题保存进度
  const handleSaveObjectiveProgress = (ans: OptionKey) => {
    if (!activeQuestion) return;
    const isPassed = ans === activeQuestion.correctAnswer;
    saveUserProgress(activeQuestion.id, {
      answer: ans,
      passed: isPassed,
    });

    if (isPassed) {
      setPassedSet((prev) => new Set(prev).add(activeQuestion.id));
      // 答对了自动从错题本移出（如果存在）
      removeMistakeRecord(activeQuestion.id);
      setMistakeRecords(getMistakeRecords());
    }
  };

  // 编程题保存代码与现象
  const handleSaveCodingProgress = (code: string, symptoms: string[]) => {
    if (!activeQuestion) return;
    saveUserProgress(activeQuestion.id, {
      code,
      symptoms,
      passed: false,
    });
  };

  // 发起 AI 诊断请求
  const handleRequestDiagnose = async (userAnswerOrCode: string, userThoughtOrSymptoms: string | string[]) => {
    if (!activeQuestion) return;

    setIsDiagnosing(true);
    try {
      const isCoding = activeQuestion.type === 'coding';
      const payload = {
        questionId: activeQuestion.id,
        questionType: activeQuestion.type,
        level: activeQuestion.level,
        title: activeQuestion.title,
        description: activeQuestion.description,
        codeSnippet: activeQuestion.codeSnippet,
        basicExplanation: activeQuestion.basicExplanation,
        knowledgePoints: activeQuestion.knowledgePoints,
        commonPitfalls: activeQuestion.commonPitfalls,
        options: activeQuestion.options,
        correctAnswer: activeQuestion.correctAnswer,
        timeLimit: activeQuestion.timeLimit,
        memoryLimit: activeQuestion.memoryLimit,
        inputFormat: activeQuestion.inputFormat,
        outputFormat: activeQuestion.outputFormat,
        samples: activeQuestion.samples,
        dataRange: activeQuestion.dataRange,
        referenceCode: activeQuestion.referenceCode,
        ...(isCoding
          ? {
              userCode: userAnswerOrCode,
              errorSymptoms: Array.isArray(userThoughtOrSymptoms)
                ? userThoughtOrSymptoms
                : [userThoughtOrSymptoms],
            }
          : {
              userAnswer: userAnswerOrCode,
              userThought: typeof userThoughtOrSymptoms === 'string' ? userThoughtOrSymptoms : '',
            }),
      };

      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`诊断服务异常 (${res.status})`);
      }

      const diagnosisData: DiagnoseResponse = await res.json();
      setDiagnosisMap((prev) => ({ ...prev, [activeQuestion.id]: diagnosisData }));

      // 自动保存至错题本
      saveMistakeRecord({
        id: `mistake-${activeQuestion.id}-${Date.now()}`,
        questionId: activeQuestion.id,
        questionTitle: activeQuestion.title,
        level: activeQuestion.level,
        type: activeQuestion.type,
        createdAt: new Date().toISOString(),
        userSubmission: userAnswerOrCode,
        userThoughtOrSymptoms: Array.isArray(userThoughtOrSymptoms)
          ? userThoughtOrSymptoms.join(', ')
          : userThoughtOrSymptoms,
        diagnosis: diagnosisData,
      });
      setMistakeRecords(getMistakeRecords());
    } catch (err) {
      console.error('诊断请求失败:', err);
      alert('AI 诊断服务请求失败，请检查网络或稍后重试。');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // 收藏 / 移出错题本切换
  const handleToggleMistake = () => {
    if (!activeQuestion) return;
    const currentDiag = diagnosisMap[activeQuestion.id];
    if (isQuestionInMistakes(activeQuestion.id)) {
      removeMistakeRecord(activeQuestion.id);
    } else if (currentDiag) {
      const prog = getUserProgress(activeQuestion.id);
      saveMistakeRecord({
        id: `mistake-${activeQuestion.id}-${Date.now()}`,
        questionId: activeQuestion.id,
        questionTitle: activeQuestion.title,
        level: activeQuestion.level,
        type: activeQuestion.type,
        createdAt: new Date().toISOString(),
        userSubmission: prog?.answer || prog?.code || '用户作答',
        diagnosis: currentDiag,
      });
    }
    setMistakeRecords(getMistakeRecords());
  };

  // 教师保存题目修改
  const handleSaveQuestion = (updated: Question) => {
    updateQuestion(updated);
    refreshQuestions();
  };

  // 教师重置题目
  const handleResetQuestion = (id: string) => {
    resetQuestion(id);
    refreshQuestions();
  };

  const activeProgress = activeQuestion ? getUserProgress(activeQuestion.id) : undefined;
  const currentDiagnosis = activeQuestion ? diagnosisMap[activeQuestion.id] || null : null;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* 顶部主导航 */}
      <Header
        currentLevel={currentLevel}
        onSelectLevel={setCurrentLevel}
        levelsMeta={levelsMeta}
        currentType={currentType}
        onSelectType={setCurrentType}
        mistakeCount={mistakeRecords.length}
        onOpenMistakes={() => setIsMistakesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* 主体工作区 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 题目快捷选择横条 */}
        <QuestionNav
          questions={questions}
          activeQuestionId={activeQuestionId}
          onSelectQuestion={setActiveQuestionId}
          mistakeIds={mistakeIds}
          passedIds={passedSet}
        />

        {/* 左右分栏核心交互区 */}
        {activeQuestion ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 左栏：规范化真题模板作答区 (占 7 列) */}
            <section className="lg:col-span-7 space-y-4">
              {activeQuestion.type === 'single' && (
                <SingleChoiceTemplate
                  key={activeQuestion.id}
                  question={activeQuestion}
                  userAnswer={activeProgress?.answer as OptionKey}
                  onSaveProgress={handleSaveObjectiveProgress}
                  onRequestDiagnose={handleRequestDiagnose}
                  onEditQuestion={() => setEditingQuestion(activeQuestion)}
                  isDiagnosing={isDiagnosing}
                />
              )}

              {activeQuestion.type === 'judge' && (
                <JudgeTemplate
                  key={activeQuestion.id}
                  question={activeQuestion}
                  userAnswer={activeProgress?.answer as OptionKey}
                  onSaveProgress={handleSaveObjectiveProgress}
                  onRequestDiagnose={handleRequestDiagnose}
                  onEditQuestion={() => setEditingQuestion(activeQuestion)}
                  isDiagnosing={isDiagnosing}
                />
              )}

              {activeQuestion.type === 'coding' && (
                <CodingTemplate
                  key={activeQuestion.id}
                  question={activeQuestion}
                  savedCode={activeProgress?.code}
                  savedSymptoms={activeProgress?.symptoms}
                  onSaveProgress={handleSaveCodingProgress}
                  onRequestDiagnose={handleRequestDiagnose}
                  onEditQuestion={() => setEditingQuestion(activeQuestion)}
                  isDiagnosing={isDiagnosing}
                />
              )}
            </section>

            {/* 右栏：AI 启发式诊断与可视化讲解动画卡片 (占 5 列) */}
            <section className="lg:col-span-5 sticky top-36 space-y-4">
              <DiagnosisCard
                question={activeQuestion}
                diagnosis={currentDiagnosis}
                isLoading={isDiagnosing}
                isInMistakes={isQuestionInMistakes(activeQuestion.id)}
                onToggleMistake={handleToggleMistake}
              />
            </section>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
            暂无匹配的题目
          </div>
        )}
      </main>

      {/* 教师微调编辑模态框 */}
      {editingQuestion && (
        <QuestionEditorModal
          question={editingQuestion}
          isOpen={Boolean(editingQuestion)}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveQuestion}
          onReset={handleResetQuestion}
        />
      )}

      {/* 错题本抽屉 */}
      <MistakeDrawer
        isOpen={isMistakesOpen}
        onClose={() => setIsMistakesOpen(false)}
        mistakes={mistakeRecords}
        onSelectQuestion={(qid) => setActiveQuestionId(qid)}
        onRemoveMistake={(id) => {
          removeMistakeRecord(id);
          setMistakeRecords(getMistakeRecords());
        }}
      />

      {/* 题库导出与数据管理模态框 */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onReload={refreshQuestions}
      />
    </div>
  );
}
