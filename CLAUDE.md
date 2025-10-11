# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a RAG (Retrieval-Augmented Generation) chatbot for hospice and end-of-life care information. It provides answers based exclusively on documents in the `data/` directory, using local LLM inference via Ollama with GPU acceleration.

**Key Characteristics:**
- Korean-language medical information chatbot
- Fully offline operation (no external API calls)
- Document-grounded responses only (no hallucination)
- Optimized for RTX 3090 Ti (24GB VRAM)
- CUDA-accelerated embeddings

## Development Commands

### Environment Setup
```bash
# Activate virtual environment (REQUIRED before any Python commands)
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Install Ollama model (external dependency)
ollama pull qwen2.5:14b
```

### Running the Application
```bash
# Web interface (recommended)
python app.py
# Access at: http://localhost:7860 (NOT 0.0.0.0:7860!)

# Terminal interface
cd src
python chatbot.py

# Quick start scripts (Windows)
START.bat      # Main startup script (RECOMMENDED)

# Linux/Mac
./run.sh
```

### Development Tasks
```bash
# Initialize/rebuild vector database
python init_vectordb.py

# Performance testing
python performance_test.py

# Test individual modules
python src/document_loader.py
python src/embeddings.py
python src/rag_pipeline.py
```

## Architecture

### RAG Pipeline Flow
1. **Document Loading** (`document_loader.py`): Loads .md/.txt files from `data/`, splits into 1000-char chunks with 200-char overlap
2. **Embedding** (`embeddings.py`): Uses BGE-M3 model to vectorize chunks, stores in ChromaDB
3. **Retrieval** (`rag_pipeline.py`): Searches top-k similar chunks for user query
4. **Generation** (`rag_pipeline.py`): Ollama LLM generates answer from retrieved context only
5. **Response** (`chatbot.py`): Returns answer with source document citations

### Key Components

**HospiceChatbot** (`src/chatbot.py`)
- Main orchestrator class
- Manages initialization, vector store, and chat history
- Entry point: `initialize()` then `chat(message)`

**RAGPipeline** (`src/rag_pipeline.py`)
- Handles retrieval + generation
- Custom prompt template ensures document-grounded responses
- Key method: `query_with_sources(question)` returns answer + citations

**EmbeddingManager** (`src/embeddings.py`)
- Manages BGE-M3 embedding model (GPU-accelerated)
- Creates/loads ChromaDB vector store
- Auto-detects CUDA availability

**DocumentLoader** (`src/document_loader.py`)
- Loads markdown and text files from `data/`
- Chunks using RecursiveCharacterTextSplitter
- Preserves source metadata for citations

### Configuration System

All settings are centralized in `config.yaml`:
- LLM model selection and parameters
- RAG settings (top_k, chunk_size)
- Embedding device (auto/cuda/cpu)
- Web UI settings
- Logging configuration

Loaded via `config_loader.py` which returns a nested config object.

### External Dependencies

**Ollama** (REQUIRED): Local LLM server must be running
- Default URL: `http://localhost:11434`
- Model must be pre-downloaded: `ollama pull qwen2.5:14b`
- If Ollama is not running, all inference will fail

**CUDA** (OPTIONAL): GPU acceleration for embeddings
- Requires PyTorch with CUDA support
- Falls back to CPU if unavailable
- Check: `python -c "import torch; print(torch.cuda.is_available())"`

### File Structure Notes

- `data/`: Source documents (7 files: 4 .md, 3 .txt) - hospice care information
- `vector_db/`: ChromaDB persistence (auto-created, can be deleted to rebuild)
- `logs/`: Application logs (auto-created)
- `src/`: Core modules (all Python 3.9+ compatible)
- `app.py`: Gradio web interface (runs on port 7860 by default)

## Important Implementation Details

### Prompt Engineering
The system prompt in `rag_pipeline.py:_create_prompt_template()` is critical:
- Enforces document-only responses
- Prevents hallucination
- Instructs LLM to state when info is not in documents
- Modifying this affects answer quality significantly

