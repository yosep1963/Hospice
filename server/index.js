// server/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 업로드 디렉토리
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 간단한 JSON 파일 기반 메타데이터 저장
const DB_FILE = path.join(__dirname, 'data', 'documents.json');
const DATA_DIR = path.dirname(DB_FILE);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return [];
  }
}
function writeDB(docs) {
  fs.writeFileSync(DB_FILE, JSON.stringify(docs, null, 2));
}

// 업로드 설정
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const base = path.basename(file.originalname);
    cb(null, `${ts}__${base}`);
  }
});
const upload = multer({ storage });

function ok(data) {
  return { success: true, data };
}
function fail(error, code = 400) {
  return { success: false, error, code };
}

// 헬퍼: ID 생성
function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// [GET] 문서 목록
app.get('/api/documents', (_req, res) => {
  const docs = readDB();
  res.json(ok(docs));
});

// [GET] 검색: /api/documents/search?q=...
app.get('/api/documents/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  const docs = readDB();
  const result = q
    ? docs.filter(d => d.name.toLowerCase().includes(q))
    : docs;
  res.json(ok(result));
});

// [GET] 문서 메타: /api/documents/:id
app.get('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const docs = readDB();
  const doc = docs.find(d => d.id === id);
  if (!doc) return res.status(404).json(fail('Document not found', 404));
  res.json(ok(doc));
});

// [GET] 문서 원본 스트림: /api/documents/:id/content
app.get('/api/documents/:id/content', (req, res) => {
  const { id } = req.params;
  const docs = readDB();
  const doc = docs.find(d => d.id === id);
  if (!doc) return res.status(404).json(fail('Document not found', 404));
  const filePath = doc.path;
  if (!fs.existsSync(filePath)) return res.status(404).json(fail('File missing', 404));
  const mimeType = doc.type || mime.lookup(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  fs.createReadStream(filePath).pipe(res);
});

// [GET] 문서 다운로드: /api/documents/:id/download
app.get('/api/documents/:id/download', (req, res) => {
  const { id } = req.params;
  const docs = readDB();
  const doc = docs.find(d => d.id === id);
  if (!doc) return res.status(404).json(fail('Document not found', 404));
  const filePath = doc.path;
  if (!fs.existsSync(filePath)) return res.status(404).json(fail('File missing', 404));
  res.download(filePath, doc.name);
});

// [POST] 업로드: multipart/form-data, field name: "file"
app.post('/api/documents/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json(fail('No file uploaded'));
  const original = req.file.originalname;
  const storedPath = req.file.path;
  const size = req.file.size;
  const detected = mime.lookup(original) || 'application/octet-stream';

  const docs = readDB();
  const id = newId();
  const meta = {
    id,
    name: original,
    type: detected,
    size,
    createdAt: new Date().toISOString(),
    path: storedPath
  };
  docs.push(meta);
  writeDB(docs);
  res.json(ok(meta));
});

// [DELETE] 문서 삭제
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const docs = readDB();
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json(fail('Document not found', 404));
  const [removed] = docs.splice(idx, 1);
  writeDB(docs);
  try { if (fs.existsSync(removed.path)) fs.unlinkSync(removed.path); } catch {}
  res.json(ok({ id }));
});

// [POST] 간단 요약(데모): 현재는 미구현 → 501
app.post('/api/documents/:id/summarize', (req, res) => {
  res.status(501).json(fail('Summary generation not implemented', 501));
});

