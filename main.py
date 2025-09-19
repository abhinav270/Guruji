"""
Refactored main FastAPI application for the MCP server.

This version uses the `mcp` SDK, re-introduces session management,
and restores all originally requested endpoints.
"""
import re
import uuid
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

import re
import uuid
import time
import logging
import os
import shutil
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from mcp.server.fastmcp import FastMCP
import chromadb
import faiss
import docling
from sentence_transformers import SentenceTransformer

from models import (
    Message, ToolCall, NewSessionResponse, ChatRequest, ChatResponse,
    HistoryResponse, AgentsListResponse, ToolsListResponse, ToolDetail,
    KnowledgeBase, KnowledgeBaseRequest, KnowledgeBaseListResponse
)
from tools import add_tools
from agents import select_agent, get_agents_list, AgentDetail

# --- Application Setup ---

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Constants and Global Variables ---
UPLOAD_DIRECTORY = "./uploaded_files"
VECTORSTORE_DIRECTORY = "./vector_stores"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(VECTORSTORE_DIRECTORY, exist_ok=True)

# In-memory storage for KBs and session
KNOWLEDGE_BASES: Dict[str, KnowledgeBase] = {}
SELECTED_KB_ID: Optional[str] = None
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')


# 1. Create the MCP Server instance and add tools
mcp_server = FastMCP(
    name="AdvancedChatServer",
    instructions="A server with tools for calculation, web search, and getting the current time.",
)
add_tools(mcp_server)

# 2. Create the FastAPI application
app = FastAPI(
    title="Advanced MCP Server with Custom Endpoints",
    description="An MCP server mounted within a FastAPI app, with custom session and agent logic.",
    version="3.0.0",
)

# 3. Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Mcp-Session-Id"],
)

# 4. Mount the MCP server's ASGI app
# A compliant MCP client would connect to this endpoint (e.g., http://localhost:8000/mcp)
app.mount("/mcp", mcp_server.streamable_http_app())

# --- In-Memory Session Storage ---

SESSIONS: Dict[str, List[Message]] = {}
SESSION_METADATA: Dict[str, datetime] = {}
SESSION_EXPIRATION = timedelta(hours=1)

def get_session_history(session_id: str) -> List[Message]:
    """Retrieves a session history or raises HTTPException if not found or expired."""
    if session_id not in SESSIONS or session_id not in SESSION_METADATA:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    last_accessed = SESSION_METADATA[session_id]
    if datetime.utcnow() - last_accessed > SESSION_EXPIRATION:
        del SESSIONS[session_id]
        del SESSION_METADATA[session_id]
        raise HTTPException(status_code=404, detail="Session has expired.")

    SESSION_METADATA[session_id] = datetime.utcnow()
    return SESSIONS[session_id]

# --- Mock Agent and Tool-Calling Logic ---

def run_agent_logic(agent: AgentDetail, message: str) -> Tuple[str, List[ToolCall]]:
    """
    Simulates the agent's logic to generate a reply and decide on tool calls.
    """
    tool_calls = []

    # A map to connect agent names to their primary tool
    agent_tool_map = {
        "MathWhiz": "calculator",
        "WebResearcher": "web_search",
        "Generalist": "current_time",
    }

    if agent.name == "MathWhiz":
        match = re.search(r'(\d+\.?\d*)\s*([\+\-\*\/])\s*(\d+\.?\d*)', message)
        if match:
            a, op_symbol, b = match.groups()
            op_map = {"+": "add", "-": "subtract", "*": "multiply", "/": "divide"}
            op = op_map.get(op_symbol)
            if op:
                tool_name = "calculator"
                args = {"a": float(a), "b": float(b), "op": op}
                result = mcp_server.tools[tool_name].wrapped(**args)
                tool_calls.append(ToolCall(tool=tool_name, args=args, result=result))
                return f"I've calculated that for you. {result}", tool_calls
        return "I can help with math. Please provide a simple expression like '123 + 456'.", []

    elif agent.name == "WebResearcher":
        tool_name = "web_search"
        args = {"query": message}
        result = mcp_server.tools[tool_name].wrapped(**args)
        tool_calls.append(ToolCall(tool=tool_name, args=args, result=result))
        return f"Based on my web search: {result}", tool_calls

    elif agent.name == "Generalist":
        if "time" in message.lower():
            tool_name = "current_time"
            args = {}
            result = mcp_server.tools[tool_name].wrapped(**args)
            tool_calls.append(ToolCall(tool=tool_name, args=args, result=result))
            return f"You asked about the time. {result}", tool_calls

        return f"As the Generalist, I can tell you: '{message}' is an interesting topic!", []

    return "I'm not sure how to respond to that.", []


# --- Custom FastAPI Endpoints ---