### Vector Store Behavior
- Vector DB is persistent (saved to disk)
- If `vector_db/` exists, it's loaded (fast startup)
- If missing or empty, rebuilt from `data/` (slow startup, 5-10 min)
- To force rebuild: delete `vector_db/` directory
- ChromaDB collection name: "hospice_docs"

### GPU Memory Management
- Embeddings run on GPU if available (~0-2GB VRAM)
- LLM inference runs via Ollama (separate process, ~16-18GB VRAM for 14B model)
- Total system uses ~18-20GB VRAM on RTX 3090 Ti
- For smaller GPUs: use qwen2.5:7b or qwen2.5:3b

### Adding/Modifying Documents
1. Add/modify .md or .txt files in `data/`
2. Delete `vector_db/` directory
3. Restart app (will auto-rebuild vector DB)
4. Do NOT modify files while app is running

## Testing and Debugging

### Common Test Queries
- "연명의료란 무엇인가요?" (What is life-sustaining treatment?)
- "임종과정에 있는 환자의 정의는?" (Definition of terminal patient?)
- "사전연명의료의향서는 어떻게 작성하나요?" (How to write advance directive?)

### Debugging Tips
- Enable DEBUG logging in `config.yaml` for verbose output
- Check `logs/` directory for detailed error traces
- Verify Ollama status: `ollama list`
- Test vector search: use `init_vectordb.py` which includes search test
- GPU issues: Check CUDA with `nvidia-smi` and PyTorch CUDA availability

### Common Runtime Issues
1. **"Cannot connect to site" in browser**
   - Ensure app is running (black window open)
   - Use `http://localhost:7860`, NOT `http://0.0.0.0:7860`
   - Wait for "Running on local URL" message before connecting

2. **Batch file closes immediately**
   - Korean encoding issues in echo statements
   - Use START.bat (only reliable batch file)
   - Or run directly: `venv\Scripts\python.exe app.py`

3. **ChromaDB telemetry errors** (can be ignored)
   - "Failed to send telemetry event" warnings are harmless
   - Do not affect functionality

### Performance Expectations
- Initial load: ~18 seconds (vector DB load)
- Query response: ~8 seconds average (GPU)
- Vector search: 36-336ms
- Slower on CPU (2-3x longer response time)

## Windows-Specific Notes

This project is developed primarily on Windows. Key considerations:
- Use backslashes in paths or raw strings for Windows compatibility
- Batch scripts (.bat) are provided for quick execution
- Virtual environment activation: `venv\Scripts\activate`
- Directory listing: use `dir` command or Python's `os` module
- Port 7860 must be available for Gradio web UI

### Batch File Encoding Issues
- **Problem**: Korean characters in batch files cause encoding errors
- **Solution**: Use START.bat (simple, English-only messages)
- **Best Practice**: Avoid Korean text in echo commands in .bat files; use English or minimal output
- **Project Status**: All redundant batch files have been removed; only START.bat and setup.bat remain

### Web Server Connection
- **Important**: Gradio binds to `127.0.0.1:7860` (localhost only)
- **Access URL**: `http://localhost:7860` or `http://127.0.0.1:7860`
- **DO NOT use**: `http://0.0.0.0:7860` (this is the bind address, not accessible in browser)
- **Configuration**: Set in `config.yaml` → `web.server_name: "127.0.0.1"`

## Project Organization

This codebase has been cleaned and organized:
- **2 batch files** (START.bat, setup.bat) - down from 7
- **3 text docs** (requirements.txt, HOW_TO_RUN.txt, PROJECT_STRUCTURE.txt) - down from 9
- **3 markdown docs** (README.md, CLAUDE.md, setup_guide.md) - down from 7
- All redundant files removed (65% reduction)
- Clear separation: user files (START.bat, HOW_TO_RUN.txt) vs developer files (this CLAUDE.md, src/)

**Key Documentation:**
- **HOW_TO_RUN.txt** - Start here for quick setup and execution
- **PROJECT_STRUCTURE.txt** - Visual overview of all files and their purposes
- **README.md** - Complete project documentation (Korean)
- **setup_guide.md** - Detailed installation guide (Korean)
- **CLAUDE.md** - This file (technical architecture for developers)
