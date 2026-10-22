import { NextRequest, NextResponse } from 'next/server';
import { DiagnoseRequest, DiagnoseResponse } from '@/types/question';
import syllabusData from '@/data/syllabus.json';

// 获取对应等级的考纲约束与红线
function getSyllabusConstraint(level: number) {
  const levelConfig = syllabusData.levels.find((l) => l.level === level);
  if (!levelConfig) return '';

  const allowed = levelConfig.allowedKnowledgeBlocks.map((b) => `• 允许使用：${b}`).join('\n');
  const forbidden = levelConfig.forbiddenTopics.map((f) => `❌ 严禁出现（超纲）：${f}`).join('\n');

  return `
【当前 GESP C++ 等级：${levelConfig.name}】
${allowed}

【绝对考纲红线（违者判为严重事故）】
${forbidden}
`;
}

// 组装发给 DeepSeek 的完整 System Prompt
function buildSystemPrompt(req: DiagnoseRequest): string {
  const syllabusInfo = getSyllabusConstraint(req.level);

  return `你是一位资深、极具启发性且严格遵循 CCF GESP 考纲标准的 C++ 竞赛教练。
你的职责是辅导中小学生进行错题诊断与代码找茬，引导学生独立理解并自己改对题目。

${syllabusInfo}

【核心诊断红线规则】
1. 【严禁泄露完整代码】：无论学生错得多离谱，在任何返回字段中【绝对严禁输出完整的满分 C++ 解决代码】！最多只能提供 1~2 行局部修改提示或语法伪代码思路，必须把改对代码的成就感留给学生。
2. 【严禁超纲引导】：诊断建议、修改提示与测试用例，必须严格锁死在「GESP C++ ${req.level} 级」范围内。对于一级题目，严禁提及或使用数组、自定义函数封装、字符串处理函数、指针、结构体或高级数学库函数！
3. 【权威对标基准】：教师在题库中已提供该题的【基础解析】与【标准参考代码】，请以此为标杆找茬。重点对比学生代码与标准实现的算法逻辑差异（如边界遗漏、类型溢出、累加器未初始化等）。
4. 【严格 JSON 输出】：必须输出合法的 JSON 对象，不包含任何 Markdown 代码块外的闲聊。

【输出 JSON 字段规范（必须严格匹配以下结构）】：
{
  "errorAnalysis": {
    "summary": "一句话概括核心错因（温和、切中要害）",
    "details": ["具体错因分析点 1", "具体错因分析点 2"]
  },
  "heuristicHints": [
    "第一步启发提示（检查哪个变量/语句，遵守考纲，不给整段代码）：...",
    "第二步启发提示：...",
    "第三步启发提示：..."
  ],
  "hackData": {
    "input": "一组能让错误代码暴露问题的测试小数据",
    "expectedOutput": "正确的预期输出",
    "actualBehavior": "学生代码在此输入下的具体错误表现（如结果为 0、死循环、遗漏边界）"
  },
  "syllabusMapping": {
    "level": "GESP C++ ${req.level}级",
    "points": ["核心考点 1", "核心考点 2"]
  },
  "pitfallSummary": [
    "考场避坑要点 1",
    "考场避坑要点 2"
  ]
}`;
}

// 组装学生作答上下文 User Prompt
function buildUserPrompt(req: DiagnoseRequest): string {
  const isCoding = req.questionType === 'coding';

  let prompt = `【题目信息】
- 题号/标题：${req.title}
- GESP 等级：C++ ${req.level} 级
- 题目描述：
${req.description}
`;

  if (req.codeSnippet) {
    prompt += `\n- 题目附带 C++ 代码：\n\`\`\`cpp\n${req.codeSnippet}\n\`\`\`\n`;
  }

  if (req.basicExplanation) {
    prompt += `\n- 教师官方基础解析（供你对标参考）：\n${req.basicExplanation}\n`;
  }

  if (isCoding) {
    if (req.timeLimit || req.memoryLimit) {
      prompt += `\n- 限制条件：时间 ${req.timeLimit || '1.0s'} / 内存 ${req.memoryLimit || '128MB'}\n`;
    }
    if (req.inputFormat) prompt += `- 输入格式：${req.inputFormat}\n`;
    if (req.outputFormat) prompt += `- 输出格式：${req.outputFormat}\n`;
    if (req.referenceCode) {
      prompt += `\n- 教师官方标准参考代码（标程，绝对不能直接返回给学生）：\n\`\`\`cpp\n${req.referenceCode}\n\`\`\`\n`;
    }
    prompt += `\n【学生提交的错误 C++ 代码】：\n\`\`\`cpp\n${req.userCode || '// 未输入代码'}\n\`\`\`\n`;
    if (req.errorSymptoms && req.errorSymptoms.length > 0) {
      prompt += `- 学生反馈的错误现象：${req.errorSymptoms.join('、')}\n`;
    }
  } else {
    // 单选或判断
    if (req.options) {
      prompt += `\n- 选项列表：\n${req.options.map((o) => `  [${o.key}] ${o.text}`).join('\n')}\n`;
    }
    prompt += `- 标准正确答案：${req.correctAnswer}\n`;
    prompt += `- 学生的错误选择：${req.userAnswer || '未作答'}\n`;
    if (req.userThought) {
      prompt += `- 学生当时的错误想法：${req.userThought}\n`;
    }
  }

  prompt += `\n请开始你的启发式找茬诊断，严格输出合法的 JSON 格式。`;
  return prompt;
}