@app.post("/new-session", response_model=NewSessionResponse, tags=["Session Management"])
async def new_session():
    """Creates a new chat session."""
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = []
    SESSION_METADATA[session_id] = datetime.utcnow()
    logger.info(f"New session created: {session_id}")
    return NewSessionResponse(session_id=session_id, created_at=SESSION_METADATA[session_id])

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """Handles a user message and returns an agent's reply."""
    history = get_session_history(request.session_id)

    # 1. Add user message to history
    user_message = Message(role="user", content=request.message)
    history.append(user_message)

    # 2. Select agent and run logic
    agent = select_agent(request.message, request.agent)
    reply_content, tool_calls = run_agent_logic(agent, request.message)

    # 3. Add assistant reply to history
    assistant_message = Message(
        role="assistant",
        content=reply_content,
        agent_used=agent.name,
        tool_calls=tool_calls,
    )
    history.append(assistant_message)

    logger.info(f"Session {request.session_id}: Agent '{agent.name}' replied.")

    return ChatResponse(
        reply=reply_content,
        agent_used=agent.name,
        tool_calls=tool_calls,
        timestamp=assistant_message.timestamp
    )

@app.get("/history/{session_id}", response_model=HistoryResponse, tags=["Session Management"])
async def get_history(session_id: str):
    """Retrieves the full chat history for a session."""
    history = get_session_history(session_id)
    return HistoryResponse(session_id=session_id, history=history)

@app.get("/agents", response_model=AgentsListResponse, tags=["Discovery"])
async def list_agents():
    """Lists all available agents."""
    return AgentsListResponse(agents=get_agents_list())

@app.get("/tools", response_model=ToolsListResponse, tags=["Discovery"])
async def list_tools():
    """Lists all available tools and their schemas."""
    tools_list = []
    for tool in mcp_server.tools.values():
        tools_list.append(
            ToolDetail(
                tool_name=tool.name,
                description=tool.description or "",
                schema=tool.input_schema,
            )
        )
    return ToolsListResponse(tools=tools_list)

# --- Knowledge Base Helper Functions ---
def process_and_embed_files(file_paths: List[str], vector_store_type: str, kb_id: str):
    """Processes files and embeds them into the specified vector store."""
    texts = []
    for file_path in file_paths:
        try:
            if file_path.lower().endswith('.pdf'):
                # Use docling to convert PDF to markdown
                markdown_content = docling.word.convert_to_markdown(file_path)
                texts.append(markdown_content)
            else:
                # Handle other files as plain text
                with open(file_path, 'r', encoding='utf-8') as f:
                    texts.append(f.read())
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            continue

    if not texts:
        logger.warning("No text could be extracted from the provided files.")
        return

    logger.info(f"Generating embeddings for {len(texts)} documents.")
    embeddings = embedding_model.encode(texts, convert_to_tensor=False)

    if vector_store_type == "Chroma":
        chroma_client = chromadb.PersistentClient(path=os.path.join(VECTORSTORE_DIRECTORY, kb_id))
        collection = chroma_client.get_or_create_collection(name=f"kb_{kb_id}")
        doc_ids = [str(uuid.uuid4()) for _ in texts]
        collection.add(embeddings=embeddings, documents=texts, ids=doc_ids)
        logger.info(f"Added {len(texts)} documents to Chroma collection for KB {kb_id}.")

    elif vector_store_type == "FAISS":
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings)
        faiss.write_index(index, os.path.join(VECTORSTORE_DIRECTORY, f"{kb_id}.faiss"))
        # Also save the texts for FAISS, as it only stores vectors
        with open(os.path.join(VECTORSTORE_DIRECTORY, f"{kb_id}_texts.json"), "w") as f:
            import json
            json.dump(texts, f)
        logger.info(f"Created FAISS index for KB {kb_id} with {len(texts)} documents.")


# --- Knowledge Base Endpoints ---

@app.post("/kb/create", tags=["Knowledge Base"])
async def create_knowledge_base(
    kb_name: str = Form(...),
    vector_store: str = Form(...),
    parsing_library: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """Creates a new Knowledge Base, processes files, and creates a vector store."""
    kb_id = str(uuid.uuid4())
    file_paths = []
    file_names = []

    for file in files:
        file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        file_paths.append(file_location)
        file_names.append(file.filename)

    # For now, allowed_file_types and parsing_library are received but not strictly used
    # The logic can be extended to use them for validation or strategy selection

    process_and_embed_files(file_paths, vector_store, kb_id)

    new_kb = KnowledgeBase(
        id=kb_id,
        name=kb_name,
        vector_store=vector_store,
        file_names=file_names,
    )
    KNOWLEDGE_BASES[kb_id] = new_kb

    logger.info(f"New Knowledge Base created: {kb_name} (ID: {kb_id})")
    return {"message": "Knowledge Base created successfully", "kb_id": kb_id, "data": new_kb.dict()}

@app.get("/kb/list", response_model=KnowledgeBaseListResponse, tags=["Knowledge Base"])
async def list_knowledge_bases():
    """Lists all available Knowledge Bases."""
    return KnowledgeBaseListResponse(knowledge_bases=list(KNOWLEDGE_BASES.values()))

@app.post("/kb/select", tags=["Knowledge Base"])
async def select_knowledge_base(kb_id: str):
    """Selects a Knowledge Base to be used in the RAG model."""
    global SELECTED_KB_ID
    if kb_id not in KNOWLEDGE_BASES:
        raise HTTPException(status_code=404, detail="Knowledge Base not found.")

    SELECTED_KB_ID = kb_id
    logger.info(f"Knowledge Base selected for RAG: {KNOWLEDGE_BASES[kb_id].name} (ID: {kb_id})")
    return {"message": f"Knowledge Base '{KNOWLEDGE_BASES[kb_id].name}' selected."}
