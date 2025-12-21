# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RAG (Retrieval-Augmented Generation) chatbot for Korean hospice and end-of-life care information. Provides document-grounded responses only using local LLM inference via Ollama with GPU acceleration.

## Development Commands

```bash
# Activate venv (REQUIRED before any Python commands)
venv\Scripts\activate  # Windows

# Run web interface
python app.py
# Access at: http://localhost:7860

# Quick start (Windows)
START.bat

# Rebuild vector database
python init_vectordb.py

# Test individual modules
python src/document_loader.py
python src/embeddings.py
python src/rag_pipeline.py

# Performance testing
python performance_test.py
```

## Architecture

### RAG Pipeline Flow
```
data/*.md,*.txt → DocumentLoader → EmbeddingManager → ChromaDB
                                                          ↓
User Query → RAGPipeline.query_stream() ← similarity/MMR search
                    ↓
              Ollama LLM → Streaming Response + Sources
```

### Core Modules (`src/`)

| Module | Class | Purpose |
|--------|-------|---------|
| `chatbot.py` | `HospiceChatbot` | Main orchestrator. Entry: `initialize()` → `chat_stream(message)` |
| `rag_pipeline.py` | `RAGPipeline` | Retrieval + generation. Key: `query_stream()`, `query_with_sources()` |
| `embeddings.py` | `EmbeddingManager` | BGE-M3 embeddings, ChromaDB storage |
| `document_loader.py` | `DocumentLoader` | Markdown header-based semantic chunking |
| `config_loader.py` | `ConfigLoader` | YAML config → nested dataclass objects |
| `constants.py` | - | Shared constants: `COLLECTION_NAME`, `DEFAULT_*`, `SOURCES_*` |

### Key Design Patterns

**Streaming Response**: `RAGPipeline.query_stream()` yields partial responses for real-time UI updates via Gradio.

**Query Caching**: LRU cache in `RAGPipeline` with MD5 keys. Controlled by `config.performance.enable_cache`.

**MMR Retrieval**: Maximal Marginal Relevance for diverse document retrieval. Set `config.rag.search_type: "mmr"`.

**History-Aware Queries**: `_enhance_question_with_history()` prepends recent conversation context to improve retrieval.

### Configuration (`config.yaml`)

```yaml
llm:
  model_name: "qwen2.5:14b"
  temperature: 0.3
rag:
  top_k: 3
  search_type: "mmr"      # "similarity" or "mmr"
  mmr_lambda: 0.5
performance:
  enable_cache: true
```

### External Dependencies

**Ollama** (REQUIRED): Must be running at `http://localhost:11434`
```bash
ollama pull qwen2.5:14b
ollama list  # Verify
```

**CUDA** (OPTIONAL): Falls back to CPU
```python
import torch; print(torch.cuda.is_available())
```

## Important Implementation Details

### Prompt Template
`rag_pipeline.py:_create_prompt_template()` enforces document-only responses. Modifying this significantly affects answer quality.

### Vector Store
- Persistent at `vector_db/` (delete to rebuild)
- Collection name defined in `constants.COLLECTION_NAME`
- Rebuild: delete directory, restart app (5-10 min)

### Helper Methods (Refactored)
Common logic extracted to reduce duplication:
- `_enhance_question_with_history()` - history-based query expansion
- `_format_context()` - document list → context string
- `_format_sources()` - document list → citation string
- `_create_chunk()`, `_split_text_to_chunks()` - chunk creation

## Windows-Specific Notes

- Use `START.bat` for reliable execution (avoids Korean encoding issues in batch files)
- Access `http://localhost:7860`, NOT `http://0.0.0.0:7860`
- Run directly if batch fails: `venv\Scripts\python.exe app.py`

## Debugging

- Set `logging.level: "DEBUG"` in config.yaml
- Check `logs/` directory
- ChromaDB telemetry warnings are harmless
