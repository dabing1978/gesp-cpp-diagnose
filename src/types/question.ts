// GESP C++ 完整覆盖 1~8 级（MVP 阶段默认激活 1 级，2~8 级标记为待上线）
export type GespLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// 题型分类：单选题 ('single') | 判断题 ('judge') | 编程题 ('coding')
export type QuestionType = 'single' | 'judge' | 'coding';

// 客观题选项 Key：单选题 A/B/C/D，判断题 T(对/正确) / F(错/错误)
export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'T' | 'F';

export interface QuestionOption {
  key: OptionKey;
  text: string; // 如判断题展示为 "对（正确）" / "错（错误）"
}

export interface CodingSample {
  input: string;        // 样例输入（支持独立一键复制）
  output: string;       // 样例输出（支持独立一键复制）
  explanation?: string; // 样例解释（可选，支持 Markdown）
}

export interface Question {
  id: string;                           // 题目唯一标识，如 "gesp-l1-single-01"
  questionNo?: string;                  // 卷面题号，如 "第 1 题"
  title: string;                        // 题目标题
  level: GespLevel;                     // GESP 等级 (1 ~ 8)
  type: QuestionType;                   // 题型：'single' (单选) | 'judge' (判断) | 'coding' (编程)
  objectiveType?: 'single' | 'judge';   // 客观题子类型辅助标识
  score: number;                        // 题目分值：单选 2 分，判断 2 分，编程 25 分
  yearPrompt?: string;                  // 真题来源说明，如 "2024年3月 GESP C++ 一级真题"
  description: string;                  // 题干描述（支持 Markdown 文本）
  codeSnippet?: string;                 // 题干附带的 C++ 代码片段（常用于阅读程序题）

  // 客观题专属字段（单选题 & 判断题）
  options?: QuestionOption[];           // 单选为 A/B/C/D 四项，判断为 T/F 两项
  correctAnswer?: OptionKey;            // 标准答案：'A'|'B'|'C'|'D'|'T'|'F'
  basicExplanation?: string;            // 教师编写的基础解析（同时作为 AI 诊断的权威参考依据）

  // 编程题专属字段
  timeLimit?: string;                   // 时间限制，如 "1.0 秒"
  memoryLimit?: string;                 // 内存限制，如 "128.0 MB"
  inputFormat?: string;                 // 输入格式说明
  outputFormat?: string;                // 输出格式说明
  samples?: CodingSample[];             // 多组输入输出样例列表（含 explanation）
  dataRange?: string;                   // 数据范围与提示
  starterCode?: string;                 // 学生作答区初始模板代码（可选）
  referenceCode?: string;               // 官方满分标准参考代码（C++11 标准，作为 AI 找茬金标及前端受控查看）

  // AI 诊断辅助参考字段（发送给后端组装 Prompt）
  knowledgePoints: string[];            // 官方考纲知识点标签
  commonPitfalls: string[];             // 预设常见坑点参考，供 AI 优先比对

  // 可视化讲解动画字段
  animationUrl?: string;                // 默认静态视频路径，如 "/videos/gesp-l1-single-01.mp4"
  animationDesc?: string;               // 动画内容简介，说明本动画演示的核心推演过程
}

// POST /api/diagnose 请求体
export interface DiagnoseRequest {
  questionId: string;
  questionType: QuestionType;
  level: GespLevel;
  title: string;
  description: string;
  codeSnippet?: string;
  basicExplanation?: string;            // 教师提供的基础解析，供 AI 诊断对标参考
  knowledgePoints: string[];
  commonPitfalls: string[];

  // 客观题（单选/判断）用户作答信息
  options?: { key: string; text: string }[];
  correctAnswer?: string;
  userAnswer?: string;                  // 用户选错的选项，如 "B" 或 "F"
  userThought?: string;                 // 用户可选输入的当时错误想法

  // 编程题用户作答信息
  timeLimit?: string;
  memoryLimit?: string;
  inputFormat?: string;
  outputFormat?: string;
  samples?: CodingSample[];
  dataRange?: string;
  referenceCode?: string;               // 编程题满分参考代码（仅用于后端 AI 比对逻辑，严禁直接返回给学生）
  userCode?: string;                    // 用户粘贴的 C++ 代码
  errorSymptoms?: string[];             // 用户勾选的错误现象，如 ["编译报错", "样例未通过", "部分测试点 WA", "运行超时 TLE"]
}

// POST /api/diagnose 响应体
export interface DiagnoseResponse {
  errorAnalysis: {
    summary: string;                    // 一句话核心错因概括
    details: string[];                  // 具体错因定位（概念误区或代码行级/逻辑级问题分析）
  };
  heuristicHints: string[];             // 分步启发式修改思路（引导思考，不含完整答案代码，严禁超纲）
  hackData?: {                          // 编程题专属（客观题可提供反例小代码或极简验证条件）
    input: string;                      // 能让错误代码暴露问题的测试输入
    expectedOutput: string;             // 正确预期输出
    actualBehavior: string;             // 用户的代码在该数据下的错误表现说明
  };
  syllabusMapping: {
    level: string;                      // 如 "GESP C++ 一级"
    points: string[];                   // 关联考纲核心知识点
  };
  pitfallSummary: string[];             // 1~3 条考场避坑小结
  isFallbackMock?: boolean;             // 是否为未配置 API Key 时的本地智能兜底诊断
}

// 本地错题本单条记录（持久化于 localStorage）
export interface MistakeRecord {
  id: string;                           // 记录唯一 ID
  questionId: string;                   // 关联题目 ID
  questionTitle: string;
  level: GespLevel;
  type: QuestionType;
  createdAt: string;                    // 加入时间戳 ISO 字符串
  userSubmission: string;               // 用户当时的错误选项（A/B/C/D/T/F）或错误 C++ 代码
  userThoughtOrSymptoms?: string;       // 用户当时的错误想法或报错标签
  diagnosis: DiagnoseResponse;          // AI 诊断结果快照
}

// 等级导航元信息
export interface LevelMeta {
  level: GespLevel;
  name: string;
  available: boolean;                   // MVP 阶段 1 级为 true，2~8 级为 false（待上线）
  badgeText: string;
  coreSummary: string;
  forbiddenTopics: string[];            // 该级别严禁使用的超纲知识点（注入 AI 负面约束）
}