// Chat API (기존 채팅 API 유지)
app.post('/api/chat/send', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Mock response for now - integrate with actual AI service
    const response = {
      id: Date.now().toString(),
      content: `I understand you're asking about: "${message}". As a hospice care assistant, I'm here to provide compassionate support and information. How can I help you further?`,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || 'default'
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Chat message API (프론트엔드 호환성)
app.post('/api/chat/message', async (req, res) => {
  try {
    const { message, sessionId, history } = req.body;

    let content = "";
    let confidence = 0.95;

    // 메시지를 소문자로 변환하여 분석
    const normalizedMessage = message.toLowerCase().trim();

    // 질문 유형 분석 함수
    function analyzeQuestion(msg) {
      // 사전연명의료의향서 관련
      if (msg.includes('사전연명의료의향서') || msg.includes('의향서')) {
        if (msg.includes('본인') || msg.includes('대신') || msg.includes('가족') || msg.includes('누가') || msg.includes('누구')) {
          return 'advance_directive_who';
        } else if (msg.includes('장소') || msg.includes('어디')) {
          return 'advance_directive_where';
        } else if (msg.includes('작성') || msg.includes('방법') || msg.includes('어떻게') || msg.includes('절차')) {
          return 'advance_directive_how';
        }
        return 'advance_directive_general';
      }

      // 호스피스 관련
      if (msg.includes('호스피스') || msg.includes('완화의료') || msg.includes('말기')) {
        if (msg.includes('비용') || msg.includes('돈') || msg.includes('가격')) {
          return 'hospice_cost';
        } else if (msg.includes('자격') || msg.includes('조건') || msg.includes('대상')) {
          return 'hospice_eligibility';
        } else if (msg.includes('신청') || msg.includes('어떻게') || msg.includes('방법')) {
          return 'hospice_how';
        }
        return 'hospice_general';
      }

      // 통증 관리 관련
      if (msg.includes('통증') || msg.includes('아픔') || msg.includes('진통') || msg.includes('약')) {
        if (msg.includes('약') || msg.includes('진통제') || msg.includes('치료')) {
          return 'pain_medication';
        } else if (msg.includes('방법') || msg.includes('완화') || msg.includes('관리')) {
          return 'pain_management';
        }
        return 'pain_general';
      }

      // 가족 관련
      if (msg.includes('가족') || msg.includes('보호자') || msg.includes('돌봄')) {
        return 'family_support';
      }

      // 인사 관련
      if (msg.includes('안녕') || msg.includes('반가') || msg.includes('처음') || msg.includes('시작')) {
        return 'greeting';
      }

      // 일반 질문
      return 'general';
    }

    const questionType = analyzeQuestion(normalizedMessage);

    // 질문 유형별 맞춤 응답
    switch(questionType) {
      case 'advance_directive_how':
        content = `사전연명의료의향서 작성 방법을 안내드리겠습니다. 📝

**✅ 작성 절차:**
1️⃣ **본인 확인**: 신분증 지참 필수
2️⃣ **장소 선택**: 의료기관, 공증기관, 또는 온라인
3️⃣ **작성 완료**: 본인이 직접 작성 및 서명
4️⃣ **보관**: 의료기관에 제출하거나 개인 보관

**📋 필요 서류:**
• 신분증 (주민등록증, 운전면허증 등)
• 사전연명의료의향서 양식

**💡 중요 사항:**
• 반드시 본인만 작성 가능 (대리 작성 불가)
• 언제든 변경이나 철회 가능
• 의료진과 상담 후 작성하는 것을 권장

더 궁금한 점이 있으시면 언제든 문의해 주세요! 😊`;
        break;

      case 'advance_directive_who':
        content = `사전연명의료의향서 작성 주체에 대해 명확히 안내드리겠습니다. 👤

**💡 반드시 본인만 작성할 수 있습니다!**

📋 **작성 가능 조건:**
• 만 19세 이상
• 의사결정능력이 있는 본인
• 정신적 역량이 있는 상태

❌ **작성 불가능한 경우:**
• 가족이나 친척의 대리 작성
• 법정대리인의 대신 작성
• 의료진의 대신 작성

**🔄 변경 및 철회:**
• 본인 의사에 따라 언제든 변경 가능
• 구두나 서면으로 철회 가능

궁금한 점이 더 있으시면 언제든 말씀해 주세요! 😊`;
        break;

      case 'advance_directive_where':
        content = `사전연명의료의향서 작성 장소를 안내드리겠습니다. 📍

**✅ 작성 가능한 장소:**

1️⃣ **의료기관**
   • 종합병원, 병원, 의원
   • 보건소, 보건지소
   • 호스피스 전문기관

2️⃣ **공증기관**
   • 공증사무소
   • 공증인가 있는 법무사 사무소

3️⃣ **온라인**
   • 국가생명윤리정책원 웹사이트
   • 공인인증서를 통한 본인 확인

**💡 권장사항:**
의료진과 충분한 상담 후 작성하시는 것을 권장합니다.

더 구체적인 정보가 필요하시면 말씀해 주세요! 😊`;
        break;

      case 'advance_directive_general':
        content = `사전연명의료의향서에 대해 전반적으로 안내드리겠습니다. 📄

**📋 사전연명의료의향서란?**
환자가 의식이 없거나 의사결정능력을 상실했을 때를 대비하여
연명의료에 대한 본인의 의사를 미리 밝혀두는 문서입니다.

**🎯 주요 목적:**
• 본인의 의료 결정권 보장
• 가족의 심리적 부담 경감
• 의료진의 치료 방향 결정 도움

**📝 포함 내용:**
• 심폐소생술 여부
• 인공호흡기 사용 여부
• 혈액투석 여부
• 항암제 투여 여부

더 자세한 정보가 궁금하시면 언제든 문의해 주세요! 😊`;
        break;

      case 'hospice_general':
        content = `호스피스 케어에 대해 설명드리겠습니다. 🏥💙

🌟 **호스피스 케어란?**
생명을 위협하는 질병을 가진 환자와 가족에게 제공하는 전인적 돌봄 서비스입니다.

🎯 **주요 목표:**
• 통증과 증상 완화
• 환자와 가족의 삶의 질 향상
• 정신적, 영적 지지 제공
• 존엄한 생의 마무리 지원

💊 **제공 서비스:**
• 통증 및 증상 관리
• 간병 및 의료 서비스
• 심리·정서적 상담
• 영적 돌봄
• 가족 지지 서비스

더 구체적인 질문이 있으시면 언제든 말씀해 주세요! 😊`;
        break;

      case 'hospice_cost':
        content = `호스피스 케어 비용에 대해 안내드리겠습니다. 💰

**💡 건강보험 적용 혜택:**

✅ **보험 적용 대상:**
• 말기암 환자 (의사 진단서 필요)
• 후천성면역결핍증 말기 환자
• 만성 폐쇄성 호흡기질환 말기 환자
• 만성 간경화 말기 환자

💰 **본인부담금:**
• 입원: 1일 5만원 (상급병실료 별도)
• 가정 호스피스: 1일 약 6천원
• 자문 호스피스: 상담당 약 1만원

📋 **포함 서비스:**
• 의료진 진료 및 상담
• 간병 서비스
• 의료기기 대여
• 약물 및 의료재료

경제적 부담을 줄이고 양질의 돌봄을 받으실 수 있습니다! 😊`;
        break;

      case 'hospice_eligibility':
        content = `호스피스 케어 대상자 기준을 안내드리겠습니다. 📋

**✅ 호스피스 케어 대상:**

🩺 **의학적 기준:**
• 말기암 진단 (예상 여명 6개월 이하)
• 적극적 치료보다 완화케어가 적절한 상태
• 담당의의 호스피스 의뢰

👥 **환자 상태:**
• 환자 본인 또는 가족의 동의
• 입원, 가정, 자문 호스피스 선택 가능
• 의식 상태와 관계없이 이용 가능

📝 **신청 절차:**
1️⃣ 담당의와 상담
2️⃣ 호스피스 전문기관 연계
3️⃣ 호스피스팀 평가
4️⃣ 케어 계획 수립

**💡 중요사항:**
호스피스 케어는 치료를 포기하는 것이 아니라,
환자와 가족의 삶의 질을 높이는 적극적인 돌봄입니다.

더 자세한 상담이 필요하시면 말씀해 주세요! 😊`;
        break;

      case 'hospice_how':
        content = `호스피스 케어 신청 방법을 안내드리겠습니다. 📝

**📋 신청 절차:**

1️⃣ **담당의 상담**
   • 현재 치료 중인 의료진과 상의
   • 호스피스 케어 필요성 논의
   • 의뢰서 작성 요청

2️⃣ **호스피스 기관 선택**
   • 입원 호스피스: 전문 병동
   • 가정 호스피스: 집에서 받는 케어
   • 자문 호스피스: 기존 병원에서 상담

3️⃣ **평가 및 상담**
   • 호스피스팀의 종합 평가
   • 환자·가족과 케어 계획 수립
   • 서비스 범위 및 일정 조율

4️⃣ **서비스 시작**
   • 24시간 응급 연락체계 구축
   • 정기적인 방문 및 관리
   • 필요시 입원 치료 연계

**📞 문의처:**
• 국립암센터 호스피스센터: 1577-8899
• 지역 보건소 또는 의료기관

언제든 도움이 필요하시면 연락주세요! 😊`;
        break;

      case 'pain_general':
        content = `호스피스 통증 관리에 대해 안내드리겠습니다. 💊

🎯 **통증 관리의 중요성:**
• 환자의 삶의 질 향상
• 일상 활동 능력 유지
• 정신적 안정감 제공
• 가족의 심리적 부담 경감

🔍 **통증 평가:**
• 0-10점 척도로 강도 측정
• 통증의 위치, 양상, 지속시간 파악
• 일상생활에 미치는 영향 평가

💡 **관리 원칙:**
• 환자 중심의 개별화된 접근
• 예방적 통증 관리
• 다학제팀 협력
• 지속적인 모니터링

통증은 충분히 조절 가능합니다. 주저하지 마시고 의료진에게 알려주세요! 🤗`;
        break;

      case 'pain_medication':
        content = `호스피스 통증 약물 치료에 대해 안내드리겠습니다. 💊

**💊 주요 진통제 종류:**

1️⃣ **비마약성 진통제**
   • 아세트아미노펜, 이부프로펜
   • 경미한-중등도 통증에 사용
   • 부작용이 적음

2️⃣ **마약성 진통제**
   • 모르핀, 펜타닐, 옥시코돈
   • 중등도-심한 통증에 효과적
   • 의료진 처방으로만 사용

3️⃣ **보조 진통제**
   • 항우울제, 항경련제
   • 신경병증성 통증에 효과적
   • 진통제와 병용 사용

**⚠️ 중요 사항:**
• 정해진 시간에 규칙적으로 복용
• 통증이 심해지기 전에 미리 복용
• 부작용 발생시 즉시 의료진에게 알림
• 임의로 중단하거나 용량 조절 금지

안전하고 효과적인 통증 관리가 가능합니다! 😊`;
        break;

      case 'pain_management':
        content = `포괄적인 통증 관리 방법을 안내드리겠습니다. 🌟

**🎯 다차원적 통증 관리:**

1️⃣ **약물 치료**
   • 정시 복용하는 기본 진통제
   • 돌발성 통증용 즉효성 진통제
   • 부작용 예방 약물

2️⃣ **비약물적 방법**
   • 온찜질, 냉찜질
   • 가벼운 마사지
   • 심호흡, 이완 요법
   • 음악 요법, 명상

3️⃣ **심리사회적 지지**
   • 환자 및 가족 상담
   • 스트레스 관리
   • 사회적 지지체계 구축

4️⃣ **환경 조성**
   • 편안한 자세 유지
   • 적절한 실내 온도
   • 조용하고 평온한 분위기

**💡 가족이 도울 수 있는 방법:**
• 환자의 통증 호소를 진지하게 듣기
• 규칙적인 약물 복용 도움
• 편안한 환경 조성
• 정서적 지지 제공

함께하면 통증을 잘 관리할 수 있습니다! 💪`;
        break;

      case 'family_support':
        content = `가족과 보호자를 위한 지원 안내를 드리겠습니다. 👨‍👩‍👧‍👦💙

🤗 **가족 지원 서비스:**
• 가족 상담 및 교육
• 돌봄 방법 교육
• 정서적 지지 및 상담
• 사별 후 상담 서비스

💡 **돌봄 가이드:**

1️⃣ **환자와의 소통**
   • 따뜻한 말과 스킨십
   • 경청하고 공감하기
   • 일상 대화 나누기
   • 함께 시간 보내기

2️⃣ **가족의 자기 돌봄**
   • 충분한 휴식 취하기
   • 다른 가족들과 돌봄 분담
   • 전문가 도움 요청하기
   • 본인의 감정 돌보기

3️⃣ **의미 있는 시간 만들기**
   • 사진이나 영상 촬영
   • 함께 좋아하는 음악 듣기
   • 의미 있는 대화나 편지
   • 소중한 추억 나누기

**🌟 중요한 메시지:**
가족 여러분도 소중합니다. 힘든 시간이지만 함께 이겨내실 수 있어요!

필요하시면 언제든 도움을 요청해 주세요! 💪`;
        break;

      case 'greeting':
        content = `안녕하세요! 반갑습니다! 👋😊

저는 호스피스 케어 전문 AI 어시스턴트입니다. 다음과 같은 도움을 드릴 수 있어요:

🏥 **전문 상담 영역:**
• 호스피스 케어 전반적인 정보
• 사전연명의료의향서 관련 상담
• 통증 관리 방법 안내
• 정서적 지원 및 위로
• 의료진과의 소통 방법

📄 **추가 기능:**
• 관련 문서 업로드 및 관리
• 중요 정보 검색
• 24시간 언제든 상담 가능

어떤 것이 궁금하신가요? 편안하게 말씀해 주세요! 💙`;
        break;

      case 'general':
        content = `"${message}"에 대해 답변드리겠습니다. 💙

호스피스 케어 어시스턴트로서 도움을 드리고 싶습니다.

더 구체적으로 어떤 부분이 궁금하신지 말씀해 주시면,
더 정확하고 도움이 되는 정보를 안내해드릴 수 있어요!

예를 들어:
• 호스피스 케어 관련 궁금한 점
• 통증 관리 방법
• 사전연명의료의향서
• 가족 지원 서비스
• 기타 관련 질문

편안하게 질문해 주세요! 😊`;
        break;

      default:
        content = `죄송합니다. 질문을 정확히 이해하지 못했습니다. 😅

다시 한 번 명확하게 질문해 주시면 더 정확한 답변을 드릴 수 있습니다.

💡 **이런 주제로 도움드릴 수 있어요:**
• 호스피스 케어 정보
• 사전연명의료의향서
• 통증 관리
• 가족 지원
• 기타 호스피스 관련 질문

언제든 편하게 말씀해 주세요! 😊`;
        confidence = 0.7;
        break;
    }

    const response = {
      message: content,
      confidence: confidence,
      sources: [],
      timestamp: new Date().toISOString(),
      sessionId: sessionId || 'default'
    };

    // Simulate realistic processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 800));

    res.json(response);
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      message: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      confidence: 0,
      sources: [],
      error: 'Failed to process message'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5176;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});