// 智能离线兜底诊断（当未配置有效 API KEY 或网络异常时保障演练体验）
function generateFallbackDiagnosis(req: DiagnoseRequest): DiagnoseResponse {
  const isCoding = req.questionType === 'coding';

  if (!isCoding) {
    return {
      errorAnalysis: {
        summary: `你选择了选项 [${req.userAnswer || '其他'}]，核心问题在于对「${req.knowledgePoints[0] || '核心概念'}」的执行顺序或边界理解有偏差。`,
        details: [
          `本题标准答案为 [${req.correctAnswer}]。${req.basicExplanation || '请仔细比对运算符优先级与类型转换规则。'}`,
          req.userThought
            ? `针对你的思考「${req.userThought}」：在 C++ 中，此处的计算并不遵循纯数学习惯，而是受类型与语法规范制约。`
            : `注意题目中的常见坑点：${req.commonPitfalls[0] || '未注意语法规则的隐式约束。'}`,
        ],
      },
      heuristicHints: [
        `第 1 步：回顾 GESP C++ ${req.level} 级关于「${req.knowledgePoints[0] || '基础概念'}」的语法定义。`,
        `第 2 步：拿出草稿纸，在草稿纸上模拟 CPU 执行每一步变量在内存中的实时数值，不要心算跳步。`,
        `第 3 步：再次检查题目代码中的运算符，确认每一个操作数执行后产生的结果与类型。`,
      ],
      hackData: {
        input: '单选题推演验证条件',
        expectedOutput: `正确结果对应选项 [${req.correctAnswer}]`,
        actualBehavior: `错误推演路线会导致选出 [${req.userAnswer || '错误选项'}]`,
      },
      syllabusMapping: {
        level: `GESP C++ ${req.level}级`,
        points: req.knowledgePoints,
      },
      pitfallSummary: req.commonPitfalls.length > 0 ? req.commonPitfalls : ['注意运算符结合性与数据类型隐式转换'],
      isFallbackMock: true,
    };
  }

  // 编程题兜底找茬
  const code = req.userCode || '';
  const hasNoInit = !code.includes('= 0') && (code.includes('sum') || code.includes('total') || code.includes('oddSum'));
  const hasBoundaryIssue = code.includes('<') && !code.includes('<=');

  const details: string[] = [];
  if (hasNoInit) {
    details.push('累加变量未初始化为 0：局部变量若未显式赋初始值，在 C++ 中会包含内存中的脏数据，导致结果巨大或不可控。');
  }
  if (hasBoundaryIssue) {
    details.push('循环或分支边界条件可能遗漏：注意闭区间要求包含端点，检查 `<` 与 `<=` 的使用。');
  }
  if (details.length === 0) {
    details.push('请检查核心计算逻辑与输入输出格式是否与题目要求完全一致。');
    details.push(`参考官方考点提示：${req.knowledgePoints.join('、')}`);
  }

  return {
    errorAnalysis: {
      summary: '代码逻辑与题目细节存在偏差，重点关注累加器初值与边界处理。',
      details,
    },
    heuristicHints: [
      `第 1 步（初值检查）：检查所有在循环中累加累乘的变量，确认它们在进入循环前是否显式赋值为 0 或 1。`,
      `第 2 步（边界排查）：检查题目的数据范围与边界值（例如刚好等于边界或极小值时），你的 if 或 for 条件是否覆盖了等于的情况？`,
      `第 3 步（格式核对）：输出时是否按照要求包含了空格或换行？严禁输出题干没有要求的中文提示符（如 \"ans=\" 等）。`,
    ],
    hackData: req.samples && req.samples.length > 0
      ? {
          input: req.samples[0].input,
          expectedOutput: req.samples[0].output,
          actualBehavior: '若初值或边界未处理妥当，在此样例下输出的结果将与预期不符。',
        }
      : {
          input: '1 5',
          expectedOutput: '9 6',
          actualBehavior: '计算值产生脏数据偏移或漏掉右端点。',
        },
    syllabusMapping: {
      level: `GESP C++ ${req.level}级`,
      points: req.knowledgePoints,
    },
    pitfallSummary: req.commonPitfalls.length > 0 ? req.commonPitfalls : [
      '所有累加变量必须显式初始化赋 0',
      '注意闭区间遍历需使用 <=',
      '严格按照格式输出，不要打印多余修饰文本',
    ],
    isFallbackMock: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DiagnoseRequest = await request.json();

    if (!body || !body.questionId) {
      return NextResponse.json({ error: '无效的请求参数' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com/v1';
    const model = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat';

    // 若未配置有效 API KEY，启用智能离线兜底诊断（保障自测与演示流程顺畅）
    if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
      console.warn('⚠️ 未检测到有效 DEEPSEEK_API_KEY，启用智能启发式兜底诊断');
      const fallback = generateFallbackDiagnosis(body);
      return NextResponse.json(fallback);
    }

    const systemPrompt = buildSystemPrompt(body);
    const userPrompt = buildUserPrompt(body);

    const apiEndpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API 调用失败:', response.status, errorText);
      // 优雅降级：API 报错时切换为兜底诊断，并在详情中注明
      const fallback = generateFallbackDiagnosis(body);
      fallback.errorAnalysis.details.push(`[提示: DeepSeek 服务端响应 ${response.status}，已自动启用智能兜底诊断]`);
      return NextResponse.json(fallback);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('DeepSeek 返回内容为空');
    }

    let parsed: DiagnoseResponse;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // 容错处理
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析 DeepSeek 返回的 JSON 数据');
      }
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '服务器内部错误';
    console.error('API /api/diagnose 处理异常:', err);
    return NextResponse.json(
      { error: '错题诊断服务暂时不可用，请稍后重试', details: errorMsg },
      { status: 500 }
    );
  }
}
