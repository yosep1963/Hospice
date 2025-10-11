"""
Gradio 웹 인터페이스
호스피스 챗봇을 위한 사용자 친화적인 웹 UI를 제공합니다.
"""

import gradio as gr
import sys
import os

# src 디렉토리를 Python 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from chatbot import HospiceChatbot
from config_loader import load_config


# 전역 변수
chatbot = None
config = None


def initialize_chatbot():
    """챗봇을 초기화합니다."""
    global chatbot, config

    if chatbot is None:
        # 설정 파일 로드
        config = load_config()
        print(f"[OK] 설정 파일 로드 완료")
        print(f"[OK] 모델: {config.llm.model_name}")
        print(f"[OK] 디바이스: {config.embeddings.device}")

        chatbot = HospiceChatbot(
            data_dir=config.data.data_dir,
            vector_db_dir=config.data.vector_db_dir,
            model_name=config.llm.model_name,
            log_level=config.logging.level
        )

        success = chatbot.initialize()
        if not success:
            raise RuntimeError("챗봇 초기화 실패")

    return chatbot


def chat_response(message, history):
    """
    Gradio 채팅 인터페이스용 응답 함수

    Args:
        message: 사용자 메시지
        history: 대화 히스토리

    Returns:
        업데이트된 대화 히스토리
    """
    global chatbot

    if chatbot is None:
        initialize_chatbot()

    try:
        response = chatbot.chat(message)
        # Gradio Chatbot 형식: [[user_msg, bot_msg], ...]
        history = history or []
        history.append([message, response])
        return history
    except Exception as e:
        history = history or []
        history.append([message, f"오류가 발생했습니다: {str(e)}"])
        return history


def create_interface():
    """Gradio 인터페이스를 생성합니다."""

    # 커스텀 CSS
    custom_css = """
    .container {
        max-width: 900px;
        margin: auto;
    }
    .header {
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    """

    # Gradio 인터페이스 구성
    with gr.Blocks(css=custom_css, theme=gr.themes.Soft()) as demo:
        gr.HTML("""
            <div class="header">
                <h1>🏥 호스피스 상담 챗봇</h1>
                <p>호스피스 및 연명의료결정제도에 대해 궁금한 점을 물어보세요</p>
            </div>
        """)

        with gr.Row():
            with gr.Column(scale=1):
                gr.Markdown("""
                ### 📋 사용 안내

                - 호스피스 완화의료에 대한 질문
                - 연명의료결정제도 관련 질문
                - 사전연명의료의향서 작성 방법
                - 임종과정 판단 기준
                - 연명의료계획서 관련 절차

                **참고**: 이 챗봇은 제공된 문서의 내용만을 기반으로 답변합니다.
                """)

        with gr.Row():
            # 설정 파일에서 높이 가져오기
            height = config.web.chatbot_height if config else 500
            chatbot_interface = gr.Chatbot(
                height=height,
                label="대화",
                show_label=False
            )

        with gr.Row():
            with gr.Column(scale=8):
                msg = gr.Textbox(
                    label="질문을 입력하세요",
                    placeholder="예: 연명의료란 무엇인가요?",
                    show_label=False
                )
            with gr.Column(scale=1):
                submit_btn = gr.Button("전송", variant="primary")

        with gr.Row():
            clear_btn = gr.Button("대화 초기화")

        # 예시 질문
        gr.Examples(
            examples=[
                "연명의료란 무엇인가요?",
                "임종과정에 있는 환자의 정의는 무엇인가요?",
                "사전연명의료의향서는 어떻게 작성하나요?",
                "연명의료계획서는 누가 작성할 수 있나요?",
                "DNR의 효력은 어떻게 되나요?"
            ],
            inputs=msg
        )

        # 이벤트 핸들러
        msg.submit(chat_response, [msg, chatbot_interface], [chatbot_interface])
        submit_btn.click(chat_response, [msg, chatbot_interface], [chatbot_interface])
        clear_btn.click(lambda: None, None, chatbot_interface, queue=False)

        gr.Markdown("""
        ---
        ### ⚠️ 주의사항
        - 이 챗봇은 교육 및 참고 목적으로만 사용하세요
        - 실제 의료 결정은 반드시 의료진과 상담하세요
        - 법적 자문이 필요한 경우 전문가와 상담하세요
        """)

    return demo


def main():
    """메인 함수"""
    global config

    print("챗봇을 초기화하는 중...")
    initialize_chatbot()
    print("웹 인터페이스를 시작합니다...")

    demo = create_interface()
    demo.launch(
        server_name=config.web.server_name,
        server_port=config.web.server_port,
        share=config.web.share
    )

    print("\n" + "="*60)
    print("웹 브라우저에서 다음 주소를 열어주세요:")
    print(f"  http://localhost:{config.web.server_port}")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
